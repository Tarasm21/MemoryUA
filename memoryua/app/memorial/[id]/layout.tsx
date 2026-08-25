import type { Metadata } from "next";

type Memorial = {
  id: string;
  name: string;
  birth_date: string | null;
  death_date: string | null;
  story: string | null;
  photo_url: string | null;
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://memory-ua.vercel.app";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function formatDate(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function createDescription(memorial: Memorial) {
  const dates = [
    formatDate(memorial.birth_date),
    formatDate(memorial.death_date),
  ]
    .filter(Boolean)
    .join(" — ");

  let description = `Світла пам'ять про ${memorial.name}.`;

  if (dates) {
    description += ` ${dates}.`;
  }

  if (memorial.story) {
    const cleanStory = memorial.story
      .replace(/\s+/g, " ")
      .trim();

    if (cleanStory) {
      description += ` ${cleanStory}`;
    }
  }

  description = description
    .replace(/\s+/g, " ")
    .trim();

  if (description.length > 160) {
    description =
      description.substring(0, 157).trimEnd() + "...";
  }

  return description;
}

async function getMemorial(
  id: string
): Promise<Memorial | null> {
  if (!id) {
    return null;
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error(
      "MEMORYUA SEO: Supabase environment variables are missing."
    );

    return null;
  }

  try {
    const url =
      `${SUPABASE_URL}/rest/v1/memorials` +
      `?select=id,name,birth_date,death_date,story,photo_url` +
      `&id=eq.${encodeURIComponent(id)}` +
      `&limit=1`;

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      next: {
        revalidate: 60,
      },
    });

    if (!response.ok) {
      console.error(
        "MEMORYUA SEO: Failed to load memorial.",
        response.status
      );

      return null;
    }

    const data =
      (await response.json()) as Memorial[];

    return data[0] ?? null;
  } catch (error) {
    console.error(
      "MEMORYUA SEO: Failed to fetch memorial.",
      error
    );

    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const memorial = await getMemorial(id);

  if (!memorial) {
    return {
      title: "Меморіал недоступний | MEMORYUA",
      description:
        "Цифрова пам'ять для майбутніх поколінь.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${memorial.name} — MEMORYUA`;

  const description =
    createDescription(memorial);

  const memorialUrl =
    `${SITE_URL}/memorial/${memorial.id}`;

  const metadata: Metadata = {
    title,
    description,

    alternates: {
      canonical: memorialUrl,
    },

    robots: {
      index: true,
      follow: true,
    },

    openGraph: {
      type: "website",
      locale: "uk_UA",
      url: memorialUrl,
      siteName: "MEMORYUA",
      title,
      description,
    },

    twitter: {
      card: memorial.photo_url
        ? "summary_large_image"
        : "summary",
      title,
      description,
    },
  };

  if (memorial.photo_url) {
    metadata.openGraph = {
      ...metadata.openGraph,
      images: [
        {
          url: memorial.photo_url,
          width: 1200,
          height: 630,
          alt: `Фото ${memorial.name}`,
        },
      ],
    };

    metadata.twitter = {
      ...metadata.twitter,
      images: [memorial.photo_url],
    };
  }

  return metadata;
}

export default function MemorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}