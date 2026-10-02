import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import { homeForRole } from "@/lib/authSession";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, teacher_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    redirect("/login");
  }

  /*
   * 老師 / 學生打開後台網址（例如從 LINE 圖文選單點「打開 Argo」）
   * 直接帶到自己的首頁
   */
  if (profile.role !== "admin") {
    redirect(homeForRole(profile.role));
  }

  return (
    <>
      <Navbar showTeacherLink={Boolean(profile.teacher_id)} />
      {children}
    </>
  );
}
