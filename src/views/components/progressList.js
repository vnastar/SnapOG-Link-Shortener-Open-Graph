// src/views/components/progressList.js
// Component render danh sách thống kê thanh tiến trình (Quốc gia, Thành phố, Thiết bị, Trình duyệt)

import { escapeHTML } from '../../utils/security.js';

/**
 * Render danh sách thống kê với thanh phần trăm (Progress Bar)
 * @param {Array} list Danh sách item [{ [key]: '...', count: 10 }]
 * @param {number} total Tổng số lượt click dùng làm mẫu số
 * @param {string} key Tên trường dữ liệu (country, city, device, os, browser)
 * @returns {string} HTML markup
 */
export function renderProgressList(list, total, key) {
  if (!list || list.length === 0) {
    return '<p style="color:var(--text-muted); font-size:13px; padding: 10px 0;">Chưa có dữ liệu</p>';
  }

  const validTotal = Math.max(1, total || 1);

  return list.map(item => {
    const name = item[key] || 'Unknown';
    const percent = Math.round((item.count / validTotal) * 100);
    return `
      <div style="margin-bottom: 12px;">
        <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom: 2px;">
          <span><b>${escapeHTML(name)}</b></span>
          <span>${item.count} lượt (${percent}%)</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${percent}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}
