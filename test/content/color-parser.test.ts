// Color parser tests — covers findColors, toRgba, contrastColor
import { describe, expect, it } from "vitest";
import { contrastColor, findColors, toRgba } from "../../src/content/color-parser.ts";

describe("findColors", () => {
  describe("hex", () => {
    it("matches 3-digit hex", () => {
      const result = findColors("#fff");
      expect(result).toEqual([{ raw: "#fff", index: 0, format: "hex" }]);
    });

    it("matches 6-digit hex", () => {
      const result = findColors("#FF0000");
      expect(result).toEqual([{ raw: "#FF0000", index: 0, format: "hex" }]);
    });

    it("matches 4-digit hex with alpha", () => {
      const result = findColors("#0ff0");
      expect(result).toEqual([{ raw: "#0ff0", index: 0, format: "hex" }]);
    });

    it("matches 8-digit hex with alpha", () => {
      const result = findColors("#ff000080");
      expect(result).toEqual([{ raw: "#ff000080", index: 0, format: "hex" }]);
    });

    it("matches hex in surrounding text", () => {
      const result = findColors("color is #ff00aa here");
      expect(result).toEqual([{ raw: "#ff00aa", index: 9, format: "hex" }]);
    });

    it("matches hex after punctuation", () => {
      expect(findColors("(#fff)")).toEqual([{ raw: "#fff", index: 1, format: "hex" }]);
      expect(findColors("color:#abc")).toEqual([{ raw: "#abc", index: 6, format: "hex" }]);
    });

    it("rejects non-hex chars after #", () => {
      expect(findColors("#header")).toEqual([]);
      expect(findColors("#main")).toEqual([]);
      expect(findColors("#import")).toEqual([]);
    });

    it("rejects # preceded by word character", () => {
      expect(findColors("a#fff")).toEqual([]);
      expect(findColors("test#000")).toEqual([]);
    });

    it("rejects # preceded by #", () => {
      expect(findColors("##fff")).toEqual([]);
    });

    it("prefers longest match for 8-digit hex", () => {
      const result = findColors("#aabbccdd");
      expect(result).toHaveLength(1);
      expect(result[0]?.raw).toBe("#aabbccdd");
    });
  });

  describe("rgb", () => {
    it("matches rgb legacy syntax", () => {
      const result = findColors("rgb(255, 0, 0)");
      expect(result).toEqual([{ raw: "rgb(255, 0, 0)", index: 0, format: "rgb" }]);
    });

    it("matches rgba legacy syntax", () => {
      const result = findColors("rgba(255, 0, 0, 0.5)");
      expect(result).toEqual([{ raw: "rgba(255, 0, 0, 0.5)", index: 0, format: "rgb" }]);
    });

    it("matches rgb modern space-separated syntax", () => {
      const result = findColors("rgb(255 0 0)");
      expect(result).toEqual([{ raw: "rgb(255 0 0)", index: 0, format: "rgb" }]);
    });

    it("matches rgb modern with alpha", () => {
      const result = findColors("rgb(255 0 0 / 0.5)");
      expect(result).toEqual([{ raw: "rgb(255 0 0 / 0.5)", index: 0, format: "rgb" }]);
    });

    it("matches rgb with percentage alpha", () => {
      const result = findColors("rgb(255 0 0 / 50%)");
      expect(result).toEqual([{ raw: "rgb(255 0 0 / 50%)", index: 0, format: "rgb" }]);
    });

    it("is case insensitive", () => {
      const result = findColors("RGB(0, 0, 0)");
      expect(result).toHaveLength(1);
      expect(result[0]?.format).toBe("rgb");
    });
  });

  describe("hsl", () => {
    it("matches hsl legacy syntax", () => {
      const result = findColors("hsl(120, 100%, 50%)");
      expect(result).toEqual([{ raw: "hsl(120, 100%, 50%)", index: 0, format: "hsl" }]);
    });

    it("matches hsla legacy syntax", () => {
      const result = findColors("hsla(120, 100%, 50%, 0.5)");
      expect(result).toEqual([{ raw: "hsla(120, 100%, 50%, 0.5)", index: 0, format: "hsl" }]);
    });

    it("matches hsl modern space-separated syntax", () => {
      const result = findColors("hsl(120 100% 50%)");
      expect(result).toEqual([{ raw: "hsl(120 100% 50%)", index: 0, format: "hsl" }]);
    });

    it("matches hsl with deg unit", () => {
      const result = findColors("hsl(120deg 100% 50%)");
      expect(result).toEqual([{ raw: "hsl(120deg 100% 50%)", index: 0, format: "hsl" }]);
    });

    it("matches hsl modern with alpha", () => {
      const result = findColors("hsl(120 100% 50% / 0.5)");
      expect(result).toEqual([{ raw: "hsl(120 100% 50% / 0.5)", index: 0, format: "hsl" }]);
    });

    it("is case insensitive", () => {
      const result = findColors("HSL(0, 0%, 0%)");
      expect(result).toHaveLength(1);
      expect(result[0]?.format).toBe("hsl");
    });
  });

  describe("multiple matches", () => {
    it("finds multiple colors in one string", () => {
      const result = findColors("#f00 and rgb(0, 255, 0)");
      expect(result).toHaveLength(2);
      expect(result[0]?.raw).toBe("#f00");
      expect(result[1]?.raw).toBe("rgb(0, 255, 0)");
    });

    it("returns empty array for no matches", () => {
      expect(findColors("no colors here")).toEqual([]);
      expect(findColors("")).toEqual([]);
    });
  });
});

