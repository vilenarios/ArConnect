interface IGetAppIconProps {
  name?: string;
  url?: string;
}

/**
 * Generates a placeholder text based on the app name or URL.
 *
 * - If `appInfo.name` is available, it returns the first two uppercase letters of the name.
 * - If `url` is used as a fallback:
 *   - Extracts the first two letters from the subdomain if it is a gateway.
 *   - Extracts the first two letters from the domain if it is a regular site.
 * - Defaults to a lock icon (🔒) if neither `appInfo.name` nor a valid `url` is available.
 *
 * @param {Object} appInfo - Application information containing the name.
 * @param {string} [appInfo.name] - The name of the application.
 * @param {string} [url] - A fallback URL to determine placeholder text.
 * @returns {string} - The generated placeholder text or default icon.
 */
const getAppIconPlaceholder = (appInfo: IGetAppIconProps): string => {
  const appName = appInfo?.name;

  if (appName) {
    return appName.slice(0, 2).toUpperCase();
  }

  if (appInfo.url) {
    try {
      const parsedUrl = new URL(appInfo.url);
      const hostnameParts = parsedUrl.hostname.split(".");

      if (hostnameParts.length > 2) {
        return hostnameParts[0].slice(0, 2).toUpperCase();
      } else {
        const domain = hostnameParts[hostnameParts.length - 2];
        return domain.slice(0, 2).toUpperCase();
      }
    } catch {
      /* We're using a string based icon to avoid refactoring SquircleImg component
       * since it also receives an img prop coming from appInfo.
       **/
      return "🔒";
    }
  }
  return "🔒";
};
