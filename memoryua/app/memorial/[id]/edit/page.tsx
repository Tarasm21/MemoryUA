"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Memorial = {
  id: string;
  name: string;
  birth_date: string | null;
  death_date: string | null;
  story: string | null;
  photo_url: string | null;
};

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

function formatDateForInput(value: string | null) {
  if (!value) return "";

  // Якщо дата вже YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  // Якщо прийшла ISO-дата
  if (value.includes("T")) {
    return value.slice(0, 10);
  }

  return value;
}

export default function EditMemorialPage() {
  const params = useParams();
  const router = useRouter();

  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : "";

  const [memorial, setMemorial] = useState<Memorial | null>(null);

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [story, setStory] = useState("");

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Не знайдено ID меморіалу.");
      setLoading(false);
      return;
    }

    loadMemorial();
  }, [id]);

  async function loadMemorial() {
    setLoading(true);
    setError("");

    try {
      console.log("MEMORYUA LOAD ID:", id);

      const { data, error: loadError } = await supabase
        .from("memorials")
        .select("*")
        .eq("id", id)
        .limit(1);

      console.log("MEMORYUA LOAD RESULT:", data);
      console.log("MEMORYUA LOAD ERROR:", loadError);

      if (loadError) {
        throw new Error(loadError.message);
      }

      if (!data || data.length === 0) {
        throw new Error("Меморіал не знайдено.");
      }

      const item = data[0] as Memorial;

      setMemorial(item);

      setName(item.name ?? "");
      setBirthDate(formatDateForInput(item.birth_date));
      setDeathDate(formatDateForInput(item.death_date));
      setStory(item.story ?? "");

      setPhotoPreview(item.photo_url ?? null);
    } catch (err) {
      console.error("MEMORYUA LOAD ERROR:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Не вдалося завантажити меморіал.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handlePhotoChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    setError("");
    setSuccess("");

    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Будь ласка, виберіть саме зображення.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setError("Фото повинно бути не більше 5 МБ.");
      e.target.value = "";
      return;
    }

    setPhoto(file);

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  }

  async function uploadPhoto(file: File): Promise<string> {
    if (!id) {
      throw new Error("Не знайдено ID меморіалу.");
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `${id}-${Date.now()}.${extension}`;

    const filePath = `memorials/${fileName}`;

    console.log("MEMORYUA PHOTO UPLOAD:", filePath);

    const { error: uploadError } = await supabase.storage
      .from("memorial-photos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error(
        "MEMORYUA PHOTO UPLOAD ERROR:",
        uploadError
      );

      throw new Error(
        uploadError.message ||
          "Не вдалося завантажити фото."
      );
    }

    const { data } = supabase.storage
      .from("memorial-photos")
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error(
        "Не вдалося отримати адресу фотографії."
      );
    }

    console.log(
      "MEMORYUA PHOTO URL:",
      data.publicUrl
    );

    return data.publicUrl;
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!id) {
      setError("Не знайдено ID меморіалу.");
      return;
    }

    if (!name.trim()) {
      setError("Введіть ім'я та прізвище.");
      return;
    }

    setSaving(true);

    try {
      let photoUrl = memorial?.photo_url ?? null;

      // Якщо вибране нове фото
      if (photo) {
        photoUrl = await uploadPhoto(photo);
      }

      console.log(
        "MEMORYUA UPDATE ID:",
        id
      );

      console.log(
        "MEMORYUA STORY BEFORE SAVE:",
        story
      );

      /*
       * ВАЖЛИВО:
       * Тут НЕ використовуємо .select().single().
       * Саме це прибирає помилку
       * "Cannot coerce the result to a single JSON object".
       */

      const { error: updateError } = await supabase
        .from("memorials")
        .update({
          name: name.trim(),
          birth_date: birthDate || null,
          death_date: deathDate || null,
          story: story.trim() || null,
          photo_url: photoUrl,
        })
        .eq("id", id);

      console.log(
        "MEMORYUA UPDATE ERROR:",
        updateError
      );

      if (updateError) {
        throw new Error(
          updateError.message ||
            "Не вдалося зберегти зміни."
        );
      }

      setMemorial((prev) =>
        prev
          ? {
              ...prev,
              name: name.trim(),
              birth_date: birthDate || null,
              death_date: deathDate || null,
              story: story.trim() || null,
              photo_url: photoUrl,
            }
          : prev
      );

      setPhoto(null);

      setSuccess("Зміни успішно збережено!");

      setTimeout(() => {
        router.push(`/memorial/${id}`);
        router.refresh();
      }, 800);
    } catch (err) {
      console.error(
        "MEMORYUA SAVE ERROR:",
        err
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Сталася помилка під час збереження."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePhoto() {
    if (!id || !memorial?.photo_url) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const url = memorial.photo_url;

      const marker = "/storage/v1/object/public/memorial-photos/";

      if (url.includes(marker)) {
        const filePath = url.split(marker)[1];

        if (filePath) {
          const { error: removeError } =
            await supabase.storage
              .from("memorial-photos")
              .remove([filePath]);

          if (removeError) {
            console.error(
              "MEMORYUA PHOTO DELETE ERROR:",
              removeError
            );
          }
        }
      }

      const { error: updateError } =
        await supabase
          .from("memorials")
          .update({
            photo_url: null,
          })
          .eq("id", id);

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      setMemorial((prev) =>
        prev
          ? {
              ...prev,
              photo_url: null,
            }
          : prev
      );

      setPhotoPreview(null);

      setSuccess(
        "Фотографію успішно видалено."
      );
    } catch (err) {
      console.error(
        "MEMORYUA DELETE PHOTO ERROR:",
        err
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Не вдалося видалити фотографію."
        );
      }
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
        <header className="border-b bg-white">
          <div className="mx-auto max-w-4xl px-6 py-6">
            <div className="text-2xl font-bold">
              MEMORYUA
            </div>

            <div className="text-sm text-slate-500">
              Цифрова пам'ять для майбутніх поколінь
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-2xl px-6 py-12">
          <div className="rounded-3xl border bg-white p-8 text-center shadow-sm">
            Завантаження меморіалу...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <div className="text-2xl font-bold text-slate-900">
            MEMORYUA
          </div>

          <div className="text-sm text-slate-500">
            Цифрова пам'ять для майбутніх поколінь
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="mb-2 text-sm text-slate-400">
              MEMORYUA
            </div>

            <h1 className="text-3xl font-bold text-slate-900">
              Редагування меморіалу
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Змініть інформацію та збережіть оновлення.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Ім'я та прізвище
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                placeholder="Введіть ім'я та прізвище"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Дата народження
                </label>

                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) =>
                    setBirthDate(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Дата смерті
                </label>

                <input
                  type="date"
                  value={deathDate}
                  onChange={(e) =>
                    setDeathDate(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Історія / пам'ять
              </label>

              <textarea
                value={story}
                onChange={(e) =>
                  setStory(e.target.value)
                }
                rows={8}
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                placeholder="Напишіть історію людини..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Фотографія
              </label>

              {photoPreview && (
                <div className="mb-4 overflow-hidden rounded-2xl border bg-slate-50">
                  <img
                    src={photoPreview}
                    alt="Фото меморіалу"
                    className="max-h-[400px] w-full object-contain"
                  />
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="block w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
              />

              <p className="mt-2 text-xs text-slate-500">
                Максимальний розмір фото — 5 МБ.
              </p>

              {memorial?.photo_url && (
                <button
                  type="button"
                  onClick={handleDeletePhoto}
                  className="mt-3 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Видалити фотографію
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Збереження..."
                  : "Зберегти зміни"}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(`/memorial/${id}`)
                }
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Скасувати
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}