"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";

type Memorial = {
  id: string;
  user_id: string;
  name: string;
  birth_date: string | null;
  death_date: string | null;
  story: string | null;
  photo_url: string | null;
};

type MemorialPhoto = {
  id: string;
  photo_url: string;
};

type ArchiveFile = {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  created_at: string;
};

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

type MemorialPageClientProps = {
  id: string;
};

export default function MemorialPageClient({
  id,
}: MemorialPageClientProps) {
  const router = useRouter();

  const [memorial, setMemorial] =
    useState<Memorial | null>(null);

  const [photos, setPhotos] = useState<MemorialPhoto[]>([]);
  const [archive, setArchive] = useState<ArchiveFile[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function loadMemorial() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setCurrentUserId(user?.id ?? null);

        const { data: memorialData, error: memorialError } =
          await supabase
            .from("memorials")
            .select(
              "id,user_id,name,birth_date,death_date,story,photo_url"
            )
            .eq("id", id)
            .maybeSingle();

        if (memorialError) {
          console.error(
            "Memorial error:",
            memorialError
          );

          setError(
            "Не вдалося завантажити меморіал."
          );

          return;
        }

        if (!memorialData) {
          setError("Меморіал недоступний.");
          return;
        }

        setMemorial(memorialData);

        const {
          data: photosData,
          error: photosError,
        } = await supabase
          .from("memorial_photos")
          .select("id,photo_url")
          .eq("memorial_id", id)
          .order("created_at", {
            ascending: false,
          });

        if (photosError) {
          console.error(
            "Photos error:",
            photosError
          );
        } else {
          setPhotos(photosData ?? []);
        }

        const {
          data: archiveData,
          error: archiveError,
        } = await supabase
          .from("memorial_archive")
          .select(
            "id,file_name,file_url,file_type,created_at"
          )
          .eq("memorial_id", id)
          .order("created_at", {
            ascending: false,
          });

        if (archiveError) {
          console.error(
            "Archive error:",
            archiveError
          );
        } else {
          setArchive(archiveData ?? []);
        }
      } catch (err) {
        console.error(
          "Load memorial error:",
          err
        );

        setError(
          "Сталася помилка під час завантаження."
        );
      } finally {
        setLoading(false);
      }
    }

    loadMemorial();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />

          <p className="mt-4 text-sm text-slate-500">
            Завантаження меморіалу...
          </p>
        </div>
      </main>
    );
  }

  if (error || !memorial) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] px-4 py-20">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="text-5xl">🕯️</div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Меморіал недоступний
          </h1>

          <p className="mt-3 text-slate-500">
            {error ||
              "Не вдалося знайти цей меморіал."}
          </p>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-7 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white"
          >
            На головну
          </button>
        </div>
      </main>
    );
  }

  const isOwner =
    currentUserId !== null &&
    currentUserId === memorial.user_id;

  const dates = [
    formatDate(memorial.birth_date),
    formatDate(memorial.death_date),
  ]
    .filter(Boolean)
    .join(" — ");

  const memorialUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://memory-ua.vercel.app/memorial/${memorial.id}`;

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-5">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-left"
          >
            <div className="text-xl font-bold tracking-[0.18em] text-slate-900">
              MEMORYUA
            </div>

            <div className="mt-1 text-xs text-slate-500">
              Цифрова пам'ять для майбутніх поколінь
            </div>
          </button>

          {isOwner && (
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/memorial/${memorial.id}/edit`
                )
              }
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              ✏️ Редагувати
            </button>
          )}
        </div>
      </header>

      <section className="px-4 py-10 md:py-14">
        <div className="mx-auto max-w-4xl">
          {/* ОСНОВНА ІНФОРМАЦІЯ */}
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
            {memorial.photo_url && (
              <div className="bg-slate-100">
                <img
                  src={memorial.photo_url}
                  alt={`Фото ${memorial.name}`}
                  className="mx-auto max-h-[650px] w-full object-contain"
                />
              </div>
            )}

            <div className="px-6 py-10 text-center md:px-12">
              <div className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
                Світла пам'ять
              </div>

              <h1 className="mt-4 text-4xl font-bold text-slate-900 md:text-5xl">
                {memorial.name}
              </h1>

              {dates && (
                <div className="mt-4 text-lg text-slate-500">
                  {dates}
                </div>
              )}
            </div>
          </div>

          {/* ІСТОРІЯ */}
          {memorial.story && (
            <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm md:p-10">
              <h2 className="text-2xl font-bold text-slate-900">
                Пам'ять
              </h2>

              <div className="mt-5 whitespace-pre-wrap text-base leading-8 text-slate-600">
                {memorial.story}
              </div>
            </section>
          )}

          {/* ФОТОГАЛЕРЕЯ */}
          <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm md:p-10">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📸</div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Фотогалерея
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Фотографії, збережені в пам'ять про людину.
                </p>
              </div>
            </div>

            {photos.length === 0 ? (
              <div className="mt-8 rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">
                Фотографій поки немає.
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
                {photos.map((photo, index) => (
                  <a
                    key={photo.id}
                    href={photo.photo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="overflow-hidden rounded-2xl bg-slate-100"
                  >
                    <img
                      src={photo.photo_url}
                      alt={`Фотографія ${
                        index + 1
                      }`}
                      className="aspect-square w-full object-cover transition hover:scale-105"
                    />
                  </a>
                ))}
              </div>
            )}
          </section>

          {/* АРХІВ */}
          <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm md:p-10">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📁</div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Архів пам'яті
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Документи, матеріали та спогади,
                  збережені для майбутніх поколінь.
                </p>
              </div>
            </div>

            {archive.length === 0 ? (
              <div className="mt-8 rounded-2xl bg-slate-50 p-8 text-center">
                <div className="text-4xl">📂</div>

                <p className="mt-3 text-sm text-slate-500">
                  Архів пам'яті поки порожній.
                </p>
              </div>
            ) : (
              <div className="mt-8 space-y-3">
                {archive.map((file) => (
                  <a
                    key={file.id}
                    href={file.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
                  >
                    <div className="text-3xl">
                      📄
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-slate-800">
                        {file.file_name}
                      </div>

                      <div className="mt-1 text-xs text-slate-400">
                        Відкрити файл
                      </div>
                    </div>

                    <div className="text-slate-400">
                      →
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>

          {/* QR */}
          <section className="mt-8 rounded-3xl bg-white p-6 text-center shadow-sm md:p-10">
            <h2 className="text-2xl font-bold text-slate-900">
              QR-код пам'яті
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              Відскануйте QR-код, щоб відкрити цей меморіал.
            </p>

            <div className="mt-8 flex justify-center">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <QRCodeSVG
                  value={memorialUrl}
                  size={220}
                  level="H"
                />
              </div>
            </div>

            <div className="mt-5 break-all text-xs text-slate-400">
              {memorialUrl}
            </div>
          </section>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-10 text-center">
        <div className="text-sm font-bold tracking-[0.2em] text-slate-800">
          MEMORYUA
        </div>

        <p className="mt-2 text-xs text-slate-400">
          Цифрова пам'ять для майбутніх поколінь
        </p>
      </footer>
    </main>
  );
}