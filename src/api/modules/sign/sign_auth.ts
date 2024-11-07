import { sendMessage } from "@arconnect/webext-bridge";
import { bytesToChunks, deconstructTransaction } from "./transaction_builder";
import type Transaction from "arweave/web/lib/transaction";
import type { AuthResult } from "shim";
import {
  getAuthPopupWindowTabID,
  requestUserAuthorization
} from "../../../utils/auth/auth.utils";
import { nanoid } from "nanoid";
import type { ModuleAppData } from "~api/background/background-modules";
import { isomorphicSendMessage } from "~utils/messaging/messaging.utils";
import type { Chunk } from "~api/modules/sign/chunks";

/**
 * Request a manual signature for the transaction.
 * The user has to authenticate and sign the
 * transaction.
 *
 * @param tabURL App url
 * @param transaction Transaction to sign
 * @param address Address of the wallet that signs the tx
 */
export function signAuth(
  appData: ModuleAppData,
  transaction: Transaction,
  address: string
) {
  console.log("signAuth", transaction);

  return new Promise<AuthResult<{ id: string; signature: string } | undefined>>(
    async (resolve, reject) => {
      // generate chunks
      const {
        transaction: tx,
        dataChunks,
        tagChunks,
        chunkCollectionID: collectionID
      } = deconstructTransaction(transaction);

      // start auth
      requestUserAuthorization(
        {
          type: "sign",
          address,
          transaction: tx,
          collectionID
        },
        appData
      )
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });

      const popupWindowTabID = await getAuthPopupWindowTabID();

      try {
        console.log(
          `Sending ${dataChunks.concat(tagChunks).length || 0} txs chunks for`,
          collectionID,
          "to",
          popupWindowTabID
        );

        for (const chunk of dataChunks.concat(tagChunks)) {
          await isomorphicSendMessage({
            messageId: "auth_chunk",
            tabId: popupWindowTabID,
            data: chunk
          });
        }

        console.log(
          `Sending "end" chunk for`,
          collectionID,
          "to",
          popupWindowTabID
        );

        const endChunk: Chunk = {
          collectionID,
          type: "end",
          index: dataChunks.concat(tagChunks).length
        };

        await isomorphicSendMessage({
          messageId: "auth_chunk",
          tabId: popupWindowTabID,
          data: endChunk
        });

        console.log(
          "Done sending txs chunks for",
          collectionID,
          "to",
          popupWindowTabID
        );
      } catch (err) {
        return reject(
          `Error in signAuth while sending a data chunk of collection "${collectionID}": \n${err}`
        );
      }
    }
  );
}

export type AuthKeystoneType = "Message" | "DataItem";

export interface AuthKeystoneData {
  type: AuthKeystoneType;
  data: Uint8Array;
}

export function signAuthKeystone(
  appData: ModuleAppData,
  dataToSign: AuthKeystoneData
) {
  return new Promise<AuthResult<{ id: string; signature: string } | undefined>>(
    async (resolve, reject) => {
      // generate chunks
      const collectionID = nanoid();
      const dataChunks = bytesToChunks(dataToSign.data, collectionID, 0);

      // start auth
      requestUserAuthorization(
        {
          type: "signKeystone",
          keystoneSignType: dataToSign.type,
          collectionID
        },
        appData
      )
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });

      const popupWindowTabID = await getAuthPopupWindowTabID();

      try {
        console.log(
          `Sending ${dataChunks.length || 0} txs chunks for`,
          collectionID,
          "to",
          popupWindowTabID
        );

        for (const chunk of dataChunks) {
          console.log("CHUNK", collectionID);

          await isomorphicSendMessage({
            messageId: "auth_chunk",
            tabId: popupWindowTabID,
            data: chunk
          });
        }

        console.log(
          `Sending "end" chunk for`,
          collectionID,
          "to",
          popupWindowTabID
        );

        const endChunk: Chunk = {
          collectionID,
          type: "end",
          index: dataChunks.length
        };

        await isomorphicSendMessage({
          messageId: "auth_chunk",
          tabId: popupWindowTabID,
          data: endChunk
        });

        console.log(
          "Done sending txs chunks for",
          collectionID,
          "to",
          popupWindowTabID
        );
      } catch (err) {
        return reject(
          `Error in signAuthKeystone while sending a data chunk of collection "${collectionID}": \n${err}`
        );
      }
    }
  );
}
