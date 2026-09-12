import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatLocalDate } from "@/lib/date";
import TeacherTodayView from "@/components/TeacherTodayView";

export const metadata = {
  title: "我的課程",
};

export default async function TeacherPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, teacher_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  if (profile.role !== "teacher" || !profile.teacher_id) {
    redirect("/");
  }

  const today = formatLocalDate(new Date());

  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select(`
      id,
      student,
      course,
      lesson_date,
      lesson_time,
      price,
      status
    `)
    .eq("teacher_id", profile.teacher_id)
    .eq("lesson_date", today)
    .order("lesson_time", {
      ascending: true,
    });

  if (lessonsError) {
    return (
      <main className="p-10 text-zinc-100">
        <h1>讀取今日課程失敗</h1>
        <p>{lessonsError.message}</p>
      </main>
    );
  }

  return (
    <TeacherTodayView
      lessons={(lessons ?? []).map((lesson) => ({
        id: lesson.id,
        student: lesson.student,
        course: lesson.course,
        date: lesson.lesson_date,
        time: lesson.lesson_time.slice(0, 5),
        price: lesson.price,
        status: lesson.status,
      }))}
      today={today}
    />
  );
}