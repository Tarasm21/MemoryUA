"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "tarasmb24@gmail.com";

type Memorial = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  is_blocked: boolean;
};

type Stats = {
  memorials: number;
  users: number;
  archive: number;
  candles: number;
  likes: number;
  messages: number;
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [filteredMemorials, setFilteredMemorials] = useState<Memorial[]>([]);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<Stats>({
    memorials: 0,
    users: 0,
    archive: 0,
    candles: 0,
    likes: 0,
    messages: 0,
  });
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      setFilteredMemorials(memorials);
      return;
    }

    const filtered = memorials.filter((memorial) => {
      return (
        memorial.name?.toLowerCase().includes(query) ||
        memorial.id.toLowerCase().includes(query) ||
        memorial.user_id.toLowerCase().includes(query)
      );
    });

    setFilteredMemorials(filtered);
  }, [search, memorials]);

  async function checkAdmin() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAuthorized(false);
        setError("Ви не авторизовані.");
        setLoading(false);
        return;
      }

      if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        setAuthorized(false);
        setError("Доступ заборонено.");
        setLoading(false);
        return;
      }

      setAuthorized(true);

      await loadData();
    } catch (err) {
      console.error(err);
      setError("Помилка завантаження адмін-панелі.");
    } finally {
      setLoading(false);
    }
  }

  async function loadData() {
    setError("");

    const [
      memorialsResult,
      usersResult,
      archiveResult,
      candlesResult,
      likesResult,
      messagesResult,
    ] = await Promise.all([
      supabase
        .from("memorials")
        .select("id,user_id,name,created_at,is_blocked")
        .order("created_at", { ascending: false }),

      supabase
        .from("memorials")
        .select("user_id"),

      supabase
        .from("memorial_archive")
        .select("id", { count: "exact", head: true }),

      supabase
        .from("memorial_candles")
        .select("id", { count: "exact", head: true }),

      supabase
        .from("memorial_likes")
        .select("id", { count: "exact", head: true }),

      supabase
        .from("memorial_messages")
        .select("id", { count: "exact", head: true }),
    ]);

    if (memorialsResult.error) {
      console.error(memorialsResult.error);
      setError(memorialsResult.error.message);
      return;
    }

    const memorialData = (memorialsResult.data || []) as Memorial[];

    setMemorials(memorialData);
    setFilteredMemorials(memorialData);

    const uniqueUsers = new Set(
      (usersResult.data || []).map((item: any) => item.user_id)
    );

    setStats({
      memorials: memorialData.length,
      users: uniqueUsers.size,
      archive: archiveResult.count || 0,
      candles: candlesResult.count || 0,
      likes: likesResult.count || 0,
      messages: messagesResult.count || 0,
    });
  }

  async function toggleBlock(memorial: Memorial) {
    const newBlockedState = !memorial.is_blocked;

    const confirmed = window.confirm(
      newBlockedState
        ? `Заблокувати меморіал "${memorial.name}"?`
        : `Розблокувати меморіал "${memorial.name}"?`
    );

    if (!confirmed) return;

    try {
      setBusyId(memorial.id);
      setError("");

      const { error } = await supabase
        .from("memorials")
        .update({
          is_blocked: newBlockedState,
        })
        .eq("id", memorial.id);

      if (error) {
        console.error(error);
        setError(error.message);
        return;
      }

      setMemorials((current) =>
        current.map((item) =>
          item.id === memorial.id
            ? {
                ...item,
                is_blocked: newBlockedState,
              }
            : item
        )
      );
    } catch (err) {
      console.error(err);
      setError("Не вдалося змінити статус меморіалу.");
    } finally {
      setBusyId(null);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-semibold">
          Завантаження адмін-панелі...
        </div>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🔒</div>

          <h1 className="text-2xl font-bold mb-3">
            Доступ заборонено
          </h1>

          <p className="text-gray-600 mb-6">
            Ця сторінка доступна тільки адміністратору MEMORYUA.
          </p>

          {error && (
            <div className="bg-red-50 text-red-700 rounded-xl p-3 mb-5">
              {error}
            </div>
          )}

          <button
            onClick={() => (window.location.href = "/")}
            className="bg-black text-white px-6 py-3 rounded-xl"
          >
            На сайт
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">
              МЕМОРІА
            </div>

            <h1 className="text-2xl font-bold">
              Панель адміністратора
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => (window.location.href = "/")}
              className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50"
            >
              На сайті
            </button>

            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800"
            >
              Вийти
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ADMIN INFO */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="text-sm text-gray-500 mb-1">
            АДМІНІСТРАТОР
          </div>

          <div className="text-xl font-bold">
            Адмін-панель MEMORYUA
          </div>

          <div className="text-gray-600 mt-1">
            Керування цифровими меморіалами, системами статистики та контролю.
          </div>

          <div className="mt-4 flex items-center gap-2 text-green-700">
            <span>●</span>
            <span>Адміністратор авторизований</span>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          <StatCard
            icon="🕯️"
            number={stats.memorials}
            title="Меморіали"
          />

          <StatCard
            icon="👤"
            number={stats.users}
            title="Користувачі"
          />

          <StatCard
            icon="📁"
            number={stats.archive}
            title="Файли архіву"
          />

          <StatCard
            icon="🕯️"
            number={stats.candles}
            title="Запалені свічки"
          />

          <StatCard
            icon="❤️"
            number={stats.likes}
            title="Підтримка пам'яті"
          />

          <StatCard
            icon="📖"
            number={stats.messages}
            title="Записи в Книзі"
          />
        </div>

        {/* DATABASE */}
        <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  База MEMORYUA
                </h2>

                <p className="text-gray-500 mt-1">
                  Керування меморіалами
                </p>
              </div>

              <button
                onClick={loadData}
                className="px-4 py-2 rounded-xl border hover:bg-gray-50"
              >
                🔄 Оновити
              </button>
            </div>

            {/* SEARCH */}
            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔎 Пошук меморіалу
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Введіть ім'я або ID меморіалу..."
                className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
              />

              {search && (
                <div className="text-sm text-gray-500 mt-2">
                  Знайдено: {filteredMemorials.length}
                </div>
              )}
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-500">
                  <th className="px-6 py-4">
                    Ім'я
                  </th>

                  <th className="px-6 py-4">
                    Власник
                  </th>

                  <th className="px-6 py-4">
                    Дата
                  </th>

                  <th className="px-6 py-4">
                    Статус
                  </th>

                  <th className="px-6 py-4">
                    Дія
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredMemorials.map((memorial) => (
                  <tr
                    key={memorial.id}
                    className={
                      memorial.is_blocked
                        ? "bg-red-50"
                        : "hover:bg-gray-50"
                    }
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold">
                        {memorial.name}
                      </div>

                      <div className="text-xs text-gray-400 mt-1">
                        {memorial.id}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">
                        👤 Власник
                      </div>

                      <div className="text-xs text-gray-400 mt-1 break-all max-w-xs">
                        {memorial.user_id}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(
                        memorial.created_at
                      ).toLocaleDateString("uk-UA")}
                    </td>

                    <td className="px-6 py-4">
                      {memorial.is_blocked ? (
                        <span className="inline-flex px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                          🔒 Заблокований
                        </span>
                      ) : (
                        <span className="inline-flex px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                          🟢 Активний
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            (window.location.href = `/memorial/${memorial.id}`)
                          }
                          className="px-3 py-2 rounded-lg bg-black text-white text-sm hover:bg-gray-800"
                        >
                          👁️ Відкрити
                        </button>

                        <button
                          disabled={busyId === memorial.id}
                          onClick={() => toggleBlock(memorial)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
                            memorial.is_blocked
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-red-600 text-white hover:bg-red-700"
                          }`}
                        >
                          {busyId === memorial.id
                            ? "..."
                            : memorial.is_blocked
                            ? "🔓 Розблокувати"
                            : "🔒 Заблокувати"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredMemorials.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="text-4xl mb-3">
                        🔎
                      </div>

                      Меморіалів не знайдено.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* FOOTER */}
        <div className="text-center text-gray-500 text-sm mt-8 pb-8">
          MEMORYUA — цифрова пам'ять для майбутніх поколінь
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  number,
  title,
}: {
  icon: string;
  number: number;
  title: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="text-3xl mb-3">
        {icon}
      </div>

      <div className="text-3xl font-bold">
        {number}
      </div>

      <div className="text-gray-500 mt-1">
        {title}
      </div>
    </div>
  );
}