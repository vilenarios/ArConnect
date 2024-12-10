import { Heading, TokenCount, ViewAll } from "../Title";
import { Spacer, Text } from "@arconnect/components";
import { useHistory } from "~utils/hash_router";
import { useMemo } from "react";
import browser from "webextension-polyfill";
import Collectible from "../Collectible";
import styled from "styled-components";
import { useAoTokens } from "~tokens/aoTokens/ao";

export default function Collectibles() {
  // all tokens
  const [collectibles] = useAoTokens({ type: "collectible" });

  // router location
  const [push] = useHistory();

  return (
    <>
      <Heading>
        <ViewAll
          onClick={() => {
            if (collectibles.length === 0) return;
            push("/collectibles");
          }}
        >
          {browser.i18n.getMessage("view_all")}
          <TokenCount>({collectibles.length})</TokenCount>
        </ViewAll>
      </Heading>
      <Spacer y={1} />
      {collectibles.length === 0 && (
        <NoAssets>{browser.i18n.getMessage("no_collectibles")}</NoAssets>
      )}
      <CollectiblesList>
        {collectibles.slice(0, 6).map((collectible, i) => (
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

const CollectiblesList = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
`;

const NoAssets = styled(Text).attrs({
  noMargin: true
})`
  text-align: center;
`;
