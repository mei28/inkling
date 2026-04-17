// @vitest-environment jsdom
// Scanner tests — TreeWalker traversal and skip logic
import { afterEach, describe, expect, it } from "vitest";
import { scan } from "../../src/content/scanner.ts";
import { ATTR_INKLING } from "../../src/shared/constants.ts";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("scan", () => {
  it("decorates color codes in text nodes", () => {
    document.body.innerHTML = "<div>#ff0000</div>";
    scan(document.body, "background");

    const spans = document.querySelectorAll(`[${ATTR_INKLING}]`);
    expect(spans).toHaveLength(1);
    expect(spans[0]?.textContent).toBe("#ff0000");
  });

  it("decorates multiple colors across elements", () => {
    document.body.innerHTML = "<p>#f00</p><p>#0f0</p>";
    scan(document.body, "background");

    const spans = document.querySelectorAll(`[${ATTR_INKLING}]`);
    expect(spans).toHaveLength(2);
  });

  it("skips script elements", () => {
    document.body.innerHTML = '<script>var x = "#ff0000";</script>';
    scan(document.body, "background");

    expect(document.querySelectorAll(`[${ATTR_INKLING}]`)).toHaveLength(0);
  });

  it("skips style elements", () => {
    document.body.innerHTML = "<style>.a { color: #ff0000; }</style>";
    scan(document.body, "background");

    expect(document.querySelectorAll(`[${ATTR_INKLING}]`)).toHaveLength(0);
  });

  it("skips textarea elements", () => {
    document.body.innerHTML = "<textarea>#ff0000</textarea>";
    scan(document.body, "background");

    expect(document.querySelectorAll(`[${ATTR_INKLING}]`)).toHaveLength(0);
  });

  it("skips input elements", () => {
    document.body.innerHTML = '<input value="#ff0000" />';
    scan(document.body, "background");

    expect(document.querySelectorAll(`[${ATTR_INKLING}]`)).toHaveLength(0);
  });

  it("skips contenteditable elements", () => {
    document.body.innerHTML = '<div contenteditable="true">#ff0000</div>';
    scan(document.body, "background");

    expect(document.querySelectorAll(`[${ATTR_INKLING}]`)).toHaveLength(0);
  });

  it("skips elements with role=textbox", () => {
    document.body.innerHTML = '<div role="textbox">#ff0000</div>';
    scan(document.body, "background");

    expect(document.querySelectorAll(`[${ATTR_INKLING}]`)).toHaveLength(0);
  });

  it("skips elements inside code editor containers", () => {
    document.body.innerHTML = '<div class="monaco-editor"><span>#ff0000</span></div>';
    scan(document.body, "background");

    expect(document.querySelectorAll(`[${ATTR_INKLING}]`)).toHaveLength(0);
  });

  it("skips already-decorated nodes", () => {
    document.body.innerHTML = `<span ${ATTR_INKLING}>#ff0000</span>`;
    scan(document.body, "background");

    // Should not double-wrap
    const spans = document.querySelectorAll(`[${ATTR_INKLING}]`);
    expect(spans).toHaveLength(1);
  });

  it("processes nested elements correctly", () => {
    document.body.innerHTML = "<div><p><span>#ff0000</span></p></div>";
    scan(document.body, "background");

    const spans = document.querySelectorAll(`[${ATTR_INKLING}]`);
    expect(spans).toHaveLength(1);
  });

  it("skips text nodes exceeding max length", () => {
    const longText = `#ff0000${"a".repeat(10_000)}`;
    document.body.innerHTML = `<div>${longText}</div>`;
    scan(document.body, "background");

    expect(document.querySelectorAll(`[${ATTR_INKLING}]`)).toHaveLength(0);
  });

  it("does not process whitespace-only text nodes", () => {
    document.body.innerHTML = "<div>   \n\t  </div>";
    scan(document.body, "background");

    expect(document.querySelectorAll(`[${ATTR_INKLING}]`)).toHaveLength(0);
  });
});
