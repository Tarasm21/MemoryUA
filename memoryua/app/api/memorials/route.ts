import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  try {
    if (
      !supabaseUrl ||
      !supabasePublishableKey ||
      !supabaseServiceRoleKey
    ) {
      return NextResponse.json(
        {
          error:
            "Не налаштовані змінні Supabase.",
        },
        { status: 500 }
      );
    }

    /*
     * --------------------------------------------------
     * 1. Отримуємо Authorization header від користувача
     * --------------------------------------------------
     */

    const authorization =
      request.headers.get("authorization");

    if (!authorization) {
      return NextResponse.json(
        {
          error:
            "Користувач не авторизований. Увійдіть у свій акаунт.",
        },
        { status: 401 }
      );
    }

    /*
     * --------------------------------------------------
     * 2. Створюємо звичайний Supabase client
     *    для перевірки JWT користувача
     * --------------------------------------------------
     */

    const supabaseAuth = createClient(
      supabaseUrl,
      supabasePublishableKey,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      console.error(
        "MEMORYUA AUTH ERROR:",
        authError
      );

      return NextResponse.json(
        {
          error:
            "Не вдалося підтвердити користувача. Увійдіть в акаунт ще раз.",
        },
        { status: 401 }
      );
    }

    console.log(
      "MEMORYUA CREATE USER ID:",
      user.id
    );

    /*
     * --------------------------------------------------
     * 3. Створюємо Admin client
     * --------------------------------------------------
     */

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey
    );

    /*
     * --------------------------------------------------
     * 4. Отримуємо дані форми
     * --------------------------------------------------
     */

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const birth_date =
      typeof body.birth_date === "string" &&
      body.birth_date.trim()
        ? body.birth_date
        : null;

    const death_date =
      typeof body.death_date === "string" &&
      body.death_date.trim()
        ? body.death_date
        : null;

    const story =
      typeof body.story === "string" &&
      body.story.trim()
        ? body.story.trim()
        : null;

    if (!name) {
      return NextResponse.json(
        {
          error:
            "Введіть ім'я людини.",
        },
        { status: 400 }
      );
    }

    /*
     * --------------------------------------------------
     * 5. Створюємо меморіал
     *
     * ГОЛОВНА ЗМІНА:
     * user_id: user.id
     * --------------------------------------------------
     */

    const {
      data: memorial,
      error: insertError,
    } = await supabaseAdmin
      .from("memorials")
      .insert({
        user_id: user.id,
        name,
        birth_date,
        death_date,
        story,
        plan: "classic",
      })
      .select("id, user_id")
      .single();

    if (insertError) {
      console.error(
        "MEMORYUA SUPABASE CREATE ERROR:",
        insertError
      );

      return NextResponse.json(
        {
          error: insertError.message,
        },
        { status: 500 }
      );
    }

    if (!memorial?.id) {
      return NextResponse.json(
        {
          error:
            "Меморіал створено, але ID не отримано.",
        },
        { status: 500 }
      );
    }

    console.log(
      "MEMORYUA MEMORIAL CREATED:",
      memorial.id
    );

    console.log(
      "MEMORYUA MEMORIAL OWNER:",
      memorial.user_id
    );

    /*
     * --------------------------------------------------
     * 6. Успішна відповідь
     * --------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,
        id: memorial.id,
        user_id: memorial.user_id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "MEMORYUA API CREATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не вдалося створити меморіал.",
      },
      { status: 500 }
    );
  }
}