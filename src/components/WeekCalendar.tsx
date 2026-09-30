import Link from "next/link";
import { addDays, getTodayInTaiwan, parseLocalDate } from "@/lib/date";
import type { LessonStatus } from "@/types/lesson";

export type CalendarLesson = {
  id: number;
  date: string;
  time: string;
  title: string;
  subtitle?: string;
  status: LessonStatus;
  href?: string;
};

type Props = {
  lessons: CalendarLesson[];
  startDate: string;
};

/*
 * 目前課程沒有記錄長度，一律當作 60 分鐘
 */
const LESSON_MINUTES = 60;
const HOUR_HEIGHT = 64;

const weekdayNames = ["日", "一", "二", "三", "四", "五", "六"];

const statusBlockClassName: Record<LessonStatus, string> = {
  scheduled: "border-amber-500/40 bg-amber-500/15 text-amber-100",
  completed: "border-emerald-500/40 bg-emerald-500/15 text-emerald-100",
  cancelled: "border-zinc-700 bg-zinc-800/60 text-zinc-500 line-through",
};

function toMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

/*
 * 同一天時間重疊的課並排顯示
 *
 * 把互相重疊的課分成一群，群內依序放進第一個空的欄位。
 */
function layoutDay(lessons: CalendarLesson[]) {
  const sorted = [...lessons].sort(
    (a, b) => toMinutes(a.time) - toMinutes(b.time),
  );

  const result: {
    lesson: CalendarLesson;
    lane: number;
    lanes: number;
  }[] = [];

  let cluster: { lesson: CalendarLesson; lane: number }[] = [];
  let clusterEnd = -1;
  let laneEnds: number[] = [];

  function flush() {
    const lanes = laneEnds.length;
    cluster.forEach((item) => result.push({ ...item, lanes }));
    cluster = [];
    laneEnds = [];
  }

  for (const lesson of sorted) {
    const start = toMinutes(lesson.time);
    const end = start + LESSON_MINUTES;

    if (start >= clusterEnd) {
      flush();
    }

    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);

    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }

    cluster.push({ lesson, lane });
    clusterEnd = Math.max(clusterEnd, end);
  }

  flush();

  return result;
}

export default function WeekCalendar({ lessons, startDate }: Props) {
  const days = Array.from({ length: 7 }, (_, index) =>
    addDays(startDate, index),
  );

  const today = getTodayInTaiwan();

  /*
   * 顯示範圍：預設 10:00～22:00，有更早 / 更晚的課就自動延伸
   */
  const startHour = Math.min(
    10,
    ...lessons.map((lesson) => Math.floor(toMinutes(lesson.time) / 60)),
  );

  const endHour = Math.max(
    22,
    ...lessons.map((lesson) =>
      Math.ceil((toMinutes(lesson.time) + LESSON_MINUTES) / 60),
    ),
  );

  const hours = Array.from(
    { length: endHour - startHour },
    (_, index) => startHour + index,
  );

  const gridHeight = hours.length * HOUR_HEIGHT;

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900">
      <div className="min-w-[720px]">
        {/* 星期列 */}
        <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-zinc-800">
          <div />

          {days.map((date) => {
            const isToday = date === today;

            return (
              <div
                key={date}
                className="border-l border-zinc-800 px-2 py-3 text-center"
              >
                <div className="text-xs text-zinc-500">
                  週{weekdayNames[parseLocalDate(date).getDay()]}
                </div>

                <div
                  className={
                    isToday
                      ? "mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-semibold text-black"
                      : "mt-1 text-sm font-semibold"
                  }
                >
                  {Number(date.slice(8))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 時間格 */}
        <div
          className="relative grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]"
          style={{ height: gridHeight }}
        >
          <div className="relative">
            {hours.map((hour, index) => (
              <div
                key={hour}
                className="absolute right-2 -translate-y-1/2 text-xs text-zinc-600"
                style={{ top: index * HOUR_HEIGHT }}
              >
                {index === 0 ? "" : `${hour}:00`}
              </div>
            ))}
          </div>

          {days.map((date) => (
            <div
              key={date}
              className={`relative border-l border-zinc-800 ${
                date === today ? "bg-white/[0.02]" : ""
              }`}
            >
              {hours.map((hour, index) => (
                <div
                  key={hour}
                  className="absolute inset-x-0 border-t border-zinc-800/70"
                  style={{ top: index * HOUR_HEIGHT }}
                />
              ))}

              {layoutDay(
                lessons.filter((lesson) => lesson.date === date),
              ).map(({ lesson, lane, lanes }) => {
                const top =
                  ((toMinutes(lesson.time) - startHour * 60) / 60) *
                  HOUR_HEIGHT;

                const height = (LESSON_MINUTES / 60) * HOUR_HEIGHT;

                const block = (
                  <>
                    <div className="truncate text-xs font-semibold">
                      {lesson.time} {lesson.title}
                    </div>

                    {lesson.subtitle && (
                      <div className="truncate text-[11px] opacity-70">
                        {lesson.subtitle}
                      </div>
                    )}
                  </>
                );

                const className = `absolute overflow-hidden rounded-lg border px-1.5 py-1 ${
                  statusBlockClassName[lesson.status]
                } ${lesson.href ? "transition hover:brightness-125" : ""}`;

                const style = {
                  top: top + 1,
                  height: height - 2,
                  left: `calc(${(lane / lanes) * 100}% + 2px)`,
                  width: `calc(${100 / lanes}% - 4px)`,
                };

                return lesson.href ? (
                  <Link
                    key={lesson.id}
                    href={lesson.href}
                    className={className}
                    style={style}
                    title={`${lesson.time} ${lesson.title}${
                      lesson.subtitle ? ` · ${lesson.subtitle}` : ""
                    }`}
                  >
                    {block}
                  </Link>
                ) : (
                  <div
                    key={lesson.id}
                    className={className}
                    style={style}
                    title={`${lesson.time} ${lesson.title}${
                      lesson.subtitle ? ` · ${lesson.subtitle}` : ""
                    }`}
                  >
                    {block}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/*
 * 列表 / 行事曆切換（預設行事曆，?view=list 才是列表）
 */
export function parseWeekView(view?: string): "list" | "calendar" {
  return view === "list" ? "list" : "calendar";
}

export function WeekViewToggle({
  basePath,
  date,
  view,
}: {
  basePath: string;
  date?: string;
  view: "list" | "calendar";
}) {
  function href(nextView: "list" | "calendar") {
    const params = new URLSearchParams();

    if (date) {
      params.set("date", date);
    }

    if (nextView === "list") {
      params.set("view", "list");
    }

    const query = params.toString();

    return query ? `${basePath}?${query}` : basePath;
  }

  return (
    <div className="inline-flex rounded-xl bg-zinc-800 p-1">
      {(["list", "calendar"] as const).map((option) => (
        <Link
          key={option}
          href={href(option)}
          className={
            view === option
              ? "rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black"
              : "rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:text-white"
          }
        >
          {option === "list" ? "列表" : "行事曆"}
        </Link>
      ))}
    </div>
  );
}
