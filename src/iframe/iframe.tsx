import { AnimatePresence } from "framer-motion";
import { Router } from "wouter";
import { ArConnectThemeProvider } from "~components/hardware/HardwareWalletTheme";
import HistoryProvider from "~components/popup/HistoryProvider";
import { NavigationBar } from "~components/popup/Navigation";
import { Page } from "~components/popup/Route";
import { AuthRequestsProvider } from "~utils/auth/auth.provider";
import { useHashLocation } from "~wallets/router/hash/hash-router.hook";
import { useBrowserExtensionWalletSetUp } from "~wallets/setup/browser-extension/browser-extension-wallet-setup.hook";
import type { InitialScreenType } from "~wallets/setup/wallet-setup.types";

interface ArConnectEmbeddedAppProps {
  initialScreenType: InitialScreenType;
}

export function ArConnectEmbeddedApp({
  initialScreenType
}: ArConnectEmbeddedAppProps) {
  let content: React.ReactElement = null;

  if (initialScreenType === "locked") {
    content = (
      <Page>
        <Unlock />
      </Page>
    );
  } else if (initialScreenType === "generating") {
    // This can only happen in the embedded wallet:
    content = (
      <Page>
        <p>Generating Wallet...</p>
      </Page>
    );
  } else if (initialScreenType === "default") {
    content = (
      <Router hook={useHashLocation}>
        <HistoryProvider>
          <NavigationBar />
        </HistoryProvider>
      </Router>
    );
  }

  return <>{content}</>;
}

export default function ArConnectEmbeddedAppRoot() {
  const initialScreenType = useBrowserExtensionWalletSetUp();

  return (
    <ArConnectThemeProvider>
      <AuthRequestsProvider initialScreenType={initialScreenType}>
        <AuthProvider>
          <AnimatePresence initial={false}>
            <ArConnectEmbeddedApp initialScreenType={initialScreenType} />
          </AnimatePresence>
        </AuthProvider>
      </AuthRequestsProvider>
    </ArConnectThemeProvider>
  );
}
