import { createHash, randomBytes } from "crypto";
import type { createAdminClient } from "@/lib/supabase/admin";

export const INVITE_TTL_DAYS = 7;

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/*
 * 產生新的邀請 token。
 *
 * DB 只存 hash，原始 token 只放在邀請連結裡。
 */
export function createInviteToken() {
  const token = randomBytes(32).toString("base64url");

  const expiresAt = new Date(
    Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  return {
    token,
    tokenHash: hashInviteToken(token),
    expiresAt: expiresAt.toISOString(),
  };
}

export function buildInviteUrl(siteUrl: string, token: string) {
  return `${siteUrl}/invite/${token}`;
}

/*
 * 學生沒有 Email，但 Supabase Auth user 需要一個。
 *
 * 用 example.com（RFC 2606 保留網域），不會真的寄信。
 */
export function studentAuthEmail(studentId: number) {
  return `argo-student-${studentId}@example.com`;
}

export type Invite = {
  kind: "teacher" | "student";
  id: number;
  name: string;
  email: string | null;
  active: boolean;
};

/*
 * 用邀請 token 找老師或學生。
 *
 * 找不到或已過期回傳 null。
 */
export async function findInvite(
  admin: ReturnType<typeof createAdminClient>,
  token: string,
): Promise<Invite | null> {
  const tokenHash = hashInviteToken(token);
  const now = new Date();

  const [{ data: teacher }, { data: student }] =
    await Promise.all([
      admin
        .from("teachers")
        .select("id, name, email, active, invite_expires_at")
        .eq("invite_token_hash", tokenHash)
        .maybeSingle(),

      admin
        .from("students")
        .select("id, name, active, invite_expires_at")
        .eq("invite_token_hash", tokenHash)
        .maybeSingle(),
    ]);

  if (
    teacher?.invite_expires_at &&
    new Date(teacher.invite_expires_at) > now
  ) {
    return {
      kind: "teacher",
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      active: teacher.active,
    };
  }

  if (
    student?.invite_expires_at &&
    new Date(student.invite_expires_at) > now
  ) {
    return {
      kind: "student",
      id: student.id,
      name: student.name,
      email: studentAuthEmail(student.id),
      active: student.active,
    };
  }

  return null;
}
