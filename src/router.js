// src/router.js
// Bộ định tuyến chính của hệ thống SnapOG (Routing & Dispatching Layer)

import { 
  handleLogin, 
  handleLogout, 
  checkAuth, 
  serveImage, 
  getAllLinksHandler, 
  getLinkStatsHandler, 
  createOrUpdateLinkHandler, 
  deleteLinkHandler, 
  uploadImageHandler, 
  getLogsHandler, 
  renderDashboard, 
  renderStatsPage, 
  handleShortRedirect 
} from './controllers/index.js';
import { getLink } from './services/linkService.js';
import { renderLoginPage } from './views/pages/loginPage.js';
import { corsResponse, jsonResponse, htmlResponse, redirectResponse } from './utils/response.js';
import { DEFAULT_CONFIG } from './config/constants.js';

/**
 * Xử lý tất cả các request đến Cloudflare Worker
 * 
 * @param {Request} request 
 * @param {object} env 
 * @param {object} ctx 
 * @returns {Promise<Response>}
 */
export async function routeRequest(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const host = request.headers.get('host') || url.host;

    // Lấy cấu hình tên miền
    const ADMIN_DOMAIN = env?.ADMIN_DOMAIN || DEFAULT_CONFIG.ADMIN_DOMAIN;
    const SHORT_DOMAIN = env?.SHORT_DOMAIN || DEFAULT_CONFIG.SHORT_DOMAIN;

    // Hỗ trợ chuyển đổi môi trường trực tiếp trên thanh công cụ demo (simulation)
    const simulateDomain = url.searchParams.get('simulate_domain') || request.headers.get('x-simulate-domain') || '';
    const isExplicitShort = simulateDomain === SHORT_DOMAIN || host === SHORT_DOMAIN;
    const isExplicitAdmin = simulateDomain === ADMIN_DOMAIN || host === ADMIN_DOMAIN;

    let isAdminDomain = true;
    let isShortDomain = false;

    if (isExplicitShort) {
      isAdminDomain = false;
      isShortDomain = true;
    } else if (isExplicitAdmin) {
      isAdminDomain = true;
      isShortDomain = false;
    } else {
      // Mặc định phân giải theo host
      if (host.includes(SHORT_DOMAIN) && !host.includes(ADMIN_DOMAIN)) {
        isAdminDomain = false;
        isShortDomain = true;
      } else {
        isAdminDomain = true;
        isShortDomain = false;
      }
    }

    // =================================================================
    // 1. XỬ LÝ CORS PREFLIGHT CHO TẤT CẢ API
    // =================================================================
    if (request.method === 'OPTIONS') {
      return corsResponse();
    }

    // =================================================================
    // 2. PHỤC VỤ HÌNH ẢNH R2 TẬP TRUNG: /images/:filename
    // =================================================================
    if (pathname.startsWith('/images/')) {
      const imageName = decodeURIComponent(pathname.substring(8).trim());
      return await serveImage(request, env, imageName);
    }

    // =================================================================
    // 3. LUỒNG TÊN MIỀN QUẢN TRỊ (ADMIN DOMAIN)
    // =================================================================
    if (isAdminDomain) {
      // 3.1. Đăng nhập (GET /login, POST /login)
      if (pathname === '/login') {
        if (request.method === 'POST') {
          return await handleLogin(request, env);
        }
        if (checkAuth(request, env)) {
          return redirectResponse('/', 302);
        }
        return htmlResponse(renderLoginPage(), 200);
      }

      // 3.2. Đăng xuất (GET /logout)
      if (pathname === '/logout' && request.method === 'GET') {
        return handleLogout(request, env);
      }

      // 3.3. Kiểm tra quyền truy cập (Authentication Check)
      const isAuth = checkAuth(request, env);
      if (!isAuth) {
        // Nếu là yêu cầu API hoặc không phải GET -> Trả về JSON 401
        if (pathname.startsWith('/api/') || request.method !== 'GET') {
          return jsonResponse({
            success: false,
            error: 'Yêu cầu đăng nhập quản trị để thực hiện thao tác này.'
          }, 401);
        }
        // Trình duyệt web truy cập HTML -> Trả về trang đăng nhập
        return htmlResponse(renderLoginPage(), 401);
      }

      // 3.4. Giao diện Bảng điều khiển chính (GET /, /admin, /dashboard, /links, /create, /new)
      if (
        (pathname === '/' || 
         pathname === '/admin' || 
         pathname === '/dashboard' || 
         pathname === '/links' || 
         pathname === '/create' || 
         pathname === '/new') && 
        request.method === 'GET'
      ) {
        return await renderDashboard(request, env, url, host);
      }

      // 3.5. API Lấy danh sách toàn bộ links: GET /api/links
      if (pathname === '/api/links' && request.method === 'GET') {
        return await getAllLinksHandler(request, env);
      }

      // 3.6. API Lấy lịch sử click phân trang & lọc: GET /api/logs
      if (pathname === '/api/logs' && request.method === 'GET') {
        return await getLogsHandler(request, env, url);
      }

      // 3.7. API Tải ảnh độc lập lên R2: POST /api/upload
      if (pathname === '/api/upload' && request.method === 'POST') {
        return await uploadImageHandler(request, env, url, host);
      }

      // 3.8. API Tạo / Cập nhật Link: POST /, /admin, /create, /api/links, /links
      if (
        (pathname === '/' || 
         pathname === '/admin' || 
         pathname === '/create' || 
         pathname === '/api/links' || 
         pathname === '/links') && 
        request.method === 'POST'
      ) {
        return await createOrUpdateLinkHandler(request, env, url, host);
      }

      // 3.9. API Quick View Analytics (Modal): GET /api/stats?slug=xxx
      if (pathname === '/api/stats' && request.method === 'GET') {
        return await getLinkStatsHandler(request, env, url);
      }

      // 3.10. Trang Analytics Đầy Đủ: GET /stats?slug=xxx
      if (pathname === '/stats' && request.method === 'GET') {
        return await renderStatsPage(request, env, url, host);
      }

      // 3.11. Xóa Link: POST /delete, /api/delete, /api/links/delete
      if (
        pathname === '/delete' || 
        pathname === '/api/delete' || 
        pathname === '/api/links/delete'
      ) {
        return await deleteLinkHandler(request, env);
      }

      // 3.12. Fallback trên Admin domain
      if (request.method === 'GET') {
        const fallbackSlug = pathname.substring(1).trim();
        if (fallbackSlug) {
          const linkFound = await getLink(env.DB, fallbackSlug);
          if (linkFound) {
            return redirectResponse(`/stats?slug=${encodeURIComponent(fallbackSlug)}`, 302);
          }
        }
        return redirectResponse('/', 302);
      }
    }

    // =================================================================
    // 4. LUỒNG TÊN MIỀN RÚT GỌN (SHORT DOMAIN)
    // =================================================================
    return await handleShortRedirect(request, env, ctx, url, pathname, host);

  } catch (error) {
    console.error('Lỗi hệ thống Worker Router:', error);
    return new Response(`Lỗi hệ thống Worker: ${error.message}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}
