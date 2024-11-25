import { useState, useEffect } from "react";
import { handleSyncLabelsAlarm } from "~api/background/handlers/alarms/sync-labels/sync-labels-alarm.handler";
import { ExtensionStorage } from "~utils/storage";
import {
  getActiveAddress,
  getWallets,
  openOrSelectWelcomePage
} from "~wallets";
import { getDecryptionKey } from "~wallets/auth";
import type { InitialScreenType } from "~wallets/setup/wallet-setup.types";

/**
 * Hook that opens a new tab if ArConnect has not been set up yet
 */
export function useEmbeddedWalletSetUp() {
  console.log(`useEmbeddedWalletSetUp()`);

  const [initialScreenType, setInitialScreenType] =
    useState<InitialScreenType>("cover");

  // TODO: Get all usages of `getDecryptionKey` as we won't be using this in the embedded wallet...

  // TODO: There's no "disconnect" in the embedded wallet.

  useEffect(() => {
    async function checkWalletState() {
      const [activeAddress, wallets, decryptionKey] = await Promise.all([
        getActiveAddress(),
        getWallets(),
        getDecryptionKey()
      ]);

      const hasWallets = activeAddress && wallets.length > 0;

      let nextInitialScreenType: InitialScreenType = "cover";

      switch (walletType) {
        case "extension": {
          if (!hasWallets) {
            // This should only happen when opening the regular popup, but not for the auth popup, as the
            // `createAuthPopup` will open the welcome page directly, instead of the popup, if needed:

            openOrSelectWelcomePage(true);

            window.top.close();
          } else if (!decryptionKey) {
            nextInitialScreenType = "locked";
          } else {
            nextInitialScreenType = "default";
          }

          break;
        }

        case "embedded": {
          nextInitialScreenType = !hasWallets ? "generating" : "default";

          break;
        }

        default: {
          throw new Error(`Unknown APP_TYPE = ${walletType}`);
        }
      }

      setInitialScreenType(nextInitialScreenType);

      const coverElement = document.getElementById("cover");

      if (coverElement) {
        if (nextInitialScreenType === "cover") {
          coverElement.removeAttribute("aria-hidden");
        } else {
          coverElement.setAttribute("aria-hidden", "true");
        }
      }
    }

    ExtensionStorage.watch({
      decryption_key: checkWalletState
    });

    checkWalletState();

    handleSyncLabelsAlarm();

    return () => {
      ExtensionStorage.unwatch({
        decryption_key: checkWalletState
      });
    };
  }, []);

  return initialScreenType;
}
