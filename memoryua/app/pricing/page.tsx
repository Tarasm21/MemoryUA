"use client";

import { useRouter } from "next/navigation";

export default function PricingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-left"
          >
            <div className="text-xl font-bold tracking-[0.18em] text-slate-900">
              MEMORYUA
            </div>

            <div className="mt-1 text-xs text-slate-500">
              Цифрова пам&apos;ять для майбутніх поколінь
            </div>
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push("/my-memorials")}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              🕯️ Мої меморіали
            </button>

            <button
              type="button"
              onClick={() => router.push("/memorials")}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              📖 Книга пам&apos;яті
            </button>
          </div>
        </div>
      </header>

      <section className="px-4 py-12 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <div className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
              MEMORYUA
            </div>

            <h1 className="mt-4 text-4xl font-bold text-slate-900 md:text-5xl">
              Тариф Classic
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-500">
              Збережіть пам&apos;ять про близьку людину
              у цифровому меморіалі MEMORYUA.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-2xl">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

              <div className="bg-slate-900 px-8 py-8 text-center text-white md:px-10">
                <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em]">
                  CLASSIC
                </div>

                <div className="mt-6">
                  <span className="text-5xl font-bold">
                    1999
                  </span>

                  <span className="ml-2 text-lg text-slate-300">
                    грн
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-300">
                  за створення цифрового меморіалу
                </p>
              </div>

              <div className="p-8 md:p-10">
                <h2 className="text-xl font-bold text-slate-900">
                  У Classic входить:
                </h2>

                <div className="mt-6 space-y-5">

                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      ✓
                    </div>

                    <div>
                      <div className="font-semibold text-slate-900">
                        Цифровий меморіал
                      </div>

                      <div className="mt-1 text-sm leading-6 text-slate-500">
                        Окрема сторінка пам&apos;яті для людини.
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      ✓
                    </div>

                    <div>
                      <div className="font-semibold text-slate-900">
                        QR-код
                      </div>

                      <div className="mt-1 text-sm leading-6 text-slate-500">
                        Швидкий перехід безпосередньо до меморіалу.
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      ✓
                    </div>

                    <div>
                      <div className="font-semibold text-slate-900">
                        Фотографії
                      </div>

                      <div className="mt-1 text-sm leading-6 text-slate-500">
                        Можливість зберігати фотографії пам&apos;яті.
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      ✓
                    </div>

                    <div>
                      <div className="font-semibold text-slate-900">
                        Архів пам&apos;яті
                      </div>

                      <div className="mt-1 text-sm leading-6 text-slate-500">
                        Збереження важливих матеріалів та документів.
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      ✓
                    </div>

                    <div>
                      <div className="font-semibold text-slate-900">
                        Історія життя
                      </div>

                      <div className="mt-1 text-sm leading-6 text-slate-500">
                        Історія, спогади та теплі слова пам&apos;яті.
                      </div>
                    </div>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="mt-10 w-full rounded-xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  🕯️ Створити меморіал за 1999 грн
                </button>

                <p className="mt-4 text-center text-xs leading-5 text-slate-400">
                  Оплата буде підключена на наступному етапі.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-sm font-medium text-slate-500 underline underline-offset-4 hover:text-slate-900"
            >
              ← Повернутися на головну
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-10 text-center">
        <div className="text-sm font-bold tracking-[0.2em] text-slate-800">
          MEMORYUA
        </div>

        <p className="mt-2 text-xs text-slate-400">
          Цифрова пам&apos;ять для майбутніх поколінь
        </p>
      </footer>
    </main>
  );
}