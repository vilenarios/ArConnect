import { Page } from "~components/page/page.component";

export function withPage<P>(Component: React.ComponentType<P>) {
  const PageComponent = (props: P) => {
    return (
      <Page>
        <Component {...props} />
      </Page>
    );
  };

  PageComponent.displayName = `${Component.displayName || "Anonymous"}Page`;

  return PageComponent;
}
