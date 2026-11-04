// Check src/lib/fonts.ts against the font providers. Run with: pnpm run fonts
// Needs network access, like the build. See Fonts in rules/MEDIA.md.
import { ICON_NAMES, fonts } from "../src/lib/fonts.ts";
import {
  findFamilyProblems,
  findIconProblems,
  type FamilyProperties,
} from "./lib/check-fonts.ts";

const ICON_METADATA_URL =
  "https://fonts.google.com/metadata/icons?key=material_symbols&incomplete=true";

const memory = new Map<string, unknown>();

const storage = {
  getItem: async (key: string, init?: () => unknown) => {
    if (memory.has(key)) return memory.get(key);
    if (!init) return null;
    const value = await init();
    memory.set(key, value);
    return value;
  },
  setItem: (key: string, value: unknown) => {
    memory.set(key, value);
  },
};

const context = {
  storage,
  root: new URL("../", import.meta.url),
  fetch: (url: string, init?: RequestInit) => fetch(url, init),
};

// The built-in providers also return `axes`, which the Astro type leaves out.
const getProperties = async (
  family: (typeof fonts)[number],
): Promise<FamilyProperties | undefined> => {
  await family.provider.init?.(context);
  return (await family.provider.getFontProperties?.({
    familyName: family.name,
  })) as FamilyProperties | undefined;
};

const getKnownIconNames = async () => {
  const response = await fetch(ICON_METADATA_URL);
  if (!response.ok) {
    throw new Error(`Icon metadata request failed: ${response.status}`);
  }
  // The response starts with a line that is not JSON.
  const text = await response.text();
  const { icons } = JSON.parse(text.slice(text.indexOf("\n") + 1)) as {
    icons: { name: string }[];
  };
  return new Set(icons.map((icon) => icon.name));
};

const main = async () => {
  const familyProblems = await Promise.all(
    fonts.map(async (family) =>
      findFamilyProblems(family, await getProperties(family)),
    ),
  );
  const problems = [
    ...familyProblems.flat(),
    ...findIconProblems(ICON_NAMES, await getKnownIconNames()),
  ];
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  console.info(`Fonts: ${fonts.length} families, ${ICON_NAMES.length} icons`);
};

try {
  await main();
} catch (error) {
  console.error(
    `The font check could not ask the font providers, so it did not check src/lib/fonts.ts. Check the network and try again.\n${String(error)}`,
  );
  process.exit(1);
}
