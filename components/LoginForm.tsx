"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";

export function LoginForm() {
  const [error, action, pending] = useActionState(login, null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="field"
          placeholder="you@example.com"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="field"
          placeholder="••••••••"
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn-primary mt-2" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
