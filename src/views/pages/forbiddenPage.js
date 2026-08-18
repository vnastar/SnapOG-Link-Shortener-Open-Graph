// src/views/pages/forbiddenPage.js
// Giao diện Từ chối Truy cập (403 Forbidden / 404 Not Found)

import { escapeHTML } from '../../utils/security.js';

/**
 * Render trang thông báo lỗi truy cập 403 / 404
 * @param {string} message Tiêu đề lỗi
 * @param {string} detail Chi tiết lý do từ chối
 * @returns {string} HTML markup
 */
export function renderForbiddenPage(
  message = "Truy Cập Bị Từ Chối (403 Forbidden)", 
  detail = "Bạn không có quyền truy cập trực tiếp vào tên miền này nếu không có đường dẫn rút gọn hợp lệ."
) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>403 Forbidden - Truy Cập Bị Chặn</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 40px 30px;
      max-width: 480px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .icon {
      font-size: 50px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 12px;
      color: #ef4444;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .badge {
      display: inline-block;
      background: #334155;
      color: #cbd5e1;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🛡️</div>
    <h1>${escapeHTML(message)}</h1>
    <p>${escapeHTML(detail)}</p>
    <div class="badge">Protected by SnapOG Edge Guard</div>
  </div>
</body>
</html>`;
}
