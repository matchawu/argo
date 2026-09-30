import { createClient } from "@/lib/supabase/client";
import {
  addDays,
  getTodayInTaiwan,
  getWeekStart,
  parseLocalDate,
  formatLocalDate,
} from "@/lib/date";
import type { Enrollment } from "@/types/enrollment";

/*
 * 找出固定課程的第一堂（開課日當天或之後第一個上課星期）
 */
function getFirstLessonDate(enrollment: Enrollment) {
  const date = parseLocalDate(enrollment.start_date);

  let daysToAdd = enrollment.default_weekday - date.getDay();

  if (daysToAdd < 0) {
    daysToAdd += 7;
  }

  date.setDate(date.getDate() + daysToAdd);

  return formatLocalDate(date);
}

/*
 * 產生接下來 numberOfWeeks 週的課程
 *
 * - 從「最後一堂之後」與「今天」較晚者開始接續產生；
 *   還沒有任何課時，從第一堂開始。
 * - 隔週（interval_weeks = 2）以第一堂為基準，每 2 週一堂。
 * - 同一週已經有這筆固定課程的課（例如被改期過）就跳過，避免重複。
 */
export async function generateLessonsForEnrollment(
  enrollment: Enrollment,
  numberOfWeeks = 4,
) {
  const supabase = createClient();

  const intervalDays = 7 * (enrollment.interval_weeks ?? 1);
  const firstLessonDate = getFirstLessonDate(enrollment);

  /*
   * 只看固定課程產生的課；手動加的單堂課（is_extra）不影響排課
   */
  const { data: existingLessons, error: existingError } = await supabase
    .from("lessons")
    .select("lesson_date")
    .eq("enrollment_id", enrollment.id)
    .eq("is_extra", false);

  if (existingError) {
    throw existingError;
  }

  const existingDates = (existingLessons ?? []).map(
    (lesson) => lesson.lesson_date as string,
  );

  const lastLessonDate = existingDates.reduce<string | null>(
    (latest, date) => (!latest || date > latest ? date : latest),
    null,
  );

  const today = getTodayInTaiwan();

  const from = lastLessonDate
    ? [addDays(lastLessonDate, 1), today].sort().at(-1)!
    : firstLessonDate;

  const until = addDays(from, numberOfWeeks * 7);

  const weeksWithLesson = new Set(existingDates.map(getWeekStart));

  const dates: string[] = [];

  for (
    let date = firstLessonDate;
    date < until;
    date = addDays(date, intervalDays)
  ) {
    if (date < from) {
      continue;
    }

    if (enrollment.end_date && date > enrollment.end_date) {
      break;
    }

    if (weeksWithLesson.has(getWeekStart(date))) {
      continue;
    }

    dates.push(date);
  }

  if (dates.length === 0) {
    return [];
  }

  const lessonsToInsert = dates.map((date) => ({
    enrollment_id: enrollment.id,
    student_id: enrollment.student_id,
    teacher_id: enrollment.teacher_id,
    student: enrollment.students.name,
    teacher: enrollment.teachers.name,
    course: enrollment.course,
    lesson_date: date,
    lesson_time: enrollment.default_time,
    price: enrollment.price,
    teacher_share: enrollment.teachers.teacher_share,
    status: "scheduled",
  }));

  const { data, error } = await supabase
    .from("lessons")
    .upsert(lessonsToInsert, {
      onConflict: "enrollment_id,lesson_date",
      ignoreDuplicates: true,
    })
    .select();

  if (error) {
    throw error;
  }

  return data;
}
