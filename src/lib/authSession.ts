import { createClient } from "@/lib/supabase/server";
import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export function homeForRole(role: string) {
  switch (role) {
    case "admin":
      return "/";
    case "teacher":
      return "/teacher";
    case "student":
      return "/student";
    default:
      return "/unauthorized";
  }
}

/*
 * 建立老師 / 學生的登入身份：Auth user（不寄信）+ profile。
 *
 * 成功回傳 profile id，失敗回傳 null。
 */
export async function createLoginProfile(
  admin: AdminClient,
  {
    kind,
    id,
    name,
    email,
    lineUserId,
  }: {
    kind: "teacher" | "student";
    id: number;
    name: string;
    email: string;
    lineUserId: string | null;
  },
): Promise<string | null> {
  const { data: created, error: createUserError } =
    await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        name,
        role: kind,
      },
    });

  if (createUserError || !created.user) {
    console.error(createUserError);
    return null;
  }

  const { error: insertProfileError } = await admin
    .from("profiles")
    .insert({
      id: created.user.id,
      role: kind,
      teacher_id: kind === "teacher" ? id : null,
      student_id: kind === "student" ? id : null,
      line_user_id: lineUserId,
    });

  if (insertProfileError) {
    console.error(insertProfileError);
    await admin.auth.admin.deleteUser(created.user.id);
    return null;
  }

  return created.user.id;
}

/*
 * 在伺服器端幫指定的 Auth user 建立 Supabase session。
 *
 * 產生 magic link token（不寄信），直接 verify，session 會寫進 cookie。
 * 只能在 Route Handler / Server Function 裡呼叫。
 */
export async function signInAsUser(
  admin: AdminClient,
  userId: string,
): Promise<boolean> {
  const { data: authUser, error: authUserError } =
    await admin.auth.admin.getUserById(userId);

  if (authUserError || !authUser.user?.email) {
    console.error(authUserError);
    return false;
  }

  const { data: link, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email: authUser.user.email,
    });

  if (linkError || !link.properties?.hashed_token) {
    console.error(linkError);
    return false;
  }

  const supabase = await createClient();

  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });

  if (verifyError) {
    console.error(verifyError);
    return false;
  }

  return true;
}
