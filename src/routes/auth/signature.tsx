import { ButtonV2, Section, Spacer, Text } from "@arconnect/components";
import Message from "~components/auth/Message";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import { useEffect } from "react";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";

export default function Signature() {
  const { authRequest, acceptRequest, rejectRequest } =
    useCurrentAuthRequest("signature");

  const { authID, url, message } = authRequest;

  // listen for enter to reset
  useEffect(() => {
    const listener = async (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      await acceptRequest();
    };

    window.addEventListener("keydown", listener);

    return () => window.removeEventListener("keydown", listener);
  }, [authID]);

  return (
    <Wrapper>
      <div>
        <Head
          title={browser.i18n.getMessage("titles_signature")}
          showOptions={false}
          back={rejectRequest}
        />
        <Spacer y={0.75} />
        <Section>
          <Text noMargin>
            {browser.i18n.getMessage("signature_description", url)}
          </Text>
        </Section>
      </div>
      <Section>
        <Message message={message} />
        <Spacer y={1.25} />
        <ButtonV2 fullWidth onClick={acceptRequest}>
          {browser.i18n.getMessage("signature_authorize")}
        </ButtonV2>
        <Spacer y={0.75} />
        <ButtonV2 fullWidth secondary onClick={() => rejectRequest}>
          {browser.i18n.getMessage("cancel")}
        </ButtonV2>
      </Section>
    </Wrapper>
  );
}
