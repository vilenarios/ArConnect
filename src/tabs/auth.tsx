import { ArConnectThemeProvider } from "~components/hardware/HardwareWalletTheme";
import { UnlockAuthRequestPage } from "~routes/auth/unlock";
import { AuthRequestsProvider } from "~utils/auth/auth.provider";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import browser from "webextension-polyfill";
import { LoadingPage } from "~components/page/common/loading/loading.view";
import type { InitialScreenType } from "~wallets/setup/wallet-setup.types";
import { useBrowserExtensionWalletSetUp } from "~wallets/setup/browser-extension/browser-extension-wallet-setup.hook";
import { Routes } from "~wallets/router/routes.component";
import { useAuthRequestsLocation } from "~wallets/router/auth/auth-router.hook";
import { AUTH_ROUTES } from "~wallets/router/auth/auth.routes";
import { BodyScroller } from "~wallets/router/router.utils";
import { AnimatePresence } from "framer-motion";
import { Router as Wouter } from "wouter";

interface AuthAppProps {
  initialScreenType: InitialScreenType;
}

export function AuthApp({ initialScreenType }: AuthAppProps) {
  const { authRequest, lastCompletedAuthRequest } =
    useCurrentAuthRequest("any");

  let content: React.ReactElement = null;

  if (initialScreenType === "locked") {
    content = <UnlockAuthRequestPage />;
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
    content = <Routes routes={AUTH_ROUTES} diffLocation />;
  }

  return <>{content}</>;
}

export function AuthAppRoot() {
  const initialScreenType = useBrowserExtensionWalletSetUp();

  return (
    <ArConnectThemeProvider>
      <AuthRequestsProvider initialScreenType={initialScreenType}>
        <Wouter hook={useAuthRequestsLocation}>
          <BodyScroller />

          <AnimatePresence initial={false}>
            <AuthApp initialScreenType={initialScreenType} />
          </AnimatePresence>
        </Wouter>
      </AuthRequestsProvider>
    </ArConnectThemeProvider>
  );
}

export default AuthAppRoot;
