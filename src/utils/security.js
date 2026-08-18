// src/utils/security.js
// Các hàm tiện ích bảo mật, xử lý chuỗi và phòng chống tấn công XSS

/**
 * Thoát các ký tự đặc biệt trong chuỗi để hiển thị an toàn trên HTML (Chống XSS)
 * @param {any} str Chuỗi đầu vào
 * @returns {string} Chuỗi an toàn
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Kiểm tra tính hợp lệ và chuẩn hóa URL đích
 * @param {string} urlString 
 * @returns {string|null} URL hợp lệ hoặc null
 */
export function sanitizeUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return null;
  const trimmed = urlString.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  // Tự động thêm https:// nếu người dùng quên nhập giao thức
  if (/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/i.test(trimmed)) {
    return 'https://' + trimmed;
  }
  return null;
}

/**
 * Xác thực an toàn khóa Admin (Constant-time comparison)
 * @param {string} inputKey Khóa do người dùng nhập
 * @param {string} correctKey Khóa cấu hình trong hệ thống
 * @returns {boolean}
 */
export function verifyAdminKey(inputKey, correctKey) {
  if (!inputKey || !correctKey) return false;
  const a = String(inputKey).trim();
  const b = String(correctKey).trim();
  if (a.length !== b.length) return false;
  
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
