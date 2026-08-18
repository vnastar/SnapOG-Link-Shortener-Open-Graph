// src/controllers/authController.js
// Bộ điều khiển xử lý xác thực: Đăng nhập, Đăng xuất và Tạo phiên làm việc

import { verifyAdminKey } from '../utils/security.js';
import { serializeCookie } from '../utils/cookie.js';
import { jsonResponse, htmlResponse } from '../utils/response.js';
import { renderLoginPage } from '../views/pages/loginPage.js';
import { DEFAULT_CONFIG } from '../config/constants.js';

/**
 * Xử lý yêu cầu đăng nhập quản trị viên (POST /login)
 * Hỗ trợ cả application/json và FormData từ form HTML
 * 
 * @param {Request} request 
 * @param {object} env 
 * @returns {Promise<Response>}
 */
export async function handleLogin(request, env) {
  const adminKey = (env?.ADMIN_KEY !== undefined && env?.ADMIN_KEY !== '') 
    ? String(env.ADMIN_KEY).trim() 
    : (DEFAULT_CONFIG.ADMIN_KEY?.trim() || '');
  const cookieName = env?.AUTH_COOKIE_NAME || DEFAULT_CONFIG.AUTH_COOKIE_NAME || 'admin_session';

  try {
    let keyInput = '';
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await request.json().catch(() => ({}));
      keyInput = data.key || data.password || data.adminKey || '';
    } else {
      try {
        const formData = await request.formData();
        keyInput = formData.get('key') || formData.get('password') || formData.get('adminKey') || '';
      } catch (e) {
        // Fallback đọc text urlencoded
        const bodyText = await request.text().catch(() => '');
        const params = new URLSearchParams(bodyText);
        keyInput = params.get('key') || params.get('password') || params.get('adminKey') || '';
      }
    }

    keyInput = String(keyInput).trim();

    // Nếu hệ thống không cấu hình mật khẩu hoặc mật khẩu nhập vào khớp
    const isCorrect = !adminKey || verifyAdminKey(keyInput, adminKey) || keyInput === adminKey;

    if (isCorrect) {
      const effectiveCookieVal = keyInput || adminKey || 'authenticated';
      const cookieHeader = serializeCookie(cookieName, effectiveCookieVal, {
        maxAge: 60 * 60 * 24 * 30, // 30 ngày
        path: '/',
        httpOnly: true,
        secure: false, // Để hoạt động trơn tru trên cả HTTP/HTTPS & iframe
        sameSite: 'Lax'
      });

      // Nếu client gửi JSON API
      if (contentType.includes('application/json') || request.headers.get('accept')?.includes('application/json')) {
        const responseHeaders = new Headers();
        responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
        responseHeaders.append('Set-Cookie', cookieHeader);

        return new Response(JSON.stringify({
          success: true,
          token: effectiveCookieVal,
          message: 'Đăng nhập quản trị thành công!'
        }), {
          status: 200,
          headers: responseHeaders
        });
      }

      // Nếu submit từ Form web -> Chuyển hướng 302 về trang chủ Admin kèm key
      const responseHeaders = new Headers();
      responseHeaders.set('Location', `/?key=${encodeURIComponent(effectiveCookieVal)}`);
      responseHeaders.append('Set-Cookie', cookieHeader);

      return new Response(null, {
        status: 302,
        headers: responseHeaders
      });
    }

    // Sai mật khẩu
    if (contentType.includes('application/json') || request.headers.get('accept')?.includes('application/json')) {
      return jsonResponse({
        success: false,
        error: 'Mật khẩu quản trị không chính xác. Vui lòng thử lại!'
      }, 401);
    }

    return htmlResponse(renderLoginPage('Mật khẩu quản trị không chính xác. Vui lòng thử lại!'), 401);

  } catch (err) {
    console.error('Lỗi khi xử lý đăng nhập:', err);
    return jsonResponse({
      success: false,
      error: 'Lỗi máy chủ khi xác thực: ' + err.message
    }, 500);
  }
}

/**
 * Xử lý yêu cầu đăng xuất (GET /logout)
 * Xóa cookie xác thực và chuyển hướng về trang chủ
 * 
 * @param {Request} request 
 * @param {object} env 
 * @returns {Response}
 */
export function handleLogout(request, env) {
  const cookieName = env?.AUTH_COOKIE_NAME || DEFAULT_CONFIG.AUTH_COOKIE_NAME || 'admin_session';
  const expiredCookie1 = serializeCookie(cookieName, '', {
    maxAge: 0,
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax'
  });
  const expiredCookie2 = serializeCookie('snapog_auth', '', {
    maxAge: 0,
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax'
  });

  const headers = new Headers();
  headers.set('Location', '/');
  headers.append('Set-Cookie', expiredCookie1);
  headers.append('Set-Cookie', expiredCookie2);

  return new Response(null, {
    status: 302,
    headers
  });
}

