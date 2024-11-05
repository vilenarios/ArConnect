import Route, { Page } from "~components/popup/Route";
import { useSetUp } from "~wallets";
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

// DONE: Add logo ("favicon") to the HeadV2 (and HeadAuth) components.
// DONE: Hide the debug button in HeadAuth behind a flag.

// TODO: Display "X more" to HeadAuth label if there are too many of them or add some kind of horizontal scroll or get rid of older ones...

// DONE: Add a requestedAt label (now, a minute ago, etc.). Added only to sign.tsx, not signDataItem, signKeystone or any other page.
// TODO: Unify transaction details component.

// TODO: All screens should account for a tx being accepted/rejected already (change buttons)

// TODO: Load transactions from AuthRequests in the Provider, not in the sign.tsx route.

// TODO: initExtensionMessageForwarder();

export function AuthApp() {
  const initialScreenType = useSetUp();
  const { authRequest, prevAuthRequest } = useCurrentAuthRequest("any");

  let content: React.ReactElement = null;

  /*

  // TODO: Automatically close if nothing happens relatively quick after the popup is opened.

  useEffect(() => {
    if (initialScreenType === "default" && authRequests.length <= 0) {
      console.log("CLOSE POPUP");
      // If there isn't anything to show, just close the /auth popup:
      // window.top.close();
    }
  }, [])
  */

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
          `${prevAuthRequest?.type || "default"}RequestLoading`
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
  return (
    <ArConnectThemeProvider>
      <AuthRequestsProvider>
        <AnimatePresence initial={false}>
          <AuthApp />
        </AnimatePresence>
      </AuthRequestsProvider>
    </ArConnectThemeProvider>
  );
}
