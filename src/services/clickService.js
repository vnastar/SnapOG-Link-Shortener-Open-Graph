// src/services/clickService.js
// Dịch vụ ghi nhận và phân tích nhật ký truy cập (Clicks & Analytics)

import { getD1 } from './linkService.js';
import { getVietnamTimestamp } from '../utils/time.js';

/**
 * Ghi nhận lượt Click mới đầy đủ thông tin thiết bị và vị trí địa lý (Múi giờ GMT+7)
 * @param {object} envOrDb 
 * @param {string} slug 
 * @param {boolean|number} isBot 
 * @param {string} country 
 * @param {string} city 
 * @param {string} device 
 * @param {string} os 
 * @param {string} browser 
 * @param {string} ip 
 * @returns {Promise<any>}
 */
export async function recordClick(envOrDb, slug, isBot, country, city, device, os, browser, ip) {
  try {
    const db = getD1(envOrDb);
    if (!db || typeof db.prepare !== 'function') return;

    const vnTime = getVietnamTimestamp();

    const stmt = db.prepare(`
      INSERT INTO clicks (slug, is_bot, country, city, device, os, browser, ip, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    if (stmt && typeof stmt.bind === 'function') {
      const bound = stmt.bind(
        slug,
        isBot ? 1 : 0,
        country || 'Unknown',
        city || 'Unknown',
        device || 'Desktop',
        os || 'Unknown OS',
        browser || 'Unknown Browser',
        ip || 'Unknown',
        vnTime
      );
      if (bound && typeof bound.run === 'function') {
        return await bound.run();
      }
    }
  } catch (err) {
    console.error('Lỗi khi ghi nhận click:', err);
  }
}

/**
 * Lấy báo cáo phân tích chi tiết của 1 Link cụ thể
 * @param {object} envOrDb 
 * @param {string} slug 
 * @returns {Promise<object>}
 */
export async function getDetailedAnalytics(envOrDb, slug) {
  const db = getD1(envOrDb);
  if (!db || typeof db.prepare !== 'function') {
    return {
      summary: { total_clicks: 0, real_users: 0, bots: 0 },
      countries: [],
      cities: [],
      devices: [],
      osList: [],
      browsers: [],
      recentLogs: []
    };
  }

  const summary = await db.prepare(`
    SELECT 
      COUNT(*) as total_clicks,
      SUM(CASE WHEN is_bot = 0 THEN 1 ELSE 0 END) as real_users,
      SUM(CASE WHEN is_bot = 1 THEN 1 ELSE 0 END) as bots
    FROM clicks WHERE slug = ?
  `).bind(slug).first();

  const countries = await db.prepare(`
    SELECT country, COUNT(*) as count 
    FROM clicks 
    WHERE slug = ? AND is_bot = 0 AND country IS NOT NULL AND country != 'Unknown'
    GROUP BY country ORDER BY count DESC LIMIT 5
  `).bind(slug).all();

  const cities = await db.prepare(`
    SELECT city, COUNT(*) as count 
    FROM clicks 
    WHERE slug = ? AND is_bot = 0 AND city IS NOT NULL AND city != 'Unknown'
    GROUP BY city ORDER BY count DESC LIMIT 5
  `).bind(slug).all();

  const devices = await db.prepare(`
    SELECT device, COUNT(*) as count 
    FROM clicks 
    WHERE slug = ? AND is_bot = 0 AND device IS NOT NULL
    GROUP BY device ORDER BY count DESC
  `).bind(slug).all();

  const osList = await db.prepare(`
    SELECT os, COUNT(*) as count 
    FROM clicks 
    WHERE slug = ? AND is_bot = 0 AND os IS NOT NULL AND os != 'Unknown OS'
    GROUP BY os ORDER BY count DESC LIMIT 5
  `).bind(slug).all();

  const browsers = await db.prepare(`
    SELECT browser, COUNT(*) as count 
    FROM clicks 
    WHERE slug = ? AND is_bot = 0 AND browser IS NOT NULL AND browser != 'Unknown Browser'
    GROUP BY browser ORDER BY count DESC LIMIT 5
  `).bind(slug).all();

  const recentLogs = await db.prepare(`
    SELECT is_bot, country, city, device, os, browser, ip, created_at 
    FROM clicks 
    WHERE slug = ? AND is_bot = 0
    ORDER BY id DESC LIMIT 50
  `).bind(slug).all();

  return {
    summary: summary || { total_clicks: 0, real_users: 0, bots: 0 },
    countries: countries.results || [],
    cities: cities.results || [],
    devices: devices.results || [],
    osList: osList.results || [],
    browsers: browsers.results || [],
    recentLogs: recentLogs.results || []
  };
}

/**
 * Lấy danh sách nhật ký click có phân trang và bộ lọc linh hoạt (Người thật / Bot / Tất cả)
 * @param {object} envOrDb 
 * @param {object} options { slug, filter, page, limit }
 * @returns {Promise<{ logs: Array, total: number, page: number, limit: number, totalPages: number, filter: string }>}
 */
export async function getClickLogs(envOrDb, options = {}) {
  const db = getD1(envOrDb);
  if (!db || typeof db.prepare !== 'function') {
    return { logs: [], total: 0, page: 1, limit: 25, totalPages: 0, filter: 'real' };
  }

  const {
    slug = '',
    filter = 'real', // 'real' (mặc định is_bot = 0), 'bot' (is_bot = 1), 'all'
    page = 1,
    limit = 25
  } = options;

  const validLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 25));
  const validPage = Math.max(1, parseInt(page, 10) || 1);
  const offset = (validPage - 1) * validLimit;

  const whereClauses = [];
  const params = [];

  if (slug) {
    whereClauses.push('slug = ?');
    params.push(slug);
  }

  if (filter === 'real') {
    whereClauses.push('is_bot = 0');
  } else if (filter === 'bot') {
    whereClauses.push('is_bot = 1');
  } // 'all' không thêm điều kiện is_bot

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Đếm tổng số lượt click thỏa mãn bộ lọc
  const countSql = `SELECT COUNT(*) as total FROM clicks ${whereSql}`;
  let countResult;
  if (params.length > 0) {
    countResult = await db.prepare(countSql).bind(...params).first();
  } else {
    countResult = await db.prepare(countSql).first();
  }
  const total = countResult?.total || 0;
  const totalPages = Math.ceil(total / validLimit) || (total > 0 ? 1 : 0);

  // Lấy dữ liệu phân trang
  const querySql = `
    SELECT id, slug, is_bot, country, city, device, os, browser, ip, created_at
    FROM clicks
    ${whereSql}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...params, validLimit, offset];
  const { results } = await db.prepare(querySql).bind(...queryParams).all();

  return {
    logs: results || [],
    total,
    page: validPage,
    limit: validLimit,
    totalPages,
    filter
  };
}

/**
 * Lấy báo cáo tổng quan toàn bộ hệ thống (Dashboard Overview)
 * @param {object} envOrDb 
 * @returns {Promise<object>}
 */
export async function getGlobalAnalytics(envOrDb) {
  const db = getD1(envOrDb);
  if (!db || typeof db.prepare !== 'function') {
    return {
      summary: { total_links: 0, total_clicks: 0, real_users: 0, bots: 0 },
      topLinks: [],
      countries: [],
      cities: [],
      devices: [],
      recentLogs: []
    };
  }

  const summary = await db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM links) as total_links,
      COUNT(c.id) as total_clicks,
      SUM(CASE WHEN c.is_bot = 0 THEN 1 ELSE 0 END) as real_users,
      SUM(CASE WHEN c.is_bot = 1 THEN 1 ELSE 0 END) as bots
    FROM clicks c
  `).first();

  const topLinks = await db.prepare(`
    SELECT 
      l.slug, l.target_url, l.title,
      COUNT(c.id) as total_clicks,
      SUM(CASE WHEN c.is_bot = 0 THEN 1 ELSE 0 END) as real_clicks
    FROM links l
    LEFT JOIN clicks c ON l.slug = c.slug
    GROUP BY l.slug
    ORDER BY real_clicks DESC, total_clicks DESC
    LIMIT 10
  `).all();

  const countries = await db.prepare(`
    SELECT country, COUNT(*) as count FROM clicks 
    WHERE is_bot = 0 AND country IS NOT NULL AND country != 'Unknown'
    GROUP BY country ORDER BY count DESC LIMIT 5
  `).all();

  const cities = await db.prepare(`
    SELECT city, COUNT(*) as count FROM clicks 
    WHERE is_bot = 0 AND city IS NOT NULL AND city != 'Unknown'
    GROUP BY city ORDER BY count DESC LIMIT 5
  `).all();

  const devices = await db.prepare(`
    SELECT device, COUNT(*) as count FROM clicks 
    WHERE is_bot = 0 AND device IS NOT NULL
    GROUP BY device ORDER BY count DESC
  `).all();

  const recentLogs = await db.prepare(`
    SELECT slug, is_bot, country, city, device, os, browser, ip, created_at 
    FROM clicks 
    WHERE is_bot = 0
    ORDER BY id DESC LIMIT 25
  `).all();

  return {
    summary: summary || { total_links: 0, total_clicks: 0, real_users: 0, bots: 0 },
    topLinks: topLinks.results || [],
    countries: countries.results || [],
    cities: cities.results || [],
    devices: devices.results || [],
    recentLogs: recentLogs.results || []
  };
}
