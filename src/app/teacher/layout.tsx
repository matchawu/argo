import TeacherNavbar from "@/components/TeacherNavbar";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <>
      <TeacherNavbar showAdminLink={profile?.role === "admin"} />
      {/* 手機底部分頁列的空間 */}
      <div className="pb-24 md:pb-0">{children}</div>
    </>
  );
}
