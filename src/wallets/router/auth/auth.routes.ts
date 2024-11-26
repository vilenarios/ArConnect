import { AllowanceAuthRequestView } from "~routes/auth/allowance";
import { BatchSignDataItemAuthRequestView } from "~routes/auth/batchSignDataItem";
import { ConnectAuthRequestView } from "~routes/auth/connect";
import { SignAuthRequestView } from "~routes/auth/sign";
import { SignatureAuthRequestView } from "~routes/auth/signature";
import { SignDataItemAuthRequestView } from "~routes/auth/signDataItem";
import { SignKeystoneAuthRequestView } from "~routes/auth/signKeystone";
import { SubscriptionAuthRequestView } from "~routes/auth/subscription";
import { TokenAuthRequestView } from "~routes/auth/token";
import type { RouteConfig } from "~wallets/router/router.types";

// TODO: Rename all of them and add the "page" wrapper to them...

// TODO: Add enum here but update in another PR...

export const AUTH_ROUTES: RouteConfig[] = [
  {
    path: "/connect",
    component: ConnectAuthRequestView
  },
  {
    path: "/allowance",
    component: AllowanceAuthRequestView
  },
  {
    path: "/token",
    component: TokenAuthRequestView
  },
  {
    path: "/sign",
    component: SignAuthRequestView
  },
  {
    path: "/signKeystone",
    component: SignKeystoneAuthRequestView
  },
  {
    path: "/signature",
    component: SignatureAuthRequestView
  },
  {
    path: "/subscription",
    component: SubscriptionAuthRequestView
  },
  {
    path: "/signDataItem",
    component: SignDataItemAuthRequestView
  },
  {
    path: "/batchSignDataItem",
    component: BatchSignDataItemAuthRequestView
  }
];
