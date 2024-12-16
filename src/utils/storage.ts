import type Transaction from "arweave/web/lib/transaction";
import { type Gateway } from "~gateways/gateway";
import { Storage } from "@plasmohq/storage";
import browser from "webextension-polyfill";

/**
 * Default local extension storage, with values
 * that are NOT copied to window.localStorage
 */
export const ExtensionStorage = new Storage({
  area: "local"
  // This copies the data to localStorage:
  // allCopied: true,
});

/**
 * Temporary storage for submitted transfers, with values
 * that are NOT copied to window.sessionStorage
 */
export const TempTransactionStorage = new Storage({
  area: "session"
  // This copies the data to localStorage, NOT to sessionStorage:
  // allCopied: true,
});

/**
 * Session storage raw transfer tx. This will
 * be signed, submitted and removed after
 * authentication.
 */
export const TRANSFER_TX_STORAGE = "last_transfer_tx";

/**
 * Name of old ArConnect versions' storage.
 */
export const OLD_STORAGE_NAME = "persist:root";

/**
 * Raw transfer tx stored in the session storage
 */
export interface RawStoredTransfer {
  type: "native" | "token";
  gateway: Gateway;
  transaction: ReturnType<Transaction["toJSON"]>;
}

export const ARCONNECT_THEME_BACKGROUND_COLOR =
  "ARCONNECT_THEME_BACKGROUND_COLOR";
export const ARCONNECT_THEME_TEXT_COLOR = "ARCONNECT_THEME_TEXT_COLOR";

/**
 * Clear all storage keys except for gateways.
 */
export async function resetStorage() {
  localStorage.removeItem(ARCONNECT_THEME_BACKGROUND_COLOR);
  localStorage.removeItem(ARCONNECT_THEME_TEXT_COLOR);

  // get all keys except gateways
  const allStoredKeys = Object.keys(
    (await browser.storage.local.get(null)) || {}
  ).filter((key) => key !== "gateways");

  // remove all keys except gateways
  await Promise.allSettled(
    allStoredKeys.map((key) => ExtensionStorage.remove(key))
  );
}
