import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  LINE_OAUTH_COOKIE,
  buildLineAuthorizeUrl,
  type LineOAuthCookie,
} from "@/lib/line";

/*
 * 開始 LINE 登入
 *
 * /auth/line            一般登入
 * /auth/line?invite=xxx 用老師邀請連結綁定 LINE
 */
export async function GET(request: NextRequest) {
  const invite =
    request.nextUrl.searchParams.get("invite");

  const oauth: LineOAuthCookie = {
    state: randomBytes(16).toString("hex"),
    nonce: randomBytes(16).toString("hex"),
    invite,
  };

  const response = NextResponse.redirect(
    buildLineAuthorizeUrl(oauth),
  );

  response.cookies.set(
    LINE_OAUTH_COOKIE,
    JSON.stringify(oauth),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    },
  );

  return response;
}
