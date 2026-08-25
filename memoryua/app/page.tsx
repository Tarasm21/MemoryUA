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

  const createMemorial = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!name.trim()) {
      alert("Введіть ім'я людини.");
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
          birth_date: birthDate || null,
          death_date: deathDate || null,
          story: story.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Не вдалося створити меморіал."
        );
      }

      if (!result?.id) {
        throw new Error(
          "Меморіал створено, але ID не отримано."
        );
      }

      router.push(`/memorial/${result.id}`);
    } catch (error) {
      console.error(
        "MEMORYUA CREATE ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Не вдалося створити меморіал."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">

      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5">

          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
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

          {/* ГОЛОВНЕ МЕНЮ */}

          <div className="flex flex-wrap items-center gap-2">

            {/* МОЇ МЕМОРІАЛИ */}

            <button
              type="button"
              onClick={() => {
                router.push("/my-memorials");
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              🕯️ Мої меморіали
            </button>

            {/* ТАРИФИ */}

            <button
              type="button"
              onClick={() => {
                router.push("/pricing");
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              💳 Тарифи
            </button>

            {/* КНИГА ПАМ'ЯТІ */}

            <button
              type="button"
              onClick={() => {
                router.push("/memorials");
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              📖 Книга пам&apos;яті
            </button>

          </div>

        </div>
      </header>

      {/* HERO */}

      <section className="px-4 py-12 md:py-20">
        <div className="mx-auto max-w-6xl">

          <div className="mx-auto max-w-3xl text-center">

            <div className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
              MEMORYUA
            </div>

            <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-900 md:text-6xl">
              Цифрова пам&apos;ять
              <br />
              для майбутніх поколінь
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-500 md:text-lg">
              Створіть цифровий меморіал,
              збережіть історію людини,
              фотографії та теплі слова
              пам&apos;яті.
            </p>

          </div>

          {/* ГОЛОВНІ КНОПКИ */}

          <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">

            <button
              type="button"
              onClick={() => {
                router.push("/memorials");
              }}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              📖 Відкрити Книгу пам&apos;яті
            </button>

            <button
              type="button"
              onClick={() => {
                document
                  .getElementById("create-memorial")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  });
              }}
              className="flex-1 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              🕯️ Створити меморіал
            </button>

          </div>

          {/* ФОРМА СТВОРЕННЯ */}

          <div
            id="create-memorial"
            className="mx-auto mt-12 max-w-3xl rounded-3xl bg-white p-6 shadow-sm md:p-10"
          >

            <div className="text-center">

              <div className="text-4xl">
                🕯️
              </div>

              <h2 className="mt-4 text-2xl font-bold text-slate-900 md:text-3xl">
                Створити цифровий меморіал
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Заповніть основну інформацію
                про людину.
              </p>

            </div>

            <form
              onSubmit={createMemorial}
              className="mt-8"
            >

              {/* ІМ'Я */}

              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Ім&apos;я та прізвище
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Наприклад: Іван Петренко"
                  maxLength={150}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* ДАТИ */}

              <div className="mt-5 grid gap-5 sm:grid-cols-2">

                <div>
                  <label
                    htmlFor="birthDate"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Дата народження
                  </label>

                  <input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(event) =>
                      setBirthDate(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="deathDate"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Дата смерті
                  </label>

                  <input
                    id="deathDate"
                    type="date"
                    value={deathDate}
                    onChange={(event) =>
                      setDeathDate(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

              </div>

              {/* ІСТОРІЯ */}

              <div className="mt-5">

                <label
                  htmlFor="story"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Історія життя
                </label>

                <textarea
                  id="story"
                  value={story}
                  onChange={(event) =>
                    setStory(event.target.value)
                  }
                  placeholder="Напишіть історію життя, спогади або кілька теплих слів..."
                  rows={7}
                  maxLength={5000}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />

                <div className="mt-2 text-right text-xs text-slate-400">
                  {story.length}/5000
                </div>

              </div>

              {/* КНОПКА */}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Створюємо меморіал..."
                  : "🕯️ Створити меморіал"}
              </button>

            </form>

          </div>

          {/* ЯК ЦЕ ПРАЦЮЄ */}

          <div className="mt-12 grid gap-5 md:grid-cols-3">

            <div className="rounded-3xl bg-white p-6 text-center shadow-sm">

              <div className="text-4xl">
                🕯️
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                Цифровий меморіал
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Окрема сторінка пам&apos;яті
                для кожної людини.
              </p>

            </div>

            <div className="rounded-3xl bg-white p-6 text-center shadow-sm">

              <div className="text-4xl">
                📖
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                Книга пам&apos;яті
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Люди можуть залишати
                теплі слова та спогади.
              </p>

            </div>

            <div className="rounded-3xl bg-white p-6 text-center shadow-sm">

              <div className="text-4xl">
                ❤️
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                Пам&apos;ять назавжди
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                QR-код веде безпосередньо
                до сторінки меморіалу.
              </p>

            </div>

          </div>

          {/* CLASSIC */}

          <section
            id="classic"
            className="mx-auto mt-16 max-w-5xl"
          >

            <div className="text-center">

              <div className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
                Тариф MEMORYUA
              </div>

              <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
                Classic
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 md:text-base">
                Повний цифровий меморіал для
                збереження історії, фотографій
                та пам&apos;яті про людину.
              </p>

            </div>

            <div className="mx-auto mt-8 max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">

              <div className="text-center">

                <div className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  CLASSIC
                </div>

                <h3 className="mt-5 text-2xl font-bold text-slate-900">
                  Цифрова пам&apos;ять
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Усе необхідне для створення
                  меморіалу.
                </p>

              </div>

              <div className="mt-8 space-y-4">

                <div className="flex items-start gap-3">
                  <div className="text-lg">✓</div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      Цифровий меморіал
                    </div>
                    <div className="text-sm text-slate-500">
                      Окрема сторінка пам&apos;яті.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="text-lg">✓</div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      QR-код
                    </div>
                    <div className="text-sm text-slate-500">
                      Швидкий перехід до меморіалу.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="text-lg">✓</div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      Основне фото
                    </div>
                    <div className="text-sm text-slate-500">
                      Головна фотографія меморіалу.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="text-lg">✓</div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      Фотогалерея
                    </div>
                    <div className="text-sm text-slate-500">
                      Додаткові фотографії пам&apos;яті.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="text-lg">✓</div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      Архів пам&apos;яті
                    </div>
                    <div className="text-sm text-slate-500">
                      Збереження важливих матеріалів
                      та документів.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="text-lg">✓</div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      Історія життя
                    </div>
                    <div className="text-sm text-slate-500">
                      Історія, спогади та слова пам&apos;яті.
                    </div>
                  </div>
                </div>

              </div>

              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById("create-memorial")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    });
                }}
                className="mt-8 w-full rounded-xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                🕯️ Створити меморіал Classic
              </button>

            </div>

          </section>

          {/* КНИГА ПАМ'ЯТІ */}

          <div className="mx-auto mt-16 max-w-4xl rounded-3xl bg-white p-8 text-center shadow-sm md:p-10">

            <div className="text-5xl">
              📖
            </div>

            <h2 className="mt-4 text-2xl font-bold text-slate-900 md:text-3xl">
              Книга пам&apos;яті MEMORYUA
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500">
              Перегляньте створені меморіали
              та знайдіть людину, пам&apos;ять
              про яку хочете зберегти.
            </p>

            <button
              type="button"
              onClick={() => {
                router.push("/memorials");
              }}
              className="mt-6 rounded-xl bg-slate-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              📖 Перейти до Книги пам&apos;яті
            </button>

          </div>

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

        <div className="mt-5 flex flex-wrap justify-center gap-5">

          <button
            type="button"
            onClick={() => {
              router.push("/my-memorials");
            }}
            className="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900"
          >
            🕯️ Мої меморіали
          </button>

          <button
            type="button"
            onClick={() => {
              router.push("/pricing");
            }}
            className="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900"
          >
            💳 Тарифи
          </button>

          <button
            type="button"
            onClick={() => {
              router.push("/memorials");
            }}
            className="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900"
          >
            📖 Книга пам&apos;яті
          </button>

        </div>

      </footer>

    </main>
  );
}