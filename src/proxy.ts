import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Production-grade proxy:
 * 1. Reads required env vars at module init. If any are missing, every request
 *    is short-circuited with a clear HTML page naming exactly what's missing
 *    and where to fix it — no log-diving required.
 * 2. Wraps the auth flow in a try/catch that surfaces the actual error in
 *    Vercel logs while returning a clean error page to the user.
 * 3. Excludes `/api/health` so that endpoint stays callable even when auth
 *    middleware can't initialize (sanity check during deploy).
 */

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

type EnvKey = (typeof REQUIRED_ENV)[number];

function missingEnvVars(): EnvKey[] {
  return REQUIRED_ENV.filter((k) => !process.env[k]);
}

function configErrorPage(missing: EnvKey[]): NextResponse {
  const html = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Server misconfigured · TerraFlow Ops</title>
<style>
  :root { color-scheme: dark; }
  html, body { margin: 0; padding: 0; background: #0A0A0A; color: #FAFAFA;
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    min-height: 100vh; line-height: 1.6; }
  main { max-width: 36rem; margin: 0 auto; padding: 4rem 1.5rem; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 999px;
    background: rgba(239,68,68,0.1); color: #EF4444; font-size: 11px;
    text-transform: uppercase; letter-spacing: 0.18em; }
  h1 { font-size: 1.875rem; letter-spacing: -0.025em; margin: 1rem 0 0.5rem; }
  p { color: #D4D4D4; margin: 0.5rem 0; }
  ul { list-style: none; padding: 0; margin: 1.5rem 0; }
  li { padding: 0.75rem 1rem; border: 1px solid #262626; border-radius: 8px;
    margin-bottom: 0.5rem; font-family: ui-monospace, monospace;
    font-size: 0.875rem; color: #FAFAFA; background: #111111; }
  .step { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #262626; }
  .step h2 { font-size: 0.6875rem; text-transform: uppercase;
    letter-spacing: 0.18em; color: #A3A3A3; font-weight: 500; margin: 0 0 0.75rem; }
  code { background: #171717; padding: 1px 6px; border-radius: 4px;
    font-size: 0.8125rem; color: #D4FF3D; }
  a { color: #D4FF3D; }
</style>
</head>
<body>
<main>
  <span class="badge">Server misconfigured</span>
  <h1>Missing environment variables</h1>
  <p>TerraFlow Ops can't start because the following Vercel environment
     variables aren't set on this deployment:</p>
  <ul>${missing.map((k) => `<li>${k}</li>`).join("")}</ul>

  <div class="step">
    <h2>Fix · 60 seconds</h2>
    <p>1. Open your Vercel project &rarr; <strong>Settings &rarr; Environment Variables</strong>.</p>
    <p>2. Add each missing variable above. Tick all three scopes (Production, Preview, Development).</p>
    <p>3. Go to <strong>Deployments</strong> &rarr; latest &rarr; <code>&hellip;</code> &rarr; <strong>Redeploy</strong>.</p>
    <p>Values live in your local <code>.env.local</code>. Reference docs:
       <a href="https://supabase.com/dashboard/project/_/settings/api">Supabase API settings</a>.</p>
  </div>
</main>
</body>
</html>`;

  return new NextResponse(html, {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function runtimeErrorPage(message: string): NextResponse {
  const html = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Auth error · TerraFlow Ops</title>
<style>
  :root { color-scheme: dark; }
  html, body { margin: 0; padding: 0; background: #0A0A0A; color: #FAFAFA;
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    min-height: 100vh; line-height: 1.6; }
  main { max-width: 36rem; margin: 0 auto; padding: 4rem 1.5rem; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 999px;
    background: rgba(239,68,68,0.1); color: #EF4444; font-size: 11px;
    text-transform: uppercase; letter-spacing: 0.18em; }
  h1 { font-size: 1.875rem; letter-spacing: -0.025em; margin: 1rem 0 0.5rem; }
  p { color: #D4D4D4; margin: 0.5rem 0; }
  pre { padding: 1rem; border: 1px solid #262626; border-radius: 8px;
    background: #111111; overflow-x: auto; font-size: 0.8125rem;
    color: #FAFAFA; white-space: pre-wrap; }
  a { color: #D4FF3D; }
</style>
</head>
<body>
<main>
  <span class="badge">Auth middleware error</span>
  <h1>Couldn't establish a session</h1>
  <p>The auth middleware tried to talk to Supabase and failed. The full
     error is below; check the Vercel runtime logs for a stack trace.</p>
  <pre>${message.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>
  <p><a href="/login">Try the sign-in page directly &rarr;</a></p>
</main>
</body>
</html>`;
  return new NextResponse(html, {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function handle(request: NextRequest) {
  const missing = missingEnvVars();
  if (missing.length > 0) {
    console.error(`[proxy] missing env vars: ${missing.join(", ")}`);
    return configErrorPage(missing);
  }

  try {
    return await updateSession(request);
  } catch (e) {
    const msg = e instanceof Error ? `${e.message}\n\n${e.stack ?? ""}` : String(e);
    console.error(`[proxy] updateSession threw:`, e);
    return runtimeErrorPage(msg);
  }
}

export async function proxy(request: NextRequest) {
  return handle(request);
}

// Next 16 prefers `proxy` but `middleware` is still accepted; export both
// so the file works regardless of which name the runtime ultimately picks up.
export const middleware = proxy;

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image  (Next internals)
     * - api/health                 (sanity-check endpoint, must stay reachable)
     * - favicon.ico, robots.txt, sitemap.xml, manifest.webmanifest
     * - any file with an extension (svg, png, woff2, etc.)
     */
    "/((?!_next/static|_next/image|api/health|api/diagnostic|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.[^/]+$).*)",
  ],
};
