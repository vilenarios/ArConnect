import type { BaseLocationHook } from "wouter";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";

export const useAuthRequestsLocation: BaseLocationHook = () => {
  const { authRequest: currentAuthRequest } = useCurrentAuthRequest("any");

  // The authID has been added to the URL so that the auto-scroll and view transition effect work when switching
  // between different `AuthRequest`s of the same type:
  const currentAuthRequestType = currentAuthRequest
    ? `/${currentAuthRequest.type}/${currentAuthRequest.authID}`
    : "";

  // TODO: Implement a navigate function that just selects a different route...
  // TODO: Also use <Link> when possible.
  return [currentAuthRequestType, (path: string) => ""];
};
