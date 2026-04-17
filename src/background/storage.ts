// Chrome storage wrapper with typed defaults
import { DEFAULT_SETTINGS } from "../shared/constants.ts";
import type { Settings } from "../shared/types.ts";

const STORAGE_KEY = "settings";

/** Load settings from chrome.storage.local, falling back to defaults. */
export async function loadSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY] as Partial<Settings> | undefined;
  return { ...DEFAULT_SETTINGS, ...stored };
}

/** Save settings to chrome.storage.local. */
export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
}
