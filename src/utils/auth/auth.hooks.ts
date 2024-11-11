import { useContext, useEffect } from "react";
import type { BaseLocationHook } from "wouter";
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

  // TODO: This is not right:
  const prevAuthRequest =
    authRequests[currentAuthRequestIndex - 1] || (null as AuthRequest | null);

  /*
  const authRequest = (
    expectedAuthType === "unlock"
      ? DEFAULT_UNLOCK_AUTH_REQUEST
      : authRequests[currentAuthRequestIndex]
  ) as AuthRequestByType[T];
  */

  const authRequest = authRequests[
    currentAuthRequestIndex
  ] as AuthRequestByType[T];
  const authRequestType = authRequest?.type;

  if (expectedAuthType !== "any" && expectedAuthType !== "unlock") {
    if (!authRequest) {
      throw new Error(`Missing "${expectedAuthType}" AuthRequest.`);
    } else if (expectedAuthType !== authRequestType) {
      throw new Error(
        `Unexpected "${authRequestType}" AuthRequest. ${expectedAuthType} expected.`
      );
    }
  }

  const { type, authID, status } = authRequest || {};

  async function acceptRequest(data?: any) {
    // TODO: Add a catch block to keep track of failed ones?

    if (status !== "pending")
      throw new Error(`AuthRequest ${type}(${authID}) already ${status}`);

    console.log("acceptRequest", type, data);

    await replyToAuthRequest(type, authID, undefined, data);

    completeAuthRequest(authID, true);
  }

  async function rejectRequest(errorMessage?: string) {
    if (status !== "pending")
      throw new Error(`AuthRequest ${type}(${authID}) already ${status}`);

    console.log("rejectRequest", type, errorMessage);

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
