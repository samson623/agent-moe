import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirectTo") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/";
      return NextResponse.redirect(new URL(safeRedirect, requestUrl.origin));
    }
  }

  const loginUrl = new URL("/login", requestUrl.origin);
  loginUrl.searchParams.set("error", "google_sign_in_failed");
  if (redirectTo.startsWith("/")) {
    loginUrl.searchParams.set("redirectTo", redirectTo);
  }

  return NextResponse.redirect(loginUrl);
}
