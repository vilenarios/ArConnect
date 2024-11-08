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

  const { type, authID, status } = authRequest || {};

  async function acceptRequest(data?: any) {
    if (status !== "pending") throw new Error(`AuthRequest already ${status}`);

    console.log("acceptRequest", type, data);

    await replyToAuthRequest(type, authID, undefined, data);

    completeAuthRequest(authID, true);
  }

  async function rejectRequest(errorMessage?: string) {
    if (status !== "pending") throw new Error(`AuthRequest already ${status}`);

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
