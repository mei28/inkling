// Color string detection, parsing, and contrast calculation
import type { ColorFormat, ColorMatch, Rgba } from "../shared/types.ts";

const HEX = String.raw`(?<![\w#])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b`;
const RGB_LEGACY = String.raw`\brgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:[01]|0?\.\d+|\d{1,3}%))?\s*\)`;
const RGB_MODERN = String.raw`\brgba?\(\s*\d{1,3}\s+\d{1,3}\s+\d{1,3}(?:\s*/\s*(?:[01]|0?\.\d+|\d{1,3}%))?\s*\)`;
const HSL_LEGACY = String.raw`\bhsla?\(\s*\d{1,3}(?:deg|rad|grad|turn)?\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(?:\s*,\s*(?:[01]|0?\.\d+|\d{1,3}%))?\s*\)`;
const HSL_MODERN = String.raw`\bhsla?\(\s*\d{1,3}(?:deg|rad|grad|turn)?\s+\d{1,3}%\s+\d{1,3}%(?:\s*/\s*(?:[01]|0?\.\d+|\d{1,3}%))?\s*\)`;

const COLOR_REGEX = new RegExp(
  [HEX, RGB_LEGACY, RGB_MODERN, HSL_LEGACY, HSL_MODERN].join("|"),
  "gi",
);

function detectFormat(raw: string): ColorFormat {
  if (raw.startsWith("#")) return "hex";
  if (/^rgba?\(/i.test(raw)) return "rgb";
  return "hsl";
}

/** Find all color strings in text and return their positions and formats. */
export function findColors(text: string): ColorMatch[] {
  const results: ColorMatch[] = [];
  for (const match of text.matchAll(COLOR_REGEX)) {
    results.push({
      raw: match[0],
      index: match.index,
      format: detectFormat(match[0]),
    });
  }
  return results;
}

function expandShortHex(c: string): string {
  return c + c;
}

function parseHex(raw: string): Rgba | null {
  const hex = raw.slice(1);
  switch (hex.length) {
    case 3:
      return {
        r: Number.parseInt(expandShortHex(hex.charAt(0)), 16),
        g: Number.parseInt(expandShortHex(hex.charAt(1)), 16),
        b: Number.parseInt(expandShortHex(hex.charAt(2)), 16),
        a: 1,
      };
    case 4:
      return {
        r: Number.parseInt(expandShortHex(hex.charAt(0)), 16),
        g: Number.parseInt(expandShortHex(hex.charAt(1)), 16),
        b: Number.parseInt(expandShortHex(hex.charAt(2)), 16),
        a: Number.parseInt(expandShortHex(hex.charAt(3)), 16) / 255,
      };
    case 6:
      return {
        r: Number.parseInt(hex.slice(0, 2), 16),
        g: Number.parseInt(hex.slice(2, 4), 16),
        b: Number.parseInt(hex.slice(4, 6), 16),
        a: 1,
      };
    case 8:
      return {
        r: Number.parseInt(hex.slice(0, 2), 16),
        g: Number.parseInt(hex.slice(2, 4), 16),
        b: Number.parseInt(hex.slice(4, 6), 16),
        a: Number.parseInt(hex.slice(6, 8), 16) / 255,
      };
    default:
      return null;
  }
}

function parseAlpha(raw: string): number {
  if (raw.endsWith("%")) return Number.parseFloat(raw) / 100;
  return Number.parseFloat(raw);
}

function extractNumbers(raw: string): string[] | null {
  const nums = raw.match(/[\d.]+%?/g);
  if (!nums || nums.length < 3) return null;
  return nums;
}

function parseRgb(raw: string): Rgba | null {
  const nums = extractNumbers(raw);
  if (!nums) return null;
  const [n0, n1, n2, n3] = nums;
  if (n0 === undefined || n1 === undefined || n2 === undefined) return null;
  return {
    r: Number.parseInt(n0, 10),
    g: Number.parseInt(n1, 10),
    b: Number.parseInt(n2, 10),
    a: n3 !== undefined ? parseAlpha(n3) : 1,
  };
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number): number => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function parseHsl(raw: string): Rgba | null {
  const nums = extractNumbers(raw);
  if (!nums) return null;
  const [n0, n1, n2, n3] = nums;
  if (n0 === undefined || n1 === undefined || n2 === undefined) return null;
  const h = Number.parseFloat(n0);
  const s = Number.parseFloat(n1) / 100;
  const l = Number.parseFloat(n2) / 100;
  const [r, g, b] = hslToRgb(h, s, l);
  return {
    r,
    g,
    b,
    a: n3 !== undefined ? parseAlpha(n3) : 1,
  };
}

/** Convert a raw color string to RGBA values. Returns null for invalid input. */
export function toRgba(raw: string): Rgba | null {
  const format = detectFormat(raw);
  switch (format) {
    case "hex":
      return parseHex(raw);
    case "rgb":
      return parseRgb(raw);
    case "hsl":
      return parseHsl(raw);
  }
}

function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** Return black or white, whichever has higher contrast against the given color. */
export function contrastColor(rgba: Rgba): "#000" | "#fff" {
  const lum = relativeLuminance(rgba.r, rgba.g, rgba.b);
  // Threshold where black and white have equal contrast ratio
  return lum > 0.179 ? "#000" : "#fff";
}
