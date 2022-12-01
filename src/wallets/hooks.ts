import type { WalletInterface } from "~components/welcome/load/Migrate";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { defaultGateway } from "~applications/gateway";
import { AnsUser, getAnsProfile } from "~lib/ans";
import { useEffect, useState } from "react";
import Arweave from "arweave";

export function useWalletsDetails(wallets: JWKInterface[]) {
  const [walletDetails, setWalletDetails] = useState<WalletInterface[]>([]);

  useEffect(() => {
    (async () => {
      const arweave = new Arweave(defaultGateway);
      const details: WalletInterface[] = [];

      // load wallet addresses
      for (const wallet of wallets) {
        const address = await arweave.wallets.getAddress(wallet);

        // skip already added wallets
        if (!!walletDetails.find((w) => w.address === address)) {
          continue;
        }

        details.push({ address });
      }

      // load ans labels
      const profiles = (await getAnsProfile(
        details.map((w) => w.address)
      )) as AnsUser[];

      for (const wallet of details) {
        const profile = profiles.find((p) => p.user === wallet.address);

        if (!profile?.currentLabel) continue;
        wallet.label = profile.currentLabel + ".ar";
      }

      // set details
      setWalletDetails(details);
    })();
  }, [wallets]);

  return walletDetails;
}
