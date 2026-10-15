// Exact-string patches for the create-emdash starter files that Starweb does
// not own. Each edit is [from, to]. setup.mjs stops when a "from" text is
// missing, so a changed starter is noticed. The starter files use tabs:
// setup.mjs formats the project with Prettier after it applies the patches.

const CURSOR_FROM = "\tcursor,\n";
const CURSOR_TO = "\t...(cursor ? { cursor } : {}),\n";

export const starterPatches = [
  {
    file: "src/layouts/Base.astro",
    edits: [
      [
        'import { resolveStarterSiteIdentity } from "../utils/site-identity";\n',
        'import { resolveStarterSiteIdentity } from "../utils/site-identity";\nimport { themeScript } from "@/lib/theme-script";\nimport "@/styles/global.css";\n',
      ],
      [
        "\tAstro,\n\tkind:",
        "\tAstro: {\n\t\turl: Astro.url,\n\t\t...(Astro.currentLocale ? { currentLocale: Astro.currentLocale } : {}),\n\t},\n\tkind:",
      ],
      [
        "\tcanonical,\n\timage,\n\tcontent,\n",
        "\tcanonical: canonical ?? null,\n\timage: image ?? null,\n\t...(content ? { content } : {}),\n",
      ],
      ['<html lang="en">', '<html lang={Astro.currentLocale ?? "en"}>'],
      [
        "\t\t<EmDashHead page={pageCtx} />",
        "\t\t<script is:inline set:html={themeScript} />\n\t\t<EmDashHead page={pageCtx} />",
      ],
      [
        "\t<body>\n",
        '\t<body class="@container">\n\t\t<a href="#main" class="sr-only focus:not-sr-only">Skip to main content</a>\n',
      ],
      ["\t\t<main>", '\t\t<main id="main">'],
    ],
  },
  {
    file: "src/utils/site-identity.ts",
    edits: [["export interface MediaReference", "interface MediaReference"]],
  },
  { file: "src/pages/posts/index.astro", edits: [[CURSOR_FROM, CURSOR_TO]] },
  {
    file: "src/pages/category/[slug].astro",
    edits: [[CURSOR_FROM, CURSOR_TO]],
  },
  { file: "src/pages/tag/[slug].astro", edits: [[CURSOR_FROM, CURSOR_TO]] },
];
