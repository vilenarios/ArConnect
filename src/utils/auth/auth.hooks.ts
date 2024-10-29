import { useContext, useEffect } from "react";
import type { BaseLocationHook, Path } from "wouter";
import { AuthRequestsContext } from "~utils/auth/auth.provider";
import type { AuthRequestByType, AuthType } from "~utils/auth/auth.types";
import { replyToAuthRequest } from "~utils/auth/auth.utils";

export function useAuthRequests() {
  return useContext(AuthRequestsContext);
}

/**
 * Get the current AuthRequest and validate it has the expected type.
 *
 * @param type Expected type of the AuthRequest.
 */
export function useCurrentAuthRequest<T extends AuthType>(expectedAuthType: T) {
  const { authRequests, nextAuthRequest } = useContext(AuthRequestsContext);

  const authRequest = authRequests[0] as AuthRequestByType[T];

  if (!authRequest || authRequest.type !== expectedAuthType) {
    throw new Error(`${authRequest ? "Unexpected" : "Missing"} AuthRequest.`);
  }

  const { type, authID } = authRequest;

  async function acceptRequest(data?: any) {
    console.log("acceptRequest", data);

    // send response
    await replyToAuthRequest(type, authID, undefined, data);

    nextAuthRequest();
  }

  async function rejectRequest(errorMessage?: string) {
    console.log("rejectRequest", errorMessage);

    // send response
    await replyToAuthRequest(
      type,
      authID,
      errorMessage || "User cancelled the auth"
    );

    nextAuthRequest();
  }

  return {
    authRequest,
    acceptRequest,
    rejectRequest
    // closeWindow,
  };
}

export const useAuthRequestsLocation: BaseLocationHook = () => {
  const { authRequests } = useAuthRequests();
  const currentAuthRequest = authRequests[0];
  const currentAuthRequestType = `/${currentAuthRequest.type}`;
  const currentAuthRequestID = currentAuthRequest.authID || "";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentAuthRequestID]);

  // console.log("currentAuthRequestType =", currentAuthRequestType, authRequests);

  return [currentAuthRequestType, (path: string) => ""];
};

/**
 * Hook to parse auth params from the url
 */
/*
export function useAuthParams<T = {}>() {
  const [params, setParams] = useState<AuthDataWithID & T>();

  // fetch params
  useEffect(() => {
    const urlParams = window.location.href.split("?");
    const params = objectFromUrlParams<AuthDataWithID & T>(
      urlParams[urlParams.length - 1].replace(window.location.hash, "")
    );

    setParams(params);
  }, []);

  return params;
}
*/
