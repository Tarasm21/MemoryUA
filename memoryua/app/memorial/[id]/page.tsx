import type { Metadata } from "next";
import MemorialClient from "./MemorialClient";

type MemorialSeoData = {
  id: string;
  name: string;
  birth_date: string | null;
  death_date: string | null;
  story: string | null;
  photo_url: string | null;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const SITE_URL = "https://memory-ua.vercel.app";

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

function makeDescription(memorial: MemorialSeoData) {
  const dates = [
    formatDate(memorial.birth_date),
    formatDate(memorial.death_date),
  ]
    .filter(Boolean)
    .join(" — ");

  const story = (memorial.story || "")
    .replace(/\s+/g, " ")
    .trim();

  let description = `Світла пам'ять про ${memorial.name}. Цифровий меморіал MEMORYUA`;

  if (dates) {
    description += `, ${dates}`;
  }

  if (story) {
    description += `. ${story}`;
  }

  description = description.replace(/\s+/g, " ").trim();

  if (description.length > 160) {
    description = `${description.slice(0, 157).trim()}...`;
  }

  return description;
}

async function getMemorial(
  id: string
): Promise<MemorialSeoData | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "Supabase environment variables are missing."
    );

    return null;
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/memorials?id=eq.${encodeURIComponent(
        id
      )}&select=id,name,birth_date,death_date,story,photo_url&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: {
          revalidate: 60,
        },
      }
    );

    if (!response.ok) {
      console.error(
        "Failed to load memorial for metadata:",
        response.status,
        response.statusText
      );

      return null;
    }

    const data =
      (await response.json()) as MemorialSeoData[];

    return data[0] ?? null;
  } catch (error) {
    console.error(
      "Metadata memorial loading error:",
      error
    );

    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  const memorial = await getMemorial(id);

  if (!memorial) {
    return {
      title: "Меморіал недоступний — MEMORYUA",

      description:
        "Цифрова пам'ять для майбутніх поколінь. MEMORYUA.",

      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${memorial.name} — MEMORYUA`;

  const description = makeDescription(memorial);

  const url = `${SITE_URL}/memorial/${memorial.id}`;

  return {
    title,

    description,

    alternates: {
      canonical: url,
    },

    robots: {
      index: true,
      follow: true,
    },

    openGraph: {
      title,
      description,
      url,
      siteName: "MEMORYUA",
      locale: "uk_UA",
      type: "website",

      images: memorial.photo_url
        ? [
            {
              url: memorial.photo_url,
              width: 1200,
              height: 630,
              alt: `Фото ${memorial.name}`,
            },
          ]
        : undefined,
    },

    twitter: {
      card: memorial.photo_url
        ? "summary_large_image"
        : "summary",

      title,
      description,

      images: memorial.photo_url
        ? [memorial.photo_url]
        : undefined,
    },

    keywords: [
      "MEMORYUA",
      "цифровий меморіал",
      "цифрова пам'ять",
      "меморіал",
      "пам'ять про померлих",
      "онлайн меморіал",
      "QR код на могилу",
      "QR код на пам'ятник",
      memorial.name,
    ],
  };
}

export default async function MemorialPage({
  params,
}: PageProps) {
  const { id } = await params;

  return <MemorialClient id={id} />;
}