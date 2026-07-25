/**
 * ============================================================================
 * Adawaty
 * Global Constants
 * ============================================================================
 */

export const APP = Object.freeze({
    NAME: "Adawaty",
    VERSION: "1.0.0",
    DEFAULT_LANGUAGE: "en",
    DEFAULT_DIRECTION: "ltr",
    DEFAULT_THEME: "light",
});

export const LANGUAGES = Object.freeze({
    ar: {
        code: "ar",
        name: "العربية",
        direction: "rtl",
        locale: "ar-EG",
    },
    en: {
        code: "en",
        name: "English",
        direction: "ltr",
        locale: "en-US",
    },
});

export const THEMES = Object.freeze({
    LIGHT: "light",
    DARK: "dark",
    SYSTEM: "system",
});

export const STORAGE_KEYS = Object.freeze({
    THEME: "adawaty-theme",
    LANGUAGE: "adawaty-language",
    FAVORITES: "adawaty-favorites",
    RECENT: "adawaty-recent-tools",
    HISTORY: "adawaty-history",
});

export const BREAKPOINTS = Object.freeze({
    MOBILE: 576,
    TABLET: 768,
    LAPTOP: 992,
    DESKTOP: 1200,
    LARGE: 1400,
});

export const TOOL_STATUS = Object.freeze({
    ACTIVE: "active",
    COMING_SOON: "coming-soon",
    DISABLED: "disabled",
});

export const DATE_FORMAT = Object.freeze({
    SHORT: "short",
    MEDIUM: "medium",
    LONG: "long",
});