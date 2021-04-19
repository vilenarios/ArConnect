import { browser } from "webextension-polyfill-ts";
import { walletsStored } from "./background";
import { log } from "./logger";
import bcrypt from "bcryptjs";

/**
 * Check if the password is valid
 *
 * @param password Password to check for
 *
 * @returns if the password is valid
 */
export async function checkPassword(password: string) {
  const hash = (await browser.storage.local.get("hash"))?.hash;
  if (!hash) throw new Error();

  return await bcrypt.compare(password, hash);
}

/**
 * Update / set password
 *
 * @param password Password to set
 */
export async function setPassword(password: string) {
  await browser.storage.local.set({
    hash: await bcrypt.hash(password, 10)
  });
  log("Updated password", __relativefilename, __line);
}

/**
 * This function checks if the user is still using
 * the old password system. If it does, it updates
 * the stores to use the new one
 */
export async function fixupPasswords() {
  const data = await browser.storage.local.get(["hash", "decryptionKey"]);

  if (
    !data.hash &&
    (await walletsStored()) &&
    typeof data.decryptionKey !== "boolean"
  ) {
    await browser.storage.local.set({
      decryptionKey: false,
      hash: await bcrypt.hash(data.decryptionKey, 10)
    });
    log("Fixed up password", __relativefilename, __line);
  }
}

/**
 * Sign out from ArConnect
 * Deletes everything from storage
 */
export async function logOut() {
  await browser.storage.local.clear();
  await browser.tabs.create({ url: browser.runtime.getURL("/welcome.html") });
  log("Logged out", __relativefilename, __line, "warn");
}
