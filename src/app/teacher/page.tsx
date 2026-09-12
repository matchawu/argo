import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TeacherTodayView from "@/components/TeacherTodayView";
import { addDays, formatLocalDate, parseLocalDate, getTodayInTaiwan } from "@/lib/date";

export const metadata = {
  title: "我的課程",
};

type Props = {
  searchParams: Promise<{
    date?: string;
  }>;
};

function getMonday(date: Date) {
  const result = new Date(date);

  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + diff);

  return result;
}

export default async function TeacherPage({ searchParams }: Props) {
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

  if (
    profileError ||
    !profile ||
    profile.role !== "teacher" ||
    !profile.teacher_id
  ) {
    redirect("/");
  }

  const params = await searchParams;

  const selectedDate = params.date ?? getTodayInTaiwan();

  const monday = getMonday(parseLocalDate(selectedDate));

  const weekStart = formatLocalDate(monday);
  const weekEnd = addDays(weekStart, 6);

  const [
    { data: lessons, error: lessonsError },
    { count: weekLessonCount, error: weekError },
  ] = await Promise.all([
    supabase
      .from("lessons")
      .select(
        `
      id,
      student,
      teacher,
      course,
      lesson_date,
      lesson_time,
      price,
      status,
      lesson_note
    `,
      )
      .eq("teacher_id", profile.teacher_id)
      .eq("lesson_date", selectedDate)
      .order("lesson_time", {
        ascending: true,
      }),

    supabase
      .from("lessons")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("teacher_id", profile.teacher_id)
      .gte("lesson_date", weekStart)
      .lte("lesson_date", weekEnd)
      .neq("status", "cancelled"),
  ]);

  if (lessonsError || weekError) {
    return (
      <main className="p-10 text-zinc-100">
        <h1>讀取課程失敗</h1>

        <p>{lessonsError?.message ?? weekError?.message}</p>
      </main>
    );
  }

  return (
    <TeacherTodayView
      lessons={(lessons ?? []).map((lesson) => ({
        id: lesson.id,
        student: lesson.student,
        teacher: lesson.teacher,
        course: lesson.course,
        date: lesson.lesson_date,
        time: lesson.lesson_time.slice(0, 5),
        price: lesson.price,
        status: lesson.status,
        lessonNote: lesson.lesson_note,
      }))}
      selectedDate={selectedDate}
      weekLessonCount={weekLessonCount ?? 0}
    />
  );
}
