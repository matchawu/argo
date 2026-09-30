-- 1. 隔週上課：每 N 週上一次（1 = 每週，2 = 隔週）
alter table public.enrollments
  add column if not exists interval_weeks integer not null default 1
    check (interval_weeks between 1 and 4);

-- 2. 繳費紀錄屬於某一筆固定課程（同一學生不同課程分開計算堂數）
alter table public.payments
  add column if not exists enrollment_id bigint
    references public.enrollments (id) on delete restrict;

create index if not exists payments_enrollment_id_idx
  on public.payments (enrollment_id);

-- 既有繳費：學生只有一筆固定課程的，自動歸到那筆
update public.payments p
set enrollment_id = e.enrollment_id
from (
  select student_id, min(id) as enrollment_id
  from public.enrollments
  group by student_id
  having count(*) = 1
) e
where p.enrollment_id is null
  and p.student_id = e.student_id;

-- 全部都有對應課程才設成必填；否則先保留 null，請到學生頁手動處理
do $$
begin
  if not exists (
    select 1 from public.payments where enrollment_id is null
  ) then
    alter table public.payments
      alter column enrollment_id set not null;
  else
    raise notice 'payments 仍有未對應固定課程的紀錄，enrollment_id 暫不設為必填';
  end if;
end;
$$;
