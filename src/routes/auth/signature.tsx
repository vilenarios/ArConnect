import { ButtonV2, Section, Spacer, Text } from "@arconnect/components";
import Message from "~components/auth/Message";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import { useEffect } from "react";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import { HeadAuth } from "~components/HeadAuth";
import { AuthButtons } from "~components/auth/AuthButtons";

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
        <HeadAuth title={browser.i18n.getMessage("titles_signature")} />
        <Spacer y={0.75} />
        <Section>
          <Text noMargin>
            {browser.i18n.getMessage("signature_description", url)}
          </Text>
        </Section>
      </div>
      <Section>
        <Message message={message} />
      </Section>
      <Spacer y={0.25} />
      <Section>
        <AuthButtons
          authRequest={authRequest}
          primaryButtonProps={{
            label: browser.i18n.getMessage("signature_authorize"),
            onClick: acceptRequest
          }}
          secondaryButtonProps={{
            label: browser.i18n.getMessage("cancel"),
            onClick: () => rejectRequest()
          }}
        />
      </Section>
    </Wrapper>
  );
}
