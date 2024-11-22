import { ThemeProvider, type DefaultTheme } from "styled-components";
import { useEffect, type PropsWithChildren } from "react";
import { useHardwareApi } from "~wallets/hooks";
import { useTheme } from "~utils/theme";
import { useTheme as useStyledComponentsTheme } from "styled-components";
import { MotionGlobalConfig } from "framer-motion";

const ARCONNECT_THEME_BACKGROUND_COLOR = "ARCONNECT_THEME_BACKGROUND_COLOR";
const ARCONNECT_THEME_TEXT_COLOR = "ARCONNECT_THEME_TEXT_COLOR";

/**
 * Modify the theme if the active wallet is a hardware wallet. We transform the
 * default accent color to match the hardware wallet's accent.
 */
function hardwareThemeModifier(theme: DefaultTheme): DefaultTheme {
  return {
    ...theme,
    theme: "154, 184, 255",
    primary: "#9AB8FF",
    primaryBtnHover: "#6F93E1"
  };
}

function noThemeModifier(theme: DefaultTheme): DefaultTheme {
  return theme;
}

export function ArConnectThemeProvider({ children }: PropsWithChildren<{}>) {
  const hardwareApi = useHardwareApi();
  const theme = useTheme();
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

  const lightTheme: DefaultTheme = {
    displayTheme: "light",
    theme: "171, 154, 255",
    primaryText: "0, 0, 0",
    secondaryText: "174, 173, 205",
    cardBorder: "235, 235, 241",
    background: "255, 255, 255",
    cardBackground: "255, 255, 255",
    // New styles:
    backgroundv2: "#FFFFFF",
    primary: "#7866D3",
    primaryBtnHover: "#5647A0",
    secondaryBtnHover: "#DDD9F4",
    secondaryItemHover: "#EBE8F8",
    buttonDisabled: "#BCB3E9",
    primaryTextv2: "#191919",
    secondaryTextv2: "#757575",
    buttonDisabledText: "#DDD9F4",
    inputField: "#757575",
    success: "#17A815",
    fail: "#EB0000",
    backgroundSecondary: "#CCCCCC",
    delete: "#F58080",
    secondaryDelete: "#F58080"
  } as any;

  const darkTheme: DefaultTheme = {
    displayTheme: "dark",
    theme: "171, 154, 255",
    primaryText: "255, 255, 255",
    secondaryText: "174, 173, 205",
    cardBorder: "44, 44, 47",
    background: "0, 0, 0",
    cardBackground: "22, 22, 22",
    // New styles:
    backgroundv2: "#191919",
    primary: "#8E7BEA",
    primaryBtnHover: "#6751D0",
    secondaryBtnHover: "#36324D",
    secondaryItemHover: "#2B2838",
    buttonDisabled: "#544A81",
    primaryTextv2: "#FFFFFF",
    secondaryTextv2: "#A3A3A3",
    buttonDisabledText: "#A9A4C0",
    inputField: "#847F90",
    success: "#14D110",
    fail: "#FF1A1A",
    backgroundSecondary: "#333333",
    delete: "#8C1A1A",
    secondaryDelete: "#C51A1A"
  } as any;

  return (
    <ThemeProvider
      theme={themeModifier(theme === "dark" ? darkTheme : lightTheme)}
    >
      <ThemeBackgroundObserver />

      {children}
    </ThemeProvider>
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
