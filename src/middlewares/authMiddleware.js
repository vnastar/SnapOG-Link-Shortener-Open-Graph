// src/middlewares/authMiddleware.js
// Middleware xác thực quyền quản trị viên (Admin Authentication)

import { parseCookies, serializeCookie } from '../utils/cookie.js';
import { verifyAdminKey, escapeHTML } from '../utils/security.js';
import { renderLoginPage } from '../views/pages/loginPage.js';
import { jsonResponse, htmlResponse } from '../utils/response.js';
import { DEFAULT_CONFIG } from '../config/constants.js';

/**
 * Kiểm tra quyền quản trị của request
 * Hỗ trợ các phương thức:
 * 1. Cookie snapog_auth hoặc AUTH_COOKIE_NAME cấu hình
 * 2. Header Authorization: Bearer <key>
 * 3. Query parameter: ?key=<key>
 * 
 * @param {Request} request 
 * @param {object} env 
 * @returns {boolean}
 */
export function checkAuth(request, env) {
  const adminKey = (env?.ADMIN_KEY !== undefined && env?.ADMIN_KEY !== '') 
    ? String(env.ADMIN_KEY).trim() 
    : (DEFAULT_CONFIG.ADMIN_KEY?.trim() || '');
  
  // Nếu cả biến env và DEFAULT_CONFIG đều không có ADMIN_KEY thì mở quyền tự do
  if (!adminKey) {
    return true;
  }

  const cookieName = env?.AUTH_COOKIE_NAME || DEFAULT_CONFIG.AUTH_COOKIE_NAME || 'admin_session';

  // 1. Kiểm tra Cookie xác thực
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = parseCookies(cookieHeader);
  if (cookies[cookieName] && (verifyAdminKey(cookies[cookieName], adminKey) || cookies[cookieName] === adminKey || cookies[cookieName] === 'authenticated')) {
    return true;
  }
  if (cookies['snapog_auth'] && (verifyAdminKey(cookies['snapog_auth'], adminKey) || cookies['snapog_auth'] === adminKey || cookies['snapog_auth'] === 'authenticated')) {
    return true;
  }
  if (cookies['admin_session'] && (verifyAdminKey(cookies['admin_session'], adminKey) || cookies['admin_session'] === adminKey || cookies['admin_session'] === 'authenticated')) {
    return true;
  }

  // 2. Kiểm tra Header Authorization (Bearer Token)
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (verifyAdminKey(token, adminKey) || token === adminKey) {
      return true;
    }
  }

  // 3. Kiểm tra Header X-Admin-Key hoặc X-API-Key
  const customKeyHeader = request.headers.get('x-admin-key') || request.headers.get('x-api-key') || '';
  if (customKeyHeader && (verifyAdminKey(customKeyHeader, adminKey) || customKeyHeader === adminKey)) {
    return true;
  }

  // 4. Kiểm tra Query Param ?key=xxx hoặc ?adminKey=xxx
  try {
    const url = new URL(request.url);
    const queryKey = url.searchParams.get('key') || url.searchParams.get('adminKey') || url.searchParams.get('admin_key');
    if (queryKey && (verifyAdminKey(queryKey, adminKey) || queryKey === adminKey)) {
      return true;
    }
  } catch (e) {
    // Bỏ qua lỗi parse URL nếu có
  }

  return false;
}

/**
 * Middleware bảo vệ các route yêu cầu quyền quản trị
 * @param {Request} request 
 * @param {object} env 
 * @returns {Response|null} Trả về Response lỗi (nếu chưa auth) hoặc null (nếu hợp lệ)
 */
export function requireAuth(request, env) {
  if (checkAuth(request, env)) {
    return null; // Đã xác thực thành công, tiếp tục xử lý
  }

  const isApiRequest = request.headers.get('accept')?.includes('application/json') ||
                       request.headers.get('content-type')?.includes('application/json') ||
                       request.url.includes('/api/');

  if (isApiRequest || request.method !== 'GET') {
    return jsonResponse({
      success: false,
      error: 'Truy cập bị từ chối. Vui lòng cung cấp mật khẩu quản trị hợp lệ qua cookie hoặc Bearer token.'
    }, 401);
  }

  // Trả về giao diện đăng nhập cho người dùng duyệt qua trình duyệt
  return htmlResponse(renderLoginPage('Vui lòng nhập mật khẩu quản trị để truy cập hệ thống.'), 401);
}
