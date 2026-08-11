"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";

type Memorial = {
  id: string;
  name: string;
  birth_date?: string | null;
  death_date?: string | null;
  story?: string | null;
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
    async function loadMemorial() {
      if (!id) {
        setError("ID меморіалу не знайдено.");
        setLoading(false);
        return;
      }

      try {
        console.log("MEMORYUA: шукаємо меморіал:", id);

        const { data, error } = await supabase
          .from("memorials")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("MEMORYUA: помилка Supabase:", error);
          setError("Не вдалося завантажити меморіал.");
          setLoading(false);
          return;
        }

        console.log("MEMORYUA: меморіал знайдено:", data);

        setMemorial(data);
        setLoading(false);
      } catch (err) {
        console.error("MEMORYUA: помилка:", err);
        setError("Сталася помилка під час завантаження.");
        setLoading(false);
      }
    }

    loadMemorial();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] flex items-center justify-center">
        <p className="text-slate-600 text-lg">
          Завантаження меморіалу...
        </p>
      </main>
    );
  }

  if (error || !memorial) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] flex items-center justify-center px-6">
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="text-5xl mb-5">🕊️</div>

          <h1 className="text-3xl font-semibold text-slate-800 mb-4">
            Меморіал не знайдено
          </h1>

          <p className="text-slate-500 mb-4">
            {error || "Запис із таким ID не існує."}
          </p>

          <p className="text-xs text-slate-400 break-all">
            ID: {id}
          </p>
        </div>
      </main>
    );
  }

  const memorialUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/memorial/${memorial.id}`
      : "";

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="text-2xl font-bold tracking-wide">
            MEMORYUA
          </div>

          <p className="text-sm text-slate-500 mt-1">
            Цифрова пам'ять для майбутніх поколінь
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <article className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="text-center">
              <div className="text-5xl mb-6">
                🕊️
              </div>

              <h1 className="text-4xl md:text-5xl font-semibold text-slate-800 mb-8">
                {memorial.name}
              </h1>

              <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-10 text-slate-600 mb-10">
                {memorial.birth_date && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">
                      Народився
                    </div>

                    <div className="text-lg">
                      {memorial.birth_date}
                    </div>
                  </div>
                )}

                {memorial.death_date && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">
                      Пішов із життя
                    </div>

                    <div className="text-lg">
                      {memorial.death_date}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {memorial.story && (
              <div className="border-t border-slate-200 pt-8">
                <h2 className="text-2xl font-semibold mb-4">
                  Пам'ять
                </h2>

                <p className="text-lg leading-8 text-slate-600 whitespace-pre-wrap">
                  {memorial.story}
                </p>
              </div>
            )}

            <div className="border-t border-slate-200 mt-10 pt-10">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-3">
                  Цей меморіал
                </h2>

                <p className="text-slate-500 mb-6">
                  Збережіть QR-код, щоб повернутися до цієї сторінки.
                </p>

                {memorialUrl && (
                  <div className="inline-flex flex-col items-center">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <QRCodeSVG
                        value={memorialUrl}
                        size={220}
                        level="H"
                      />
                    </div>

                    <p className="text-xs text-slate-400 mt-4 break-all max-w-md">
                      {memorialUrl}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </article>

        <div className="text-center mt-8">
          <p className="text-sm text-slate-400">
            MEMORYUA — цифрова пам'ять, яка залишається назавжди.
          </p>
        </div>
      </div>
    </main>
  );
}