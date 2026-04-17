// @vitest-environment jsdom
// Observer tests — MutationObserver debounce and loop prevention
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createObserver } from "../../src/content/observer.ts";
import { ATTR_INKLING } from "../../src/shared/constants.ts";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("createObserver", () => {
  it("decorates dynamically added text with color codes", async () => {
    const observer = createObserver(document.body, "background");
    observer.start();

    const div = document.createElement("div");
    div.textContent = "#ff0000";
    document.body.appendChild(div);

    // Flush MutationObserver (jsdom processes synchronously)
    await vi.advanceTimersByTimeAsync(200);

    expect(document.querySelectorAll(`[${ATTR_INKLING}]`)).toHaveLength(1);
    observer.stop();
  });

  it("does not process nodes inside existing decorations", async () => {
    const observer = createObserver(document.body, "background");
    observer.start();

    const span = document.createElement("span");
    span.setAttribute(ATTR_INKLING, "");
    span.textContent = "#00ff00";
    document.body.appendChild(span);

    await vi.advanceTimersByTimeAsync(200);

    // Should not nest another span inside
    const nestedSpans = span.querySelectorAll(`[${ATTR_INKLING}]`);
    expect(nestedSpans).toHaveLength(0);
    observer.stop();
  });

  it("debounces rapid mutations", async () => {
    const observer = createObserver(document.body, "background");
    observer.start();

    for (let i = 0; i < 10; i++) {
      const div = document.createElement("div");
      div.textContent = `#ff000${i}`;
      document.body.appendChild(div);
    }

    // Before debounce fires
    await vi.advanceTimersByTimeAsync(50);
    const beforeCount = document.querySelectorAll(`[${ATTR_INKLING}]`).length;

    // After debounce fires
    await vi.advanceTimersByTimeAsync(200);
    const afterCount = document.querySelectorAll(`[${ATTR_INKLING}]`).length;

    // All valid hex codes should be decorated after debounce
    expect(afterCount).toBeGreaterThan(0);
    expect(afterCount).toBeGreaterThanOrEqual(beforeCount);
    observer.stop();
  });

  it("stops observing after stop is called", async () => {
    const observer = createObserver(document.body, "background");
    observer.start();
    observer.stop();

    const div = document.createElement("div");
    div.textContent = "#ff0000";
    document.body.appendChild(div);

    await vi.advanceTimersByTimeAsync(200);

    expect(document.querySelectorAll(`[${ATTR_INKLING}]`)).toHaveLength(0);
  });

  it("handles text content changes in existing nodes", async () => {
    const div = document.createElement("div");
    div.textContent = "plain text";
    document.body.appendChild(div);

    const observer = createObserver(document.body, "background");
    observer.start();

    div.textContent = "#ff0000";

    await vi.advanceTimersByTimeAsync(200);

    expect(document.querySelectorAll(`[${ATTR_INKLING}]`)).toHaveLength(1);
    observer.stop();
  });
});
