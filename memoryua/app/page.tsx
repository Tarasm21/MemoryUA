"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

export default function HomePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [story, setStory] = useState("");

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview("");
      return;
    }

    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function handlePhotoChange(file: File | null) {
    if (!file) {
      setPhoto(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Будь ласка, виберіть фотографію.");
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      alert("Фотографія завелика. Максимальний розмір — 5 МБ.");
      return;
    }

    setPhoto(file);
  }

  async function createMemorial(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim()) {
      alert("Будь ласка, введіть ім'я та прізвище.");
      return;
    }

    if (birthDate && deathDate && deathDate < birthDate) {
      alert("Дата смерті не може бути раніше дати народження.");
      return;
    }

    setLoading(true);

    const id = crypto.randomUUID();
    let uploadedFileName = "";

    try {
      let photoUrl = "";

      if (photo) {
        const extension =
          photo.name.split(".").pop()?.toLowerCase() || "jpg";

        uploadedFileName = `${id}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("photos")
          .upload(uploadedFileName, photo, {
            cacheControl: "3600",
            upsert: false,
            contentType: photo.type,
          });

        if (uploadError) {
          console.error(uploadError);
          throw new Error("Не вдалося завантажити фотографію.");
        }

        const { data } = supabase.storage
          .from("photos")
          .getPublicUrl(uploadedFileName);

        photoUrl = data.publicUrl;
      }

      const { error: insertError } = await supabase
        .from("memorials")
        .insert({
          id,
          name: name.trim(),
          birth_date: birthDate || null,
          death_date: deathDate || null,
          story: story.trim() || null,
          created_at: new Date().toISOString(),
          photo_url: photoUrl || null,
        });

      if (insertError) {
        console.error(insertError);

        if (uploadedFileName) {
          await supabase.storage
            .from("photos")
            .remove([uploadedFileName]);
        }

        throw new Error(
          "Не вдалося створити меморіал. Перевірте Supabase."
        );
      }

      router.push(`/memorial/${id}`);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Сталася помилка."
      );

      setLoading(false);
    }
  }

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

      <div className="max-w-3xl mx-auto px-6 py-12">

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">

          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Створити меморіал
          </h1>

          <p className="text-slate-500 mb-8">
            Заповніть дані, додайте фотографію та створіть
            особисту сторінку пам'яті.
          </p>

          <form onSubmit={createMemorial} className="space-y-6">

            <div>
              <label className="block text-sm font-medium mb-2">
                Ім'я та прізвище *
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Наприклад: Іван Петренко"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              <div>
                <label className="block text-sm font-medium mb-2">
                  Дата народження
                </label>

                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Дата смерті
                </label>

                <input
                  type="date"
                  value={deathDate}
                  onChange={(e) => setDeathDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

            </div>

            <div>

              <label className="block text-sm font-medium mb-2">
                Фотографія
              </label>

              <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6">

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) =>
                    handlePhotoChange(
                      e.target.files?.[0] || null
                    )
                  }
                  className="w-full text-sm"
                />

                <p className="mt-2 text-xs text-slate-400">
                  JPG, PNG або WEBP. Максимальний розмір — 5 МБ.
                </p>

                {photo && (
                  <div className="mt-5 flex flex-col items-center gap-3">

                    {photoPreview && (
                      <img
                        src={photoPreview}
                        alt="Попередній перегляд"
                        className="h-40 w-40 rounded-full object-cover border-4 border-white shadow"
                      />
                    )}

                    <p className="text-sm text-green-700">
                      ✓ {photo.name}
                    </p>

                    <button
                      type="button"
                      onClick={() => setPhoto(null)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Видалити фотографію
                    </button>

                  </div>
                )}

              </div>

            </div>

            <div>

              <label className="block text-sm font-medium mb-2">
                Пам'ять
              </label>

              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Напишіть кілька слів про людину, її життя, родину, захоплення або те, що хочете зберегти в пам'яті..."
                rows={7}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 resize-none"
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 text-white py-4 font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Створюємо меморіал..."
                : "Створити меморіал"}
            </button>

          </form>

        </div>

      </div>

    </main>
  );
}
