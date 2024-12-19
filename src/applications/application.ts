import { getMissingPermissions, type PermissionType } from "./permissions";
import {
  type Allowance,
  type AllowanceBigNumber,
  defaultAllowance
} from "./allowance";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import type { Storage } from "@plasmohq/storage";
import { defaultGateway, type Gateway } from "~gateways/gateway";
import BigNumber from "bignumber.js";

export const PREFIX = "app_";
export const defaultBundler = "https://turbo.ardrive.io";
export const pricingEndpoint = "https://payment.ardrive.io";

export default class Application {
  /** Root URL of the app */
  public url: string;

  #storage: Storage;

  constructor(url: string) {
    this.url = url;
    this.#storage = ExtensionStorage;
  }

  /**
   * Private method used to retrieve all settings for an app
   * @returns settings objects or an empty object
   */
  async #getSettings() {
    const settings = await this.#storage.get<Record<string, any>>(
      `${PREFIX}${this.url}`
    );

    return settings || {};
  }

  /**
   * Update settings for the app
   *
   * @param val Object of settings to update to
   */
  async updateSettings(
    val:
      | Partial<InitAppParams>
      | ((
          current: Record<string, any>
        ) => Partial<InitAppParams> | Promise<Partial<InitAppParams>>)
  ) {
    const settings = await this.#getSettings();

    if (typeof val === "function") {
      val = await val(settings);
    }

    // update keys
    for (const key in val) {
      settings[key] = val[key];
    }

    // save settings
    const res = await this.#storage.set(`${PREFIX}${this.url}`, settings);

    return res;
  }

  /**
   * App name and logo
   */
  async getAppData(): Promise<AppInfo> {
    const settings = await this.#getSettings();

    return {
      name: settings.name,
      logo: settings.logo
    };
  }

  /**
   * Permissions granted to this app
   */
  async getPermissions(): Promise<PermissionType[]> {
    const settings = await this.#getSettings();

    return settings.permissions || [];
  }

  /**
   * Check if the app has the provided permissions
   *
   * @param permissions Permissions to check for
   */
  async hasPermissions(permissions: PermissionType[]): Promise<{
    /** App has permissions or not */
    result: boolean;
    /** Existing permissions */
    has: PermissionType[];
    /** Missing permissions */
    missing: PermissionType[];
  }> {
    const existingPermissions = await this.getPermissions();
    const missing = getMissingPermissions(existingPermissions, permissions);

    return {
      result: missing.length === 0,
      has: existingPermissions,
      missing
    };
  }

  /**
   * Get if the app is connected to ArConnect
   */
  async isConnected() {
    const permissions = await this.getPermissions();

    return permissions.length > 0;
  }

  /**
   * Gateway config for each individual app
   */
  async getGatewayConfig(): Promise<Gateway> {
    const settings = await this.#getSettings();

    // TODO: wayfinder
    return settings.gateway || defaultGateway;
  }

  /**
   * Get the URL of the service for submitting data
   * to Arweave instead of using a gateway
   */
  async getBundler(): Promise<string> {
    const settings = await this.#getSettings();

    return settings.bundler || defaultBundler;
  }

  /**
   * Allowance limit and spent qty
   */
  async getAllowance(): Promise<AllowanceBigNumber> {
    const settings = await this.#getSettings();

    const allowance = settings.allowance || defaultAllowance;
    return {
      enabled: allowance.enabled,
      limit: BigNumber(allowance.limit),
      spent: BigNumber(allowance.spent)
    };
  }

  /**
   * Blocked from interacting with ArConnect
   */
  async isBlocked(): Promise<boolean> {
    const settings = await this.#getSettings();

    return !!settings.blocked;
  }

  hook() {
    return useStorage<InitAppParams>(
      {
        key: `${PREFIX}${this.url}`,
        instance: ExtensionStorage
      },
      (val) => {
        if (typeof val === "undefined") return val;

        // assign with default values
        const values = {
          allowance: defaultAllowance,
          // TODO: wayfinder
          gateway: defaultGateway,
          bundler: defaultBundler,
          ...val
        };

        return values;
      }
    );
  }
}

/**
 * App info submitted by the dApp
 */
export interface AppInfo {
  name?: string;
  logo?: string;
}

/**
 * App Logo info to be used to derive the proper placeholder
 * extends AppInfo's name and logo
 * adding an optional type: "default" | "gateway" and placeholder
 */
export interface AppLogoInfo extends AppInfo {
  type?: "default" | "gateway";
  placeholder?: string;
}

/**
 * Params to add an app with
 */
export interface InitAppParams extends AppInfo {
  url: string;
  permissions: PermissionType[];
  gateway?: Gateway;
  allowance?: Allowance;
  blocked?: boolean;
  bundler?: string;
}
