// src/controllers/imageController.js
// Bộ điều khiển phục vụ hình ảnh lưu trữ trên Cloudflare R2 Storage (/images/*)

import { getR2, getImageFromR2 } from '../services/r2StorageService.js';
import { getMimeType } from '../utils/image.js';

/**
 * Xử lý yêu cầu truy xuất và phân phối hình ảnh từ R2 Bucket (GET /images/:name)
 * 
 * @param {Request} request 
 * @param {object} env 
 * @param {string} imageName Tên file ảnh trích xuất từ URL
 * @returns {Promise<Response>}
 */
export async function serveImage(request, env, imageName) {
  if (!imageName) {
    return new Response('Tên hình ảnh không hợp lệ', { status: 400 });
  }

  const r2Bucket = getR2(env);
  if (!r2Bucket) {
    return new Response('Kho lưu trữ R2 chưa được cấu hình', { status: 503 });
  }

  try {
    const object = await getImageFromR2(r2Bucket, imageName);
    if (!object) {
      return new Response('Hình ảnh không tồn tại trên hệ thống (404 Not Found)', { status: 404 });
    }

    const headers = new Headers();
    if (typeof object.writeHttpMetadata === 'function') {
      object.writeHttpMetadata(headers);
    }
    
    // Gán ETag và Cache-Control dài hạn tối ưu cho CDN Edge Caching
    if (object.httpEtag) {
      headers.set('ETag', object.httpEtag);
    }
    
    // Kiểm tra Conditional Request (If-None-Match) để trả về 304 Not Modified
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch && object.httpEtag && ifNoneMatch === object.httpEtag) {
      return new Response(null, { status: 304, headers });
    }

    // Đảm bảo có Content-Type chuẩn
    if (!headers.has('Content-Type') || headers.get('Content-Type') === 'application/octet-stream') {
      headers.set('Content-Type', getMimeType(imageName));
    }

    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(object.body, {
      status: 200,
      headers
    });

  } catch (err) {
    console.error(`Lỗi khi lấy ảnh R2 (${imageName}):`, err);
    return new Response('Lỗi khi tải ảnh từ hệ thống: ' + err.message, { status: 500 });
  }
}
