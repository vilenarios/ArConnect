import {
  onMessage as webExtBridgeOnMessage,
  sendMessage as webExtBridgeSendMessage,
  type IBridgeMessage,
  type ProtocolMap
} from "@arconnect/webext-bridge";

export type MessageID = keyof ProtocolMap;

export interface MessageData<K extends MessageID> {
  messageId: K;
  tabId?: number;
  data: ProtocolMap[K];
}

let messageCounter = 0;

/**
 * Send a message of `<messageId>` type to the specific `tabId` or background straight away. If that message fails
 * because no one is listening, listen for `<messageId>_ready` messages for 6 seconds, and try to send the message again
 * once that's received, or throw a time out error otherwise.
 */
export async function isomorphicSendMessage<K extends MessageID>({
  messageId,
  tabId,
  data
}: MessageData<K>) {
  // See the "Receive API calls" comment in `ArConnect/src/contents/api.ts` for more on message passing.

  const currentMessage = messageCounter++;

  const destination = tabId ? `web_accessible@${tabId}` : "background";

  async function sendMessage() {
    const result = await webExtBridgeSendMessage(
      messageId,
      data as any,
      destination
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
    let timeoutTimeoutID = 0;
    let retryIntervalID = 0;

    function resolveAndClearTimeouts(value: unknown) {
      clearTimeout(timeoutTimeoutID);
      clearInterval(retryIntervalID);

      resolve(value);
    }

    function rejectAndClearTimeouts(reason?: any) {
      clearTimeout(timeoutTimeoutID);
      clearInterval(retryIntervalID);

      reject(reason);
    }

    console.log(`- 3. ${currentMessage}. Sending ${messageId}...`);

    sendMessage()
      .then((result) => {
        console.log(`- 3. ${currentMessage}. Ok ${messageId}.`);

        resolveAndClearTimeouts(result);
      })
      .catch((err) => {
        const errorMessage = `${err.message || ""}`;

        if (
          !/No handler registered in '.+' to accept messages with id '.+'/.test(
            errorMessage
          )
        ) {
          console.log(`- 3. ${currentMessage}. Error ${messageId}:`, err);

          rejectAndClearTimeouts(err);

          return;
        }

        console.log(`- 4. ${currentMessage}. Waiting for ready...`);

        // TODO: Review this is only for ready messages?
        timeoutTimeoutID = setTimeout(() => {
          reject(
            new Error(
              `Timed out waiting for ${messageId}_ready from ${destination}`
            )
          );
        }, 6000);

        // TODO: Implement retry in case the initial call to `sendMessage()` above fails and the "ready" event is never
        // received (e.g. popup opens, `sendMessage()` fails, background sends "ready" event, popup starts listening for
        // ready event).
        // retryIntervalID = setInterval(() => {}, 2000);

        async function handleTabReady({ sender }: IBridgeMessage<any>) {
          // validate sender by it's tabId
          if (sender.tabId !== tabId) {
            return;
          }

          console.log(`- 5. ${currentMessage}. Sending message again...`);

          await sendMessage()
            .then((result) => {
              console.log(`- 5. ${currentMessage}. Message again Ok`);

              resolveAndClearTimeouts(result);
            })
            .catch((err) => {
              console.log(`- 5. ${currentMessage}. Message again error:`, err);

              rejectAndClearTimeouts(err);
            });
        }

        webExtBridgeOnMessage(`${messageId}_ready`, handleTabReady as any);
      });
  });
}

export function isomorphicOnMessage<K extends MessageID, R>(
  messageID: K,
  callback: (
    message: Omit<IBridgeMessage<any>, "data"> & { data: ProtocolMap[K] }
  ) => void
): void {
  webExtBridgeOnMessage(messageID, callback as any);

  isomorphicSendMessage({
    messageId: `${messageID}_ready` as any,
    data: null
  });
}
