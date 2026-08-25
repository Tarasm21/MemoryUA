import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://memory-ua.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/login/",
        "/register/",
        "/memorial/*/edit",
      ],
    },

    sitemap: `${baseUrl}/sitemap.xml`,
  };
}