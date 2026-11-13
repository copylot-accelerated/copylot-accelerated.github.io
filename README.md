# CoPylot-Accelerated — official website

Static website for **CoPylot-Accelerated**, a Python-accessible optical
simulation tool for heliostat fields in concentrating solar power towers. The
site presents the project, its execution modes, measured benchmark evidence,
installation instructions and links to the authoritative documentation in the
source repository.

The scientific repository and this website are independent projects. This
repository contains no scientific source code, binaries or duplicate
documentation. Binary archives remain in GitHub Releases in the scientific
repository.

## Stack

- [Astro](https://astro.build/) with static output only.
- [Tailwind CSS v4](https://tailwindcss.com/) through `@tailwindcss/vite`.
- TypeScript and `.astro` components.
- Inline SVG icons based on Lucide (ISC).
- Self-hosted variable Inter font from Fontsource. No external font or asset CDN.
- GitHub Pages and GitHub Actions.

There is no React, Vue, Svelte, backend, database, CMS or client-side data
fetching.

## Requirements

- Node.js 24 (`nvm use` reads `.nvmrc`).
- npm 11 or later.

## Local development

```sh
nvm use
npm ci
npm run dev
```

The development server prints the local URL. The site is configured for the
root path, so it is served at `/`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Astro development server. |
| `npm run build` | Build the static site into `dist/`. |
| `npm run preview` | Preview the production build. |
| `npm run check` | Run Astro and TypeScript diagnostics. |
| `npm run verify` | Type-check, build and verify the generated HTML, links, SEO metadata, root paths and indexing state. |
| `npm run test:releases` | Build with the stable-release fixture into `dist-fixture/` and verify release selection, asset URLs and draft exclusion. |
| `npm run test:prerelease` | Build with the prerelease-only fixture and verify the fallback label, notice and missing-target state. |

`npm run verify` is the recommended pre-deployment check. It also checks that
every internal link is root-relative and resolves to a file in the build
output.

## Project structure

```text
.
├── .github/workflows/deploy.yml   # GitHub Pages build and deployment
├── public/
│   ├── favicon.svg
│   ├── hero-optical-field-light-800.webp / -1000.webp / -1400.webp
│   ├── hero-optical-field-dark-800.webp / -1000.webp / -1400.webp
│   ├── og.png                     # Rendered social card
│   └── og.svg                     # Editable social-card source
├── scripts/
│   └── check-built-site.mjs       # Dependency-free build checks
├── src/
│   ├── components/                # Astro UI components
│   ├── config/site.ts             # Site, repository, URL and package config
│   ├── data/benchmarks.ts          # Archived benchmark values and formatting
│   ├── layouts/BaseLayout.astro   # Head, SEO, theme bootstrap, shell
│   ├── lib/releases.ts            # Build-time GitHub Releases resolver
│   ├── pages/
│   │   ├── index.astro
│   │   ├── downloads.astro
│   │   ├── docs.astro
│   │   ├── 404.astro
│   │   ├── robots.txt.ts
│   │   └── sitemap.xml.ts
│   └── styles/global.css           # Tailwind theme, tokens and base styles
├── tests/fixtures/
│   ├── releases.json              # Test-only stable-release fixture
│   └── releases-prerelease.json   # Test-only prerelease fixture
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## Content and configuration

`src/config/site.ts` is the single source of truth for:

- The canonical origin, root base path (`/`) and absolute site URL.
- Repository owner/name and GitHub URLs.
- Documentation links.
- Package targets and their release-asset suffixes.
- Whether the site is indexable.

`astro.config.mjs` imports the same module for `site` and `base`. The site is
deployed as the `copylot-accelerated.github.io` organization root site. If the
deployment origin changes, update `src/config/site.ts` first. Internal links
must use `withBase()` from that module; never hard-code the deployment origin in
a component.

Page copy lives in the page and section components. Benchmark values live in
`src/data/benchmarks.ts` and are transcribed from the scientific repository's
`benchmarks/results/annual-benchmark-matrix.csv`. Do not round the source
values or invent new comparisons.

Styles use semantic tokens in `src/styles/global.css` (`paper`, `ink`, `line`,
`accent`, etc.). The theme defaults to the system preference. The header
dropdown offers Light, Dark and System; the choice is stored in `localStorage`.

## GitHub Releases integration

`src/lib/releases.ts` runs only during the static build. The browser never
calls the GitHub API.

At build time it:

1. Requests the public releases list from
   `https://api.github.com/repos/JaviBonilla/CoPylot-Accelerated/releases`.
2. Discards drafts.
3. Selects the latest stable release. If none exists, it selects the latest
   published prerelease and labels it clearly.
4. Matches the five documented package assets by their exact suffixes.
5. Uses the real `browser_download_url` values and asset sizes.
6. Uses GitHub's `digest` metadata for SHA-256 when present; otherwise links to
   the published `SHA256SUMS.txt`.
7. Never fails the build when the repository is private, has no public release,
   or the API is rate-limited.

Display states:

- **Available**: a stable public release is selected.
- **Prerelease**: no stable release exists; the selected prerelease is marked.
- **Empty**: no published release exists.
- **Unavailable**: the API request failed or was rate-limited. No download links
  are rendered.

Only published, non-draft releases can produce download links. No binaries are
stored in this repository.

### Optional build token

`GITHUB_TOKEN` is optional. The GitHub Actions workflow passes the repository's
short-lived workflow token into the build to reduce GitHub API rate-limit
failures. It is read only in `src/lib/releases.ts` at build time and is never
rendered or sent to the browser. Public releases work without any token.

### Release fixture test

`tests/fixtures/releases.json` is synthetic test data and is never deployed. It
includes a stable release, a newer prerelease and a newer draft. Run:

```sh
npm run test:releases
npm run test:prerelease
```

The first test builds to `dist-fixture/`, verifies that the stable release is
selected, all five assets resolve to their `browser_download_url`, the checksum
file is linked, and the draft is absent. The second uses a prerelease-only
fixture and verifies that the fallback is labelled clearly, missing targets are
disclosed, and no stable release is reported.

To test a different API response locally:

```sh
RELEASES_FIXTURE=/path/to/releases.json ASTRO_OUT_DIR=dist-fixture npm run build
```

## GitHub Pages configuration

The intended public URL is:

```text
https://copylot-accelerated.github.io/
```

It lives in the organization repository
`copylot-accelerated/copylot-accelerated.github.io`. The `.github.io` repository
name makes it the organization root Pages site, so `base` is `/` and no project
subpath is used.

After publication is approved:

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **Source: GitHub Actions**.
3. Run the `Deploy website` workflow manually, or push to `main`.

The workflow installs with `npm ci`, runs `npm run verify`, executes both
release-fixture tests, uploads the build with `actions/upload-pages-artifact`
and deploys with `actions/deploy-pages`. It does not create a `gh-pages` branch.
All checks and tests run before the artifact is uploaded.

The workflow runs on:

- pushes to `main`,
- manual `workflow_dispatch`,
- a daily schedule (`17 5 * * *`) to refresh public release data.

Permissions are limited to `contents: read`, `pages: write` and
`id-token: write`. The `github-pages` concurrency group prevents simultaneous
deployments. Organization repositories use the same controls; the organization
owner must allow GitHub Pages and Actions for the repository.

**Do not enable Pages or push to `main` until the public launch is approved.**
A push to `main` triggers deployment. The site is intentionally `noindex` until
the indexing variable is enabled (see below).

### Repository separation

The website repository contains only the Astro site. The scientific project,
source code, documentation and release binaries remain at
`https://github.com/JaviBonilla/CoPylot-Accelerated`. The build reads that
repository's public Releases API; nothing in the scientific repository needs to
change when the website moves.

## Indexing

Indexing is disabled by default:

- Every page renders `<meta name="robots" content="noindex, nofollow">`.
- `robots.txt` returns `User-agent: * / Disallow: /`.
- The sitemap is generated but is not advertised.

The organization root site serves `robots.txt` at `/robots.txt`, the sitemap at
`/sitemap.xml` and every page under `/`. The per-page `noindex` directive is the
authoritative pre-launch control; `robots.txt` also disallows all crawlers until
launch.

At launch, set the repository variable `SITE_INDEXABLE=true` (Settings →
Secrets and variables → Actions → Variables), then run the deployment. This
switches the meta robots directive, robots.txt and sitemap advertisement. The
workflow passes the variable to the build as an environment variable.

## Updating content

- **Site identity and links**: `src/config/site.ts`.
- **Home sections**: `src/components/Hero.astro`, `HeroVisual.astro`,
  `Positioning.astro`, `ExecutionModes.astro`, `Performance.astro`,
  `QuickStart.astro`, `Resources.astro`.
- **Brand**: `src/components/LogoMark.astro` and the wordmark in `Header.astro`
  and `Footer.astro`.
- **Downloads page**: `src/pages/downloads.astro`,
  `DownloadStatus.astro`, `PackageCard.astro`, `SystemRequirements.astro`,
  `InstallInstructions.astro`.
- **Documentation index**: `src/pages/docs.astro` and
  `src/components/DocLink.astro`.
- **Colors, type and base styles**: `src/styles/global.css`.
- **Icons**: `src/components/Icon.astro` (Lucide-derived inline SVG paths).
- **Benchmark values**: `src/data/benchmarks.ts`.

When integrating full documentation later, add routes under `src/pages/docs/`
or a content collection, then replace the external index entries with internal
links. The current page is deliberately only an index; it does not duplicate
the scientific documentation.

## Hero illustration

The hero uses two supplied 16:9 transparent renders:

- Light: dark callouts, suitable for the paper background.
- Dark: a separate dark rendering with light callouts. Its sun core and halo are
  toned down to a warm gold so the white disc does not glare on the near-black
  background.

Both sets include 800 px, 1000 px and 1400 px WebP variants.
`HeroVisual.astro` loads only the image for the active theme and swaps it when
the user changes theme or the system preference changes. Chromatic cutout
fringing was neutralised; the warm orange palette was kept.

The image is presented without a visible caption; its accessible name
describes it as illustrative. The source PNGs are not duplicated in the
repository. The light WebP assets are about 145 KB, 210 KB and 361 KB; the dark
assets are about 139 KB, 197 KB and 330 KB.

## Social card

`public/og.png` is the rendered 1200 × 630 Open Graph image. Its editable source
is `public/og.svg`. Regenerate it with Inkscape if the design changes:

```sh
inkscape public/og.svg \
  --export-type=png \
  --export-filename=public/og.png \
  --export-width=1200 \
  --export-height=630
```

The card contains an illustrative field schematic and is labelled as such. It
is not a simulation result. The SVG source uses Inter; Inkscape falls back to an
available sans font if Inter is not installed, so check the rendered PNG after
regenerating it.

## Verification and deployment

Before deployment:

```sh
npm ci
npm run verify
npm run test:releases
```

To verify a production build at the root path:

```sh
npm run build
npm run preview
```

Open `/` on the preview server. Confirm the header, footer, downloads state,
docs index, 404 page, all three theme modes and mobile layout.

Deployment is performed by the GitHub Actions workflow. No local build artifact
is committed.

## Licensing and attribution

The website code is released under the MIT license in this repository. The
project content describes CoPylot-Accelerated and links to the licensing terms
of the scientific project:

- Eligible original project code: MIT.
- Original documentation: CC BY 4.0.
- Eligible original benchmark results and datasets: CC0 1.0.
- Upstream components (SolarPILOT™, CoPylot, SSC, SolTrace and others) retain
  their own terms and notices.

SolarPILOT™ and CoPylot are the original optical simulation software and Python
API. CoPylot-Accelerated is an independent project and is not affiliated with
or endorsed by the original developers.
