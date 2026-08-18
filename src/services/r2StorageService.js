// src/services/r2StorageService.js
// Dịch vụ quản lý lưu trữ hình ảnh trên Cloudflare R2 & Simulator

import { extractR2Key } from '../utils/image.js';

/**
 * Trích xuất R2 Bucket từ env hoặc đối tượng bucket
 * Hỗ trợ các tên biến: MY_R2_BUCKET, IMAGES_BUCKET, R2_BUCKET, BUCKET
 * @param {object} envOrBucket 
 * @returns {R2Bucket|null}
 */
export function getR2(envOrBucket) {
  if (!envOrBucket) return null;
  return envOrBucket.IMAGES_BUCKET || 
         envOrBucket.MY_R2_BUCKET || 
         envOrBucket.R2_BUCKET || 
         envOrBucket.BUCKET || 
         envOrBucket;
}

/**
 * Chuyển Base64 sang Uint8Array chuẩn Web API (không phụ thuộc Buffer của Node.js)
 * @param {string} base64 
 * @returns {Uint8Array}
 */
function base64ToUint8Array(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Tải ảnh dạng Base64 lên R2 Bucket
 * @param {R2Bucket} bucket 
 * @param {string} base64Data Chuỗi Data URL hoặc Base64 thô
 * @param {string} mimeType Content-Type của ảnh
 * @param {string} originalName Tên file gốc (nếu có)
 * @param {string} host Host để tạo đường dẫn tuyệt đối (tùy chọn)
 * @returns {Promise<string>} Đường dẫn ảnh hoặc Data URL fallback
 */
export async function uploadBase64ImageToR2(bucket, base64Data, mimeType, originalName, host) {
  if (!base64Data) return "";
  const parts = base64Data.split(',');
  const rawBase64 = parts.length > 1 ? parts[1] : parts[0];
  const buffer = base64ToUint8Array(rawBase64);
  
  let ext = 'jpg';
  if (originalName && originalName.includes('.')) {
    ext = originalName.split('.').pop().toLowerCase();
  } else if (mimeType) {
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('gif')) ext = 'gif';
    else if (mimeType.includes('svg')) ext = 'svg';
  }

  const fileName = `og-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

  if (bucket && typeof bucket.put === 'function') {
    await bucket.put(fileName, buffer, {
      httpMetadata: { contentType: mimeType || 'image/jpeg' }
    });
    
    if (!host) {
      return `/images/${fileName}`;
    }
    if (host.startsWith('http://') || host.startsWith('https://')) {
      return `${host.replace(/\/+$/, '')}/images/${fileName}`;
    }
    return `https://${host.replace(/\/+$/, '')}/images/${fileName}`;
  }

  // Fallback Data URL nếu chưa gắn R2
  return `data:${mimeType || 'image/jpeg'};base64,${rawBase64}`;
}

/**
 * Tải file (Blob/File) trực tiếp lên R2 Bucket
 * @param {R2Bucket} bucket 
 * @param {File|Blob} file 
 * @param {string} host 
 * @returns {Promise<string>}
 */
export async function uploadImageToR2(bucket, file, host) {
  if (!file || !file.size) return "";
  const extension = file.name ? (file.name.split('.').pop() || 'jpg') : 'jpg';
  const fileName = `og-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${extension}`;

  if (bucket && typeof bucket.put === 'function') {
    await bucket.put(fileName, file.stream ? file.stream() : file, {
      httpMetadata: { contentType: file.type || 'image/jpeg' }
    });
    
    if (!host) {
      return `/images/${fileName}`;
    }
    if (host.startsWith('http://') || host.startsWith('https://')) {
      return `${host.replace(/\/+$/, '')}/images/${fileName}`;
    }
    return `https://${host.replace(/\/+$/, '')}/images/${fileName}`;
  }

  return "";
}

/**
 * Trích xuất file key từ đường dẫn hoặc URL ảnh
 * @param {string} imageUrl 
 * @returns {string|null}
 */
export function extractImageKey(imageUrl) {
  return extractR2Key(imageUrl);
}

/**
 * Xóa file ảnh khỏi R2 Storage
 * @param {object} bucketOrEnv R2Bucket hoặc env
 * @param {string} imageUrlOrKey URL hoặc tên file
 * @returns {Promise<boolean>}
 */
export async function deleteImageFromR2(bucketOrEnv, imageUrlOrKey) {
  const bucket = getR2(bucketOrEnv);
  if (!bucket || typeof bucket.delete !== 'function') return false;

  const key = extractImageKey(imageUrlOrKey) || (typeof imageUrlOrKey === 'string' && imageUrlOrKey.startsWith('og-') ? imageUrlOrKey : null);
  if (!key) return false;

  try {
    await bucket.delete(key);
    return true;
  } catch (err) {
    console.error(`Lỗi khi xóa ảnh R2 (${key}):`, err);
    return false;
  }
}

/**
 * Lấy file ảnh từ R2 Bucket
 * @param {R2Bucket} bucket 
 * @param {string} imageName 
 * @returns {Promise<R2ObjectBody|null>}
 */
export async function getImageFromR2(bucket, imageName) {
  if (!bucket || typeof bucket.get !== 'function') return null;
  return await bucket.get(imageName);
}
