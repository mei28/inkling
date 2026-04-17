import { ATTR_INKLING, ATTR_MODE, CSS_VAR_COLOR, CSS_VAR_CONTRAST } from "../shared/constants.ts";
import type { ColorMatch, DisplayMode } from "../shared/types.ts";
// DOM decoration — wraps color text in styled spans
import { contrastColor, toRgba } from "./color-parser.ts";

function buildSpan(match: ColorMatch, mode: DisplayMode): HTMLSpanElement {
  const span = document.createElement("span");
  span.setAttribute(ATTR_INKLING, "");
  span.setAttribute(ATTR_MODE, mode);
  span.textContent = match.raw;

  const rgba = toRgba(match.raw);
  span.style.setProperty(CSS_VAR_COLOR, match.raw);
  if (rgba && mode === "background") {
    span.style.setProperty(CSS_VAR_CONTRAST, contrastColor(rgba));
  }

  return span;
}

/**
 * Replace color matches in a text node with decorated spans.
 * Processes matches right-to-left to preserve index validity.
 */
export function decorate(textNode: Text, matches: readonly ColorMatch[], mode: DisplayMode): void {
  if (matches.length === 0) return;
  const parent = textNode.parentNode;
  if (!parent) return;

  const text = textNode.data;
  const frag = document.createDocumentFragment();
  let cursor = 0;

  for (const m of matches) {
    if (m.index > cursor) {
      frag.appendChild(document.createTextNode(text.slice(cursor, m.index)));
    }
    frag.appendChild(buildSpan(m, mode));
    cursor = m.index + m.raw.length;
  }

  if (cursor < text.length) {
    frag.appendChild(document.createTextNode(text.slice(cursor)));
  }

  parent.replaceChild(frag, textNode);
}

/** Remove all inkling decorations from a container, restoring original text. */
export function undecorate(root: Element): void {
  const spans = root.querySelectorAll(`[${ATTR_INKLING}]`);
  for (const span of spans) {
    const text = document.createTextNode(span.textContent ?? "");
    span.parentNode?.replaceChild(text, span);
  }
  root.normalize();
}
