"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";

type Memorial = {
  id: string;
  name: string;
  birth_date: string | null;
  death_date: string | null;
  story: string | null;
  photo_url: string | null;
};

export default function MemorialPage() {
  const params = useParams();
  const router = useRouter();

  const id = params?.id as string;

  const [memorial, setMemorial] = useState<Memorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadMemorial() {
      if (!id) {
        setError(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("memorials")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error("Помилка завантаження меморіалу:", error);
        setError(true);
      } else {
        setMemorial(data);
      }

      setLoading(false);
    }

    loadMemorial();
  }, [id]);

  function formatDate(date: string | null) {
    if (!date) return "";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return date;
    }

    return d.toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function downloadQR() {
    const svg = qrRef.current?.querySelector("svg");

    if (!svg || !memorial) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);

    const blob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `MEMORYUA-${memorial.name}-QR.svg`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-xl font-semibold text-slate-800">
            MEMORYUA
          </div>

          <div className="mt-3 text-sm text-slate-500">
            Завантаження меморіалу...
          </div>
        </div>
      </main>
    );
  }

  if (error || !memorial) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-4xl mb-4">🕯️</div>

          <h1 className="text-xl font-semibold text-slate-800">
            Меморіал не знайдено
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Можливо, посилання неправильне або меморіал ще не створений.
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            На головну
          </button>
        </div>
      </main>
    );
  }

  const memorialUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/memorial/${memorial.id}`
      : `/memorial/${memorial.id}`;

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
      {/* HEADER */}
      <header className="px-4 py-6 text-center">
        <div className="text-2xl font-bold tracking-[0.25em] text-slate-800">
          MEMORYUA
        </div>

        <div className="mt-1 text-[10px] text-slate-400">
          Цифрова пам'ять для майбутніх поколінь
        </div>
      </header>

      {/* MEMORIAL CARD */}
      <section className="max-w-2xl mx-auto px-4 pb-8">
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          {/* PHOTO */}
          <div className="bg-slate-100">
            {memorial.photo_url ? (
              <img
                src={memorial.photo_url}
                alt={memorial.name}
                className="block w-full max-h-[520px] object-cover"
              />
            ) : (
              <div className="flex h-72 items-center justify-center bg-slate-100">
                <div className="text-center text-slate-400">
                  <div className="text-5xl">🕊️</div>
                  <div className="mt-3 text-sm">
                    Фотографія не додана
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CONTENT */}
          <div className="px-6 py-8 sm:px-10">
            {/* TITLE */}
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
                У пам'яті про
              </div>

              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                {memorial.name}
              </h1>

              {(memorial.birth_date || memorial.death_date) && (
                <div className="mt-3 text-sm text-slate-400">
                  {formatDate(memorial.birth_date)}
                  {memorial.birth_date && memorial.death_date && " — "}
                  {formatDate(memorial.death_date)}
                </div>
              )}
            </div>

            <div className="my-7 h-px bg-slate-200" />

            {/* STORY */}
            <div>
              <h2 className="text-center text-sm font-semibold text-slate-700">
                Вічна пам'ять
              </h2>

              <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {memorial.story ? (
                  memorial.story
                ) : (
                  <div className="text-center text-slate-400">
                    Відомості про людину ще не додані.
                  </div>
                )}
              </div>
            </div>

            <div className="my-8 h-px bg-slate-200" />

            {/* EDIT BUTTON */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => router.push(`/memorial/${memorial.id}/edit`)}
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                ✏️ Редагувати меморіал
              </button>
            </div>

            {/* QR */}
            <div className="mt-10 text-center">
              <h2 className="text-sm font-semibold text-slate-700">
                Цифровий меморіал
              </h2>

              <p className="mx-auto mt-2 max-w-md text-[11px] leading-5 text-slate-400">
                Відскануйте QR-код, щоб перейти на сторінку пам'яті та
                поділитися нею з рідними.
              </p>

              <div
                ref={qrRef}
                className="mx-auto mt-5 flex w-fit items-center justify-center rounded-xl border border-slate-200 bg-white p-4"
              >
                <QRCodeSVG
                  value={memorialUrl}
                  size={220}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <button
                type="button"
                onClick={downloadQR}
                className="mt-5 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                ⬇️ Завантажити QR-код
              </button>

              <p className="mt-3 text-[10px] text-slate-400">
                QR-код можна передати для друку на таблиці або пам'ятнику.
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-6 text-center text-[11px] text-slate-400">
          MEMORYUA — цифрова пам'ять для майбутніх поколінь
        </div>
      </section>
    </main>
  );
}