import type { ModuleAppData } from "~api/background/background-modules";
import type { UnlockAuthRequestData } from "~utils/auth/auth.types";

export const AUTH_POPUP_REQUEST_WAIT_MS = 1000 as const;
export const AUTH_POPUP_CLOSING_DELAY_MS = 5000 as const;

export const DEFAULT_UNLOCK_AUTH_REQUEST_DATA = {
  type: "unlock"
} as const satisfies UnlockAuthRequestData;

export const DEFAULT_MODULE_APP_DATA = {
  tabID: -1,
  url: ""
} as const satisfies ModuleAppData;
