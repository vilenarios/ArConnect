import { useEffect, useMemo, useState } from "react";
import { defaultConfig } from "./config";
import { connect, dryrun } from "@permaweb/aoconnect";
import { type Tag } from "arweave/web/lib/transaction";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { Quantity, Token } from "ao-tokens";
import { ArweaveSigner, createData } from "arbundles";
import { getActiveKeyfile } from "~wallets";
import { isLocalWallet } from "~utils/assertions";
import { freeDecryptedWallet } from "~wallets/encryption";
import {
  AO_NATIVE_TOKEN,
  AO_NATIVE_TOKEN_BALANCE_MIRROR
} from "~utils/ao_import";
import type { KeystoneSigner } from "~wallets/hardware/keystone";
import browser from "webextension-polyfill";
import { fetchTokenByProcessId } from "~lib/transactions";
import { timeoutPromise } from "~utils/promises/timeout";
import type { DecodedTag } from "~api/modules/sign/tags";

export type AoInstance = ReturnType<typeof connect>;

export const defaultAoTokens: TokenInfo[] = [
  {
    Name: "AO",
    Ticker: "AO",
    Denomination: 12,
    Logo: "UkS-mdoiG8hcAClhKK8ch4ZhEzla0mCPDOix9hpdSFE",
    processId: "m3PaWzK4PTG9lAaqYQPaPdOcXdO8hYqi5Fe9NWqXd0w"
  },
  {
    Name: "Q Arweave",
    Ticker: "qAR",
    Denomination: 12,
    Logo: "26yDr08SuwvNQ4VnhAfV4IjJcOOlQ4tAQLc1ggrCPu0",
    processId: "NG-0lVX882MG5nhARrSzyprEK6ejonHpdUmaaMPsHE8"
  },
  {
    Name: "Wrapped AR",
    Ticker: "wAR",
    Denomination: 12,
    Logo: "L99jaxRKQKJt9CqoJtPaieGPEhJD3wNhR4iGqc8amXs",
    processId: "xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10"
  }
];

/**
 * Dummy ID
 */
export const Id = "0000000000000000000000000000000000000000001";

/**
 * Dummy owner
 */
export const Owner = "0000000000000000000000000000000000000000002";

export interface Message {
  Anchor: string;
  Tags: Tag[];
  Target: string;
  Data: string;
}

type CreateDataItemArgs = {
  data: any;
  tags?: Tag[];
  target?: string;
  anchor?: string;
};

type DataItemResult = {
  id: string;
  raw: ArrayBuffer;
};

type CreateDataItemSigner = (
  wallet: any
) => (args: CreateDataItemArgs) => Promise<DataItemResult>;

export function useAo() {
  // ao instance
  const ao = useMemo(() => connect(defaultConfig), []);

  return ao;
}

