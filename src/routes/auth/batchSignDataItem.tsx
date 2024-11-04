import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import {
  ButtonV2,
  InputV2,
  ListItem,
  Section,
  Text,
  useInput,
  useToasts
} from "@arconnect/components";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import { useEffect, useState } from "react";
import styled from "styled-components";

import { ResetButton } from "~components/dashboard/Reset";
import SignDataItemDetails from "~components/signDataItem";
import HeadV2 from "~components/popup/HeadV2";
import { Quantity, Token } from "ao-tokens";
import { ExtensionStorage } from "~utils/storage";
import { useStorage } from "@plasmohq/storage/hook";
import { checkPassword } from "~wallets/auth";
import { timeoutPromise } from "~utils/promises/timeout";
import { HeadAuth } from "~components/HeadAuth";

export default function BatchSignDataItem() {
  const { authRequest, acceptRequest, rejectRequest } =
    useCurrentAuthRequest("batchSignDataItem");
  const { data, url } = authRequest;

  const { setToast } = useToasts();
  const [loading, setLoading] = useState<boolean>(false);
  const [transaction, setTransaction] = useState<any | null>(null);
  const [transactionList, setTransactionList] = useState<any | null>(null);
  const [password, setPassword] = useState<boolean>(false);
  const passwordInput = useInput();
  async function sign() {
    if (password) {
      const checkPw = await checkPassword(passwordInput.state);
      if (!checkPw) {
        setToast({
          type: "error",
          content: browser.i18n.getMessage("invalidPassword"),
          duration: 2400
        });
        return;
      }
    }

    acceptRequest();
  }

  const [signatureAllowance] = useStorage(
    {
      key: "signatureAllowance",
      instance: ExtensionStorage
    },
    10
  );

  useEffect(() => {
    const fetchTransactionList = async () => {
      setLoading(true);
      try {
        if (Array.isArray(data)) {
          const listItems = await Promise.all(
            data.map(async (item, index) => {
              let amount = "";
              let name = "";
              const quantity =
                item?.tags?.find((tag) => tag.name === "Quantity")?.value ||
                "0";
              const transfer = item?.tags?.some(
                (tag) => tag.name === "Action" && tag.value === "Transfer"
              );

              if (transfer && quantity) {
                let tokenInfo: any;
                try {
                  const token = await timeoutPromise(Token(item.target), 6000);
                  tokenInfo = {
                    ...token.info,
                    Denomination: Number(token.info.Denomination)
                  };
                  const tokenAmount = new Quantity(
                    BigInt(quantity),
                    BigInt(tokenInfo.Denomination)
                  );
                  amount = tokenAmount.toLocaleString();
                  name = tokenInfo.Name;
                  console.log(signatureAllowance, Number(amount));
                  if (signatureAllowance > Number(amount)) {
                    setPassword(true);
                  }
                } catch (error) {
                  console.error("Token fetch timed out or failed", error);
                  amount = quantity;
                  name = item.target;
                }
              }
              return (
                <ListItem
                  key={index}
                  title={`Transaction ${index + 1}`}
                  description={formatTransactionDescription(amount, name)}
                  small
                  onClick={() => setTransaction(item)}
                />
              );
            })
          );
          setTransactionList(listItems);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionList();
  }, [data]);

  return (
    <Wrapper>
      <div>
        <HeadAuth
          title={browser.i18n.getMessage("batch_sign_items")}
          back={transaction ? () => setTransaction(null) : undefined}
        />
        <Description>
          <Text noMargin>
            {browser.i18n.getMessage("batch_sign_data_description", url)}
          </Text>
        </Description>

        {transaction ? (
          <SignDataItemDetails params={transaction} />
        ) : (
          <div style={{ paddingLeft: "16px", paddingRight: "16px" }}>
            {transactionList}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          padding: "16px"
        }}
      >
        {!transaction ? (
          <>
            {password && (
              <div style={{ paddingBottom: "16px" }}>
                <InputV2
                  placeholder="Enter your password"
                  small
                  {...passwordInput.bindings}
                  label={"Password"}
                  type="password"
                  onKeyDown={async (e) => {
                    if (e.key !== "Enter") return;
                    await sign();
                  }}
                  fullWidth
                />
              </div>
            )}

            <ButtonV2
              fullWidth
              onClick={sign}
              disabled={(password && !passwordInput.state) || loading}
            >
              {browser.i18n.getMessage("signature_authorize")}
            </ButtonV2>
            <ResetButton fullWidth onClick={() => rejectRequest()}>
              {browser.i18n.getMessage("cancel")}
            </ResetButton>
          </>
        ) : (
          <ButtonV2 fullWidth onClick={() => setTransaction(null)}>
            {browser.i18n.getMessage("continue")}
          </ButtonV2>
        )}
      </div>
    </Wrapper>
  );
}

function formatTransactionDescription(
  amount?: string,
  tokenName?: string
): string {
  if (amount && tokenName) {
    return `Sending ${amount} of ${tokenName}`;
  }
  return "Unknown transaction";
}

const Description = styled(Section)`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;
