// src/controllers/linkController.js
// Bộ điều khiển xử lý các nghiệp vụ Link: Tạo, Cập nhật, Thống kê, Xóa và Tải ảnh lên R2

import { 
  getAllLinks, 
  getLink, 
  saveLink, 
  deleteLink, 
  getD1 
} from '../services/linkService.js';
import { getDetailedAnalytics } from '../services/clickService.js';
import { 
  getR2, 
  uploadBase64ImageToR2, 
  uploadImageToR2 
} from '../services/r2StorageService.js';
import { arrayBufferToBase64 } from '../utils/image.js';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { renderOGMeta } from '../views/templates/ogMetaTemplate.js';
import { DEFAULT_CONFIG } from '../config/constants.js';

/**
 * Trích xuất domain rút gọn phù hợp từ env
 * @param {object} env 
 * @returns {string}
 */
function getShortDomain(env) {
  return env?.SHORT_DOMAIN || DEFAULT_CONFIG.SHORT_DOMAIN;
}

/**
 * Xác định Image Host tối ưu cho môi trường hiện tại
 * @param {object} env 
 * @param {string} host 
 * @param {URL} url 
 * @returns {string}
 */
function getImageHost(env, host, url) {
  if (env?.R2_PUBLIC_URL) return env.R2_PUBLIC_URL;
  if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('run.app')) {
    return url.origin;
  }
  return `https://${getShortDomain(env)}`;
}

/**
 * Lấy danh sách toàn bộ các Link kèm số liệu click (GET /api/links)
 * @param {Request} request 
 * @param {object} env 
 * @returns {Promise<Response>}
 */
export async function getAllLinksHandler(request, env) {
  try {
    const links = await getAllLinks(env.DB);
    return jsonResponse({
      success: true,
      data: links,
      count: links.length
    });
  } catch (err) {
    console.error('Lỗi khi lấy danh sách links:', err);
    return errorResponse('Không thể lấy danh sách links: ' + err.message, 500);
  }
}

/**
 * Lấy thống kê chi tiết nhanh của 1 Link cho Modal Analytics (GET /api/stats?slug=xxx)
 * @param {Request} request 
 * @param {object} env 
 * @param {URL} url 
 * @returns {Promise<Response>}
 */
export async function getLinkStatsHandler(request, env, url) {
  const slug = url.searchParams.get('slug');
  if (!slug) {
    return errorResponse('Thiếu tham số slug', 400);
  }

  try {
    const linkData = await getLink(env.DB, slug);
    if (!linkData) {
      return errorResponse('Link không tồn tại', 404);
    }

    const shortDomain = getShortDomain(env);
    const shortUrl = `https://${shortDomain}/${slug}`;
    const analyticsData = await getDetailedAnalytics(env.DB, slug);
    const botHtml = renderOGMeta(linkData, shortUrl);

    return jsonResponse({
      link: linkData,
      analytics: analyticsData,
      shortUrl,
      botHtml
    });
  } catch (err) {
    console.error('Lỗi khi lấy thống kê link:', err);
    return errorResponse('Lỗi truy xuất thống kê: ' + err.message, 500);
  }
}

/**
 * Tạo mới hoặc cập nhật Link (POST /api/links, POST /, POST /create)
 * @param {Request} request 
 * @param {object} env 
 * @param {URL} url 
 * @param {string} host 
 * @returns {Promise<Response>}
 */
