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
  created_at?: string;
};

function formatDate(date: string | null) {
  if (!date) return "";

  const parts = date.split("-");

  if (parts.length !== 3) {
    return date;
  }

  const [year, month, day] = parts;

  const months = [
    "січня",
    "лютого",
    "березня",
    "квітня",
    "травня",
    "червня",
    "липня",
    "серпня",
    "вересня",
    "жовтня",
    "листопада",
    "грудня",
  ];

  const monthIndex = Number(month) - 1;

  if (monthIndex < 0 || monthIndex > 11) {
    return date;
  }

  return `${day} ${months[monthIndex]} ${year} р.`;
}

export default function MemorialPage() {
  const params = useParams();
  const router = useRouter();

  const id = String(params.id);

  const [memorial, setMemorial] = useState<Memorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const qrRef = useRef<HTMLDivElement>(null);

  const memorialUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/memorial/${id}`
      : `https://memory-ua.vercel.app/memorial/${id}`;

  useEffect(() => {
    async function loadMemorial() {
      try {
        setLoading(true);
        setErrorMessage("");

        const { data, error } = await supabase
          .from("memorials")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Помилка завантаження меморіалу:", error);
          setErrorMessage("Не вдалося завантажити меморіал.");
          setMemorial(null);
          return;
        }

        setMemorial(data as Memorial);
      } catch (error) {
        console.error(error);
        setErrorMessage("Сталася помилка під час завантаження.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadMemorial();
    }
  }, [id]);

  function downloadQrCode() {
    const svg = qrRef.current?.querySelector("svg");

    if (!svg) {
      return;
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);

    const blob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `MEMORYUA-QR-${memorial?.name || id}.svg`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-7 text-center">
            <div className="text-xl font-bold tracking-wide">MEMORYUA</div>

            <p className="mt-1 text-xs text-slate-400">
              Цифрова пам'ять для майбутніх поколінь
            </p>
          </div>
        </header>

        <div className="flex min-h-[60vh] items-center justify-center px-6">
          <div className="text-center">
            <div className="text-lg font-medium text-slate-700">
              Завантаження меморіалу...
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!memorial) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-7 text-center">
            <div className="text-xl font-bold tracking-wide">MEMORYUA</div>

            <p className="mt-1 text-xs text-slate-400">
              Цифрова пам'ять для майбутніх поколінь
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-xl px-6 py-20 text-center">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Меморіал не знайдено
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              {errorMessage || "Такого меморіалу не існує."}
            </p>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-7 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              На головну
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-7 text-center">
          <div className="text-xl font-bold tracking-wide">MEMORYUA</div>

          <p className="mt-1 text-xs text-slate-400">
            Цифрова пам'ять для майбутніх поколінь
          </p>
        </div>
      </header>

      {/* MEMORIAL */}
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          {/* PHOTO */}
          {memorial.photo_url ? (
            <div className="flex justify-center bg-slate-100">
              <img
                src={memorial.photo_url}
                alt={memorial.name}
                className="max-h-[520px] w-auto max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center bg-slate-100">
              <div className="text-sm text-slate-400">
                Фото не додано
              </div>
            </div>
          )}

          {/* CONTENT */}
          <section className="px-6 py-8 sm:px-10">
            <div className="text-center">
              <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-slate-400">
                У пам'ять про
              </p>

              <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                {memorial.name}
              </h1>

              {(memorial.birth_date || memorial.death_date) && (
                <p className="mt-2 text-sm text-slate-500">
                  {formatDate(memorial.birth_date)}
                  {" — "}
                  {formatDate(memorial.death_date)}
                </p>
              )}
            </div>

            <div className="my-7 border-t border-slate-200" />

            {/* STORY */}
            <section>
              <h2 className="text-center text-base font-semibold text-slate-900">
                Вічна пам'ять
              </h2>

              <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {memorial.story || "Історію життя ще не додано."}
              </div>
            </section>

            <div className="my-8 border-t border-slate-200" />

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

            <div className="my-8 border-t border-slate-200" />

            {/* QR SECTION */}
            <section className="text-center">
              <h2 className="text-base font-semibold text-slate-900">
                Цифровий меморіал
              </h2>

              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-400">
                Відскануйте QR-код, щоб перейти на сторінку пам'яті та
                поділитися нею з рідними.
              </p>

              {/* QR CODE */}
              <div className="mt-7 flex justify-center">
                <div
                  ref={qrRef}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <QRCodeSVG
                    value={memorialUrl}
                    size={220}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              {/* DOWNLOAD */}
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={downloadQrCode}
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                >
                  ⬇️ Завантажити QR-код
                </button>
              </div>

              <p className="mt-3 text-[11px] text-slate-400">
                QR-код можна передати для друку на табличці або пам'ятнику.
              </p>
            </section>
          </section>
        </div>

        {/* FOOTER */}
        <div className="mt-6 text-center text-[11px] text-slate-400">
          MEMORYUA — цифрова пам'ять для майбутніх поколінь
        </div>
      </div>
    </main>
  );
}