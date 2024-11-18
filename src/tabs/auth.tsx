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
// DONE: Reloading the tab should also abort AuthRequests.
// DONE: Fix transactions with no tags by resetting the popup tab ID if the popup is closed.
// DONE: Implement listeners for wallet unlock rather than relying on AuthRequests for that (based on storage listeners/watchers)
// DONE: Close popup immediately if all tabs that sent AuthRequests are closed/reloaded/disconnected.
// DONE: Change "Aborting" message when unlocking.
// DONE: Abort AuthRequests (and cancel alarms) when:
// - An AuthRequest is rejected.
// - A tab that sent AuthRequests is closed or reloaded.
// - The auth popup itself is closed - check if there are duplicate popups, kill all and reset alarm.
// - Disconnecting the wallet.
// - Changing the active wallet.
// - Note locking the wallet DOES NOT update AuthRequests in any way.
// DONE: Verify only one Welcome page can be opened at a time (review connect.background.ts)
// DONE: Update logic to open the Welcome page to avoid opening and closing the auth popup just to run the check.

// TODO: Add unlock expiration in auth.ts and AuthRequest expiration (only if more than 100) in auth.provider.ts.
// TODO: Bazar app icon not appearing in the connect screen.
// TODO: Test common error handling for unlock screen.

// TODO: Add env variable for message/auth-related logs.
// TODO: Stop listening for _ready_ready messages.

// TODO: Create new issues for this:
// TODO: Unify address and transaction details components.
// TODO: XSS using the app url/favicon? Add sanitization in the TransactionDetails components as well as an experimental "descriptionMapper" API?
// TODO: How to know which wallet is being used in the AuthRequests.

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
      <AuthRequestsProvider isReady={initialScreenType === "default"}>
        <AnimatePresence initial={false}>
          <AuthApp initialScreenType={initialScreenType} />
        </AnimatePresence>
      </AuthRequestsProvider>
    </ArConnectThemeProvider>
  );
}
