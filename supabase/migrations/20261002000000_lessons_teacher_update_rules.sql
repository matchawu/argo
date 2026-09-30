-- lessons 更新規則（沿用既有的 enforce_teacher_lesson_updates trigger）
--
-- 1. 老師可以修改 student_note（給學生看的紀錄）
-- 2. 伺服器端（secret key）與 SQL Editor 可以修改（auth.uid() 為 null）
-- 3. 移除重複的 guard_teacher_lesson_update trigger

drop trigger if exists guard_teacher_lesson_update on public.lessons;
drop function if exists public.guard_teacher_lesson_update();

create or replace function public.enforce_teacher_lesson_updates()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  -- 伺服器端（secret key）/ SQL Editor
  if auth.uid() is null then
    return new;
  end if;

  -- Admin 可以修改所有欄位
  if public.is_admin() then
    return new;
  end if;

  -- Teacher 只能修改允許的欄位
  if public.current_teacher_id() is not null then

    if (
      to_jsonb(new) - array[
        'status',
        'lesson_date',
        'lesson_time',
        'lesson_note',
        'student_note'
      ]
    ) is distinct from (
      to_jsonb(old) - array[
        'status',
        'lesson_date',
        'lesson_time',
        'lesson_note',
        'student_note'
      ]
    ) then

      raise exception
        'Teachers may only update status, lesson_date, lesson_time, lesson_note, and student_note';

    end if;

    return new;
  end if;

  -- 其他角色目前不允許更新 lesson
  raise exception 'You are not allowed to update lessons';
end;
$function$;
