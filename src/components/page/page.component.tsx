import { type Variants, motion } from "framer-motion";
import type { PropsWithChildren } from "react";
import styled from "styled-components";

export interface PageProps extends PropsWithChildren {}

export function Page({ children }: PageProps) {
  const opacityAnimation: Variants = {
    initial: { opacity: 0 },
    enter: { opacity: 1 },
    exit: { opacity: 0, y: 0, transition: { duration: 0.2 } }
  };

  return (
    <Main
      initial="initial"
      animate="enter"
      exit="exit"
      variants={opacityAnimation}
      data-test-id="Page"
    >
      {children}
    </Main>
  );
}

const Main = styled(motion.main)`
  position: relative;
  top: 0;
  width: 100%;
  min-height: 100vh;
  max-height: max-content;
`;
