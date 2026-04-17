// Popup entry point — settings UI
import type { Message, MessageResponse } from "../shared/messages.ts";
import type { DisplayMode, Settings } from "../shared/types.ts";

const enabledCheckbox = document.getElementById("enabled") as HTMLInputElement;
const modeRadios = document.querySelectorAll<HTMLInputElement>('input[name="mode"]');
const domainToggle = document.getElementById("domain-toggle") as HTMLInputElement;
const domainLabel = document.getElementById("domain-label") as HTMLSpanElement;

let currentSettings: Settings | null = null;
let currentDomain: string | null = null;

function sendMessage(message: Message): Promise<MessageResponse> {
  return chrome.runtime.sendMessage(message);
}

function broadcastSettings(settings: Settings): void {
  sendMessage({ type: "SETTINGS_CHANGED", settings });
}

async function init(): Promise<void> {
  // Get current tab's domain
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url) {
    try {
      currentDomain = new URL(tab.url).hostname;
      domainLabel.textContent = `Disable on ${currentDomain}`;
    } catch {
      // chrome:// and other special URLs
      currentDomain = null;
      domainToggle.disabled = true;
    }
  }

  // Load settings
  const response = await sendMessage({ type: "GET_SETTINGS" });
  if (!response?.settings) return;
  currentSettings = response.settings;

  // Populate UI
  enabledCheckbox.checked = currentSettings.enabled;

  for (const radio of modeRadios) {
    radio.checked = radio.value === currentSettings.displayMode;
  }

  if (currentDomain) {
    domainToggle.checked = currentSettings.disabledDomains.includes(currentDomain);
  }
}

enabledCheckbox.addEventListener("change", () => {
  if (!currentSettings) return;
  currentSettings.enabled = enabledCheckbox.checked;
  broadcastSettings(currentSettings);
});

for (const radio of modeRadios) {
  radio.addEventListener("change", () => {
    if (!currentSettings) return;
    currentSettings.displayMode = radio.value as DisplayMode;
    broadcastSettings(currentSettings);
  });
}

domainToggle.addEventListener("change", () => {
  if (!currentSettings || !currentDomain) return;
  const domains = new Set(currentSettings.disabledDomains);
  if (domainToggle.checked) {
    domains.add(currentDomain);
  } else {
    domains.delete(currentDomain);
  }
  currentSettings.disabledDomains = [...domains];
  broadcastSettings(currentSettings);
});

init();
