import {
  ButtonV2,
  InputV2,
  ModalV2,
  Spacer,
  Text,
  TooltipV2,
  useInput,
  useModal,
  useToasts
} from "@arconnect/components";
import { CopyIcon, DownloadIcon, TrashIcon } from "@iconicicons/react";
import { InputWithBtn, InputWrapper } from "~components/arlocal/InputWrapper";
import { removeWallet, type StoredWallet } from "~wallets";
import { useEffect, useMemo, useState } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { IconButton } from "~components/IconButton";
import { decryptWallet, freeDecryptedWallet } from "~wallets/encryption";
import { type AnsUser, getAnsProfile } from "~lib/ans";
import { ExtensionStorage } from "~utils/storage";
import { downloadFile } from "~utils/file";
import keystoneLogo from "url:/assets/hardware/keystone.png";
import browser from "webextension-polyfill";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import { formatAddress } from "~utils/format";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { ErrorTypes } from "~utils/error/error.utils";

export interface WalletSettingsDashboardViewParams {
  address: string;
}

export type WalletSettingsDashboardViewProps =
  CommonRouteProps<WalletSettingsDashboardViewParams>;

export function WalletSettingsDashboardView({
  params: { address }
}: WalletSettingsDashboardViewProps) {
  // wallets
  const [wallets, setWallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage
    },
    []
  );

  // this wallet
  const wallet = useMemo(
    () => wallets?.find((w) => w.address === address),
    [wallets, address]
  );

  // toasts
  const { setToast } = useToasts();

  // ans
  const [ansLabel, setAnsLabel] = useState<string>();

  useEffect(() => {
    (async () => {
      if (!wallet) return;

      // get ans profile
      const profile = (await getAnsProfile(wallet.address)) as AnsUser;

      if (!profile?.currentLabel) return;

      setAnsLabel(profile.currentLabel + ".ar");
    })();
  }, [wallet?.address]);

  // wallet name input
  const walletNameInput = useInput();

  useEffect(() => {
    if (!wallet) return;
    walletNameInput.setState(ansLabel || wallet.nickname);
  }, [wallet, ansLabel]);

  // update nickname function
  async function updateNickname() {
    if (!!ansLabel) return;

    // check name
    const newName = walletNameInput.state;

    if (!newName || newName === "") {
      return setToast({
        type: "error",
        content: "Please enter a valid nickname",
        duration: 2200
      });
    }

    // update wallets
    try {
      await setWallets((val) =>
        val.map((wallet) => {
          if (wallet.address !== address) {
            return wallet;
          }

          return {
            ...wallet,
            nickname: newName
          };
        })
      );

      setToast({
        type: "info",
        content: browser.i18n.getMessage("updated_wallet_name"),
        duration: 3000
      });
    } catch (e) {
      console.log("Could not update nickname", e);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("error_updating_wallet_name"),
        duration: 3000
      });
    }
  }

  // wallet remove modal
  const removeModal = useModal();

  // export wallet modal
  const exportModal = useModal();

  // password input
  const passwordInput = useInput();

  // export the wallet
  async function exportWallet() {
    if (wallet.type === "hardware") {
      throw new Error("Hardware wallet cannot be exported");
    }

    try {
      // decrypt keyfile
      const decrypted = await decryptWallet(
        wallet.keyfile,
        passwordInput.state
      );

      // download the file
      downloadFile(
        JSON.stringify(decrypted, null, 2),
        "application/json",
        `arweave-keyfile-${address}.json`
      );

      // remove wallet from memory
      freeDecryptedWallet(decrypted);

      // close modal
      exportModal.setOpen(false);
    } catch (e) {
      console.log("Error exporting wallet", e.message);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("export_wallet_error"),
        duration: 2200
      });
    }
  }

  if (!wallet) {
    throw new Error(ErrorTypes.WalletNotFound);
  }

  return (
    <Wrapper>
      <div>
        <Spacer y={0.45} />
        <WalletName>
          {ansLabel || wallet.nickname}
          {wallet.type === "hardware" && (
            <TooltipV2
              content={
                wallet.api.slice(0, 1).toUpperCase() + wallet.api.slice(1)
              }
              position="bottom"
            >
              <HardwareWalletIcon
                src={wallet.api === "keystone" ? keystoneLogo : undefined}
              />
            </TooltipV2>
          )}
        </WalletName>
        <WalletAddress>
          {wallet.address}
          <TooltipV2
            content={browser.i18n.getMessage("copy_address")}
            position="bottom"
          >
            <CopyButton
              onClick={() => {
                copy(wallet.address);
                setToast({
                  type: "info",
                  content: browser.i18n.getMessage("copied_address", [
                    wallet.nickname,
                    formatAddress(wallet.address, 3)
                  ]),
                  duration: 2200
                });
              }}
            />
          </TooltipV2>
        </WalletAddress>
        <Title>{browser.i18n.getMessage("edit_wallet_name")}</Title>
        {!!ansLabel && (
          <Warning>{browser.i18n.getMessage("cannot_edit_with_ans")}</Warning>
        )}
        <InputWithBtn>
          <InputWrapper>
            <InputV2
              {...walletNameInput.bindings}
              type="text"
              placeholder={browser.i18n.getMessage("edit_wallet_name")}
              fullWidth
              disabled={!!ansLabel}
            />
          </InputWrapper>
          <IconButton onClick={updateNickname} disabled={!!ansLabel}>
            Save
          </IconButton>
        </InputWithBtn>
      </div>
      <div>
        <ButtonV2
          fullWidth
          onClick={() => exportModal.setOpen(true)}
          disabled={wallet.type === "hardware"}
        >
          <DownloadIcon style={{ marginRight: "5px" }} />
          {browser.i18n.getMessage("export_keyfile")}
        </ButtonV2>
        <Spacer y={1} />
        <ButtonV2 fullWidth secondary onClick={() => removeModal.setOpen(true)}>
          <TrashIcon style={{ marginRight: "5px" }} />
          {browser.i18n.getMessage("remove_wallet")}
        </ButtonV2>
      </div>
      <ModalV2
        {...removeModal.bindings}
        root={document.getElementById("__plasmo")}
        actions={
          <>
            <ButtonV2
              fullWidth
              secondary
              onClick={() => removeModal.setOpen(false)}
            >
              {browser.i18n.getMessage("cancel")}
            </ButtonV2>
            <ButtonV2
              fullWidth
              onClick={async () => {
                try {
                  await removeWallet(address);
                  setToast({
                    type: "success",
                    content: browser.i18n.getMessage(
                      "removed_wallet_notification"
                    ),
                    duration: 2000
                  });
                } catch (e) {
                  console.log("Error removing wallet", e);
                  setToast({
                    type: "error",
                    content: browser.i18n.getMessage(
                      "remove_wallet_error_notification"
                    ),
                    duration: 2000
                  });
                }
              }}
            >
              {browser.i18n.getMessage("confirm")}
            </ButtonV2>
          </>
        }
      >
        <CenterText heading noMargin>
          {browser.i18n.getMessage("remove_wallet_modal_title")}
        </CenterText>
        <Spacer y={0.55} />
        <CenterText noMargin>
          {browser.i18n.getMessage("remove_wallet_modal_content")}
        </CenterText>
        <Spacer y={0.75} />
      </ModalV2>
      <ModalV2
        {...exportModal.bindings}
        root={document.getElementById("__plasmo")}
        actions={
          <ButtonV2 fullWidth onClick={exportWallet}>
            {browser.i18n.getMessage("export")}
          </ButtonV2>
        }
      >
        <CenterText heading>
          {browser.i18n.getMessage("export_wallet_modal_title")}
        </CenterText>
        <InputV2
          type="password"
          placeholder={browser.i18n.getMessage("password")}
          {...passwordInput.bindings}
          fullWidth
        />
        <Spacer y={1} />
      </ModalV2>
    </Wrapper>
  );
}

const CenterText = styled(Text)`
  text-align: center;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`;

const WalletName = styled(Text).attrs({
  title: true,
  noMargin: true
})`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-weight: 600;
`;

const HardwareWalletIcon = styled.img.attrs({
  draggable: false
})`
  width: 32px;
  height: 32px;
  object-fit: contain;
  user-select: none;
`;

const WalletAddress = styled(Text)`
  display: flex;
  align-items: center;
  gap: 0.37rem;
`;

export const CopyButton = styled(CopyIcon)`
  font-size: 1em;
  width: 1em;
  height: 1em;
  color: rgb(${(props) => props.theme.secondaryText});
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.8;
  }

  &:focus {
    transform: scale(0.87);
  }
`;

const Title = styled(Text).attrs({
  heading: true
})`
  margin-bottom: 0.6em;
`;

const Warning = styled(Text)`
  color: rgb(255, 0, 0, 0.6);
`;

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
`;
