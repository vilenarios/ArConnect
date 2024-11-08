import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren
} from "react";
import {
  AUTH_POPUP_CLOSING_DELAY_MS,
  AUTH_POPUP_REQUEST_WAIT_MS,
  DEFAULT_UNLOCK_AUTH_REQUEST_ID
} from "~utils/auth/auth.constants";
import type {
  AuthRequest,
  SignAuthRequest,
  SignKeystoneAuthRequest
} from "~utils/auth/auth.types";
import { replyToAuthRequest } from "~utils/auth/auth.utils";
import type { Chunk } from "~api/modules/sign/chunks";
import { defaultGateway } from "~gateways/gateway";
import Arweave from "arweave";
import {
  bytesFromChunks,
  constructTransaction,
  type SplitTransaction
} from "~api/modules/sign/transaction_builder";
import { isomorphicOnMessage } from "~utils/messaging/messaging.utils";

interface AuthRequestContextState {
  authRequests: AuthRequest[];
  currentAuthRequestIndex: number;
}

interface AuthRequestContextData extends AuthRequestContextState {
  setCurrentAuthRequestIndex: (currentAuthRequestIndex: number) => void;
  completeAuthRequest: (authID: string, accepted: boolean) => void;
}

export const AuthRequestsContext = createContext<AuthRequestContextData>({
  authRequests: [],
  currentAuthRequestIndex: 0,
  setCurrentAuthRequestIndex: () => {},
  completeAuthRequest: () => {}
});

