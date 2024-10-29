import { onMessage, sendMessage } from "@arconnect/webext-bridge";
import type { AuthResult } from "shim";
import { nanoid } from "nanoid";
import browser from "webextension-polyfill";
import { Mutex } from "~utils/mutex";
import { isomorphicSendMessage } from "~utils/messaging/messaging.utils";
import type { AuthRequest, AuthType } from "~utils/auth/auth.types";

const mutex = new Mutex();
const popupMutex = new Mutex();

let keepAliveInterval: number | null = null;
let activePopups = 0;

/**
 * Authenticate the user from the background script.
 * Creates a popup window to authenticate and returns
 * the result of the process.
 *
 * @param data Data to send to the auth window
 */
export async function requestUserAuthorization(authRequest: AuthRequest) {
  console.log("authenticate");

  // create the popup
  const { authID, tabId } = await createAuthPopup(authRequest);

  // wait for the results from the popup
  return await getPopupResponse(authID, tabId);
}

let popupWindowTabID = -1;

/**
 * Create an authenticator popup
 *
 * @param data The data sent to the popup
 *
 * @returns ID of the authentication
 */
async function createAuthPopup(authRequest: AuthRequest) {
  // TODO: Update to check if there's already a popup and send messages to it and communicate using postMessage():

  const unlock = await popupMutex.lock();

  console.log("createAuthPopup", popupWindowTabID);

  let popupWindowTab: browser.Tabs.Tab | null = await browser.tabs
    .get(popupWindowTabID)
    .catch(() => null);

  if (
    !popupWindowTab ||
    !popupWindowTab.url.startsWith(browser.runtime.getURL("tabs/auth.html"))
  ) {
    const window = await browser.windows.create({
      // tabId: popupTabID,
      url: `${browser.runtime.getURL("tabs/auth.html")}#/`,
      focused: true,
      type: "popup",
      width: 385,
      height: 720
    });

    popupWindowTab = window.tabs[0];
    popupWindowTabID = popupWindowTab.id;

    console.log("NEW POPUP =", popupWindowTabID);
  } else {
    console.log("REUSE POPUP");
  }

  unlock();

  // Generate an unique id for the authentication to be checked later:
  const authID = authRequest.authID || nanoid();

  await isomorphicSendMessage({
    messageId: "authRequest",
    tabId: popupWindowTab.id,
    data: {
      ...authRequest,
      authID
    }
  });

  return {
    authID,
    tabId: popupWindowTabID
  };
}

/**
 * Await for a browser message from the popup
 */
export function getPopupResponse(authID: string, tabId: number) {
  console.log("getPopupResponse");

  return new Promise<AuthResult>(async (resolve, reject) => {
    startKeepAlive();

    console.log("LISTENING FOR auth_result...");

    onMessage("auth_result", ({ sender, data }) => {
      console.log("RECEIVED RESPONSE FOR auth_result", data);

      stopKeepAlive();

      // validate sender by it's tabId
      if (sender.tabId !== tabId) {
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
 * Function to send periodic keep-alive messages
 */
export async function startKeepAlive() {
  const unlock = await mutex.lock();

  try {
    // Increment the active popups count
    activePopups++;
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
export async function stopKeepAlive() {
  const unlock = await mutex.lock();

  try {
    // Decrement the active popups count
    activePopups--;
    if (activePopups <= 0 && keepAliveInterval !== null) {
      // Stop keep-alive messages when no popups are active
      browser.alarms.clear("keep-alive");
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
      console.log("Stopped keep-alive messages...");
    }
  } finally {
    unlock();
  }
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
