"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [story, setStory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createMemorial(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Введіть ім'я та прізвище.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Отримуємо авторизованого користувача
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Створюємо ID меморіалу
      const id = crypto.randomUUID();

      // Створюємо запис у Supabase
      const { error: insertError } = await supabase
        .from("memorials")
        .insert({
          id,
          name: name.trim(),
          birth_date: birthDate || null,
          death_date: deathDate || null,
          story: story.trim() || null,
          user_id: user?.id ?? null,
        });

      if (insertError) {
        console.error(insertError);
        setError(
          "Не вдалося створити меморіал. Перевірте підключення до бази."
        );
        setLoading(false);
        return;
      }

      // Переходимо на сторінку створеного меморіалу
      router.push(`/memorial/${id}`);
    } catch (err) {
      console.error(err);
      setError("Сталася помилка під час створення меморіалу.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <div className="text-2xl font-bold tracking-wide text-slate-900">
              MEMORYUA
            </div>

            <div className="text-sm text-slate-500">
              Цифрова пам’ять для майбутніх поколінь
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-bold text-slate-900">
            Створити меморіал
          </h1>

          <p className="mt-2 text-slate-500">
            Створіть цифрову сторінку пам’яті та QR-код для меморіалу.
          </p>

          <form onSubmit={createMemorial} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Ім’я та прізвище
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

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Дата народження
                </label>

                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Дата смерті
                </label>

                <input
                  type="date"
                  value={deathDate}
                  onChange={(e) => setDeathDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Пам’ять / біографія
              </label>

              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Напишіть кілька слів про людину..."
                rows={7}
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-5 py-3.5 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Створення..." : "Створити меморіал"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}