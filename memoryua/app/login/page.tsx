"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Введіть email та пароль.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      console.error(error);
      setError("Не вдалося увійти. Перевірте email та пароль.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-2xl font-bold tracking-wide"
          >
            MEMORYUA
          </button>

          <p className="mt-1 text-sm text-slate-500">
            Цифрова пам'ять для майбутніх поколінь
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-md px-6 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

          <div className="mb-8 text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-slate-400">
              MEMORYUA
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Вхід
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              Увійдіть до свого акаунта MEMORYUA.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Пароль
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введіть пароль"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 py-4 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Входимо..." : "Увійти"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full rounded-xl border border-slate-300 py-3 font-semibold text-slate-700"
            >
              Повернутися на головну
            </button>

          </form>
        </div>
      </div>
    </main>
  );
}
