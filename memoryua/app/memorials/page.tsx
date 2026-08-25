"use client";

import { useEffect, useMemo, useState } from "react";
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

type MemorialLike = {
  memorial_id: string;
};

type SortOption =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc";

export default function MemorialsPage() {
  const router = useRouter();

  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [likes, setLikes] = useState<Record<string, number>>({});

  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [sortBy, setSortBy] =
    useState<SortOption>("newest");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================
  // ЗАВАНТАЖЕННЯ МЕМОРІАЛІВ
  // =========================================

  useEffect(() => {
    loadMemorials();
  }, []);

  const loadMemorials = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data,
        error: memorialError,
      } = await supabase
        .from("memorials")
        .select(
          "id, user_id, name, birth_date, death_date, story, photo_url, created_at"
        )
        .order("created_at", {
          ascending: false,
        });

      if (memorialError) {
        console.error(
          "MEMORYUA MEMORIALS ERROR:",
          memorialError
        );

        setError(
          memorialError.message ||
            "Не вдалося завантажити меморіали."
        );

        setMemorials([]);
        return;
      }

      const memorialList =
        (data ?? []) as Memorial[];

      setMemorials(memorialList);

      // =====================================
      // ❤️ ЗАВАНТАЖУЄМО ЛАЙКИ
      // =====================================

      if (memorialList.length > 0) {
        const memorialIds =
          memorialList.map(
            (item) => item.id
          );

        const {
          data: likesData,
          error: likesError,
        } = await supabase
          .from("memorial_likes")
          .select("memorial_id")
          .in(
            "memorial_id",
            memorialIds
          );

        if (likesError) {
          console.error(
            "MEMORYUA LIKES ERROR:",
            likesError
          );

          setLikes({});
        } else {
          const likesMap: Record<
            string,
            number
          > = {};

          (
            (likesData ?? []) as MemorialLike[]
          ).forEach((item) => {
            likesMap[item.memorial_id] =
              (likesMap[item.memorial_id] ?? 0) +
              1;
          });

          setLikes(likesMap);
        }
      } else {
        setLikes({});
      }
    } catch (err) {
      console.error(
        "MEMORYUA MEMORIALS EXCEPTION:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Невідома помилка."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // ПОШУК
  // =========================================

  const cleanSearch =
    search.trim().toLowerCase();

  // =========================================
  // СПИСОК РОКІВ
  // =========================================

  const availableYears = useMemo(() => {
    const years = new Set<number>();

    memorials.forEach((memorial) => {
      if (memorial.birth_date) {
        const year = Number(
          memorial.birth_date.slice(0, 4)
        );

        if (year) {
          years.add(year);
        }
      }

      if (memorial.death_date) {
        const year = Number(
          memorial.death_date.slice(0, 4)
        );

        if (year) {
          years.add(year);
        }
      }
    });

    return Array.from(years).sort(
      (a, b) => b - a
    );
  }, [memorials]);

  // =========================================
  // ФІЛЬТРАЦІЯ + СОРТУВАННЯ
  // =========================================

  const filteredMemorials = useMemo(() => {
    let result = memorials.filter(
      (memorial) => {
        // Пошук за ім'ям
        const matchesSearch =
          memorial.name
            .toLowerCase()
            .includes(cleanSearch);

        // Фільтр за роком
        let matchesYear = true;

        if (selectedYear !== "all") {
          const year = Number(
            selectedYear
          );

          const birthYear =
            memorial.birth_date
              ? Number(
                  memorial.birth_date.slice(
                    0,
                    4
                  )
                )
              : null;

          const deathYear =
            memorial.death_date
              ? Number(
                  memorial.death_date.slice(
                    0,
                    4
                  )
                )
              : null;

          matchesYear =
            birthYear === year ||
            deathYear === year;
        }

        return (
          matchesSearch &&
          matchesYear
        );
      }
    );

    // Сортування
    result = [...result].sort(
      (a, b) => {
        if (sortBy === "name_asc") {
          return a.name.localeCompare(
            b.name,
            "uk"
          );
        }

        if (sortBy === "name_desc") {
          return b.name.localeCompare(
            a.name,
            "uk"
          );
        }

        if (sortBy === "oldest") {
          const dateA = a.created_at
            ? new Date(
                a.created_at
              ).getTime()
            : 0;

          const dateB = b.created_at
            ? new Date(
                b.created_at
              ).getTime()
            : 0;

          return dateA - dateB;
        }

        // newest
        const dateA = a.created_at
          ? new Date(
              a.created_at
            ).getTime()
          : 0;

        const dateB = b.created_at
          ? new Date(
              b.created_at
            ).getTime()
          : 0;

        return dateB - dateA;
      }
    );

    return result;
  }, [
    memorials,
    cleanSearch,
    selectedYear,
    sortBy,
  ]);

  // =========================================
  // ДАТИ
  // =========================================

  const formatDate = (
    date: string | null
  ) => {
    if (!date) return "";

    const parsed = new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
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

  // =========================================
  // ВІДКРИТИ МЕМОРІАЛ
  // =========================================

  const openMemorial = (
    id: string
  ) => {
    router.push(
      `/memorial/${id}`
    );
  };

  // =========================================
  // ОЧИСТИТИ ФІЛЬТРИ
  // =========================================

  const clearFilters = () => {
    setSearch("");
    setSelectedYear("all");
    setSortBy("newest");
  };

  const hasFilters =
    search.trim() !== "" ||
    selectedYear !== "all" ||
    sortBy !== "newest";

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">

      {/* =====================================
          HEADER
      ===================================== */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5">

          <button
            type="button"
            onClick={() => {
              router.push("/");
            }}
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
            onClick={() => {
              router.push("/");
            }}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            🕯️ Створити меморіал
          </button>

        </div>
      </header>

      {/* =====================================
          ОСНОВНА ЧАСТИНА
      ===================================== */}

      <section className="px-4 py-10 md:py-16">
        <div className="mx-auto max-w-6xl">

          {/* ЗАГОЛОВОК */}

          <div className="mx-auto max-w-3xl text-center">

            <div className="text-5xl">
              📖
            </div>

            <div className="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
              MEMORYUA
            </div>

            <h1 className="mt-3 text-4xl font-bold text-slate-900 md:text-5xl">
              Книга пам&apos;яті
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-500">
              Меморіали людей, пам&apos;ять
              про яких ми зберігаємо
              для майбутніх поколінь.
            </p>

          </div>

          {/* =================================
              ПОШУК
          ================================= */}

          <div className="mx-auto mt-10 max-w-3xl">

            <div className="relative">

              <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-xl">
                🔎
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Пошук за ім'ям та прізвищем..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-12 text-sm shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="absolute inset-y-0 right-4 text-slate-400 transition hover:text-slate-700"
                >
                  ✕
                </button>
              )}

            </div>

          </div>

          {/* =================================
              ФІЛЬТРИ
          ================================= */}

          <div className="mx-auto mt-5 max-w-3xl rounded-2xl bg-white p-4 shadow-sm">

            <div className="grid gap-4 md:grid-cols-3">

              {/* РІК */}

              <div>
                <label
                  htmlFor="year"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400"
                >
                  📅 Рік
                </label>

                <select
                  id="year"
                  value={selectedYear}
                  onChange={(event) =>
                    setSelectedYear(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="all">
                    Усі роки
                  </option>

                  {availableYears.map(
                    (year) => (
                      <option
                        key={year}
                        value={year}
                      >
                        {year}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* СОРТУВАННЯ */}

              <div>
                <label
                  htmlFor="sort"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400"
                >
                  ↕️ Сортування
                </label>

                <select
                  id="sort"
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(
                      event.target.value as SortOption
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="newest">
                    Новіші спочатку
                  </option>

                  <option value="oldest">
                    Старіші спочатку
                  </option>

                  <option value="name_asc">
                    Ім&apos;я А–Я
                  </option>

                  <option value="name_desc">
                    Ім&apos;я Я–А
                  </option>
                </select>
              </div>

              {/* ОЧИСТИТИ */}

              <div className="flex items-end">

                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasFilters}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ✕ Очистити фільтри
                </button>

              </div>

            </div>

            {!loading && (
              <div className="mt-4 border-t border-slate-100 pt-4 text-center text-xs text-slate-400">
                {cleanSearch ||
                selectedYear !== "all"
                  ? `Знайдено меморіалів: ${filteredMemorials.length}`
                  : `Усього меморіалів: ${memorials.length}`}
              </div>
            )}

          </div>

          {/* =================================
              ПОМИЛКА
          ================================= */}

          {error && (
            <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-5 text-center">

              <div className="text-3xl">
                ⚠️
              </div>

              <h2 className="mt-2 font-semibold text-red-800">
                Не вдалося завантажити
                меморіали
              </h2>

              <p className="mt-2 break-words text-sm text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={loadMemorials}
                className="mt-4 rounded-xl bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Спробувати ще раз
              </button>

            </div>
          )}

          {/* =================================
              LOADING
          ================================= */}

          {loading && (
            <div className="py-20 text-center">

              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />

              <p className="mt-4 text-sm text-slate-500">
                Завантаження Книги
                пам&apos;яті...
              </p>

            </div>
          )}

          {/* =================================
              НЕМАЄ МЕМОРІАЛІВ
          ================================= */}

          {!loading &&
            !error &&
            memorials.length === 0 && (
              <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">

                <div className="text-6xl">
                  🕯️
                </div>

                <h2 className="mt-5 text-2xl font-bold text-slate-900">
                  Книга пам&apos;яті поки
                  порожня
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Створіть перший цифровий
                  меморіал MEMORYUA.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/")
                  }
                  className="mt-6 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  🕯️ Створити меморіал
                </button>

              </div>
            )}

          {/* =================================
              НЕ ЗНАЙДЕНО
          ================================= */}

          {!loading &&
            !error &&
            memorials.length > 0 &&
            filteredMemorials.length ===
              0 && (
              <div className="mx-auto mt-12 max-w-2xl rounded-3xl bg-white p-12 text-center shadow-sm">

                <div className="text-5xl">
                  🔎
                </div>

                <h2 className="mt-5 text-2xl font-bold text-slate-900">
                  Нічого не знайдено
                </h2>

                <p className="mt-3 text-sm text-slate-500">
                  Спробуйте змінити ім&apos;я
                  або вибрати інший рік.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
                >
                  Очистити фільтри
                </button>

              </div>
            )}

          {/* =================================
              КАРТКИ МЕМОРІАЛІВ
          ================================= */}

          {!loading &&
            !error &&
            filteredMemorials.length >
              0 && (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

                {filteredMemorials.map(
                  (memorial) => (
                    <article
                      key={memorial.id}
                      className="group overflow-hidden rounded-3xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >

                      {/* ФОТО */}

                      <button
                        type="button"
                        onClick={() =>
                          openMemorial(
                            memorial.id
                          )
                        }
                        className="block w-full text-left"
                      >

                        {memorial.photo_url ? (
                          <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                            <img
                              src={
                                memorial.photo_url
                              }
                              alt={
                                memorial.name
                              }
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          </div>
                        ) : (
                          <div className="flex aspect-[4/3] items-center justify-center bg-slate-100">

                            <div className="text-center">

                              <div className="text-6xl">
                                🕯️
                              </div>

                              <div className="mt-2 text-xs text-slate-400">
                                Світла пам&apos;ять
                              </div>

                            </div>

                          </div>
                        )}

                      </button>

                      {/* ІНФОРМАЦІЯ */}

                      <div className="p-6">

                        <button
                          type="button"
                          onClick={() =>
                            openMemorial(
                              memorial.id
                            )
                          }
                          className="text-left"
                        >

                          <h2 className="text-xl font-bold text-slate-900 transition group-hover:text-slate-600">
                            {memorial.name}
                          </h2>

                        </button>

                        {/* ДАТИ */}

                        {(memorial.birth_date ||
                          memorial.death_date) && (
                          <div className="mt-2 text-sm text-slate-500">

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

                          </div>
                        )}

                        {/* ІСТОРІЯ */}

                        {memorial.story && (
                          <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
                            {
                              memorial.story
                            }
                          </p>
                        )}

                        {/* НИЖНЯ ЧАСТИНА */}

                        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

                          <div className="text-sm text-slate-500">
                            ❤️{" "}
                            <span className="font-semibold text-slate-800">
                              {likes[
                                memorial.id
                              ] ?? 0}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              openMemorial(
                                memorial.id
                              )
                            }
                            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
                          >
                            Відкрити →
                          </button>

                        </div>

                      </div>

                    </article>
                  )
                )}

              </div>
            )}

          {/* =================================
              НИЖНІЙ БЛОК
          ================================= */}

          {!loading &&
            memorials.length > 0 && (
              <div className="mx-auto mt-14 max-w-3xl rounded-3xl bg-white p-8 text-center shadow-sm md:p-10">

                <div className="text-4xl">
                  🕯️
                </div>

                <h2 className="mt-4 text-2xl font-bold text-slate-900">
                  Збережімо пам&apos;ять разом
                </h2>

                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                  Створіть цифровий меморіал,
                  щоб історія близької людини
                  залишилася доступною для
                  майбутніх поколінь.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/")
                  }
                  className="mt-6 rounded-xl bg-slate-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  🕯️ Створити меморіал
                </button>

              </div>
            )}

        </div>
      </section>

      {/* =====================================
          FOOTER
      ===================================== */}

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
          🕯️ Створити меморіал
        </button>

      </footer>

    </main>
  );
}