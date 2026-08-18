// src/controllers/redirectController.js
// Bộ điều khiển xử lý điều hướng Link rút gọn, phân tách Real User vs Bot MXH và ghi nhận Analytics

import { getLink, getRandomLink } from '../services/linkService.js';
import { recordClick } from '../services/clickService.js';
import { parseClientInfo } from '../utils/uaParser.js';
import { renderOGMeta } from '../views/templates/ogMetaTemplate.js';
import { renderForbiddenPage } from '../views/pages/forbiddenPage.js';
import { htmlResponse, redirectResponse } from '../utils/response.js';

/**
 * Xử lý luồng truy cập trên tên miền rút gọn (Short Domain)
 * 
 * 1. Chặn các thao tác quản trị trên tên miền rút gọn (trả về 403)
 * 2. Tìm kiếm link theo slug hoặc lấy random link nếu slug không tồn tại / truy cập root
 * 3. Ghi nhận log click vào Cloudflare D1 (chạy qua ctx.waitUntil)
 * 4. Nếu là Bot MXH (FB, Zalo, Telegram...) -> Render thẻ Open Graph HTML để hiển thị preview
 * 5. Nếu là Người dùng thật -> Chuyển hướng 302 đến URL đích an toàn
 * 
 * @param {Request} request 
 * @param {object} env 
 * @param {object} ctx ExecutionContext của Cloudflare Worker
 * @param {URL} url 
 * @param {string} pathname 
 * @param {string} host 
 * @returns {Promise<Response>}
 */
export async function handleShortRedirect(request, env, ctx, url, pathname, host) {
  // 1. Chặn nếu cố tình truy cập vào các đường dẫn quản trị/API trên domain rút gọn
  if (
    pathname === '/stats' || 
    pathname === '/delete' || 
    pathname === '/login' || 
    pathname === '/logout' || 
    pathname.startsWith('/api/')
  ) {
    return htmlResponse(
      renderForbiddenPage(
        '403 Forbidden - Truy Cập Bị Chặn', 
        'Không được phép thực hiện các thao tác quản trị trên tên miền rút gọn.'
      ),
      403
    );
  }

  // 2. Lấy Slug từ đường dẫn
  const slug = pathname.substring(1).trim();

  let linkData = null;
  let isRandomFallback = false;

  if (!slug) {
    // 2.1. Truy cập trực tiếp root của domain rút gọn -> Lấy 1 link ngẫu nhiên có sẵn
    linkData = await getRandomLink(env.DB);
    isRandomFallback = true;
  } else {
    // 2.2. Tìm kiếm theo slug yêu cầu
    linkData = await getLink(env.DB, slug);

    // 2.3. Nếu slug không tồn tại -> Tự động chuyển hướng ngẫu nhiên tới 1 link bất kỳ
    if (!linkData) {
      linkData = await getRandomLink(env.DB);
      isRandomFallback = true;
    }
  }

  // 2.4. Dự phòng an toàn tuyệt đối nếu Database chưa có bất kỳ link nào
  if (!linkData) {
    const defaultFallbackUrl = env.DEFAULT_FALLBACK_URL || 'https://shopee.vn';
    linkData = {
      slug: slug || 'random-fallback',
      target_url: defaultFallbackUrl,
      title: 'Khám Phá Sản Phẩm & Ưu Đãi Hot Nhất Hôm Nay',
      description: 'Xem ngay các chương trình giảm giá, khuyến mãi và voucher độc quyền.',
      site_name: 'Shopee Mall',
      image_url: ''
    };
  }

  // 3. Phân tích thông tin người dùng và Ghi nhận Analytics
  const clientInfo = parseClientInfo(request);
  const effectiveSlug = linkData.slug || slug || 'random-fallback';

  const recordPromise = recordClick(
    env.DB, 
    effectiveSlug, 
    clientInfo.isBot, 
    clientInfo.country, 
    clientInfo.city, 
    clientInfo.device, 
    clientInfo.os, 
    clientInfo.browser, 
    clientInfo.ip
  );

  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(recordPromise);
  } else {
    await recordPromise;
  }

  // 4. Nếu là Bot MXH (Facebook, Zalo, Telegram...) -> Render thẻ Open Graph HTML
  if (clientInfo.isBot) {
    const ogHtml = renderOGMeta(linkData, request.url);
    return new Response(ogHtml, {
      status: 200,
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300'
      }
    });
  }

  // 5. Người dùng thật -> Chuyển hướng 302 an toàn tới URL gốc
  return redirectResponse(linkData.target_url, 302);
}
