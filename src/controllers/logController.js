// src/controllers/logController.js
// Bộ điều khiển truy xuất và lọc lịch sử click chi tiết (/api/logs)

import { getClickLogs } from '../services/clickService.js';
import { jsonResponse, errorResponse } from '../utils/response.js';

/**
 * Lấy danh sách nhật ký click có phân trang và bộ lọc linh hoạt (GET /api/logs)
 * Query params hỗ trợ:
 * - slug: Lọc theo 1 link cụ thể (tùy chọn)
 * - filter: 'real' (mặc định - chỉ người thật), 'bot' (chỉ bot cào), 'all' (tất cả)
 * - page: Số trang (mặc định 1)
 * - limit: Số lượng mỗi trang (mặc định 25, tối đa 100)
 * 
 * @param {Request} request 
 * @param {object} env 
 * @param {URL} url 
 * @returns {Promise<Response>}
 */
export async function getLogsHandler(request, env, url) {
  try {
    const slug = url.searchParams.get('slug') || '';
    const filter = url.searchParams.get('filter') || 'real';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '25', 10);

    const data = await getClickLogs(env.DB, {
      slug,
      filter,
      page,
      limit
    });

    return jsonResponse({
      success: true,
      ...data
    });

  } catch (err) {
    console.error('Lỗi khi truy vấn logs:', err);
    return errorResponse('Không thể lấy nhật ký click: ' + err.message, 500);
  }
}
