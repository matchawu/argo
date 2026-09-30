-- 學生登入頁：課表、繳費 / 堂數、上課紀錄

-- 老師寫給學生看的紀錄（lesson_note 維持只有老師與 admin 看得到）
alter table public.lessons
  add column if not exists student_note text;

-- 學生登入邀請連結（與 teachers 相同做法，只存 token 的 sha256）
alter table public.students
  add column if not exists invite_token_hash text unique,
  add column if not exists invite_expires_at timestamptz;

-- 繳費紀錄：預購堂數
create table if not exists public.payments (
  id bigint generated always as identity primary key,
  student_id bigint not null references public.students (id) on delete cascade,
  paid_at date not null,
  amount integer not null check (amount >= 0),
  lesson_count integer not null check (lesson_count > 0),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists payments_student_id_idx
  on public.payments (student_id);

-- 只透過伺服器端（secret key）存取，不開放任何 client 端 policy
alter table public.payments enable row level security;
