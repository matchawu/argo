-- LINE 登入：取代 Email / 密碼登入

-- 每個登入身份綁定一個 LINE 帳號（LINE 的 sub / userId）
alter table public.profiles
  add column if not exists line_user_id text unique;

-- 老師邀請連結：只存 token 的 sha256，原始 token 只會出現在連結裡
alter table public.teachers
  add column if not exists invite_token_hash text unique,
  add column if not exists invite_expires_at timestamptz;

-- 第一次設定 admin：
-- 1. 用 admin 的 LINE 到 /login 登入，畫面會顯示「尚未綁定」與 LINE User ID
-- 2. 把那串 ID 填進下面執行
--
-- update public.profiles
--   set line_user_id = 'Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
--   where role = 'admin'
--     and id = (select id from auth.users where email = 'admin@example.com');
