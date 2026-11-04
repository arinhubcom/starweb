// Find font config values that the font providers drop or accept without a
// warning. Astro checks weights, styles, subsets, and formats, and only warns.
// It does not check variation axes or icon names.

type AxisValue = string | readonly string[];

const WHITESPACE = /\s+/;
const FONT_FILE_AFTER_NAME = /^[a-z0-9]+\\?";src:url\(/;

export interface FontFamilyConfig {
  name: string;
  weights?: readonly (string | number)[];
  styles?: readonly string[];
  subsets?: readonly string[];
  options?: {
    experimental?: {
      variableAxis?: Readonly<Record<string, readonly AxisValue[]>>;
      glyphs?: readonly string[];
    };
  };
}

interface FontAxis {
  tag: string;
  min: number;
  max: number;
}

export interface FamilyProperties {
  weights?: readonly string[];
  styles?: readonly string[];
  subsets?: readonly string[];
  axes?: readonly FontAxis[];
}

type Range = readonly [number, number];

const parseWeight = (weight: string): Range => {
  const [min = Number.NaN, max = min] = weight
    .trim()
    .split(WHITESPACE)
    .map(Number);
  return [min, max];
};

const isInside = ([min, max]: Range, [low, high]: Range) =>
  min >= low && max <= high;

const isWeightAvailable = (value: string, list: readonly string[]) =>
  list.some((item) => isInside(parseWeight(value), parseWeight(item)));

const isListed = (value: string, list: readonly string[]) =>
  list.includes(value);

const missingValues = (
  label: string,
  familyName: string,
  configured: readonly string[] | undefined,
  available: readonly string[] | undefined,
  isAvailable: (value: string, list: readonly string[]) => boolean,
) => {
  if (!configured || !available) return [];
  return configured
    .filter((value) => !isAvailable(value, available))
    .map((value) => `${familyName}: no ${label} ${value}`);
};

const axisRange = (value: AxisValue): Range => {
  const [min, max = min] = typeof value === "string" ? [value] : value;
  return [Number(min), Number(max)];
};

const findAxisProblems = (
  family: FontFamilyConfig,
  axes: readonly FontAxis[] | undefined,
) =>
  Object.entries(family.options?.experimental?.variableAxis ?? {}).flatMap(
    ([tag, values]) => {
      const axis = axes?.find((candidate) => candidate.tag === tag);
      if (!axis) return [`${family.name}: no variable axis ${tag}`];
      return values
        .filter((value) => !isInside(axisRange(value), [axis.min, axis.max]))
        .map(
          (value) =>
            `${family.name}: axis ${tag} value ${String(value)} is outside ${axis.min}..${axis.max}`,
        );
    },
  );

export const findFamilyProblems = (
  family: FontFamilyConfig,
  properties: FamilyProperties | undefined,
): string[] => {
  if (!properties) return [`${family.name}: the provider has no such family`];
  return [
    ...missingValues(
      "weight",
      family.name,
      family.weights?.map(String),
      properties.weights,
      isWeightAvailable,
    ),
    ...missingValues(
      "style",
      family.name,
      family.styles,
      properties.styles,
      isListed,
    ),
    ...missingValues(
      "subset",
      family.name,
      family.subsets,
      properties.subsets,
      isListed,
    ),
    ...findAxisProblems(family, properties.axes),
  ];
};

// With no valid name, Google sends the whole font. With some valid names, it
// leaves out the others without an error.
export const findIconProblems = (
  names: readonly string[],
  knownNames: ReadonlySet<string>,
): string[] => {
  if (names.length === 0) {
    return ["ICON_NAMES is empty: the build would ship the whole icon font"];
  }
  return names
    .filter((name) => !knownNames.has(name))
    .map((name) => `Material Symbols: no icon ${name}`);
};

// A built family has `"<name>-<hash>";src:url(` in the server code. Without a
// file, the build has only the CSS variable, or a local fallback face.
export const findFamiliesWithoutFile = (
  names: readonly string[],
  serverCode: string,
): string[] =>
  names.filter(
    (name) =>
      !serverCode
        .split(`${name}-`)
        .slice(1)
        .some((part) => FONT_FILE_AFTER_NAME.test(part)),
  );
