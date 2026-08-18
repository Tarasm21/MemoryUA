"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [story, setStory] = useState("");

  const [checkingUser, setCheckingUser] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkUser() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("AUTH ERROR:", authError);
          setError(authError.message);
          setCheckingUser(false);
          return;
        }

        if (!user) {
          setCheckingUser(false);
          router.push("/login");
          return;
        }

        setUserEmail(user.email ?? "");
        setCheckingUser(false);
      } catch (err) {
        console.error("Помилка перевірки авторизації:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Не вдалося перевірити авторизацію."
        );

        setCheckingUser(false);
      }
    }

    checkUser();
  }, [router]);

  async function createMemorial(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Будь ласка, введіть ім’я людини.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        setError("Потрібно увійти в акаунт.");
        router.push("/login");
        return;
      }

      console.log("MEMORYUA USER ID:", user.id);
      console.log("MEMORYUA EMAIL:", user.email);

      const id = crypto.randomUUID();

      const memorialData = {
        id: id,
        user_id: user.id,
        name: name.trim(),
        birth_date: birthDate || null,
        death_date: deathDate || null,
        story: story.trim() || null,
        photo_url: null,
      };

      console.log("MEMORYUA INSERT DATA:", memorialData);

      const { error: insertError } = await supabase
        .from("memorials")
        .insert(memorialData);

      if (insertError) {
        console.error("SUPABASE INSERT ERROR:", insertError);

        throw new Error(
          `Supabase: ${insertError.message} | code: ${insertError.code || "немає"}`
        );
      }

      console.log("MEMORYUA: МЕМОРІАЛ УСПІШНО СТВОРЕНО");

      router.push(`/memorial/${id}`);
    } catch (err) {
      console.error("MEMORYUA CREATE ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Не вдалося створити меморіал."
      );
    } finally {
      setSaving(false);
    }
  }

  if (checkingUser) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-4xl px-6 py-5">
            <div className="text-xl font-semibold text-slate-700">
              MEMORYUA
            </div>

            <div className="mt-1 text-sm text-slate-500">
              Цифрова пам&apos;ять для майбутніх поколінь
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="text-lg font-semibold">
              Перевірка авторизації...
            </div>

            <div className="mt-2 text-sm text-slate-500">
              Зачекайте, будь ласка.
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-5">
          <div className="text-xl font-semibold text-slate-700">
            MEMORYUA
          </div>

          <div className="mt-1 text-sm text-slate-500">
            Цифрова пам&apos;ять для майбутніх поколінь
          </div>

          {userEmail && (
            <div className="mt-2 text-xs text-slate-400">
              Ви увійшли як: {userEmail}
            </div>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-6 py-10 text-center">
            <div className="mb-6 text-6xl">🕊️</div>

            <h1 className="text-3xl font-semibold text-slate-800 md:text-4xl">
              MEMORYUA
            </h1>

            <p className="mt-4 text-lg text-slate-500">
              Цифрова пам&apos;ять, яка залишається назавжди
            </p>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Створіть меморіальну сторінку людини,
              збережіть її історію, дати життя та важливі спогади.
            </p>
          </div>

          <div className="border-t border-slate-100" />

          <form onSubmit={createMemorial} className="px-6 py-8">
            <h2 className="mb-6 text-2xl font-semibold text-slate-700">
              Створити меморіал
            </h2>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Ім&apos;я та прізвище
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Наприклад: Іван Петренко"
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 disabled:bg-slate-100"
                  required
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Дата народження
                  </label>

                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Дата смерті
                  </label>

                  <input
                    type="date"
                    value={deathDate}
                    onChange={(e) => setDeathDate(e.target.value)}
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Історія життя
                </label>

                <textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Напишіть історію життя, спогади, важливі моменти..."
                  rows={8}
                  disabled={saving}
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 disabled:bg-slate-100"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-slate-800 px-6 py-4 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Створення меморіалу..."
                  : "Створити меморіал"}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            MEMORYUA — пам&apos;ять, яка залишається.
          </p>
        </div>
      </section>
    </main>
  );
}