import React, { useEffect, useMemo, type PropsWithChildren } from "react";
import { Switch, useLocation, Route as Woute } from "wouter";
import { Page } from "~components/page/page.component";
import type {
  CommonRouteProps,
  RouteConfig
} from "~wallets/router/router.types";

export interface RoutesProps {
  routes: RouteConfig[];
  pageComponent?: React.ComponentType<PropsWithChildren>;
}

export function Routes({
  routes,
  pageComponent: PageComponent = Page
}: RoutesProps) {
  // In development, check there are no duplicate routes (paths):

  if (process.env.NODE_ENV === "development") {
    useEffect(() => {
      const uniqueRoutes = new Set();

      routes.forEach(({ path }) => {
        if (uniqueRoutes.has(path))
          throw new Error(`Duplicate route "${path}"`);

        uniqueRoutes.add(path);
      });
    }, [routes]);
  }

  const [location] = useLocation();

  const memoizedRoutes = useMemo(() => {
    return (
      <Switch>
        {routes.map((route) => {
          const Component = route.component;

          // TODO: Async-loaded components?

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
    );
  }, [routes, location]);

  return memoizedRoutes;
}
