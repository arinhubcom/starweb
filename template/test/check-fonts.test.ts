import { describe, expect, it } from "vitest";
import {
  findFamiliesWithoutFile,
  findFamilyProblems,
  findIconProblems,
} from "../scripts/lib/check-fonts";

const PROPERTIES = {
  weights: ["100", "400", "700", "100 1000"],
  styles: ["normal"],
  subsets: ["latin", "latin-ext"],
  axes: [{ tag: "opsz", min: 8, max: 144 }],
};

describe("findFamilyProblems", () => {
  it("accepts values that the provider can serve", () => {
    expect(
      findFamilyProblems(
        {
          name: "Flex",
          weights: ["400 700"],
          styles: ["normal"],
          subsets: ["latin", "latin-ext"],
          options: {
            experimental: { variableAxis: { opsz: [["8", "144"], "14"] } },
          },
        },
        PROPERTIES,
      ),
    ).toEqual([]);
  });

  it("reports a family that the provider does not know", () => {
    expect(findFamilyProblems({ name: "Nope" }, undefined)).toEqual([
      "Nope: the provider has no such family",
    ]);
  });

  it("reports a weight outside every available range", () => {
    expect(
      findFamilyProblems({ name: "Flex", weights: ["50 700"] }, PROPERTIES),
    ).toEqual(["Flex: no weight 50 700"]);
  });

  it("accepts a numeric weight, which Astro also allows", () => {
    expect(
      findFamilyProblems({ name: "Flex", weights: [400] }, PROPERTIES),
    ).toEqual([]);
    expect(
      findFamilyProblems({ name: "Flex", weights: [50] }, PROPERTIES),
    ).toEqual(["Flex: no weight 50"]);
  });

  it("reports a style and a subset that the family does not have", () => {
    expect(
      findFamilyProblems(
        { name: "Flex", styles: ["italic"], subsets: ["greek"] },
        PROPERTIES,
      ),
    ).toEqual(["Flex: no style italic", "Flex: no subset greek"]);
  });

  it("reports an axis that the family does not publish", () => {
    expect(
      findFamilyProblems(
        {
          name: "Flex",
          options: { experimental: { variableAxis: { NOPE: ["1"] } } },
        },
        PROPERTIES,
      ),
    ).toEqual(["Flex: no variable axis NOPE"]);
  });

  it("reports an axis value out of range", () => {
    expect(
      findFamilyProblems(
        {
          name: "Flex",
          options: { experimental: { variableAxis: { opsz: [["1", "144"]] } } },
        },
        PROPERTIES,
      ),
    ).toEqual(["Flex: axis opsz value 1,144 is outside 8..144"]);
  });

  it("skips a check when the provider does not expose the value", () => {
    expect(
      findFamilyProblems({ name: "Icons", subsets: ["latin"] }, { styles: [] }),
    ).toEqual([]);
  });
});

describe("findIconProblems", () => {
  const known = new Set(["search", "close"]);

  it("accepts known names", () => {
    expect(findIconProblems(["close", "search"], known)).toEqual([]);
  });

  it("reports each unknown name", () => {
    expect(findIconProblems(["search", "serach"], known)).toEqual([
      "Material Symbols: no icon serach",
    ]);
  });

  it("reports an empty list, which ships the whole font", () => {
    expect(findIconProblems([], known)).toEqual([
      "ICON_NAMES is empty: the build would ship the whole icon font",
    ]);
  });
});

describe("findFamiliesWithoutFile", () => {
  const FLEX =
    '@font-face{font-family:\\"Flex-19ab\\";src:url(\\"/_astro/fonts/8e.woff2\\")}';

  it("accepts a family with a font file", () => {
    expect(findFamiliesWithoutFile(["Flex"], FLEX)).toEqual([]);
  });

  it("reports a family with only the CSS variable", () => {
    const code = ':root{--font-flex:\\"Flex-19ab\\",sans-serif;}';
    expect(findFamiliesWithoutFile(["Flex"], code)).toEqual(["Flex"]);
  });

  it("does not count a local fallback face as a file", () => {
    const code =
      '@font-face{font-family:\\"Flex-19ab fallback: Arial\\";src:local(\\"Arial\\")}';
    expect(findFamiliesWithoutFile(["Flex"], code)).toEqual(["Flex"]);
  });

  it("reports only the family that has no file", () => {
    expect(findFamiliesWithoutFile(["Flex", "Icons"], FLEX)).toEqual(["Icons"]);
  });
});
