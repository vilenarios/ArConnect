import type { ProtocolWithReturn } from "@arconnect/webext-bridge";
import type { DisplayTheme } from "@arconnect/components";
import type { Chunk } from "~api/modules/sign/chunks";
import type { InjectedEvents } from "~utils/events";
import "styled-components";
import type { AuthRequest } from "~utils/auth/auth.types";

declare module "@arconnect/webext-bridge" {
  // TODO: Make this type work with sendMessage, isomorphicSendMessage and isomorphicOnMessage

  export interface ProtocolMap {
    /**
     *
     */
    api_call: ProtocolWithReturn<ApiCall, ApiResponse>;

    /**
     *
     */
    chunk: ProtocolWithReturn<ApiCall<Chunk>, ApiResponse<number>>;

    /**
     *
     */
    auth_request: AuthRequest;

    /**
     *
     */
    auth_result: AuthResult;

    /**
     *
     */
    auth_chunk: Chunk;

    // OTHER:

    switch_wallet_event: string | null;
    copy_address: string;
    event: Event;
    ar_protocol: ProtocolWithReturn<{ url: string }, { url: sting }>;
  }
}

interface ApiCall<DataType = any> extends JsonValue {
  type: string;
  data?: DataType;
  callID: number | string;
}

interface ApiResponse<DataType = any> extends ApiCall<DataType> {
  error?: boolean;
}

interface AuthResult<DataType = any> {
  type: string;
  authID: string;
  error?: boolean;
  data?: DataType;
}

interface Event {
  name: keyof InjectedEvents;
  value: unknown;
}

declare module "styled-components" {
  export interface DefaultTheme {
    displayTheme: DisplayTheme;
    theme: string;
    primaryText: string;
    secondaryText: string;
    secondaryTextv2: string;
    background: string;
    backgroundSecondary: string;
    secondaryBtnHover: string;
    inputField: string;
    primary: string;
    backgroundv2;
    cardBorder: string;
    fail: string;
    secondaryDelete: string;
    delete: string;
    cardBackground: string;
    primaryBtnHover: string;
    primaryTextv2: string;
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    BETA_VERSION?: string;
  }
}
