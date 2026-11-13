/**
 * Single source of truth for site identity, repository locations and links.
 *
 * `astro.config.mjs` reads this module for `site` and `base`. Every internal
 * link in the site goes through `withBase()` so the published path prefix
 * cannot silently break.
 */

export type Backend = "CPU" | "CUDA";

export interface PackageSpec {
  /** Stable identifier used by the release resolver. */
  id:
    | "linux-x86_64-cpu"
    | "linux-x86_64-cuda"
    | "windows-x86_64-cpu"
    | "macos-x86_64-cpu"
    | "macos-arm64-cpu";
  platform: string;
  architecture: string;
  backend: Backend;
  /** Exact suffix used by the release asset naming convention. */
  suffix: string;
}

const repository = {
  owner: "JaviBonilla",
  name: "CoPylot-Accelerated",
  get url() {
    return `https://github.com/${this.owner}/${this.name}`;
  },
  get releases() {
    return `${this.url}/releases`;
  },
} as const;

const origin = "https://copylot-accelerated.github.io";
const base: string = "/";

const normalizedBase =
  base === "/" ? "/" : `/${base.replace(/^\/+|\/+$/g, "")}`;

export const SITE = {
  name: "CoPylot-Accelerated",
  title: "CoPylot-Accelerated — Accelerated heliostat-field optics",
  description:
    "A faster execution layer for the SolarPILOT/CoPylot optical model, with optimized CPU, multicore and CUDA execution in validated packages.",
  author: "Javier Bonilla",
  origin,
  base: normalizedBase,
  url:
    normalizedBase === "/" ? origin : `${origin}${normalizedBase}`,
  /** Set SITE_INDEXABLE=true only when the public launch is approved. */
  indexable: process.env.SITE_INDEXABLE === "true",
  buildYear: new Date().getUTCFullYear(),
  repository,
  upstream: {
    solarPilot: "https://github.com/NatLabRockies/SolarPILOT",
    paper: "https://doi.org/10.1016/j.solener.2018.06.063",
  },
  releases: {
    api: `https://api.github.com/repos/${repository.owner}/${repository.name}/releases`,
    perPage: 30,
    checksumAsset: "SHA256SUMS.txt",
  },
  packages: [
    {
      id: "linux-x86_64-cpu",
      platform: "Linux",
      architecture: "x86-64",
      backend: "CPU",
      suffix: "-linux-x86_64-cpu.tar.gz",
    },
    {
      id: "linux-x86_64-cuda",
      platform: "Linux",
      architecture: "x86-64",
      backend: "CUDA",
      suffix: "-linux-x86_64-cuda.tar.gz",
    },
    {
      id: "windows-x86_64-cpu",
      platform: "Windows",
      architecture: "x86-64",
      backend: "CPU",
      suffix: "-windows-x86_64-cpu.zip",
    },
    {
      id: "macos-x86_64-cpu",
      platform: "macOS",
      architecture: "Intel x86-64",
      backend: "CPU",
      suffix: "-macos-x86_64-cpu.tar.gz",
    },
    {
      id: "macos-arm64-cpu",
      platform: "macOS",
      architecture: "Apple Silicon ARM64",
      backend: "CPU",
      suffix: "-macos-arm64-cpu.tar.gz",
    },
  ] satisfies PackageSpec[],
  docs: {
    readme: `${repository.url}#readme`,
    installation: `${repository.url}/blob/main/docs/packaging.md`,
    packaging: `${repository.url}/blob/main/docs/packaging.md`,
    backend: `${repository.url}/blob/main/docs/backend.md`,
    multicore: `${repository.url}/blob/main/docs/cpu-multicore-design.md`,
    cudaHandoff: `${repository.url}/blob/main/docs/cuda-imageplane-fluxdensity-handoff.md`,
    cudaValidation: `${repository.url}/blob/main/docs/phase3b-report.md`,
    build: `${repository.url}/blob/main/docs/build.md`,
    dependencies: `${repository.url}/blob/main/docs/dependencies.md`,
    platformStatus: `${repository.url}/blob/main/docs/packaging.md#platform-status`,
    releaseAssets: `${repository.url}/blob/main/docs/packaging.md#release-assets`,
    benchmarkEvidence: `${repository.url}/blob/main/docs/benchmark-evidence.md`,
    reproducibility: `${repository.url}/blob/main/docs/public-reproducibility.md`,
    annualMatrix: `${repository.url}/blob/main/benchmarks/results/annual-benchmark-matrix.csv`,
    measuredToolchain: `${repository.url}/blob/main/benchmarks/results/measured-toolchain.json`,
    commercialCase: `${repository.url}/blob/main/docs/commercial-reference-case.md`,
    examples: `${repository.url}/blob/main/examples/optical_simulation.py`,
    packagedExample: `${repository.url}/blob/main/packaging/example.py`,
    license: `${repository.url}/blob/main/LICENSE`,
    docsLicense: `${repository.url}/blob/main/docs/LICENSE`,
    dataLicense: `${repository.url}/blob/main/benchmarks/results/LICENSE`,
    licensingInventory: `${repository.url}/blob/main/docs/licensing-inventory.json`,
    notices: `${repository.url}/blob/main/THIRD_PARTY_NOTICES`,
    citation: `${repository.url}#citation`,
  },
} as const;

/** Prefix an absolute site path with the configured base path. */
export function withBase(path = "/"): string {
  if (!path.startsWith("/")) return path;
  if (SITE.base === "/") return path;
  return `${SITE.base}${path}`;
}

/** Build an absolute URL for canonical, Open Graph and sitemap output. */
export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE.url}${normalized}`;
}
