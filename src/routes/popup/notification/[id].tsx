import type { CommonRouteProps } from "~wallets/router/router.types";
import Transaction from "../transaction/[id]";

export interface MessageNotificationViewParams {
  id: string;
}

export type MessageNotificationViewProps =
  CommonRouteProps<MessageNotificationViewParams>;

export function MessageNotificationView({
  params: { id }
}: MessageNotificationViewProps) {
  return (
    <>
      <Transaction id={id} message={true} />
    </>
  );
}
