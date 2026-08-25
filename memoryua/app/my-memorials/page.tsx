"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Memorial = {
  id: string;
  name: string;
  birth_date: string | null;
  death_date: string | null;
  story: string | null;
  photo_url: string | null;
  plan: string | null;
  created_at: string | null;
};

export default function MyMemorialsPage() {
  const router = useRouter();

  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMemorials();
  }, []);

  async function loadMemorials() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error: memorialError } =
        await supabase
          .from("memorials")
          .select(
            "id, name, birth_date, death_date, story, photo_url, plan, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

      if (memorialError) {
        throw memorialError;
      }

      setMemorials(data || []);
    } catch (err) {
      console.error(
        "MEMORYUA MY MEMORIALS ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Не вдалося завантажити меморіали."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">

      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5">

          <button
            type="button"
            onClick={() => router.push("/")}
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
            onClick={() => router.push("/")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← На головну
          </button>

        </div>
      </header>

      {/* CONTENT */}

      <section className="px-4 py-12 md:py-16">
        <div className="mx-auto max-w-5xl">

          <div className="text-center">

            <div className="text-5xl">
              🕯️
            </div>

            <h1 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
              Мої меморіали
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500">
              Тут знаходяться всі цифрові
              меморіали, створені вами.
            </p>

          </div>

          {/* LOADING */}

          {loading && (
            <div className="mt-12 rounded-3xl bg-white p-10 text-center shadow-sm">
              <div className="text-3xl">
                ⏳
              </div>

              <p className="mt-4 text-sm text-slate-500">
                Завантажуємо ваші меморіали...
              </p>
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="mt-12 rounded-3xl border border-red-200 bg-red-50 p-8 text-center">

              <div className="text-3xl">
                ⚠️
              </div>

              <h2 className="mt-3 font-bold text-red-800">
                Не вдалося завантажити меморіали
              </h2>

              <p className="mt-3 text-sm text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={loadMemorials}
                className="mt-6 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Спробувати ще раз
              </button>

            </div>
          )}

          {/* EMPTY */}

          {!loading &&
            !error &&
            memorials.length === 0 && (
              <div className="mt-12 rounded-3xl bg-white p-10 text-center shadow-sm">

                <div className="text-5xl">
                  📖
                </div>

                <h2 className="mt-4 text-xl font-bold text-slate-900">
                  У вас ще немає меморіалів
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Створіть перший цифровий
                  меморіал MEMORYUA.
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="mt-6 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  🕯️ Створити меморіал
                </button>

              </div>
            )}

          {/* MEMORIALS */}

          {!loading &&
            !error &&
            memorials.length > 0 && (
              <div className="mt-12 grid gap-6 md:grid-cols-2">

                {memorials.map((memorial) => (
                  <div
                    key={memorial.id}
                    className="overflow-hidden rounded-3xl bg-white shadow-sm"
                  >

                    {/* PHOTO */}

                    {memorial.photo_url ? (
                      <img
                        src={memorial.photo_url}
                        alt={memorial.name}
                        className="h-56 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-56 w-full items-center justify-center bg-slate-100">
                        <div className="text-6xl">
                          🕯️
                        </div>
                      </div>
                    )}

                    {/* INFO */}

                    <div className="p-6">

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <h2 className="text-xl font-bold text-slate-900">
                            {memorial.name}
                          </h2>

                          {(memorial.birth_date ||
                            memorial.death_date) && (
                            <p className="mt-2 text-sm text-slate-500">
                              {memorial.birth_date ||
                                "—"}{" "}
                              —{" "}
                              {memorial.death_date ||
                                "—"}
                            </p>
                          )}

                        </div>

                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
                          {memorial.plan ||
                            "classic"}
                        </div>

                      </div>

                      {memorial.story && (
                        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
                          {memorial.story}
                        </p>
                      )}

                      {/* BUTTONS */}

                      <div className="mt-6 grid gap-2 sm:grid-cols-2">

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/memorial/${memorial.id}`
                            )
                          }
                          className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700"
                        >
                          👁️ Відкрити
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/memorial/${memorial.id}/edit`
                            )
                          }
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          ✏️ Редагувати
                        </button>

                      </div>

                    </div>

                  </div>
                ))}

              </div>
            )}

        </div>
      </section>

      {/* FOOTER */}

      <footer className="border-t border-slate-200 bg-white px-4 py-10 text-center">

        <div className="text-sm font-bold tracking-[0.2em] text-slate-800">
          MEMORYUA
        </div>

        <p className="mt-2 text-xs text-slate-400">
          Цифрова пам&apos;ять для
          майбутніх поколінь
        </p>

      </footer>

    </main>
  );
}