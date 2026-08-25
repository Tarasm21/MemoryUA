"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ArchiveItem = {
  id: string;
  memorial_id: string;
  user_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_type: string | null;
  file_path: string | null;
  is_public: boolean;
  created_at: string;
};

type Memorial = {
  id: string;
  user_id: string;
  name: string;
};

export default function ArchivePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [memorial, setMemorial] = useState<Memorial | null>(null);
  const [items, setItems] = useState<ArchiveItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================
  // ЗАВАНТАЖЕННЯ ДАНИХ
  // =========================================

  useEffect(() => {
    let mounted = true;

    async function loadArchive() {
      if (!id) {
        if (mounted) {
          setError("Не знайдено ID меморіалу.");
          setLoading(false);
        }

        return;
      }

      setLoading(true);
      setError("");

      try {
        // =====================================
        // КОРИСТУВАЧ
        // =====================================

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (mounted) {
            setError(
              "Для роботи з Архівом пам'яті потрібно увійти в акаунт."
            );
            setLoading(false);
          }

          return;
        }

        // =====================================
        // МЕМОРІАЛ
        // =====================================

        const {
          data: memorialData,
          error: memorialError,
        } = await supabase
          .from("memorials")
          .select("id, user_id, name")
          .eq("id", id)
          .maybeSingle();

        if (memorialError) {
          console.error(
            "MEMORYUA ARCHIVE MEMORIAL ERROR:",
            memorialError
          );

          if (mounted) {
            setError("Не вдалося завантажити меморіал.");
          }

          return;
        }

        if (!memorialData) {
          if (mounted) {
            setError("Меморіал не знайдено.");
          }

          return;
        }

        // =====================================
        // ПЕРЕВІРКА ВЛАСНИКА
        // =====================================

        if (memorialData.user_id !== session.user.id) {
          if (mounted) {
            setError(
              "Архів пам'яті доступний тільки власнику меморіалу."
            );
          }

          return;
        }

        // =====================================
        // АРХІВ
        // =====================================

        const {
          data: archiveData,
          error: archiveError,
        } = await supabase
          .from("memorial_archive")
          .select(
            "id, memorial_id, user_id, title, description, file_url, file_name, file_type, file_path, is_public, created_at"
          )
          .eq("memorial_id", id)
          .order("created_at", {
            ascending: false,
          });

        if (archiveError) {
          console.error(
            "MEMORYUA ARCHIVE LOAD ERROR:",
            archiveError
          );

          if (mounted) {
            setError("Не вдалося завантажити Архів пам'яті.");
          }

          return;
        }

        if (mounted) {
          setMemorial(memorialData as Memorial);
          setItems((archiveData ?? []) as ArchiveItem[]);
        }
      } catch (err) {
        console.error("MEMORYUA ARCHIVE ERROR:", err);

        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Невідома помилка."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadArchive();

    return () => {
      mounted = false;
    };
  }, [id]);

  // =========================================
  // ВИБІР ФАЙЛУ
  // =========================================

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] ?? null;

    setSelectedFile(file);
    setError("");
    setSuccess("");
  };

  // =========================================
  // ЗАВАНТАЖЕННЯ ФАЙЛУ
  // =========================================

  const handleUpload = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!id) {
      setError("Не знайдено ID меморіалу.");
      return;
    }

    if (!memorial) {
      setError("Меморіал ще не завантажений.");
      return;
    }

    if (!title.trim()) {
      setError("Введіть назву матеріалу.");
      return;
    }

    if (!selectedFile) {
      setError("Виберіть файл.");
      return;
    }

    // Максимальний розмір — 50 MB
    const maxSize = 50 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setError("Файл занадто великий. Максимальний розмір — 50 MB.");
      return;
    }

    setUploading(true);

    try {
      // =====================================
      // КОРИСТУВАЧ
      // =====================================

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setError("Потрібно увійти в акаунт.");
        return;
      }

      // =====================================
      // ПЕРЕВІРКА ВЛАСНИКА
      // =====================================

      if (memorial.user_id !== session.user.id) {
        setError("Ви не є власником цього меморіалу.");
        return;
      }

      // =====================================
      // БЕЗПЕЧНА НАЗВА ФАЙЛУ
      // =====================================

      const extension =
        selectedFile.name.includes(".")
          ? selectedFile.name
              .split(".")
              .pop()
              ?.toLowerCase() || "file"
          : "file";

      const safeFileName =
        selectedFile.name
          .replace(/[^a-zA-Z0-9а-яА-ЯіІїЇєЄґҐ._-]/g, "_")
          .replace(/\s+/g, "_");

      const uniqueName =
        `${Date.now()}-${crypto.randomUUID()}.${extension}`;

      const filePath =
        `${session.user.id}/${id}/${uniqueName}`;

      // =====================================
      // UPLOAD У STORAGE
      // =====================================

      const {
        error: uploadError,
      } = await supabase.storage
        .from("memorial-archive")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: selectedFile.type || undefined,
        });

      if (uploadError) {
        console.error(
          "MEMORYUA ARCHIVE STORAGE ERROR:",
          uploadError
        );

        setError(
          uploadError.message ||
            "Не вдалося завантажити файл."
        );

        return;
      }

      // =====================================
      // PUBLIC URL
      // =====================================

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("memorial-archive")
        .getPublicUrl(filePath);

      const publicUrl =
        publicUrlData.publicUrl;

      if (!publicUrl) {
        setError("Не вдалося отримати посилання на файл.");

        await supabase.storage
          .from("memorial-archive")
          .remove([filePath]);

        return;
      }

      // =====================================
      // ЗАПИС У БАЗУ
      // =====================================

      const {
        data: insertedItem,
        error: insertError,
      } = await supabase
        .from("memorial_archive")
        .insert({
          memorial_id: id,
          user_id: session.user.id,
          title: title.trim(),
          description:
            description.trim() || null,
          file_url: publicUrl,
          file_name: safeFileName,
          file_type:
            selectedFile.type || null,
          file_path: filePath,
          is_public: isPublic,
        })
        .select(
          "id, memorial_id, user_id, title, description, file_url, file_name, file_type, file_path, is_public, created_at"
        )
        .single();

      if (insertError) {
        console.error(
          "MEMORYUA ARCHIVE DATABASE ERROR:",
          insertError
        );

        // Якщо база не записалась —
        // видаляємо вже завантажений файл
        await supabase.storage
          .from("memorial-archive")
          .remove([filePath]);

        setError(
          insertError.message ||
            "Не вдалося зберегти матеріал."
        );

        return;
      }

      // =====================================
      // ОНОВЛЮЄМО СПИСОК
      // =====================================

      if (insertedItem) {
        setItems((current) => [
          insertedItem as ArchiveItem,
          ...current,
        ]);
      }

      setTitle("");
      setDescription("");
      setIsPublic(true);
      setSelectedFile(null);

      const fileInput =
        document.getElementById(
          "archive-file"
        ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      setSuccess(
        "Матеріал успішно додано до Архіву пам'яті."
      );
    } catch (err) {
      console.error(
        "MEMORYUA ARCHIVE UPLOAD EXCEPTION:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Невідома помилка."
      );
    } finally {
      setUploading(false);
    }
  };

  // =========================================
  // ВИДАЛЕННЯ
  // =========================================

  const handleDelete = async (
    item: ArchiveItem
  ) => {
    const confirmed =
      window.confirm(
        `Видалити "${item.title}" з Архіву пам'яті?`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      // =====================================
      // ВИДАЛЯЄМО ФАЙЛ
      // =====================================

      if (item.file_path) {
        const {
          error: storageError,
        } = await supabase.storage
          .from("memorial-archive")
          .remove([item.file_path]);

        if (storageError) {
          console.error(
            "MEMORYUA ARCHIVE STORAGE DELETE ERROR:",
            storageError
          );
        }
      }

      // =====================================
      // ВИДАЛЯЄМО З БАЗИ
      // =====================================

      const {
        error: deleteError,
      } = await supabase
        .from("memorial_archive")
        .delete()
        .eq("id", item.id);

      if (deleteError) {
        console.error(
          "MEMORYUA ARCHIVE DATABASE DELETE ERROR:",
          deleteError
        );

        setError(
          deleteError.message ||
            "Не вдалося видалити матеріал."
        );

        return;
      }

      setItems((current) =>
        current.filter(
          (archiveItem) =>
            archiveItem.id !== item.id
        )
      );

      setSuccess(
        "Матеріал успішно видалено."
      );
    } catch (err) {
      console.error(
        "MEMORYUA ARCHIVE DELETE EXCEPTION:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Невідома помилка."
      );
    }
  };

  // =========================================
  // ФОРМАТ ДАТИ
  // =========================================

  const formatDate = (
    date: string
  ) => {
    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return parsed.toLocaleDateString(
      "uk-UA",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =========================================
  // ВИЗНАЧЕННЯ ТИПУ ФАЙЛУ
  // =========================================

  const getFileIcon = (
    fileType: string | null
  ) => {
    if (!fileType) return "📎";

    if (fileType.startsWith("image/")) {
      return "📷";
    }

    if (fileType.startsWith("video/")) {
      return "🎞️";
    }

    if (fileType.startsWith("audio/")) {
      return "🎵";
    }

    if (
      fileType.includes("pdf") ||
      fileType.includes("document") ||
      fileType.includes("word")
    ) {
      return "📄";
    }

    return "📎";
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />

          <p className="mt-4 text-slate-600">
            Завантаження Архіву пам'яті...
          </p>
        </div>
      </main>
    );
  }

  // =========================================
  // ERROR
  // =========================================

  if (error && !memorial) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] px-4 py-16">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">
            📚
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Архів пам'яті
          </h1>

          <p className="mt-4 text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => {
              window.location.href =
                `/memorial/${id}`;
            }}
            className="mt-6 rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-700"
          >
            Повернутися до меморіалу
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">

      {/* =======================================
          HEADER
      ======================================= */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-5">

          <button
            type="button"
            onClick={() => {
              window.location.href =
                `/memorial/${id}`;
            }}
            className="text-left"
          >
            <div className="text-xl font-bold tracking-[0.18em] text-slate-900">
              MEMORYUA
            </div>

            <div className="mt-1 text-xs text-slate-500">
              Цифрова пам'ять для майбутніх поколінь
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href =
                `/memorial/${id}`;
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← До меморіалу
          </button>

        </div>
      </header>

      <section className="px-4 py-8 md:py-12">
        <div className="mx-auto max-w-5xl">

          {/* ===================================
              TITLE
          =================================== */}

          <div className="text-center">

            <div className="text-6xl">
              📚
            </div>

            <div className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              MEMORYUA
            </div>

            <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-5xl">
              Архів пам'яті
            </h1>

            {memorial && (
              <p className="mt-4 text-lg text-slate-500">
                Матеріали, які зберігають пам'ять про{" "}
                <span className="font-semibold text-slate-700">
                  {memorial.name}
                </span>
              </p>
            )}

          </div>

          {/* ===================================
              FORM
          =================================== */}

          <div className="mt-10 rounded-3xl bg-white p-6 shadow-sm md:p-8">

            <h2 className="text-xl font-bold text-slate-900">
              Додати матеріал
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Тут можна зберігати фотографії,
              документи, відео, аудіозаписи та
              інші важливі матеріали.
            </p>

            <form
              onSubmit={handleUpload}
              className="mt-6 space-y-5"
            >

              {/* НАЗВА */}

              <div>
                <label
                  htmlFor="archive-title"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Назва матеріалу
                </label>

                <input
                  id="archive-title"
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="Наприклад: Фото з родиною"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* ОПИС */}

              <div>
                <label
                  htmlFor="archive-description"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Опис
                </label>

                <textarea
                  id="archive-description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Короткий опис матеріалу..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* ФАЙЛ */}

              <div>
                <label
                  htmlFor="archive-file"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Файл
                </label>

                <input
                  id="archive-file"
                  type="file"
                  onChange={handleFileChange}
                  className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Максимальний розмір файлу — 50 MB.
                </p>

                {selectedFile && (
                  <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Обрано:{" "}
                    <span className="font-medium text-slate-800">
                      {selectedFile.name}
                    </span>
                  </div>
                )}
              </div>

              {/* ПУБЛІЧНІСТЬ */}

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">

                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(event) =>
                    setIsPublic(
                      event.target.checked
                    )
                  }
                  className="mt-1 h-4 w-4"
                />

                <span>
                  <span className="block text-sm font-medium text-slate-800">
                    Показувати відвідувачам
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Якщо вимкнути — матеріал залишиться
                    доступним тільки власнику меморіалу.
                  </span>
                </span>

              </label>

              {/* ПОМИЛКА */}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <div className="font-semibold">
                    Помилка
                  </div>

                  <div className="mt-1 break-words">
                    {error}
                  </div>
                </div>
              )}

              {/* УСПІХ */}

              {success && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}
                </div>
              )}

              {/* КНОПКА */}

              <button
                type="submit"
                disabled={uploading}
                className="w-full rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading
                  ? "⏳ Завантаження..."
                  : "⬆️ Додати до Архіву"}
              </button>

            </form>
          </div>

          {/* ===================================
              СПИСОК АРХІВУ
          =================================== */}

          <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm md:p-8">

            <div className="flex items-center justify-between gap-4">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Збережені матеріали
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Усього матеріалів:{" "}
                  <span className="font-semibold text-slate-700">
                    {items.length}
                  </span>
                </p>
              </div>

              <div className="text-3xl">
                🗂️
              </div>

            </div>

            {items.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">

                <div className="text-5xl">
                  📦
                </div>

                <p className="mt-4 font-medium text-slate-700">
                  Архів поки порожній
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Додайте перший матеріал вище.
                </p>

              </div>
            ) : (
              <div className="mt-8 space-y-4">

                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                      <div className="flex min-w-0 gap-4">

                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                          {getFileIcon(
                            item.file_type
                          )}
                        </div>

                        <div className="min-w-0">

                          <h3 className="break-words font-semibold text-slate-900">
                            {item.title}
                          </h3>

                          <p className="mt-1 break-all text-xs text-slate-400">
                            {item.file_name}
                          </p>

                          {item.description && (
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                              {item.description}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2 text-xs">

                            <span className="rounded-full bg-white px-3 py-1 text-slate-500">
                              {item.is_public
                                ? "🌐 Публічний"
                                : "🔒 Приватний"}
                            </span>

                            <span className="rounded-full bg-white px-3 py-1 text-slate-400">
                              {formatDate(
                                item.created_at
                              )}
                            </span>

                          </div>

                        </div>

                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">

                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                        >
                          👁️ Відкрити
                        </a>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(item)
                          }
                          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                        >
                          🗑️
                        </button>

                      </div>

                    </div>

                  </div>
                ))}

              </div>
            )}

          </div>

          {/* ===================================
              FOOTER
          =================================== */}

          <div className="mt-8 text-center text-xs text-slate-400">
            MEMORYUA — цифрова пам'ять для майбутніх поколінь
          </div>

        </div>
      </section>
    </main>
  );
}