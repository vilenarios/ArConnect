import Route, { Page } from "~components/popup/Route";
import { Router } from "wouter";

import { ArConnectThemeProvider } from "~components/hardware/HardwareWalletTheme";

import Allowance from "~routes/auth/allowance";
import Signature from "~routes/auth/signature";
import Connect from "~routes/auth/connect";
import Unlock from "~routes/auth/unlock";
import SignDataItem from "~routes/auth/signDataItem";
import Token from "~routes/auth/token";
import Sign from "~routes/auth/sign";
import Subscription from "~routes/auth/subscription";
import SignKeystone from "~routes/auth/signKeystone";
import BatchSignDataItem from "~routes/auth/batchSignDataItem";
import { AnimatePresence } from "framer-motion";
import { AuthRequestsProvider } from "~utils/auth/auth.provider";
import {
  useAuthRequestsLocation,
  useCurrentAuthRequest
} from "~utils/auth/auth.hooks";
import browser from "webextension-polyfill";
import { LoadingPage } from "~components/LoadingPage";
import type { InitialScreenType } from "~wallets/setup/wallet-setup.types";
import { useBrowserExtensionWalletSetUp } from "~wallets/setup/browser-extension/browser-extension-wallet-setup.hook";

interface AuthAppProps {
  initialScreenType: InitialScreenType;
}

export function AuthApp({ initialScreenType }: AuthAppProps) {
  const { authRequest, lastCompletedAuthRequest } =
    useCurrentAuthRequest("any");

  let content: React.ReactElement = null;

  // TODO: if initialScreenType === "generating" there was an error and this window muust be closed...

  if (initialScreenType === "locked") {
    content = (
      <Page>
        <Unlock />
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
    content = (
      <Router hook={useAuthRequestsLocation}>
        <Route path="/connect" component={Connect} />
        <Route path="/allowance" component={Allowance} />
        <Route path="/token" component={Token} />
        <Route path="/sign" component={Sign} />
        <Route path="/signKeystone" component={SignKeystone} />
        <Route path="/signature" component={Signature} />
        <Route path="/subscription" component={Subscription} />
        <Route path="/signDataItem" component={SignDataItem} />
        <Route path="/batchSignDataItem" component={BatchSignDataItem} />
      </Router>
    );
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
