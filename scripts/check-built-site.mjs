#!/usr/bin/env node
/**
 * Lightweight build verification for the static output.
 *
 * Usage:
 *   node scripts/check-built-site.mjs [dist-directory] [--expect-release]
 *
 * The release fixture build uses --expect-release to verify that real asset
 * metadata is rendered from the mocked GitHub response.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE } from "../src/config/site.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(here, "..", process.argv[2] ?? "dist");
const expectRelease = process.argv.includes("--expect-release");
const expectPrerelease = process.argv.includes("--expect-prerelease");

const errors = [];
const warnings = [];
const checkedLinks = new Set();
const basePrefix = SITE.base === "/" ? "/" : `${SITE.base}/`;

function error(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolute)));
    } else {
      files.push(absolute);
    }
  }
  return files;
}

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function resolveInternalLink(link) {
  const clean = decodeHtml(link.split("#")[0].split("?")[0]);
  if (!clean.startsWith(SITE.base)) return null;

  const relative = clean.slice(SITE.base.length) || "/";
  const candidates = [];

  if (relative.endsWith("/")) {
    candidates.push(path.join(distDir, relative, "index.html"));
  } else {
    const extension = path.extname(relative);
    if (extension) {
      candidates.push(path.join(distDir, relative));
    } else {
      candidates.push(path.join(distDir, relative, "index.html"));
      candidates.push(path.join(distDir, relative));
    }
  }

  return candidates;
}

const requiredFiles = [
  "index.html",
  "downloads/index.html",
  "docs/index.html",
  "404.html",
  "robots.txt",
  "sitemap.xml",
  "favicon.svg",
  "og.png",
];

for (const file of requiredFiles) {
  if (!(await exists(path.join(distDir, file)))) {
    error(`Missing required output: ${file}`);
  }
}

if (!(await exists(distDir))) {
  console.error(`Build directory not found: ${distDir}`);
  process.exit(1);
}

const allFiles = await walk(distDir);
const htmlFiles = allFiles.filter((file) => file.endsWith(".html"));

if (htmlFiles.length === 0) {
  error("No HTML files found in the build output.");
}

for (const file of htmlFiles) {
  const relative = path.relative(distDir, file);
  const html = await readFile(file, "utf8");

  if (!/<title>[^<]+<\/title>/.test(html)) {
    error(`${relative}: missing a non-empty <title>.`);
  }

  if (!/<meta name="description" content="[^"]+">/.test(html)) {
    error(`${relative}: missing a non-empty meta description.`);
  }

  if (!/<link rel="canonical" href="https:\/\/[^"]+">/.test(html)) {
    error(`${relative}: missing an HTTPS canonical URL.`);
  }

  if (!html.includes('property="og:image"')) {
    error(`${relative}: missing an Open Graph image.`);
  }

  const h1Count = (html.match(/<h1(?:\s|>)/g) ?? []).length;
  if (h1Count !== 1) {
    error(`${relative}: expected exactly one <h1>, found ${h1Count}.`);
  }

  const robots = html.match(/<meta name="robots" content="([^"]+)">/)?.[1];
  if (!SITE.indexable && !robots?.includes("noindex")) {
    error(`${relative}: expected noindex while the public launch is unapproved.`);
  }

  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)];
  for (const [, src] of scripts) {
    error(`${relative}: external or bundled script tag found (${src}).`);
  }

  if (/(?:src|href)="http:\/\//.test(html)) {
    error(`${relative}: insecure http:// asset or link found.`);
  }

  const newTabLinks = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)];
  for (const [tag] of newTabLinks) {
    if (!/\brel="[^"]*noopener/.test(tag)) {
      error(`${relative}: target="_blank" link is missing rel="noopener".`);
    }
  }

  const links = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(
    (match) => match[1],
  );

  for (const link of links) {
    if (
      link.startsWith("#") ||
      link.startsWith("mailto:") ||
      link.startsWith("tel:") ||
      link.startsWith("data:") ||
      link.startsWith("https://") ||
      link.startsWith("http://")
    ) {
      continue;
    }

    if (!link.startsWith("/")) {
      warn(`${relative}: relative URL found (${link}). Use withBase().`);
      continue;
    }

    if (!link.startsWith(basePrefix)) {
      error(
        `${relative}: internal link does not include the configured base (${link}).`,
      );
      continue;
    }

    if (checkedLinks.has(link)) continue;
    checkedLinks.add(link);

    const candidates = resolveInternalLink(link);
    if (!candidates) {
      error(`${relative}: could not resolve internal link (${link}).`);
      continue;
    }

    let found = false;
    for (const candidate of candidates) {
      if (await exists(candidate)) {
        found = true;
        break;
      }
    }
    if (!found) {
      error(`${relative}: internal link points to a missing file (${link}).`);
    }
  }
}

const robots = await readFile(path.join(distDir, "robots.txt"), "utf8");
if (SITE.indexable) {
  if (!robots.includes("Allow: /")) {
    error("robots.txt should allow indexing when SITE_INDEXABLE=true.");
  }
} else if (!robots.includes("Disallow: /")) {
  error("robots.txt should disallow indexing before launch approval.");
}

const sitemap = await readFile(path.join(distDir, "sitemap.xml"), "utf8");
for (const route of ["/", "/downloads/", "/docs/"]) {
  const expected = `${SITE.url}${route === "/" ? "/" : route}`;
  if (!sitemap.includes(`<loc>${expected}</loc>`)) {
    error(`sitemap.xml: missing ${expected}.`);
  }
}

const downloadsHtml = await readFile(
  path.join(distDir, "downloads", "index.html"),
  "utf8",
);

if (expectRelease) {
  const expectedAssets = [
    "copylot-accelerated-v0.1.0-linux-x86_64-cpu.tar.gz",
    "copylot-accelerated-v0.1.0-linux-x86_64-cuda.tar.gz",
    "copylot-accelerated-v0.1.0-windows-x86_64-cpu.zip",
    "copylot-accelerated-v0.1.0-macos-x86_64-cpu.tar.gz",
    "copylot-accelerated-v0.1.0-macos-arm64-cpu.tar.gz",
  ];

  if (!downloadsHtml.includes("Latest stable release")) {
    error("Fixture build: latest stable release banner was not rendered.");
  }
  if (!downloadsHtml.includes("v0.1.0")) {
    error("Fixture build: selected stable tag v0.1.0 is missing.");
  }
  if (downloadsHtml.includes("v9.9.9")) {
    error("Fixture build: a draft release was rendered.");
  }
  for (const asset of expectedAssets) {
    if (!downloadsHtml.includes(asset)) {
      error(`Fixture build: missing release asset ${asset}.`);
    }
    if (
      !downloadsHtml.includes(
        `https://github.com/JaviBonilla/CoPylot-Accelerated/releases/download/v0.1.0/${asset}`,
      )
    ) {
      error(`Fixture build: missing browser_download_url for ${asset}.`);
    }
  }
  if (!downloadsHtml.includes("SHA256SUMS.txt")) {
    error("Fixture build: checksum asset is not referenced.");
  }
  if (!downloadsHtml.includes("Prerelease")) {
    error("Fixture build: newer prerelease should be identified in history.");
  }
} else if (expectPrerelease) {
  const asset =
    "copylot-accelerated-v0.2.0-rc1-linux-x86_64-cpu.tar.gz";

  if (!downloadsHtml.includes("Latest prerelease")) {
    error("Prerelease fixture: prerelease banner was not rendered.");
  }
  if (!downloadsHtml.includes(asset)) {
    error(`Prerelease fixture: missing release asset ${asset}.`);
  }
  if (
    !downloadsHtml.includes(
      `https://github.com/JaviBonilla/CoPylot-Accelerated/releases/download/v0.2.0-rc1/${asset}`,
    )
  ) {
    error("Prerelease fixture: missing browser_download_url for the asset.");
  }
  if (!downloadsHtml.includes("Not included in this release.")) {
    error("Prerelease fixture: missing-target state was not rendered.");
  }
  if (downloadsHtml.includes("v9.9.9")) {
    error("Prerelease fixture: a draft release was rendered.");
  }
  if (downloadsHtml.includes("Latest stable release")) {
    error("Prerelease fixture: incorrectly reported a stable release.");
  }
} else {
  const releasePrefix = `${SITE.repository.url}/releases/download/`;
  const releaseLinks = downloadsHtml.split(releasePrefix).length - 1;
  const hasBaseline = downloadsHtml.includes(
    "Public downloads will appear here.",
  );
  const hasUnavailable = downloadsHtml.includes(
    "Downloads are temporarily unavailable.",
  );

  if (releaseLinks > 0) {
    if (
      !downloadsHtml.includes("Latest stable release") &&
      !downloadsHtml.includes("Latest prerelease")
    ) {
      error("Downloads page: release assets found without a release banner.");
    }
    if (hasBaseline) {
      error("Downloads page: baseline state rendered alongside a release.");
    }
  } else if (!hasBaseline && !hasUnavailable) {
    error("Downloads page: missing a release, baseline or unavailable state.");
  }
}

console.log(`Checked ${htmlFiles.length} HTML files in ${distDir}.`);
console.log(`Internal links checked: ${checkedLinks.size}.`);

if (warnings.length > 0) {
  console.warn(`\n${warnings.length} warning(s):`);
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length > 0) {
  console.error(`\n${errors.length} error(s):`);
  for (const message of errors) console.error(`- ${message}`);
  process.exit(1);
}

console.log("Build checks passed.");
