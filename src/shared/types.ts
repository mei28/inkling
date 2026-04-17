// Shared type definitions for inkling

export type ColorFormat = "hex" | "rgb" | "hsl";

export interface ColorMatch {
  /** The matched string exactly as found */
  raw: string;
  /** Start index in the source text */
  index: number;
  /** Color format */
  format: ColorFormat;
}

export interface Rgba {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a: number; // 0-1
}

export type DisplayMode = "background" | "foreground" | "marker" | "underline" | "dot" | "outline";

export interface Settings {
  enabled: boolean;
  displayModes: DisplayMode[];
  disabledDomains: string[];
}
