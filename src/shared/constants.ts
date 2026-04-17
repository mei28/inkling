// Shared constants for inkling
import type { Settings } from "./types.ts";

export const ATTR_INKLING = "data-inkling";
export const ATTR_MODE = "data-inkling-mode";
export const CSS_VAR_COLOR = "--inkling-color";
export const CSS_VAR_CONTRAST = "--inkling-contrast";
export const DEBOUNCE_MS = 150;
export const MAX_TEXT_LENGTH = 10_000;

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  displayModes: ["background"],
  disabledDomains: [],
};