export function AuthRequestsProvider({ children }: PropsWithChildren) {
  const [
    { authRequests, currentAuthRequestIndex },
    setAuthRequestContextState
  ] = useState<AuthRequestContextState>({
    authRequests: [],
    currentAuthRequestIndex: 0
  });

  const setCurrentAuthRequestIndex = useCallback(
    (currentAuthRequestIndex: number) => {
      setAuthRequestContextState((prevAuthRequestContextState) => {
        return {
          ...prevAuthRequestContextState,
          currentAuthRequestIndex
        };
      });
    },
    []
  );

  const completeAuthRequest = useCallback(
    (authID: string, accepted: boolean) => {
      console.log(`completeAuthRequest(${authID}, ${accepted})`);

      // If this is an Unlock request, we don't update anything here as those are not enqueued and it's just
      // `useCurrentAuthRequest()` who has to send a response back to the background using `replyToAuthRequest`:
      if (authID === DEFAULT_UNLOCK_AUTH_REQUEST_ID) return;

      // If it is any other type of `AuthRequest`, we mark it as accepted/cancelled and move on to the next one:
      setAuthRequestContextState((prevAuthRequestContextState) => {
        const {
          authRequests: prevAuthRequests,
          currentAuthRequestIndex: prevCurrentAuthRequestIndex
        } = prevAuthRequestContextState;
        const nextAuthRequests = prevAuthRequests;

        // TODO: Get the previous pending one if the next one is not there...
        const nextCurrentAuthRequestIndex = prevCurrentAuthRequestIndex + 1;

        nextAuthRequests[prevCurrentAuthRequestIndex] = {
          ...nextAuthRequests[prevCurrentAuthRequestIndex],
          status: accepted ? "accepted" : "rejected"
        };

        return {
          authRequests: nextAuthRequests,
          currentAuthRequestIndex: nextCurrentAuthRequestIndex
        };
      });
    },
    []
  );

  useEffect(() => {
    // Close the popup if an AuthRequest doesn't arrive in less than `AUTH_POPUP_REQUEST_WAIT_MS` (1s):

    const timeoutID = setTimeout(() => {
      window.top.close();
    }, AUTH_POPUP_REQUEST_WAIT_MS);

    isomorphicOnMessage("auth_request", (authRequest) => {
      clearTimeout(timeoutID);

      console.log("AuthProvider - Request received", authRequest);

      // UnlockAuthRequests are not enqueued as those are simply used to open the popup to prompt users to enter their
      // password and wait for the wallet to unlock:

      if (
        !authRequest ||
        !authRequest.data ||
        authRequest.data.type === "unlock"
      )
        return;

      setAuthRequestContextState((prevAuthRequestContextState) => {
        const { authRequests: prevAuthRequests, currentAuthRequestIndex } =
          prevAuthRequestContextState;

        if (authRequest.data.type === "connect") {
          // TODO: Check if there are other ConnectAuthRequest for the same site. If so, combine the permissions and take data for the last one.
          // TODO: What about the authIDs? We need to call `completeAuthRequest` on all of them.
          // TODO: Connect request not automatically go to the front unless they can be combined.

          // If not, add the new one AFTER the last connect one.
          return {
            authRequests: [
              { ...authRequest.data, status: "pending" },
              ...prevAuthRequests
            ],
            currentAuthRequestIndex
          };
        }

        // TODO: Validate and merge this properly (by domain, tab, tags, etc.):

        // TODO: Update enqueueing logic to group/sort by site and combine connect AuthRequests.

        // TODO: Update enqueueing logic to group individual signDataItem requests in a single batchSignDataItem.

        // TODO: Update enqueueing logic to remove AuthRequests if the tab that requested them gets closed or we disconnect the wallet.

        return {
          authRequests: [
            ...prevAuthRequests,
            { ...authRequest.data, status: "pending" }
          ],
          currentAuthRequestIndex
        };
      });
    });

    return () => {
      clearTimeout(timeoutID);
    };
  }, []);

  useEffect(() => {
    isomorphicOnMessage("auth_tab_closed", (tabClosedMessage) => {
      const tabID = tabClosedMessage?.data;

      console.log(`AuthProvider - Tab ${tabID || "-"} closed`);

      // TODO: Clean up chunks and alarm?

      if (!tabID) return;

      setAuthRequestContextState((prevAuthRequestContextState) => {
        const { authRequests: prevAuthRequests, currentAuthRequestIndex } =
          prevAuthRequestContextState;

        const authRequests = prevAuthRequests.map((authRequest) => {
          return authRequest.tabID === tabID
            ? ({
                ...authRequest,
                status: "aborted"
              } satisfies AuthRequest)
            : authRequest;
        });

        return {
          authRequests,
          currentAuthRequestIndex
        };
      });
    });
  }, []);

  useEffect(() => {
    const chunksByCollectionID: Record<string, Chunk[]> = {};

    console.log("AuthProvider - WAITING FOR auth_chunk...");

    // Listen for chunks needed in `sign.tsx` and `signKeystone.tsx`:

    isomorphicOnMessage("auth_chunk", ({ sender, data }) => {
      console.log("AuthProvider - auth_chunk", data);

      if (sender.context !== "background") return;

      const { type, collectionID } = data;

      if (type === "start") {
        console.log(`AuthProvider - ${collectionID} START`);

        chunksByCollectionID[collectionID] = [];
      } else if (type === "end") {
        console.log(`AuthProvider - ${collectionID} END`);

        const arweave = new Arweave(defaultGateway);

        setAuthRequestContextState((prevAuthRequestContextState) => {
          const { authRequests: prevAuthRequests, currentAuthRequestIndex } =
            prevAuthRequestContextState;

          const targetAuthRequest = prevAuthRequests.find((authRequest) => {
            return (
              (authRequest.type === "sign" ||
                authRequest.type === "signKeystone") &&
              authRequest.collectionID === collectionID
            );
          }) as SignAuthRequest | SignKeystoneAuthRequest;

          if (!targetAuthRequest) return prevAuthRequestContextState;

          // Update SignAuthRequest with `transaction`:

          if (targetAuthRequest.type === "sign") {
            const transaction = arweave.transactions.fromRaw(
              constructTransaction(
                targetAuthRequest.transaction as SplitTransaction,
                chunksByCollectionID[collectionID]
              )
            );

            const authRequests = prevAuthRequests.map((authRequest) => {
              if (authRequest.authID !== targetAuthRequest.authID)
                return authRequest;

              return {
                ...authRequest,
                transaction
              } as SignAuthRequest;
            });

            return {
              authRequests,
              currentAuthRequestIndex
            };
          }

          // Update SignKeystoneAuthRequest with `data`:

          const bytes = bytesFromChunks(chunksByCollectionID[collectionID]);
          const data = Buffer.from(bytes);

          const authRequests = prevAuthRequests.map((authRequest) => {
            if (authRequest.authID !== targetAuthRequest.authID)
              return authRequest;

            return {
              ...authRequest,
              data
            } as SignKeystoneAuthRequest;
          });

          return {
            authRequests,
            currentAuthRequestIndex
          };
        });
      } else {
        console.log(`AuthProvider - ${collectionID} chunk...`);

        if (!chunksByCollectionID[collectionID]) {
          chunksByCollectionID[collectionID] = [data];
        } else {
          chunksByCollectionID[collectionID].push(data);
        }
      }
    });
  }, []);

  useEffect(() => {
    let timeoutID = 0;

    const done =
      authRequests.length > 0 &&
      authRequests.every((authRequest) => authRequest.status !== "pending");

    // TODO: Add setting to decide whether this closes automatically or stays open in a "done" state:

    if (done) {
      // Close the window if the last request has been handled:

      if (process.env.NODE_ENV === "development") {
        timeoutID = setTimeout(() => {
          window.top.close();
        }, AUTH_POPUP_CLOSING_DELAY_MS);
      } else {
        window.top.close();
      }
    }

    function handleBeforeUnload() {
      // Send cancel event for all pending requests if the popup is closed by the user:

      authRequests.forEach((authRequest) => {
        if (authRequest.status !== "pending") return;

        replyToAuthRequest(
          authRequest.type,
          authRequest.authID,
          "User cancelled the auth"
        );
      });
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearTimeout(timeoutID);

      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [authRequests, currentAuthRequestIndex]);

  return (
    <AuthRequestsContext.Provider
      value={{
        authRequests,
        currentAuthRequestIndex,
        setCurrentAuthRequestIndex,
        completeAuthRequest
      }}
    >
      {children}
    </AuthRequestsContext.Provider>
  );
}
