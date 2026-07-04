import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Sign out error", error);
      }
    }

    return NextResponse.json({ redirectTo: "/login" }, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Unexpected sign out error", error);
    }

    return NextResponse.json(
      { error: "Unable to sign out right now." },
      { status: 500 },
    );
  }
}
