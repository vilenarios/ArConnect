import { useHashLocation } from "wouter/use-hash-location";
import { Router as Wouter } from "wouter";

import { ArConnectThemeProvider } from "~components/hardware/HardwareWalletTheme";
import { useRemoveCover } from "~wallets/setup/non/non-wallet-setup.hook";
import { BodyScroller } from "~wallets/router/router.utils";
import { AnimatePresence } from "framer-motion";
import { Routes } from "~wallets/router/routes.component";
import { WELCOME_ROUTES } from "~wallets/router/welcome/welcome.routes";
import { ErrorBoundary } from "~utils/error/ErrorBoundary/errorBoundary";

export function ArConnectWelcomeApp() {
  return <Routes routes={WELCOME_ROUTES} pageComponent={null} />;
}

export function ArConnectWelcomeAppRoot() {
  useRemoveCover();

  return (
    <ArConnectThemeProvider>
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <Wouter hook={useHashLocation}>
          <BodyScroller />
          <AnimatePresence initial={false}>
            <ArConnectWelcomeApp />
          </AnimatePresence>
        </Wouter>
      </ErrorBoundary>
    </ArConnectThemeProvider>
  );
}

export default ArConnectWelcomeAppRoot;
