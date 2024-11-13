import { unlock } from "~wallets/auth";
import {
  InputV2,
  Section,
  Spacer,
  Text,
  useInput,
  useToasts
} from "@arconnect/components";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import { HeadAuth } from "~components/HeadAuth";
import { AuthButtons } from "~components/auth/AuthButtons";

export default function Unlock() {
  // Note this screen can be presented:
  //
  // a) When an unlock AuthRequest is received.
  // b) When an unlock AuthRequest is manually selected by the user (which might have been completed already).
  // c) When the wallet is locked again, but in this case there's no AuthRequest to display or complete.

  const { authRequest, acceptRequest } = useCurrentAuthRequest("unlock");

  // password input
  const passwordInput = useInput();

  // toasts
  const { setToast } = useToasts();

  // unlock ArConnect
  async function unlockWallet() {
    // unlock using password
    const res = await unlock(passwordInput.state);

    if (res) {
      // If the wallet is locked again, this screen is presented but there's no AuthRequest to accept:
      if (authRequest) acceptRequest();
    } else {
      passwordInput.setStatus("error");

      return setToast({
        type: "error",
        content: browser.i18n.getMessage("invalidPassword"),
        duration: 2200
      });
    }
  }

  return (
    <Wrapper>
      <div>
        <HeadAuth title={browser.i18n.getMessage("unlock")} />

        <Spacer y={0.75} />

        <Section>
          <Text noMargin>
            {browser.i18n.getMessage("unlock_wallet_to_use")}
          </Text>
          <Spacer y={1.5} />
          <InputV2
            type="password"
            {...passwordInput.bindings}
            label={browser.i18n.getMessage("password")}
            placeholder={browser.i18n.getMessage("enter_password")}
            fullWidth
            autoFocus
            disabled={authRequest && authRequest.status !== "pending"}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              unlockWallet();
            }}
          />
        </Section>
      </div>

      <Section>
        <AuthButtons
          authRequest={authRequest}
          primaryButtonProps={{
            label: browser.i18n.getMessage("unlock"),
            onClick: unlockWallet
          }}
        />
      </Section>
    </Wrapper>
  );
}
