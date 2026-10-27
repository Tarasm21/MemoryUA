import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const baseUrl = "https://memory-ua.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const { data: memorials, error } = await supabase
    .from("memorials")
    .select("id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("SITEMAP ERROR:", error);
  }

  const memorialUrls: MetadataRoute.Sitemap =
    (memorials ?? []).map((memorial) => ({
      url: `${baseUrl}/memorial/${memorial.id}`,
      lastModified: memorial.created_at
        ? new Date(memorial.created_at)
        : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/memorials`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...memorialUrls,
  ];
}