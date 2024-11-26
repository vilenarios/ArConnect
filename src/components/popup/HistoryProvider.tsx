import { type PropsWithChildren, useState } from "react";
import { useLocation } from "wouter";
import {
  type BackAction,
  type HistoryAction,
  HistoryContext,
  type PushAction
} from "~wallets/router/hash/hash-router.hook";

// TODO: Do we really need this instead of simply calling history.back()?

export default function HistoryProvider({ children }: PropsWithChildren<{}>) {
  // current history action
  const [currentAction, setCurrentAction] = useState<HistoryAction>("push");

  // location
  const [, setLocation] = useLocation();

  // push action implementation
  const push: PushAction = (to, options) => {
    setCurrentAction("push");
    setLocation(to, options);
  };

  // back action implementation
  const back: BackAction = () => {
    setCurrentAction("pop");
    history.back();
  };

  return (
    <HistoryContext.Provider value={[push, back, currentAction]}>
      {children}
    </HistoryContext.Provider>
  );
}
