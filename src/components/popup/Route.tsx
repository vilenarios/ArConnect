import { createElement } from "react";
import { useRoute, Route as BaseRoute } from "wouter";
import { Page } from "~components/Page";

/**
 * Custom Route component that allows iOS-like animations
 */

/*
const Route: typeof BaseRoute = ({ path, component, children }) => {
  const [matches, params] = useRoute(path);

  if (!matches) return null;

  const routeContent = component
    ? createElement(component, { params })
    : typeof children === "function"
    ? children(params)
    : children;

  return <Page>{routeContent}</Page>;
};
*/
