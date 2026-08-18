// src/utils/cookie.js
// Tiện ích phân tích và tạo HTTP Cookie

/**
 * Phân tích header Cookie thành Object key-value
 * @param {string|null} header 
 * @returns {Record<string, string>}
 */
export function parseCookies(header) {
  const cookies = {};
  if (!header || typeof header !== 'string') return cookies;
  const pairs = header.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx !== -1) {
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      if (key) {
        try {
          cookies[key] = decodeURIComponent(val);
        } catch (e) {
          cookies[key] = val;
        }
      }
    }
  }
  return cookies;
}

/**
 * Tạo chuỗi Set-Cookie an toàn
 * @param {string} name Tên cookie
 * @param {string} value Giá trị cookie
 * @param {object} options Các tùy chọn (maxAge, path, httpOnly, secure, sameSite)
 * @returns {string}
 */
export function serializeCookie(name, value, options = {}) {
  const {
    maxAge = 60 * 60 * 24 * 30, // 30 ngày
    path = '/',
    httpOnly = true,
    secure = false, // false để cookie hoạt động trên cả HTTP localhost/dev và preview container
    sameSite = 'Lax'
  } = options;

  let cookie = `${name}=${encodeURIComponent(value)}; Path=${path}; Max-Age=${maxAge}; SameSite=${sameSite}`;
  if (httpOnly) cookie += '; HttpOnly';
  if (secure) cookie += '; Secure';
  return cookie;
}
