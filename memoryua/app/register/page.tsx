"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Введіть електронну пошту.");
      return;
    }

    if (!password) {
      setError("Введіть пароль.");
      return;
    }

    if (password.length < 6) {
      setError("Пароль повинен містити щонайменше 6 символів.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Паролі не збігаються.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (data.session) {
        router.push("/");
        router.refresh();
        return;
      }

      setSuccess(
        "Реєстрацію успішно створено! Перевірте електронну пошту та підтвердьте email."
      );

      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("MEMORYUA REGISTER ERROR:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Не вдалося створити акаунт.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-5">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-xl font-bold tracking-wide hover:text-slate-600"
          >
            MEMORYUA
          </button>

          <p className="mt-1 text-sm text-slate-500">
            Цифрова пам&apos;ять для майбутніх поколінь
          </p>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
              MEMORYUA
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-800">
              Реєстрація
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              Створіть акаунт для керування вашими меморіалами.
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {/* EMAIL */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Електронна пошта
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Пароль
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введіть пароль"
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />

              <p className="mt-2 text-xs text-slate-400">
                Мінімум 6 символів.
              </p>
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Повторіть пароль
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторіть пароль"
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {/* REGISTER BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-800 px-5 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Створюємо акаунт..." : "Зареєструватися"}
            </button>
          </form>

          {/* LINKS */}
          <div className="mt-6 space-y-3 text-center">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-sm font-medium text-slate-600 underline-offset-4 hover:underline"
            >
              Вже маєте акаунт? Увійти
            </button>

            <br />

            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-sm text-slate-400 hover:text-slate-600"
            >
              ← Повернутися на головну
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="pb-8 text-center">
        <p className="text-xs text-slate-400">
          MEMORYUA — цифрова пам&apos;ять для майбутніх поколінь
        </p>
      </footer>
    </main>
  );
}