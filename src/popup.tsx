import { UnlockPage } from "~routes/popup/unlock";
import { NavigationBar } from "~components/popup/Navigation";
import { ArConnectThemeProvider } from "~components/hardware/HardwareWalletTheme";
import { useBrowserExtensionWalletSetUp } from "~wallets/setup/browser-extension/browser-extension-wallet-setup.hook";
import type { InitialScreenType } from "~wallets/setup/wallet-setup.types";
import { Routes } from "~wallets/router/routes.component";
import { POPUP_ROUTES } from "~wallets/router/popup/popup.routes";
import HistoryProvider from "~components/popup/HistoryProvider";
import { useHashLocation } from "~wallets/router/hash/hash-router.hook";
import { Router as Wouter } from "wouter";
import { BodyScroller, HistoryObserver } from "~wallets/router/router.utils";
import { AnimatePresence } from "framer-motion";

interface ArConnectBrowserExtensionAppProps {
  initialScreenType: InitialScreenType;
}

export function ArConnectBrowserExtensionApp({
  initialScreenType
}: ArConnectBrowserExtensionAppProps) {
  let content: React.ReactElement = null;

  if (initialScreenType === "locked") {
    content = <UnlockPage />;
  } else if (initialScreenType === "default") {
    content = (
      <>
        <Routes routes={POPUP_ROUTES} />
        <NavigationBar />
      </>
    );
  }

  return <>{content}</>;
}

export function ArConnectBrowserExtensionAppRoot() {
  const initialScreenType = useBrowserExtensionWalletSetUp();

  return (
    <ArConnectThemeProvider>
      <Wouter hook={useHashLocation}>
        <BodyScroller />
        <HistoryObserver />

        <HistoryProvider>
          <AnimatePresence initial={false}>
            <ArConnectBrowserExtensionApp
              initialScreenType={initialScreenType}
            />
          </AnimatePresence>
        </HistoryProvider>
      </Wouter>
    </ArConnectThemeProvider>
  );
}

export default ArConnectBrowserExtensionAppRoot;
