import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/atleta", "/api", "/dev"],
      },
    ],
    sitemap: "https://kronos.app/sitemap.xml",
  };
}
