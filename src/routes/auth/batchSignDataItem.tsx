import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import {
  InputV2,
  ListItem,
  Section,
  Spacer,
  Text,
  useInput,
  useToasts
} from "@arconnect/components";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import { useEffect, useState } from "react";
import styled from "styled-components";

import SignDataItemDetails from "~components/signDataItem";
import { Quantity, Token } from "ao-tokens";
import { ExtensionStorage } from "~utils/storage";
import { useStorage } from "@plasmohq/storage/hook";
import { checkPassword } from "~wallets/auth";
import { timeoutPromise } from "~utils/promises/timeout";
import { HeadAuth } from "~components/HeadAuth";
import { AuthButtons } from "~components/auth/AuthButtons";

export function BatchSignDataItemAuthRequestView() {
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

      <Section>
        {!transaction ? (
          <>
            {password && (
              <>
                <PasswordWrapper>
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
                </PasswordWrapper>
                <Spacer y={1} />
              </>
            )}

            <AuthButtons
              authRequest={authRequest}
              primaryButtonProps={{
                label: browser.i18n.getMessage("sign_authorize_all"),
                disabled: (password && !passwordInput.state) || loading,
                onClick: sign
              }}
              secondaryButtonProps={{
                onClick: () => rejectRequest()
              }}
            />
          </>
        ) : (
          <AuthButtons
            authRequest={authRequest}
            primaryButtonProps={{
              onClick: () => setTransaction(null)
            }}
          />
        )}
      </Section>
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

const PasswordWrapper = styled.div`
  display: flex;
  flex-direction: column;

  p {
    text-transform: capitalize;
  }
`;
