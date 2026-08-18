// src/controllers/dashboardController.js
// Bộ điều khiển kết xuất giao diện HTML Dashboard và Trang Analytics chi tiết

import { getAllLinks, getLink } from '../services/linkService.js';
import { getDetailedAnalytics, getGlobalAnalytics } from '../services/clickService.js';
import { checkAuth } from '../middlewares/authMiddleware.js';
import { htmlResponse, redirectResponse } from '../utils/response.js';
import { renderDashboardHTML } from '../views/pages/dashboardPage.js';
import { renderAnalyticsHTML } from '../views/pages/analyticsPage.js';
import { renderForbiddenPage } from '../views/pages/forbiddenPage.js';
import { renderOGMeta } from '../views/templates/ogMetaTemplate.js';
import { DEFAULT_CONFIG } from '../config/constants.js';

/**
 * Lấy short domain cấu hình
 * @param {object} env 
 * @returns {string}
 */
function getShortDomain(env) {
  return env?.SHORT_DOMAIN || DEFAULT_CONFIG.SHORT_DOMAIN;
}

/**
 * Kết xuất giao diện Bảng điều khiển quản trị (GET /, GET /admin, GET /dashboard)
 * @param {Request} request 
 * @param {object} env 
 * @param {URL} url 
 * @param {string} host 
 * @returns {Promise<Response>}
 */
export async function renderDashboard(request, env, url, host) {
  try {
    const globalData = await getGlobalAnalytics(env.DB);
    const links = await getAllLinks(env.DB);
    const shortDomain = getShortDomain(env);
    const adminDomain = env?.ADMIN_DOMAIN || host;
    const hasAuth = checkAuth(request, env);
    let defaultTab = url?.searchParams?.get('tab') || '';
    if (!defaultTab) {
      if (url.pathname === '/create' || url.pathname === '/new') {
        defaultTab = 'create';
      } else if (url.pathname === '/links' || url.pathname === '/admin') {
        defaultTab = 'admin';
      } else {
        defaultTab = 'dashboard';
      }
    }

    const html = renderDashboardHTML(globalData, links, shortDomain, adminDomain, hasAuth, defaultTab);
    return htmlResponse(html);

  } catch (err) {
    console.error('Lỗi khi render Dashboard:', err);
    return htmlResponse(renderForbiddenPage('500 Lỗi Hệ Thống', 'Không thể khởi tạo giao diện Dashboard: ' + err.message), 500);
  }
}

/**
 * Kết xuất giao diện phân tích toàn diện của 1 Link (GET /stats?slug=xxx)
 * @param {Request} request 
 * @param {object} env 
 * @param {URL} url 
 * @param {string} host 
 * @returns {Promise<Response>}
 */
export async function renderStatsPage(request, env, url, host) {
  const slug = url.searchParams.get('slug');
  if (!slug) {
    return redirectResponse(`https://${host}/`, 302);
  }

  try {
    const linkData = await getLink(env.DB, slug);
    if (!linkData) {
      return htmlResponse(
        renderForbiddenPage('404 Link Không Tồn Tại', 'Đường dẫn thống kê không hợp lệ hoặc link đã bị xóa.'),
        404
      );
    }

    const shortDomain = getShortDomain(env);
    const shortUrl = `https://${shortDomain}/${slug}`;
    const analyticsData = await getDetailedAnalytics(env.DB, slug);
    const botHtml = renderOGMeta(linkData, shortUrl);

    const html = renderAnalyticsHTML(slug, linkData, analyticsData, shortUrl, botHtml);
    return htmlResponse(html);

  } catch (err) {
    console.error('Lỗi khi render trang thống kê:', err);
    return htmlResponse(
      renderForbiddenPage('500 Lỗi Dữ Liệu', 'Không thể tải dữ liệu phân tích: ' + err.message),
      500
    );
  }
}

/**
 * Kết xuất trang 403 / 404 / 500 lỗi thân thiện
 * @param {string} title 
 * @param {string} message 
 * @param {number} status 
 * @returns {Response}
 */
export function renderForbidden(title = '403 Forbidden', message = 'Truy cập bị từ chối', status = 403) {
  return htmlResponse(renderForbiddenPage(title, message), status);
}
