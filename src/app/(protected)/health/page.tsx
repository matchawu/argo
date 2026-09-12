import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "系統健檢",
};

export default async function HealthPage() {
  const supabase = await createClient();

  const [
    missingLessonLinksResult,
    duplicateStudentsResult,
    duplicateTeachersResult,
    enrollmentResult,
  ] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, student_id, teacher_id, teacher_share"),

    supabase
      .from("students")
      .select("id, name"),

    supabase
      .from("teachers")
      .select("id, name"),

    supabase
      .from("enrollments")
      .select(`
        id,
        active,
        student_id,
        teacher_id,
        students (
          id,
          name,
          active
        ),
        teachers (
          id,
          name,
          active
        )
      `),
  ]);

  const queryErrors = [
    missingLessonLinksResult.error,
    duplicateStudentsResult.error,
    duplicateTeachersResult.error,
    enrollmentResult.error,
  ].filter(Boolean);

  if (queryErrors.length > 0) {
    return (
      <main className="min-h-screen text-zinc-100">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <h1 className="text-3xl font-bold">
            系統健檢
          </h1>

          <div className="mt-8 rounded-2xl border border-red-900 bg-red-950/30 p-5">
            <p className="font-medium text-red-300">
              健檢資料讀取失敗
            </p>

            <div className="mt-3 space-y-2 text-sm text-red-400">
              {queryErrors.map((error, index) => (
                <p key={index}>
                  {error?.message}
                </p>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const lessons =
    missingLessonLinksResult.data ?? [];

  const students =
    duplicateStudentsResult.data ?? [];

  const teachers =
    duplicateTeachersResult.data ?? [];

  const enrollments =
    enrollmentResult.data ?? [];

  const lessonsMissingStudent = lessons.filter(
    (lesson) => lesson.student_id === null,
  );

  const lessonsMissingTeacher = lessons.filter(
    (lesson) => lesson.teacher_id === null,
  );

  const lessonsMissingTeacherShare = lessons.filter(
    (lesson) => lesson.teacher_share === null,
  );

  const studentNameCounts = new Map<string, number>();

  for (const student of students) {
    studentNameCounts.set(
      student.name,
      (studentNameCounts.get(student.name) ?? 0) + 1,
    );
  }

  const duplicateStudentNames = Array.from(
    studentNameCounts.entries(),
  ).filter(([, count]) => count > 1);

  const teacherNameCounts = new Map<string, number>();

  for (const teacher of teachers) {
    teacherNameCounts.set(
      teacher.name,
      (teacherNameCounts.get(teacher.name) ?? 0) + 1,
    );
  }

  const duplicateTeacherNames = Array.from(
    teacherNameCounts.entries(),
  ).filter(([, count]) => count > 1);

  const activeEnrollmentsWithInactiveStudent =
    enrollments.filter((enrollment) => {
      if (!enrollment.active) {
        return false;
      }

      const student = Array.isArray(enrollment.students)
        ? enrollment.students[0]
        : enrollment.students;

      return student?.active === false;
    });

  const activeEnrollmentsWithInactiveTeacher =
    enrollments.filter((enrollment) => {
      if (!enrollment.active) {
        return false;
      }

      const teacher = Array.isArray(enrollment.teachers)
        ? enrollment.teachers[0]
        : enrollment.teachers;

      return teacher?.active === false;
    });

  const checks = [
    {
      label: "課程缺少 student_id",
      count: lessonsMissingStudent.length,
    },
    {
      label: "課程缺少 teacher_id",
      count: lessonsMissingTeacher.length,
    },
    {
      label: "課程缺少 teacher_share",
      count: lessonsMissingTeacherShare.length,
    },
    {
      label: "重複學生姓名",
      count: duplicateStudentNames.length,
    },
    {
      label: "重複老師姓名",
      count: duplicateTeacherNames.length,
    },
    {
      label: "固定課程使用已停用學生",
      count:
        activeEnrollmentsWithInactiveStudent.length,
    },
    {
      label: "固定課程使用已停用老師",
      count:
        activeEnrollmentsWithInactiveTeacher.length,
    },
  ];

  const totalIssues = checks.reduce(
    (sum, check) => sum + check.count,
    0,
  );

  return (
    <main className="min-h-screen text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            系統健檢
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            檢查 Argo 目前的資料完整性
          </p>
        </div>

        <div
          className={
            totalIssues === 0
              ? "mb-8 rounded-2xl border border-emerald-900 bg-emerald-950/30 p-6"
              : "mb-8 rounded-2xl border border-amber-900 bg-amber-950/30 p-6"
          }
        >
          <p
            className={
              totalIssues === 0
                ? "text-lg font-semibold text-emerald-300"
                : "text-lg font-semibold text-amber-300"
            }
          >
            {totalIssues === 0
              ? "✓ 系統資料目前看起來正常"
              : `發現 ${totalIssues} 個資料問題`}
          </p>

          <p className="mt-2 text-sm text-zinc-400">
            這頁只做檢查，不會自動修改任何資料。
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {checks.map((check) => (
            <HealthCard
              key={check.label}
              label={check.label}
              count={check.count}
            />
          ))}
        </section>

        {(duplicateStudentNames.length > 0 ||
          duplicateTeacherNames.length > 0) && (
          <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-lg font-semibold">
              重複姓名
            </h2>

            {duplicateStudentNames.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-zinc-400">
                  學生
                </p>

                <div className="mt-2 space-y-1 text-sm text-zinc-300">
                  {duplicateStudentNames.map(
                    ([name, count]) => (
                      <p key={name}>
                        {name} × {count}
                      </p>
                    ),
                  )}
                </div>
              </div>
            )}

            {duplicateTeacherNames.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-zinc-400">
                  老師
                </p>

                <div className="mt-2 space-y-1 text-sm text-zinc-300">
                  {duplicateTeacherNames.map(
                    ([name, count]) => (
                      <p key={name}>
                        {name} × {count}
                      </p>
                    ),
                  )}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function HealthCard({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  const healthy = count === 0;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-zinc-400">
          {label}
        </p>

        <span
          className={
            healthy
              ? "rounded-full bg-emerald-950 px-2.5 py-1 text-xs font-medium text-emerald-400"
              : "rounded-full bg-amber-950 px-2.5 py-1 text-xs font-medium text-amber-300"
          }
        >
          {healthy ? "正常" : "注意"}
        </span>
      </div>

      <p className="mt-4 text-3xl font-semibold">
        {count}
      </p>
    </div>
  );
}