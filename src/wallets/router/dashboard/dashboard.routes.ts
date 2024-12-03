export type DashboardRoutePath =
  | "/"
  // | `/purchase`
  // | `/confirm-purchase/${string}`
  // | `/purchase-pending`
  // | `/receive`
  // | `/send/transfer/${string}`
  // | `/send/auth/${string}`
  // | `/explore`
  // | `/subscriptions`
  // | `/subscriptions/${string}`
  // | `/subscriptions/${string}/manage`
  // | `/subscriptions/${string}/payment`
  // | `/transactions`
  // | `/notifications`
  // | `/notification/${string}`
  // | `/tokens`
  // | `/token/${string}`
  // | `/collectibles`
  // | `/collectible/${string}`
  // | `/transaction/${string}/${string}`
  // | `/send/confirm/${string}/${string}/${string}/${string}`
  // | `/send/recipient/${string}/${string}/${string}`
  // | `/quick-settings`
  | `/wallets`
  | `/wallets/${string}`
  // | `/quick-settings/wallets/${string}/export`
  // | `/quick-settings/wallets/${string}/qr`
  | `/apps`
  | `/apps/${string}`
  // | `/quick-settings/apps/${string}/permissions`
  | `/tokens`
  | `/tokens/new`
  | `/tokens/${string}`
  | `/contacts`
  | `/contacts/new`
  | `/contacts/${string}`;
// | `/quick-settings/notifications`
