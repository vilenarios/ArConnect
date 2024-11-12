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
  lastCompletedAuthRequest: null | AuthRequest;
}

interface AuthRequestContextData extends AuthRequestContextState {
  setCurrentAuthRequestIndex: (currentAuthRequestIndex: number) => void;
  completeAuthRequest: (authID: string, accepted: boolean) => void;
}

export const AuthRequestsContext = createContext<AuthRequestContextData>({
  authRequests: [],
  currentAuthRequestIndex: 0,
  lastCompletedAuthRequest: null,
  setCurrentAuthRequestIndex: () => {},
  completeAuthRequest: () => {}
});

export function AuthRequestsProvider({ children }: PropsWithChildren) {
  const [
    { authRequests, currentAuthRequestIndex, lastCompletedAuthRequest },
    setAuthRequestContextState
  ] = useState<AuthRequestContextState>({
    authRequests: [],
    currentAuthRequestIndex: 0,
    lastCompletedAuthRequest: null
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
      // if (authID === DEFAULT_UNLOCK_AUTH_REQUEST_ID) return;

      // If it is any other type of `AuthRequest`, we mark it as accepted/cancelled and move on to the next one:
      setAuthRequestContextState((prevAuthRequestContextState) => {
        const { authRequests, currentAuthRequestIndex } =
          prevAuthRequestContextState;

        if (authRequests[currentAuthRequestIndex]?.authID !== authID)
          return prevAuthRequestContextState;

        const nextAuthRequests = authRequests;

        // Mark the current `AuthRequest` as "accepted" or "rejected":
        const lastCompletedAuthRequest = (nextAuthRequests[
          currentAuthRequestIndex
        ] = {
          ...nextAuthRequests[currentAuthRequestIndex],
          status: accepted ? "accepted" : "rejected"
        });

        // Find the index of the next "pending" `AuthRequest`, or keep it unchanged if there are none left:
        let nextCurrentAuthRequestIndex = currentAuthRequestIndex;

        do {
          nextCurrentAuthRequestIndex =
            (nextCurrentAuthRequestIndex + 1) % nextAuthRequests.length;
        } while (
          nextCurrentAuthRequestIndex !== currentAuthRequestIndex &&
          nextAuthRequests[nextCurrentAuthRequestIndex].status !== "pending"
        );

        if (nextCurrentAuthRequestIndex === currentAuthRequestIndex) {
          nextCurrentAuthRequestIndex = nextAuthRequests.length;
        }

        return {
          authRequests: nextAuthRequests,
          currentAuthRequestIndex: nextCurrentAuthRequestIndex,
          lastCompletedAuthRequest
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

      if (!authRequest?.data) return;

      setAuthRequestContextState((prevAuthRequestContextState) => {
        const {
          authRequests: prevAuthRequests,
          currentAuthRequestIndex,
          lastCompletedAuthRequest
        } = prevAuthRequestContextState;

        // TODO: Additional considerations when enqueueing new `AuthRequest`s:
        //
        // - We might want to push "connect" requests at the head (0), not at the end.
        //
        // - We might want to automatically merge/combine "connect" requests from the same site (regardless of tab). In
        //   this case, `AuthRequests` might have to respond to multiple authIDs when accepted/rejected, which affects
        //   both `completeAuthRequest` and `auth.hook.ts`.
        //
        // - `AuthRequest`s could be grouped/sorted by domain/app/tab. This means the auth popup could/should provide a
        //   domain/app/tab selector and automatically select the active tab when the user switches it.
        //
        // - Separate `signDataItem`requests could/should automatically be combined into a single `batchSignDataItem`
        //   (except maybe for the current `AuthRequest`, as otherwise the UI would constantly change as new requests
        //   are added to the batch).

        const nextAuthRequests = [...prevAuthRequests] satisfies AuthRequest[];

        if (authRequest.data.type === "unlock") {
          // TODO: When merging, all need to be notified when clicked...
          if (prevAuthRequests[0]?.type !== "unlock")
            nextAuthRequests.unshift({
              ...authRequest.data,
              status: "pending"
            });
        } else {
          nextAuthRequests.push({ ...authRequest.data, status: "pending" });
        }

        // TODO: Add setting to decide whether we automatically jump to a new pending request when they arrive or stay
        // in the one currently selected:

        let nextCurrentAuthRequestIndex = currentAuthRequestIndex;

        // if (nextAuthRequests[currentAuthRequestIndex].status !== "pending") {
        //   nextCurrentAuthRequestIndex = nextAuthRequests.length - 1;
        // }

        return {
          authRequests: nextAuthRequests,
          currentAuthRequestIndex: nextCurrentAuthRequestIndex,
          lastCompletedAuthRequest
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

      if (!tabID) return;

      setAuthRequestContextState((prevAuthRequestContextState) => {
        const {
          authRequests: prevAuthRequests,
          currentAuthRequestIndex,
          lastCompletedAuthRequest
        } = prevAuthRequestContextState;

        const authRequests = prevAuthRequests.map((authRequest) => {
          return authRequest.tabID === tabID
            ? ({
                ...authRequest,
                status: "aborted"
              } satisfies AuthRequest)
            : authRequest;
        });

        // TODO: Consider automatically selecting the next pending AuthRequest.

        return {
          authRequests,
          currentAuthRequestIndex,
          lastCompletedAuthRequest
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
          const {
            authRequests: prevAuthRequests,
            currentAuthRequestIndex,
            lastCompletedAuthRequest
          } = prevAuthRequestContextState;

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
              currentAuthRequestIndex,
              lastCompletedAuthRequest
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
            currentAuthRequestIndex,
            lastCompletedAuthRequest
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
        lastCompletedAuthRequest,
        setCurrentAuthRequestIndex,
        completeAuthRequest
      }}
    >
      {children}
    </AuthRequestsContext.Provider>
  );
}
