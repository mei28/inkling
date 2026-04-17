// @vitest-environment jsdom
// Decorator tests — text node splitting and span wrapping
import { afterEach, describe, expect, it } from "vitest";
import { findColors } from "../../src/content/color-parser.ts";
import { decorate, undecorate } from "../../src/content/decorator.ts";
import {
  ATTR_INKLING,
  ATTR_MODE,
  CSS_VAR_COLOR,
  CSS_VAR_CONTRAST,
} from "../../src/shared/constants.ts";

function createTextInDiv(text: string): { node: Text; parent: HTMLDivElement } {
  const div = document.createElement("div");
  div.textContent = text;
  document.body.appendChild(div);
  return { node: div.firstChild as Text, parent: div };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("decorate", () => {
  it("wraps a single hex color in a span", () => {
    const { node, parent } = createTextInDiv("#ff0000");
    const matches = findColors(node.data);
    decorate(node, matches, ["background"]);

    const span = parent.querySelector(`[${ATTR_INKLING}]`);
    expect(span).not.toBeNull();
    expect(span?.textContent).toBe("#ff0000");
    expect(span?.getAttribute(ATTR_MODE)).toBe("background");
  });

  it("preserves surrounding text", () => {
    const { node, parent } = createTextInDiv("color is #ff0000 here");
    const matches = findColors(node.data);
    decorate(node, matches, ["background"]);

    expect(parent.textContent).toBe("color is #ff0000 here");
    expect(parent.querySelector(`[${ATTR_INKLING}]`)?.textContent).toBe("#ff0000");
  });

  it("handles multiple matches in one text node", () => {
    const { node, parent } = createTextInDiv("#f00 and #0f0");
    const matches = findColors(node.data);
    decorate(node, matches, ["background"]);

    const spans = parent.querySelectorAll(`[${ATTR_INKLING}]`);
    expect(spans).toHaveLength(2);
    expect(spans[0]?.textContent).toBe("#f00");
    expect(spans[1]?.textContent).toBe("#0f0");
    expect(parent.textContent).toBe("#f00 and #0f0");
  });

  it("sets CSS custom properties for background mode", () => {
    const { node, parent } = createTextInDiv("#ff0000");
    const matches = findColors(node.data);
    decorate(node, matches, ["background"]);

    const span = parent.querySelector(`[${ATTR_INKLING}]`) as HTMLElement;
    expect(span.style.getPropertyValue(CSS_VAR_COLOR)).toBe("#ff0000");
    // red luminance ≈ 0.2126 > 0.179 → black text
    expect(span.style.getPropertyValue(CSS_VAR_CONTRAST)).toBe("#000");
  });

  it("sets CSS custom properties for foreground mode", () => {
    const { node, parent } = createTextInDiv("#ff0000");
    const matches = findColors(node.data);
    decorate(node, matches, ["foreground"]);

    const span = parent.querySelector(`[${ATTR_INKLING}]`) as HTMLElement;
    expect(span.getAttribute(ATTR_MODE)).toBe("foreground");
    expect(span.style.getPropertyValue(CSS_VAR_COLOR)).toBe("#ff0000");
  });

  it("sets CSS custom properties for marker mode", () => {
    const { node, parent } = createTextInDiv("#ff0000");
    const matches = findColors(node.data);
    decorate(node, matches, ["marker"]);

    const span = parent.querySelector(`[${ATTR_INKLING}]`) as HTMLElement;
    expect(span.getAttribute(ATTR_MODE)).toBe("marker");
    expect(span.style.getPropertyValue(CSS_VAR_COLOR)).toBe("#ff0000");
  });

  it("handles match at start of text", () => {
    const { node, parent } = createTextInDiv("#fff rest");
    const matches = findColors(node.data);
    decorate(node, matches, ["background"]);

    expect(parent.textContent).toBe("#fff rest");
    expect(parent.childNodes).toHaveLength(2);
  });

  it("handles match at end of text", () => {
    const { node, parent } = createTextInDiv("start #fff");
    const matches = findColors(node.data);
    decorate(node, matches, ["background"]);

    expect(parent.textContent).toBe("start #fff");
    expect(parent.childNodes).toHaveLength(2);
  });

  it("does nothing for empty matches", () => {
    const { node, parent } = createTextInDiv("no colors here");
    decorate(node, [], ["background"]);

    expect(parent.querySelector(`[${ATTR_INKLING}]`)).toBeNull();
    expect(parent.textContent).toBe("no colors here");
  });

  it("handles rgb() color", () => {
    const { node, parent } = createTextInDiv("rgb(255, 0, 0)");
    const matches = findColors(node.data);
    decorate(node, matches, ["background"]);

    const span = parent.querySelector(`[${ATTR_INKLING}]`);
    expect(span?.textContent).toBe("rgb(255, 0, 0)");
  });
});

describe("undecorate", () => {
  it("removes all inkling spans from a container", () => {
    const div = document.createElement("div");
    div.innerHTML = 'color <span data-inkling data-inkling-mode="background">#fff</span> end';
    document.body.appendChild(div);

    undecorate(div);

    expect(div.querySelector(`[${ATTR_INKLING}]`)).toBeNull();
    expect(div.textContent).toBe("color #fff end");
  });

  it("normalizes adjacent text nodes after removal", () => {
    const div = document.createElement("div");
    div.innerHTML = 'a<span data-inkling data-inkling-mode="background">#fff</span>b';
    document.body.appendChild(div);

    undecorate(div);

    expect(div.childNodes).toHaveLength(1);
    expect(div.textContent).toBe("a#fffb");
  });
});
