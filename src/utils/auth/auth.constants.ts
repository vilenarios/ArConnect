import type { UnlockAuthRequest } from "~utils/auth/auth.types";

export const AUTH_POPUP_CLOSING_DELAY_MS = 5000 as const;

export const DEFAULT_UNLOCK_AUTH_REQUEST_ID = "UNLOCK_AUTH_REQUEST_ID" as const;

export const DEFAULT_UNLOCK_AUTH_REQUEST = {
  type: "unlock",
  authID: DEFAULT_UNLOCK_AUTH_REQUEST_ID,
  status: "pending"
} as const satisfies UnlockAuthRequest;
