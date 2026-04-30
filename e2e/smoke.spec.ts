import { expect, test } from "@playwright/test";

// Smoke tests that don't require auth — they verify the public surface
// renders and the auth gate works. End-to-end signed-in flows are added
// in a follow-up commit once we have a test account with a known password
// stored in CI secrets.

test.describe("public smoke", () => {
  test("/api/health returns ok with all required env vars set", async ({
    request,
  }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.env.NEXT_PUBLIC_SUPABASE_URL).toBe("set");
    expect(body.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("set");
  });

  test("/ redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/login renders the sign-in form with brand", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Sign in/);
    await expect(page.getByText("TerraFlow Ops")).toBeVisible();
    await expect(
      page.getByLabel(/email/i).first(),
    ).toBeVisible();
    await expect(
      page.getByLabel(/password/i).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign in/i }),
    ).toBeVisible();
  });

  test("login form rejects empty submit with validation errors", async ({
    page,
  }) => {
    await page.goto("/login");
    await page
      .getByRole("button", { name: /sign in/i })
      .click();
    // The form's zod resolver shows inline errors; we just look for any
    // visible error text (don't pin to specific copy).
    await expect(page.getByText(/required|valid email/i).first()).toBeVisible();
  });
});
