import type { AppLogoInfo } from "~applications/application";
import { isGateway } from "./isGateway";
/**
 * Generates a logo placeholder based on the base domain.
 * If the URL is a gateway (determined by a GET call), it uses the first two letters of the subdomain.
 * Otherwise, it defaults to the first two letters of the base domain.
 * @param url - The URL to parse.
 * @returns - A promise resolving to the logo placeholder.
 */
export async function generateLogoPlaceholder(
  url: string
): Promise<AppLogoInfo | undefined> {
  try {
    const { hostname } = new URL(url);

    const parts = hostname.split(".");

    const baseDomain = parts.slice(-2).join(".");

    const candidateGatewayUrl =
      parts.length > 1 ? parts.slice(1).join(".") : null;

    const isGatewayUrl =
      !!candidateGatewayUrl && (await isGateway(candidateGatewayUrl));

    if (isGatewayUrl) {
      // For gateways, take the first two letters of the first subdomain
      const subdomain = parts[0];
      return {
        type: "gateway",
        placeholder: subdomain.slice(0, 2).toUpperCase()
      };
    } else {
      // For non-gateways, take the first two letters of the base domain
      return {
        type: "default",
        placeholder: baseDomain.slice(0, 2).toUpperCase()
      };
    }
  } catch (error) {
    console.error(`Error generating logo placeholder for URL: ${url}`, error);
    return undefined;
  }
}
