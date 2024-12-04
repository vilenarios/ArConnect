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
  const [location, wavigate] = useWouterLocation();

  const navigate = useCallback(
    <S = any>(
      to: ArConnectRoutePath,
      options?: {
        replace?: boolean;
        state?: S;
        search?: Record<string, string | number>;
      }
    ) => {
      let toPath = to;

      if (options.search) {
        const searchParams = new URLSearchParams();

        Object.entries(options.search).forEach(([key, value]) => {
          searchParams.append(key, encodeURIComponent(value));
        });

        if (searchParams.size > 0) {
          toPath += `?${searchParams.toString()}`;
        }
      }

      return wavigate(toPath, options);
    },
    [wavigate]
  );

  const back = useCallback(() => {
    history.back();
  }, []);

  return {
    location,
    navigate,
    back
  } as {
    location: ArConnectRoutePath;
    navigate: typeof navigate;
    back: typeof back;
  };
}
