"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
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

export default function EditMemorialPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [memorial, setMemorial] = useState<Memorial | null>(null);

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [story, setStory] = useState("");

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
        console.error("MEMORYUA LOAD ERROR:", error);
        setError("Не вдалося завантажити меморіал.");
        setLoading(false);
        return;
      }

      setMemorial(data);

      setName(data.name ?? "");
      setBirthDate(data.birth_date ?? "");
      setDeathDate(data.death_date ?? "");
      setStory(data.story ?? "");
      setPhotoPreview(data.photo_url ?? null);

      setLoading(false);
    }

    loadMemorial();
  }, [id]);

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
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

  async function uploadPhoto(file: File): Promise<string | null> {
    if (!id) return null;

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `${id}-${Date.now()}.${extension}`;

    const filePath = `memorials/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("memorial-photos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("MEMORYUA PHOTO UPLOAD ERROR:", uploadError);
      throw new Error(
        "Не вдалося завантажити фото. Перевірте налаштування сховища Supabase."
      );
    }

    const { data } = supabase.storage
      .from("memorial-photos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
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

      if (photo) {
        photoUrl = await uploadPhoto(photo);
      }
console.log("MEMORYUA STORY BEFORE SAVE:", story);
      const { data: updatedMemorial, error: updateError } = await supabase
  .from("memorials")
  .update({
    name: name.trim(),
    birth_date: birthDate || null,
    death_date: deathDate || null,
    story: story.trim() || null,
    photo_url: photoUrl,
  })
  .eq("id", id)
  .select("*")
  .single();

if (updateError || !updatedMemorial) {
  console.error("MEMORYUA UPDATE ERROR:", updateError);

  throw new Error(
    updateError?.message ||
      "Не вдалося підтвердити збереження змін у Supabase."
  );
}

console.log("MEMORYUA UPDATED:", updatedMemorial);

      if (updateError) {
        console.error("MEMORYUA UPDATE ERROR:", updateError);
        throw new Error(
          "Не вдалося зберегти зміни. Перевірте дані Supabase."
        );
      }

      setSuccess("Зміни успішно збережено!");

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

      setTimeout(() => {
        router.push(`/memorial/${id}`);
        router.refresh();
      }, 800);
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Сталася помилка під час збереження.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePhoto() {
    if (!id) return;

    setError("");
    setSuccess("");

    if (!memorial?.photo_url) {
      setPhotoPreview(null);
      setPhoto(null);
      return;
    }

    const confirmed = window.confirm(
      "Ви дійсно хочете видалити фотографію?"
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const photoUrl = memorial.photo_url;

      const marker = "/storage/v1/object/public/memorial-photos/";

      if (photoUrl.includes(marker)) {
        const filePath = photoUrl.split(marker)[1];

        if (filePath) {
          const { error: removeError } = await supabase.storage
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

      const { error: updateError } = await supabase
        .from("memorials")
        .update({
          photo_url: null,
        })
        .eq("id", id);

      if (updateError) {
        throw new Error("Не вдалося видалити фотографію.");
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
      setPhoto(null);

      setSuccess("Фотографію видалено.");
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Не вдалося видалити фотографію.");
      }
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-4xl px-6 py-5">
            <div className="text-xl font-bold tracking-wide">
              MEMORYUA
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Цифрова пам&apos;ять для майбутніх поколінь
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 py-12 text-center">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <p className="text-slate-500">
              Завантаження меморіалу...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!memorial) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-4xl px-6 py-5">
            <div className="text-xl font-bold tracking-wide">
              MEMORYUA
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Цифрова пам&apos;ять для майбутніх поколінь
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 py-12">
          <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-slate-800">
              Меморіал не знайдено
            </h1>

            <p className="mt-3 text-slate-500">
              Можливо, цей меморіал був видалений або посилання
              неправильне.
            </p>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-6 rounded-xl bg-slate-800 px-6 py-3 font-semibold text-white transition hover:bg-slate-700"
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
        <div className="mx-auto max-w-4xl px-6 py-5">
          <div className="text-xl font-bold tracking-wide">
            MEMORYUA
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Цифрова пам&apos;ять для майбутніх поколінь
          </p>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="px-6 py-8 sm:px-10">
            <div className="mb-8 text-center">
              <p className="text-sm font-medium uppercase tracking-widest text-slate-400">
                MEMORYUA
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-800">
                Редагування меморіалу
              </h1>

              <p className="mt-3 text-sm text-slate-500">
                Змініть інформацію та збережіть оновлення.
              </p>
            </div>

            {/* ERROR */}
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* NAME */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Ім&apos;я та прізвище
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Наприклад: Іван Петренко"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* DATES */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Дата народження
                  </label>

                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Дата смерті
                  </label>

                  <input
                    type="date"
                    value={deathDate}
                    onChange={(e) => setDeathDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              {/* STORY */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Історія / пам&apos;ять
                </label>

                <textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Напишіть кілька слів про людину, її життя, родину, спогади..."
                  rows={8}
                  className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* PHOTO */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Фотографія
                </label>

                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                  {photoPreview && (
                    <div className="mb-5">
                      <img
                        src={photoPreview}
                        alt="Фото меморіалу"
                        className="mx-auto max-h-[420px] w-auto max-w-full rounded-2xl object-contain shadow-sm"
                      />
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-slate-700"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    JPG, PNG, WEBP. Максимальний розмір — 5 МБ.
                  </p>

                  {memorial.photo_url && (
                    <button
                      type="button"
                      onClick={handleDeletePhoto}
                      disabled={deleting || saving}
                      className="mt-4 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deleting
                        ? "Видалення..."
                        : "Видалити фотографію"}
                    </button>
                  )}
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-slate-800 px-6 py-4 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Зберігаємо..." : "Зберегти зміни"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push(`/memorial/${id}`)}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-6 py-4 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Скасувати
                </button>
              </div>
            </form>
          </div>

          {/* FOOTER */}
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-6 text-center">
            <p className="text-sm text-slate-500">
              MEMORYUA — цифрова пам&apos;ять для майбутніх поколінь
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}