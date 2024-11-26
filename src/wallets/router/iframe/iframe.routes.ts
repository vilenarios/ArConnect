import { AUTH_ROUTES } from "~wallets/router/auth/auth.routes";
import { POPUP_ROUTES } from "~wallets/router/popup/popup.routes";
import type { RouteConfig } from "~wallets/router/router.types";
import { prefixRoutes } from "~wallets/router/router.utils";

const IFRAME_OWN_ROUTES: RouteConfig[] = [
  {
    path: "/auth/foo",
    // TODO: Add placeholder pages here...
    component: null
  },
  {
    path: "/auth/bar",
    component: null
  }
];

export const IFRAME_ROUTES: RouteConfig[] = [
  // popup.tsx:
  ...POPUP_ROUTES,

  // auth.tsx:
  // TODO: How to add this prefix to routes to when using push(), etc? ENV variable in the enum?
  ...prefixRoutes(AUTH_ROUTES, "/auth-request"),

  // Embedded wallet only:
  ...IFRAME_OWN_ROUTES
];
