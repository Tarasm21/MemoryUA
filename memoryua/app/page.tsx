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

  const [userEmail, setUserEmail] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        console.log("MEMORYUA SESSION:", session);
        console.log("MEMORYUA SESSION ERROR:", sessionError);

        if (!mounted) return;

        if (sessionError) {
          setError(sessionError.message);
          setCheckingAuth(false);
          return;
        }

        if (!session?.user) {
          router.replace("/login");
          return;
        }

        setUserEmail(session.user.email ?? "");
        setCheckingAuth(false);
      } catch (err) {
        console.error("AUTH CHECK ERROR:", err);

        if (!mounted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Не вдалося перевірити авторизацію."
        );

        setCheckingAuth(false);
      }
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      setUserEmail(session.user.email ?? "");
      setCheckingAuth(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function createMemorial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Введіть ім'я та прізвище.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      const userId = session.user.id;
      const memorialId = crypto.randomUUID();

      console.log("MEMORYUA USER ID:", userId);

      const { error: insertError } = await supabase
        .from("memorials")
        .insert({
          id: memorialId,
          user_id: userId,
          name: name.trim(),
          birth_date: birthDate || null,
          death_date: deathDate || null,
          story: story.trim() || null,
          photo_url: null,
        });

      if (insertError) {
        console.error("SUPABASE INSERT ERROR:", insertError);

        throw new Error(
          `${insertError.message} | code: ${
            insertError.code ?? "unknown"
          }`
        );
      }

      console.log("MEMORYUA: меморіал створено");

      router.push(`/memorial/${memorialId}`);
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

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
        <div className="flex min-h-screen items-center justify-center">
          <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
            Перевірка авторизації...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <div className="text-xl font-semibold">MEMORYUA</div>

            <div className="mt-1 text-sm text-slate-500">
              Цифрова пам&apos;ять для майбутніх поколінь
            </div>

            {userEmail && (
              <div className="mt-2 text-xs text-slate-400">
                Ви увійшли: {userEmail}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Вийти
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-6 py-10 text-center">
            <div className="mb-6 text-6xl">🕊️</div>

            <h1 className="text-3xl font-semibold md:text-4xl">
              MEMORYUA
            </h1>

            <p className="mt-4 text-lg text-slate-500">
              Цифрова пам&apos;ять, яка залишається назавжди
            </p>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Створіть меморіальну сторінку людини та збережіть її
              історію, дати життя і важливі спогади.
            </p>
          </div>

          <div className="border-t border-slate-100" />

          <form onSubmit={createMemorial} className="px-6 py-8">
            <h2 className="mb-6 text-2xl font-semibold">
              Створити меморіал
            </h2>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Ім&apos;я та прізвище
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Наприклад: Іван Петренко"
                  disabled={saving}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 disabled:bg-slate-100"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Дата народження
                  </label>

                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 disabled:bg-slate-100"
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
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Історія життя
                </label>

                <textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Напишіть історію життя, спогади, важливі моменти..."
                  rows={8}
                  disabled={saving}
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 disabled:bg-slate-100"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-slate-800 px-6 py-4 font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Створення меморіалу..."
                  : "Створити меморіал"}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          MEMORYUA — пам&apos;ять, яка залишається.
        </div>
      </section>
    </main>
  );
}