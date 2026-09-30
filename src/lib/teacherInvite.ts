import { createHash, randomBytes } from "crypto";

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
