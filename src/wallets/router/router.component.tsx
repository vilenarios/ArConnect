import React, { useEffect, type PropsWithChildren } from "react";
import {
  Switch,
  useLocation,
  Router as Wouter,
  Route as Woute,
  type BaseLocationHook
} from "wouter";
import { Page } from "~components/Page";
import HistoryProvider from "~components/popup/HistoryProvider";
import { useHashLocation } from "~wallets/router/hash/hash-router.hook";
import type {
  CommonRouteProps,
  RouteConfig
} from "~wallets/router/router.types";
import { BodyScroller, HistoryObserver } from "~wallets/router/router.utils";

export interface RouterProps {
  routes: RouteConfig[];
  hook?: BaseLocationHook;
  pageComponent?: React.ComponentType<PropsWithChildren>;
}

export function Router({
  routes,
  hook = useHashLocation,
  pageComponent: PageComponent = Page
}: RouterProps) {
  // TODO: In development, check there are no duplicates...

  // TODO: Async-loaded components?

  // TODO: Create a base type for views and rename them all (component and file)...

  // TODO: Move motion wrapper here...

  return (
    <Wouter hook={hook}>
      <BodyScroller />
      <HistoryObserver />

      <Switch>
        {routes.map((route) => {
          const Component = route.component;

          const PageWithComponent: React.ComponentType<CommonRouteProps> = (
            props
          ) => {
            return (
              <PageComponent>
                <Component {...props} />
              </PageComponent>
            );
          };

          return (
            <Woute
              key={route.key}
              path={route.path}
              component={PageWithComponent}
            />
          );
        })}
      </Switch>
    </Wouter>
  );
}
