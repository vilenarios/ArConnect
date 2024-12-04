import { useCallback, useEffect } from "react";
import { useLocation as useWouterLocation } from "wouter";
import type {
  RouteConfig,
  BaseRoutePath,
  ArConnectRoutePath
} from "~wallets/router/router.types";

export function prefixRoutes(
  routes: RouteConfig[],
  prefix: BaseRoutePath
): RouteConfig[] {
  return routes.map((route) => ({
    ...route,
    path: `${prefix}${route.path}`
  }));
}

export function BodyScroller() {
  const { location } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

export function useLocation() {
  const [location, navigate] = useWouterLocation();

  const back = useCallback(() => {
    history.back();
  }, []);

  return {
    location,
    navigate,
    back
  } as {
    location: ArConnectRoutePath;
    navigate: <S = any>(
      to: ArConnectRoutePath,
      options?: {
        replace?: boolean;
        state?: S;
      }
    ) => void;
    back: typeof back;
  };
}
