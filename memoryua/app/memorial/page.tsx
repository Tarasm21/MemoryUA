"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";

type Memorial = {
  id: string;
  user_id: string;
  name: string;
  birth_date: string | null;
  death_date: string | null;
  story: string | null;
  photo_url: string | null;
  plan: string;
  created_at?: string | null;
};

type MemorialPhoto = {
  id: string;
  memorial_id: string;
  user_id: string;
  photo_url: string;
  created_at?: string | null;
};

type MemorialMessage = {
  id: string;
  memorial_id: string;
  author_name: string;
  message: string;
  created_at?: string | null;
};

type MemorialArchiveFile = {
  id: string;
  memorial_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_url: string | null;
  file_type: string | null;
  file_size: number | null;
  is_public: boolean;
  created_at?: string | null;
};

const ARCHIVE_BUCKET = "memorial-archive";

export default function MemorialPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [memorial, setMemorial] = useState<Memorial | null>(null);
  const [photos, setPhotos] = useState<MemorialPhoto[]>([]);
  const [messages, setMessages] = useState<MemorialMessage[]>([]);
  const [archiveFiles, setArchiveFiles] = useState<
    MemorialArchiveFile[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [archiveLoading, setArchiveLoading] = useState(true);

  const [error, setError] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(
    null
  );

  const [selectedPhoto, setSelectedPhoto] =
    useState<MemorialPhoto | null>(null);

  const [candlesCount, setCandlesCount] = useState(0);
  const [candleLit, setCandleLit] = useState(false);
  const [candleLoading, setCandleLoading] = useState(false);
  const [candleError, setCandleError] = useState("");

  const [authorName, setAuthorName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageError, setMessageError] = useState("");

  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likeError, setLikeError] = useState("");

  const [archiveFile, setArchiveFile] = useState<File | null>(null);
  const [archiveUploadLoading, setArchiveUploadLoading] =
    useState(false);
  const [archiveError, setArchiveError] = useState("");

  const qrRef = useRef<HTMLDivElement>(null);

  // =========================================
  // ЗАВАНТАЖЕННЯ СТОРІНКИ
  // =========================================

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      if (!id) {
        if (mounted) {
          setError(true);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setGalleryLoading(true);
      setMessagesLoading(true);
      setArchiveLoading(true);

      setError(false);
      setCandleError("");
      setMessageError("");
      setLikeError("");
      setArchiveError("");

      try {
        // =========================================
        // 1. МЕМОРІАЛ
        // =========================================

        const {
          data: memorialData,
          error: memorialError,
        } = await supabase
          .from("memorials")
          .select(
            "id, user_id, name, birth_date, death_date, story, photo_url, plan, created_at"
          )
          .eq("id", id)
          .maybeSingle();

        if (memorialError) {
          console.error(
            "MEMORYUA MEMORIAL LOAD ERROR:",
            memorialError
          );

          if (mounted) {
            setError(true);
            setMemorial(null);
          }

          return;
        }

        if (!memorialData) {
          if (mounted) {
            setError(true);
            setMemorial(null);
          }

          return;
        }

        if (mounted) {
          setMemorial(memorialData as Memorial);
        }

        // =========================================
        // 2. ФОТОГАЛЕРЕЯ
        // =========================================

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
            ascending: true,
          });

        if (galleryError) {
          console.error(
            "MEMORYUA GALLERY LOAD ERROR:",
            galleryError
          );

          if (mounted) {
            setPhotos([]);
          }
        } else if (mounted) {
          setPhotos(
            (galleryData ?? []) as MemorialPhoto[]
          );
        }

        // =========================================
        // 3. СВІЧКИ
        // =========================================

        const {
          count: candlesCountData,
          error: candlesError,
        } = await supabase
          .from("memorial_candles")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("memorial_id", id);

        if (candlesError) {
          console.error(
            "MEMORYUA CANDLES LOAD ERROR:",
            candlesError
          );

          if (mounted) {
            setCandlesCount(0);
          }
        } else if (mounted) {
          setCandlesCount(candlesCountData ?? 0);
        }

        // =========================================
        // 4. КНИГА ПАМ'ЯТІ
        // =========================================

        const {
          data: messagesData,
          error: messagesError,
        } = await supabase
          .from("memorial_messages")
          .select(
            "id, memorial_id, author_name, message, created_at"
          )
          .eq("memorial_id", id)
          .order("created_at", {
            ascending: false,
          });

        if (messagesError) {
          console.error(
            "MEMORYUA MESSAGES LOAD ERROR:",
            messagesError
          );

          if (mounted) {
            setMessages([]);
          }
        } else if (mounted) {
          setMessages(
            (messagesData ?? []) as MemorialMessage[]
          );
        }

        // =========================================
        // 5. ПІДТРИМКА ПАМ'ЯТІ
        // =========================================

        const {
          count: likesCountData,
          error: likesError,
        } = await supabase
          .from("memorial_likes")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("memorial_id", id);

        if (likesError) {
          console.error(
            "MEMORYUA LIKES LOAD ERROR:",
            likesError
          );

          if (mounted) {
            setLikesCount(0);
          }
        } else if (mounted) {
          setLikesCount(likesCountData ?? 0);
        }

        // =========================================
        // 6. КОРИСТУВАЧ
        // =========================================

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted) {
          setCurrentUserId(
            session?.user?.id ?? null
          );
        }

        // =========================================
        // 7. АРХІВ ПАМ'ЯТІ
        // =========================================

        const {
          data: archiveData,
          error: archiveLoadError,
        } = await supabase
          .from("memorial_archive")
          .select(
            "id, memorial_id, user_id, file_name, file_path, file_url, file_type, file_size, is_public, created_at"
          )
          .eq("memorial_id", id)
          .order("created_at", {
            ascending: false,
          });

        if (archiveLoadError) {
          console.error(
            "MEMORYUA ARCHIVE LOAD ERROR:",
            archiveLoadError
          );

          if (mounted) {
            setArchiveFiles([]);
          }
        } else if (mounted) {
          setArchiveFiles(
            (archiveData ?? []) as MemorialArchiveFile[]
          );
        }
      } catch (err) {
        console.error(
          "MEMORYUA PAGE ERROR:",
          err
        );

        if (mounted) {
          setError(true);
          setMemorial(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setGalleryLoading(false);
          setMessagesLoading(false);
          setArchiveLoading(false);
        }
      }
    }

    loadPage();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        setCurrentUserId(
          session?.user?.id ?? null
        );
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [id]);

  // =========================================
  // ВЛАСНИК
  // =========================================

  const isOwner =
    !!currentUserId &&
    !!memorial &&
    currentUserId === memorial.user_id;

  // =========================================
  // ТАРИФ
  // =========================================

  const isClassic =
    memorial?.plan === "classic";

  // =========================================
  // ❤️ ПІДТРИМАТИ ПАМ'ЯТЬ
  // =========================================

  const supportMemory = async () => {
    if (!id || likeLoading || liked) {
      return;
    }

    setLikeLoading(true);
    setLikeError("");

    try {
      const {
        error: insertError,
      } = await supabase
        .from("memorial_likes")
        .insert({
          memorial_id: id,
        });

      if (insertError) {
        console.error(
          "MEMORYUA LIKE INSERT ERROR:",
          insertError
        );

        setLikeError(
          insertError.message ||
            "Не вдалося підтримати пам'ять."
        );

        return;
      }

      setLiked(true);

      setLikesCount(
        (current) => current + 1
      );
    } catch (err) {
      console.error(
        "MEMORYUA LIKE EXCEPTION:",
        err
      );

      setLikeError(
        err instanceof Error
          ? err.message
          : "Невідома помилка."
      );
    } finally {
      setLikeLoading(false);
    }
  };

  // =========================================
  // СВІЧКА
  // =========================================

  const lightCandle = async () => {
    if (!id) {
      setCandleError(
        "Не знайдено ID меморіалу."
      );
      return;
    }

    if (candleLoading) {
      return;
    }

    setCandleLoading(true);
    setCandleError("");

    try {
      const {
        error: insertError,
      } = await supabase
        .from("memorial_candles")
        .insert({
          memorial_id: id,
        });

      if (insertError) {
        console.error(
          "MEMORYUA CANDLE INSERT ERROR:",
          insertError
        );

        setCandleError(
          insertError.message ||
            "Помилка бази даних."
        );

        return;
      }

      setCandleLit(true);

      setCandlesCount(
        (current) => current + 1
      );
    } catch (err) {
      console.error(
        "MEMORYUA CANDLE EXCEPTION:",
        err
      );

      setCandleError(
        err instanceof Error
          ? err.message
          : "Невідома помилка."
      );
    } finally {
      setCandleLoading(false);
    }
  };

  // =========================================
  // ДОДАТИ ЗАПИС
  // =========================================

  const addMemoryMessage = async () => {
    const cleanAuthorName =
      authorName.trim();

    const cleanMessage =
      messageText.trim();

    if (!id) {
      setMessageError(
        "Не знайдено ID меморіалу."
      );
      return;
    }

    if (!cleanAuthorName) {
      setMessageError(
        "Будь ласка, введіть ваше ім'я."
      );
      return;
    }

    if (!cleanMessage) {
      setMessageError(
        "Будь ласка, напишіть повідомлення."
      );
      return;
    }

    if (messageLoading) {
      return;
    }

    setMessageLoading(true);
    setMessageError("");

    try {
      const {
        data: newMessage,
        error: insertError,
      } = await supabase
        .from("memorial_messages")
        .insert({
          memorial_id: id,
          author_name: cleanAuthorName,
          message: cleanMessage,
        })
        .select(
          "id, memorial_id, author_name, message, created_at"
        )
        .single();

      if (insertError) {
        console.error(
          "MEMORYUA MESSAGE INSERT ERROR:",
          insertError
        );

        setMessageError(
          insertError.message ||
            "Не вдалося залишити запис."
        );

        return;
      }

      if (newMessage) {
        setMessages((current) => [
          newMessage as MemorialMessage,
          ...current,
        ]);
      }

      setAuthorName("");
      setMessageText("");
    } catch (err) {
      console.error(
        "MEMORYUA MESSAGE EXCEPTION:",
        err
      );

      setMessageError(
        err instanceof Error
          ? err.message
          : "Невідома помилка."
      );
    } finally {
      setMessageLoading(false);
    }
  };

  // =========================================
  // ВИДАЛИТИ ЗАПИС
  // =========================================

  const deleteMemoryMessage = async (
    message: MemorialMessage
  ) => {
    if (!isOwner) {
      return;
    }

    const confirmed =
      window.confirm(
        "Ви впевнені, що хочете видалити цей запис із Книги пам'яті?"
      );

    if (!confirmed) {
      return;
    }

    const {
      error: deleteError,
    } = await supabase
      .from("memorial_messages")
      .delete()
      .eq("id", message.id);

    if (deleteError) {
      console.error(
        "MEMORYUA MESSAGE DELETE ERROR:",
        deleteError
      );

      alert(
        "Не вдалося видалити запис."
      );

      return;
    }

    setMessages((current) =>
      current.filter(
        (item) =>
          item.id !== message.id
      )
    );
  };

  // =========================================
  // ДАТИ
  // =========================================

  const formatDate = (
    date: string | null
  ) => {
    if (!date) return "";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString(
      "uk-UA",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  };

  const formatMessageDate = (
    date: string | null | undefined
  ) => {
    if (!date) return "";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return parsed.toLocaleDateString(
      "uk-UA",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  };

  // =========================================
  // РОЗМІР ФАЙЛУ
  // =========================================

  const formatFileSize = (
    bytes: number | null
  ) => {
    if (!bytes || bytes <= 0) {
      return "Розмір невідомий";
    }

    if (bytes < 1024) {
      return `${bytes} Б`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} КБ`;
    }

    if (bytes < 1024 * 1024 * 1024) {
      return `${(
        bytes /
        (1024 * 1024)
      ).toFixed(1)} МБ`;
    }

    return `${(
      bytes /
      (1024 * 1024 * 1024)
    ).toFixed(1)} ГБ`;
  };

  // =========================================
  // ІКОНКА АРХІВУ
  // =========================================

  const getArchiveIcon = (
    file: MemorialArchiveFile
  ) => {
    const type =
      file.file_type?.toLowerCase() || "";

    if (type.includes("pdf")) {
      return "📕";
    }

    if (
      type.includes("word") ||
      type.includes("document")
    ) {
      return "📘";
    }

    if (
      type.includes("excel") ||
      type.includes("spreadsheet")
    ) {
      return "📗";
    }

    if (type.startsWith("image/")) {
      return "🖼️";
    }

    if (
      type.includes("text") ||
      type.includes("plain")
    ) {
      return "📄";
    }

    return "📎";
  };

  // =========================================
  // URL АРХІВНОГО ФАЙЛУ
  // =========================================

  const getArchiveFileUrl = (
    file: MemorialArchiveFile
  ) => {
    if (file.file_url) {
      return file.file_url;
    }

    const {
      data,
    } = supabase.storage
      .from(ARCHIVE_BUCKET)
      .getPublicUrl(file.file_path);

    return data.publicUrl;
  };

  // =========================================
  // ЗАВАНТАЖЕННЯ ФАЙЛУ В АРХІВ
  // =========================================

  const handleArchiveUpload = async () => {
    if (!archiveFile) {
      setArchiveError(
        "Спочатку виберіть файл."
      );
      return;
    }

    if (!id) {
      setArchiveError(
        "Не знайдено ID меморіалу."
      );
      return;
    }

    if (!currentUserId) {
      setArchiveError(
        "Для завантаження файлів потрібно увійти в акаунт."
      );
      return;
    }

    if (!isOwner) {
      setArchiveError(
        "Тільки власник меморіалу може додавати файли."
      );
      return;
    }

    setArchiveUploadLoading(true);
    setArchiveError("");

    try {
      const safeFileName =
        archiveFile.name
          .replace(
            /[^a-zA-Z0-9а-яА-ЯіІїЇєЄґҐ._-]/g,
            "_"
          )
          .replace(/\s+/g, "_");

      const uniqueName =
        `${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

      const filePath =
        `${id}/${uniqueName}`;

      // 1. STORAGE
      const {
        error: uploadError,
      } = await supabase.storage
        .from(ARCHIVE_BUCKET)
        .upload(
          filePath,
          archiveFile,
          {
            cacheControl: "3600",
            upsert: false,
            contentType:
              archiveFile.type ||
              "application/octet-stream",
          }
        );

      if (uploadError) {
        console.error(
          "MEMORYUA ARCHIVE STORAGE UPLOAD ERROR:",
          uploadError
        );

        setArchiveError(
          uploadError.message ||
            "Не вдалося завантажити файл."
        );

        return;
      }

      // 2. PUBLIC URL
      const {
        data: publicUrlData,
      } = supabase.storage
        .from(ARCHIVE_BUCKET)
        .getPublicUrl(filePath);

      const publicUrl =
        publicUrlData.publicUrl;

      // 3. БАЗА ДАНИХ
      const {
        data: archiveRow,
        error: insertError,
      } = await supabase
        .from("memorial_archive")
        .insert({
          memorial_id: id,
          user_id: currentUserId,
          file_name: archiveFile.name,
          file_path: filePath,
          file_url: publicUrl,
          file_type:
            archiveFile.type || null,
          file_size: archiveFile.size,
          is_public: true,
        })
        .select(
          "id, memorial_id, user_id, file_name, file_path, file_url, file_type, file_size, is_public, created_at"
        )
        .single();

      if (insertError) {
        console.error(
          "MEMORYUA ARCHIVE DATABASE INSERT ERROR:",
          insertError
        );

        await supabase.storage
          .from(ARCHIVE_BUCKET)
          .remove([filePath]);

        setArchiveError(
          insertError.message ||
            "Не вдалося зберегти інформацію про файл."
        );

        return;
      }

      if (archiveRow) {
        setArchiveFiles((current) => [
          archiveRow as MemorialArchiveFile,
          ...current,
        ]);
      }

      setArchiveFile(null);

      const input =
        document.getElementById(
          "archive-file"
        ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }
    } catch (err) {
      console.error(
        "MEMORYUA ARCHIVE UPLOAD EXCEPTION:",
        err
      );

      setArchiveError(
        err instanceof Error
          ? err.message
          : "Невідома помилка завантаження."
      );
    } finally {
      setArchiveUploadLoading(false);
    }
  };

  // =========================================
  // ВІДКРИТТЯ АРХІВНОГО ФАЙЛУ
  // =========================================

  const openArchiveFile = (
    file: MemorialArchiveFile
  ) => {
    const url =
      getArchiveFileUrl(file);

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // =========================================
  // ВИДАЛЕННЯ АРХІВНОГО ФАЙЛУ
  // =========================================

  const handleDeleteArchiveFile = async (
    file: MemorialArchiveFile
  ) => {
    if (!isOwner) {
      return;
    }

    const confirmed =
      window.confirm(
        `Видалити файл "${file.file_name}" з архіву?`
      );

    if (!confirmed) {
      return;
    }

    try {
      // 1. STORAGE
      const {
        error: storageDeleteError,
      } = await supabase.storage
        .from(ARCHIVE_BUCKET)
        .remove([file.file_path]);

      if (storageDeleteError) {
        console.error(
          "MEMORYUA ARCHIVE STORAGE DELETE ERROR:",
          storageDeleteError
        );

        alert(
          "Не вдалося видалити файл зі сховища."
        );

        return;
      }

      // 2. DATABASE
      const {
        error: databaseDeleteError,
      } = await supabase
        .from("memorial_archive")
        .delete()
        .eq("id", file.id)
        .eq("memorial_id", id)
        .eq("user_id", currentUserId);

      if (databaseDeleteError) {
        console.error(
          "MEMORYUA ARCHIVE DATABASE DELETE ERROR:",
          databaseDeleteError
        );

        alert(
          "Файл зі сховища видалено, але запис у базі не видалився."
        );

        return;
      }

      setArchiveFiles((current) =>
        current.filter(
          (item) => item.id !== file.id
        )
      );
    } catch (err) {
      console.error(
        "MEMORYUA ARCHIVE DELETE EXCEPTION:",
        err
      );

      alert(
        "Не вдалося видалити файл."
      );
    }
  };

  // =========================================
  // QR
  // =========================================

  const getMemorialUrl = () => {
    if (typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/memorial/${id}`;
  };

  const goToEdit = () => {
    if (!isOwner) return;

    window.location.href =
      `/memorial/${id}/edit`;
  };

  const downloadQR = () => {
    const svg =
      qrRef.current?.querySelector("svg");

    if (!svg || !memorial) {
      return;
    }

    const serializer =
      new XMLSerializer();

    const svgString =
      serializer.serializeToString(svg);

    const blob = new Blob(
      [svgString],
      {
        type:
          "image/svg+xml;charset=utf-8",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `MEMORYUA-${memorial.name || "memorial"}.svg`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =========================================
  // ВИДАЛЕННЯ МЕМОРІАЛУ
  // =========================================

  const handleDeleteMemorial =
    async () => {
      if (
        !id ||
        !memorial ||
        !isOwner
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Ви впевнені, що хочете назавжди видалити цей меморіал?"
        );

      if (!confirmed) {
        return;
      }

      const {
        error: deleteError,
      } = await supabase
        .from("memorials")
        .delete()
        .eq("id", id)
        .eq(
          "user_id",
          memorial.user_id
        );

      if (deleteError) {
        console.error(
          "MEMORYUA DELETE ERROR:",
          deleteError
        );

        alert(
          "Не вдалося видалити меморіал."
        );

        return;
      }

      alert(
        "Меморіал успішно видалено."
      );

      window.location.href = "/";
    };

  // =========================================
  // ВИДАЛЕННЯ ФОТО
  // =========================================

  const handleDeletePhoto =
    async (
      photo: MemorialPhoto
    ) => {
      if (!isOwner) {
        return;
      }

      const confirmed =
        window.confirm(
          "Видалити це фото з галереї?"
        );

      if (!confirmed) {
        return;
      }

      const {
        error: deleteError,
      } = await supabase
        .from("memorial_photos")
        .delete()
        .eq("id", photo.id)
        .eq(
          "user_id",
          currentUserId
        );

      if (deleteError) {
        console.error(
          "MEMORYUA PHOTO DELETE ERROR:",
          deleteError
        );

        alert(
          "Не вдалося видалити фото."
        );

        return;
      }

      setPhotos(
        (current) =>
          current.filter(
            (item) =>
              item.id !== photo.id
          )
      );

      if (
        selectedPhoto?.id ===
        photo.id
      ) {
        setSelectedPhoto(null);
      }
    };

  // =========================================
  // ПОДІЛИТИСЯ
  // =========================================

  const shareMemorial =
    async () => {
      const url =
        getMemorialUrl();

      if (!url) return;

      if (navigator.share) {
        try {
          await navigator.share({
            title: memorial?.name
              ? `Пам'ять про ${memorial.name}`
              : "MEMORYUA",
            text: memorial?.name
              ? `Цифровий меморіал — ${memorial.name}`
              : "Цифровий меморіал MEMORYUA",
            url,
          });
        } catch {
          // користувач закрив меню
        }

        return;
      }

      try {
        await navigator.clipboard.writeText(
          url
        );

        alert(
          "Посилання скопійовано!"
        );
      } catch {
        alert(url);
      }
    };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />

          <p className="text-slate-600">
            Завантаження меморіалу...
          </p>
        </div>
      </main>
    );
  }

  // =========================================
  // ERROR
  // =========================================

  if (error || !memorial) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-5xl">
            🕯️
          </div>

          <h1 className="text-2xl font-semibold text-slate-800">
            Меморіал не знайдено
          </h1>

          <p className="mt-3 text-slate-500">
            Можливо, посилання неправильне
            або меморіал ще не створений.
          </p>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="mt-6 rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            На головну
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-[#f7f5f0] text-slate-800">

        {/* HEADER */}

        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-5">
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

            <button
              type="button"
              onClick={shareMemorial}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Поділитися
            </button>
          </div>
        </header>

        <section className="px-4 py-8 md:py-12">
          <div className="mx-auto max-w-5xl">

            <div className="overflow-hidden rounded-3xl bg-white shadow-sm">

              {/* ОСНОВНЕ ФОТО */}

              {memorial.photo_url ? (
                <div className="bg-slate-100">
                  <img
                    src={memorial.photo_url}
                    alt={memorial.name}
                    className="mx-auto max-h-[620px] w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center bg-slate-100 md:h-80">
                  <div className="text-center">
                    <div className="text-6xl">
                      🕯️
                    </div>

                    <p className="mt-3 text-sm text-slate-400">
                      Світла пам&apos;ять
                    </p>
                  </div>
                </div>
              )}

              {/* ІНФОРМАЦІЯ */}

              <div className="px-5 py-8 md:px-10 md:py-10">

                <div className="text-center">

                  <div className="text-sm uppercase tracking-[0.25em] text-slate-400">
                    У пам&apos;ять про
                  </div>

                  <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-5xl">
                    {memorial.name}
                  </h1>

                  {(memorial.birth_date ||
                    memorial.death_date) && (
                    <p className="mt-4 text-lg text-slate-500">
                      {formatDate(
                        memorial.birth_date
                      )}

                      {memorial.birth_date &&
                      memorial.death_date
                        ? " — "
                        : ""}

                      {formatDate(
                        memorial.death_date
                      )}
                    </p>
                  )}

                  {/* ТАРИФ */}

                  <div className="mt-6 flex justify-center">
                    <div className="rounded-full border border-slate-200 bg-slate-50 px-5 py-2 text-sm font-semibold text-slate-700">
                      {isClassic
                        ? "Classic — 1999 грн"
                        : `Тариф: ${memorial.plan || "Не вказано"}`}
                    </div>
                  </div>
                </div>

                {/* ІСТОРІЯ */}

                {memorial.story && (
                  <div className="mx-auto mt-10 max-w-3xl">
                    <div className="mb-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Життєва історія
                    </div>

                    <div className="whitespace-pre-wrap text-center text-base leading-8 text-slate-600 md:text-lg">
                      {memorial.story}
                    </div>
                  </div>
                )}

                {/* ❤️ ПІДТРИМКА ПАМ'ЯТІ */}

                <section className="mx-auto mt-10 max-w-2xl rounded-3xl bg-[#fff9f9] p-6 text-center shadow-sm md:p-8">

                  <div
                    className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full transition-all duration-500 ${
                      liked
                        ? "bg-red-100 shadow-[0_0_35px_rgba(239,68,68,0.25)]"
                        : "bg-white"
                    }`}
                  >
                    <div
                      className={`text-5xl transition-all duration-500 ${
                        liked
                          ? "scale-110"
                          : "opacity-80"
                      }`}
                    >
                      ❤️
                    </div>
                  </div>

                  <h2 className="mt-5 text-2xl font-bold text-slate-900">
                    Підтримати пам&apos;ять
                  </h2>

                  <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
                    Залиште своє серце на знак
                    пам&apos;яті, любові та поваги.
                  </p>

                  <button
                    type="button"
                    onClick={supportMemory}
                    disabled={
                      likeLoading ||
                      liked
                    }
                    className={`mt-6 rounded-xl px-8 py-3 text-sm font-semibold text-white transition ${
                      liked
                        ? "bg-red-500"
                        : "bg-slate-900 hover:bg-slate-700"
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {likeLoading
                      ? "Зберігаємо..."
                      : liked
                      ? "❤️ Пам'ять підтримано"
                      : "❤️ Підтримати пам'ять"}
                  </button>

                  <div className="mt-5 text-sm text-slate-500">
                    Сердець залишено:{" "}
                    <span className="font-bold text-slate-800">
                      {likesCount}
                    </span>
                  </div>

                  {likeError && (
                    <div className="mx-auto mt-5 max-w-xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700">
                      <div className="font-semibold">
                        Не вдалося залишити ❤️
                      </div>

                      <div className="mt-1 break-words">
                        {likeError}
                      </div>
                    </div>
                  )}
                </section>

                {/* СВІЧКА */}

                <div className="mx-auto mt-10 max-w-2xl rounded-3xl bg-[#faf8f3] p-6 text-center shadow-sm md:p-8">

                  <div
                    className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full transition-all duration-500 ${
                      candleLit
                        ? "bg-amber-100 shadow-[0_0_35px_rgba(245,158,11,0.35)]"
                        : "bg-slate-100"
                    }`}
                  >
                    <div
                      className={`text-6xl transition-all duration-500 ${
                        candleLit
                          ? "scale-110"
                          : "opacity-80"
                      }`}
                    >
                      🕯️
                    </div>
                  </div>

                  <h2 className="mt-5 text-2xl font-bold text-slate-900">
                    Свічка пам&apos;яті
                  </h2>

                  <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
                    Запаліть свічку на знак
                    пам&apos;яті та поваги.
                  </p>

                  <button
                    type="button"
                    onClick={lightCandle}
                    disabled={candleLoading}
                    className={`mt-6 rounded-xl px-7 py-3 text-sm font-semibold text-white transition ${
                      candleLit
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-slate-900 hover:bg-slate-700"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {candleLoading
                      ? "Запалюємо..."
                      : candleLit
                      ? "🕯️ Свічку запалено"
                      : "🕯️ Запалити свічку"}
                  </button>

                  <div className="mt-5 text-sm text-slate-500">
                    Свічок запалено:{" "}
                    <span className="font-bold text-slate-800">
                      {candlesCount}
                    </span>
                  </div>

                  {candleError && (
                    <div className="mx-auto mt-5 max-w-xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700">
                      <div className="font-semibold">
                        Не вдалося запалити свічку.
                      </div>

                      <div className="mt-1 break-words">
                        {candleError}
                      </div>
                    </div>
                  )}
                </div>

                <div className="my-10 border-t border-slate-200" />

                {/* ФОТОГАЛЕРЕЯ */}

                <section className="mt-4">

                  <div className="text-center">

                    <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Спогади
                    </div>

                    <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
                      Фотогалерея
                    </h2>

                    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
                      Фотографії, які зберігають
                      важливі моменти життя та
                      пам&apos;ять про людину.
                    </p>
                  </div>

                  {galleryLoading ? (
                    <div className="mt-8 rounded-2xl bg-slate-50 p-10 text-center">
                      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />

                      <p className="mt-3 text-sm text-slate-500">
                        Завантаження фотографій...
                      </p>
                    </div>
                  ) : photos.length === 0 ? (
                    <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                      <div className="text-5xl">
                        📷
                      </div>

                      <p className="mt-4 font-medium text-slate-700">
                        Фотографій поки немає
                      </p>

                      {isOwner && (
                        <p className="mt-2 text-sm text-slate-500">
                          Додайте фотографії через
                          редагування меморіалу.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {photos.map(
                        (photo) => (
                          <div
                            key={photo.id}
                            className="group relative overflow-hidden rounded-2xl bg-slate-100"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedPhoto(
                                  photo
                                )
                              }
                              className="block aspect-square w-full"
                            >
                              <img
                                src={
                                  photo.photo_url
                                }
                                alt="Фото з меморіалу"
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              />
                            </button>

                            {isOwner && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeletePhoto(
                                    photo
                                  )
                                }
                                className="absolute right-2 top-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-sm transition group-hover:opacity-100"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </section>

                <div className="my-10 border-t border-slate-200" />

                {/* КНИГА ПАМ'ЯТІ */}

                <section className="mt-4">

                  <div className="text-center">

                    <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Пам&apos;ять
                    </div>

                    <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
                      📖 Книга пам&apos;яті
                    </h2>

                    <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                      Залиште кілька теплих слів або
                      спогад у пам&apos;ять про цю людину.
                    </p>
                  </div>

                  <div className="mx-auto mt-8 max-w-2xl rounded-3xl bg-[#faf8f3] p-6 shadow-sm md:p-8">

                    <h3 className="text-lg font-semibold text-slate-900">
                      Залишити запис
                    </h3>

                    <div className="mt-5">

                      <label
                        htmlFor="authorName"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Ваше ім&apos;я
                      </label>

                      <input
                        id="authorName"
                        type="text"
                        value={authorName}
                        onChange={(event) =>
                          setAuthorName(
                            event.target.value
                          )
                        }
                        placeholder="Ваше ім'я"
                        maxLength={100}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      />
                    </div>

                    <div className="mt-5">

                      <label
                        htmlFor="memoryMessage"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Ваші слова пам&apos;яті
                      </label>

                      <textarea
                        id="memoryMessage"
                        value={messageText}
                        onChange={(event) =>
                          setMessageText(
                            event.target.value
                          )
                        }
                        placeholder="Напишіть слова пам'яті..."
                        maxLength={2000}
                        rows={5}
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      />

                      <div className="mt-2 text-right text-xs text-slate-400">
                        {messageText.length}/2000
                      </div>
                    </div>

                    {messageError && (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {messageError}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={addMemoryMessage}
                      disabled={messageLoading}
                      className="mt-5 w-full rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {messageLoading
                        ? "Зберігаємо..."
                        : "💬 Залишити запис"}
                    </button>
                  </div>

                  <div className="mx-auto mt-8 max-w-3xl">

                    {messagesLoading ? (
                      <div className="rounded-2xl bg-slate-50 p-10 text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />

                        <p className="mt-3 text-sm text-slate-500">
                          Завантаження записів...
                        </p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                        <div className="text-5xl">
                          💭
                        </div>

                        <p className="mt-4 font-medium text-slate-700">
                          Поки що записів немає
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          Будьте першим, хто залишить
                          слова пам&apos;яті.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map(
                          (item) => (
                            <article
                              key={item.id}
                              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
                            >
                              <div className="flex items-start justify-between gap-4">

                                <div>
                                  <div className="font-semibold text-slate-900">
                                    {item.author_name}
                                  </div>

                                  {item.created_at && (
                                    <div className="mt-1 text-xs text-slate-400">
                                      {formatMessageDate(
                                        item.created_at
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">

                                  <div className="text-xl">
                                    🕊️
                                  </div>

                                  {isOwner && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        deleteMemoryMessage(
                                          item
                                        )
                                      }
                                      className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-700"
                                    >
                                      🗑️
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                                {item.message}
                              </div>
                            </article>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </section>

                <div className="my-10 border-t border-slate-200" />

                {/* АРХІВ ПАМ'ЯТІ */}

                <section className="mt-4">

                  <div className="text-center">

                    <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Документи та спогади
                    </div>

                    <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
                      📁 Архів пам&apos;яті
                    </h2>

                    <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                      Тут можна зберігати документи,
                      фотографії, листи, скани та інші
                      важливі матеріали, пов&apos;язані
                      з пам&apos;яттю про людину.
                    </p>
                  </div>

                  {/* ЗАВАНТАЖЕННЯ */}

                  {isOwner && (
                    <div className="mx-auto mt-8 max-w-2xl rounded-3xl bg-[#faf8f3] p-6 shadow-sm md:p-8">

                      <h3 className="text-lg font-semibold text-slate-900">
                        Додати файл до архіву
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Виберіть файл зі свого комп&apos;ютера.
                      </p>

                      <div className="mt-5">

                        <label
                          htmlFor="archive-file"
                          className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center transition hover:border-slate-500 hover:bg-slate-50"
                        >
                          <div className="text-4xl">
                            📎
                          </div>

                          <div className="mt-3 text-sm font-medium text-slate-700">
                            {archiveFile
                              ? archiveFile.name
                              : "Натисніть, щоб вибрати файл"}
                          </div>

                          {archiveFile && (
                            <div className="mt-2 text-xs text-slate-400">
                              {formatFileSize(
                                archiveFile.size
                              )}
                            </div>
                          )}

                          {!archiveFile && (
                            <div className="mt-2 text-xs text-slate-400">
                              Документи, PDF, фотографії та інші файли
                            </div>
                          )}
                        </label>

                        <input
                          id="archive-file"
                          type="file"
                          className="hidden"
                          onChange={(event) => {
                            const file =
                              event.target.files?.[0] ??
                              null;

                            setArchiveFile(file);
                            setArchiveError("");
                          }}
                        />
                      </div>

                      {archiveError && (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {archiveError}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleArchiveUpload}
                        disabled={
                          archiveUploadLoading ||
                          !archiveFile
                        }
                        className="mt-5 w-full rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {archiveUploadLoading
                          ? "Завантажуємо..."
                          : "📤 Додати файл до архіву"}
                      </button>
                    </div>
                  )}

                  {/* СПИСОК ФАЙЛІВ */}

                  <div className="mx-auto mt-8 max-w-3xl">

                    {archiveLoading ? (
                      <div className="rounded-2xl bg-slate-50 p-10 text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />

                        <p className="mt-3 text-sm text-slate-500">
                          Завантаження архіву...
                        </p>
                      </div>
                    ) : archiveFiles.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">

                        <div className="text-5xl">
                          📁
                        </div>

                        <p className="mt-4 font-medium text-slate-700">
                          Архів поки порожній
                        </p>

                        {isOwner ? (
                          <p className="mt-2 text-sm text-slate-500">
                            Додайте перший важливий файл
                            до архіву пам&apos;яті.
                          </p>
                        ) : (
                          <p className="mt-2 text-sm text-slate-500">
                            Власник меморіалу ще не додав
                            файлів до архіву.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">

                        {archiveFiles.map(
                          (file) => (
                            <div
                              key={file.id}
                              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                            >

                              <div className="flex min-w-0 items-center gap-4">

                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-3xl">
                                  {getArchiveIcon(
                                    file
                                  )}
                                </div>

                                <div className="min-w-0">

                                  <div className="truncate font-semibold text-slate-900">
                                    {file.file_name}
                                  </div>

                                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">

                                    <span>
                                      {formatFileSize(
                                        file.file_size
                                      )}
                                    </span>

                                    {file.created_at && (
                                      <span>
                                        Додано:{" "}
                                        {formatMessageDate(
                                          file.created_at
                                        )}
                                      </span>
                                    )}

                                  </div>
                                </div>
                              </div>

                              <div className="flex shrink-0 gap-2">

                                <button
                                  type="button"
                                  onClick={() =>
                                    openArchiveFile(
                                      file
                                    )
                                  }
                                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-slate-700"
                                >
                                  👁️ Відкрити
                                </button>

                                {isOwner && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteArchiveFile(
                                        file
                                      )
                                    }
                                    className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-red-700"
                                  >
                                    🗑️
                                  </button>
                                )}

                              </div>
                            </div>
                          )
                        )}

                      </div>
                    )}
                  </div>
                </section>

                <div className="my-10 border-t border-slate-200" />

                {/* INFO + QR */}

                <div className="grid gap-8 md:grid-cols-2">

                  {/* INFO */}

                  <div className="rounded-2xl bg-slate-50 p-6 text-center">

                    <h2 className="text-lg font-semibold text-slate-800">
                      Цифровий меморіал
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Ця сторінка зберігає
                      пам&apos;ять про людину та
                      доступна за унікальним
                      посиланням MEMORYUA.
                    </p>

                    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">

                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Поточний тариф
                      </div>

                      <div className="mt-2 text-xl font-bold text-slate-900">
                        {isClassic
                          ? "Classic"
                          : memorial.plan ||
                            "Не вказано"}
                      </div>

                      {isClassic && (
                        <div className="mt-1 text-sm text-slate-500">
                          1999 грн
                        </div>
                      )}
                    </div>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={goToEdit}
                        className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                      >
                        ✏️ Редагувати меморіал
                      </button>
                    )}

                    {!isOwner && (
                      <p className="mt-5 text-xs text-slate-400">
                        Перегляд меморіалу
                        доступний усім.
                      </p>
                    )}

                  </div>

                  {/* QR */}

                  <div className="rounded-2xl bg-slate-50 p-6 text-center">

                    <h2 className="text-lg font-semibold text-slate-800">
                      QR-код пам&apos;яті
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Відскануйте QR-код, щоб
                      відкрити цей цифровий
                      меморіал.
                    </p>

                    <div
                      ref={qrRef}
                      className="mx-auto mt-5 flex w-fit rounded-2xl bg-white p-4 shadow-sm"
                    >
                      <QRCodeSVG
                        value={getMemorialUrl()}
                        size={180}
                        bgColor="#ffffff"
                        fgColor="#0f172a"
                        level="H"
                        includeMargin
                      />
                    </div>

                    <button
                      type="button"
                      onClick={downloadQR}
                      className="mt-5 rounded-xl bg-slate-900 px-6 py-3 text-sm text-white transition hover:bg-slate-700"
                    >
                      ↓ Завантажити QR-код
                    </button>

                    {isOwner && (
                      <div className="mt-6 flex flex-col items-center gap-3">

                        <button
                          type="button"
                          onClick={goToEdit}
                          className="w-full max-w-xs rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                          ✏️ Редагувати меморіал
                        </button>

                        <button
                          type="button"
                          onClick={
                            handleDeleteMemorial
                          }
                          className="w-full max-w-xs rounded-xl bg-red-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-red-700"
                        >
                          🗑️ Видалити меморіал
                        </button>

                      </div>
                    )}

                    <p className="mt-3 text-[11px] text-slate-400">
                      QR-код можна передати
                      для друку на пам&apos;ятній
                      табличці.
                    </p>

                  </div>
                </div>

              </div>
            </div>

            <div className="mt-8 text-center text-xs text-slate-400">
              MEMORYUA — цифрова пам&apos;ять
              для майбутніх поколінь
            </div>

          </div>
        </section>
      </main>

      {/* ВЕЛИКЕ ФОТО */}

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() =>
            setSelectedPhoto(null)
          }
        >
          <button
            type="button"
            onClick={() =>
              setSelectedPhoto(null)
            }
            className="absolute right-4 top-4 rounded-full bg-white/90 px-4 py-2 text-xl text-slate-900 shadow-lg"
          >
            ✕
          </button>

          <img
            src={
              selectedPhoto.photo_url
            }
            alt="Фотографія"
            className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          />
        </div>
      )}
    </>
  );
}