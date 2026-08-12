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
  created_at: string | null;
  photo_url: string | null;
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
          .maybeSingle();

        if (error) {
          console.error("MEMORYUA: помилка Supabase:", error);
          setError("Не вдалося завантажити меморіал.");
          setLoading(false);
          return;
        }

        if (!data) {
          console.error("MEMORYUA: меморіал не знайдено:", id);
          setError("Запис із таким ID не існує.");
          setLoading(false);
          return;
        }

        console.log("MEMORYUA: меморіал знайдено:", data);

        setMemorial(data as Memorial);
        setLoading(false);
      } catch (err) {
        console.error("MEMORYUA: помилка:", err);
        setError("Сталася помилка під час завантаження.");
        setLoading(false);
      }
    }

    loadMemorial();
  }, [id]);

  /*
   * Публічна адреса меморіалу.
   *
   * На локальному комп'ютері:
   * http://localhost:3000/memorial/ID
   *
   * На Vercel:
   * https://memory-ua.vercel.app/memorial/ID
   */
  const memorialUrl =
    typeof window !== "undefined" && id
      ? `${window.location.origin}/memorial/${id}`
      : "";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-2xl font-semibold text-slate-800">
            MEMORYUA
          </div>

          <p className="mt-3 text-slate-500">
            Завантаження меморіалу...
          </p>
        </div>
      </main>
    );
  }

  if (error || !memorial) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] flex items-center justify-center px-6">
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="text-4xl mb-4">
            🕊️
          </div>

          <h1 className="text-2xl font-semibold text-slate-800">
            Меморіал не знайдено
          </h1>

          <p className="text-slate-500 mt-4">
            {error || "Запис із таким ID не існує."}
          </p>

          {id && (
            <p className="text-xs text-slate-400 mt-6 break-all">
              ID: {id}
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
      {/* HEADER */}
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

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <article className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 md:p-10">

            {/* PHOTO */}
            <div className="flex justify-center mb-7">
              {memorial.photo_url ? (
                <img
                  src={memorial.photo_url}
                  alt={`Фото ${memorial.name}`}
                  className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center">
                  <span className="text-6xl">
                    🕊️
                  </span>
                </div>
              )}
            </div>

            {/* NAME */}
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">
                {memorial.name}
              </h1>

              {/* DATES */}
              {(memorial.birth_date || memorial.death_date) && (
                <div className="flex flex-col sm:flex-row justify-center items-center gap-5 sm:gap-10 mt-5">
                  {memorial.birth_date && (
                    <div className="text-center">
                      <div className="text-xs uppercase tracking-widest text-slate-400">
                        Народився
                      </div>

                      <div className="text-lg text-slate-700 mt-1">
                        {memorial.birth_date}
                      </div>
                    </div>
                  )}

                  {memorial.death_date && (
                    <div className="text-center">
                      <div className="text-xs uppercase tracking-widest text-slate-400">
                        Пішов із життя
                      </div>

                      <div className="text-lg text-slate-700 mt-1">
                        {memorial.death_date}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* LINE */}
            <div className="border-t border-slate-200 my-8" />

            {/* STORY */}
            {memorial.story && (
              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                  Пам'ять
                </h2>

                <p className="text-lg leading-8 text-slate-600 whitespace-pre-wrap">
                  {memorial.story}
                </p>
              </section>
            )}

            {/* QR */}
            <section className="border-t border-slate-200 mt-10 pt-10">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-slate-900">
                  Цей меморіал
                </h2>

                <p className="text-sm text-slate-500 mt-3">
                  Відскануйте QR-код, щоб повернутися до цієї сторінки.
                </p>

                {memorialUrl && (
                  <>
                    <div className="mt-6 inline-flex bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <QRCodeSVG
                        value={memorialUrl}
                        size={220}
                        level="H"
                        includeMargin={true}
                      />
                    </div>

                    <p className="text-xs text-slate-400 mt-5 break-all max-w-xl mx-auto">
                      {memorialUrl}
                    </p>
                  </>
                )}
              </div>
            </section>

            {/* MEMORYUA MESSAGE */}
            <section className="border-t border-slate-200 mt-10 pt-10">
              <div className="text-center">
                <p className="text-slate-500">
                  Цифровий меморіал MEMORYUA
                </p>

                <p className="text-sm text-slate-400 mt-2">
                  Пам'ять, яка залишається назавжди.
                </p>
              </div>
            </section>
          </div>
        </article>

        {/* FOOTER */}
        <footer className="text-center py-8 text-sm text-slate-400">
          MEMORYUA — цифрова пам'ять, яка залишиться назавжди.
        </footer>
      </div>
    </main>
  );
}