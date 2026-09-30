/*
 * 開發用：不經過 LINE，直接用任一身份登入。
 *
 * 必須同時是 `next dev` 且 .env.local 設定 DEV_LOGIN=true。
 * `next build` / `next start` 的 NODE_ENV 一定是 production，所以正式站不會啟用。
 */
export function isDevLoginEnabled() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_LOGIN === "true"
  );
}
