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
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 text-center">
            <div className="text-2xl font-bold tracking-[0.25em] text-slate-900">
              MEMORYUA
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Цифрова памʼять для майбутніх поколінь
            </p>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Вхід
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Увійдіть до свого облікового запису MEMORYUA.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Пароль
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введіть пароль"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
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
              className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Входимо..." : "Увійти"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Ще немає акаунта?
          </div>

          <button
            type="button"
            onClick={() => router.push("/register")}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Створити акаунт
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-3 w-full text-sm text-slate-500 hover:text-slate-900"
          >
            ← Повернутися на головну
          </button>
        </div>
      </div>
    </main>
  );
}