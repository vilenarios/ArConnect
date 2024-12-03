import { useHashLocation } from "wouter/use-hash-location";
import { Router, Route } from "wouter";

import { SettingsDashboardView } from "~routes/dashboard";
import { ArConnectThemeProvider } from "~components/hardware/HardwareWalletTheme";
import { useBrowserExtensionWalletSetUp } from "~wallets/setup/browser-extension/browser-extension-wallet-setup.hook";

export default function Dashboard() {
  useBrowserExtensionWalletSetUp();

  return (
    <ArConnectThemeProvider>
      <Router hook={useHashLocation}>
        <Route
          path="/:setting?/:subsetting?"
          component={SettingsDashboardView}
        />
      </Router>
    </ArConnectThemeProvider>
  );
}
