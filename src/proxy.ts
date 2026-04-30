import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

// TEMPORARY: catch-all error reporter so we can see what's failing on Vercel.
// Remove once root cause is identified.
async function handle(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? (e.stack ?? "(no stack)") : "(no stack)";
    const body = [
      "PROXY DIAGNOSTIC — remove once fixed",
      "",
      `Error: ${msg}`,
      "",
      "Env presence:",
      `  NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "MISSING"}`,
      `  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "MISSING"}`,
      `  Anon key length: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length ?? 0}`,
      `  URL host: ${(() => {
        try {
          return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host;
        } catch {
          return "(invalid URL)";
        }
      })()}`,
      "",
      "Stack:",
      stack,
    ].join("\n");
    return new NextResponse(body, {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}

export async function proxy(request: NextRequest) {
  return handle(request);
}

export const middleware = proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest.webmanifest|sitemap.xml|.*\\.[^/]+$).*)",
  ],
};
