// src/views/pages/analyticsPage.js
// Giao diện Báo Cáo Phân Tích Chi Tiết Từng Link (/stats?slug=...)

import { BASE_STYLES } from '../styles/baseStyles.js';
import { renderProgressList } from '../components/progressList.js';
import { renderOGMeta } from '../templates/ogMetaTemplate.js';
import { escapeHTML } from '../../utils/security.js';
import { formatVNTime } from '../../utils/time.js';

/**
 * Render trang báo cáo phân tích chi tiết cho 1 link cụ thể
 * @param {string} slug Mã rút gọn
 * @param {object} linkData Thông tin link từ database
 * @param {object} analyticsData Dữ liệu phân tích từ clickService.getDetailedAnalytics
 * @param {string} shortUrl URL rút gọn đầy đủ
 * @param {string} botHtml Mã HTML trả về cho bot preview
 * @returns {string} HTML markup
 */
export function renderAnalyticsHTML(slug, linkData = {}, analyticsData = {}, shortUrl, botHtml) {
  const summary = (analyticsData && analyticsData.summary) || { total_clicks: 0, real_users: 0, bots: 0 };
  const totalReal = summary.real_users || 1;
  const currentShortUrl = shortUrl || (`https://reviewphim.vnastar.com/${slug}`);
  const currentBotHtml = botHtml || renderOGMeta(linkData, currentShortUrl);

  const recentLogs = (analyticsData && analyticsData.recentLogs) || [];
  const countries = (analyticsData && analyticsData.countries) || [];
  const cities = (analyticsData && analyticsData.cities) || [];
  const devices = (analyticsData && analyticsData.devices) || [];
  const osList = (analyticsData && analyticsData.osList) || [];
  const browsers = (analyticsData && analyticsData.browsers) || [];

  const recentLogsRows = recentLogs.length === 0 
    ? '<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 30px;">Chưa ghi nhận lượt click nào.</td></tr>' 
    : recentLogs.map(log => `
      <tr>
        <td style="font-size:12px; color:var(--text-muted); font-family: monospace;">${formatVNTime(log.created_at)}</td>
        <td>
          ${log.is_bot ? '<span class="badge badge-bot">🤖 Bot</span>' : '<span class="badge badge-real">👤 Người thật</span>'}
        </td>
        <td><code class="code-tag">${escapeHTML(log.ip)}</code></td>
        <td><b>${escapeHTML(log.device)}</b> • ${escapeHTML(log.os)}</td>
        <td>${escapeHTML(log.browser)}</td>
        <td>${escapeHTML(log.country)} - ${escapeHTML(log.city)}</td>
      </tr>
    `).join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo cáo Analytics: /${escapeHTML(slug)}</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="brand-logo">S</div>
        <div>
          <h1>📊 Báo Cáo Phân Tích Chi Tiết</h1>
          <p style="font-size: 12px; color: var(--text-muted);">Slug: <span class="code-tag">/${escapeHTML(slug)}</span></p>
        </div>
      </div>
      <a href="/" class="btn btn-secondary">⬅ Quay lại Dashboard</a>
    </header>

    <div class="card">
      <div class="card-title">🔗 Thông tin Cấu Hình Link & Preview</div>
      <div style="margin-bottom: 14px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px 14px; border-radius: 8px;">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <b style="color: #166534; font-size:14px;">🔗 Link Rút Gọn:</b>
          <a href="${escapeHTML(currentShortUrl)}" target="_blank" style="color: var(--primary); font-weight: 700; font-family: monospace; font-size: 14px; background: #fff; padding: 5px 10px; border-radius: 6px; border: 1px solid #bbf7d0; word-break: break-all;">${escapeHTML(currentShortUrl)}</a>
          <button onclick="navigator.clipboard.writeText('${escapeHTML(currentShortUrl)}'); alert('Đã sao chép link rút gọn!')" class="btn btn-primary btn-sm">📋 Sao chép Link</button>
          <a href="${escapeHTML(currentShortUrl)}" target="_blank" class="btn btn-secondary btn-sm">↗ Mở Link Rút Gọn</a>
        </div>
      </div>
      <p style="margin-bottom: 8px;"><b>URL Đích:</b> <a href="${escapeHTML(linkData.target_url)}" target="_blank" style="color: var(--primary); word-break:break-all;">${escapeHTML(linkData.target_url)}</a></p>
      <p style="margin-bottom: 8px;"><b>Tiêu đề OG:</b> ${escapeHTML(linkData.title || 'Chưa thiết lập')}</p>
      ${linkData.site_name ? `<p style="margin-bottom: 8px;"><b>Tên Trang / Brand (og:site_name):</b> <span style="color: #0284c7; font-weight: 600;">${escapeHTML(linkData.site_name)}</span></p>` : ''}
      <p style="margin-bottom: 8px;"><b>Mô tả OG:</b> ${escapeHTML(linkData.description || 'Chưa thiết lập')}</p>
      <div style="margin-bottom: 14px;">
        <b>Link Hình Ảnh (Image URL):</b>
        ${linkData.image_url ? `
          <div style="display:flex; align-items:center; gap:8px; margin-top:4px; flex-wrap:wrap;">
            <a href="${escapeHTML(linkData.image_url)}" target="_blank" style="color: var(--primary); word-break: break-all; font-family: monospace; font-size: 13px; background: #f1f5f9; padding: 5px 10px; border-radius: 6px; border: 1px solid var(--border);">${escapeHTML(linkData.image_url)}</a>
            <button onclick="navigator.clipboard.writeText('${escapeHTML(linkData.image_url)}'); alert('Đã sao chép link ảnh!')" class="btn btn-secondary btn-sm">📋 Sao chép link ảnh</button>
            <a href="${escapeHTML(linkData.image_url)}" target="_blank" class="btn btn-secondary btn-sm">↗ Mở ảnh gốc</a>
          </div>
          <div style="margin-top: 10px;">
            <a href="${escapeHTML(linkData.image_url)}" target="_blank"><img src="${escapeHTML(linkData.image_url)}" onerror="handleImgError(this)" alt="Banner OG" style="max-width: 360px; width: 100%; border-radius: 8px; margin-top: 4px; border: 1px solid var(--border); box-shadow: 0 2px 4px rgba(0,0,0,0.05);"></a>
          </div>
        ` : '<span style="color:var(--text-muted); margin-left: 4px;">Không có hình ảnh</span>'}
      </div>
      <div style="margin-top: 16px; border-top: 1px solid var(--border); padding-top: 14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
          <div>
            <b>🤖 Mã HTML Thẻ Meta khi Bot / Crawler (Facebook, Zalo, Telegram, Google) cào link:</b>
            <p style="font-size:12px; color:var(--text-muted); margin:2px 0 0 0;">Mã nguồn HTML đầy đủ mà server trả về cho crawler để hiển thị preview hình ảnh và tiêu đề.</p>
          </div>
          <button onclick="navigator.clipboard.writeText(document.getElementById('full-bot-html').innerText); alert('Đã sao chép toàn bộ HTML Bot!')" class="btn btn-secondary btn-sm">📋 Sao chép HTML Bot</button>
        </div>
        <div id="full-bot-html" class="code-block">${escapeHTML(currentBotHtml)}</div>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card"><div class="stat-title">📈 Tổng Click</div><div class="stat-num">${summary.total_clicks || 0}</div></div>
      <div class="stat-card"><div class="stat-title">👤 Người Thật</div><div class="stat-num" style="color: var(--success);">${summary.real_users || 0}</div></div>
      <div class="stat-card"><div class="stat-title">🤖 Bot / Crawler</div><div class="stat-num" style="color: var(--text-muted);">${summary.bots || 0}</div></div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 24px;">
      <div class="card" style="margin: 0;"><div class="card-title">🌍 Top Quốc Gia</div>${renderProgressList(countries, totalReal, 'country')}</div>
      <div class="card" style="margin: 0;"><div class="card-title">🏙️ Top Thành Phố</div>${renderProgressList(cities, totalReal, 'city')}</div>
      <div class="card" style="margin: 0;"><div class="card-title">📱 Loại Thiết Bị</div>${renderProgressList(devices, totalReal, 'device')}</div>
      <div class="card" style="margin: 0;"><div class="card-title">💻 Hệ Điều Hành</div>${renderProgressList(osList, totalReal, 'os')}</div>
      <div class="card" style="margin: 0;"><div class="card-title">🌐 Trình Duyệt</div>${renderProgressList(browsers, totalReal, 'browser')}</div>
    </div>

    <!-- Nhật Ký Truy Cập Chi Tiết (Phân Trang & Bộ Lọc) -->
    <div class="card" id="logsCard">
      <div class="card-title" style="margin-bottom: 14px;">
        <span>🕒 Nhật Ký Truy Cập: /${escapeHTML(slug)}</span>
        <button class="btn btn-secondary btn-sm" onclick="reloadLogsTable()">🔄 Làm mới</button>
      </div>

      <div class="log-toolbar">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span style="font-size:13px; font-weight:600; color:var(--text-muted);">Lọc theo:</span>
          <div class="filter-group" id="logFilterGroup">
            <button class="filter-btn active" data-filter="real" onclick="setLogFilter('real')">👤 Người thật</button>
            <button class="filter-btn" data-filter="bot" onclick="setLogFilter('bot')">🤖 Bot / Crawler</button>
            <button class="filter-btn" data-filter="all" onclick="setLogFilter('all')">🌐 Tất cả</button>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:8px;">
          <label for="logPageSize" style="margin-bottom:0; font-size:13px; font-weight:600; color:var(--text-muted); white-space:nowrap;">Hiển thị:</label>
          <select id="logPageSize" onchange="changeLogLimit(this.value)" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); background:#fff; font-size:13px; font-weight:600; cursor:pointer;">
            <option value="10">10 dòng</option>
            <option value="25" selected>25 dòng</option>
            <option value="50">50 dòng</option>
            <option value="100">100 dòng</option>
          </select>
        </div>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Thời Gian (GMT+7)</th>
              <th>Loại Khách</th>
              <th>Địa Chỉ IP</th>
              <th>Thiết Bị & OS</th>
              <th>Trình Duyệt</th>
              <th>Vị Trí</th>
            </tr>
          </thead>
          <tbody id="logsTableBody">
            ${recentLogsRows}
          </tbody>
        </table>
      </div>

      <div class="pagination-container" id="logPaginationContainer">
        <div id="logCountInfo">Đang tải phân trang...</div>
        <div class="pagination-nav" id="logPaginationNav"></div>
      </div>
    </div>
  </div>
  <script>
    (function initAuthStorage() {
      var urlParams = new URLSearchParams(window.location.search);
      var keyFromUrl = urlParams.get('key') || urlParams.get('adminKey');
      if (keyFromUrl) {
        localStorage.setItem('snapog_admin_key', keyFromUrl);
        sessionStorage.setItem('snapog_admin_key', keyFromUrl);
      }
    })();

    function getAuthKey() {
      return localStorage.getItem('snapog_admin_key') || sessionStorage.getItem('snapog_admin_key') || '';
    }

    function getAuthHeaders(headersObj) {
      var headers = headersObj || {};
      var key = getAuthKey();
      if (key) {
        headers['Authorization'] = 'Bearer ' + key;
        headers['x-admin-key'] = key;
      }
      return headers;
    }

    function handleImgError(el) {
      if (!el) return;
      el.onerror = null;
      if (el.src && el.src.indexOf('/images/') !== -1) {
        var parts = el.src.split('/images/');
        if (parts.length > 1) {
          el.src = '/images/' + parts[1];
          return;
        }
      }
      el.style.display = 'none';
    }

    function escapeClientHTML(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // ==========================================
    // LOGS PAGINATION & FILTERING CLIENT SCRIPT
    // ==========================================
    var logSlug = '${escapeHTML(slug)}';
    var hasSlugCol = false;
    var currentLogPage = 1;
    var currentLogLimit = 25;
    var currentLogFilter = 'real'; // Mặc định là Người thật
    var currentLogTotal = 0;
    var currentLogTotalPages = 1;

    function setLogFilter(filter) {
      currentLogFilter = filter;
      currentLogPage = 1;
      var buttons = document.querySelectorAll('#logFilterGroup .filter-btn');
      buttons.forEach(function(btn) {
        if (btn.getAttribute('data-filter') === filter) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      fetchLogs();
    }

    function changeLogLimit(limit) {
      currentLogLimit = parseInt(limit, 10) || 25;
      currentLogPage = 1;
      fetchLogs();
    }

    function gotoLogPage(page) {
      if (page < 1 || (currentLogTotalPages > 0 && page > currentLogTotalPages)) return;
      currentLogPage = page;
      fetchLogs();
    }

    function reloadLogsTable() {
      fetchLogs();
    }

    async function fetchLogs() {
      var tbody = document.getElementById('logsTableBody');
      var countInfo = document.getElementById('logCountInfo');
      var nav = document.getElementById('logPaginationNav');
      if (!tbody) return;

      tbody.style.opacity = '0.4';

      try {
        var url = '/api/logs?page=' + currentLogPage + '&limit=' + currentLogLimit + '&filter=' + encodeURIComponent(currentLogFilter);
        if (logSlug) url += '&slug=' + encodeURIComponent(logSlug);

        var res = await fetch(url, {
          headers: getAuthHeaders()
        });
        var data = await res.json();

        if (!res.ok || !data.success) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--danger); padding:20px;">Lỗi tải dữ liệu nhật ký: ' + escapeClientHTML(data.error || 'Server error') + '</td></tr>';
          return;
        }

        var logs = data.logs || [];
        var total = data.total || 0;
        var page = data.page || 1;
        var limit = data.limit || 25;
        var totalPages = data.totalPages || 0;

        currentLogPage = page;
        currentLogLimit = limit;
        currentLogTotal = total;
        currentLogTotalPages = totalPages;

        if (logs.length === 0) {
          var filterName = currentLogFilter === 'real' ? 'người thật' : (currentLogFilter === 'bot' ? 'bot / crawler' : '');
          tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 30px;">Không có lượt truy cập ' + escapeClientHTML(filterName) + ' nào.</td></tr>';
          if (countInfo) countInfo.innerHTML = 'Tổng cộng: <b>0</b> lượt click';
          if (nav) nav.innerHTML = '';
          return;
        }

        var rowsHtml = logs.map(function(log) {
          var botBadge = log.is_bot 
            ? '<span class="badge badge-bot">🤖 Bot</span>' 
            : '<span class="badge badge-real">👤 Người thật</span>';
          
          var timeStr = formatClientVNTime(log.created_at);

          return '<tr>' +
            '<td style="font-size:12px; color:var(--text-muted); font-family:monospace;">' + escapeClientHTML(timeStr) + '</td>' +
            '<td>' + botBadge + '</td>' +
            '<td><code class="code-tag">' + escapeClientHTML(log.ip) + '</code></td>' +
            '<td><b>' + escapeClientHTML(log.device) + '</b> • ' + escapeClientHTML(log.os) + '</td>' +
            '<td>' + escapeClientHTML(log.browser) + '</td>' +
            '<td>' + escapeClientHTML(log.country) + ' - ' + escapeClientHTML(log.city) + '</td>' +
          '</tr>';
        }).join('');

        tbody.innerHTML = rowsHtml;

        var start = (page - 1) * limit + 1;
        var end = Math.min(page * limit, total);
        var filterLabel = currentLogFilter === 'real' ? 'người thật' : (currentLogFilter === 'bot' ? 'bot / crawler' : 'tất cả');
        if (countInfo) {
          countInfo.innerHTML = 'Hiển thị <b>' + start + ' - ' + end + '</b> trong <b>' + total + '</b> lượt click (' + filterLabel + ')';
        }

        if (nav) {
          var navHtml = '';
          navHtml += '<button class="page-btn" ' + (page <= 1 ? 'disabled' : '') + ' onclick="gotoLogPage(1)" title="Trang đầu">⏮</button>';
          navHtml += '<button class="page-btn" ' + (page <= 1 ? 'disabled' : '') + ' onclick="gotoLogPage(' + (page - 1) + ')" title="Trang trước">◀</button>';

          var startPage = Math.max(1, page - 2);
          var endPage = Math.min(totalPages, startPage + 4);
          if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
          }

          for (var p = startPage; p <= endPage; p++) {
            navHtml += '<button class="page-btn ' + (p === page ? 'active' : '') + '" onclick="gotoLogPage(' + p + ')">' + p + '</button>';
          }

          navHtml += '<button class="page-btn" ' + (page >= totalPages ? 'disabled' : '') + ' onclick="gotoLogPage(' + (page + 1) + ')" title="Trang sau">▶</button>';
          navHtml += '<button class="page-btn" ' + (page >= totalPages ? 'disabled' : '') + ' onclick="gotoLogPage(' + totalPages + ')" title="Trang cuối">⏭</button>';
          
          nav.innerHTML = navHtml;
        }
      } catch (err) {
        console.error('Lỗi tải logs:', err);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--danger); padding:20px;">Lỗi kết nối tải dữ liệu: ' + escapeClientHTML(err.message) + '</td></tr>';
      } finally {
        tbody.style.opacity = '1';
      }
    }

    function formatClientVNTime(str) {
      if (!str) return 'Vừa xong';
      var trimmed = String(str).trim();
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
        var parts = trimmed.split(' ');
        var dateParts = parts[0].split('-');
        return dateParts[2] + '/' + dateParts[1] + '/' + dateParts[0] + ' ' + parts[1];
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        var dateParts = trimmed.split('-');
        return dateParts[2] + '/' + dateParts[1] + '/' + dateParts[0];
      }
      return trimmed;
    }

    // Tự động khởi tạo tải số liệu phân trang ngay khi vào trang
    window.addEventListener('DOMContentLoaded', function() {
      fetchLogs();
    });
  </script>
</body>
</html>`;
}