export async function createOrUpdateLinkHandler(request, env, url, host) {
  try {
    let body = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await request.json().catch(() => ({}));
    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData().catch(() => new FormData());
      const file = formData.get('imageFile') || formData.get('file') || formData.get('image');
      let fileB64 = '';
      let fileType = '';
      let originalName = '';

      if (file && typeof file !== 'string' && file.size > 0) {
        const arrayBuf = await file.arrayBuffer();
        fileB64 = arrayBufferToBase64(arrayBuf);
        fileType = file.type;
        originalName = file.name;
      }

      body = {
        slug: formData.get('slug'),
        targetUrl: formData.get('targetUrl'),
        title: formData.get('title'),
        description: formData.get('description'),
        siteName: formData.get('siteName') || formData.get('site_name') || formData.get('sitename'),
        imageUrl: formData.get('imageUrl') || formData.get('imageUrlInput'),
        imageBase64: fileB64 || formData.get('imageBase64'),
        imageType: fileType || formData.get('imageType'),
        fileName: originalName || formData.get('fileName')
      };
    }

    let { 
      slug, 
      targetUrl, 
      title, 
      description, 
      siteName, 
      site_name, 
      sitename, 
      imageUrl: inputImageUrl, 
      imageBase64, 
      imageType, 
      fileName 
    } = body;

    const effectiveSiteName = siteName || site_name || sitename || '';

    if (!slug || !targetUrl) {
      return errorResponse('Slug và Target URL là bắt buộc', 400);
    }

    slug = String(slug).trim().replace(/^\/+/, '').replace(/\/+$/, '');
    targetUrl = String(targetUrl).trim();

    // Xử lý upload ảnh nếu có file base64
    const r2Bucket = getR2(env);
    let imageUrl = inputImageUrl ? String(inputImageUrl).trim() : '';

    if (imageBase64) {
      const imageHost = getImageHost(env, host, url);
      imageUrl = await uploadBase64ImageToR2(r2Bucket, imageBase64, imageType, fileName, imageHost);
    }

    await saveLink(env.DB, slug, targetUrl, title, description, imageUrl, effectiveSiteName);

    const shortDomain = getShortDomain(env);
    return jsonResponse({
      success: true,
      message: 'Lưu & Rút gọn link thành công!',
      slug,
      shortUrl: `https://${shortDomain}/${slug}`,
      imageUrl: imageUrl || '',
      siteName: effectiveSiteName || ''
    }, 200);

  } catch (err) {
    console.error('Lỗi khi lưu link:', err);
    return errorResponse('Lỗi xử lý dữ liệu: ' + err.message, 400);
  }
}

/**
 * Xóa an toàn Link, hình ảnh R2 và lịch sử thống kê (POST /delete, POST /api/delete)
 * @param {Request} request 
 * @param {object} env 
 * @returns {Promise<Response>}
 */
export async function deleteLinkHandler(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ 
      error: 'Phương thức không được phép (405). Vui lòng sử dụng POST để xóa link an toàn.' 
    }), {
      status: 405,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Allow': 'POST'
      }
    });
  }

  try {
    let slugToDelete = '';
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await request.json().catch(() => ({}));
      slugToDelete = data.slug || '';
    } else {
      const formData = await request.formData().catch(() => new FormData());
      slugToDelete = formData.get('slug') || '';
    }

    if (!slugToDelete) {
      return errorResponse('Thiếu slug cần xóa', 400);
    }

    const r2Bucket = getR2(env);
    const result = await deleteLink(env.DB, slugToDelete, r2Bucket);

    return jsonResponse({
      success: true,
      message: `Đã xóa thành công link /${slugToDelete}, hình ảnh và toàn bộ dữ liệu thống kê!`,
      details: result
    }, 200);

  } catch (err) {
    console.error('Lỗi khi xóa link:', err);
    return errorResponse('Lỗi khi xóa: ' + err.message, 500);
  }
}

/**
 * Tải ảnh trực tiếp lên R2 Storage độc lập (POST /api/upload)
 * @param {Request} request 
 * @param {object} env 
 * @param {URL} url 
 * @param {string} host 
 * @returns {Promise<Response>}
 */
export async function uploadImageHandler(request, env, url, host) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const r2Bucket = getR2(env);
    const imageHost = getImageHost(env, host, url);

    let uploadedUrl = '';
    let originalFileName = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('imageFile') || formData.get('file') || formData.get('image');
      if (!file || typeof file === 'string' || file.size === 0) {
        return errorResponse('Không tìm thấy file hợp lệ trong form data', 400);
      }
      originalFileName = file.name || 'image.jpg';
      uploadedUrl = await uploadImageToR2(r2Bucket, file, imageHost);
    } else if (contentType.includes('application/json')) {
      const json = await request.json().catch(() => ({}));
      const { imageBase64, imageType, fileName } = json;
      if (!imageBase64) {
        return errorResponse('Thiếu dữ liệu imageBase64', 400);
      }
      originalFileName = fileName || 'image.jpg';
      uploadedUrl = await uploadBase64ImageToR2(r2Bucket, imageBase64, imageType, originalFileName, imageHost);
    } else {
      return errorResponse('Content-Type không được hỗ trợ (cần multipart/form-data hoặc application/json)', 400);
    }

    if (!uploadedUrl) {
      return errorResponse('Không thể lưu ảnh vào hệ thống lưu trữ R2', 500);
    }

    return jsonResponse({
      success: true,
      message: 'Tải ảnh lên R2 Storage thành công!',
      imageUrl: uploadedUrl,
      fileName: originalFileName
    }, 200);

  } catch (err) {
    console.error('Lỗi upload ảnh API:', err);
    return errorResponse('Lỗi tải ảnh: ' + err.message, 500);
  }
}
