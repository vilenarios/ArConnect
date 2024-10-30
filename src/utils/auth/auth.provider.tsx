import { onMessage, sendMessage } from "@arconnect/webext-bridge";
import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren
} from "react";
import { DEFAULT_UNLOCK_AUTH_REQUEST_ID } from "~utils/auth/auth.constants";
import type { AuthRequest } from "~utils/auth/auth.types";
import { replyToAuthRequest } from "~utils/auth/auth.utils";
import { retryWithDelay } from "~utils/promises/retry";

interface AuthRequestContextState {
  authRequests: AuthRequest[];
  currentAuthRequestIndex: number;
}

interface AuthRequestContextData extends AuthRequestContextState {
  completeAuthRequest: (authID: string, accepted: boolean) => void;
}

export const AuthRequestsContext = createContext<AuthRequestContextData>({
  authRequests: [],
  currentAuthRequestIndex: 0,
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
    onMessage<AuthRequest, string>("authRequest", (authRequest) => {
      setAuthRequestContextState((prevAuthRequestContextState) => {
        const {
          authRequests: prevAuthRequests,
          currentAuthRequestIndex: prevCurrentAuthRequestIndex
        } = prevAuthRequestContextState;

        console.log("REQUEST RECEIVED", authRequest);

        // UnlockAuthRequests are not enqueued as those are simply used to open the popup to prompt users to enter their
        // password and wait for the wallet to unlock:
        if (
          !authRequest ||
          !authRequest.data ||
          authRequest.data.type === "unlock"
        ) {
          return prevAuthRequestContextState;
        }

        if (authRequest.data.type === "connect") {
          // TODO: Make sure there are no duplicates (but this is per-site)...
        }

        // TODO: Validate and merge this properly (by domain, tab, tags, etc.):

        return {
          authRequests: [
            ...prevAuthRequests,
            { ...authRequest.data, status: "pending" }
          ],
          currentAuthRequestIndex: prevCurrentAuthRequestIndex
        };
      });
    });

    // TODO: Maybe not needed?

    retryWithDelay(() => {
      return sendMessage("ready", {}).catch((err) => {
        if (
          err.message ===
          "No handler registered in 'background' to accept messages with id 'ready'"
        ) {
          console.log(
            "Ready message sent before background started listening. Retrying...",
            err
          );
        }

        throw err;
      });
    }).catch((err) => {
      console.log("Ready message failed after retrying:", err);
    });
  }, []);

  const timeoutRef = useRef(0);

  useEffect(() => {
    const done =
      authRequests.length > 0 &&
      authRequests[authRequests.length - 1].status !== "pending";

    if (done) {
      // Close the window if the last request has been handled:
      timeoutRef.current = setTimeout(() => {
        alert("CLOSING...");
        window.top.close();
      }, 5000);
    }

    function handleBeforeUnload() {
      // Send cancel event for all pending requests if the popup is closed by the user:
      authRequests.forEach((authRequest) => {
        console.log("CANCELLING PENDING REQUEST...");

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
      clearTimeout(timeoutRef.current);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [authRequests, currentAuthRequestIndex]);

  return (
    <AuthRequestsContext.Provider
      value={{ authRequests, currentAuthRequestIndex, completeAuthRequest }}
    >
      {children}
    </AuthRequestsContext.Provider>
  );
}
