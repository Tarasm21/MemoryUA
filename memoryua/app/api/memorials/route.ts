import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        {
          error:
            "Не налаштовані NEXT_PUBLIC_SUPABASE_URL або SUPABASE_SERVICE_ROLE_KEY.",
        },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey
    );

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
          error: "Введіть ім'я людини.",
        },
        { status: 400 }
      );
    }

    const {
      data: memorial,
      error: insertError,
    } = await supabaseAdmin
      .from("memorials")
      .insert({
        name,
        birth_date,
        death_date,
        story,
        plan: "classic",
      })
      .select("id")
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

    return NextResponse.json(
      {
        success: true,
        id: memorial.id,
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