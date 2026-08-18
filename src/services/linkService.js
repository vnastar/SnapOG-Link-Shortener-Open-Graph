// src/services/linkService.js
// Dịch vụ quản lý dữ liệu bảng links (CRUD, Random Link, Xóa Link + Tài nguyên liên kết)

import { getVietnamTimestamp } from '../utils/time.js';
import { getR2, deleteImageFromR2 } from './r2StorageService.js';

/**
 * Trích xuất D1 Database từ biến env hoặc đối tượng database
 * @param {object} envOrDb 
 * @returns {D1Database|null}
 */
export function getD1(envOrDb) {
  if (!envOrDb) return null;
  return envOrDb.DB || envOrDb.LINKS_DB || envOrDb;
}

/**
 * Lấy danh sách toàn bộ Link kèm tổng số lượt click (phân tách Real vs Bot)
 * @param {object} envOrDb 
 * @returns {Promise<Array>}
 */
export async function getAllLinks(envOrDb) {
  const db = getD1(envOrDb);
  if (!db || typeof db.prepare !== 'function') return [];

  const query = `
    SELECT 
      l.slug, 
      l.target_url, 
      l.title, 
      l.description, 
      l.image_url, 
      l.site_name,
      l.created_at,
      COUNT(c.id) as total_clicks,
      COALESCE(SUM(CASE WHEN c.id IS NOT NULL AND c.is_bot = 0 THEN 1 ELSE 0 END), 0) as real_clicks,
      COALESCE(SUM(CASE WHEN c.id IS NOT NULL AND c.is_bot = 1 THEN 1 ELSE 0 END), 0) as bot_clicks
    FROM links l
    LEFT JOIN clicks c ON l.slug = c.slug
    GROUP BY l.slug
    ORDER BY l.created_at DESC
  `;

  const { results } = await db.prepare(query).all();
  return results || [];
}

/**
 * Lấy thông tin chi tiết của 1 Link theo slug
 * @param {object} envOrDb 
 * @param {string} slug 
 * @returns {Promise<object|null>}
 */
export async function getLink(envOrDb, slug) {
  const db = getD1(envOrDb);
  if (!db || typeof db.prepare !== 'function') return null;

  return await db.prepare(`SELECT * FROM links WHERE slug = ?`).bind(slug).first();
}

/**
 * Lấy ngẫu nhiên 1 Link bất kỳ có sẵn trong CSDL
 * @param {object} envOrDb 
 * @returns {Promise<object|null>}
 */
export async function getRandomLink(envOrDb) {
  const db = getD1(envOrDb);
  if (!db || typeof db.prepare !== 'function') return null;

  try {
    const result = await db.prepare(`
      SELECT slug, target_url, title, description, image_url, site_name, created_at 
      FROM links 
      ORDER BY RANDOM() 
      LIMIT 1
    `).first();
    return result || null;
  } catch (err) {
    console.error('Lỗi khi truy vấn random link:', err);
    return null;
  }
}

/**
 * Thêm mới hoặc Cập nhật Link (UPSERT)
 * @param {object} envOrDb 
 * @param {string} slug 
 * @param {string} targetUrl 
 * @param {string} title 
 * @param {string} description 
 * @param {string} imageUrl 
 * @param {string} siteName 
 * @returns {Promise<any>}
 */
export async function saveLink(envOrDb, slug, targetUrl, title = '', description = '', imageUrl = '', siteName = '') {
  const db = getD1(envOrDb);
  if (!db || typeof db.prepare !== 'function') throw new Error('Database binding không hợp lệ');

  const vnTime = getVietnamTimestamp();

  return await db.prepare(`
    INSERT INTO links (slug, target_url, title, description, image_url, site_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      target_url = excluded.target_url,
      title = excluded.title,
      description = excluded.description,
      site_name = excluded.site_name,
      image_url = CASE 
        WHEN excluded.image_url IS NOT NULL AND excluded.image_url != '' THEN excluded.image_url 
        ELSE links.image_url 
      END
  `).bind(
    slug, 
    targetUrl, 
    title || '', 
    description || '', 
    imageUrl || '',
    siteName || '',
    vnTime
  ).run();
}

/**
 * Xóa hoàn toàn Link, hình ảnh R2 liên kết và toàn bộ dữ liệu nhật ký click
 * @param {object} envOrDb 
 * @param {string} slug 
 * @param {R2Bucket} [r2Bucket] 
 * @returns {Promise<{ success: boolean, slug: string, deletedClicks: number, deletedImage: boolean, hadImage: boolean }>}
 */
export async function deleteLink(envOrDb, slug, r2Bucket = null) {
  const db = getD1(envOrDb);
  if (!db || typeof db.prepare !== 'function') throw new Error('Database binding không hợp lệ');

  const cleanSlug = String(slug || '').trim().replace(/^\/+/, '').replace(/\/+$/, '');
  if (!cleanSlug) throw new Error('Slug không hợp lệ để xóa');

  // 1. Lấy thông tin link trước khi xóa để lấy ảnh liên kết
  let existingLink = null;
  try {
    existingLink = await db.prepare(`SELECT image_url FROM links WHERE slug = ?`).bind(cleanSlug).first();
  } catch (e) {
    console.warn('Không thể đọc thông tin link trước khi xóa:', e.message);
  }

  // 2. Xóa ảnh khỏi R2 Storage nếu link có ảnh lưu trên R2
  const bucket = r2Bucket || (envOrDb && typeof envOrDb === 'object' ? getR2(envOrDb) : null);
  let deletedImage = false;
  if (existingLink && existingLink.image_url) {
    deletedImage = await deleteImageFromR2(bucket, existingLink.image_url);
  }

  // 3. Xóa toàn bộ logs click của slug này trong bảng clicks
  const clickRes = await db.prepare(`DELETE FROM clicks WHERE slug = ?`).bind(cleanSlug).run();

  // 4. Xóa bản ghi link khỏi bảng links
  const linkRes = await db.prepare(`DELETE FROM links WHERE slug = ?`).bind(cleanSlug).run();

  return {
    success: true,
    slug: cleanSlug,
    deletedClicks: clickRes?.meta?.changes ?? clickRes?.changes ?? 0,
    deletedImage,
    hadImage: !!existingLink?.image_url
  };
}
