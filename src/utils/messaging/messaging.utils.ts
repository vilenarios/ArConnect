import {
  onMessage,
  sendMessage as webExtBridgeSendMessage,
  type DataTypeKey,
  type GetDataType,
  type GetReturnType,
  type OnMessageCallback
} from "@arconnect/webext-bridge";

export interface SendMessageResult<T> {
  messageId: string;
  tabId?: number;
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
    const result = await webExtBridgeSendMessage(
      messageId,
      data,
      tabId ? `web_accessible@${tabId}` : "background"
    );

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

    console.log(`- 3. ${currentMessage}. Sending message now...`);

    sendMessage()
      .then((result) => {
        console.log(`- 3. ${currentMessage}. Message Ok`);

        resolve(result);
      })
      .catch((err) => {
        if (
          !(err.message || "").endsWith(
            `No handler registered in 'web_accessible' to accept messages with id '${messageId}'`
          )
        ) {
          console.log(
            `- 3. ${currentMessage}. Message error (${messageId}):`,
            err
          );

          reject(err);

          return;
        }

        console.log(`- 4. ${currentMessage}. Waiting for ready...`);

        // TODO: Make this generic:
        onMessage(`${messageId}_ready`, async ({ sender, data }) => {
          // console.log("ready received");

          // validate sender by it's tabId
          if (sender.tabId !== tabId) {
            return;
          }

          console.log(`- 5. ${currentMessage}. Sending message again...`);

          await sendMessage()
            .then((result) => {
              console.log(`- 5. ${currentMessage}. Message again Ok`);

              resolve(result);
            })
            .catch((err) => {
              console.log(`- 5. ${currentMessage}. Message again error:`, err);

              reject(err);
            });
        });
      });
  });
}

export function isomorphicOnMessage<
  Data extends {},
  K extends DataTypeKey | string
>(
  messageID: K,
  callback: OnMessageCallback<GetDataType<K, Data>, GetReturnType<K, any>>
): void {
  onMessage(messageID, callback);

  isomorphicSendMessage({
    messageId: `${messageID}_ready`,
    data: {}
  });

  // TODO: Can the first message submission from isomorphicSendMessage fail and the "ready" event never be received?
  // TODO: Maybe not needed? This should be done automatically from isomorphicOnMessage

  /*

  retryWithDelay(() => {
    return sendMessage("ready", {}).catch((err) => {
      if (
        err.message ===
        "No handler registered in 'background' to accept messages with id 'ready'"
      ) {
        console.log(
          "AuthProvider - Ready message sent before background started listening. Retrying...",
          err
        );
      }

      throw err;
    });
  }).catch((err) => {
    console.log("AuthProvider - Ready message failed after retrying:", err);
  });

  */
}

export function useIsomorphicOnMessage() {}
