import { useHashLocation } from "wouter/use-hash-location";
import { Router, Route } from "wouter";

import Home from "~routes/welcome";
import Start from "~routes/welcome/start";
import Setup from "~routes/welcome/setup";
import GettingStarted from "~routes/welcome/gettingStarted";

import { ArConnectThemeProvider } from "~components/hardware/HardwareWalletTheme";
import { useRemoveCover } from "~wallets/setup/non/non-wallet-setup.hook";

export default function Welcome() {
  useRemoveCover();

  // TODO: Make sure the router still works without the custom matcher:

  return (
    <ArConnectThemeProvider>
      <Router hook={useHashLocation}>
        <Route path="/" component={Home} />
        <Route path="/start/:page" component={Start} />
        <Route path="/getting-started/:page">
          {(params: { page: string }) => (
            <GettingStarted page={Number(params.page)} />
          )}
        </Route>

        <Route path="/:setupMode(generate|load)/:page">
          {(params: { setupMode: "generate" | "load"; page: string }) => (
            <Setup setupMode={params.setupMode} page={Number(params.page)} />
          )}
        </Route>
      </Router>
    </ArConnectThemeProvider>
  );
}

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
