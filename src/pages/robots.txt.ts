import type { APIRoute } from "astro";
import { SITE } from "../config/site";

export const GET: APIRoute = () => {
  const body = SITE.indexable
    ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`
    : `User-agent: *\nDisallow: /\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
