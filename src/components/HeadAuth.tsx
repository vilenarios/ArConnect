import type React from "react";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import type { AppInfo } from "~applications/application";
import Application from "~applications/application";
import useActiveTab from "~applications/useActiveTab";
import Head from "~components/popup/Head";
import HeadV2 from "~components/popup/HeadV2";
import type { Gateway } from "~gateways/gateway";
import { useAuthRequests } from "~utils/auth/auth.hooks";
import { getAppURL } from "~utils/format";

export interface HeadAuthProps {
  title?: string;
  back?: () => void;
}

export const HeadAuth: React.FC<HeadAuthProps> = ({ title, back }) => {
  const [areLogsExpanded, setAreLogsExpanded] = useState(false);
  const { authRequests, currentAuthRequestIndex } = useAuthRequests();

  // active app
  const activeTab = useActiveTab();
  const activeApp = useMemo<Application | undefined>(() => {
    if (!activeTab?.url) {
      return undefined;
    }

    return new Application(getAppURL(activeTab.url));
  }, [activeTab]);

  // active app data
  const [activeAppData, setActiveAppData] = useState<
    AppInfo & { gateway: Gateway }
  >();

  useEffect(() => {
    (async () => {
      // check if there is an active app
      if (!activeApp) {
        return setActiveAppData(undefined);
      }

      // check if connected
      const connected = await activeApp.isConnected();
      if (!connected) {
        return setActiveAppData(undefined);
      }

      // get app data
      const appData = await activeApp.getAppData();
      const gatewayConfig = await activeApp.getGatewayConfig();

      setActiveAppData({
        ...appData,
        gateway: gatewayConfig
      });
    })();
  }, [activeApp]);

  console.log({ activeAppData, activeApp: activeApp });

  return (
    <>
      <HeadV2
        title={title}
        showOptions={false}
        // allowOpen={false}
        showBack={!!back}
        back={back}
      />

      <DivTransactionTracker>
        <DivTransactionsList>
          {authRequests.map((authRequest, i) => (
            <ButtonTransactionButton
              key={authRequest.authID}
              isCurrent={i === currentAuthRequestIndex}
              isAccepted={authRequest.status === "accepted"}
              isRejected={authRequest.status === "rejected"}
            />
          ))}

          <DivTransactionButtonSpacer />

          <ButtonExpandLogs
            onClick={() =>
              setAreLogsExpanded((prevAreLogsExpanded) => !prevAreLogsExpanded)
            }
          />
        </DivTransactionsList>

        {areLogsExpanded ? (
          <DivLogWrapper>
            {authRequests.map((authRequest, i) => (
              <PreLogItem
                key={authRequest.authID}
                isCurrent={i === currentAuthRequestIndex}
                isAccepted={authRequest.status === "accepted"}
                isRejected={authRequest.status === "rejected"}
              >
                {JSON.stringify(authRequest, null, "  ")}
              </PreLogItem>
            ))}
          </DivLogWrapper>
        ) : null}
      </DivTransactionTracker>

      {activeAppData?.logo ? (
        <img
          src={activeAppData.logo}
          alt={activeAppData.name || ""}
          draggable={false}
        />
      ) : null}
    </>
  );
};

// TODO: Add indicator for the current one...

// TODO: Add date label (now, a minute ago, etc.)

// TODO: Display "X more" label if there are too many of them or add some kind of horizontal scroll or get rid of older ones...

const DivTransactionTracker = styled.div`
  position: relative;
`;

const DivTransactionsList = styled.div`
  position: relative;
  display: flex;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid rgb(31, 30, 47);
`;

const ButtonTransactionButton = styled.button`
  border: 2px solid white;
  border-radius: 128px;
  min-width: 20px;
  height: 12px;
`;

const DivTransactionButtonSpacer = styled.button`
  background: rgba(255, 255, 255, 0.125);
  border-radius: 128px;
  flex: 1 0 auto;
`;

const ButtonExpandLogs = styled.button`
  border: 2px solid white;
  border-radius: 128px;
  width: 12px;
`;

const DivLogWrapper = styled.div`
  position: absolute;
  background: black;
  top: 100%;
  left: 0;
  right: 0;
  height: 50vh;
  overflow: scroll;
  z-index: 1;
  border-bottom: 1px solid rgb(31, 30, 47);
`;

const PreLogItem = styled.pre`
  padding: 16px;

  & + & {
    border-top: 1px solid rgb(31, 30, 47);
  }
`;
