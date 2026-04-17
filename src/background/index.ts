// Service worker — bridges storage and content scripts
import type { Message, MessageResponse } from "../shared/messages.ts";
import { loadSettings, saveSettings } from "./storage.ts";

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse: (response: MessageResponse) => void) => {
    if (message.type === "GET_SETTINGS") {
      loadSettings().then((settings) => sendResponse({ settings }));
      return true; // async response
    }

    if (message.type === "SETTINGS_CHANGED") {
      saveSettings(message.settings).then(() => {
        broadcastToTabs(message);
        sendResponse(undefined);
      });
      return true;
    }

    return false;
  },
);

// Keyboard shortcut: toggle global enable
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-enabled") return;
  const settings = await loadSettings();
  settings.enabled = !settings.enabled;
  await saveSettings(settings);
  broadcastToTabs({ type: "SETTINGS_CHANGED", settings });
});

function broadcastToTabs(message: Message): void {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id !== undefined) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {
          // Tab may not have content script loaded
        });
      }
    }
  });
}
