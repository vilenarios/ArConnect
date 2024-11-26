import { ArConnectThemeProvider } from "~components/hardware/HardwareWalletTheme";
import Unlock from "~routes/auth/unlock";
import { AnimatePresence } from "framer-motion";
import { AuthRequestsProvider } from "~utils/auth/auth.provider";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import browser from "webextension-polyfill";
import { LoadingPage } from "~components/LoadingPage";
import type { InitialScreenType } from "~wallets/setup/wallet-setup.types";
import { useBrowserExtensionWalletSetUp } from "~wallets/setup/browser-extension/browser-extension-wallet-setup.hook";
import { Router } from "~wallets/router/router.component";
import { useAuthRequestsLocation } from "~wallets/router/auth/auth-router.hook";
import { AUTH_ROUTES } from "~wallets/router/auth/auth.routes";
import { Page } from "~components/Page";

interface AuthAppProps {
  initialScreenType: InitialScreenType;
}

export function AuthApp({ initialScreenType }: AuthAppProps) {
  const { authRequest, lastCompletedAuthRequest } =
    useCurrentAuthRequest("any");

  let content: React.ReactElement = null;

  // TODO: if initialScreenType === "generating" there was an error and this window must be closed...

  if (initialScreenType === "locked") {
    // TODO: Create a HOC to wrap UnlockView as UnlockPage and rename the Auth one...
    content = (
      <Page>
        <UnlockView />
      </Page>
    );
  } else if (!authRequest) {
    content = (
      <LoadingPage
        label={browser.i18n.getMessage(
          !lastCompletedAuthRequest ||
            lastCompletedAuthRequest.status === "accepted"
            ? `${lastCompletedAuthRequest?.type || "default"}RequestLoading`
            : `abortingRequestLoading`
        )}
      />
    );
  } else if (initialScreenType === "default") {
    content = <Router routes={AUTH_ROUTES} hook={useAuthRequestsLocation} />;
  }

  return <>{content}</>;
}

export function AuthAppRoot() {
  const initialScreenType = useBrowserExtensionWalletSetUp();

  return (
    <ArConnectThemeProvider>
      <AuthRequestsProvider initialScreenType={initialScreenType}>
        <AnimatePresence initial={false}>
          <AuthApp initialScreenType={initialScreenType} />
        </AnimatePresence>
      </AuthRequestsProvider>
    </ArConnectThemeProvider>
  );
}

export default AuthAppRoot;
