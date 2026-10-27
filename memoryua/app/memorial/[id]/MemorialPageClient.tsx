"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";

type Memorial = {
  id: string;
  user_id: string | null;
  name: string;
  birth_date: string | null;
  death_date: string | null;
  story: string | null;
  photo_url: string | null;
  plan?: string | null;
};

type MemorialPhoto = {
  id: string;
  photo_url: string;
};

type ArchiveFile = {
  id: string;
  memorial_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
};

type MemoryMessage = {
  id: string;
  memorial_id: string;
  author_name: string;
  message: string;
  created_at: string;
};

type MemorialPageClientProps = {
  id: string;
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

function formatMessageDate(value: string | null) {
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

function formatFileSize(size: number | null) {
  if (!size || size <= 0) return "";

  if (size < 1024) {
    return `${size} Б`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} КБ`;
  }

  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
  }

  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} ГБ`;
}

function getArchiveIcon(file: ArchiveFile) {
  const type = file.file_type?.toLowerCase() || "";
  const name = file.file_name.toLowerCase();

  if (type.includes("pdf") || name.endsWith(".pdf")) {
    return "📕";
  }

  if (
    type.includes("image") ||
    /\.(jpg|jpeg|png|webp|gif)$/i.test(name)
  ) {
    return "🖼️";
  }

  if (
    type.includes("word") ||
    /\.(doc|docx)$/i.test(name)
  ) {
    return "📘";
  }

  if (
    type.includes("excel") ||
    /\.(xls|xlsx|csv)$/i.test(name)
  ) {
    return "📗";
  }

  if (
    type.includes("zip") ||
    type.includes("rar") ||
    /\.(zip|rar|7z)$/i.test(name)
  ) {
    return "🗜️";
  }

  return "📄";
}

async function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs = 10000
): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error("Запит перевищив час очікування.")
        );
      }, timeoutMs);
    }),
  ]);
}

