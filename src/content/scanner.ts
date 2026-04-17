import { ATTR_INKLING, MAX_TEXT_LENGTH } from "../shared/constants.ts";
import type { DisplayMode } from "../shared/types.ts";
// DOM traversal — TreeWalker with skip logic and shadow DOM recursion
import { findColors } from "./color-parser.ts";
import { decorate } from "./decorator.ts";

const SKIP_TAGS: ReadonlySet<string> = new Set([
  "SCRIPT",
  "STYLE",
  "TEXTAREA",
  "INPUT",
  "SELECT",
  "NOSCRIPT",
  "TEMPLATE",
  "IFRAME",
  "CANVAS",
  "SVG",
]);

const CODE_EDITOR_SELECTORS = [
  ".monaco-editor",
  ".CodeMirror",
  ".ace_editor",
  ".cm-editor",
] as const;

function shouldSkip(el: Element | null): boolean {
  if (!el) return false;
  if (SKIP_TAGS.has(el.tagName)) return true;
  if (el.getAttribute("contenteditable") === "true") return true;
  if (el.getAttribute("role") === "textbox") return true;
  if (el.closest(`[${ATTR_INKLING}]`)) return true;
  for (const sel of CODE_EDITOR_SELECTORS) {
    if (el.closest(sel)) return true;
  }
  return false;
}

/** Scan a DOM subtree for color strings and decorate them. */
export function scan(root: Node, mode: DisplayMode): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Node): number {
      const text = node as Text;
      if (shouldSkip(text.parentElement)) return NodeFilter.FILTER_REJECT;
      if (text.data.length > MAX_TEXT_LENGTH) return NodeFilter.FILTER_REJECT;
      if (text.data.trim().length === 0) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  // Collect first, then process — DOM modifications invalidate walker position
  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  for (const textNode of textNodes) {
    const matches = findColors(textNode.data);
    if (matches.length > 0) {
      decorate(textNode, matches, mode);
    }
  }

  // Recurse into open shadow roots
  if (root instanceof Element || root instanceof Document || root instanceof DocumentFragment) {
    const elements = root.querySelectorAll("*");
    for (const el of elements) {
      if (el.shadowRoot) {
        scan(el.shadowRoot, mode);
      }
    }
  }
}
