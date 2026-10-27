"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const features = [
  { number: "01", icon: "◈", title: "Особиста сторінка пам’яті", text: "Ім’я, життєвий шлях, важливі дати та історія людини — зібрані в одному місці." },
  { number: "02", icon: "▧", title: "Фотографії та спогади", text: "Зберігайте світлини й моменти, до яких рідні зможуть повертатися знову." },
  { number: "03", icon: "⌘", title: "QR-код на пам’ятнику", text: "Допомагає відкрити сторінку меморіалу зі смартфона за кілька секунд." },
  { number: "04", icon: "♧", title: "Архів пам’яті", text: "Важливі документи, матеріали та сімейні історії в одному цифровому просторі." },
  { number: "05", icon: "♡", title: "Свічки та слова пам’яті", text: "Можливість вшанувати людину та залишити теплі слова від рідних і друзів." },
  { number: "06", icon: "▤", title: "Книга пам’яті", text: "Зручний простір для пошуку й перегляду опублікованих меморіалів." },
];

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), birthDate, deathDate, story: story.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || "Не вдалося створити меморіал.");
      const memorialId = data.id || data.memorial?.id;
      if (!memorialId) throw new Error("Меморіал створено, але сервер не повернув його ID.");
      router.push(`/memorial/${memorialId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Сталася помилка. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f2e9] text-[#1d2923]">
      <header className="site-header">
        <div className="site-nav">
          <a href="/" className="brand" aria-label="MEMORYUA — головна">
            <span className="brand-mark">✳</span>
            <span><strong>MEMORYUA</strong><small>Цифрова пам’ять назавжди</small></span>
          </a>
          <nav className="nav-links" aria-label="Головна навігація">
            <a href="/memorials">Книга пам’яті</a>
            <a href="#about">Про платформу</a>
            <a href="/pricing">Тарифи</a>
            <a href="/login" className="nav-login">Увійти</a>
            <a href="#create-memorial" className="nav-cta">Створити меморіал <span>↗</span></a>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="hero-image" aria-hidden="true" />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-content">
          <p className="eyebrow"><span /> ЦИФРОВИЙ ПРОСТІР ПАМ’ЯТІ</p>
          <h1>Історії, які<br /><em>живуть вічно.</em></h1>
          <p className="hero-copy">Зберігайте найдорожче — історії життя, фотографії та спогади про тих, хто назавжди залишився у вашому серці.</p>
          <div className="hero-actions">
            <a href="#create-memorial" className="button button-gold">Створити меморіал <span>↗</span></a>
            <a href="/memorials" className="button button-glass"><span className="book-icon">▤</span> Відкрити Книгу пам’яті</a>
          </div>
          <div className="hero-note"><span className="note-icon">✧</span><span>З любов’ю до історій, які мають залишитися.</span></div>
        </div>
        <div className="hero-caption"><span className="caption-line" /> ПАМ’ЯТЬ. ГІДНІСТЬ. СПАДЩИНА.</div>
      </section>

      <section className="intro-strip" id="about">
        <div className="intro-label">MEMORYUA <span> / </span> НАША МІСІЯ</div>
        <p>Кожне життя — це цілий світ.<br /><strong>Допомагаємо зберегти його історію.</strong></p>
        <a href="#features" className="text-link">Дізнатися більше <span>↓</span></a>
      </section>

      <section className="features-section" id="features">
        <div className="section-heading">
          <div><p className="eyebrow dark-eyebrow">УСЕ ВАЖЛИВЕ — В ОДНОМУ МІСЦІ</p><h2>Пам’ять у кожній <em>деталі.</em></h2></div>
          <p className="section-description">Створіть особистий цифровий меморіал, який збереже особистість, історію та спогади для наступних поколінь.</p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <div className="feature-top"><span className="feature-icon">{feature.icon}</span><span className="feature-number">{feature.number}</span></div>
              <h3>{feature.title}</h3><p>{feature.text}</p>
              <span className="feature-rule" />
            </article>
          ))}
        </div>
      </section>

      <section className="create-section" id="create-memorial">
        <div className="create-copy">
          <p className="eyebrow"><span /> ПОЧНІМО З ІСТОРІЇ</p>
          <h2>Збережіть те,<br />що <em>найцінніше.</em></h2>
          <p>Створіть сторінку пам’яті — дбайливий цифровий простір, де історія близької людини залишиться доступною для родини та майбутніх поколінь.</p>
          <div className="create-promise"><span>✧</span> Дбайливо. Гідно. Назавжди.</div>
        </div>
        <div className="form-card">
          <div className="form-card-heading"><span className="form-step">КРОК 01 / 01</span><h3>Основна інформація</h3><p>Заповніть дані, щоб створити меморіал.</p></div>
          <form onSubmit={handleSubmit} className="memorial-form">
            <div className="field"><label htmlFor="name">Ім’я та прізвище <span>*</span></label><input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Наприклад, Іван Петренко" required /></div>
            <div className="form-row">
              <div className="field"><label htmlFor="birthDate">Дата народження</label><input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /></div>
              <div className="field"><label htmlFor="deathDate">Дата смерті</label><input id="deathDate" type="date" value={deathDate} onChange={(e) => setDeathDate(e.target.value)} /></div>
            </div>
            <div className="field"><label htmlFor="story">Історія життя <span className="optional">(необов’язково)</span></label><textarea id="story" rows={4} value={story} onChange={(e) => setStory(e.target.value)} placeholder="Кілька слів про життя, характер і те, що хочеться зберегти…" /></div>
            {error && <p role="alert" className="form-error">{error}</p>}
            <button type="submit" disabled={loading} className="button button-dark form-submit">{loading ? "Створення меморіалу…" : "Створити меморіал"} <span>↗</span></button>
            <p className="form-footnote">Після створення ви перейдете на сторінку меморіалу.</p>
          </form>
        </div>
      </section>

      <section className="closing-cta">
        <div className="closing-symbol">✳</div><p className="eyebrow">ПАМ’ЯТЬ, ЩО ЄДНАЄ ПОКОЛІННЯ</p>
        <h2>Бо любов і пам’ять<br /><em>не мають часу.</em></h2>
        <a href="#create-memorial" className="button button-gold">Створити меморіал <span>↗</span></a>
      </section>

      <footer className="site-footer">
        <div className="footer-main"><a href="/" className="brand footer-brand"><span className="brand-mark">✳</span><span><strong>MEMORYUA</strong><small>Цифрова пам’ять назавжди</small></span></a><p>Зберігаємо історії. Вшановуємо життя.</p><div className="footer-links"><a href="/memorials">Книга пам’яті</a><a href="/pricing">Тарифи</a><a href="/login">Увійти</a></div></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} MEMORYUA</span><span>Створено з повагою до пам’яті.</span></div>
      </footer>
    </main>
  );
}
