import { useContext, useEffect } from "react";
import type { BaseLocationHook } from "wouter";
import { DEFAULT_UNLOCK_AUTH_REQUEST } from "~utils/auth/auth.constants";
import { AuthRequestsContext } from "~utils/auth/auth.provider";
import type {
  AuthRequest,
  AuthRequestByType,
  AuthType
} from "~utils/auth/auth.types";
import { replyToAuthRequest } from "~utils/auth/auth.utils";

export function useAuthRequests() {
  return useContext(AuthRequestsContext);
}

/**
 * Get the current AuthRequest and validate it has the expected type.
 *
 * @param type Expected type of the AuthRequest.
 */
export function useCurrentAuthRequest<T extends AuthType>(
  expectedAuthType: T | "any"
) {
  const { authRequests, currentAuthRequestIndex, completeAuthRequest } =
    useContext(AuthRequestsContext);

  const prevAuthRequest =
    authRequests[currentAuthRequestIndex - 1] || (null as AuthRequest | null);

  const authRequest = (
    expectedAuthType === "unlock"
      ? DEFAULT_UNLOCK_AUTH_REQUEST
      : authRequests[currentAuthRequestIndex]
  ) as AuthRequestByType[T];

  if (expectedAuthType !== "any" && expectedAuthType !== authRequest.type) {
    throw new Error(
      `${
        authRequest ? "Unexpected" : "Missing"
      } "${expectedAuthType}" AuthRequest.`
    );
  }

  const { type, authID } = authRequest || {};

  async function acceptRequest(data?: any) {
    console.log("acceptRequest", type, data);

    // send response
    await replyToAuthRequest(type, authID, undefined, data);

    completeAuthRequest(authID, true);
  }

  async function rejectRequest(errorMessage?: string) {
    console.log("rejectRequest", type, errorMessage);

    // send response
    await replyToAuthRequest(
      type,
      authID,
      errorMessage || "User cancelled the auth"
    );

    completeAuthRequest(authID, false);
  }

  return {
    prevAuthRequest,
    authRequest,
    acceptRequest,
    rejectRequest
    // closeWindow,
  };
}

export const useAuthRequestsLocation: BaseLocationHook = () => {
  const { authRequest: currentAuthRequest } = useCurrentAuthRequest("any");
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
