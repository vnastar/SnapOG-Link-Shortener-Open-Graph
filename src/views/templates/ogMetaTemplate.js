// src/views/templates/ogMetaTemplate.js
// Template HTML trả về cho Bot / Crawler mạng xã hội (Facebook, Zalo, Telegram, Twitter, Discord, Google...)

import { escapeHTML } from '../../utils/security.js';

/**
 * Render trang HTML chứa đầy đủ thẻ Meta Open Graph, Twitter Cards, Schema.org và script redirect tự động
 * @param {object} link Thông tin link từ database
 * @param {string} requestUrl URL hiện tại của request (Canonical URL)
 * @returns {string} HTML markup
 */
export function renderOGMeta(link = {}, requestUrl = '') {
  const title = link.title || "SnapOG Link";
  const description = link.description || "";
  const siteName = link.site_name || link.sitename || link.siteName || "VnStar SnapOG";
  let image = link.image_url || "";
  const targetUrl = link.target_url || "#";
  const canonicalUrl = requestUrl || targetUrl;

  if (image && image.startsWith('/')) {
    try {
      const u = new URL(canonicalUrl);
      image = `${u.origin}${image}`;
    } catch(e) {}
  }

  let imageType = "image/jpeg";
  const lowerImg = image.toLowerCase();
  if (lowerImg.endsWith(".png")) imageType = "image/png";
  else if (lowerImg.endsWith(".webp")) imageType = "image/webp";
  else if (lowerImg.endsWith(".gif")) imageType = "image/gif";
  else if (lowerImg.endsWith(".svg")) imageType = "image/svg+xml";

  const imgTags = image ? `
  <meta property="og:image" content="${escapeHTML(image)}">
  <meta property="og:image:url" content="${escapeHTML(image)}">
  <meta property="og:image:secure_url" content="${escapeHTML(image)}">
  <meta property="og:image:type" content="${imageType}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHTML(title)}">
  <link rel="image_src" href="${escapeHTML(image)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${escapeHTML(image)}">
  <meta name="twitter:image:src" content="${escapeHTML(image)}">
  <meta name="twitter:image:alt" content="${escapeHTML(title)}">
  <meta itemprop="image" content="${escapeHTML(image)}">` : `
  <meta name="twitter:card" content="summary">`;

  const previewCardImg = image ? `<img src="${escapeHTML(image)}" alt="Preview" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">` : "";

  return `<!DOCTYPE html>
<html lang="vi" prefix="og: https://ogp.me/ns# fb: https://ogp.me/ns/fb#">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <title>${escapeHTML(title)}</title>
  <meta name="description" content="${escapeHTML(description)}">
  <link rel="canonical" href="${escapeHTML(canonicalUrl)}">
  
  <!-- Open Graph / Facebook / Zalo / Telegram / iMessage -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapeHTML(siteName)}">
  <meta property="og:url" content="${escapeHTML(canonicalUrl)}">
  <meta property="og:title" content="${escapeHTML(title)}">
  <meta property="og:description" content="${escapeHTML(description)}">
  ${imgTags}

  <!-- Twitter / Telegram Cards -->
  <meta name="twitter:site" content="${escapeHTML(siteName)}">
  <meta name="twitter:url" content="${escapeHTML(canonicalUrl)}">
  <meta name="twitter:title" content="${escapeHTML(title)}">
  <meta name="twitter:description" content="${escapeHTML(description)}">

  <!-- Schema.org for Search Engines -->
  <meta itemprop="name" content="${escapeHTML(title)}">
  <meta itemprop="description" content="${escapeHTML(description)}">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; text-align: center; background: #f8fafc; color: #334155;">
  <div style="max-width: 500px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
    ${previewCardImg}
    <div style="font-size: 12px; text-transform: uppercase; color: #0284c7; font-weight: 700; margin-bottom: 6px; letter-spacing: 0.5px;">${escapeHTML(siteName)}</div>
    <h2 style="font-size: 18px; margin-bottom: 10px; color: #0f172a;">${escapeHTML(title)}</h2>
    <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">${escapeHTML(description)}</p>
    <p style="font-size: 13px; color: #94a3b8;">Đang chuyển hướng tới nội dung...</p>
    <a href="${escapeHTML(targetUrl)}" style="display: inline-block; background: #0284c7; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 10px;">Bấm vào đây nếu không tự chuyển</a>
  </div>
  <script>
    setTimeout(function() {
      try { window.location.replace(${JSON.stringify(targetUrl)}); } catch(e) { window.location.href = ${JSON.stringify(targetUrl)}; }
    }, 250);
  </script>
</body>
</html>`;
}
