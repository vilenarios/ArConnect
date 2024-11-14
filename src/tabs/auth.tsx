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

// DONE: Load transactions from AuthRequests in the Provider, not in the sign.tsx route.
// DONE: Abort transactions if the tab that requested them is closed.
// DONE: Add a requestedAt label (now, a minute ago, etc.). Added only to sign.tsx, not signDataItem, signKeystone or any other page.
// DONE: Add auth popup close delay only in dev.

// DONE: Show minutes/hours in the requested at label.
// DONE: Extract AuthRequest buttons in their own component.
// DONE: Add i18n for `AuthButtons` and remove "requested" from sign.tsx page.
// DONE: All screens should account for a tx being accepted/rejected already (change buttons) and show the requested at label.
// DONE: Add unlock to route...
// DONE: Properly keep track of `prevAuthRequest` in auth.provider.ts (rather than auth.hook.ts).

// DONE: Properly merge and "complete" unlock and connect auth requests in auth.provider and auth.hook.
// DONE: The unlock screen needs to work both with and without a AuthRequest.
// DONE: Clean up alarms on auth_tab_closed
// DONE: Unlocking the wallet seems to automatically accept an AuthRequest.
// DONE: Get rid of constant UNLOCK_AUTH_REQUEST_ID and fix duplicate unlock requests when the wallet is initially locked.
// DONE: If the last transaction was cancelled, the message should be different.

// TODO: Disconnecting the wallet should also abort AuthRequests.
// TODO: Reloading the tab should also abort AuthRequests.
// TODO: Add env variable for message/auth-related logs.

// TODO: Check timeout issue in messaging.utils - is this why Bazar doesn't work the same when the wallet has just been unlocked?
// TODO: Why the first transaction after closing the popup arrives without tags?
// TODO: Stop listening for _ready_ready messages.

// TODO: How to know which wallet is being used in the AuthRequests? What if I change the wallet, should the requests be cancelled?
// TODO: Unify transaction details component (new PR).

export function AuthApp() {
  const initialScreenType = useSetUp();
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
          lastCompletedAuthRequest?.status === "accepted"
            ? `${lastCompletedAuthRequest?.type || "default"}RequestLoading`
            : `abortingRequestLoading`
        )}
      />
    );
  } else if (initialScreenType === "default") {
    content = (
      <Router hook={useAuthRequestsLocation}>
        <Route path="/unlock" component={Unlock} />
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
