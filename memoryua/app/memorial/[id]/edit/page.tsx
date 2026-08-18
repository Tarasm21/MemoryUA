"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Memorial = {
  id: string;
  name: string;
  birth_date: string | null;
  death_date: string | null;
  story: string | null;
  photo_url: string | null;
  created_at?: string | null;
};

const PHOTO_BUCKET = "memorial-photos";

function formatDateForInput(value: string | null) {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export default function EditMemorialPage() {
  const params = useParams();
  const router = useRouter();

  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : "";

  const [memorial, setMemorial] = useState<Memorial | null>(null);

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [story, setStory] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadMemorial() {
      if (!id) {
        setError("Не знайдено ID меморіалу.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw new Error(userError.message);
        }

        if (!user) {
          throw new Error(
            "Ви не авторизовані. Увійдіть у свій акаунт і спробуйте ще раз."
          );
        }

        const { data, error: fetchError } = await supabase
          .from("memorials")
          .select(
            "id, name, birth_date, death_date, story, photo_url, created_at"
          )
          .eq("id", id)
          .maybeSingle();

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        if (!data) {
          throw new Error(
            "Меморіал не знайдено або у вас немає доступу до нього."
          );
        }

        const loadedMemorial = data as Memorial;

        setMemorial(loadedMemorial);
        setName(loadedMemorial.name ?? "");
        setBirthDate(formatDateForInput(loadedMemorial.birth_date));
        setDeathDate(formatDateForInput(loadedMemorial.death_date));
        setStory(loadedMemorial.story ?? "");
        setPhotoUrl(loadedMemorial.photo_url ?? "");
        setPreviewUrl(loadedMemorial.photo_url ?? "");
      } catch (err) {
        console.error("Помилка завантаження меморіалу:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Не вдалося завантажити меморіал."
        );
      } finally {
        setLoading(false);
      }
    }

    loadMemorial();
  }, [id]);

  function handleDateChange(
    setter: (value: string) => void,
    event: ChangeEvent<HTMLInputElement>
  ) {
    setter(event.target.value);
  }

  function handlePhotoSelect(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setError("");
    setSuccess("");

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Будь ласка, виберіть файл фотографії.");
      event.target.value = "";
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      setError("Фотографія не повинна перевищувати 10 МБ.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
  }

  function removePhoto() {
    setSelectedFile(null);
    setPhotoUrl("");
    setPreviewUrl("");
    setSuccess("");

    const fileInput = document.getElementById(
      "photo"
    ) as HTMLInputElement | null;

    if (fileInput) {
      fileInput.value = "";
    }
  }

  async function uploadPhoto(userId: string) {
    if (!selectedFile) {
      return photoUrl || null;
    }

    setUploading(true);

    try {
      const fileExtension =
        selectedFile.name.split(".").pop()?.toLowerCase() || "jpg";

      const safeExtension = fileExtension.replace(
        /[^a-z0-9]/g,
        ""
      );

      const fileName = `${crypto.randomUUID()}.${safeExtension}`;

      const filePath = `${userId}/${id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: selectedFile.type,
        });

      if (uploadError) {
        throw new Error(
          `Не вдалося завантажити фотографію: ${uploadError.message}`
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from(PHOTO_BUCKET)
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error(
          "Фотографію завантажено, але не вдалося отримати її адресу."
        );
      }

      return publicUrlData.publicUrl;
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!id) {
      setError("Не знайдено ID меморіалу.");
      return;
    }

    if (!name.trim()) {
      setError("Введіть ім'я та прізвище.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        throw new Error(
          "Ви не авторизовані. Увійдіть у свій акаунт і спробуйте ще раз."
        );
      }

      let finalPhotoUrl = photoUrl.trim() || null;

      if (selectedFile) {
        finalPhotoUrl = await uploadPhoto(user.id);
      }

      const updateData = {
        name: name.trim(),
        birth_date: birthDate || null,
        death_date: deathDate || null,
        story: story.trim() || null,
        photo_url: finalPhotoUrl,
      };

      const { data, error: updateError } = await supabase
        .from("memorials")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select(
          "id, name, birth_date, death_date, story, photo_url, created_at"
        )
        .maybeSingle();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!data) {
        throw new Error(
          "Меморіал не оновлено. Перевірте, що цей меморіал належить вашому акаунту."
        );
      }

      const updatedMemorial = data as Memorial;

      setMemorial(updatedMemorial);
      setPhotoUrl(updatedMemorial.photo_url ?? "");
      setPreviewUrl(updatedMemorial.photo_url ?? "");
      setSelectedFile(null);

      setSuccess("Зміни успішно збережено.");

      setTimeout(() => {
        router.push(`/memorial/${id}`);
      }, 800);
    } catch (err) {
      console.error("Помилка збереження меморіалу:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Не вдалося зберегти зміни."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-5">
            <div className="text-2xl font-bold tracking-wide">
              MEMORYUA
            </div>

            <div className="text-sm text-slate-500">
              Цифрова пам&apos;ять для майбутніх поколінь
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-2xl px-6 py-16">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="text-lg font-semibold">
              Завантаження меморіалу...
            </div>

            <div className="mt-2 text-sm text-slate-500">
              Зачекайте, будь ласка.
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <div className="text-2xl font-bold tracking-wide">
            MEMORYUA
          </div>

          <div className="text-sm text-slate-500">
            Цифрова пам&apos;ять для майбутніх поколінь
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 text-center">
            <div className="mb-2 text-sm font-medium uppercase tracking-wider text-slate-400">
              MEMORYUA
            </div>

            <h1 className="text-3xl font-bold text-slate-900">
              Редагування меморіалу
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Змініть інформацію та збережіть оновлення.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Ім&apos;я та прізвище
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введіть ім'я та прізвище"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                required
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Дата народження
                </label>

                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) =>
                    handleDateChange(setBirthDate, e)
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Дата смерті
                </label>

                <input
                  type="date"
                  value={deathDate}
                  onChange={(e) =>
                    handleDateChange(setDeathDate, e)
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Історія / пам&apos;ять
              </label>

              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Напишіть історію, спогади або слова пам'яті..."
                rows={8}
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label
                htmlFor="photo"
                className="mb-2 block text-sm font-semibold"
              >
                Фотографія
              </label>

              <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  disabled={saving || uploading}
                  className="block w-full cursor-pointer text-sm text-slate-600"
                />

                <p className="mt-3 text-xs text-slate-400">
                  JPG, PNG, WEBP та інші зображення. Максимум 10 МБ.
                </p>
              </div>

              {previewUrl && (
                <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <img
                    src={previewUrl}
                    alt="Фотографія меморіалу"
                    className="max-h-[500px] w-full object-contain"
                    onError={() => {
                      setError(
                        "Не вдалося відобразити фотографію."
                      );
                    }}
                  />

                  <div className="flex justify-center border-t border-slate-200 bg-white p-3">
                    <button
                      type="button"
                      onClick={removePhoto}
                      disabled={saving || uploading}
                      className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Видалити фотографію
                    </button>
                  </div>
                </div>
              )}

              {!previewUrl && (
                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
                  Фотографію ще не додано.
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="submit"
                disabled={saving || uploading}
                className="flex-1 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading
                  ? "Завантаження фото..."
                  : saving
                    ? "Збереження..."
                    : "Зберегти зміни"}
              </button>

              <button
                type="button"
                onClick={() => router.push(`/memorial/${id}`)}
                disabled={saving || uploading}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Скасувати
              </button>
            </div>
          </form>
        </div>

        {memorial && (
          <div className="mt-4 text-center text-xs text-slate-400">
            ID меморіалу: {memorial.id}
          </div>
        )}
      </div>
    </main>
  );
}