export default function MemorialPageClient({
  id,
}: MemorialPageClientProps) {
  const router = useRouter();

  const [memorial, setMemorial] =
    useState<Memorial | null>(null);

  const [photos, setPhotos] =
    useState<MemorialPhoto[]>([]);

  const [archiveFiles, setArchiveFiles] =
    useState<ArchiveFile[]>([]);

  const [messages, setMessages] =
    useState<MemoryMessage[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [galleryLoading, setGalleryLoading] =
    useState(true);

  const [archiveLoading, setArchiveLoading] =
    useState(true);

  const [messagesLoading, setMessagesLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  const [liked, setLiked] =
    useState(false);

  const [likeLoading, setLikeLoading] =
    useState(false);

  const [likesCount, setLikesCount] =
    useState(0);

  const [likeError, setLikeError] =
    useState("");

  const [candleLit, setCandleLit] =
    useState(false);

  const [candleLoading, setCandleLoading] =
    useState(false);

  const [candlesCount, setCandlesCount] =
    useState(0);

  const [candleError, setCandleError] =
    useState("");

  const [authorName, setAuthorName] =
    useState("");

  const [messageText, setMessageText] =
    useState("");

  const [messageLoading, setMessageLoading] =
    useState(false);

  const [messageError, setMessageError] =
    useState("");

  const [selectedPhoto, setSelectedPhoto] =
    useState<MemorialPhoto | null>(null);

  const [archiveFile, setArchiveFile] =
    useState<File | null>(null);

  const [archiveUploadLoading, setArchiveUploadLoading] =
    useState(false);

  const [archiveError, setArchiveError] =
    useState("");

  useEffect(() => {
    if (!id) {
      setError("Невірний ID меморіалу.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadMemorial() {
      setLoading(true);
      setError("");

      try {
        const memorialResult = await withTimeout(
          supabase
            .from("memorials")
            .select(
              "id,user_id,name,birth_date,death_date,story,photo_url,plan"
            )
            .eq("id", id)
            .maybeSingle(),
          10000
        );

        if (cancelled) return;

        if (memorialResult.error) {
          console.error(
            "MEMORIAL ERROR:",
            memorialResult.error
          );

          setError(
            `Помилка завантаження меморіалу: ${memorialResult.error.message}`
          );

          setLoading(false);
          return;
        }

        if (!memorialResult.data) {
          setError("Меморіал недоступний.");
          setLoading(false);
          return;
        }

        const memorialData =
          memorialResult.data as Memorial;

        setMemorial(memorialData);

        console.log(
          "MEMORIAL USER ID:",
          memorialData.user_id
        );

        setLoading(false);

        /*
         * AUTH
         */
        try {
          console.log(
            "ПЕРЕВІРЯЄМО КОРИСТУВАЧА..."
          );

          const sessionResult =
            await withTimeout(
              supabase.auth.getSession(),
              5000
            );

          const userId =
            sessionResult.data.session?.user?.id ??
            null;

          console.log(
            "AUTH USER ID:",
            userId
          );

          if (!cancelled) {
            setCurrentUserId(userId);
          }
        } catch (authError) {
          console.warn(
            "AUTH CHECK ERROR:",
            authError
          );

          if (!cancelled) {
            setCurrentUserId(null);
          }
        }

        /*
         * ГАЛЕРЕЯ
         */
        setGalleryLoading(true);

        try {
          const result =
            await withTimeout(
              supabase
                .from("memorial_photos")
                .select("id,photo_url")
                .eq("memorial_id", id)
                .order("created_at", {
                  ascending: false,
                }),
              10000
            );

          if (!cancelled) {
            if (result.error) {
              console.warn(
                "PHOTOS ERROR:",
                result.error
              );

              setPhotos([]);
            } else {
              setPhotos(
                (result.data ?? []) as MemorialPhoto[]
              );
            }

            setGalleryLoading(false);
          }
        } catch (photoError) {
          console.warn(
            "PHOTOS LOADING ERROR:",
            photoError
          );

          if (!cancelled) {
            setPhotos([]);
            setGalleryLoading(false);
          }
        }

        /*
         * АРХІВ
         */
        setArchiveLoading(true);

        try {
          const result =
            await withTimeout(
              supabase
                .from("memorial_archive")
                .select(
                  "id,memorial_id,file_name,file_path,file_type,file_size,created_at"
                )
                .eq("memorial_id", id)
                .order("created_at", {
                  ascending: false,
                }),
              10000
            );

          if (!cancelled) {
            if (result.error) {
              console.warn(
                "ARCHIVE ERROR:",
                result.error
              );

              setArchiveFiles([]);
            } else {
              setArchiveFiles(
                (result.data ?? []) as ArchiveFile[]
              );
            }

            setArchiveLoading(false);
          }
        } catch (archiveLoadError) {
          console.warn(
            "ARCHIVE LOADING ERROR:",
            archiveLoadError
          );

          if (!cancelled) {
            setArchiveFiles([]);
            setArchiveLoading(false);
          }
        }

        /*
         * КНИГА ПАМ'ЯТІ
         */
        setMessagesLoading(true);

        try {
          const result =
            await withTimeout(
              supabase
                .from("memorial_messages")
                .select(
                  "id,memorial_id,author_name,message,created_at"
                )
                .eq("memorial_id", id)
                .order("created_at", {
                  ascending: false,
                }),
              10000
            );

          if (!cancelled) {
            if (result.error) {
              console.warn(
                "MESSAGES ERROR:",
                result.error
              );

              setMessages([]);
            } else {
              setMessages(
                (result.data ?? []) as MemoryMessage[]
              );
            }

            setMessagesLoading(false);
          }
        } catch (messageLoadError) {
          console.warn(
            "MESSAGES LOADING ERROR:",
            messageLoadError
          );

          if (!cancelled) {
            setMessages([]);
            setMessagesLoading(false);
          }
        }

        /*
         * ЛАЙКИ
         */
        try {
          const result =
            await supabase
              .from("memorial_likes")
              .select("id", {
                count: "exact",
                head: true,
              })
              .eq("memorial_id", id);

          if (!cancelled) {
            setLikesCount(result.count ?? 0);
          }
        } catch (e) {
          console.warn("LIKE COUNT ERROR:", e);
        }

        /*
         * СВІЧКИ
         */
        try {
          const result =
            await supabase
              .from("memorial_candles")
              .select("id", {
                count: "exact",
                head: true,
              })
              .eq("memorial_id", id);

          if (!cancelled) {
            setCandlesCount(result.count ?? 0);
          }
        } catch (e) {
          console.warn(
            "CANDLE COUNT ERROR:",
            e
          );
        }
      } catch (err) {
        console.error(
          "LOAD MEMORIAL ERROR:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Сталася помилка під час завантаження."
          );

          setLoading(false);
          setGalleryLoading(false);
          setArchiveLoading(false);
          setMessagesLoading(false);
        }
      }
    }

    loadMemorial();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /*
   * ВЛАСНИК
   */
  const isOwner =
    !!currentUserId &&
    !!memorial?.user_id &&
    currentUserId === memorial.user_id;

  console.log(
    "IS OWNER:",
    isOwner
  );

  /*
   * QR
   */
  function getMemorialUrl() {
    if (typeof window !== "undefined") {
      return window.location.href;
    }

    return `https://memory-ua.vercel.app/memorial/${id}`;
  }

  /*
   * РЕДАГУВАННЯ
   */
  function goToEdit() {
    router.push(`/memorial/${id}/edit`);
  }

  /*
   * ЛАЙК
   */
  async function supportMemory() {
    if (likeLoading || liked) return;

    setLikeLoading(true);
    setLikeError("");

    try {
      const { error } =
        await supabase
          .from("memorial_likes")
          .insert({
            memorial_id: id,
          });

      if (error) {
        throw error;
      }

      setLiked(true);
      setLikesCount((value) => value + 1);
    } catch (error) {
      console.error(error);

      setLikeError(
        error instanceof Error
          ? error.message
          : "Не вдалося залишити підтримку."
      );
    } finally {
      setLikeLoading(false);
    }
  }

  /*
   * СВІЧКА
   */
  async function lightCandle() {
    if (candleLoading) return;

    setCandleLoading(true);
    setCandleError("");

    try {
      const { error } =
        await supabase
          .from("memorial_candles")
          .insert({
            memorial_id: id,
          });

      if (error) {
        throw error;
      }

      setCandleLit(true);
      setCandlesCount((value) => value + 1);
    } catch (error) {
      console.error(error);

      setCandleError(
        error instanceof Error
          ? error.message
          : "Не вдалося запалити свічку."
      );
    } finally {
      setCandleLoading(false);
    }
  }

  /*
   * ДОДАТИ ЗАПИС
   */
  async function addMemoryMessage() {
    const name = authorName.trim();
    const message = messageText.trim();

    if (!name) {
      setMessageError("Вкажіть ваше ім'я.");
      return;
    }

    if (!message) {
      setMessageError("Напишіть слова пам'яті.");
      return;
    }

    setMessageLoading(true);
    setMessageError("");

    try {
      const { data, error } =
        await supabase
          .from("memorial_messages")
          .insert({
            memorial_id: id,
            author_name: name,
            message,
          })
          .select(
            "id,memorial_id,author_name,message,created_at"
          )
          .single();

      if (error) {
        throw error;
      }

      if (data) {
        setMessages((current) => [
          data as MemoryMessage,
          ...current,
        ]);
      }

      setAuthorName("");
      setMessageText("");
    } catch (error) {
      console.error(error);

      setMessageError(
        error instanceof Error
          ? error.message
          : "Не вдалося додати запис."
      );
    } finally {
      setMessageLoading(false);
    }
  }

  /*
   * ВИДАЛЕННЯ ЗАПИСУ
   */
  async function deleteMemoryMessage(
    message: MemoryMessage
  ) {
    if (!isOwner) return;

    const confirmed = window.confirm(
      "Видалити цей запис?"
    );

    if (!confirmed) return;

    try {
      const { error } =
        await supabase
          .from("memorial_messages")
          .delete()
          .eq("id", message.id);

      if (error) {
        throw error;
      }

      setMessages((current) =>
        current.filter(
          (item) => item.id !== message.id
        )
      );
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Не вдалося видалити запис."
      );
    }
  }

  /*
   * ВИДАЛЕННЯ ФОТО
   */
  async function handleDeletePhoto(
    photo: MemorialPhoto
  ) {
    if (!isOwner) return;

    const confirmed = window.confirm(
      "Видалити фотографію?"
    );

    if (!confirmed) return;

    try {
      const { error } =
        await supabase
          .from("memorial_photos")
          .delete()
          .eq("id", photo.id)
          .eq("memorial_id", id);

      if (error) {
        throw error;
      }

      setPhotos((current) =>
        current.filter(
          (item) => item.id !== photo.id
        )
      );

      if (selectedPhoto?.id === photo.id) {
        setSelectedPhoto(null);
      }
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Не вдалося видалити фотографію."
      );
    }
  }

  /*
   * URL АРХІВНОГО ФАЙЛУ
   */
  function getArchiveUrl(
    file: ArchiveFile
  ) {
    const { data } =
      supabase.storage
        .from("memorial-archive")
        .getPublicUrl(file.file_path);

    return data.publicUrl;
  }

  /*
   * ВІДКРИТИ АРХІВНИЙ ФАЙЛ
   */
  function openArchiveFile(
    file: ArchiveFile
  ) {
    const url = getArchiveUrl(file);

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /*
   * ЗАВАНТАЖЕННЯ ФАЙЛУ В АРХІВ
   */
  async function handleArchiveUpload() {
    if (!isOwner) return;

    if (!archiveFile) {
      setArchiveError(
        "Спочатку виберіть файл."
      );
      return;
    }

    if (archiveFile.size > 50 * 1024 * 1024) {
      setArchiveError(
        "Максимальний розмір файлу — 50 МБ."
      );
      return;
    }

    setArchiveUploadLoading(true);
    setArchiveError("");

    try {
      const safeName =
        archiveFile.name
          .normalize("NFKD")
          .replace(
            /[^\w.\-а-яА-ЯіїєґІЇЄҐ]+/g,
            "_"
          );

      const path =
        `${id}/${Date.now()}-${safeName}`;

      const uploadResult =
        await supabase.storage
          .from("memorial-archive")
          .upload(
            path,
            archiveFile,
            {
              upsert: false,
              contentType:
                archiveFile.type ||
                "application/octet-stream",
            }
          );

      if (uploadResult.error) {
        throw uploadResult.error;
      }

      const { data, error } =
        await supabase
          .from("memorial_archive")
          .insert({
            memorial_id: id,
            user_id: currentUserId,
            file_name: archiveFile.name,
            file_path: path,
            file_type:
              archiveFile.type ||
              null,
            file_size:
              archiveFile.size,
          })
          .select(
            "id,memorial_id,file_name,file_path,file_type,file_size,created_at"
          )
          .single();

      if (error) {
        await supabase.storage
          .from("memorial-archive")
          .remove([path]);

        throw error;
      }

      if (data) {
        setArchiveFiles((current) => [
          data as ArchiveFile,
          ...current,
        ]);
      }

      setArchiveFile(null);

      const input =
        document.getElementById(
          "archive-file"
        ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }
    } catch (error) {
      console.error(error);

      setArchiveError(
        error instanceof Error
          ? error.message
          : "Не вдалося завантажити файл."
      );
    } finally {
      setArchiveUploadLoading(false);
    }
  }

  /*
   * ВИДАЛЕННЯ АРХІВУ
   */
  async function handleDeleteArchiveFile(
    file: ArchiveFile
  ) {
    if (!isOwner) return;

    const confirmed = window.confirm(
      `Видалити файл "${file.file_name}"?`
    );

    if (!confirmed) return;

    try {
      const { error } =
        await supabase
          .from("memorial_archive")
          .delete()
          .eq("id", file.id)
          .eq("memorial_id", id);

      if (error) {
        throw error;
      }

      await supabase.storage
        .from("memorial-archive")
        .remove([file.file_path]);

      setArchiveFiles((current) =>
        current.filter(
          (item) => item.id !== file.id
        )
      );
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Не вдалося видалити файл."
      );
    }
  }

  /*
   * ВИДАЛЕННЯ МЕМОРІАЛУ
   */
  async function handleDeleteMemorial() {
    if (!isOwner) return;

    const confirmed = window.confirm(
      "Ви впевнені, що хочете видалити цей меморіал? Цю дію неможливо скасувати."
    );

    if (!confirmed) return;

    try {
      const { error } =
        await supabase
          .from("memorials")
          .delete()
          .eq("id", id)
          .eq("user_id", currentUserId);

      if (error) {
        throw error;
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Не вдалося видалити меморіал."
      );
    }
  }

  /*
   * QR
   */
  function downloadQR() {
    const svg =
      document.querySelector(
        "#memorial-qr svg"
      ) as SVGElement | null;

    if (!svg) return;

    const serializer =
      new XMLSerializer();

    const source =
      serializer.serializeToString(svg);

    const blob = new Blob(
      [source],
      {
        type: "image/svg+xml;charset=utf-8",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      `MEMORYUA-${memorial?.name || id}.svg`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
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
          <div className="text-5xl">
            🕯️
          </div>

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

  const dates = [
    formatDate(memorial.birth_date),
    formatDate(memorial.death_date),
  ]
    .filter(Boolean)
    .join(" — ");

  const isClassic =
    memorial.plan?.toLowerCase() ===
    "classic";

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
              onClick={goToEdit}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              ✏️ Редагувати
            </button>
          )}
        </div>
      </header>

      <section className="px-4 py-10 md:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
            {memorial.photo_url ? (
              <div className="bg-slate-100">
                <img
                  src={memorial.photo_url}
                  alt={`Фото ${memorial.name}`}
                  className="mx-auto max-h-[650px] w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center bg-slate-100">
                <div className="text-center">
                  <div className="text-6xl">
                    🕯️
                  </div>

                  <p className="mt-3 text-sm text-slate-400">
                    Світла пам'ять
                  </p>
                </div>
              </div>
            )}

            <div className="px-5 py-8 text-center md:px-10 md:py-10">
              <div className="text-sm uppercase tracking-[0.25em] text-slate-400">
                У пам'ять про
              </div>

              <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-5xl">
                {memorial.name}
              </h1>

              {dates && (
                <p className="mt-4 text-lg text-slate-500">
                  {dates}
                </p>
              )}

              <div className="mt-6 flex justify-center">
                <div className="rounded-full border border-slate-200 bg-slate-50 px-5 py-2 text-sm font-semibold text-slate-700">
                  {isClassic
                    ? "Classic — 1999 грн"
                    : `Тариф: ${
                        memorial.plan ||
                        "Не вказано"
                      }`}
                </div>
              </div>

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

              <section className="mx-auto mt-10 max-w-2xl rounded-3xl bg-[#fff9f9] p-6 text-center shadow-sm md:p-8">
                <div
                  className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                    liked
                      ? "bg-red-100"
                      : "bg-white"
                  }`}
                >
                  <div className="text-5xl">
                    ❤️
                  </div>
                </div>

                <h2 className="mt-5 text-2xl font-bold text-slate-900">
                  Підтримати пам'ять
                </h2>

                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
                  Залиште своє серце на знак пам'яті,
                  любові та поваги.
                </p>

                <button
                  type="button"
                  onClick={supportMemory}
                  disabled={
                    likeLoading || liked
                  }
                  className={`mt-6 rounded-xl px-8 py-3 text-sm font-semibold text-white ${
                    liked
                      ? "bg-red-500"
                      : "bg-slate-900 hover:bg-slate-700"
                  }`}
                >
                  {likeLoading
                    ? "Зберігаємо..."
                    : liked
                    ? "❤️ Пам'ять підтримано"
                    : "❤️ Підтримати пам'ять"}
                </button>

                <div className="mt-5 text-sm text-slate-500">
                  Сердець залишено:{" "}
                  <span className="font-bold text-slate-800">
                    {likesCount}
                  </span>
                </div>

                {likeError && (
                  <div className="mx-auto mt-5 max-w-xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700">
                    {likeError}
                  </div>
                )}
              </section>

              <section className="mx-auto mt-10 max-w-2xl rounded-3xl bg-[#faf8f3] p-6 text-center shadow-sm md:p-8">
                <div className="text-6xl">
                  🕯️
                </div>

                <h2 className="mt-5 text-2xl font-bold text-slate-900">
                  Свічка пам'яті
                </h2>

                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
                  Запаліть свічку на знак пам'яті та поваги.
                </p>

                <button
                  type="button"
                  onClick={lightCandle}
                  disabled={candleLoading}
                  className="mt-6 rounded-xl bg-slate-900 px-7 py-3 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  {candleLoading
                    ? "Запалюємо..."
                    : candleLit
                    ? "🕯️ Свічку запалено"
                    : "🕯️ Запалити свічку"}
                </button>

                <div className="mt-5 text-sm text-slate-500">
                  Свічок запалено:{" "}
                  <span className="font-bold text-slate-800">
                    {candlesCount}
                  </span>
                </div>

                {candleError && (
                  <div className="mx-auto mt-5 max-w-xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700">
                    {candleError}
                  </div>
                )}
              </section>

              <div className="my-10 border-t border-slate-200" />

              <section>
                <div className="text-center">
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Спогади
                  </div>

                  <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
                    Фотогалерея
                  </h2>

                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
                    Фотографії, які зберігають важливі моменти життя.
                  </p>
                </div>

                {galleryLoading ? (
                  <div className="mt-8 rounded-2xl bg-slate-50 p-10 text-center">
                    Завантаження фотографій...
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
                        Додайте фотографії через редагування меморіалу.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {photos.map((photo) => (
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
                            src={photo.photo_url}
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
                            className="absolute right-2 top-2 rounded-lg bg-red-600 px-3 py-2 text-xs text-white opacity-0 group-hover:opacity-100"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="my-10 border-t border-slate-200" />

              <section>
                <div className="text-center">
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Пам'ять
                  </div>

                  <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
                    📖 Книга пам'яті
                  </h2>

                  <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                    Залиште кілька теплих слів або спогад у пам'ять про цю людину.
                  </p>
                </div>

                <div className="mx-auto mt-8 max-w-2xl rounded-3xl bg-[#faf8f3] p-6 shadow-sm md:p-8">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Залишити запис
                  </h3>

                  <input
                    value={authorName}
                    onChange={(e) =>
                      setAuthorName(
                        e.target.value
                      )
                    }
                    placeholder="Ваше ім'я"
                    maxLength={100}
                    className="mt-5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  />

                  <textarea
                    value={messageText}
                    onChange={(e) =>
                      setMessageText(
                        e.target.value
                      )
                    }
                    placeholder="Напишіть слова пам'яті..."
                    maxLength={2000}
                    rows={5}
                    className="mt-5 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none"
                  />

                  {messageError && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {messageError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={addMemoryMessage}
                    disabled={messageLoading}
                    className="mt-5 w-full rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700"
                  >
                    {messageLoading
                      ? "Зберігаємо..."
                      : "💬 Залишити запис"}
                  </button>
                </div>

                <div className="mx-auto mt-8 max-w-3xl">
                  {messagesLoading ? (
                    <div className="rounded-2xl bg-slate-50 p-10 text-center">
                      Завантаження записів...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                      <div className="text-5xl">
                        💬
                      </div>

                      <p className="mt-4 font-medium text-slate-700">
                        Поки що записів немає
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((item) => (
                        <article
                          key={item.id}
                          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="font-semibold text-slate-900">
                                {item.author_name}
                              </div>

                              <div className="mt-1 text-xs text-slate-400">
                                {formatMessageDate(
                                  item.created_at
                                )}
                              </div>
                            </div>

                            {isOwner && (
                              <button
                                type="button"
                                onClick={() =>
                                  deleteMemoryMessage(
                                    item
                                  )
                                }
                                className="rounded-lg bg-red-600 px-3 py-2 text-xs text-white"
                              >
                                🗑️
                              </button>
                            )}
                          </div>

                          <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                            {item.message}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <div className="my-10 border-t border-slate-200" />

              <section>
                <div className="text-center">
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Документи та спогади
                  </div>

                  <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
                    📁 Архів пам'яті
                  </h2>

                  <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                    Документи, листи, скани та інші важливі матеріали.
                  </p>
                </div>

                {isOwner && (
                  <div className="mx-auto mt-8 max-w-2xl rounded-3xl bg-[#faf8f3] p-6 shadow-sm md:p-8">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Додати файл до архіву
                    </h3>

                    <label
                      htmlFor="archive-file"
                      className="mt-5 block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center hover:bg-slate-50"
                    >
                      <div className="text-4xl">
                        📎
                      </div>

                      <div className="mt-3 text-sm font-medium text-slate-700">
                        {archiveFile
                          ? archiveFile.name
                          : "Натисніть, щоб вибрати файл"}
                      </div>

                      {archiveFile && (
                        <div className="mt-2 text-xs text-slate-400">
                          {formatFileSize(
                            archiveFile.size
                          )}
                        </div>
                      )}
                    </label>

                    <input
                      id="archive-file"
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        setArchiveFile(
                          e.target.files?.[0] ??
                            null
                        );

                        setArchiveError("");
                      }}
                    />

                    {archiveError && (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {archiveError}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleArchiveUpload}
                      disabled={
                        archiveUploadLoading ||
                        !archiveFile
                      }
                      className="mt-5 w-full rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                    >
                      {archiveUploadLoading
                        ? "Завантажуємо..."
                        : "📤 Додати файл до архіву"}
                    </button>
                  </div>
                )}

                <div className="mx-auto mt-8 max-w-3xl">
                  {archiveLoading ? (
                    <div className="rounded-2xl bg-slate-50 p-10 text-center">
                      Завантаження архіву...
                    </div>
                  ) : archiveFiles.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                      <div className="text-5xl">
                        📁
                      </div>

                      <p className="mt-4 font-medium text-slate-700">
                        Архів поки порожній
                      </p>

                      {isOwner && (
                        <p className="mt-2 text-sm text-slate-500">
                          Додайте перший важливий файл.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {archiveFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-3xl">
                              {getArchiveIcon(
                                file
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="truncate font-semibold text-slate-900">
                                {file.file_name}
                              </div>

                              <div className="mt-1 text-xs text-slate-400">
                                {formatFileSize(
                                  file.file_size
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openArchiveFile(
                                  file
                                )
                              }
                              className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-medium text-white"
                            >
                              👁️ Відкрити
                            </button>

                            {isOwner && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteArchiveFile(
                                    file
                                  )
                                }
                                className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-medium text-white"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <div className="my-10 border-t border-slate-200" />

              <div className="grid gap-8 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-6 text-center">
                  <h2 className="text-lg font-semibold text-slate-800">
                    Цифровий меморіал
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Ця сторінка зберігає пам'ять про людину та доступна за унікальним посиланням MEMORYUA.
                  </p>

                  {isOwner && (
                    <button
                      type="button"
                      onClick={goToEdit}
                      className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white"
                    >
                      ✏️ Редагувати меморіал
                    </button>
                  )}
                </div>

                <div className="rounded-2xl bg-slate-50 p-6 text-center">
                  <h2 className="text-lg font-semibold text-slate-800">
                    QR-код пам'яті
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Відскануйте QR-код, щоб відкрити цей меморіал.
                  </p>

                  <div
                    id="memorial-qr"
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
                    className="mt-5 rounded-xl bg-slate-900 px-6 py-3 text-sm text-white"
                  >
                    ↓ Завантажити QR-код
                  </button>

                  {isOwner && (
                    <button
                      type="button"
                      onClick={
                        handleDeleteMemorial
                      }
                      className="mt-4 block w-full rounded-xl bg-red-600 px-6 py-3 text-sm font-medium text-white"
                    >
                      🗑️ Видалити меморіал
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-slate-400">
            MEMORYUA — цифрова пам'ять для майбутніх поколінь
          </div>
        </div>
      </section>

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
            className="absolute right-4 top-4 rounded-full bg-white px-4 py-2 text-xl"
          >
            ✕
          </button>

          <img
            src={selectedPhoto.photo_url}
            alt="Фотографія"
            className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain"
            onClick={(e) =>
              e.stopPropagation()
            }
          />
        </div>
      )}
    </main>
  );
}