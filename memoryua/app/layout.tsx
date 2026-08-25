import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://memory-ua.vercel.app"),

  title: {
    default: "MEMORYUA — Цифрова пам'ять для майбутніх поколінь",
    template: "%s",
  },

  description:
    "MEMORYUA — цифрові меморіали для збереження пам'яті про близьких. Меморіал, фотографії, історія життя, книга пам'яті, архів та QR-код на могилу.",

  keywords: [
    "MEMORYUA",
    "цифровий меморіал",
    "цифрова пам'ять",
    "меморіал",
    "QR код на могилу",
    "QR код на пам'ятник",
    "пам'ять про померлих",
    "онлайн меморіал",
    "книга пам'яті",
    "архів пам'яті",
  ],

  authors: [
    {
      name: "MEMORYUA",
    },
  ],

  creator: "MEMORYUA",
  publisher: "MEMORYUA",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  verification: {
    google: "QpVIexGbxmZLZvjjqhPyAxovpPP-oazEYXxKZ8buoLY",
  },

  openGraph: {
    type: "website",
    locale: "uk_UA",
    url: "https://memory-ua.vercel.app",
    siteName: "MEMORYUA",
    title: "MEMORYUA — Цифрова пам'ять для майбутніх поколінь",
    description:
      "Створюйте цифрові меморіали, зберігайте історії життя, фотографії та спогади. QR-код допомагає назавжди зберегти пам'ять.",
  },

  twitter: {
    card: "summary_large_image",
    title: "MEMORYUA — Цифрова пам'ять для майбутніх поколінь",
    description:
      "Цифрові меморіали, фотографії, історії та спогади про близьких.",
  },

  alternates: {
    canonical: "https://memory-ua.vercel.app",
  },

  category: "memorial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}