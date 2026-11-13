/**
 * Build-time GitHub Releases resolver.
 *
 * The browser never talks to the GitHub API. This module runs during the
 * static build, filters drafts, selects the latest stable release (falling
 * back to a prerelease when no stable release exists) and resolves the real
 * `browser_download_url` of each documented package asset.
 *
 * The build must never fail because the source repository is private, has no
 * public release, or the GitHub API is unavailable. Every failure is converted
 * into a display state.
 */

import { readFile } from "node:fs/promises";
import { SITE, type PackageSpec } from "../config/site";

interface GitHubAsset {
  name: string;
  size: number;
  browser_download_url: string;
  digest?: string | null;
}

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  html_url: string;
  published_at: string | null;
  draft: boolean;
  prerelease: boolean;
  assets: GitHubAsset[];
}

export type ReleaseStatus = "available" | "prerelease" | "empty" | "unavailable";
export type RepositoryStatus = "public" | "not-public" | "unknown";
export type ReleaseErrorReason =
  | "rate-limit"
  | "network"
  | "invalid-response"
  | "unknown";

export interface ResolvedAsset {
  name: string;
  sizeBytes: number;
  downloadUrl: string;
  sha256: string | null;
}

export interface PackageDownload {
  spec: PackageSpec;
  asset: ResolvedAsset | null;
}

export interface ReleaseSummary {
  tagName: string;
  name: string | null;
  url: string;
  publishedAt: string | null;
  prerelease: boolean;
  assetCount: number;
}

export interface SelectedRelease extends ReleaseSummary {
  checksumAsset: ResolvedAsset | null;
}

export interface ReleaseInfo {
  status: ReleaseStatus;
  repository: RepositoryStatus;
  selected: SelectedRelease | null;
  packages: PackageDownload[];
  recent: ReleaseSummary[];
  checkedAt: string;
  error?: ReleaseErrorReason;
}

const PREFIX = "copylot-accelerated-";

function resolveAsset(asset: GitHubAsset): ResolvedAsset | null {
  let url: URL;
  try {
    url = new URL(asset.browser_download_url);
  } catch {
    return null;
  }

  if (
    url.protocol !== "https:" ||
    !(
      url.hostname === "github.com" ||
      url.hostname.endsWith(".github.com") ||
      url.hostname.endsWith("githubusercontent.com")
    )
  ) {
    return null;
  }

  const digest = asset.digest?.toLowerCase();
  const sha256 =
    digest?.startsWith("sha256:") && /^[a-f0-9]{64}$/.test(digest.slice(7))
      ? digest.slice(7)
      : null;

  return {
    name: asset.name,
    sizeBytes: asset.size,
    downloadUrl: url.toString(),
    sha256,
  };
}

function isGitHubAsset(value: unknown): value is GitHubAsset {
  if (!value || typeof value !== "object") return false;
  const asset = value as Record<string, unknown>;
  return (
    typeof asset.name === "string" &&
    typeof asset.size === "number" &&
    typeof asset.browser_download_url === "string"
  );
}

function isGitHubRelease(value: unknown): value is GitHubRelease {
  if (!value || typeof value !== "object") return false;
  const release = value as Record<string, unknown>;
  return (
    typeof release.id === "number" &&
    typeof release.tag_name === "string" &&
    typeof release.html_url === "string" &&
    (typeof release.name === "string" || release.name === null) &&
    (typeof release.published_at === "string" ||
      release.published_at === null) &&
    typeof release.draft === "boolean" &&
    typeof release.prerelease === "boolean" &&
    Array.isArray(release.assets) &&
    release.assets.every(isGitHubAsset)
  );
}

function sortByPublished(releases: GitHubRelease[]): GitHubRelease[] {
  return [...releases].sort((a, b) => {
    const left = a.published_at ? Date.parse(a.published_at) : 0;
    const right = b.published_at ? Date.parse(b.published_at) : 0;
    return right - left;
  });
}

function summarize(release: GitHubRelease): ReleaseSummary {
  return {
    tagName: release.tag_name,
    name: release.name,
    url: release.html_url,
    publishedAt: release.published_at,
    prerelease: release.prerelease,
    assetCount: release.assets.length,
  };
}

