// Typed messaging between extension components
import type { Settings } from "./types.ts";

export type Message = { type: "GET_SETTINGS" } | { type: "SETTINGS_CHANGED"; settings: Settings };

export type MessageResponse = { settings: Settings } | undefined;
