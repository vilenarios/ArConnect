import { GlobalStyle, useTheme } from "~utils/theme";
import { useHashLocation } from "~utils/hash_router";
import { Path, pathToRegexp } from "path-to-regexp";
import { Provider } from "@arconnect/components";
import { Router, Route } from "wouter";

import Home from "~routes/welcome";
import Start from "~routes/welcome/start";
import Setup from "~routes/welcome/setup";

import makeCachedMatcher from "wouter/matcher";

export default function Welcome() {
  const theme = useTheme();

  return (
    <Provider theme={theme}>
      <GlobalStyle />
      <Router hook={useHashLocation} matcher={customMatcher}>
        <Route path="/" component={Home} />
        <Route path="/start/:page" component={Start} />
        <Route path="/generate" component={Setup} />
        <Route path="/load" component={Setup} />
      </Router>
    </Provider>
  );
}

const convertPathToRegexp = (path: Path) => {
  let keys = [];

  // we use original pathToRegexp package here with keys
  const regexp = pathToRegexp(path, keys, { strict: true });
  return { keys, regexp };
};

const customMatcher = makeCachedMatcher(convertPathToRegexp);
