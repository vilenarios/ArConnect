import type { AppInfo } from "~applications/application";
import type { PermissionType } from "~applications/permissions";
import type { Gateway } from "~gateways/gateway";
import type { SubscriptionData } from "~subscriptions/subscription";
import type { TokenType } from "~tokens/token";
import type { SplitTransaction } from "~api/modules/sign/transaction_builder";
import type { RawDataItem } from "~api/modules/sign_data_item/types";

// COMMON:

type AuthRequestStatus = "pending" | "accepted" | "rejected";

interface CommonAuthRequestProps {
  url: string;
  tabID: number;
  authID: string;
  createdAt: number;
  status: AuthRequestStatus;
}

// CONNECT:

export interface ConnectAuthRequestData {
  type: "connect";
  permissions: PermissionType[];
  appInfo: AppInfo;
  gateway?: Gateway;
}

// ALLOWANCE:

export interface AllowanceAuthRequestData {
  type: "allowance";
  spendingLimitReached: boolean;
}

// UNLOCK:

export interface UnlockAuthRequestData {
  type: "unlock";
}

// TOKEN AUTH:

export interface TokenAuthRequestData {
  type: "token";
  tokenID: string;
  tokenType?: TokenType;
  dre?: string;
}

// SIGN:

export interface SignAuthRequestData {
  type: "sign";
  address: string;
  transaction: SplitTransaction;
  collectionID: string;
}

// SUBSCRIPTION:

export interface SubscriptionAuthRequestData extends SubscriptionData {
  type: "subscription";
}

// SIGN KEYSTONE:

export interface SignKeystoneAuthRequestData {
  type: "signKeystone";
  collectionID: string;
  keystoneSignType: string;
}

// SIGNATURE:

export interface SignatureAuthRequestData {
  type: "signature";
  message: number[];
}

// SIGN DATA ITEM:

export interface SignDataItemAuthRequestData {
  type: "signDataItem";
  data: RawDataItem;
}

// BATCH SIGN DATA ITEM:

export interface BatchSignDataItemAuthRequestData {
  type: "batchSignDataItem";
  data: RawDataItem;
}

export type AuthRequestData =
  | ConnectAuthRequestData
  | AllowanceAuthRequestData
  | UnlockAuthRequestData
  | TokenAuthRequestData
  | SignAuthRequestData
  | SubscriptionAuthRequestData
  | SignKeystoneAuthRequestData
  | SignatureAuthRequestData
  | SignDataItemAuthRequestData
  | BatchSignDataItemAuthRequestData;

export type AuthType = AuthRequestData["type"];

export type ConnectAuthRequest = ConnectAuthRequestData &
  CommonAuthRequestProps;
export type AllowanceAuthRequest = AllowanceAuthRequestData &
  CommonAuthRequestProps;
export type UnlockAuthRequest = UnlockAuthRequestData & CommonAuthRequestProps;
export type TokenAuthRequest = TokenAuthRequestData & CommonAuthRequestProps;
export type SignAuthRequest = SignAuthRequestData & CommonAuthRequestProps;
export type SubscriptionAuthRequest = SubscriptionAuthRequestData &
  CommonAuthRequestProps;
export type SignKeystoneAuthRequest = SignKeystoneAuthRequestData &
  CommonAuthRequestProps;
export type SignatureAuthRequest = SignatureAuthRequestData &
  CommonAuthRequestProps;
export type SignDataItemAuthRequest = SignDataItemAuthRequestData &
  CommonAuthRequestProps;
export type BatchSignDataItemAuthRequest = BatchSignDataItemAuthRequestData &
  CommonAuthRequestProps;

export type AuthRequest =
  | ConnectAuthRequest
  | AllowanceAuthRequest
  | UnlockAuthRequest
  | TokenAuthRequest
  | SignAuthRequest
  | SubscriptionAuthRequest
  | SignKeystoneAuthRequest
  | SignatureAuthRequest
  | SignDataItemAuthRequest
  | BatchSignDataItemAuthRequest;

export type AuthRequestByType = {
  connect: ConnectAuthRequest;
  allowance: AllowanceAuthRequest;
  unlock: UnlockAuthRequest;
  token: TokenAuthRequest;
  sign: SignAuthRequest;
  subscription: SubscriptionAuthRequest;
  signKeystone: SignKeystoneAuthRequest;
  signature: SignatureAuthRequest;
  signDataItem: SignDataItemAuthRequest;
  batchSignDataItem: BatchSignDataItemAuthRequest;
};