export function useAoTokens({
  refresh,
  type
}: { refresh?: boolean; type?: "asset" | "collectible" } = {}): [
  TokenInfoWithBalance[],
  boolean
] {
  const [tokens, setTokens] = useState<TokenInfoWithBalance[]>([]);
  const [balances, setBalances] = useState<{ id: string; balance: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const tokensWithBalances = useMemo(
    () =>
      tokens.map((token) => ({
        ...token,
        balance: balances.find((bal) => bal.id === token.id)?.balance
      })),
    [tokens, balances]
  );

  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const [aoSetting] = useStorage<boolean>({
    key: "setting_ao_support",
    instance: ExtensionStorage
  });

  const [aoTokens] = useStorage<TokenInfo[]>(
    {
      key: "ao_tokens",
      instance: ExtensionStorage
    },
    []
  );

  // fetch token infos
  useEffect(() => {
    (async () => {
      try {
        if (!aoSetting) {
          setTokens([]);
          return;
        }

        setTokens(
          aoTokens
            .filter((t) => {
              if (!type) return true;
              else if (type === "asset") return t.type === "asset" || !t.type;
              else if (type === "collectible") return t.type === "collectible";
              return false;
            })
            .map((aoToken) => ({
              id: aoToken.processId,
              balance: "0",
              Ticker: aoToken.Ticker,
              Name: aoToken.Name,
              Denomination: Number(aoToken.Denomination || 0),
              Logo: aoToken?.Logo,
              type: aoToken.type || "asset"
            }))
        );
      } catch {}
    })();
  }, [aoTokens, aoSetting]);

  useEffect(() => {
    (async () => {
      if (!activeAddress || !aoSetting) {
        setBalances([]);
        return;
      }

      setLoading(true);
      try {
        const balances = await Promise.all(
          tokens.map(async (token) => {
            try {
              const balance = await timeoutPromise(
                (async () => {
                  if (token.id === AO_NATIVE_TOKEN) {
                    const res = await getNativeTokenBalance(activeAddress);
                    return res;
                  } else {
                    let balance: string;
                    if (token.type === "collectible") {
                      balance = (
                        await getAoCollectibleBalance(token, activeAddress)
                      ).toString();
                    } else {
                      if (refresh) {
                        const aoToken = await Token(token.id);
                        balance = (
                          await aoToken.getBalance(activeAddress)
                        ).toString();
                      } else {
                        balance = (
                          await getAoTokenBalance(
                            activeAddress,
                            token.id,
                            token
                          )
                        ).toString();
                      }
                    }
                    if (balance) {
                      return balance;
                    } else {
                      // default return
                      return new Quantity(0, BigInt(12)).toString();
                    }
                  }
                })(),
                10000
              );

              return {
                id: token.id,
                balance
              };
            } catch (error) {
              if (
                error?.message === "Failed to fetch" ||
                error?.message.includes("ERR_SSL_PROTOCOL_ERROR") ||
                error?.message.includes("ERR_CONNECTION_CLOSED")
              ) {
                return { id: token.id, balance: "" };
              }
              return { id: token.id, balance: null };
            }
          })
        );

        setBalances(balances);
      } catch (err) {
        console.error("Error fetching balances:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [tokens, activeAddress, aoSetting]);
  return [tokensWithBalances, loading];
}

export async function getAoTokenBalance(
  address: string,
  process: string,
  aoToken?: TokenInfo
): Promise<Quantity> {
  if (!aoToken) {
    const aoTokens =
      (await ExtensionStorage.get<TokenInfo[]>("ao_tokens")) || [];

    aoToken = aoTokens.find((token) => token.processId === process);
  }

  const res = await dryrun({
    Id,
    Owner: address,
    process,
    tags: [{ name: "Action", value: "Balance" }]
  });

  const errorMessage = (res as any)?.error || res?.Error;

  if (errorMessage) {
    throw new Error(errorMessage);
  }

  if (res.Messages.length === 0) {
    throw new Error(
      "Invalid token process: Balance action handler missing or unsupported."
    );
  }

  for (const msg of res.Messages as Message[]) {
    const balance = getTagValue("Balance", msg.Tags);

    if (balance && +balance) {
      if (!aoToken) {
        aoToken = await fetchTokenByProcessId(process);
        if (!aoToken) {
          throw new Error("Could not load token info.");
        }
      }

      return new Quantity(BigInt(balance), BigInt(aoToken.Denomination));
    }
  }

  // default return
  return new Quantity(0n, 12n);
}

export async function getAoCollectibleBalance(
  collectible: TokenInfoWithBalance,
  address: string
): Promise<Quantity> {
  const res = await dryrun({
    Id,
    Owner: address,
    process: collectible.processId || collectible.id,
    tags: [{ name: "Action", value: "Balance" }],
    data: JSON.stringify({ Target: address })
  });

  const balance = res.Messages[0].Data;
  return balance
    ? new Quantity(BigInt(balance), BigInt(collectible.Denomination))
    : new Quantity(0, BigInt(collectible.Denomination));
}

export async function getNativeTokenBalance(address: string): Promise<string> {
  const res = await dryrun({
    Id,
    Owner: address,
    process: AO_NATIVE_TOKEN_BALANCE_MIRROR,
    tags: [{ name: "Action", value: "Balance" }]
  });
  const balance = res.Messages[0].Data;
  return balance ? new Quantity(BigInt(balance), BigInt(12)).toString() : "0";
}

export function useAoTokensCache(): [TokenInfoWithBalance[], boolean] {
  const [balances, setBalances] = useState<{ id: string; balance: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const [aoSetting] = useStorage<boolean>({
    key: "setting_ao_support",
    instance: ExtensionStorage
  });

  const [aoTokens] = useStorage<TokenInfoWithProcessId[]>(
    {
      key: "ao_tokens",
      instance: ExtensionStorage
    },
    []
  );

  const [aoTokensCache] = useStorage<TokenInfoWithProcessId[]>(
    { key: "ao_tokens_cache", instance: ExtensionStorage },
    []
  );

  const [aoTokensIds] = useStorage(
    { key: "ao_tokens_ids", instance: ExtensionStorage },
    {}
  );

  const aoTokensToAdd = useMemo(() => {
    if (!activeAddress || aoTokensCache.length === 0 || !aoSetting) {
      return [];
    }

    const userTokenIds = aoTokensIds[activeAddress] || [];
    const userTokensCache = aoTokensCache.filter((token) =>
      userTokenIds.includes(token.processId)
    );

    return userTokensCache
      .filter(
        (token) =>
          !aoTokens.some(({ processId }) => processId === token.processId)
      )
      .map((token) => ({
        ...token,
        id: token.processId,
        Denomination: Number(token.Denomination || 0),
        balance: "0"
      }));
  }, [aoTokensCache, aoTokensIds, activeAddress, aoTokens]);

  const tokensWithBalances = useMemo(
    () =>
      aoTokensToAdd.map((token) => ({
        ...token,
        balance: balances.find((bal) => bal.id === token.id)?.balance ?? null
      })),
    [aoTokensToAdd, balances]
  );

  useEffect(() => {
    (async () => {
      if (!activeAddress || !aoSetting) {
        return setBalances([]);
      }

      setLoading(true);
      try {
        const balances = await Promise.all(
          aoTokensToAdd.map(async (token) => {
            try {
              const balance = await timeoutPromise(
                (async () => {
                  const aoToken = await Token(token.id);
                  const balance = await aoToken.getBalance(activeAddress);
                  return balance.toString();
                })(),
                6000
              );
              return {
                id: token.id,
                balance
              };
            } catch (error) {
              return { id: token.id, balance: null };
            }
          })
        );
        setBalances(balances);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [aoTokensToAdd, activeAddress, aoSetting]);

  return [tokensWithBalances, loading];
}

/**
 * Find the value for a tag name
 */
export const getTagValue = (tagName: string, tags: (Tag | DecodedTag)[]) =>
  tags.find((t) => t.name === tagName)?.value;

export const sendAoTransfer = async (
  ao: AoInstance,
  process: string,
  recipient: string,
  amount: string
) => {
  try {
    const decryptedWallet = await getActiveKeyfile();
    isLocalWallet(decryptedWallet);
    const keyfile = decryptedWallet.keyfile;

    const createDataItemSigner =
      (wallet: any) =>
      async ({
        data,
        tags = [],
        target,
        anchor
      }: {
        data: any;
        tags?: { name: string; value: string }[];
        target?: string;
        anchor?: string;
      }): Promise<{ id: string; raw: ArrayBuffer }> => {
        const signer = new ArweaveSigner(wallet);
        const dataItem = createData(data, signer, { tags, target, anchor });

        await dataItem.sign(signer);

        return {
          id: dataItem.id,
          raw: dataItem.getRaw()
        };
      };
    const signer = createDataItemSigner(keyfile);
    const transferID = await ao.message({
      process,
      signer,
      tags: [
        { name: "Action", value: "Transfer" },
        {
          name: "Recipient",
          value: recipient
        },
        { name: "Quantity", value: amount },
        { name: "Client", value: "ArConnect" },
        { name: "Client-Version", value: browser.runtime.getManifest().version }
      ]
    });
    freeDecryptedWallet(decryptedWallet.keyfile);
    return transferID;
  } catch (err) {
    console.log("err", err);
  }
};

export const sendAoTransferKeystone = async (
  ao: AoInstance,
  process: string,
  recipient: string,
  amount: string,
  keystoneSigner: KeystoneSigner
) => {
  try {
    const dataItemSigner = async ({
      data,
      tags = [],
      target,
      anchor
    }: {
      data: any;
      tags?: { name: string; value: string }[];
      target?: string;
      anchor?: string;
    }): Promise<{ id: string; raw: ArrayBuffer }> => {
      const signer = keystoneSigner;
      const dataItem = createData(data, signer, { tags, target, anchor });
      const serial = dataItem.getRaw();
      const signature = await signer.sign(serial);
      dataItem.setSignature(Buffer.from(signature));

      return {
        id: dataItem.id,
        raw: dataItem.getRaw()
      };
    };
    const transferID = await ao.message({
      process,
      signer: dataItemSigner,
      tags: [
        { name: "Action", value: "Transfer" },
        {
          name: "Recipient",
          value: recipient
        },
        { name: "Quantity", value: amount },
        { name: "Client", value: "ArConnect" },
        { name: "Client-Version", value: browser.runtime.getManifest().version }
      ]
    });
    return transferID;
  } catch (err) {
    console.log("err", err);
  }
};

export interface TokenInfo {
  Name?: string;
  Ticker?: string;
  Logo?: string;
  Denomination: number;
  processId?: string;
  lastUpdated?: string | null;
  type?: "asset" | "collectible";
}

export type TokenInfoWithProcessId = TokenInfo & { processId: string };

export interface TokenInfoWithBalance extends TokenInfo {
  id?: string;
  balance: string;
}
