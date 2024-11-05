import type { ModuleAppData } from "~api/background/background-modules";
import type { AuthType, UnlockAuthRequestData } from "~utils/auth/auth.types";

export const AUTH_POPUP_CLOSING_DELAY_MS = 5000 as const;

export const DEFAULT_UNLOCK_AUTH_REQUEST_ID = "UNLOCK_AUTH_REQUEST_ID" as const;

export const DEFAULT_UNLOCK_AUTH_REQUEST = {
  type: "unlock"
} as const satisfies UnlockAuthRequestData;

export const DEFAULT_MODULE_APP_DATA = {
  tabID: -1,
  url: ""
} as const satisfies ModuleAppData;
