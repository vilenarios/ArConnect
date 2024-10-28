import { onMessage, sendMessage } from "@arconnect/webext-bridge";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren
} from "react";
import type { AuthRequest } from "~utils/auth/auth.types";
import { replyToAuthRequest } from "~utils/auth/auth.utils";

interface AuthRequestContextData {
  authRequests: AuthRequest[];
  nextAuthRequest: () => boolean;
}

export const AuthRequestsContext = createContext<AuthRequestContextData>({
  authRequests: [],
  nextAuthRequest: () => true
});

export function AuthRequestsProvider({ children }: PropsWithChildren) {
  const [authRequests, setAuthRequests] = useState<AuthRequest[]>([]);

  const nextAuthRequest = useCallback(() => {
    console.log("nextAuthRequest");

    // Move on to the next event...:
    setAuthRequests((prevAuthRequests) => {
      return prevAuthRequests.slice(1);
    });

    const done = authRequests.length <= 1;

    console.log("done =", done);

    if (done) {
      // ...and close the window if this was the last one:
      window.close();
    }

    return done;
  }, [authRequests]);

  useEffect(() => {
    onMessage("authRequest", (authRequest) => {
      setAuthRequests((prevAuthRequests) => {
        // TODO: Validate and merge this properly (by tab, tags, etc.):
        return [...prevAuthRequests, authRequest.data] as any;
      });
    });

    sendMessage("ready", {});
  }, []);

  useEffect(() => {
    function handleBeforeUnload() {
      if (authRequests.length <= 1) return;

      // Send cancel event for all pending requests if the popup is closed by the user:
      authRequests.forEach((authRequest) => {
        console.log("CANCEL PENDING REQUEST");

        replyToAuthRequest(
          authRequest.type,
          authRequest.authID,
          "User cancelled the auth"
        );
      });
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [authRequests]);

  return (
    <AuthRequestsContext.Provider value={{ authRequests, nextAuthRequest }}>
      {children}
    </AuthRequestsContext.Provider>
  );
}
