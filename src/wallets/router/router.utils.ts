import { useEffect } from "react";
import { useLocation } from "wouter";
import type { RouteConfig, RouteString } from "~wallets/router/router.types";

export function prefixRoutes(
  routes: RouteConfig[],
  prefix: RouteString
): RouteConfig[] {
  return routes.map((route) => ({
    ...route,
    path: `${prefix}${route.path}`
  }));
}

export function BodyScroller() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

export function HistoryObserver() {
  const [location] = useLocation();

  // TODO: To be implemented...

  return null;
}
