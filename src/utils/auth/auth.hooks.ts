import { useContext, useEffect } from "react";
import type { BaseLocationHook } from "wouter";
import { ERR_MSG_USER_CANCELLED_AUTH } from "~utils/auth/auth.constants";
import { AuthRequestsContext } from "~utils/auth/auth.provider";
import type { AuthRequestByType, AuthType } from "~utils/auth/auth.types";

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
  const {
    authRequests,
    currentAuthRequestIndex,
    lastCompletedAuthRequest,
    completeAuthRequest
  } = useContext(AuthRequestsContext);

  const authRequest = authRequests[
    currentAuthRequestIndex
  ] as AuthRequestByType[T];
  const authRequestType = authRequest?.type;

  if (expectedAuthType !== "any") {
    if (!authRequest) {
      throw new Error(`Missing "${expectedAuthType}" AuthRequest.`);
    } else if (expectedAuthType !== authRequestType) {
      throw new Error(
        `Unexpected "${authRequestType}" AuthRequest. ${expectedAuthType} expected.`
      );
    }
  }

  const { type, authID, status } = authRequest || {};

  function acceptRequest(data?: any) {
    if (status !== "pending")
      throw new Error(`AuthRequest ${type}(${authID}) already ${status}`);

    return completeAuthRequest(authID, true, data);
  }

  function rejectRequest(errorMessage?: string) {
    if (status !== "pending")
      throw new Error(`AuthRequest ${type}(${authID}) already ${status}`);

    return completeAuthRequest(
      authID,
      false,
      errorMessage || ERR_MSG_USER_CANCELLED_AUTH
    );
  }

  return {
    authRequest,
    lastCompletedAuthRequest,
    acceptRequest,
    rejectRequest
  };
}

export const useAuthRequestsLocation: BaseLocationHook = () => {
  const { authRequest: currentAuthRequest } = useCurrentAuthRequest("any");
  const currentAuthRequestType = `/${currentAuthRequest.type}`;
  const currentAuthRequestID = currentAuthRequest.authID || "";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentAuthRequestID]);

  return [currentAuthRequestType, (path: string) => ""];
};
