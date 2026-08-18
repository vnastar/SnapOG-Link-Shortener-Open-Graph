// src/config/constants.js
// Cấu hình các hằng số hệ thống, nhận diện Bot và MIME types

export const DEFAULT_CONFIG = {
  ADMIN_DOMAIN: 'admin.domain.com',
  SHORT_DOMAIN: 'short.domain.com',
  AUTH_COOKIE_NAME: 'admin_session',
  ADMIN_KEY: 'MatKhauManh2026@',
  TIMEZONE: 'Asia/Ho_Chi_Minh'
};

// Regex nhận diện các Crawler / Bot mạng xã hội và công cụ tìm kiếm
export const BOT_USER_AGENT_PATTERNS = [
  'facebookexternalhit',
  'facebot',
  'facebookcatalog',
  'zalo',
  'zalobot',
  'telegrambot',
  'twitterbot',
  'tweetmemebot',
  'linkedinbot',
  'whatsapp',
  'discordbot',
  'skypeuripreview',
  'slackbot',
  'viber',
  'pinterest',
  'applebot',
  'googlebot',
  'bingbot',
  'yandexbot',
  'baiduspider',
  'duckduckbot',
  'bytespider',
  'tiktokbot',
  'redditbot',
  'quora link preview',
  'embedly',
  'outbrain',
  'vkshare',
  'w3c_validator'
];

export const BOT_REGEX = new RegExp(BOT_USER_AGENT_PATTERNS.join('|'), 'i');

// Bảng ánh xạ định dạng file ảnh (MIME Types)
export const IMAGE_MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// HTTP Header CORS mặc định
export const DEFAULT_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE, PUT',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, x-simulate-domain'
};
