import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

// Next 16 renamed `middleware.ts` -> `proxy.ts`. Same API, same matcher.
// Function may be exported as `middleware` or `proxy`; we export both
// so the rename works regardless of which name Next 16.x prefers.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const middleware = proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, manifest.webmanifest, sitemap.xml
     * - any file with an extension (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest.webmanifest|sitemap.xml|.*\\.[^/]+$).*)",
  ],
};
