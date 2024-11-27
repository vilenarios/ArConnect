import type { BaseLocationHook } from "wouter";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";

export const useAuthRequestsLocation: BaseLocationHook = () => {
  const { authRequest: currentAuthRequest } = useCurrentAuthRequest("any");
  const currentAuthRequestType = currentAuthRequest
    ? `/${currentAuthRequest.type}/${currentAuthRequest.authID}`
    : "";

  // TODO: `authID` should be added to the URL for window.scrollTo(0, 0); to work automatically.

  return [currentAuthRequestType, (path: string) => ""];
};
