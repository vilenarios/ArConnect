import type React from "react";
import type { RouteComponentProps as WouteComponentProps } from "wouter";

export interface CommonRouteProps<T = any>
  extends Omit<WouteComponentProps, "params"> {
  params: T;
}

export type RouteString = `/${string}`;

export type RouteAuthType = "auth" | "anon";

export interface RouteConfig {
  key?: string;
  path: RouteString;
  component: React.ComponentType<CommonRouteProps>;
  authType?: RouteAuthType;
}
