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

type GalleryPhoto = {
  id: string;
  memorial_id: string;
  user_id: string;
  photo_url: string;
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

  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>(
    []
  );

  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

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

        const {
          data,
          error: fetchError,
        } = await supabase
          .from("memorials")
          .select(
            "id, name, birth_date, death_date, story, photo_url, created_at"
          )
          .eq("id", id)
          .eq("user_id", user.id)
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
        setBirthDate(
          formatDateForInput(loadedMemorial.birth_date)
        );
        setDeathDate(
          formatDateForInput(loadedMemorial.death_date)
        );
        setStory(loadedMemorial.story ?? "");
        setPhotoUrl(loadedMemorial.photo_url ?? "");
        setPreviewUrl(loadedMemorial.photo_url ?? "");

        const {
          data: galleryData,
          error: galleryError,
        } = await supabase
          .from("memorial_photos")
          .select(
            "id, memorial_id, user_id, photo_url, created_at"
          )
          .eq("memorial_id", id)
          .order("created_at", {
            ascending: false,
          });

        if (galleryError) {
          console.error(
            "MEMORYUA GALLERY LOAD ERROR:",
            galleryError
          );
        } else {
          setGalleryPhotos(
            (galleryData ?? []) as GalleryPhoto[]
          );
        }
      } catch (err) {
        console.error(
          "MEMORYUA EDIT LOAD ERROR:",
          err
        );

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

  function removeMainPhoto() {
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

  function handleGallerySelect(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setError("");
    setSuccess("");

    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    const invalidFile = files.find(
      (file) =>
        !file.type.startsWith("image/") ||
        file.size > maxSize
    );

    if (invalidFile) {
      setError(
        "Усі фотографії повинні бути зображеннями та не перевищувати 10 МБ кожна."
      );

      event.target.value = "";
      return;
    }

    setGalleryFiles(files);

    const previews = files.map((file) =>
      URL.createObjectURL(file)
    );

    setGalleryPreviews(previews);
  }

  function removeGallerySelectedFile(index: number) {
    setGalleryFiles((current) =>
      current.filter((_, i) => i !== index)
    );

    setGalleryPreviews((current) => {
      const url = current[index];

      if (url) {
        URL.revokeObjectURL(url);
      }

      return current.filter((_, i) => i !== index);
    });
  }

  async function uploadMainPhoto(
    userId: string
  ) {
    if (!selectedFile) {
      return photoUrl || null;
    }

    setUploading(true);

    try {
      const extension =
        selectedFile.name
          .split(".")
          .pop()
          ?.toLowerCase() || "jpg";

      const safeExtension = extension.replace(
        /[^a-z0-9]/g,
        ""
      );

      const fileName = `${crypto.randomUUID()}.${safeExtension}`;

      const filePath =
        `${userId}/${id}/main/${fileName}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(
          filePath,
          selectedFile,
          {
            cacheControl: "3600",
            upsert: false,
            contentType: selectedFile.type,
          }
        );

      if (uploadError) {
        throw new Error(
          `Не вдалося завантажити основне фото: ${uploadError.message}`
        );
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from(PHOTO_BUCKET)
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error(
          "Не вдалося отримати адресу основного фото."
        );
      }

      return publicUrlData.publicUrl;
    } finally {
      setUploading(false);
    }
  }

  async function uploadGalleryPhotos(
    userId: string
  ) {
    if (galleryFiles.length === 0) {
      return;
    }

    setUploadingGallery(true);

    try {
      for (const file of galleryFiles) {
        const extension =
          file.name
            .split(".")
            .pop()
            ?.toLowerCase() || "jpg";

        const safeExtension = extension.replace(
          /[^a-z0-9]/g,
          ""
        );

        const fileName =
          `${crypto.randomUUID()}.${safeExtension}`;

        const filePath =
          `${userId}/${id}/gallery/${fileName}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(
            filePath,
            file,
            {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type,
            }
          );

        if (uploadError) {
          throw new Error(
            `Не вдалося завантажити фото "${file.name}": ${uploadError.message}`
          );
        }

        const {
          data: publicUrlData,
        } = supabase.storage
          .from(PHOTO_BUCKET)
          .getPublicUrl(filePath);

        const publicUrl =
          publicUrlData?.publicUrl;

        if (!publicUrl) {
          throw new Error(
            `Не вдалося отримати адресу фото "${file.name}".`
          );
        }

        const {
          error: insertError,
        } = await supabase
          .from("memorial_photos")
          .insert({
            id: crypto.randomUUID(),
            memorial_id: id,
            user_id: userId,
            photo_url: publicUrl,
          });

        if (insertError) {
          throw new Error(
            `Фото завантажено, але не вдалося зберегти його в галереї: ${insertError.message}`
          );
        }
      }

      const {
        data: updatedGallery,
        error: galleryError,
      } = await supabase
        .from("memorial_photos")
        .select(
          "id, memorial_id, user_id, photo_url, created_at"
        )
        .eq("memorial_id", id)
        .order("created_at", {
          ascending: false,
        });

      if (galleryError) {
        throw new Error(
          `Не вдалося оновити галерею: ${galleryError.message}`
        );
      }

      setGalleryPhotos(
        (updatedGallery ?? []) as GalleryPhoto[]
      );

      galleryPreviews.forEach((url) =>
        URL.revokeObjectURL(url)
      );

      setGalleryFiles([]);
      setGalleryPreviews([]);

      const galleryInput =
        document.getElementById(
          "gallery"
        ) as HTMLInputElement | null;

      if (galleryInput) {
        galleryInput.value = "";
      }
    } finally {
      setUploadingGallery(false);
    }
  }

  async function deleteGalleryPhoto(
    photo: GalleryPhoto
  ) {
    const confirmed = window.confirm(
      "Видалити цю фотографію з галереї?"
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "Потрібно увійти в акаунт."
        );
      }

      const {
        error: deleteError,
      } = await supabase
        .from("memorial_photos")
        .delete()
        .eq("id", photo.id)
        .eq("memorial_id", id)
        .eq("user_id", user.id);

      if (deleteError) {
        throw new Error(
          deleteError.message
        );
      }

      setGalleryPhotos((current) =>
        current.filter(
          (item) => item.id !== photo.id
        )
      );

      setSuccess(
        "Фотографію видалено з галереї."
      );
    } catch (err) {
      console.error(
        "MEMORYUA GALLERY DELETE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Не вдалося видалити фотографію."
      );
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

      let finalPhotoUrl =
        photoUrl.trim() || null;

      if (selectedFile) {
        finalPhotoUrl =
          await uploadMainPhoto(user.id);
      }

      const updateData = {
        name: name.trim(),
        birth_date:
          birthDate || null,
        death_date:
          deathDate || null,
        story:
          story.trim() || null,
        photo_url:
          finalPhotoUrl,
      };

      const {
        data,
        error: updateError,
      } = await supabase
        .from("memorials")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select(
          "id, name, birth_date, death_date, story, photo_url, created_at"
        )
        .maybeSingle();

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      if (!data) {
        throw new Error(
          "Меморіал не оновлено. Перевірте, що він належить вашому акаунту."
        );
      }

      const updatedMemorial =
        data as Memorial;

      setMemorial(updatedMemorial);
      setPhotoUrl(
        updatedMemorial.photo_url ?? ""
      );
      setPreviewUrl(
        updatedMemorial.photo_url ?? ""
      );
      setSelectedFile(null);

      await uploadGalleryPhotos(user.id);

      setSuccess(
        "Зміни успішно збережено."
      );
    } catch (err) {
      console.error(
        "MEMORYUA SAVE ERROR:",
        err
      );

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

        <div className="mx-auto max-w-3xl px-6 py-16">
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

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 text-center">
            <div className="mb-2 text-sm font-medium uppercase tracking-wider text-slate-400">
              MEMORYUA
            </div>

            <h1 className="text-3xl font-bold text-slate-900">
              Редагування меморіалу
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Змініть інформацію, основне фото та додайте фотографії до галереї.
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

          <form
            onSubmit={handleSave}
            className="space-y-6"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Ім&apos;я та прізвище
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Введіть ім'я та прізвище"
                disabled={saving}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
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
                    setBirthDate(e.target.value)
                  }
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
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
                    setDeathDate(e.target.value)
                  }
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Історія / пам&apos;ять
              </label>

              <textarea
                value={story}
                onChange={(e) =>
                  setStory(e.target.value)
                }
                placeholder="Напишіть історію, спогади або слова пам'яті..."
                rows={8}
                disabled={saving}
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
              />
            </div>

            {/* ОСНОВНЕ ФОТО */}
            <div>
              <div className="mb-3">
                <h2 className="text-lg font-bold text-slate-900">
                  🖼️ Основне фото
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Це фото буде головним на сторінці меморіалу.
                </p>
              </div>

              <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  disabled={
                    saving ||
                    uploading ||
                    uploadingGallery
                  }
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
                    alt="Основне фото меморіалу"
                    className="max-h-[500px] w-full object-contain"
                  />

                  <div className="flex justify-center border-t border-slate-200 bg-white p-3">
                    <button
                      type="button"
                      onClick={removeMainPhoto}
                      disabled={
                        saving ||
                        uploading
                      }
                      className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      Видалити основне фото
                    </button>
                  </div>
                </div>
              )}

              {!previewUrl && (
                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
                  Основне фото ще не додано.
                </div>
              )}
            </div>

            {/* ФОТОГАЛЕРЕЯ */}
            <div className="border-t border-slate-200 pt-8">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-slate-900">
                  📸 Фотогалерея
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Додайте додаткові фотографії, які хочете зберегти
                  на сторінці цього меморіалу.
                </p>
              </div>

              <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6">
                <label
                  htmlFor="gallery"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-8 text-center transition hover:bg-slate-50"
                >
                  <div className="text-4xl">
                    📷
                  </div>

                  <div className="mt-3 text-base font-semibold text-slate-800">
                    Додати фотографії
                  </div>

                  <div className="mt-1 text-sm text-slate-500">
                    Можна вибрати декілька фотографій одразу
                  </div>

                  <div className="mt-3 rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white">
                    Вибрати фото
                  </div>
                </label>

                <input
                  id="gallery"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGallerySelect}
                  disabled={
                    saving ||
                    uploading ||
                    uploadingGallery
                  }
                  className="hidden"
                />

                <p className="mt-4 text-center text-xs text-slate-400">
                  Кожне фото — максимум 10 МБ.
                </p>
              </div>

              {/* ВИБРАНІ ФОТО, ЯКІ ЩЕ НЕ ЗАВАНТАЖЕНІ */}
              {galleryFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold text-slate-700">
                    Нові фотографії
                  </h3>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {galleryPreviews.map(
                      (preview, index) => (
                        <div
                          key={preview}
                          className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                        >
                          <img
                            src={preview}
                            alt={`Нове фото ${index + 1}`}
                            className="h-40 w-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeGallerySelectedFile(
                                index
                              )
                            }
                            disabled={
                              saving ||
                              uploadingGallery
                            }
                            className="absolute right-2 top-2 rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      )
                    )}
                  </div>

                  <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    Вибрано фотографій:{" "}
                    <strong>
                      {galleryFiles.length}
                    </strong>
                    . Натисніть «Зберегти зміни», щоб завантажити їх.
                  </div>
                </div>
              )}

              {/* ВЖЕ ЗАВАНТАЖЕНА ГАЛЕРЕЯ */}
              <div className="mt-8">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">
                  Збережені фотографії
                </h3>

                {galleryPhotos.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                    Фотогалерея поки порожня.
                    <br />
                    Додайте перші фотографії вище.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {galleryPhotos.map(
                      (photo, index) => (
                        <div
                          key={photo.id}
                          className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                        >
                          <img
                            src={photo.photo_url}
                            alt={`Фотографія ${index + 1}`}
                            className="h-48 w-full object-cover transition duration-300 group-hover:scale-105"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              deleteGalleryPhoto(
                                photo
                              )
                            }
                            disabled={
                              saving ||
                              uploadingGallery
                            }
                            className="absolute right-2 top-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white opacity-90 shadow-sm transition hover:bg-red-700"
                          >
                            🗑️ Видалити
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* КНОПКИ */}
            <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row">
              <button
                type="submit"
                disabled={
                  saving ||
                  uploading ||
                  uploadingGallery
                }
                className="flex-1 rounded-xl bg-slate-900 px-6 py-4 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading
                  ? "Завантаження основного фото..."
                  : uploadingGallery
                    ? "Завантаження галереї..."
                    : saving
                      ? "Збереження..."
                      : "Зберегти зміни"}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/memorial/${id}`
                  )
                }
                disabled={
                  saving ||
                  uploading ||
                  uploadingGallery
                }
                className="flex-1 rounded-xl border border-slate-300 bg-white px-6 py-4 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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