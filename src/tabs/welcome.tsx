import { useHashLocation } from "wouter/use-hash-location";
import { Route, Router as Wouter } from "wouter";

import { ArConnectThemeProvider } from "~components/hardware/HardwareWalletTheme";
import { useRemoveCover } from "~wallets/setup/non/non-wallet-setup.hook";
import { BodyScroller } from "~wallets/router/router.utils";
import { AnimatePresence } from "framer-motion";
import { Routes } from "~wallets/router/routes.component";
import { WELCOME_ROUTES } from "~wallets/router/welcome/welcome.routes";

export function ArConnectWelcomeApp() {
  return <Routes routes={WELCOME_ROUTES} />;
}

export function ArConnectWelcomeAppRoot() {
  useRemoveCover();

  return (
    <ArConnectThemeProvider>
      <Wouter hook={useHashLocation}>
        <BodyScroller />

        <AnimatePresence initial={false}>
          <ArConnectWelcomeApp />
        </AnimatePresence>
      </Wouter>
    </ArConnectThemeProvider>
  );
}

export default ArConnectWelcomeAppRoot;

// TODO: Make sure the router still works without the custom matcher:

/*
import makeCachedMatcher from "wouter/matcher";

const convertPathToRegexp = (path: Path) => {
  let keys = [];

  // we use original pathToRegexp package here with keys
  const regexp = pathToRegexp(path, keys, { strict: true });
  return { keys, regexp };
};

const customMatcher = makeCachedMatcher(convertPathToRegexp);
*/
