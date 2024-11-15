import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren
} from "react";
import {
  AUTH_POPUP_CLOSING_DELAY_MS,
  AUTH_POPUP_REQUEST_WAIT_MS
} from "~utils/auth/auth.constants";
import type {
  AuthRequest,
  AuthRequestStatus,
  SignAuthRequest,
  SignKeystoneAuthRequest
} from "~utils/auth/auth.types";
import {
  compareConnectAuthRequests,
  replyToAuthRequest,
  stopKeepAlive
} from "~utils/auth/auth.utils";
import type { Chunk } from "~api/modules/sign/chunks";
import { defaultGateway } from "~gateways/gateway";
import Arweave from "arweave";
import {
  bytesFromChunks,
  constructTransaction,
  type SplitTransaction
} from "~api/modules/sign/transaction_builder";
import { isomorphicOnMessage } from "~utils/messaging/messaging.utils";
import type { IBridgeMessage } from "@arconnect/webext-bridge";
import { ERR_MSG_USER_CANCELLED_AUTH } from "~utils/assertions";

interface AuthRequestContextState {
  authRequests: AuthRequest[];
  currentAuthRequestIndex: number;
  lastCompletedAuthRequest: null | AuthRequest;
}

interface AuthRequestContextData extends AuthRequestContextState {
  setCurrentAuthRequestIndex: (currentAuthRequestIndex: number) => void;
  completeAuthRequest: (
    authID: string,
    accepted: boolean,
    data: any
  ) => Promise<void>;
}

export const AuthRequestsContext = createContext<AuthRequestContextData>({
  authRequests: [],
  currentAuthRequestIndex: 0,
  lastCompletedAuthRequest: null,
  setCurrentAuthRequestIndex: () => {},
  completeAuthRequest: async () => {}
});

interface AuthRequestProviderPRops extends PropsWithChildren {
  isReady: boolean;
}

