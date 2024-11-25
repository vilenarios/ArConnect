import { sendMessage } from "@arconnect/webext-bridge";
import type { StorageChange } from "~utils/runtime";
import Application from "~applications/application";
import { forEachTab } from "~applications/tab";
import { getAppURL } from "~utils/format";
import { isomorphicSendMessage } from "~utils/messaging/messaging.utils";
import { getCachedAuthPopupWindowTabID } from "~utils/auth/auth.utils";

/**
 * Active address change event listener.
 * Sends a message to fire the "walletSwitch"
 * event in the tab.
 */
export async function handleActiveAddressChange({
  oldValue,
  newValue: newAddress
}: StorageChange<string>) {
  if (!newAddress || oldValue === newAddress) return;

  // go through all tabs and check if they
  // have the permissions to receive the
  // wallet switch event
  await forEachTab(async (tab) => {
    const app = new Application(getAppURL(tab.url));

    // check required permissions
    const permissionCheck = await app.hasPermissions([
      "ACCESS_ALL_ADDRESSES",
      "ACCESS_ADDRESS"
    ]);

    // app not connected
    if (permissionCheck.has.length === 0) return;

    // trigger emitter
    await sendMessage(
      "event",
      {
        name: "activeAddress",
        value: permissionCheck.result ? newAddress : null
      },
      `content-script@${tab.id}`
    );

    const popupTabID = getCachedAuthPopupWindowTabID();

    if (popupTabID) {
      isomorphicSendMessage({
        messageId: "auth_active_wallet_change",
        tabId: popupTabID,
        data: tab.id
      });
    }

    // trigger event via message
    await sendMessage(
      "switch_wallet_event",
      permissionCheck ? newAddress : null,
      `content-script@${tab.id}`
    );
  });
}
