import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Користувач не авторизований" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Не вдалося визначити користувача" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      name,
      birth_date,
      death_date,
      story,
      photo_url,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Ім'я є обов'язковим" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("memorials")
      .insert({
        name: name.trim(),
        birth_date: birth_date || null,
        death_date: death_date || null,
        story: story || null,
        photo_url: photo_url || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("API error:", error);

    return NextResponse.json(
      { error: "Внутрішня помилка сервера" },
      { status: 500 }
    );
  }
}