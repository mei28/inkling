// DOM decoration — wraps color text in styled spans
import { ATTR_INKLING, ATTR_MODE, CSS_VAR_COLOR, CSS_VAR_CONTRAST } from "../shared/constants.ts";
import type { ColorMatch, DisplayMode } from "../shared/types.ts";
import { contrastColor, toRgba } from "./color-parser.ts";

function modesToString(modes: readonly DisplayMode[]): string {
  return modes.join(" ");
}

function buildSpan(match: ColorMatch, modes: readonly DisplayMode[]): HTMLSpanElement {
  const span = document.createElement("span");
  span.setAttribute(ATTR_INKLING, "");
  span.setAttribute(ATTR_MODE, modesToString(modes));
  span.textContent = match.raw;

  const rgba = toRgba(match.raw);
  span.style.setProperty(CSS_VAR_COLOR, match.raw);
  if (rgba && modes.includes("background")) {
    span.style.setProperty(CSS_VAR_CONTRAST, contrastColor(rgba));
  }

  return span;
}

/**
 * Replace color matches in a text node with decorated spans.
 * Processes matches left-to-right using a DocumentFragment.
 */
export function decorate(
  textNode: Text,
  matches: readonly ColorMatch[],
  modes: readonly DisplayMode[],
): void {
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
    frag.appendChild(buildSpan(m, modes));
    cursor = m.index + m.raw.length;
  }

  if (cursor < text.length) {
    frag.appendChild(document.createTextNode(text.slice(cursor)));
  }

  parent.replaceChild(frag, textNode);
}

/** Update mode attribute on all existing decorated spans without DOM restructuring. */
export function updateModes(root: Element | Document, modes: readonly DisplayMode[]): void {
  const modeValue = modesToString(modes);
  const spans = root.querySelectorAll(`[${ATTR_INKLING}]`);
  for (const span of spans) {
    span.setAttribute(ATTR_MODE, modeValue);
    // Update contrast for background mode
    if (span instanceof HTMLElement) {
      if (modes.includes("background")) {
        const raw = span.style.getPropertyValue(CSS_VAR_COLOR);
        if (raw) {
          const rgba = toRgba(raw);
          if (rgba) {
            span.style.setProperty(CSS_VAR_CONTRAST, contrastColor(rgba));
          }
        }
      } else {
        span.style.removeProperty(CSS_VAR_CONTRAST);
      }
    }
  }
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
