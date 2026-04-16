/**
 * Nâng http → https cho host public (ngrok, deploy…), tránh Mixed Content khi env gõ nhầm thiếu "s".
 * Giữ nguyên http cho localhost.
 */
export function ensureHttpsBaseUrl(url: string): string {
  const t = url.trim();
  if (!/^http:\/\//i.test(t)) return url;
  try {
    const u = new URL(t);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return url;
    u.protocol = "https:";
    return u.toString();
  } catch {
    return t.replace(/^http:\/\//i, "https://");
  }
}

export function ensureTrailingSlash(url: string): string {
  const t = url.trim();
  if (!t) return t;
  return t.endsWith("/") ? t : `${t}/`;
}
