"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Memorial = {
  id: string;
  name: string;
  birthDate: string;
  deathDate: string;
  story: string;
  createdAt: string;
};

export default function HomePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [story, setStory] = useState("");

  function createMemorial(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim()) {
      alert("Будь ласка, введіть ім’я людини.");
      return;
    }

    const id = crypto.randomUUID();

    const memorial: Memorial = {
      id,
      name: name.trim(),
      birthDate,
      deathDate,
      story: story.trim(),
      createdAt: new Date().toISOString(),
    };

    // Зберігаємо меморіал у браузері
    localStorage.setItem(
      `memoryua-${id}`,
      JSON.stringify(memorial)
    );

    console.log("MEMORYUA SAVED:", memorial);
    console.log("MEMORYUA KEY:", `memoryua-${id}`);

    // Переходимо на сторінку створеного меморіалу
    router.push(`/memorial/${id}`);
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-5">
          <div className="text-xl font-semibold text-slate-700">
            MEMORYUA
          </div>

          <div className="mt-1 text-sm text-slate-500">
            Цифрова пам'ять для майбутніх поколінь
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-6 py-10 text-center">
            <div className="mb-6 text-6xl">🕊️</div>

            <h1 className="text-3xl font-semibold text-slate-800 md:text-4xl">
              MEMORYUA
            </h1>

            <p className="mt-4 text-lg text-slate-500">
              Цифрова пам’ять, яка залишається назавжди
            </p>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Створіть меморіальну сторінку людини,
              збережіть її історію, дати життя та важливі спогади.
            </p>
          </div>

          <div className="border-t border-slate-100" />

          <form onSubmit={createMemorial} className="px-6 py-8">
            <h2 className="mb-6 text-2xl font-semibold text-slate-700">
              Створити меморіал
            </h2>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Ім’я та прізвище
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Наприклад: Іван Петренко"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Дата народження
                  </label>

                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Дата смерті
                  </label>

                  <input
                    type="date"
                    value={deathDate}
                    onChange={(e) => setDeathDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Історія життя
                </label>

                <textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Напишіть історію життя, спогади, важливі моменти..."
                  rows={8}
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-slate-800 px-6 py-4 font-semibold text-white transition hover:bg-slate-700"
              >
                Створити меморіал
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            MEMORYUA — пам’ять, яка залишається.
          </p>
        </div>
      </section>
    </main>
  );
}