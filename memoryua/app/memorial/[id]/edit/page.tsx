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
  user_id?: string;
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

type ArchiveFile = {
  id: string;
  memorial_id: string;
  user_id: string;
  title?: string | null;
  file_url: string;
  file_name: string;
  file_type: string | null;
  is_public: boolean | null;
  created_at?: string | null;
  file_path: string;
  file_size: number | null;
};

const PHOTO_BUCKET = "memorial-photos";
const ARCHIVE_BUCKET = "memorial-archive";

const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const MAX_ARCHIVE_FILE_SIZE = 50 * 1024 * 1024;

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

function formatFileSize(size: number | null) {
  if (size === null || size === undefined) {
    return "";
  }

  if (size < 1024) {
    return `${size} Б`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} КБ`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
}

function getArchiveFileIcon(fileType: string | null) {
  if (!fileType) return "📎";

  if (fileType.startsWith("image/")) {
    return "🖼️";
  }

  if (fileType.startsWith("video/")) {
    return "🎥";
  }

  if (fileType.startsWith("audio/")) {
    return "🎵";
  }

  if (fileType.includes("pdf")) {
    return "📕";
  }

  if (
    fileType.includes("word") ||
    fileType.includes("document")
  ) {
    return "📄";
  }

  if (
    fileType.includes("zip") ||
    fileType.includes("rar")
  ) {
    return "🗜️";
  }

  return "📎";
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

  const [memorial, setMemorial] =
    useState<Memorial | null>(null);

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [story, setStory] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState("");

  const [galleryPhotos, setGalleryPhotos] =
    useState<GalleryPhoto[]>([]);

  const [galleryFiles, setGalleryFiles] =
    useState<File[]>([]);

  const [galleryPreviews, setGalleryPreviews] =
    useState<string[]>([]);

  const [archiveFiles, setArchiveFiles] =
    useState<ArchiveFile[]>([]);

  const [archiveSelectedFiles, setArchiveSelectedFiles] =
    useState<File[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingGallery, setUploadingGallery] =
    useState(false);
  const [uploadingArchive, setUploadingArchive] =
    useState(false);

  const [deletingArchiveId, setDeletingArchiveId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // ЗАВАНТАЖЕННЯ ДАНИХ
  // ==========================================

  useEffect(() => {
    async function loadMemorial() {
      if (!id) {
        setError("Не знайдено ID меморіалу.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw new Error(authError.message);
        }

        if (!user) {
          throw new Error(
            "Ви не авторизовані. Увійдіть у свій акаунт."
          );
        }

        // ======================================
        // МЕМОРІАЛ
        // ======================================

        const {
          data: memorialData,
          error: memorialError,
        } = await supabase
          .from("memorials")
          .select(
            "id, user_id, name, birth_date, death_date, story, photo_url, created_at"
          )
          .eq("id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (memorialError) {
          throw new Error(memorialError.message);
        }

        if (!memorialData) {
          throw new Error(
            "Меморіал не знайдено або у вас немає доступу."
          );
        }

        const loaded =
          memorialData as Memorial;

        setMemorial(loaded);
        setName(loaded.name || "");
        setBirthDate(
          formatDateForInput(loaded.birth_date)
        );
        setDeathDate(
          formatDateForInput(loaded.death_date)
        );
        setStory(loaded.story || "");
        setPhotoUrl(loaded.photo_url || "");
        setPreviewUrl(loaded.photo_url || "");

        // ======================================
        // ГАЛЕРЕЯ
        // ======================================

        const {
          data: galleryData,
          error: galleryError,
        } = await supabase
          .from("memorial_photos")
          .select(
            "id, memorial_id, user_id, photo_url, created_at"
          )
          .eq("memorial_id", id)
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

        if (galleryError) {
          console.error(
            "GALLERY LOAD ERROR:",
            galleryError
          );
        } else {
          setGalleryPhotos(
            (galleryData || []) as GalleryPhoto[]
          );
        }

        // ======================================
        // АРХІВ
        // ======================================

        const {
          data: archiveData,
          error: archiveError,
        } = await supabase
          .from("memorial_archive")
          .select(
            "id, memorial_id, user_id, title, file_url, file_name, file_type, is_public, created_at, file_path, file_size"
          )
          .eq("memorial_id", id)
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

        if (archiveError) {
          console.error(
            "ARCHIVE LOAD ERROR:",
            archiveError
          );

          setArchiveFiles([]);
        } else {
          setArchiveFiles(
            (archiveData || []) as ArchiveFile[]
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

  // ==========================================
  // ОСНОВНЕ ФОТО
  // ==========================================

  function handlePhotoSelect(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setError("");
    setSuccess("");

    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Виберіть файл фотографії.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setError(
        "Фотографія не повинна перевищувати 10 МБ."
      );
      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(URL.createObjectURL(file));
  }

  function removeMainPhoto() {
    setSelectedFile(null);
    setPhotoUrl("");
    setPreviewUrl("");
    setSuccess("");

    const input =
      document.getElementById(
        "photo"
      ) as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }
  }

  // ==========================================
  // ГАЛЕРЕЯ
  // ==========================================

  function handleGallerySelect(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setError("");
    setSuccess("");

    const files = Array.from(
      event.target.files || []
    );

    if (files.length === 0) return;

    const invalid = files.find(
      (file) =>
        !file.type.startsWith("image/") ||
        file.size > MAX_PHOTO_SIZE
    );

    if (invalid) {
      setError(
        "Усі фотографії повинні бути зображеннями та не перевищувати 10 МБ."
      );

      event.target.value = "";
      return;
    }

    const previews = files.map((file) =>
      URL.createObjectURL(file)
    );

    setGalleryFiles((current) => [
      ...current,
      ...files,
    ]);

    setGalleryPreviews((current) => [
      ...current,
      ...previews,
    ]);

    event.target.value = "";
  }

  function removeGallerySelectedFile(
    index: number
  ) {
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

  async function deleteGalleryPhoto(
    photo: GalleryPhoto
  ) {
    const confirmed = window.confirm(
      "Видалити цю фотографію з галереї?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "Потрібно увійти в акаунт."
        );
      }

      const { error: deleteError } =
        await supabase
          .from("memorial_photos")
          .delete()
          .eq("id", photo.id)
          .eq("memorial_id", id)
          .eq("user_id", user.id);

      if (deleteError) {
        throw new Error(deleteError.message);
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
      setError(
        err instanceof Error
          ? err.message
          : "Не вдалося видалити фотографію."
      );
    }
  }

  // ==========================================
  // ЗАВАНТАЖЕННЯ ОСНОВНОГО ФОТО
  // ==========================================

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
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, "") ||
        "jpg";

      const filePath =
        `${userId}/${id}/main/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
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

      const { data } =
        supabase.storage
          .from(PHOTO_BUCKET)
          .getPublicUrl(filePath);

      if (!data.publicUrl) {
        throw new Error(
          "Не вдалося отримати адресу фото."
        );
      }

      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  }

  // ==========================================
  // ЗАВАНТАЖЕННЯ ГАЛЕРЕЇ
  // ==========================================

  async function uploadGalleryPhotos(
    userId: string
  ) {
    if (galleryFiles.length === 0) return;

    setUploadingGallery(true);

    try {
      for (const file of galleryFiles) {
        const extension =
          file.name
            .split(".")
            .pop()
            ?.toLowerCase()
            .replace(/[^a-z0-9]/g, "") ||
          "jpg";

        const filePath =
          `${userId}/${id}/gallery/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } =
          await supabase.storage
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

        const { data } =
          supabase.storage
            .from(PHOTO_BUCKET)
            .getPublicUrl(filePath);

        const photoUrl = data.publicUrl;

        if (!photoUrl) {
          throw new Error(
            `Не вдалося отримати адресу фото "${file.name}".`
          );
        }

        const { error: insertError } =
          await supabase
            .from("memorial_photos")
            .insert({
              id: crypto.randomUUID(),
              memorial_id: id,
              user_id: userId,
              photo_url: photoUrl,
            });

        if (insertError) {
          await supabase.storage
            .from(PHOTO_BUCKET)
            .remove([filePath]);

          throw new Error(
            `Фото "${file.name}" завантажено, але не збережено в БД: ${insertError.message}`
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
        .eq("user_id", userId)
        .order("created_at", {
          ascending: false,
        });

      if (galleryError) {
        throw new Error(galleryError.message);
      }

      setGalleryPhotos(
        (updatedGallery || []) as GalleryPhoto[]
      );

      galleryPreviews.forEach((url) =>
        URL.revokeObjectURL(url)
      );

      setGalleryFiles([]);
      setGalleryPreviews([]);
    } finally {
      setUploadingGallery(false);
    }
  }

  // ==========================================
  // АРХІВ — ВИБІР
  // ==========================================

  function handleArchiveSelect(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setError("");
    setSuccess("");

    const files = Array.from(
      event.target.files || []
    );

    if (files.length === 0) return;

    const invalid = files.find(
      (file) =>
        file.size > MAX_ARCHIVE_FILE_SIZE
    );

    if (invalid) {
      setError(
        `Файл "${invalid.name}" перевищує 50 МБ.`
      );

      event.target.value = "";
      return;
    }

    setArchiveSelectedFiles((current) => [
      ...current,
      ...files,
    ]);

    event.target.value = "";
  }

  function removeArchiveSelectedFile(
    index: number
  ) {
    setArchiveSelectedFiles((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  // ==========================================
  // АРХІВ — ЗАВАНТАЖЕННЯ
  // ==========================================

  async function uploadArchiveFiles(
    userId: string
  ) {
    if (archiveSelectedFiles.length === 0) {
      return;
    }

    setUploadingArchive(true);
    setError("");
    setSuccess("");

    try {
      for (const file of archiveSelectedFiles) {
        const extension =
          file.name.includes(".")
            ? file.name
                .split(".")
                .pop()
                ?.toLowerCase()
                .replace(/[^a-z0-9]/g, "") || ""
            : "";

        const generatedName =
          extension
            ? `${crypto.randomUUID()}.${extension}`
            : crypto.randomUUID();

        const filePath =
          `${userId}/${id}/${generatedName}`;

        // -------------------------------
        // STORAGE
        // -------------------------------

        const { error: uploadError } =
          await supabase.storage
            .from(ARCHIVE_BUCKET)
            .upload(
              filePath,
              file,
              {
                cacheControl: "3600",
                upsert: false,
                contentType:
                  file.type ||
                  "application/octet-stream",
              }
            );

        if (uploadError) {
          throw new Error(
            `Не вдалося завантажити "${file.name}": ${uploadError.message}`
          );
        }

        // -------------------------------
        // PUBLIC URL
        // -------------------------------

        const { data: urlData } =
          supabase.storage
            .from(ARCHIVE_BUCKET)
            .getPublicUrl(filePath);

        const fileUrl = urlData.publicUrl;

        if (!fileUrl) {
          await supabase.storage
            .from(ARCHIVE_BUCKET)
            .remove([filePath]);

          throw new Error(
            `Не вдалося отримати URL для "${file.name}".`
          );
        }

        // -------------------------------
        // DATABASE
        // -------------------------------

        const { error: insertError } =
          await supabase
            .from("memorial_archive")
            .insert({
              id: crypto.randomUUID(),
              memorial_id: id,
              user_id: userId,

              // title потрібен для старої схеми,
              // якщо ця колонка присутня
              title: file.name,

              file_url: fileUrl,
              file_name: file.name,
              file_type:
                file.type ||
                "application/octet-stream",
              is_public: true,
              file_path: filePath,
              file_size: file.size,
            });

        if (insertError) {
          await supabase.storage
            .from(ARCHIVE_BUCKET)
            .remove([filePath]);

          throw new Error(
            `Файл "${file.name}" завантажено, але не вдалося зберегти його в архіві: ${insertError.message}`
          );
        }
      }

      // -------------------------------
      // ОНОВЛЕННЯ СПИСКУ
      // -------------------------------

      const {
        data: updatedArchive,
        error: reloadError,
      } = await supabase
        .from("memorial_archive")
        .select(
          "id, memorial_id, user_id, title, file_url, file_name, file_type, is_public, created_at, file_path, file_size"
        )
        .eq("memorial_id", id)
        .eq("user_id", userId)
        .order("created_at", {
          ascending: false,
        });

      if (reloadError) {
        throw new Error(
          `Файли завантажені, але список архіву не оновився: ${reloadError.message}`
        );
      }

      setArchiveFiles(
        (updatedArchive || []) as ArchiveFile[]
      );

      setArchiveSelectedFiles([]);

      setSuccess(
        "Файли успішно додано до Архіву пам'яті."
      );
    } catch (err) {
      console.error(
        "MEMORYUA ARCHIVE UPLOAD ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Не вдалося завантажити файли в архів."
      );
    } finally {
      setUploadingArchive(false);
    }
  }

  // ==========================================
  // АРХІВ — ВИДАЛЕННЯ
  // ==========================================

  async function deleteArchiveFile(
    file: ArchiveFile
  ) {
    const confirmed = window.confirm(
      `Видалити "${file.file_name}" з Архіву пам'яті?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingArchiveId(file.id);

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
        error: deleteDbError,
      } = await supabase
        .from("memorial_archive")
        .delete()
        .eq("id", file.id)
        .eq("memorial_id", id)
        .eq("user_id", user.id);

      if (deleteDbError) {
        throw new Error(
          deleteDbError.message
        );
      }

      if (file.file_path) {
        const {
          error: storageError,
        } = await supabase.storage
          .from(ARCHIVE_BUCKET)
          .remove([file.file_path]);

        if (storageError) {
          console.error(
            "ARCHIVE STORAGE DELETE ERROR:",
            storageError
          );
        }
      }

      setArchiveFiles((current) =>
        current.filter(
          (item) => item.id !== file.id
        )
      );

      setSuccess(
        "Файл видалено з Архіву пам'яті."
      );
    } catch (err) {
      console.error(
        "ARCHIVE DELETE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Не вдалося видалити файл."
      );
    } finally {
      setDeletingArchiveId(null);
    }
  }

  // ==========================================
  // ЗБЕРЕГТИ МЕМОРІАЛ
  // ==========================================

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
          "Ви не авторизовані. Увійдіть у свій акаунт."
        );
      }

      let finalPhotoUrl =
        photoUrl.trim() || null;

      if (selectedFile) {
        finalPhotoUrl =
          await uploadMainPhoto(user.id);
      }

      const { data, error: updateError } =
        await supabase
          .from("memorials")
          .update({
            name: name.trim(),
            birth_date:
              birthDate || null,
            death_date:
              deathDate || null,
            story:
              story.trim() || null,
            photo_url: finalPhotoUrl,
          })
          .eq("id", id)
          .eq("user_id", user.id)
          .select(
            "id, user_id, name, birth_date, death_date, story, photo_url, created_at"
          )
          .maybeSingle();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!data) {
        throw new Error(
          "Меморіал не оновлено."
        );
      }

      setMemorial(data as Memorial);
      setPhotoUrl(data.photo_url || "");
      setPreviewUrl(data.photo_url || "");
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

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-5">
            <div className="text-2xl font-bold">
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

  // ==========================================
  // ОСНОВНА СТОРІНКА
  // ==========================================

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <div className="text-2xl font-bold">
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
              Змініть інформацію, фото, галерею та Архів пам&apos;яті.
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
            className="space-y-8"
          >

            {/* ОСНОВНА ІНФОРМАЦІЯ */}

            <section>
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
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
              />
            </section>

            <section className="grid gap-6 sm:grid-cols-2">
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
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </section>

            <section>
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
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </section>

            {/* ОСНОВНЕ ФОТО */}

            <section className="border-t border-slate-200 pt-8">
              <h2 className="text-xl font-bold">
                🖼️ Основне фото
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Головне фото меморіалу.
              </p>

              <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6">
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  disabled={saving || uploading}
                  className="block w-full text-sm"
                />

                <p className="mt-3 text-xs text-slate-400">
                  Максимум 10 МБ.
                </p>
              </div>

              {previewUrl ? (
                <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                  <img
                    src={previewUrl}
                    alt="Основне фото"
                    className="max-h-[500px] w-full object-contain bg-slate-50"
                  />

                  <div className="border-t bg-white p-3 text-center">
                    <button
                      type="button"
                      onClick={removeMainPhoto}
                      disabled={saving || uploading}
                      className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Видалити основне фото
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
                  Основне фото ще не додано.
                </div>
              )}
            </section>

            {/* ГАЛЕРЕЯ */}

            <section className="border-t border-slate-200 pt-8">
              <h2 className="text-2xl font-bold">
                📸 Фотогалерея
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Додайте додаткові фотографії.
              </p>

              <label
                htmlFor="gallery"
                className="mt-5 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center hover:bg-slate-100"
              >
                <div className="text-4xl">
                  📷
                </div>

                <div className="mt-3 font-semibold">
                  Додати фотографії
                </div>

                <div className="mt-1 text-sm text-slate-500">
                  Можна вибрати декілька
                </div>

                <div className="mt-4 rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white">
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
                  uploadingGallery ||
                  uploadingArchive
                }
                className="hidden"
              />

              {galleryFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 font-semibold">
                    Нові фотографії
                  </h3>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {galleryPreviews.map(
                      (preview, index) => (
                        <div
                          key={`${preview}-${index}`}
                          className="relative overflow-hidden rounded-xl border"
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
                            className="absolute right-2 top-2 rounded-lg bg-red-600 px-2 py-1 text-xs text-white"
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
                    . Натисніть «Зберегти зміни».
                  </div>
                </div>
              )}

              <div className="mt-8">
                <h3 className="mb-4 text-lg font-semibold">
                  Збережені фотографії
                </h3>

                {galleryPhotos.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                    Фотогалерея поки порожня.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {galleryPhotos.map(
                      (photo, index) => (
                        <div
                          key={photo.id}
                          className="relative overflow-hidden rounded-2xl border"
                        >
                          <img
                            src={photo.photo_url}
                            alt={`Фотографія ${index + 1}`}
                            className="h-48 w-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              deleteGalleryPhoto(
                                photo
                              )
                            }
                            className="absolute right-2 top-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white"
                          >
                            🗑️ Видалити
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* АРХІВ ПАМ'ЯТІ */}

            <section className="border-t border-slate-200 pt-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                  📁
                </div>

                <div>
                  <h2 className="text-2xl font-bold">
                    Архів пам&apos;яті
                  </h2>

                  <p className="text-sm text-slate-500">
                    Документи, відео, аудіо та інші матеріали.
                  </p>
                </div>
              </div>

              {/* ВИБІР ФАЙЛІВ */}

              <label
                htmlFor="archive"
                className="mt-6 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center hover:bg-slate-100"
              >
                <div className="text-5xl">
                  📁
                </div>

                <div className="mt-4 text-lg font-semibold">
                  Додати матеріали до архіву
                </div>

                <div className="mt-2 text-sm text-slate-500">
                  PDF, документи, фото, відео та інші файли
                </div>

                <div className="mt-4 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white">
                  Вибрати файли
                </div>
              </label>

              <input
                id="archive"
                type="file"
                multiple
                onChange={handleArchiveSelect}
                disabled={
                  saving ||
                  uploadingArchive
                }
                className="hidden"
              />

              <p className="mt-3 text-center text-xs text-slate-400">
                Максимальний розмір одного файлу — 50 МБ.
              </p>

              {/* ВИБРАНІ ФАЙЛИ */}

              {archiveSelectedFiles.length > 0 && (
                <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <h3 className="font-semibold text-blue-900">
                    Нові матеріали
                  </h3>

                  <div className="mt-4 space-y-2">
                    {archiveSelectedFiles.map(
                      (file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="text-2xl">
                              {getArchiveFileIcon(
                                file.type
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">
                                {file.name}
                              </div>

                              <div className="text-xs text-slate-400">
                                {formatFileSize(
                                  file.size
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeArchiveSelectedFile(
                                index
                              )
                            }
                            disabled={
                              uploadingArchive
                            }
                            className="shrink-0 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white"
                          >
                            ✕
                          </button>
                        </div>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const {
                        data: { user },
                      } =
                        await supabase.auth.getUser();

                      if (!user) {
                        setError(
                          "Потрібно увійти в акаунт."
                        );
                        return;
                      }

                      await uploadArchiveFiles(
                        user.id
                      );
                    }}
                    disabled={
                      uploadingArchive ||
                      saving
                    }
                    className="mt-5 w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {uploadingArchive
                      ? "Завантаження архіву..."
                      : "📤 Завантажити в Архів пам'яті"}
                  </button>
                </div>
              )}

              {/* ЗБЕРЕЖЕНІ ФАЙЛИ */}

              <div className="mt-8">
                <h3 className="mb-4 text-lg font-semibold">
                  Збережені матеріали
                </h3>

                {archiveFiles.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 px-5 py-10 text-center">
                    <div className="text-4xl">
                      📂
                    </div>

                    <p className="mt-3 text-sm text-slate-500">
                      Архів поки порожній.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {archiveFiles.map(
                      (file) => (
                        <div
                          key={file.id}
                          className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                              {getArchiveFileIcon(
                                file.file_type
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="truncate font-semibold text-slate-900">
                                {file.file_name}
                              </div>

                              <div className="mt-1 text-xs text-slate-400">
                                {file.file_type ||
                                  "Файл"}

                                {file.file_size !==
                                  null &&
                                  ` • ${formatFileSize(
                                    file.file_size
                                  )}`}
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 gap-2">
                            <a
                              href={
                                file.file_url
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              👁️ Відкрити
                            </a>

                            <button
                              type="button"
                              onClick={() =>
                                deleteArchiveFile(
                                  file
                                )
                              }
                              disabled={
                                deletingArchiveId ===
                                file.id
                              }
                              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                            >
                              {deletingArchiveId ===
                              file.id
                                ? "..."
                                : "🗑️"}
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* КНОПКИ */}

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row">
              <button
                type="submit"
                disabled={
                  saving ||
                  uploading ||
                  uploadingGallery ||
                  uploadingArchive
                }
                className="flex-1 rounded-xl bg-slate-900 px-6 py-4 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading
                  ? "Завантаження основного фото..."
                  : uploadingGallery
                    ? "Завантаження галереї..."
                    : uploadingArchive
                      ? "Завантаження архіву..."
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
                  uploadingGallery ||
                  uploadingArchive
                }
                className="flex-1 rounded-xl border border-slate-300 bg-white px-6 py-4 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
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