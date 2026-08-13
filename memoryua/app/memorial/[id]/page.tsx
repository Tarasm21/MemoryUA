"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
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
  const id = params?.id as string;

  const [memorial, setMemorial] = useState<Memorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadMemorial() {
      if (!id) return;

      const { data, error } = await supabase
        .from("memorials")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error(error);
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

    if (Number.isNaN(d.getTime())) return date;

    return d.toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function downloadQRCode() {
    const svg = qrRef.current?.querySelector("svg");

    if (!svg || !memorial) return;

    const serializer = new XMLSerializer();
    const svgData = serializer.serializeToString(svg);

    const blob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `MEMORYUA-${memorial.name}.svg`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg px-8 py-6 text-center">
          <div className="text-2xl mb-2">🕊️</div>
          <p className="text-slate-700">Завантаження меморіалу...</p>
        </div>
      </main>
    );
  }

  if (error || !memorial) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg px-8 py-7 text-center max-w-md">
          <div className="text-4xl mb-4">🕊️</div>

          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Меморіал не знайдено
          </h1>

          <p className="text-sm text-slate-500">
            Перевірте QR-код або адресу сторінки.
          </p>
        </div>
      </main>
    );
  }

  const memorialUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/memorial/${id}`
      : `https://memory-ua.vercel.app/memorial/${id}`;

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-5 text-center">
          <div className="font-semibold tracking-wide text-slate-800">
            MEMORYUA
          </div>

          <div className="text-[10px] text-slate-400 mt-1">
            Цифрова пам'ять для майбутніх поколінь
          </div>
        </div>
      </header>

      {/* MEMORIAL */}
      <section className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* PHOTO */}
          {memorial.photo_url ? (
            <div className="bg-slate-100">
              <img
                src={memorial.photo_url}
                alt={memorial.name}
                className="w-full max-h-[520px] object-contain"
              />
            </div>
          ) : (
            <div className="h-56 bg-slate-100 flex items-center justify-center">
              <div className="text-5xl">🕊️</div>
            </div>
          )}

          {/* INFO */}
          <div className="px-8 py-7 text-center">
            <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-2">
              У пам'ять про
            </div>

            <h1 className="text-3xl font-semibold text-slate-900">
              {memorial.name}
            </h1>

            {(memorial.birth_date || memorial.death_date) && (
              <p className="text-sm text-slate-500 mt-2">
                {formatDate(memorial.birth_date)}
                {memorial.birth_date && memorial.death_date && " — "}
                {formatDate(memorial.death_date)}
              </p>
            )}

            <div className="my-6 border-t border-slate-200" />

            {/* STORY */}
            <section>
              <h2 className="text-sm font-semibold text-slate-800">
                Вічна пам'ять
              </h2>

              <div className="mt-4 text-sm leading-7 text-slate-600 whitespace-pre-wrap text-left">
                {memorial.story || "Пам'ять про цю людину назавжди залишиться з нами."}
              </div>
            </section>

            <div className="my-8 border-t border-slate-200" />

            {/* QR */}
            <section>
              <h2 className="text-sm font-semibold text-slate-800">
                Цифровий меморіал
              </h2>

              <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                Відскануйте QR-код, щоб перейти на сторінку пам'яті та
                поділитися нею з рідними.
              </p>

              <div
                ref={qrRef}
                className="mt-5 inline-flex bg-white p-3 rounded-xl border border-slate-200 shadow-sm"
              >
                <QRCodeSVG
                  value={memorialUrl}
                  size={220}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* DOWNLOAD BUTTON */}
              <div className="mt-5">
                <button
                  onClick={downloadQRCode}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
                >
                  <span>⬇️</span>
                  Завантажити QR-код
                </button>
              </div>

              <p className="text-[11px] text-slate-400 mt-3">
                QR-код можна передати для друку на табличці або пам'ятнику.
              </p>
            </section>
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center text-[11px] text-slate-400 mt-6">
          MEMORYUA — цифрова пам'ять для майбутніх поколінь
        </div>
      </section>
    </main>
  );
}
