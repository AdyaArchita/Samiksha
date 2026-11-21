import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "File path is required." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data, error } = await supabase.storage
    .from("submission-files")
    .createSignedUrl(path, 300);
  if (error || !data) {
    return NextResponse.json({ error: "The file could not be opened." }, { status: 403 });
  }

  return NextResponse.redirect(data.signedUrl);
}
