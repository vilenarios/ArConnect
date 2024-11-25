import Route, { Page } from "~components/popup/Route";
import { useSetUp, type InitialScreenType } from "~wallets";
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

interface AuthAppProps {
  initialScreenType: InitialScreenType;
}

export function AuthApp({ initialScreenType }: AuthAppProps) {
  const { authRequest, lastCompletedAuthRequest } =
    useCurrentAuthRequest("any");

  let content: React.ReactElement = null;

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

export default function AuthAppRoot() {
  const initialScreenType = useSetUp();

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
