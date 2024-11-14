import Application from "~applications/application";
import { getTab } from "~applications/tab";
import {
  getCachedAuthPopupWindowTabID,
  resetPopupTabID
} from "~utils/auth/auth.utils";
import { createContextMenus } from "~utils/context_menus";
import { getAppURL } from "~utils/format";
import { updateIcon } from "~utils/icon";
import { isomorphicSendMessage } from "~utils/messaging/messaging.utils";
import browser from "webextension-polyfill";

/**
 * Handle tab updates (icon change, context menus, etc.)
 *
 * @param tabId ID of the tab to get.
 */
export async function handleTabUpdate(
  tabID: number,
  changeInfo?: browser.Tabs.OnUpdatedChangeInfoType
) {
  const popupTabID = getCachedAuthPopupWindowTabID();

  if (popupTabID !== -1 && changeInfo?.status === "loading") {
    isomorphicSendMessage({
      messageId: "auth_tab_reloaded",
      tabId: popupTabID,
      data: tabID
    });
  }

  // construct app
  const tab = await getTab(tabID);

  // if we cannot parse the tab URL, the extension is not connected
  if (!tab?.url) {
    updateIcon(false);
    createContextMenus(false);
    return;
  }

  const app = new Application(getAppURL(tab.url));

  // change icon to "connected" status if
  // the site is connected and add the
  // context menus
  const connected = await app.isConnected();

  updateIcon(connected);
  createContextMenus(connected);
}

/**
 * Notifies the auth popup about closed tab for it to abort AuthRequests coming from those tabs.
 *
 * @param tabId ID of the closed tab.
 */
export function handleTabClosed(closedTabID: number) {
  const popupTabID = getCachedAuthPopupWindowTabID();

  // If there's no popup, then we do nothing:
  if (popupTabID === -1) return;

  // If the closed tab was the popup, we reset its ID.
  if (closedTabID === popupTabID) {
    resetPopupTabID();

    return;
  }

  // If some other tab was closed and there's a popup, notify the popup in case it has AuthRequest from the closed tab:
  isomorphicSendMessage({
    messageId: "auth_tab_closed",
    tabId: popupTabID,
    data: closedTabID
  });
}
