import { onMessage, sendMessage } from "@arconnect/webext-bridge";
import type { AuthResult } from "shim";
import { nanoid } from "nanoid";
import browser from "webextension-polyfill";
import { Mutex } from "~utils/mutex";
import { isomorphicSendMessage } from "~utils/messaging/messaging.utils";
import type { AuthRequestData, AuthType } from "~utils/auth/auth.types";
import { DEFAULT_UNLOCK_AUTH_REQUEST_ID } from "~utils/auth/auth.constants";
import type { ModuleAppData } from "~api/background/background-modules";

const popupMutex = new Mutex();

type PopupUpdatedCallback = (popupTabID: number) => void;

let popupUpdatedCallbacks: PopupUpdatedCallback[] = [];

let POPUP_TAB_ID = -1;

function setPopupTabID(popupTabID: number) {
  POPUP_TAB_ID = popupTabID;

  popupUpdatedCallbacks.forEach((cb) => {
    cb(popupTabID);
  });

  popupUpdatedCallbacks = [];
}

function onPopupTabUpdated(cb: PopupUpdatedCallback) {
  if (POPUP_TAB_ID !== -1) return cb(POPUP_TAB_ID);

  popupUpdatedCallbacks.push(cb);
}

export function getCachedAuthPopupWindowTabID() {
  return POPUP_TAB_ID;
}

export function getAuthPopupWindowTabID() {
  if (POPUP_TAB_ID !== -1) return Promise.resolve(POPUP_TAB_ID);

  return new Promise<number>((resolve) => {
    onPopupTabUpdated((popupTabID) => {
      resolve(popupTabID);
    });
  });
}

/**
 * Authenticate the user from the background script.
 * Creates a popup window to authenticate and returns
 * the result of the process.
 *
 * @param data Data to send to the auth window
 */
export async function requestUserAuthorization(
  authRequestData: AuthRequestData,
  moduleAppData: ModuleAppData
) {
  console.log("- 1. Request user authorization");

  // create the popup
  const { authID, popupWindowTabID } = await createAuthPopup(
    authRequestData,
    moduleAppData
  );

  // wait for the results from the popup
  return await getPopupResponse(authID, popupWindowTabID);
}

/**
 * Create or reuse an authenticator popup to handle an `AuthRequest`.
 *
 * @param data The data sent to the popup
 *
 * @returns ID of the authentication
 */
async function createAuthPopup(
  authRequestData: AuthRequestData,
  moduleAppData: ModuleAppData
) {
  const unlock = await popupMutex.lock();

  const popupWindowTab: browser.Tabs.Tab | null = await browser.tabs
    .get(POPUP_TAB_ID)
    .catch(() => null);

  if (
    !popupWindowTab ||
    !popupWindowTab.url.startsWith(browser.runtime.getURL("tabs/auth.html"))
  ) {
    const window = await browser.windows.create({
      url: `${browser.runtime.getURL("tabs/auth.html")}#/`,
      focused: true,
      type: "popup",
      width: 385,
      height: 720
    });

    setPopupTabID(window.tabs[0].id);

    console.log("- 2. Create popup", POPUP_TAB_ID);
  } else {
    console.log("- 2. Reuse popup", POPUP_TAB_ID);
  }

  unlock();

  // Generate an unique id for the authentication to be checked later:
  const authID =
    authRequestData.type === "unlock"
      ? DEFAULT_UNLOCK_AUTH_REQUEST_ID
      : nanoid();

  await isomorphicSendMessage({
    messageId: "auth_request",
    tabId: popupWindowTab.id,
    data: {
      ...authRequestData,
      url: moduleAppData.url,
      tabID: moduleAppData.tabID,
      authID,
      requestedAt: Date.now(),
      status: "pending"
    }
  });

  return {
    authID,
    popupWindowTabID: POPUP_TAB_ID
  };
}

/**
 * Await for a browser message from the popup
 */
export function getPopupResponse(authID: string, popupWindowTabID: number) {
  return new Promise<AuthResult>(async (resolve, reject) => {
    startKeepAlive(authID);

    console.log("- 6. Waiting for popup response...");

    onMessage("auth_result", ({ sender, data }) => {
      console.log("- 6. Popup response:", data);

      stopKeepAlive(authID);

      // validate sender by it's tabId
      if (sender.tabId !== popupWindowTabID) {
        return;
      }

      // ensure the auth ID and the auth type
      // matches the requested ones
      if (data.authID !== authID) {
        return;
      }

      // check the result
      if (data.error) {
        reject(data.data);
      } else {
        resolve(data);
      }
    });
  });
}

/**
 * Send the result as a response to the auth
 *
 * @param type Type of the auth
 * @param authID ID of the auth
 * @param errorMessage Optional error message. If defined, the auth will fail with this message
 * @param data Auth data
 */
export async function replyToAuthRequest(
  type: AuthType,
  authID: string,
  errorMessage?: string,
  data?: any
) {
  console.log("replyToAuthRequest", type, authID);

  const response: AuthResult = {
    type,
    authID,
    error: !!errorMessage,
    data: data || errorMessage
  };

  // send the response message
  await sendMessage("auth_result", response, "background");
}

// KEEP ALIVE ALARM:

let keepAliveInterval: number | null = null;

const activeAuthRequests = new Set();

const mutex = new Mutex();

/**
 * Function to send periodic keep-alive messages
 */
export async function startKeepAlive(authID: string) {
  const unlock = await mutex.lock();

  try {
    activeAuthRequests.add(authID);

    const activePopups = activeAuthRequests.size;

    if (activePopups > 0 && keepAliveInterval === null) {
      console.log("Started keep-alive messages...");

      keepAliveInterval = setInterval(
        () => browser.alarms.create("keep-alive", { when: Date.now() + 1 }),
        20000
      );
    }
  } finally {
    unlock();
  }
}

/**
 * Function to stop sending keep-alive messages
 */
export async function stopKeepAlive(authID: string) {
  const unlock = await mutex.lock();

  try {
    activeAuthRequests.delete(authID);

    const activePopups = activeAuthRequests.size;

    if (activePopups <= 0 && keepAliveInterval !== null) {
      console.log("Stopped keep-alive messages...");

      browser.alarms.clear("keep-alive");
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
  } finally {
    unlock();
  }
}
