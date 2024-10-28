import {
  onMessage,
  sendMessage as webExtBridgeSendMessage
} from "@arconnect/webext-bridge";
import { ClockSnooze } from "@untitled-ui/icons-react";

export interface SendMessageResult<T> {
  messageId: string;
  tabId: number;
  data: T;
}

export async function isomorphicSendMessage<T extends {}>({
  messageId,
  tabId,
  data
}: SendMessageResult<T>) {
  // TODO: Background sends this using sendMessage, which the content script receives and re-throws with postMessage.

  // TODO: The embedded wallet directly uses postMessage from the iframe to the parent.

  // TODO: Just send it and wait for ACK.

  async function sendMessage(resolve, reject) {
    console.log("THIS IS SENT");
    const result = await webExtBridgeSendMessage(
      messageId,
      data,
      `web_accessible@${tabId}`
    );
    console.log("BUT WE NEVER GET HERE");

    // check the result
    if ((result as any).error) {
      reject((data as any).data);
    } else {
      resolve(data);
    }
  }

  return new Promise(async (resolve, reject) => {
    onMessage("ready", async ({ sender, data }) => {
      console.log("ready received");

      // validate sender by it's tabId
      if (sender.tabId !== tabId) {
        return;
      }

      console.log("sendMessage 1...");
      await sendMessage(resolve, reject);
      console.log("sendMessage 1 ok");
    });

    // TODO: Timeout and retry if it doesn't return in X seconds...
    console.log("sendMessage 2...");
    await sendMessage(resolve, reject);
    console.log("sendMessage 2 ok");
  });
}
