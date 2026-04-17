// Content script entry point — scans page and listens for settings changes
import { DEFAULT_SETTINGS } from "../shared/constants.ts";
import type { Message, MessageResponse } from "../shared/messages.ts";
import type { Settings } from "../shared/types.ts";
import { undecorate, updateModes } from "./decorator.ts";
import { createObserver } from "./observer.ts";
import { scan } from "./scanner.ts";

let currentSettings: Settings = DEFAULT_SETTINGS;
let observer: ReturnType<typeof createObserver> | null = null;

function currentDomain(): string {
  return location.hostname;
}

function isEnabledForDomain(settings: Settings): boolean {
  if (!settings.enabled) return false;
  return !settings.disabledDomains.includes(currentDomain());
}

function applySettings(settings: Settings): void {
  const wasActive = isEnabledForDomain(currentSettings);
  const isActive = isEnabledForDomain(settings);
  const modesChanged = currentSettings.displayModes.join(" ") !== settings.displayModes.join(" ");
  currentSettings = settings;

  if (isActive && !wasActive) {
    // Activate
    scan(document.body, settings.displayModes);
    observer = createObserver(document.body, settings.displayModes);
    observer.start();
  } else if (!isActive && wasActive) {
    // Deactivate
    observer?.stop();
    observer = null;
    undecorate(document.body);
  } else if (isActive && modesChanged) {
    // Mode change only — update attributes, no DOM restructuring
    updateModes(document, settings.displayModes);
    // Restart observer with new modes for future nodes
    observer?.stop();
    observer = createObserver(document.body, settings.displayModes);
    observer.start();
  }
}

// Request initial settings from service worker
chrome.runtime.sendMessage(
  { type: "GET_SETTINGS" } satisfies Message,
  (response: MessageResponse) => {
    if (response?.settings) {
      applySettings(response.settings);
    } else {
      applySettings(DEFAULT_SETTINGS);
    }
  },
);

// Listen for settings changes
chrome.runtime.onMessage.addListener((message: Message) => {
  if (message.type === "SETTINGS_CHANGED") {
    applySettings(message.settings);
  }
});
