import type { MetadataRoute } from "next";
import { fetchProducts } from "@/lib/catalog";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://metrodoc.ci";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${appUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${appUrl}/catalogue`, changeFrequency: "daily", priority: 0.9 },
    { url: `${appUrl}/connexion`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${appUrl}/inscription`, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const { products } = await fetchProducts({});
    const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${appUrl}/produits/${product.slug}`,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
    return [...staticRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
