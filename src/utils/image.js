// src/utils/image.js
// Các hàm tiện ích xử lý hình ảnh, Base64 và R2 Storage Key

import { IMAGE_MIME_TYPES } from '../config/constants.js';

/**
 * Chuyển đổi ArrayBuffer sang Base64 chuẩn Web API
 * @param {ArrayBuffer} buffer 
 * @returns {string} Chuỗi Base64
 */
export function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Lấy MIME Type phù hợp dựa trên đuôi mở rộng file
 * @param {string} filename Tên file
 * @returns {string} Content-Type
 */
export function getMimeType(filename) {
  if (!filename) return 'application/octet-stream';
  const extMatch = filename.toLowerCase().match(/\.[a-z0-9]+$/);
  if (extMatch && IMAGE_MIME_TYPES[extMatch[0]]) {
    return IMAGE_MIME_TYPES[extMatch[0]];
  }
  return 'image/jpeg';
}

/**
 * Trích xuất tên file (R2 Key) từ URL ảnh
 * Hỗ trợ các định dạng:
 * - /images/og-123.jpg -> og-123.jpg
 * - https://domain.com/images/og-123.jpg -> og-123.jpg
 * - og-123.jpg -> og-123.jpg
 * @param {string} imageUrl URL hoặc đường dẫn của ảnh
 * @returns {string|null} R2 file key hoặc null
 */
export function extractR2Key(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const trimmed = imageUrl.trim();

  // Bỏ qua ảnh Base64
  if (trimmed.startsWith('data:image/')) return null;

  // Nếu là đường dẫn /images/...
  if (trimmed.includes('/images/')) {
    const parts = trimmed.split('/images/');
    const fileWithQuery = parts[parts.length - 1];
    return decodeURIComponent(fileWithQuery.split('?')[0].split('#')[0].trim());
  }

  // Nếu là tên file trực tiếp (ví dụ: og-1740000000000-abcd.jpg)
  if (/^og-[\w-]+\.[a-z0-9]+$/i.test(trimmed)) {
    return trimmed;
  }

  return null;
}
