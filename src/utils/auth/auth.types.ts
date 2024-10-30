import type { AppInfo } from "~applications/application";
import type { PermissionType } from "~applications/permissions";
import type { Gateway } from "~gateways/gateway";
import type Transaction from "arweave/web/lib/transaction";
import type { SubscriptionData } from "~subscriptions/subscription";
import type { TokenType } from "~tokens/token";

// COMMON:

export type AuthRequestStatus = "pending" | "accepted" | "rejected";

export interface CommonAuthRequestData {
  authID: string;
  status: AuthRequestStatus;
}

// CONNECT:

export interface ConnectAuthRequest extends CommonAuthRequestData {
  type: "connect";
  url: string;
  permissions: PermissionType[];
  appInfo: AppInfo;
  gateway?: Gateway;
}

// ALLOWANCE:

export interface AllowanceAuthRequest extends CommonAuthRequestData {
  type: "allowance";
  url: string;
  spendingLimitReached: boolean;
}

// UNLOCK:

export interface UnlockAuthRequest extends CommonAuthRequestData {
  type: "unlock";
}

// TOKEN AUTH:

export interface TokenAuthRequest extends CommonAuthRequestData {
  type: "token";
  url: string;
  tokenID: string;
  tokenType?: TokenType;
  dre?: string;
}

interface StrippedTx extends Transaction {
  data: undefined;
  tags: undefined;
}

// SIGN:

export interface SignAuthRequest extends CommonAuthRequestData {
  type: "sign";
  url: string;
  address: string;
  transaction: StrippedTx;
  collectionID: string;
}

// SUBSCRIPTION:

export interface SubscriptionAuthRequest
  extends CommonAuthRequestData,
    SubscriptionData {
  type: "subscription";
  url: string;
}

// SIGN KEYSTONE:

export interface SignKeystoneAuthRequest extends CommonAuthRequestData {
  type: "signKeystone";
  collectionID: string;
  keystoneSignType: string;
}

interface Tag {
  name: string;
  value: string;
}

interface DataStructure {
  data: number[];
  target?: string;
  tags: Tag[];
}

// SIGNATURE:

export interface SignatureAuthRequest extends CommonAuthRequestData {
  type: "signature";
  url: string;
  message: number[];
}

// SIGN DATA ITEM:

export interface SignDataItemAuthRequest extends CommonAuthRequestData {
  type: "signDataItem";
  appData: { appURL: string };
  data: DataStructure;
}

// BATCH SIGN DATA ITEM:

export interface BatchSignDataItemAuthRequest extends CommonAuthRequestData {
  type: "batchSignDataItem";
  appData: { appURL: string };
  data: DataStructure;
}

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

export type AuthType = AuthRequest["type"];

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
