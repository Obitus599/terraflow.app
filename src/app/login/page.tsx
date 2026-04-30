import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <div className="mb-12 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-accent font-display text-base font-semibold text-bg">
            T
          </span>
          <span className="font-display text-base font-medium tracking-tight text-text">
            TerraFlow Ops
          </span>
        </div>

        <h1 className="mb-1 font-display text-2xl font-medium tracking-tight text-text">
          Sign in
        </h1>
        <p className="mb-8 text-text-3">
          Use the credentials Alex set up for you.
        </p>

        <LoginForm />
      </div>
    </main>
  );
}
