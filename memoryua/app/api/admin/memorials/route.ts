import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "tarasmb24@gmail.com";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are missing");
  }

  return createClient(url, key);
}

async function checkAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "").trim();

  const supabase = getAdminClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return null;
  }

  return user;
}

export async function GET(request: Request) {
  try {
    const user = await checkAdmin(request);

    if (!user) {
      return NextResponse.json(
        { error: "Доступ заборонено" },
        { status: 403 }
      );
    }

    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("memorials")
      .select(
        "id, user_id, name, created_at, is_blocked"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin memorials GET error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const memorials = data || [];

    const userIds = [
      ...new Set(
        memorials
          .map((memorial) => memorial.user_id)
          .filter(Boolean)
      ),
    ];

    const owners: Record<string, string> = {};

    for (const userId of userIds) {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.admin.getUserById(userId);

      if (!userError && userData.user) {
        owners[userId] = userData.user.email || "Без email";
      }
    }

    const result = memorials.map((memorial) => ({
      ...memorial,
      owner_email: owners[memorial.user_id] || "Невідомий власник",
    }));

    return NextResponse.json({
      memorials: result,
    });
  } catch (error) {
    console.error("Admin API error:", error);

    return NextResponse.json(
      { error: "Помилка сервера" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await checkAdmin(request);

    if (!user) {
      return NextResponse.json(
        { error: "Доступ заборонено" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const memorialId = body?.id;
    const isBlocked = body?.is_blocked;

    if (!memorialId || typeof isBlocked !== "boolean") {
      return NextResponse.json(
        { error: "Неправильні дані" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("memorials")
      .update({
        is_blocked: isBlocked,
      })
      .eq("id", memorialId)
      .select("id, is_blocked")
      .single();

    if (error) {
      console.error("Admin memorial PATCH error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      memorial: data,
    });
  } catch (error) {
    console.error("Admin PATCH error:", error);

    return NextResponse.json(
      { error: "Помилка сервера" },
      { status: 500 }
    );
  }
}