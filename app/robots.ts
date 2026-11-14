import type { MetadataRoute } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://metrodoc.ci";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/administration", "/api", "/bibliotheque", "/compte", "/panier"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
