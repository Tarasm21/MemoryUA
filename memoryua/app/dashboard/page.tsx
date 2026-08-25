"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Memorial = {
  id: string;
  user_id: string;
  name: string;
  birth_date: string | null;
  death_date: string | null;
  story: string | null;
  photo_url: string | null;
  created_at: string | null;
};

export default function DashboardPage() {
  const router = useRouter();

  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.replace("/login");
          return;
        }

        if (mounted) {
          setUserEmail(session.user.email ?? "");
        }

        const { data, error: memorialError } = await supabase
          .from("memorials")
          .select(
            "id, user_id, name, birth_date, death_date, story, photo_url, created_at"
          )
          .eq("user_id", session.user.id)
          .order("created_at", {
            ascending: false,
          });

        if (memorialError) {
          console.error(
            "MEMORYUA DASHBOARD LOAD ERROR:",
            memorialError
          );

          if (mounted) {
            setError(
              "Не вдалося завантажити ваші меморіали."
            );
          }

          return;
        }

        if (mounted) {
          setMemorials(
            (data ?? []) as Memorial[]
          );
        }
      } catch (err) {
        console.error(
          "MEMORYUA DASHBOARD ERROR:",
          err
        );

        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Сталася помилка."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) {
          router.replace("/login");
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const formatDate = (
    date: string | null
  ) => {
    if (!date) return "";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString(
      "uk-UA",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  };

  const openMemorial = (
    id: string
  ) => {
    router.push(`/memorial/${id}`);
  };

  const editMemorial = (
    id: string
  ) => {
    router.push(
      `/memorial/${id}/edit`
    );
  };

  const deleteMemorial = async (
    memorial: Memorial
  ) => {
    const confirmed = window.confirm(
      `Ви впевнені, що хочете видалити меморіал "${memorial.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const { error: deleteError } =
        await supabase
          .from("memorials")
          .delete()
          .eq("id", memorial.id)
          .eq(
            "user_id",
            memorial.user_id
          );

      if (deleteError) {
        console.error(
          "MEMORYUA DASHBOARD DELETE ERROR:",
          deleteError
        );

        alert(
          "Не вдалося видалити меморіал."
        );

        return;
      }

      setMemorials(
        (current) =>
          current.filter(
            (item) =>
              item.id !== memorial.id
          )
      );
    } catch (err) {
      console.error(
        "MEMORYUA DASHBOARD DELETE EXCEPTION:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Сталася помилка."
      );
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();

    router.replace("/login");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />

          <p className="mt-4 text-sm text-slate-500">
            Завантаження кабінету...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">

      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5">

          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
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
            onClick={logout}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Вийти
          </button>

        </div>
      </header>

      {/* CONTENT */}

      <section className="px-4 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">

          {/* TITLE */}

          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Особистий кабінет
              </div>

              <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
                Мої меморіали
              </h1>

              {userEmail && (
                <p className="mt-2 text-sm text-slate-500">
                  {userEmail}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                router.push("/");
                setTimeout(() => {
                  document
                    .getElementById(
                      "create-memorial"
                    )
                    ?.scrollIntoView({
                      behavior: "smooth",
                    });
                }, 300);
              }}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              🕯️ Створити меморіал
            </button>

          </div>

          {/* ERROR */}

          {error && (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* EMPTY */}

          {!error &&
            memorials.length === 0 && (
              <div className="mt-10 rounded-3xl bg-white p-10 text-center shadow-sm md:p-16">

                <div className="text-6xl">
                  🕯️
                </div>

                <h2 className="mt-5 text-2xl font-bold text-slate-900">
                  У вас ще немає меморіалів
                </h2>

                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                  Створіть перший цифровий
                  меморіал і збережіть пам&apos;ять
                  про близьку людину.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/")
                  }
                  className="mt-7 rounded-xl bg-slate-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  🕯️ Створити меморіал
                </button>

              </div>
            )}

          {/* MEMORIALS */}

          {memorials.length > 0 && (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

              {memorials.map(
                (memorial) => (
                  <article
                    key={memorial.id}
                    className="overflow-hidden rounded-3xl bg-white shadow-sm"
                  >

                    {/* PHOTO */}

                    {memorial.photo_url ? (
                      <button
                        type="button"
                        onClick={() =>
                          openMemorial(
                            memorial.id
                          )
                        }
                        className="block w-full"
                      >
                        <img
                          src={
                            memorial.photo_url
                          }
                          alt={
                            memorial.name
                          }
                          className="h-64 w-full object-cover transition duration-300 hover:scale-[1.02]"
                        />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          openMemorial(
                            memorial.id
                          )
                        }
                        className="flex h-64 w-full items-center justify-center bg-slate-100"
                      >
                        <div className="text-center">
                          <div className="text-6xl">
                            🕯️
                          </div>

                          <p className="mt-3 text-sm text-slate-400">
                            Світла пам&apos;ять
                          </p>
                        </div>
                      </button>
                    )}

                    {/* INFO */}

                    <div className="p-6">

                      <h2 className="text-xl font-bold text-slate-900">
                        {memorial.name}
                      </h2>

                      {(memorial.birth_date ||
                        memorial.death_date) && (
                        <p className="mt-2 text-sm text-slate-500">
                          {formatDate(
                            memorial.birth_date
                          )}

                          {memorial.birth_date &&
                          memorial.death_date
                            ? " — "
                            : ""}

                          {formatDate(
                            memorial.death_date
                          )}
                        </p>
                      )}

                      {memorial.story && (
                        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
                          {memorial.story}
                        </p>
                      )}

                      {/* BUTTONS */}

                      <div className="mt-6 grid gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            openMemorial(
                              memorial.id
                            )
                          }
                          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                        >
                          👁️ Відкрити меморіал
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            editMemorial(
                              memorial.id
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          ✏️ Редагувати
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteMemorial(
                              memorial
                            )
                          }
                          className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                        >
                          🗑️ Видалити
                        </button>

                      </div>

                    </div>
                  </article>
                )
              )}

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

        <button
          type="button"
          onClick={() =>
            router.push("/")
          }
          className="mt-5 text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900"
        >
          На головну
        </button>

      </footer>

    </main>
  );
}