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
  useAuthRequestsLocation,
  useCurrentAuthRequest
} from "~utils/auth/auth.hooks";

// TODO: initExtensionMessageForwarder();

export function AuthApp() {
  const initialScreenType = useSetUp();
  const { authRequests, currentAuthRequestIndex } = useAuthRequests();
  const { authRequest } = useCurrentAuthRequest("any");

  let content: React.ReactElement = null;

  // TODO: Open the popup without sending a message if blocked? => The message is sent but not enqueued.

  // TODO: Maybe change requestUserAuthorization(authRequest: AuthRequest) to requestUserAuthorization(authRequest?: AuthRequest)
  // and only open the popup if no authRequest is sent? But the "response" must be sent anyway.

  // TODO: Handle special case if authRequest has type = "unlock".

  // TODO: Show loader if signDataItem !params (no next auth request or no data other than default?)

  // TODO: Dev nav bar with navigation and expandable <pre> with tabs (select)
  // TODO: Wait time before closing.

  // TODO: Unhandled special case: If there are pending AuthRequests and we disconnect from the site.

  // TODO: Auth screens should indicate what app the requests comes from.

  /*
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
      <pre>
        {initialScreenType} / {currentAuthRequestIndex}
      </pre>
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
