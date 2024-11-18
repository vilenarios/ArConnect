import type { ModuleAppData } from "~api/background/background-modules";

export const AUTH_POPUP_REQUEST_WAIT_MS = 1000 as const;
export const AUTH_POPUP_CLOSING_DELAY_MS = 5000 as const;

export const DEFAULT_MODULE_APP_DATA = {
  tabID: -1,
  url: ""
} as const satisfies ModuleAppData;

// Errors:

export const ERR_MSG_USER_CANCELLED_AUTH = "User cancelled the AuthRequest";
export const ERR_MSG_NO_WALLETS_ADDED = "No wallets added";
