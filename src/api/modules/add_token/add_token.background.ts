import { isAddress, isTokenType, isValidURL } from "~utils/assertions";
import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { requestUserAuthorization } from "../../../utils/auth/auth.utils";
import { getTokens } from "~tokens";

const background: BackgroundModuleFunction<void> = async (
  appData,
  id: unknown,
  type?: unknown,
  dre_node?: unknown
) => {
  // validate input
  isAddress(id);

  if (type) isTokenType(type);
  if (dre_node) isValidURL(dre_node);

  // check if the token is added already
  const tokens = await getTokens();

  if (tokens.find((token) => token.id === id)) {
    throw new Error("Token already added");
  }

  // request "add token" popup
  await requestUserAuthorization(
    {
      type: "token",
      tokenID: id,
      tokenType: type,
      dre: dre_node
    },
    appData
  );
};

export default background;
