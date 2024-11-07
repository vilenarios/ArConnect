import {
  onMessage as webExtBridgeOnMessage,
  sendMessage as webExtBridgeSendMessage,
  type GetDataType,
  type GetReturnType,
  type OnMessageCallback,
  type ProtocolMap
} from "@arconnect/webext-bridge";

export type MessageID = keyof ProtocolMap;

export interface MessageData<K extends MessageID> {
  messageId: K;
  tabId?: number;
  data: ProtocolMap[K];
}

let messageCounter = 0;

export async function isomorphicSendMessage<K extends MessageID>({
  messageId,
  tabId,
  data
}: MessageData<K>) {
  // See the "Receive API calls" comment in `ArConnect/src/contents/api.ts` for more on message passing.

  const currentMessage = messageCounter++;

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

    console.log(`- 3. ${currentMessage}. Sending ${messageId}...`);

    sendMessage()
      .then((result) => {
        console.log(`- 3. ${currentMessage}. Ok ${messageId}.`);

        resolve(result);
      })
      .catch((err) => {
        if (
          !(err.message || "").endsWith(
            `No handler registered in 'web_accessible' to accept messages with id '${messageId}'`
          )
        ) {
          console.log(`- 3. ${currentMessage}. Error ${messageId}:`, err);

          reject(err);

          return;
        }

        console.log(`- 4. ${currentMessage}. Waiting for ready...`);

        // TODO: Make this generic:
        webExtBridgeOnMessage(
          `${messageId}_ready`,
          async ({ sender, data }) => {
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
                console.log(
                  `- 5. ${currentMessage}. Message again error:`,
                  err
                );

                reject(err);
              });
          }
        );
      });
  });
}

export function isomorphicOnMessage<K extends MessageID>(
  messageID: K,
  callback: OnMessageCallback<GetDataType<K, Data>, GetReturnType<K, any>>
): void {
  webExtBridgeOnMessage(messageID, callback);

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
