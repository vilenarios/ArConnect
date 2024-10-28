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
  useAuthRequests,
  useAuthRequestsLocation
} from "~utils/auth/auth.hooks";

// TODO: initExtensionMessageForwarder();

export function AuthApp() {
  const initialScreenType = useSetUp();
  const { authRequests } = useAuthRequests();

  let content: React.ReactElement = null;

  // TODO: Handle special case if authRequest has type = "unlock".

  // TODO: Show loader if signDataItem !params (no next auth reques or no data other than default?)

  if (initialScreenType === "locked") {
    content = (
      <Page>
        <Unlock />
      </Page>
    );
  } else if (!authRequests || authRequests.length <= 0) {
    content = <p>Loading...</p>;
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

  return (
    <>
      <pre>{JSON.stringify(authRequests, null, "  ")}</pre>

      {content}
    </>
  );
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
