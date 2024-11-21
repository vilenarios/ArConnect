import { useEffect, type PropsWithChildren } from "react";
import { useHardwareApi } from "~wallets/hooks";
import { useTheme } from "~utils/theme";
import { useTheme as useStyledComponentsTheme } from "styled-components";
import { MotionGlobalConfig } from "framer-motion";
import {
  Provider as ArConnectProvider,
  ARCONNECT_LIGHT_THEME,
  ARCONNECT_DARK_THEME
} from "@arconnect/components";

const ARCONNECT_THEME_BACKGROUND_COLOR = "ARCONNECT_THEME_BACKGROUND_COLOR";
const ARCONNECT_THEME_TEXT_COLOR = "ARCONNECT_THEME_TEXT_COLOR";

/**
 * Modify the theme if the active wallet is a hardware wallet. We transform the
 * default accent color to match the hardware wallet's accent.
 */
function hardwareThemeModifier(theme: ArConnectTheme): ArConnectTheme {
  return {
    ...theme,
    theme: "154, 184, 255",
    primary: "#9AB8FF",
    primaryBtnHover: "#6F93E1"
  };
}

function noThemeModifier(theme: ArConnectTheme): ArConnectTheme {
  return theme;
}

export function ArConnectThemeProvider({ children }: PropsWithChildren<{}>) {
  const hardwareApi = useHardwareApi();
  const displayTheme = useTheme();
  const themeModifier = hardwareApi ? hardwareThemeModifier : noThemeModifier;

  useEffect(() => {
    const reducedMotionPreference = window.matchMedia(
      "(prefers-reduced-motion)"
    );

    if (reducedMotionPreference.matches) {
      // This could also be always set to `true` at the top of the file and then set to `false` after the application
      // loads if we still notice some flicker due to any animation/transition playing when the view first loads.

      MotionGlobalConfig.skipAnimations = true;
    }
  }, []);

  const defaultTheme =
    displayTheme === "dark" ? ARCONNECT_DARK_THEME : ARCONNECT_LIGHT_THEME;
  const theme = themeModifier(defaultTheme);

  return (
    <ArConnectProvider theme={theme}>
      <ThemeBackgroundObserver />

      {children}
    </ArConnectProvider>
  );
}

export function ThemeBackgroundObserver() {
  const styledComponentsTheme = useStyledComponentsTheme();
  const backgroundColor = styledComponentsTheme.background;
  const textColor = styledComponentsTheme.primaryText;

  useEffect(() => {
    let formattedBackgroundColor = "";

    if (backgroundColor.length === 3 || backgroundColor.length === 6) {
      formattedBackgroundColor = `#${backgroundColor}`;
    } else if (/\d{1,3}, ?\d{1,3}, ?\d{1,3}/.test(backgroundColor)) {
      formattedBackgroundColor = `rgb(${backgroundColor})`;
    } else if (/\d{1,3}, ?\d{1,3}, ?\d{1,3}, ?.+/.test(backgroundColor)) {
      formattedBackgroundColor = `rgba(${backgroundColor})`;
    }

    if (formattedBackgroundColor) {
      localStorage.setItem(
        ARCONNECT_THEME_BACKGROUND_COLOR,
        formattedBackgroundColor
      );
    }
  }, [backgroundColor]);

  useEffect(() => {
    let formattedTextColor = "";

    if (textColor.length === 3 || textColor.length === 6) {
      formattedTextColor = `#${textColor}`;
    } else if (/\d{1,3}, ?\d{1,3}, ?\d{1,3}/.test(textColor)) {
      formattedTextColor = `rgb(${textColor})`;
    } else if (/\d{1,3}, ?\d{1,3}, ?\d{1,3}, ?.+/.test(textColor)) {
      formattedTextColor = `rgba(${textColor})`;
    }

    if (formattedTextColor) {
      localStorage.setItem(ARCONNECT_THEME_TEXT_COLOR, formattedTextColor);
    }
  }, [textColor]);

  return null;
}