export function AuthRequestsProvider({
  children,
  isReady
}: AuthRequestProviderPRops) {
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
    async (authID: string, accepted: boolean, data: any) => {
      const completedAuthRequest = authRequests.find(
        (authRequest) => authRequest.authID === authID
      );
      const completedAuthRequests = [completedAuthRequest];
      const completedAuthRequestType = completedAuthRequest.type;

      if (completedAuthRequestType === "connect") {
        // For connect request, however, we'll only do it for those that have the exact same params, including the
        // domain that sent the request:

        authRequests.forEach((authRequest) => {
          if (
            authRequest.type === "connect" &&
            compareConnectAuthRequests(authRequest, completedAuthRequest)
          ) {
            completedAuthRequests.push(authRequest);
          }
        });
      }

      const status: AuthRequestStatus = accepted ? "accepted" : "rejected";

      const authRequestRepliesPromises: Promise<AuthRequestStatus>[] =
        completedAuthRequests.map((completedAuthRequest) => {
          return replyToAuthRequest(
            completedAuthRequest.type,
            completedAuthRequest.authID,
            accepted ? data : undefined,
            accepted ? undefined : data
          )
            .then(() => {
              return status;
            })
            .catch((err) => {
              console.warn(`replyToAuthRequest(${authID}) failed:`, err);

              return "error";
            });
        });

      const completedAuthRequestsStatus = await Promise.all(
        authRequestRepliesPromises
      );

      console.log(
        `completeAuthRequest(${authID}, ${accepted}) => ${completedAuthRequestsStatus.join(
          ", "
        )}`
      );

      // If it is any other type of `AuthRequest`, we mark it as accepted/cancelled and move on to the next one:
      setAuthRequestContextState((prevAuthRequestContextState) => {
        const { authRequests, currentAuthRequestIndex } =
          prevAuthRequestContextState;

        if (authID !== authRequests[currentAuthRequestIndex]?.authID) {
          console.warn(
            `Mismatch between authID="${authID}" and AuthRequest[${currentAuthRequestIndex}]?.authID`
          );

          return prevAuthRequestContextState;
        }

        if (authID !== completedAuthRequests[0]?.authID) {
          console.warn(
            `Mismatch between authID="${authID}" and completedAuthRequests[0]?.authID`
          );

          return prevAuthRequestContextState;
        }

        const nextAuthRequests = authRequests;

        let nextLastCompletedAuthRequest: AuthRequest;

        completedAuthRequests.forEach((completedAuthRequest, i) => {
          const completedAuthRequestIndex = nextAuthRequests.findIndex(
            (authRequest) => authRequest.authID === completedAuthRequest.authID
          );

          if (completedAuthRequestIndex === -1) {
            console.warn(
              `Could not find AuthRequest with authID="${completedAuthRequestsStatus}"`
            );

            return;
          }

          nextAuthRequests[completedAuthRequestIndex] = {
            ...nextAuthRequests[completedAuthRequestIndex],
            completedAt: Date.now(),
            status: completedAuthRequestsStatus[i]
          };

          if (i === 0)
            nextLastCompletedAuthRequest =
              nextAuthRequests[completedAuthRequestIndex];
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
          lastCompletedAuthRequest: nextLastCompletedAuthRequest
        };
      });
    },
    [authRequests]
  );

  useEffect(() => {
    console.log("\n\n\nNEW POPUP:\n\n\n\n");

    isomorphicOnMessage("auth_request", (authRequestMessage) => {
      console.log("AuthProvider - Request received", authRequestMessage);

      // UnlockAuthRequests are not enqueued as those are simply used to open the popup to prompt users to enter their
      // password and wait for the wallet to unlock:

      if (!authRequestMessage?.data) {
        console.warn("auth_request without data");
        return;
      }

      const authRequest = authRequestMessage.data;

      setAuthRequestContextState((prevAuthRequestContextState) => {
        const {
          authRequests,
          currentAuthRequestIndex,
          lastCompletedAuthRequest
        } = prevAuthRequestContextState;

        // TODO: Additional considerations when enqueueing new `AuthRequest`s:
        //
        // - `AuthRequest`s could be grouped by domain and/or tab. This means the auth popup could/should provide a
        //   domain/tab selector and automatically select the active tab when the user switches it.
        //
        // - Separate `signDataItem`requests could/should automatically be combined into a single `batchSignDataItem`
        //   (except maybe for the current `AuthRequest`, as otherwise the UI would constantly change as new requests
        //   are added to the batch).

        const nextAuthRequests = [
          ...authRequests,
          { ...authRequest, status: "pending" }
        ] satisfies AuthRequest[];

        // TODO: Add setting to decide whether we automatically jump to a new pending request when they arrive or stay
        // in the one currently selected.

        return {
          authRequests: nextAuthRequests,
          currentAuthRequestIndex,
          lastCompletedAuthRequest
        };
      });
    });
  }, []);

  useEffect(() => {
    function handleTabReloadedOrClosed(message: IBridgeMessage<number>) {
      const tabID = message?.data;

      if (!tabID) return;

      setAuthRequestContextState((prevAuthRequestContextState) => {
        const {
          authRequests: prevAuthRequests,
          currentAuthRequestIndex,
          lastCompletedAuthRequest
        } = prevAuthRequestContextState;

        let pendingRequestsCount = 0;

        const authRequests = prevAuthRequests.map((authRequest) => {
          if (authRequest.tabID === tabID) {
            stopKeepAlive(authRequest.authID);

            return {
              ...authRequest,
              completedAt: Date.now(),
              status: "aborted"
            } satisfies AuthRequest;
          }

          if (authRequest.status === "pending") {
            ++pendingRequestsCount;
          }

          return authRequest;
        });

        if (pendingRequestsCount === 0 && authRequests.length > 0) {
          // All tabs that sent AuthRequest also got closed/reloaded/disconnected, so close the popup immediately:
          window.top.close();
        }

        // TODO: Consider automatically selecting the next pending AuthRequest.

        return {
          authRequests,
          currentAuthRequestIndex,
          lastCompletedAuthRequest
        };
      });
    }

    isomorphicOnMessage("auth_tab_reloaded", handleTabReloadedOrClosed);
    isomorphicOnMessage("auth_tab_closed", handleTabReloadedOrClosed);
    isomorphicOnMessage("auth_active_wallet_change", handleTabReloadedOrClosed);
    isomorphicOnMessage("auth_app_disconnected", handleTabReloadedOrClosed);
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

    const isDone =
      authRequests.length > 0 &&
      authRequests.every((authRequest) => authRequest.status !== "pending");

    if (isReady && authRequests.length === 0) {
      // Close the popup if an AuthRequest doesn't arrive in less than `AUTH_POPUP_REQUEST_WAIT_MS` (1s), unless the
      // wallet is locked (no timeout in that case):

      timeoutID = setTimeout(() => {
        window.top.close();
      }, AUTH_POPUP_REQUEST_WAIT_MS);
    } else if (isDone) {
      // Close the window if the last request has been handled:

      // TODO: Add setting to decide whether this closes automatically or stays open in a "done" state.

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
          ERR_MSG_USER_CANCELLED_AUTH
        );
      });
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearTimeout(timeoutID);

      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isReady, authRequests, currentAuthRequestIndex]);

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
