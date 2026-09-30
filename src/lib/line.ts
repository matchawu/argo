/*
 * LINE Login (OAuth 2.1 / OpenID Connect)
 *
 * https://developers.line.biz/en/docs/line-login/integrate-line-login/
 */

export const LINE_OAUTH_COOKIE = "line_oauth";

export type LineOAuthCookie = {
  state: string;
  nonce: string;
  invite: string | null;
};

type LineConfig = {
  channelId: string;
  channelSecret: string;
  redirectUri: string;
};

export function getLineConfig(): LineConfig {
  const channelId = process.env.LINE_CHANNEL_ID;
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!channelId) {
    throw new Error("Missing LINE_CHANNEL_ID");
  }

  if (!channelSecret) {
    throw new Error("Missing LINE_CHANNEL_SECRET");
  }

  if (!siteUrl) {
    throw new Error("Missing NEXT_PUBLIC_SITE_URL");
  }

  return {
    channelId,
    channelSecret,
    redirectUri: `${siteUrl}/auth/line/callback`,
  };
}

export function buildLineAuthorizeUrl({
  state,
  nonce,
}: {
  state: string;
  nonce: string;
}) {
  const { channelId, redirectUri } = getLineConfig();

  const url = new URL(
    "https://access.line.me/oauth2/v2.1/authorize",
  );

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", channelId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", "openid profile");
  url.searchParams.set("nonce", nonce);

  return url.toString();
}

/*
 * 用 authorization code 換 id_token，
 * 再交給 LINE 驗證，回傳 LINE userId。
 */
export async function getLineUserFromCode({
  code,
  nonce,
}: {
  code: string;
  nonce: string;
}) {
  const { channelId, channelSecret, redirectUri } =
    getLineConfig();

  const tokenResponse = await fetch(
    "https://api.line.me/oauth2/v2.1/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: channelId,
        client_secret: channelSecret,
      }),
    },
  );

  if (!tokenResponse.ok) {
    throw new Error(
      `LINE token exchange failed: ${await tokenResponse.text()}`,
    );
  }

  const { id_token: idToken } =
    (await tokenResponse.json()) as { id_token?: string };

  if (!idToken) {
    throw new Error("LINE token response has no id_token");
  }

  const verifyResponse = await fetch(
    "https://api.line.me/oauth2/v2.1/verify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        id_token: idToken,
        client_id: channelId,
        nonce,
      }),
    },
  );

  if (!verifyResponse.ok) {
    throw new Error(
      `LINE id_token verify failed: ${await verifyResponse.text()}`,
    );
  }

  const claims = (await verifyResponse.json()) as {
    sub: string;
    name?: string;
  };

  return {
    lineUserId: claims.sub,
    name: claims.name ?? null,
  };
}
