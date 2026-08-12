"use client";

import { useEffect, useState } from "react";
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
  created_at?: string | null;
};

export default function MemorialPage() {
  const params = useParams();

  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [memorial, setMemorial] = useState<Memorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    async function loadMemorial() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("memorials")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        setError("Меморіал не знайдено.");
        setLoading(false);
        return;
      }

      setMemorial(data);
      setLoading(false);
    }

    loadMemorial();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🕊️</div>
          <p className="text-slate-600 text-lg">
            Завантаження меморіалу...
          </p>
        </div>
      </main>
    );
  }

  if (error || !memorial) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="text-5xl mb-5">🕊️</div>

          <h1 className="text-2xl font-semibold text-slate-800 mb-3">
            Меморіал не знайдено
          </h1>

          <p className="text-slate-500">
            Перевірте QR-код або адресу сторінки.
          </p>
        </div>
      </main>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const memorialUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://memory-ua.vercel.app/memorial/${id}`;

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold tracking-wide text-slate-800">
              MEMORYUA
            </div>

            <div className="text-xs text-slate-500 mt-1">
              Цифрова пам'ять для майбутніх поколінь
            </div>
          </div>

          <div className="text-2xl">
            🕊️
          </div>
        </div>
      </header>

      {/* MAIN */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-[32px] shadow-xl overflow-hidden">
          
          {/* PHOTO */}
          <div className="bg-slate-100">
            {memorial.photo_url ? (
              <div className="w-full flex justify-center">
                <img
                  src={memorial.photo_url}
                  alt={memorial.name}
                  className="w-full max-h-[650px] object-contain"
                />
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <div className="text-6xl mb-4">🕊️</div>
                  <p>Фото не додано</p>
                </div>
              </div>
            )}
          </div>

          {/* INFORMATION */}
          <div className="p-6 sm:p-10">
            <div className="text-center">
              <div className="text-sm uppercase tracking-[0.25em] text-slate-400 mb-4">
                У пам'ять про
              </div>

              <h1 className="text-4xl sm:text-5xl font-serif font-semibold text-slate-800">
                {memorial.name}
              </h1>

              {(memorial.birth_date || memorial.death_date) && (
                <div className="mt-5 text-lg text-slate-500">
                  {formatDate(memorial.birth_date)}
                  {memorial.birth_date && memorial.death_date && (
                    <span className="mx-3">—</span>
                  )}
                  {formatDate(memorial.death_date)}
                </div>
              )}
            </div>

            {/* DIVIDER */}
            <div className="my-10 flex items-center gap-4">
              <div className="h-px bg-slate-200 flex-1" />
              <div className="text-slate-400">✦</div>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            {/* STORY */}
            {memorial.story && (
              <section className="max-w-3xl mx-auto">
                <h2 className="text-2xl font-semibold text-center mb-6">
                  Вічна пам'ять
                </h2>

                <div className="text-slate-600 text-lg leading-8 whitespace-pre-wrap text-center">
                  {memorial.story}
                </div>
              </section>
            )}

            {/* QR */}
            <section className="mt-12 pt-10 border-t border-slate-200">
              <div className="flex flex-col items-center text-center">
                <h2 className="text-xl font-semibold mb-3">
                  Цифровий меморіал
                </h2>

                <p className="text-slate-500 max-w-md mb-6">
                  Відскануйте QR-код, щоб зберегти цю сторінку пам'яті
                  та поділитися нею з рідними.
                </p>

                <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-200">
                  <QRCodeSVG
                    value={memorialUrl}
                    size={220}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <p className="text-sm text-slate-400 mt-5">
                  MEMORYUA
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center py-10">
          <p className="text-sm text-slate-400">
            MEMORYUA — цифрова пам'ять, яка залишається назавжди.
          </p>
        </div>
      </section>
    </main>
  );
}
