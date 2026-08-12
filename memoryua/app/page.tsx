"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Memorial = {
  id: string;
  name: string;
  birthDate: string;
  deathDate: string;
  story: string;
  createdAt: string;
  photoUrl?: string;
};

export default function HomePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [story, setStory] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);

  async function createMemorial(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim()) {
      alert("Будь ласка, введіть ім'я.");
      return;
    }

    setLoading(true);

    try {
      const id = crypto.randomUUID();

      let photoUrl = "";

      // =========================
      // 1. Завантаження фотографії
      // =========================

      if (photo) {
        const fileExt = photo.name.split(".").pop();
        const fileName = `${id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("photos")
          .upload(fileName, photo, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Помилка завантаження фото:", uploadError);
          alert("Не вдалося завантажити фотографію.");
          setLoading(false);
          return;
        }

        const { data } = supabase.storage
  .from("photos")
  .getPublicUrl(fileName);

        photoUrl = data.publicUrl;
      }

      // =========================
      // 2. Створюємо меморіал
      // =========================

      const memorial: Memorial = {
        id,
        name: name.trim(),
        birthDate,
        deathDate,
        story: story.trim(),
        createdAt: new Date().toISOString(),
        photoUrl,
      };

      // =========================
      // 3. Зберігаємо в Supabase
      // =========================

      const { error } = await supabase
        .from("memorials")
        .insert({
          id: memorial.id,
          name: memorial.name,
          birth_date: memorial.birthDate || null,
          death_date: memorial.deathDate || null,
          story: memorial.story || null,
          created_at: memorial.createdAt,
          photo_url: memorial.photoUrl || null,
        });

      if (error) {
        console.error("Помилка створення меморіалу:", error);
        alert("Не вдалося створити меморіал. Перевірте Supabase.");
        setLoading(false);
        return;
      }

      // =========================
      // 4. Відкриваємо меморіал
      // =========================

      router.push(`/memorial/${id}`);

    } catch (error) {
      console.error(error);
      alert("Сталася помилка.");
      setLoading(false);
    }
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
      <div className="max-w-3xl mx-auto px-6 py-12">

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">

          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Створити меморіал
          </h1>

          <p className="text-slate-500 mb-8">
            Створіть цифрову сторінку пам'яті про близьку людину.
          </p>

          <form onSubmit={createMemorial} className="space-y-6">

            {/* ІМ'Я */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Ім'я та прізвище
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Наприклад: Іван Петренко"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                required
              />
            </div>

            {/* ДАТА НАРОДЖЕННЯ */}
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

            {/* ДАТА СМЕРТІ */}
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

            {/* ФОТО */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Фотографія
              </label>

              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center">

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setPhoto(file);
                  }}
                  className="w-full"
                />

                {photo && (
                  <p className="text-sm text-slate-500 mt-3">
                    Обрано: {photo.name}
                  </p>
                )}

              </div>
            </div>

            {/* ІСТОРІЯ */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Пам'ять
              </label>

              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Напишіть кілька слів про людину..."
                rows={6}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 resize-none"
              />
            </div>
{/* ФОТОГРАФІЯ */}
<div className="space-y-2 mb-6">
  <label className="block text-sm font-medium text-slate-700">
    Фотографія
  </label>

  <input
    type="file"
    accept="image/jpeg,image/png,image/webp"
    onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
  />

  {photo && (
    <p className="text-sm text-green-700">
      ✓ Обрано: {photo.name}
    </p>
  )}
</div>
            {/* КНОПКА */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 text-white py-4 font-semibold hover:bg-slate-800 disabled:opacity-50"
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