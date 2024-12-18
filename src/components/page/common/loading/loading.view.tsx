import { Loading } from "@arconnect/components";
import styled from "styled-components";
import type { CommonRouteProps } from "~wallets/router/router.types";

export interface LoadingViewProps extends CommonRouteProps {
  label?: string;
}

export const LoadingView = ({ label }: LoadingViewProps) => {
  return (
    <DivWrapper>
      <Loading style={{ width: "32px", height: "32px" }} />
      <PLabel>{label || "Loading..."}</PLabel>
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

const PLabel = styled.div`
  padding: 24px 16px 0;
  font-size: 1rem;
  color: ${({ theme }) => theme.primaryText};
`;