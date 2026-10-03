"use client";

import { toast } from "sonner";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Student = {
  id: number;
  name: string;
  active: boolean;
};

type Props = {
  initialStudents: Student[];
};

export default function StudentManager({
  initialStudents,
}: Props) {

  const supabase = createClient();
  
  const [students, setStudents] =
    useState<Student[]>(initialStudents);

  const [name, setName] = useState("");

  async function addStudent(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    const { data, error } = await supabase
      .from("students")
      .insert({
        name: trimmedName,
        active: true,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      toast.error("新增學生失敗");
      return;
    }

    setStudents((currentStudents) => [
      ...currentStudents,
      data,
    ]);

    setName("");
  }

  async function toggleStudentActive(
    student: Student
  ) {
    const newActive = !student.active;

    const { error } = await supabase
      .from("students")
      .update({
        active: newActive,
      })
      .eq("id", student.id);

    if (error) {
      console.error(error);
      toast.error("更新學生狀態失敗");
      return;
    }

    setStudents((currentStudents) =>
      currentStudents.map((currentStudent) =>
        currentStudent.id === student.id
          ? {
              ...currentStudent,
              active: newActive,
            }
          : currentStudent
      )
    );
  }

  return (
    <main className="min-h-screen text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-8 text-3xl font-bold">
          學生管理
        </h1>

        <form
          onSubmit={addStudent}
          className="mb-8 flex gap-3"
        >
          <input
            type="text"
            placeholder="學生姓名"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="flex-1 rounded-xl bg-surface px-4 py-3 outline-none ring-1 ring-line focus:ring-foreground/30"
          />

          <button
            type="submit"
            className="rounded-xl bg-primary px-5 py-3 font-medium text-on-primary hover:bg-primary-hover"
          >
            ＋ 新增學生
          </button>
        </form>

        <div className="space-y-3">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between rounded-2xl border border-line bg-surface p-5"
            >
              <div>
                <Link
                  href={`/students/${student.id}`}
                  className="font-medium hover:underline"
                >
                  {student.name}
                </Link>

                <div className="mt-1 text-sm text-muted">
                  {student.active
                    ? "使用中"
                    : "已停用"}
                  {" · "}
                  <Link
                    href={`/students/${student.id}`}
                    className="text-muted underline hover:text-foreground"
                  >
                    繳費 / 登入設定
                  </Link>
                </div>
              </div>

              <button
                onClick={() =>
                  toggleStudentActive(student)
                }
                className={
                  student.active
                    ? "rounded-xl bg-fill px-4 py-2 text-sm text-foreground hover:bg-fill-strong"
                    : "rounded-xl bg-success-soft px-4 py-2 text-sm text-success hover:opacity-80"
                }
              >
                {student.active
                  ? "停用"
                  : "重新啟用"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}