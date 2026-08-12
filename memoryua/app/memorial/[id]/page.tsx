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
    async function loadMemorial() {
      if (!id) {
        setError("ID меморіалу не вказано.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const { data, error } = await supabase
          .from("memorials")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) {
          console.error("Supabase error:", error);
          setError("Не вдалося завантажити меморіал.");
          setMemorial(null);
          return;
        }

        if (!data) {
          setError("Меморіал не знайдено.");
          setMemorial(null);
          return;
        }

        setMemorial(data as Memorial);
      } catch (err) {
        console.error("Load memorial error:", err);
        setError("Сталася помилка під час завантаження.");
        setMemorial(null);
      } finally {
        setLoading(false);
      }
    }

    loadMemorial();
  }, [id]);

  /*
   * Публічна адреса меморіалу.
   *
   * На Vercel буде:
   * https://memory-ua.vercel.app/memorial/ID
   */
  const memorialUrl =
    typeof window !== "undefined" && id
      ? `${window.location.origin}/memorial/${id}`
      : id
        ? `https://memory-ua.vercel.app/memorial/${id}`
        : "";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-xl font-semibold text-slate-800">
            Завантаження меморіалу...
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Будь ласка, зачекайте.
          </p>
        </div>
      </main>
    );
  }

  if (error || !memorial) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="text-5xl mb-5">🕊️</div>

          <h1 className="text-2xl font-bold text-slate-800 mb-3">
            Меморіал не знайдено
          </h1>

          <p className="text-slate-500">
            {error || "Запис із таким ID не існує."}
          </p>

          <p className="mt-5 text-xs text-slate-400 break-all">
            ID: {id || "невідомий"}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="font-bold text-xl tracking-wide">
            MEMORYUA
          </div>

          <p className="text-xs text-slate-500 mt-1">
            Цифрова пам'ять для майбутніх поколінь
          </p>
        </div>
      </header>

      {/* CONTENT */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <article className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* PROFILE */}
          <section className="px-6 sm:px-10 pt-8 sm:pt-10">
            <div className="text-center">
              
              {/* PHOTO */}
              {memorial.photo_url ? (
                <div className="mb-6 flex justify-center">
                  <img
                    src={memorial.photo_url}
                    alt={`Фото ${memorial.name}`}
                    className="w-36 h-36 sm:w-44 sm:h-44 object-cover rounded-full border-4 border-white shadow-md"
                  />
                </div>
              ) : (
                <div className="mb-6 flex justify-center">
                  <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center">
                    <span className="text-5xl text-slate-400">
                      🕊️
                    </span>
                  </div>
                </div>
              )}

              {/* NAME */}
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                {memorial.name}
              </h1>

              {/* DATES */}
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-12">
                
                <div className="text-center">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Народився
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {memorial.birth_date || "—"}
                  </p>
                </div>

                <div className="hidden sm:block text-slate-300">
                  •
                </div>

                <div className="text-center">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Пішов із життя
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {memorial.death_date || "—"}
                  </p>
                </div>

              </div>
            </div>
          </section>

          {/* DIVIDER */}
          <div className="mx-6 sm:mx-10 mt-8 border-t border-slate-200" />

          {/* MEMORY */}
          <section className="px-6 sm:px-10 py-8">
            <h2 className="text-xl font-semibold text-slate-900">
              Пам'ять
            </h2>

            <div className="mt-5">
              {memorial.story ? (
                <p className="text-base leading-8 text-slate-600 whitespace-pre-wrap">
                  {memorial.story}
                </p>
              ) : (
                <p className="text-slate-400 italic">
                  Пам'ять назавжди залишається в наших серцях.
                </p>
              )}
            </div>
          </section>

          {/* DIVIDER */}
          <div className="mx-6 sm:mx-10 border-t border-slate-200" />

          {/* QR CODE */}
          <section className="px-6 sm:px-10 py-10">
            <div className="text-center">

              <h2 className="text-xl font-semibold text-slate-900">
                Цей меморіал
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Відскануйте QR-код, щоб повернутися до цієї сторінки.
              </p>

              {/* QR */}
              <div className="mt-7 flex justify-center">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  {memorialUrl && (
                    <QRCodeSVG
                      value={memorialUrl}
                      size={220}
                      level="H"
                      includeMargin={true}
                    />
                  )}
                </div>
              </div>

              {/* PUBLIC URL */}
              <div className="mt-5">
                <p className="text-xs text-slate-400 mb-2">
                  Публічна адреса меморіалу:
                </p>

                <p className="text-xs text-blue-600 break-all">
                  {memorialUrl}
                </p>
              </div>

            </div>
          </section>

          {/* FINAL MESSAGE */}
          <section className="border-t border-slate-200 px-6 sm:px-10 py-8">
            <div className="text-center">
              <p className="text-sm text-slate-500">
                Цифровий меморіал MEMORYUA
              </p>

              <p className="text-sm text-slate-400 mt-2">
                Пам'ять, яка залишається назавжди.
              </p>
            </div>
          </section>

        </article>

        {/* FOOTER */}
        <footer className="text-center py-8 text-xs text-slate-400">
          MEMORYUA — цифрова пам'ять, яка залишиться назавжди.
        </footer>
      </div>
    </main>
  );
}