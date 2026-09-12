import type { LessonStatus } from "@/types/lesson";

export const lessonStatusLabel: Record<LessonStatus, string> = {
  scheduled: "待上課",
  completed: "已完成",
  cancelled: "已取消",
};

export const lessonStatusClassName: Record<LessonStatus, string> = {
  scheduled:
    "border border-amber-500/30 bg-amber-500/10 text-amber-300",
  completed:
    "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  cancelled:
    "border border-zinc-700 bg-zinc-800 text-zinc-500",
};