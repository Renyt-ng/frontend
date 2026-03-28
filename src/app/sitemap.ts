import type { MetadataRoute } from "next";
import { PROPERTY_TYPE_LABELS } from "@/lib/utils/constants";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://renyt.ng";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  /** Static routes */
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  /** Property type search pages */
  const typeRoutes: MetadataRoute.Sitemap = Object.keys(
    PROPERTY_TYPE_LABELS,
  ).map((type) => ({
    url: `${BASE_URL}/search?property_type=${type}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...typeRoutes];
}
