import {
  onMessage,
  sendMessage as webExtBridgeSendMessage
} from "@arconnect/webext-bridge";

export interface SendMessageResult<T> {
  messageId: string;
  tabId: number;
  data: T;
}

let messageCounter = 0;

export async function isomorphicSendMessage<T extends {}>({
  messageId,
  tabId,
  data
}: SendMessageResult<T>) {
  const currentMessage = messageCounter++;

  // TODO: Background sends this using sendMessage, which the content script receives and re-throws with postMessage.

  // TODO: The embedded wallet directly uses postMessage from the iframe to the parent.

  // TODO: Just send it and wait for ACK.

  async function sendMessage() {
    console.log(currentMessage, "SENT");

    const result = await webExtBridgeSendMessage(
      messageId,
      data,
      `web_accessible@${tabId}`
    );

    console.log(currentMessage, "RECEIVED", result);

    // check the result
    if (
      result &&
      typeof result === "object" &&
      result.hasOwnProperty("error")
    ) {
      throw new Error(
        result.hasOwnProperty("data")
          ? (result as any).data
          : "Unknown webExtBridge error."
      );
    }

    return result;
  }

  return new Promise(async (resolve, reject) => {
    // TODO: Timeout and retry if it doesn't return in X seconds...

    console.log(currentMessage, "sendMessage now...");

    sendMessage()
      .then((result) => {
        console.log(currentMessage, "sendMessage now ok");

        resolve(result);
      })
      .catch((err) => {
        if (
          err.message !==
          "No handler registered in 'web_accessible' to accept messages with id 'authRequest'"
        ) {
          console.log(currentMessage, "sendMessage now error", err);

          reject(err);

          return;
        }

        console.log(currentMessage, "sendMessage waiting for ready", err);

        onMessage("ready", async ({ sender, data }) => {
          // console.log("ready received");

          // validate sender by it's tabId
          if (sender.tabId !== tabId) {
            return;
          }

          console.log(currentMessage, "sendMessage after ready...");

          await sendMessage()
            .then((result) => {
              console.log(currentMessage, "sendMessage after ready ok");

              resolve(result);
            })
            .catch((err) => {
              console.log(currentMessage, "sendMessage after ready error", err);

              reject(err);
            });
        });
      });
  });
}
