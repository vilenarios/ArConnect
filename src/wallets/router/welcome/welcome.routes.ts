import { HomeWelcomeView } from "~routes/welcome";
import { GettingStartedWelcomeView } from "~routes/welcome/gettingStarted";
import { SetupWelcomeView } from "~routes/welcome/setup";
import { StartWelcomeView } from "~routes/welcome/start";
import type { RouteConfig } from "~wallets/router/router.types";

// TODO: Update with functions to pass params and replace in all usages:

export const WelcomePaths = {
  Home: "/",
  Start: "/start/:page",
  GettingStarted: "/getting-started/:page",
  Setup: "/:setupMode/:page"
} as const;

export const WELCOME_ROUTES = [
  {
    path: WelcomePaths.Home,
    component: HomeWelcomeView
  },
  {
    path: WelcomePaths.Start,
    component: StartWelcomeView
  },
  {
    path: WelcomePaths.GettingStarted,
    component: GettingStartedWelcomeView
  },
  {
    path: WelcomePaths.Setup,
    component: SetupWelcomeView
  }
] as const satisfies RouteConfig[];
