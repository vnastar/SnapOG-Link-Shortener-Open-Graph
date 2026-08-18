// src/utils/time.js
// Các hàm tiện ích xử lý thời gian theo múi giờ Việt Nam (GMT+7: Asia/Ho_Chi_Minh)

import { DEFAULT_CONFIG } from '../config/constants.js';

/**
 * Lấy thời gian hiện tại chuẩn múi giờ Việt Nam dạng 'YYYY-MM-DD HH:mm:ss'
 * Thích hợp để lưu trực tiếp vào CSDL SQLite / Cloudflare D1
 * @returns {string} Ví dụ: '2026-08-18 15:30:45'
 */
export function getVietnamTimestamp(timeZone) {
  const now = new Date();
  const tz = timeZone || DEFAULT_CONFIG.TIMEZONE || 'Asia/Ho_Chi_Minh';
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  return formatter.format(now).replace(',', '');
}

/**
 * Định dạng chuỗi ngày tháng ISO / SQL sang chuẩn hiển thị tiếng Việt 'DD/MM/YYYY HH:mm:ss'
 * @param {string|Date} dateStr Chuỗi thời gian hoặc đối tượng Date
 * @param {string} [timeZone] Múi giờ tùy chọn
 * @returns {string} Ví dụ: '18/08/2026 15:30:45'
 */
export function formatVNTime(dateStr, timeZone) {
  if (!dateStr) return 'Vừa xong';
  const trimmed = String(dateStr).trim();
  const tz = timeZone || DEFAULT_CONFIG.TIMEZONE || 'Asia/Ho_Chi_Minh';

  // Chuỗi định dạng chuẩn SQLite 'YYYY-MM-DD HH:mm:ss'
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    const [datePart, timePart] = trimmed.split(' ');
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year} ${timePart}`;
  }

  // Chuỗi định dạng 'YYYY-MM-DD'
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-');
    return `${day}/${month}/${year}`;
  }

  // Chuỗi định dạng ISO UTC
  try {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      const formatter = new Intl.DateTimeFormat('vi-VN', {
        timeZone: tz,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      return formatter.format(date);
    }
  } catch (err) {
    // fallback trả về chuỗi gốc
  }

  return trimmed;
}

