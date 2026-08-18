// src/utils/response.js
// Các helper trả về HTTP Response chuẩn trên Cloudflare Workers / Node.js

import { DEFAULT_CORS_HEADERS } from '../config/constants.js';

/**
 * Trả về JSON Response với status và header tùy chọn
 * @param {any} data Dữ liệu JSON
 * @param {number} status Mã trạng thái HTTP (mặc định 200)
 * @param {object} extraHeaders Headers bổ sung
 * @returns {Response}
 */
export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...DEFAULT_CORS_HEADERS,
      ...extraHeaders
    }
  });
}

/**
 * Trả về HTML Response với status và header tùy chọn
 * @param {string} html Mã nguồn HTML
 * @param {number} status Mã trạng thái HTTP (mặc định 200)
 * @param {object} extraHeaders Headers bổ sung
 * @returns {Response}
 */
export function htmlResponse(html, status = 200, extraHeaders = {}) {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      ...extraHeaders
    }
  });
}

/**
 * Trả về HTTP 302 Redirect Response
 * @param {string} targetUrl URL đích
 * @param {number} status Mã trạng thái (mặc định 302)
 * @returns {Response}
 */
export function redirectResponse(targetUrl, status = 302) {
  return new Response(null, {
    status,
    headers: {
      'Location': targetUrl,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

/**
 * Trả về CORS Preflight Response cho method OPTIONS
 * @returns {Response}
 */
export function corsResponse() {
  return new Response(null, {
    status: 204,
    headers: DEFAULT_CORS_HEADERS
  });
}

/**
 * Trả về Error Response chuẩn
 * @param {string} message Thông điệp lỗi
 * @param {number} status Mã trạng thái HTTP
 * @returns {Response}
 */
export function errorResponse(message, status = 500) {
  return jsonResponse({
    success: false,
    error: message
  }, status);
}
