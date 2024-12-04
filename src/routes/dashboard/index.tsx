import { Card, Spacer, Text, useInput } from "@arconnect/components";
import SettingListItem from "~components/dashboard/list/SettingListItem";
import { SettingsList } from "~components/dashboard/list/BaseElement";
import { useEffect, useMemo, useState } from "react";
import { ChevronUp, ChevronDown } from "@untitled-ui/icons-react";
import Application from "~applications/application";
import browser from "webextension-polyfill";
import styled from "styled-components";
import settings from "~settings";
import { PageType, trackPage } from "~utils/analytics";
import SearchInput from "~components/dashboard/SearchInput";
import { useLocation } from "~wallets/router/router.utils";

import { WalletSettingsDashboardView } from "~components/dashboard/subsettings/WalletSettings";
import { TokenSettingsDashboardView } from "~components/dashboard/subsettings/TokenSettings";
import { AppSettingsDashboardView } from "~components/dashboard/subsettings/AppSettings";
import { ContactSettingsDashboardView } from "~components/dashboard/subsettings/ContactSettings";
import { AddWalletDashboardView } from "~components/dashboard/subsettings/AddWallet";
import { AddContactDashboardView } from "~components/dashboard/subsettings/AddContact";
import { SettingDashboardView } from "~components/dashboard/Setting";
import { AddTokenDashboardView } from "~components/dashboard/subsettings/AddToken";
import {
  advancedSettings,
  allSettings,
  basicSettings,
  type DashboardRouteConfig
} from "~routes/dashboard/dashboard.constants";
import type Setting from "~settings/setting";

export interface SettingsDashboardViewParams {
  setting?: string;
  subsetting?: string;
}

export interface SettingsDashboardViewProps {
  params: SettingsDashboardViewParams;
}

