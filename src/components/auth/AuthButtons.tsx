import { ButtonV2, Spacer, type ButtonV2Props } from "@arconnect/components";
import { useThrottledRequestAnimationFrame } from "@swyg/corre";
import { useRef, type MouseEvent } from "react";
import styled from "styled-components";
import type { AuthRequest, AuthRequestStatus } from "~utils/auth/auth.types";
import { prettyDate } from "~utils/pretty_date";

interface AuthButtonProps extends ButtonV2Props {
  label: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}

export interface AuthButtonsProps {
  authRequest: AuthRequest;
  primaryButtonProps?: AuthButtonProps;
  secondaryButtonProps?: AuthButtonProps;
}

export function AuthButtons({
  authRequest,
  primaryButtonProps,
  secondaryButtonProps
}: AuthButtonsProps) {
  const { label: primaryButtonLabel } = primaryButtonProps || {};
  const { label: secondaryButtonLabel } = secondaryButtonProps || {};
  const showPrimaryButton = !!primaryButtonProps && primaryButtonLabel;
  const showSecondaryButton = !!secondaryButtonProps && secondaryButtonLabel;

  // TODO: Add default  label so that we only need to pass the onClick (for cancel)
  // TODO: Use the red Reset button used in batchSignDataItem.tsx
  // TODO: Maybe using the authRequest type we can get default labels already without passing them unless they are conditional. Also, we could use the auth hook
  // here so that there's no need to pass the request and so that we get access to the cancelRequest handler for the cancel button.

  const requestedAt = authRequest?.requestedAt;
  const requestedAtElementRef = useRef<HTMLSpanElement>();

  useThrottledRequestAnimationFrame(() => {
    const requestedAtElement = requestedAtElementRef.current;

    if (!requestedAtElement) return;

    requestedAtElement.textContent = prettyDate(requestedAt);

    // TODO: After one minute, change the interval wait time to 5 seconds or so. Consider adding this to @swyg/corre and adding a function/hook useFormattedTime
  }, 250);

  return (
    <>
      {authRequest ? (
        <PStatusLabel status={authRequest.status}>
          {authRequest.status}

          <span ref={requestedAtElementRef}>{prettyDate(requestedAt)}</span>
        </PStatusLabel>
      ) : null}

      {!authRequest || authRequest.status === "pending" ? (
        <>
          {showPrimaryButton || showSecondaryButton ? (
            <Spacer y={0.75} />
          ) : null}

          {showPrimaryButton ? (
            <ButtonV2 {...primaryButtonProps} fullWidth>
              {primaryButtonLabel}
            </ButtonV2>
          ) : null}

          {showPrimaryButton && showSecondaryButton ? (
            <Spacer y={0.75} />
          ) : null}

          {showSecondaryButton ? (
            <ButtonV2 {...secondaryButtonProps} secondary fullWidth>
              {secondaryButtonLabel}
            </ButtonV2>
          ) : null}
        </>
      ) : null}
    </>
  );
}

const PStatusLabel = styled.p<{ status: AuthRequestStatus }>`
  margin: 0;
  padding: 16px;
  background: ${({ theme }) => theme.backgroundv2};
  border-radius: 10px;
`;