describe("toRgba", () => {
  it("converts 3-digit hex", () => {
    expect(toRgba("#fff")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(toRgba("#000")).toEqual({ r: 0, g: 0, b: 0, a: 1 });
    expect(toRgba("#f00")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it("converts 6-digit hex", () => {
    expect(toRgba("#FF0000")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(toRgba("#00ff00")).toEqual({ r: 0, g: 255, b: 0, a: 1 });
  });

  it("converts 4-digit hex with alpha", () => {
    expect(toRgba("#0ff0")).toEqual({ r: 0, g: 255, b: 255, a: 0 });
    expect(toRgba("#ffff")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });

  it("converts 8-digit hex with alpha", () => {
    const result = toRgba("#ff000080");
    expect(result).not.toBeNull();
    expect(result?.r).toBe(255);
    expect(result?.g).toBe(0);
    expect(result?.b).toBe(0);
    expect(result?.a).toBeCloseTo(0.502, 2);
  });

  it("converts rgb", () => {
    expect(toRgba("rgb(255, 0, 0)")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it("converts rgba", () => {
    expect(toRgba("rgba(255, 0, 0, 0.5)")).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
  });

  it("converts rgb modern with alpha percentage", () => {
    expect(toRgba("rgb(255 0 0 / 50%)")).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
  });

  it("converts hsl red", () => {
    expect(toRgba("hsl(0, 100%, 50%)")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it("converts hsl green", () => {
    // hsl(120, 100%, 50%) = lime = #00ff00
    expect(toRgba("hsl(120, 100%, 50%)")).toEqual({ r: 0, g: 255, b: 0, a: 1 });
  });

  it("converts hsl blue", () => {
    expect(toRgba("hsl(240, 100%, 50%)")).toEqual({ r: 0, g: 0, b: 255, a: 1 });
  });

  it("converts hsl with deg unit", () => {
    expect(toRgba("hsl(120deg, 100%, 50%)")).toEqual({ r: 0, g: 255, b: 0, a: 1 });
  });

  it("converts hsla with alpha", () => {
    expect(toRgba("hsla(0, 100%, 50%, 0.5)")).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
  });

  it("returns null for invalid input", () => {
    expect(toRgba("not a color")).toBeNull();
    expect(toRgba("")).toBeNull();
  });
});

describe("contrastColor", () => {
  it("returns black for white background", () => {
    expect(contrastColor({ r: 255, g: 255, b: 255, a: 1 })).toBe("#000");
  });

  it("returns white for black background", () => {
    expect(contrastColor({ r: 0, g: 0, b: 0, a: 1 })).toBe("#fff");
  });

  it("returns black for bright yellow", () => {
    expect(contrastColor({ r: 255, g: 255, b: 0, a: 1 })).toBe("#000");
  });

  it("returns white for dark blue", () => {
    expect(contrastColor({ r: 0, g: 0, b: 128, a: 1 })).toBe("#fff");
  });

  it("returns black for red", () => {
    // red luminance ≈ 0.2126 > 0.179 threshold
    expect(contrastColor({ r: 255, g: 0, b: 0, a: 1 })).toBe("#000");
  });

  it("returns black for light gray", () => {
    expect(contrastColor({ r: 200, g: 200, b: 200, a: 1 })).toBe("#000");
  });
});
