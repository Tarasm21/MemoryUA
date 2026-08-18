"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
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
  created_at?: string | null;
};

type MemorialPhoto = {
  id: string;
  memorial_id: string;
  user_id: string;
  photo_url: string;
  created_at?: string | null;
};

export default function MemorialPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [memorial, setMemorial] = useState<Memorial | null>(null);
  const [photos, setPhotos] = useState<MemorialPhoto[]>([]);

  const [loading, setLoading] = useState(true);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [error, setError] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [selectedPhoto, setSelectedPhoto] =
    useState<MemorialPhoto | null>(null);

  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      if (!id) {
        if (mounted) {
          setError(true);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setGalleryLoading(true);
      setError(false);

      try {
        // =========================================
        // 1. Завантажуємо меморіал
        // =========================================

        const {
          data: memorialData,
          error: memorialError,
        } = await supabase
          .from("memorials")
          .select(
            "id, user_id, name, birth_date, death_date, story, photo_url, created_at"
          )
          .eq("id", id)
          .maybeSingle();

        if (memorialError) {
          console.error(
            "MEMORYUA MEMORIAL LOAD ERROR:",
            memorialError
          );

          if (mounted) {
            setError(true);
            setMemorial(null);
          }

          return;
        }

        if (!memorialData) {
          if (mounted) {
            setError(true);
            setMemorial(null);
          }

          return;
        }

        if (mounted) {
          setMemorial(memorialData as Memorial);
        }

        // =========================================
        // 2. Завантажуємо фотогалерею
        // =========================================

        const {
          data: galleryData,
          error: galleryError,
        } = await supabase
          .from("memorial_photos")
          .select(
            "id, memorial_id, user_id, photo_url, created_at"
          )
          .eq("memorial_id", id)
          .order("created_at", {
            ascending: true,
          });

        if (galleryError) {
          console.error(
            "MEMORYUA GALLERY LOAD ERROR:",
            galleryError
          );

          if (mounted) {
            setPhotos([]);
          }
        } else {
          if (mounted) {
            setPhotos(
              (galleryData ?? []) as MemorialPhoto[]
            );
          }
        }

        // =========================================
        // 3. Перевіряємо користувача
        // =========================================

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted) {
          setCurrentUserId(session?.user?.id ?? null);
        }
      } catch (err) {
        console.error("MEMORYUA PAGE ERROR:", err);

        if (mounted) {
          setError(true);
          setMemorial(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setGalleryLoading(false);
        }
      }
    }

    loadPage();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        setCurrentUserId(
          session?.user?.id ?? null
        );
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [id]);

  const isOwner =
    !!currentUserId &&
    !!memorial &&
    currentUserId === memorial.user_id;

  const formatDate = (
    date: string | null
  ) => {
    if (!date) return "";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString(
      "uk-UA",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  };

  const getMemorialUrl = () => {
    if (typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/memorial/${id}`;
  };

  const goToEdit = () => {
    if (!isOwner) return;

    window.location.href =
      `/memorial/${id}/edit`;
  };

  const downloadQR = () => {
    const svg =
      qrRef.current?.querySelector("svg");

    if (!svg || !memorial) {
      return;
    }

    const serializer =
      new XMLSerializer();

    const svgString =
      serializer.serializeToString(svg);

    const blob = new Blob(
      [svgString],
      {
        type:
          "image/svg+xml;charset=utf-8",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `MEMORYUA-${memorial.name || "memorial"}.svg`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handleDeleteMemorial =
    async () => {
      if (
        !id ||
        !memorial ||
        !isOwner
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Ви впевнені, що хочете назавжди видалити цей меморіал?"
        );

      if (!confirmed) {
        return;
      }

      const {
        error: deleteError,
      } = await supabase
        .from("memorials")
        .delete()
        .eq("id", id)
        .eq(
          "user_id",
          memorial.user_id
        );

      if (deleteError) {
        console.error(
          "MEMORYUA DELETE ERROR:",
          deleteError
        );

        alert(
          "Не вдалося видалити меморіал."
        );

        return;
      }

      alert(
        "Меморіал успішно видалено."
      );

      window.location.href = "/";
    };

  const handleDeletePhoto =
    async (
      photo: MemorialPhoto
    ) => {
      if (!isOwner) {
        return;
      }

      const confirmed =
        window.confirm(
          "Видалити це фото з галереї?"
        );

      if (!confirmed) {
        return;
      }

      const {
        error: deleteError,
      } = await supabase
        .from("memorial_photos")
        .delete()
        .eq("id", photo.id)
        .eq(
          "user_id",
          currentUserId
        );

      if (deleteError) {
        console.error(
          "MEMORYUA PHOTO DELETE ERROR:",
          deleteError
        );

        alert(
          "Не вдалося видалити фото."
        );

        return;
      }

      setPhotos(
        (current) =>
          current.filter(
            (item) =>
              item.id !== photo.id
          )
      );

      if (
        selectedPhoto?.id ===
        photo.id
      ) {
        setSelectedPhoto(null);
      }
    };

  const shareMemorial =
    async () => {
      const url =
        getMemorialUrl();

      if (!url) return;

      if (navigator.share) {
        try {
          await navigator.share(
            {
              title: memorial?.name
                ? `Пам'ять про ${memorial.name}`
                : "MEMORYUA",

              text: memorial?.name
                ? `Цифровий меморіал — ${memorial.name}`
                : "Цифровий меморіал MEMORYUA",

              url,
            }
          );
        } catch {
          // користувач закрив меню
        }

        return;
      }

      try {
        await navigator.clipboard.writeText(
          url
        );

        alert(
          "Посилання скопійовано!"
        );
      } catch {
        alert(url);
      }
    };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />

          <p className="text-slate-600">
            Завантаження меморіалу...
          </p>
        </div>
      </main>
    );
  }

  // =========================================
  // ERROR
  // =========================================

  if (error || !memorial) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-5xl">
            🕯️
          </div>

          <h1 className="text-2xl font-semibold text-slate-800">
            Меморіал не знайдено
          </h1>

          <p className="mt-3 text-slate-500">
            Можливо, посилання неправильне
            або меморіал ще не створений.
          </p>

          <button
            type="button"
            onClick={() => {
              window.location.href =
                "/";
            }}
            className="mt-6 rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            На головну
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
        {/* =====================================
            HEADER
        ===================================== */}

        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-5">
            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/";
              }}
              className="text-left"
            >
              <div className="text-xl font-bold tracking-[0.18em] text-slate-900">
                MEMORYUA
              </div>

              <div className="mt-1 text-xs text-slate-500">
                Цифрова пам&apos;ять для
                майбутніх поколінь
              </div>
            </button>

            <button
              type="button"
              onClick={shareMemorial}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Поділитися
            </button>
          </div>
        </header>

        <section className="px-4 py-8 md:py-12">
          <div className="mx-auto max-w-5xl">
            <div className="overflow-hidden rounded-3xl bg-white shadow-sm">

              {/* =====================================
                  ОСНОВНЕ ФОТО
              ===================================== */}

              {memorial.photo_url ? (
                <div className="bg-slate-100">
                  <img
                    src={
                      memorial.photo_url
                    }
                    alt={
                      memorial.name
                    }
                    className="mx-auto max-h-[620px] w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center bg-slate-100 md:h-80">
                  <div className="text-center">
                    <div className="text-6xl">
                      🕯️
                    </div>

                    <p className="mt-3 text-sm text-slate-400">
                      Світла пам&apos;ять
                    </p>
                  </div>
                </div>
              )}

              {/* =====================================
                  ІНФОРМАЦІЯ
              ===================================== */}

              <div className="px-5 py-8 md:px-10 md:py-10">
                <div className="text-center">
                  <div className="text-sm uppercase tracking-[0.25em] text-slate-400">
                    У пам&apos;ять про
                  </div>

                  <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-5xl">
                    {memorial.name}
                  </h1>

                  {(
                    memorial.birth_date ||
                    memorial.death_date
                  ) && (
                    <p className="mt-4 text-lg text-slate-500">
                      {formatDate(
                        memorial.birth_date
                      )}

                      {memorial.birth_date &&
                      memorial.death_date
                        ? " — "
                        : ""}

                      {formatDate(
                        memorial.death_date
                      )}
                    </p>
                  )}
                </div>

                {/* =====================================
                    ІСТОРІЯ
                ===================================== */}

                {memorial.story && (
                  <div className="mx-auto mt-10 max-w-3xl">
                    <div className="mb-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Життєва історія
                    </div>

                    <div className="whitespace-pre-wrap text-center text-base leading-8 text-slate-600 md:text-lg">
                      {memorial.story}
                    </div>
                  </div>
                )}

                <div className="my-10 border-t border-slate-200" />

                {/* =====================================
                    ФОТОГАЛЕРЕЯ
                ===================================== */}

                <section className="mt-4">
                  <div className="text-center">
                    <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Спогади
                    </div>

                    <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
                      Фотогалерея
                    </h2>

                    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
                      Фотографії, які зберігають
                      важливі моменти життя та
                      пам&apos;ять про людину.
                    </p>
                  </div>

                  {galleryLoading ? (
                    <div className="mt-8 rounded-2xl bg-slate-50 p-10 text-center">
                      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />

                      <p className="mt-3 text-sm text-slate-500">
                        Завантаження фотографій...
                      </p>
                    </div>
                  ) : photos.length === 0 ? (
                    <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                      <div className="text-5xl">
                        📷
                      </div>

                      <p className="mt-4 font-medium text-slate-700">
                        Фотографій поки немає
                      </p>

                      {isOwner && (
                        <p className="mt-2 text-sm text-slate-500">
                          Додайте фотографії через
                          редагування меморіалу.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {photos.map(
                        (photo) => (
                          <div
                            key={photo.id}
                            className="group relative overflow-hidden rounded-2xl bg-slate-100"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedPhoto(
                                  photo
                                )
                              }
                              className="block aspect-square w-full"
                            >
                              <img
                                src={
                                  photo.photo_url
                                }
                                alt="Фото з меморіалу"
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              />
                            </button>

                            {isOwner && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeletePhoto(
                                    photo
                                  )
                                }
                                className="absolute right-2 top-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-sm transition group-hover:opacity-100"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </section>

                <div className="my-10 border-t border-slate-200" />

                {/* =====================================
                    INFO + QR
                ===================================== */}

                <div className="grid gap-8 md:grid-cols-2">

                  {/* INFO */}

                  <div className="rounded-2xl bg-slate-50 p-6 text-center">
                    <h2 className="text-lg font-semibold text-slate-800">
                      Цифровий меморіал
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Ця сторінка зберігає
                      пам&apos;ять про людину та
                      доступна за унікальним
                      посиланням MEMORYUA.
                    </p>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={goToEdit}
                        className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                      >
                        ✏️ Редагувати меморіал
                      </button>
                    )}

                    {!isOwner && (
                      <p className="mt-5 text-xs text-slate-400">
                        Перегляд меморіалу
                        доступний усім.
                      </p>
                    )}
                  </div>

                  {/* QR */}

                  <div className="rounded-2xl bg-slate-50 p-6 text-center">
                    <h2 className="text-lg font-semibold text-slate-800">
                      QR-код пам&apos;яті
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Відскануйте QR-код, щоб
                      відкрити цей цифровий
                      меморіал.
                    </p>

                    <div
                      ref={qrRef}
                      className="mx-auto mt-5 flex w-fit rounded-2xl bg-white p-4 shadow-sm"
                    >
                      <QRCodeSVG
                        value={getMemorialUrl()}
                        size={180}
                        bgColor="#ffffff"
                        fgColor="#0f172a"
                        level="H"
                        includeMargin
                      />
                    </div>

                    <button
                      type="button"
                      onClick={downloadQR}
                      className="mt-5 rounded-xl bg-slate-900 px-6 py-3 text-sm text-white transition hover:bg-slate-700"
                    >
                      ↓ Завантажити QR-код
                    </button>

                    {isOwner && (
                      <div className="mt-6 flex flex-col items-center gap-3">
                        <button
                          type="button"
                          onClick={goToEdit}
                          className="w-full max-w-xs rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                          ✏️ Редагувати меморіал
                        </button>

                        <button
                          type="button"
                          onClick={
                            handleDeleteMemorial
                          }
                          className="w-full max-w-xs rounded-xl bg-red-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-red-700"
                        >
                          🗑️ Видалити меморіал
                        </button>
                      </div>
                    )}

                    <p className="mt-3 text-[11px] text-slate-400">
                      QR-код можна передати
                      для друку на пам&apos;ятній
                      табличці.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center text-xs text-slate-400">
              MEMORYUA — цифрова пам&apos;ять
              для майбутніх поколінь
            </div>
          </div>
        </section>
      </main>

      {/* =========================================
          ВЕЛИКЕ ФОТО
      ========================================= */}

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() =>
            setSelectedPhoto(null)
          }
        >
          <button
            type="button"
            onClick={() =>
              setSelectedPhoto(null)
            }
            className="absolute right-4 top-4 rounded-full bg-white/90 px-4 py-2 text-xl text-slate-900 shadow-lg"
          >
            ✕
          </button>

          <img
            src={
              selectedPhoto.photo_url
            }
            alt="Фотографія"
            className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          />
        </div>
      )}
    </>
  );
}