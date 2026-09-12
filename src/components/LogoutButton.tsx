"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(error);
      alert("登出失敗");
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
    >
      登出
    </button>
  );
}