export function SettingsDashboardView({ params }: SettingsDashboardViewProps) {
  const { navigate } = useLocation();

  const [showAdvanced, setShowAdvanced] = useState(false);

  // search
  const searchInput = useInput();

  const { setting: activeSetting, subsetting: activeSubSetting } = params;

  // active setting val
  // const activeSetting = useMemo(() => params.setting, [params.setting]);

  // active subsetting val
  // const activeSubSetting = useMemo(
  //   () => params.subsetting,
  //   [params.subsetting]
  // );

  // whether the active setting is a setting defined
  // in "~settings/index.ts" or not
  const definedSetting = useMemo(
    () => !!settings.find((s) => s.name === activeSetting),
    [activeSetting]
  );

  // active app setting
  const activeAppSetting = useMemo(() => {
    if (!activeSubSetting || activeSetting !== "apps") {
      return undefined;
    }

    return new Application(decodeURIComponent(activeSubSetting));
  }, [activeSubSetting]);

  // search filter function
  function filterSearchResults(
    dashboardRouteConfig: DashboardRouteConfig | Setting
  ) {
    const query = searchInput.state;

    if (query === "" || !query) {
      return true;
    }

    return (
      dashboardRouteConfig.name.toLowerCase().includes(query.toLowerCase()) ||
      browser.i18n
        .getMessage(dashboardRouteConfig.displayName)
        .toLowerCase()
        .includes(query.toLowerCase()) ||
      browser.i18n
        .getMessage(dashboardRouteConfig.description)
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  }

  // redirect to the first setting
  // if none is selected
  useEffect(() => {
    if (!!activeSetting) return;
    navigate(`/${allSettings[0].name}`);
  }, [activeSetting]);

  // Segment
  useEffect(() => {
    trackPage(PageType.SETTINGS);
  }, []);

  return (
    <SettingsWrapper>
      <Panel normalPadding showRightBorder>
        <Spacer y={0.45} />
        <SettingsTitle>{browser.i18n.getMessage("settings")}</SettingsTitle>
        <Spacer y={0.85} />
        <SearchInput
          placeholder={browser.i18n.getMessage("search")}
          {...searchInput.bindings}
        />
        <Spacer y={0.85} />
        <Text noMargin>{browser.i18n.getMessage("general")}</Text>
        <Spacer y={0.85} />
        <SettingsList>
          {basicSettings.filter(filterSearchResults).map((setting, i) => (
            <SettingListItem
              displayName={setting.displayName}
              description={setting.description}
              icon={setting.icon}
              active={activeSetting === setting.name}
              onClick={() => navigate(`/${setting.name}`)}
              key={`basic-settings-${i}`}
            />
          ))}
          <AdvancedWrapper>
            <Text noMargin>{browser.i18n.getMessage("advanced")}</Text>
            <div
              onClick={() => setShowAdvanced((prev) => !prev)}
              style={{ display: "flex", cursor: "pointer" }}
            >
              <Text noMargin>
                {browser.i18n.getMessage(showAdvanced ? "hide" : "show")}
              </Text>
              <Action as={showAdvanced ? ChevronUp : ChevronDown} />
            </div>
          </AdvancedWrapper>
          {showAdvanced &&
            advancedSettings
              .filter(filterSearchResults)
              .map((setting, i) => (
                <SettingListItem
                  displayName={setting.displayName}
                  description={setting.description}
                  icon={setting.icon}
                  active={activeSetting === setting.name}
                  onClick={() => navigate(`/${setting.name}`)}
                  key={`advanced-settings-${i}`}
                />
              ))}
        </SettingsList>
      </Panel>
      <Panel normalPadding showRightBorder>
        <Spacer y={0.45} />
        <MidSettingsTitle>
          {allSettings &&
            browser.i18n.getMessage(
              allSettings.find((s) => s.name === activeSetting)?.displayName ||
                ""
            )}
        </MidSettingsTitle>
        <Spacer y={0.85} />
        {activeSetting &&
          ((definedSetting && (
            <SettingDashboardView
              setting={settings.find((s) => s.name === activeSetting)}
              key={activeSetting}
            />
          )) ||
            (() => {
              const Component = allSettings.find(
                (s) => s.name === activeSetting
              )?.component;

              if (!Component) {
                // TODO: Should this be a redirect?
                return <></>;
              }

              return <Component />;
            })())}
      </Panel>
      <Panel>
        {!!activeAppSetting && (
          <AppSettingsDashboardView
            app={activeAppSetting}
            showTitle
            key={activeAppSetting.url}
          />
        )}
        {activeSetting === "wallets" &&
          !!activeSubSetting &&
          activeSubSetting !== "new" && (
            <WalletSettingsDashboardView
              address={activeSubSetting}
              key={activeSubSetting}
            />
          )}
        {activeSetting === "wallets" && activeSubSetting === "new" && (
          <AddWalletDashboardView key="new-wallet" />
        )}
        {activeSetting === "tokens" && activeSubSetting !== "new" && (
          <TokenSettingsDashboardView id={activeSubSetting} />
        )}
        {activeSetting === "tokens" && activeSubSetting === "new" && (
          <AddTokenDashboardView key="new-token" />
        )}
        {activeSetting === "contacts" &&
          activeSubSetting &&
          activeSubSetting.startsWith("new") && (
            <AddContactDashboardView key="new-contacts" />
          )}
        {activeSetting === "contacts" &&
          activeSubSetting &&
          !activeSubSetting.startsWith("new") && (
            <ContactSettingsDashboardView
              address={activeSubSetting}
              key={activeSubSetting}
            />
          )}
      </Panel>
    </SettingsWrapper>
  );
}

const SettingsWrapper = styled.div`
  display: grid;
  align-items: stretch;
  grid-template-columns: 1fr 1fr 1.5fr;
  padding: 2rem;
  width: calc(100vw - 2rem * 2);
  height: calc(100vh - 2rem * 2);

  @media screen and (max-width: 900px) {
    display: flex;
    flex-wrap: wrap;
    row-gap: 2rem;
    height: auto;
  }
`;

const AdvancedWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Action = styled(ChevronDown)`
  cursor: pointer;
  font-size: 1.25rem;
  width: 1.5rem;
  height: 1.54rem;
  color: rgb(${(props) => props.theme.secondaryText});
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.85;
  }

  &:active {
    transform: scale(0.92);
  }
`;

const isMac = () => {
  const userAgent = navigator.userAgent;

  return userAgent.includes("Mac") && !userAgent.includes("Windows");
};

const Panel = styled(Card)<{
  normalPadding?: boolean;
  showRightBorder?: boolean;
}>`
  position: relative;
  border-radius: 0;
  ${(props) => props.showRightBorder && `border-right: 1.5px solid #8e7bea;`}
  padding: ${(props) => (props.normalPadding ? "1.5rem 1rem" : "1.5rem")};
  overflow-y: auto;

  ${!isMac()
    ? `
    -ms-overflow-style: none;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }`
    : ""}

  @media screen and (max-width: 900px) {
    width: calc(50% - 2.5rem);
    height: 55vh;
    flex-grow: 1;

    &:nth-child(2) {
      border-right: 1px solid rgb(${(props) => props.theme.cardBorder});
    }

    &:last-child {
      width: 100%;
      height: auto;
    }
  }

  @media screen and (max-width: 645px) {
    width: 100%;
    height: 55vh;
    border-right: 1px solid rgb(${(props) => props.theme.cardBorder});

    &:last-child {
      height: auto;
    }
  }
`;

const SettingsTitle = styled(Text).attrs({
  title: true,
  noMargin: true
})``;

const MidSettingsTitle = styled(Text).attrs({
  title: true,
  noMargin: true
})`
  font-weight: 600;
  text-transform: capitalize;
`;
