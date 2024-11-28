import { useState, useEffect } from "react";
import { handleSyncLabelsAlarm } from "~api/background/handlers/alarms/sync-labels/sync-labels-alarm.handler";
import { ExtensionStorage } from "~utils/storage";
import { getActiveAddress, getWallets } from "~wallets";
import { getDecryptionKey } from "~wallets/auth";
import type { InitialScreenType } from "~wallets/setup/wallet-setup.types";

/**
 * Hook that opens a new tab if ArConnect has not been set up yet
 */
export function useEmbeddedWalletSetUp() {
  const [initialScreenType, setInitialScreenType] =
    useState<InitialScreenType>("cover");

  useEffect(() => {
    async function checkWalletState() {
      const [activeAddress, wallets, decryptionKey] = await Promise.all([
        getActiveAddress(),
        getWallets(),
        getDecryptionKey()
      ]);

      const hasWallets = activeAddress && wallets.length > 0;

      let nextInitialScreenType: InitialScreenType = "cover";

      if (!isAuthenticated) {
        nextInitialScreenType = "/authenticate";
      } else if (!hasWallets) {
        nextInitialScreenType = "/generate";
      } else if (!hasShards) {
        // TODO: Add a passive warning about this and allow people to use the wallet in watch-only mode:
        nextInitialScreenType = "/add-device";
      } else {
        nextInitialScreenType = "default";
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
