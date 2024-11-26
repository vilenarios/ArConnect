import Unlock from "~routes/popup/unlock";
import { NavigationBar } from "~components/popup/Navigation";
import { ArConnectThemeProvider } from "~components/hardware/HardwareWalletTheme";
import { AnimatePresence } from "framer-motion";
import { useBrowserExtensionWalletSetUp } from "~wallets/setup/browser-extension/browser-extension-wallet-setup.hook";
import type { InitialScreenType } from "~wallets/setup/wallet-setup.types";
import { Page } from "~components/Page";
import { Router } from "~wallets/router/router.component";
import { POPUP_ROUTES } from "~wallets/router/popup/popup.routes";
import HistoryProvider from "~components/popup/HistoryProvider";

interface ArConnectBrowserExtensionAppProps {
  initialScreenType: InitialScreenType;
}

export function ArConnectBrowserExtensionApp({
  initialScreenType
}: ArConnectBrowserExtensionAppProps) {
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
      <>
        <Router routes={POPUP_ROUTES} />
        <NavigationBar />
      </>
    );
  }

  return <>{content}</>;
}

// TODO: Move HistoryProvider below and add it manually instead. Add a HistoryProviderObserver...

export function ArConnectBrowserExtensionAppRoot() {
  const initialScreenType = useBrowserExtensionWalletSetUp();

  return (
    <ArConnectThemeProvider>
      <HistoryProvider>
        <AnimatePresence initial={false}>
          <ArConnectBrowserExtensionApp initialScreenType={initialScreenType} />
        </AnimatePresence>
      </HistoryProvider>
    </ArConnectThemeProvider>
  );
}

export default ArConnectBrowserExtensionAppRoot;
