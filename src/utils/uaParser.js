// src/utils/uaParser.js
// Phân tích User-Agent để nhận diện thiết bị, hệ điều hành, trình duyệt và Crawler/Bot

import { BOT_REGEX } from '../config/constants.js';

/**
 * Kiểm tra xem User-Agent có phải là Bot/Crawler MXH hoặc Search Engine hay không
 * @param {string} ua User-Agent string
 * @returns {boolean}
 */
export function checkIsBot(ua) {
  if (!ua || typeof ua !== 'string') return false;
  return BOT_REGEX.test(ua) || /crawler|spider|robot|curl|wget/i.test(ua);
}

/**
 * Nhận diện loại thiết bị (Mobile, Tablet, Desktop)
 * @param {string} ua User-Agent string
 * @returns {'Mobile' | 'Tablet' | 'Desktop'}
 */
export function getDeviceType(ua) {
  if (!ua) return 'Desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|windows phone/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

/**
 * Nhận diện Hệ điều hành (iOS, Android, Windows, macOS, Linux...)
 * @param {string} ua User-Agent string
 * @returns {string}
 */
export function getOS(ua) {
  if (!ua) return 'Unknown OS';
  if (/windows/i.test(ua)) return 'Windows';
  if (/macintosh|mac os x/i.test(ua)) return 'macOS';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/android/i.test(ua)) return 'Android';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Unknown OS';
}

/**
 * Nhận diện Trình duyệt hoặc Ứng dụng tích hợp (In-app Browser)
 * @param {string} ua User-Agent string
 * @returns {string}
 */
export function getBrowser(ua) {
  if (!ua) return 'Unknown Browser';
  if (/telegram/i.test(ua)) return 'Telegram App';
  if (/zalo/i.test(ua)) return 'Zalo App';
  if (/fban|fbav/i.test(ua)) return 'Facebook App';
  if (/edg/i.test(ua)) return 'Edge';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) return 'Safari';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  return 'Other Browser';
}

/**
 * Phân tích toàn diện thông tin client từ Request
 * @param {Request} request 
 * @returns {{ isBot: boolean, device: string, os: string, browser: string, ip: string, country: string, city: string }}
 */
export function parseClientInfo(request) {
  const ua = request.headers.get('user-agent') || '';
  const ip = request.headers.get('cf-connecting-ip') || 
             request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
             '127.0.0.1';
  
  const country = request.cf?.country || 'Vietnam';
  const city = request.cf?.city || 'Hanoi';

  return {
    userAgent: ua,
    ip,
    country,
    city,
    isBot: checkIsBot(ua),
    device: getDeviceType(ua),
    os: getOS(ua),
    browser: getBrowser(ua)
  };
}