function resolveRelease(
  releases: GitHubRelease[],
  repository: RepositoryStatus,
  error?: ReleaseErrorReason,
): ReleaseInfo {
  const checkedAt = new Date().toISOString();
  const publicReleases = sortByPublished(
    releases.filter((release) => !release.draft),
  );

  if (publicReleases.length === 0) {
    return {
      status: error ? "unavailable" : "empty",
      repository,
      selected: null,
      packages: SITE.packages.map((spec) => ({ spec, asset: null })),
      recent: [],
      checkedAt,
      error,
    };
  }

  const stable = publicReleases.find((release) => !release.prerelease);
  const selected = stable ?? publicReleases[0];
  const isPrerelease = !stable;

  const assets = selected.assets
    .map(resolveAsset)
    .filter((asset): asset is ResolvedAsset => asset !== null);

  const packages = SITE.packages.map((spec) => {
    const asset =
      assets.find(
        (candidate) =>
          candidate.name.startsWith(PREFIX) &&
          candidate.name.endsWith(spec.suffix),
      ) ?? null;
    return { spec, asset };
  });

  const checksumAsset =
    assets.find((asset) => asset.name === SITE.releases.checksumAsset) ?? null;

  return {
    status: isPrerelease ? "prerelease" : "available",
    repository,
    selected: {
      ...summarize(selected),
      checksumAsset,
    },
    packages,
    recent: publicReleases.slice(0, 6).map(summarize),
    checkedAt,
  };
}

async function loadFixture(): Promise<ReleaseInfo | null> {
  const fixturePath = process.env.RELEASES_FIXTURE;
  if (!fixturePath) return null;

  try {
    const parsed: unknown = JSON.parse(await readFile(fixturePath, "utf8"));
    const raw =
      parsed && typeof parsed === "object" && "releases" in parsed
        ? (parsed as { releases: unknown }).releases
        : parsed;

    if (!Array.isArray(raw) || !raw.every(isGitHubRelease)) {
      throw new Error("fixture is not a GitHub Releases array");
    }

    console.info(`[releases] Using fixture ${fixturePath}`);
    return resolveRelease(raw, "public");
  } catch (error) {
    console.warn(
      `[releases] Could not load RELEASES_FIXTURE: ${String(error)}`,
    );
    return {
      status: "unavailable",
      repository: "unknown",
      selected: null,
      packages: SITE.packages.map((spec) => ({ spec, asset: null })),
      recent: [],
      checkedAt: new Date().toISOString(),
      error: "invalid-response",
    };
  }
}

async function loadFromGitHub(): Promise<ReleaseInfo> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": `${SITE.name}-Website`,
  };

  // An optional build-only token raises the API rate limit. It is never
  // rendered or sent to the browser. Public releases need no token at all.
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(
      `${SITE.releases.api}?per_page=${SITE.releases.perPage}`,
      {
        headers,
        signal: AbortSignal.timeout(8000),
      },
    );
  } catch (error) {
    console.warn(`[releases] GitHub API request failed: ${String(error)}`);
    return resolveRelease([], "unknown", "network");
  }

  if (response.status === 404) {
    console.info(
      "[releases] Repository is not publicly accessible yet; no download links will be rendered.",
    );
    return resolveRelease([], "not-public");
  }

  if (response.status === 403 || response.status === 429) {
    console.warn(
      `[releases] GitHub API rate limit or access restriction (${response.status}). No download links will be rendered.`,
    );
    return resolveRelease([], "unknown", "rate-limit");
  }

  if (!response.ok) {
    console.warn(
      `[releases] GitHub API returned ${response.status}. No download links will be rendered.`,
    );
    return resolveRelease([], "unknown", "network");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    console.warn(`[releases] Could not parse GitHub response: ${String(error)}`);
    return resolveRelease([], "public", "invalid-response");
  }

  if (!Array.isArray(payload) || !payload.every(isGitHubRelease)) {
    console.warn("[releases] Unexpected GitHub Releases response shape.");
    return resolveRelease([], "public", "invalid-response");
  }

  return resolveRelease(payload, "public");
}

let cached: Promise<ReleaseInfo> | undefined;

export function getReleaseInfo(): Promise<ReleaseInfo> {
  cached ??= (async () => {
    const fixture = await loadFixture();
    if (fixture) return fixture;
    return loadFromGitHub();
  })();

  return cached;
}

export function formatReleaseDate(value: string | null): string {
  if (!value) return "Unpublished date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unpublished date";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "Unknown size";
  if (bytes < 1_000_000) {
    return `${new Intl.NumberFormat("en", {
      maximumFractionDigits: 0,
    }).format(bytes / 1000)} KB`;
  }
  return `${new Intl.NumberFormat("en", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(bytes / 1_000_000)} MB`;
}
