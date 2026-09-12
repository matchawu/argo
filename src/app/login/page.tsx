"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage("登入失敗，請確認 Email 與密碼");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
      >
        <h1 className="mb-2 text-3xl font-bold">Argo</h1>

        <p className="mb-6 text-sm text-zinc-500">
          工作室管理系統登入
        </p>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-zinc-800 px-4 py-3 outline-none"
            required
          />

          <input
            type="password"
            placeholder="密碼"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-zinc-800 px-4 py-3 outline-none"
            required
          />

          {errorMessage && (
            <p className="text-sm text-red-400">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white px-4 py-3 font-medium text-black disabled:opacity-50"
          >
            {loading ? "登入中..." : "登入"}
          </button>
        </div>
      </form>
    </main>
  );
}