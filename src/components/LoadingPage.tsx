import { Loading } from "@arconnect/components";
import styled from "styled-components";
import { Page } from "~components/popup/Route";

export interface LoadingPageProps {
  label?: string;
}

export const LoadingPage = ({ label }: LoadingPageProps) => {
  return (
    <Page>
      <DivWrapper>
        <Loading style={{ width: "32px", height: "32px" }} />
        <PLabel>{label || "Loading..."}</PLabel>
      </DivWrapper>
    </Page>
  );
};

const DivWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

const PLabel = styled.div`
  padding: 24px 16px 0;
  font-size: 1rem;
  color: ${({ theme }) => theme.primaryText};
`;
