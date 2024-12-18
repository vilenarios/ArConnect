import styled from "styled-components";
import browser from "webextension-polyfill";

import { Text } from "@arconnect/components";

export const FallbackView = () => {
  return (
    <DivWrapper>
      <Text heading>{browser.i18n.getMessage("fallback")}</Text>
    </DivWrapper>
  );
};

const DivWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;
