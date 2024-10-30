import type { UnlockAuthRequest } from "~utils/auth/auth.types";

export const DEFAULT_UNLOCK_AUTH_REQUEST_ID = "UNLOCK_AUTH_REQUEST_ID";

export const DEFAULT_UNLOCK_AUTH_REQUEST: UnlockAuthRequest = {
  type: "unlock",
  authID: DEFAULT_UNLOCK_AUTH_REQUEST_ID,
  status: "pending"
};
