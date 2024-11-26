import { HomeView } from "~routes/popup";
import { CollectibleView } from "~routes/popup/collectible/[id]";
import { CollectiblesView } from "~routes/popup/collectibles";
import { ConfirmPurchaseView } from "~routes/popup/confirm";
import { ExploreView } from "~routes/popup/explore";
import { MessageNotificationView } from "~routes/popup/notification/[id]";
import { NotificationsView } from "~routes/popup/notifications";
import { PendingPurchase } from "~routes/popup/pending";
import { PurchaseView } from "~routes/popup/purchase";
import { ReceiveView } from "~routes/popup/receive";
import { SendView } from "~routes/popup/send";
import { SendAuthView } from "~routes/popup/send/auth";
import { ConfirmView } from "~routes/popup/send/confirm";
import { RecipientView } from "~routes/popup/send/recipient";
import { ApplicationsView } from "~routes/popup/settings/apps";
import { AppSettingsView } from "~routes/popup/settings/apps/[url]";
import { AppPermissionsView } from "~routes/popup/settings/apps/[url]/permissions";
import { ContactsView } from "~routes/popup/settings/contacts";
import { ContactSettingsView } from "~routes/popup/settings/contacts/[address]";
import { NewContactView } from "~routes/popup/settings/contacts/new";
import { NotificationSettingsView } from "~routes/popup/settings/notifications";
import { QuickSettingsView } from "~routes/popup/settings/quickSettings";
import { TokensSettingsView } from "~routes/popup/settings/tokens";
import { TokenSettingsView } from "~routes/popup/settings/tokens/[id]";
import { NewTokenSettingsView } from "~routes/popup/settings/tokens/new";
import { WalletsView } from "~routes/popup/settings/wallets";
import { WalletView } from "~routes/popup/settings/wallets/[address]";
import { ExportWalletView } from "~routes/popup/settings/wallets/[address]/export";
import { GenerateQRView } from "~routes/popup/settings/wallets/[address]/qr";
import { SubscriptionDetailsView } from "~routes/popup/subscriptions/subscriptionDetails";
import { SubscriptionManagementView } from "~routes/popup/subscriptions/subscriptionManagement";
import { SubscriptionPaymentView } from "~routes/popup/subscriptions/subscriptionPayment";
import { SubscriptionsView } from "~routes/popup/subscriptions/subscriptions";
import { AssetView } from "~routes/popup/token/[id]";
import { TokensView } from "~routes/popup/tokens";
import { TransactionView } from "~routes/popup/transaction/[id]";
import { TransactionsView } from "~routes/popup/transaction/transactions";
import type { RouteConfig } from "~wallets/router/router.types";

export const POPUP_ROUTES: RouteConfig[] = [
  {
    path: "/",
    component: HomeView
  },
  {
    path: "/purchase",
    component: PurchaseView
  },
  {
    path: "/confirm-purchase/:quoteId?",
    component: ConfirmPurchaseView
  },
  {
    path: "/purchase-pending",
    component: PendingPurchase
  },
  {
    path: "/receive",
    component: ReceiveView
  },
  {
    path: "/send/transfer/:id?",
    component: SendView
  },
  {
    path: "/send/auth/:tokenID?",
    component: SendAuthView
  },
  {
    path: "/explore",
    component: ExploreView
  },
  {
    path: "/subscriptions",
    component: SubscriptionsView
  },
  {
    path: "/subscriptions/:id",
    component: SubscriptionDetailsView
  },
  {
    path: "/subscriptions/:id/manage",
    component: SubscriptionManagementView
  },
  {
    path: "/subscriptions/:id/payment",
    component: SubscriptionPaymentView
  },
  {
    path: "/transactions",
    component: TransactionsView
  },
  {
    path: "/notifications",
    component: NotificationsView
  },
  {
    path: "/notification/:id",
    component: MessageNotificationView
  },
  {
    path: "/tokens",
    component: TokensView
  },
  {
    path: "/token/:id",
    component: AssetView
  },
  {
    path: "/collectibles",
    component: CollectiblesView
  },
  {
    path: "/collectible/:id",
    component: CollectibleView
  },
  {
    path: "/transaction/:id/:gateway?",
    component: TransactionView
  },
  {
    path: "/send/confirm/:token/:qty/:recipient/:message?",
    component: ConfirmView
  },
  {
    path: "/send/recipient/:token/:qty/:message?",
    component: RecipientView
  },
  {
    path: "/quick-settings",
    component: QuickSettingsView
  },
  {
    path: "/quick-settings/wallets",
    component: WalletsView
  },
  {
    path: "/quick-settings/wallets/:address",
    component: WalletView
  },
  {
    path: "/quick-settings/wallets/:address/export",
    component: ExportWalletView
  },
  {
    path: "/quick-settings/wallets/:address/qr",
    component: GenerateQRView
  },
  {
    path: "/quick-settings/apps",
    component: ApplicationsView
  },
  {
    path: "/quick-settings/apps/:url",
    component: AppSettingsView
  },
  {
    path: "/quick-settings/apps/:url/permissions",
    component: AppPermissionsView
  },
  {
    path: "/quick-settings/tokens",
    component: TokensSettingsView
  },
  {
    path: "/quick-settings/tokens/new",
    component: NewTokenSettingsView
  },
  {
    path: "/quick-settings/tokens/:id",
    component: TokenSettingsView
  },
  {
    path: "/quick-settings/contacts",
    component: ContactsView
  },
  {
    path: "/quick-settings/contacts/new",
    component: NewContactView
  },
  {
    path: "/quick-settings/contacts/:address",
    component: ContactSettingsView
  },
  {
    path: "/quick-settings/notifications",
    component: NotificationSettingsView
  }
];
