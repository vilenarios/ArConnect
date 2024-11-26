import type { BaseLocationHook } from "wouter";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import { useHashLocation } from "~wallets/router/hash/hash-router.hook";

export const useIFrameLocation: BaseLocationHook = () => {
  const { authRequest: currentAuthRequest } = useCurrentAuthRequest("any");

  // TODO: In the embedded wallet, instead of calling window.close, the AuthProvider should just "clear" the requests.

  if (currentAuthRequest) {
    const currentAuthRequestType = `/${currentAuthRequest.type}`;

    return [currentAuthRequestType, (path: string) => ""];
  }

  return useHashLocation();
};
