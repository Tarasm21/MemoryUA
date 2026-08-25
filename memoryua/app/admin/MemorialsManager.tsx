"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Memorial = {
  id: string;
  user_id: string;
  name: string;
  birth_date: string | null;
  death_date: string | null;
  plan: string | null;
  created_at: string | null;
};

export default function MemorialsManager() {
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadMemorials = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data,
        error: loadError,
      } = await supabase
        .from("memorials")
        .select(
          "id, user_id, name, birth_date, death_date, plan, created_at"
        )
        .order("created_at", {
          ascending: false,
        });

      if (loadError) {
        console.error(
          "MEMORYUA ADMIN MEMORIALS LOAD ERROR:",
          loadError
        );

        setError(
          loadError.message ||
            "Не вдалося завантажити меморіали."
        );

        return;
      }

      setMemorials(
        (data ?? []) as Memorial[]
      );
    } catch (err) {
      console.error(
        "MEMORYUA ADMIN MEMORIALS ERROR:",
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

  useEffect(() => {
    loadMemorials();
  }, []);

  const formatDate = (
    date: string | null
  ) => {
    if (!date) return "—";

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

  const formatCreatedDate = (
    date: string | null
  ) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
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

  const deleteMemorial = async (
    memorial: Memorial
  ) => {
    const confirmed =
      window.confirm(
        `Ви впевнені, що хочете видалити меморіал "${memorial.name}"?`
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(memorial.id);
    setError("");

    try {
      const {
        error: deleteError,
      } = await supabase
        .from("memorials")
        .delete()
        .eq("id", memorial.id);

      if (deleteError) {
        console.error(
          "MEMORYUA ADMIN MEMORIAL DELETE ERROR:",
          deleteError
        );

        setError(
          deleteError.message ||
            "Не вдалося видалити меморіал."
        );

        return;
      }

      setMemorials((current) =>
        current.filter(
          (item) =>
            item.id !== memorial.id
        )
      );
    } catch (err) {
      console.error(
        "MEMORYUA ADMIN DELETE EXCEPTION:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Невідома помилка видалення."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filteredMemorials =
    memorials.filter((memorial) => {
      const value =
        search.trim().toLowerCase();

      if (!value) {
        return true;
      }

      return (
        memorial.name
          .toLowerCase()
          .includes(value) ||
        memorial.user_id
          .toLowerCase()
          .includes(value) ||
        memorial.id
          .toLowerCase()
          .includes(value) ||
        (memorial.plan ?? "")
          .toLowerCase()
          .includes(value)
      );
    });

  return (
    <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm md:p-8">
      {/* HEADER */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Керування
          </div>

          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            🕯️ Меморіали
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Усі меморіали, створені в
            MEMORYUA.
          </p>
        </div>

        <div className="w-full lg:max-w-sm">
          <label
            htmlFor="memorial-search"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            Пошук
          </label>

          <input
            id="memorial-search"
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Ім'я, ID або тариф..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="font-semibold">
            Помилка
          </div>

          <div className="mt-1 break-words">
            {error}
          </div>
        </div>
      )}

      {/* LOADING */}

      {loading ? (
        <div className="mt-8 rounded-2xl bg-slate-50 p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />

          <p className="mt-3 text-sm text-slate-500">
            Завантаження меморіалів...
          </p>
        </div>
      ) : (
        <>
          {/* COUNT */}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500">
              Знайдено:{" "}
              <span className="font-semibold text-slate-800">
                {filteredMemorials.length}
              </span>
            </div>

            <button
              type="button"
              onClick={loadMemorials}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              🔄 Оновити
            </button>
          </div>

          {/* EMPTY */}

          {filteredMemorials.length ===
          0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <div className="text-5xl">
                🕯️
              </div>

              <p className="mt-4 font-medium text-slate-700">
                {search.trim()
                  ? "Меморіалів за вашим пошуком не знайдено."
                  : "Меморіалів поки немає."}
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}

              <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Меморіал
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Дати
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Тариф
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Створено
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Дії
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredMemorials.map(
                      (memorial) => (
                        <tr
                          key={memorial.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900">
                              {memorial.name}
                            </div>

                            <div className="mt-1 max-w-[300px] truncate text-xs text-slate-400">
                              ID:{" "}
                              {memorial.id}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {formatDate(
                              memorial.birth_date
                            )}{" "}
                            —{" "}
                            {formatDate(
                              memorial.death_date
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                              {memorial.plan ||
                                "Не вказано"}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {formatCreatedDate(
                              memorial.created_at
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  window.location.href =
                                    `/memorial/${memorial.id}`;
                                }}
                                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-700"
                              >
                                👁️
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  window.location.href =
                                    `/memorial/${memorial.id}/edit`;
                                }}
                                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700"
                              >
                                ✏️
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteMemorial(
                                    memorial
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  memorial.id
                                }
                                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingId ===
                                memorial.id
                                  ? "..."
                                  : "🗑️"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}

              <div className="mt-6 space-y-4 md:hidden">
                {filteredMemorials.map(
                  (memorial) => (
                    <div
                      key={memorial.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-bold text-slate-900">
                            {memorial.name}
                          </h3>

                          <div className="mt-1 break-all text-xs text-slate-400">
                            ID:{" "}
                            {memorial.id}
                          </div>
                        </div>

                        <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                          {memorial.plan ||
                            "—"}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4">
                        <div>
                          <div className="text-xs text-slate-400">
                            Народження
                          </div>

                          <div className="mt-1 text-sm font-medium text-slate-700">
                            {formatDate(
                              memorial.birth_date
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-slate-400">
                            Смерть
                          </div>

                          <div className="mt-1 text-sm font-medium text-slate-700">
                            {formatDate(
                              memorial.death_date
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-slate-400">
                        Створено:{" "}
                        {formatCreatedDate(
                          memorial.created_at
                        )}
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            window.location.href =
                              `/memorial/${memorial.id}`;
                          }}
                          className="rounded-xl bg-slate-900 px-3 py-3 text-xs font-medium text-white transition hover:bg-slate-700"
                        >
                          👁️ Перегляд
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            window.location.href =
                              `/memorial/${memorial.id}/edit`;
                          }}
                          className="rounded-xl bg-blue-600 px-3 py-3 text-xs font-medium text-white transition hover:bg-blue-700"
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
                          disabled={
                            deletingId ===
                            memorial.id
                          }
                          className="rounded-xl bg-red-600 px-3 py-3 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId ===
                          memorial.id
                            ? "..."
                            : "🗑️ Видалити"}
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}