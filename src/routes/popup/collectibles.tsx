import { useHistory } from "~utils/hash_router";
import { Section } from "@arconnect/components";
import { useMemo } from "react";
import Collectible from "~components/popup/Collectible";
import browser from "webextension-polyfill";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { useAoTokens } from "~tokens/aoTokens/ao";

export default function Collectibles() {
  // all tokens
  const [aoTokens] = useAoTokens({ type: "collectible" });

  // collectibles
  const collectibles = useMemo(
    () => aoTokens.filter((token) => token.type === "collectible"),
    [aoTokens]
  );

  // router push
  const [push] = useHistory();

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("collectibles")} />
      <CollectiblesList>
        {collectibles.map((collectible, i) => (
          <Collectible
            id={collectible.id}
            name={collectible.Name || collectible.Ticker}
            balance={collectible.balance}
            divisibility={collectible.Denomination}
            onClick={() => push(`/collectible/${collectible.id}`)}
            key={i}
          />
        ))}
      </CollectiblesList>
    </>
  );
}

const CollectiblesList = styled(Section)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
`;
