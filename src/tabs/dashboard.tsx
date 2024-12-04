import { useHashLocation } from "wouter/use-hash-location";
import { Router as Wouter, Route as Woute } from "wouter";

import { SettingsDashboardView } from "~routes/dashboard";
import { ArConnectThemeProvider } from "~components/hardware/HardwareWalletTheme";
import { useBrowserExtensionWalletSetUp } from "~wallets/setup/browser-extension/browser-extension-wallet-setup.hook";

export default function Dashboard() {
  useBrowserExtensionWalletSetUp();

  return (
    <ArConnectThemeProvider>
      <Wouter hook={useHashLocation}>
        <Woute
          path="/:setting?/:subsetting?"
          component={SettingsDashboardView}
        />
      </Wouter>
    </ArConnectThemeProvider>
  );
}
