"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [story, setStory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Введіть ім’я та прізвище.");
      return;
    }

    if (birthDate && deathDate && birthDate > deathDate) {
      setError("Дата народження не може бути пізнішою за дату смерті.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/memorials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          birthDate,
          deathDate,
          story: story.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Не вдалося створити меморіал."
        );
      }

      const memorialId = data.id || data.memorial?.id;

      if (!memorialId) {
        throw new Error("Меморіал створено, але сервер не повернув його ID.");
      }

      router.push(`/memorial/${memorialId}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Сталася помилка. Спробуйте ще раз."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f3ee] text-[#252820]">
      {/* ШАПКА САЙТУ */}
      <header className="relative z-10 border-b border-white/20 bg-[#182019] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <a href="/" className="text-2xl font-bold tracking-[0.18em]">
            MEMORYUA
          </a>

          <nav className="flex flex-wrap items-center gap-5 text-sm text-white/85">
            <a href="/my-memorials" className="transition hover:text-white">
              Мої меморіали
            </a>
            <a href="/pricing" className="transition hover:text-white">
              Тарифи
            </a>
            <a href="/memorials" className="transition hover:text-white">
              Книга пам’яті
            </a>
            <a
              href="/login"
              className="rounded-full border border-white/40 px-5 py-2 transition hover:bg-white/10"
            >
              Увійти
            </a>
          </nav>
        </div>
      </header>

      {/* ГОЛОВНИЙ ЕКРАН І ФОНОВЕ ЗОБРАЖЕННЯ */}
      <section
        className="relative isolate overflow-hidden bg-cover bg-center bg-no-repeat px-5 py-20 md:py-32"
        style={{
  backgroundImage:
    "linear-gradient(rgba(10,15,18,0.25), rgba(10,15,18,0.45)), url('/memoryua-background.png')",
  backgroundSize: "cover",
  backgroundPosition: "center center",
  backgroundRepeat: "no-repeat",
}}
      >
        <div className="relative mx-auto max-w-5xl text-center text-white">
          <p className="mb-6 text-sm font-medium uppercase tracking-[0.32em] text-white/80 md:text-base">
            Цифрова пам’ять для майбутніх поколінь
          </p>

          <h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
            Пам’ять, яка залишається назавжди
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-white/85 md:text-lg">
            Створіть цифровий меморіал близької людини, збережіть її історію,
            фотографії та спогади. Поділіться пам’яттю за допомогою QR-коду.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <a
              href="#create-memorial"
              className="rounded-full bg-[#e9dfc8] px-8 py-3.5 font-semibold text-[#292c23] shadow-lg transition hover:bg-white"
            >
              Створити меморіал
            </a>

            <a
              href="/memorials"
              className="rounded-full border border-white/60 bg-black/20 px-8 py-3.5 font-medium text-white transition hover:bg-white/15"
            >
              Книга пам’яті
            </a>
          </div>
        </div>
      </section>

      {/* ФОРМА СТВОРЕННЯ МЕМОРІАЛУ */}
      <section id="create-memorial" className="px-5 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#77735f]">
              Збережіть історію
            </p>

            <h2 className="text-3xl font-semibold md:text-4xl">
              Створити меморіал
            </h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-[#69695f]">
              Заповніть основну інформацію, щоб створити персональну сторінку
              пам’яті.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[#e3dfd3] bg-white p-6 shadow-sm md:p-9"
          >
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium"
                >
                  Ім’я та прізвище *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введіть ім’я та прізвище"
                  required
                  className="w-full rounded-xl border border-[#d8d5ca] bg-[#fdfcf9] px-4 py-3 outline-none transition focus:border-[#777d66] focus:ring-2 focus:ring-[#777d66]/15"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="birthDate"
                    className="mb-2 block text-sm font-medium"
                  >
                    Дата народження
                  </label>
                  <input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full rounded-xl border border-[#d8d5ca] bg-[#fdfcf9] px-4 py-3 outline-none transition focus:border-[#777d66] focus:ring-2 focus:ring-[#777d66]/15"
                  />
                </div>

                <div>
                  <label
                    htmlFor="deathDate"
                    className="mb-2 block text-sm font-medium"
                  >
                    Дата смерті
                  </label>
                  <input
                    id="deathDate"
                    type="date"
                    value={deathDate}
                    onChange={(e) => setDeathDate(e.target.value)}
                    className="w-full rounded-xl border border-[#d8d5ca] bg-[#fdfcf9] px-4 py-3 outline-none transition focus:border-[#777d66] focus:ring-2 focus:ring-[#777d66]/15"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="story"
                  className="mb-2 block text-sm font-medium"
                >
                  Історія життя та спогади
                </label>
                <textarea
                  id="story"
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Розкажіть про людину, її життя та те, що хочете зберегти для майбутніх поколінь..."
                  rows={6}
                  className="w-full resize-y rounded-xl border border-[#d8d5ca] bg-[#fdfcf9] px-4 py-3 leading-7 outline-none transition focus:border-[#777d66] focus:ring-2 focus:ring-[#777d66]/15"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#343d31] px-6 py-4 font-semibold text-white transition hover:bg-[#252d23] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Створення меморіалу..." : "Створити меморіал"}
              </button>

              <p className="text-center text-xs leading-6 text-[#77766e]">
                Після створення ви зможете перейти на сторінку меморіалу.
              </p>
            </div>
          </form>
        </div>
      </section>

      {/* МОЖЛИВОСТІ MEMORYUA */}
      <section className="border-y border-[#e5e1d7] bg-[#eeece4] px-5 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">
              Пам’ять у кожній деталі
            </h2>
            <p className="mt-4 leading-7 text-[#69695f]">
              Усе важливе про людину — на одній сторінці.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <article className="rounded-2xl border border-[#e1ddd1] bg-white p-7">
              <div className="mb-5 text-3xl" aria-hidden="true">
                ♡
              </div>
              <h3 className="text-xl font-semibold">Історія життя</h3>
              <p className="mt-3 leading-7 text-[#69695f]">
                Збережіть біографію, фотографії та найдорожчі спогади про
                близьку людину.
              </p>
            </article>

            <article className="rounded-2xl border border-[#e1ddd1] bg-white p-7">
              <div className="mb-5 text-3xl" aria-hidden="true">
                ▦
              </div>
              <h3 className="text-xl font-semibold">QR-код пам’яті</h3>
              <p className="mt-3 leading-7 text-[#69695f]">
                Розмістіть QR-код на пам’ятнику, щоб відвідувачі могли
                відкрити цифрову сторінку.
              </p>
            </article>

            <article className="rounded-2xl border border-[#e1ddd1] bg-white p-7">
              <div className="mb-5 text-3xl" aria-hidden="true">
                ♧
              </div>
              <h3 className="text-xl font-semibold">Книга пам’яті</h3>
              <p className="mt-3 leading-7 text-[#69695f]">
                Дайте рідним і друзям можливість залишати слова пам’яті та
                вшановувати людину.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ТАРИФ */}
      <section className="px-5 py-16 md:py-20">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#dfd8c7] bg-white p-8 text-center shadow-sm md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#77735f]">
            MEMORYUA
          </p>

          <h2 className="mt-4 text-3xl font-semibold">
            Збережіть пам’ять для поколінь
          </h2>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-[#69695f]">
            Створіть цифрову сторінку, до якої рідні зможуть повертатися,
            згадуючи найдорожчі моменти життя.
          </p>

          <a
            href="/pricing"
            className="mt-7 inline-flex rounded-full bg-[#343d31] px-8 py-3.5 font-semibold text-white transition hover:bg-[#252d23]"
          >
            Переглянути тарифи
          </a>
        </div>
      </section>

      {/* ФУТЕР */}
      <footer className="bg-[#182019] px-5 py-8 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div>
            <a href="/" className="font-bold tracking-[0.18em]">
              MEMORYUA
            </a>
            <p className="mt-2 text-sm text-white/65">
              Цифрова пам’ять для майбутніх поколінь
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-5 text-sm text-white/75">
            <a href="/memorials" className="hover:text-white">
              Книга пам’яті
            </a>
            <a href="/pricing" className="hover:text-white">
              Тарифи
            </a>
            <a href="/login" className="hover:text-white">
              Увійти
            </a>
          </div>
        </div>

        <div className="mx-auto mt-7 max-w-7xl border-t border-white/15 pt-5 text-center text-xs text-white/50">
          © {new Date().getFullYear()} MEMORYUA. Усі права захищені.
        </div>
      </footer>
    </main>
  );
}