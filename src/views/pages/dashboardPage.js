// src/views/pages/dashboardPage.js
// Giao diện Dashboard Quản trị & Báo cáo Thống kê Tổng quan (Clean 3-Tab Architecture)

import { BASE_STYLES } from '../styles/baseStyles.js';
import { renderProgressList } from '../components/progressList.js';
import { escapeHTML } from '../../utils/security.js';
import { formatVNTime } from '../../utils/time.js';

/**
 * Render giao diện Dashboard quản trị 3 tab độc lập:
 * 1. 📊 Bảng Thống Kê (Dashboard)
 * 2. ⚙️ Quản Trị Link (Admin / Danh Sách Link)
 * 3. ➕ Tạo Link Mới (Link Studio / /create)
 * 
 * @param {object} globalData Dữ liệu thống kê tổng thể từ clickService.getGlobalAnalytics
 * @param {Array} allLinks Danh sách tất cả link từ linkService.getAllLinks
 * @param {string} shortDomain Tên miền rút gọn (ví dụ: reviewphim.vnastar.com)
 * @param {string} adminDomain Tên miền admin (ví dụ: snapog.vnastar.com)
 * @param {boolean} hasAuth Trạng thái đăng nhập
 * @param {string} defaultTab Tab kích hoạt mặc định ('dashboard', 'admin', hoặc 'create')
 * @returns {string} HTML markup
 */
export function renderDashboardHTML(
  globalData = {}, 
  allLinks = [], 
  shortDomain = 'reviewphim.vnastar.com', 
  adminDomain = 'snapog.vnastar.com', 
  hasAuth = false, 
  defaultTab = 'dashboard'
) {
  const safeGlobalData = (globalData && typeof globalData === 'object' && !Array.isArray(globalData)) ? globalData : {};
  const safeAllLinks = Array.isArray(allLinks) ? allLinks : (Array.isArray(globalData) ? globalData : []);
  const summary = safeGlobalData.summary || { total_clicks: 0, real_users: 0, bots: 0, total_links: safeAllLinks.length };
  const topLinks = Array.isArray(safeGlobalData.topLinks) ? safeGlobalData.topLinks : [];
  const totalReal = summary.real_users || 1;

  // Render bảng Top Link
  const topLinksRows = topLinks.length === 0 
    ? '<tr><td colspan="5" style="text-align:center; color: var(--text-muted); padding: 30px;">Chưa có dữ liệu truy cập nào được ghi nhận.</td></tr>' 
    : topLinks.map(link => `
      <tr>
        <td><b style="color: var(--primary);">/${escapeHTML(link.slug)}</b></td>
        <td>
          <b>${escapeHTML(link.title || 'Chưa đặt tiêu đề')}</b><br>
          <a href="${escapeHTML(link.target_url)}" target="_blank" style="color: var(--primary); font-size:12px; word-break: break-all;">${escapeHTML(link.target_url)}</a>
        </td>
        <td><b style="color: var(--success); font-size: 16px;">${link.real_clicks || 0}</b></td>
        <td><b>${link.total_clicks || 0}</b></td>
        <td>
          <div style="display:flex; gap:6px;">
            <button onclick="openStatsModal('${escapeHTML(link.slug)}')" class="btn btn-primary btn-sm">📊 Xem nhanh</button>
            <a href="/stats?slug=${escapeHTML(link.slug)}" class="btn btn-secondary btn-sm">🔗 Báo cáo</a>
          </div>
        </td>
      </tr>
    `).join('');

  // Render bảng Nhật ký thời gian thực
  const recentLogs = Array.isArray(safeGlobalData.recentLogs) ? safeGlobalData.recentLogs : [];
  const recentLogsRows = recentLogs.length === 0 
    ? '<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 30px;">Chưa có lượt click nào.</td></tr>' 
    : recentLogs.map(log => `
      <tr>
        <td style="font-size:12px; color:var(--text-muted); font-family: monospace;">${formatVNTime(log.created_at)}</td>
        <td><b>/${escapeHTML(log.slug)}</b></td>
        <td>
          ${log.is_bot ? '<span class="badge badge-bot">🤖 Bot</span>' : '<span class="badge badge-real">👤 Người thật</span>'}
        </td>
        <td><code class="code-tag">${escapeHTML(log.ip)}</code></td>
        <td><b>${escapeHTML(log.device)}</b> • ${escapeHTML(log.os)}</td>
        <td>${escapeHTML(log.country)} - ${escapeHTML(log.city)}</td>
      </tr>
    `).join('');

  // Render bảng Danh Sách Toàn Bộ Link (Tab Quản Trị)
  const allLinksRows = safeAllLinks.length === 0 
    ? '<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 40px;">Chưa có link nào được tạo. Nhấn nút <b>"➕ Tạo Link Mới"</b> để tạo link đầu tiên!</td></tr>' 
    : safeAllLinks.map(link => `
      <tr id="row-${escapeHTML(link.slug)}">
        <td>
          <b style="font-size: 15px; color: var(--primary);">/${escapeHTML(link.slug)}</b><br>
          <button class="btn btn-secondary btn-sm" style="margin-top: 4px;" onclick="copyToClipboard('https://${shortDomain}/${link.slug}')">📋 Copy Link</button>
        </td>
        <td>
          <a href="${escapeHTML(link.target_url)}" target="_blank" style="color: var(--primary); text-decoration: none; word-break: break-all;">
            ${escapeHTML(link.target_url.length > 40 ? link.target_url.substring(0, 40) + '...' : link.target_url)}
          </a>
          ${link.title ? `<div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">📌 <b>${escapeHTML(link.title)}</b></div>` : ''}
          ${link.site_name ? `<div style="font-size: 11px; color: #0284c7; margin-top: 2px;">🏷️ <i>${escapeHTML(link.site_name)}</i></div>` : ''}
        </td>
        <td>
          ${link.image_url 
            ? `<a href="${escapeHTML(link.image_url)}" target="_blank" title="Xem ảnh gốc"><img src="${escapeHTML(link.image_url)}" onerror="handleImgError(this)" style="width: 50px; height: 35px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border);" alt="Ảnh"></a>` 
            : '<span style="color:#94a3b8; font-size: 12px;">Không có</span>'}
        </td>
        <td>
          <b style="font-size: 15px;">${link.total_clicks || 0}</b>
          <div style="font-size:11px; color:var(--success);">👤 ${link.real_clicks || 0} thật</div>
        </td>
        <td style="font-size: 12px; color: var(--text-muted); font-family: monospace;">${link.created_at ? formatVNTime(link.created_at) : ''}</td>
        <td>
          <div style="display:flex; gap: 6px; flex-wrap: wrap;">
            <button onclick="editLinkFromBtn(this)" data-slug="${escapeHTML(link.slug)}" data-target="${escapeHTML(link.target_url)}" data-title="${escapeHTML(link.title || '')}" data-desc="${escapeHTML(link.description || '')}" data-image="${escapeHTML(link.image_url || '')}" data-sitename="${escapeHTML(link.site_name || '')}" class="btn btn-secondary btn-sm" title="Mở trong Link Studio để chỉnh sửa">✏️ Sửa</button>
            <button onclick="openStatsModal('${escapeHTML(link.slug)}')" class="btn btn-primary btn-sm">📊 Phân tích</button>
            <a href="/stats?slug=${escapeHTML(link.slug)}" class="btn btn-secondary btn-sm">🔗 Chi tiết</a>
            <button onclick="confirmDeleteLink('${escapeHTML(link.slug)}')" class="btn btn-danger btn-sm">❌ Xóa</button>
          </div>
        </td>
      </tr>
    `).join('');

  const logoutBtn = hasAuth ? '<a href="/logout" onclick="localStorage.removeItem(\'snapog_admin_key\'); sessionStorage.removeItem(\'snapog_admin_key\');" class="btn btn-secondary btn-sm" title="Đăng xuất khỏi trang quản trị">🚪 Đăng xuất</a>' : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SnapOG - Quản Trị & Báo Cáo Thống Kê</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <!-- Toast Container -->
  <div id="toast-container"></div>

  <div class="container">
    <!-- Header Thông Tin -->
    <header>
      <div class="brand">
        <div class="brand-logo">S</div>
        <div>
          <h1>SnapOG Edge Manager</h1>
          <p style="font-size: 12px; color: var(--text-muted);">Admin: <span class="code-tag">https://${adminDomain}</span> • Domain Rút Gọn: <span class="code-tag">https://${shortDomain}</span></p>
        </div>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <button class="btn btn-primary" onclick="switchTab('create');">➕ Tạo Link Mới</button>
        ${logoutBtn}
      </div>
    </header>

    <!-- THANH ĐIỀU HƯỚNG 3 TABS ĐỘC LẬP -->
    <div class="tabs-nav">
      <button class="tab-btn ${defaultTab === 'dashboard' ? 'active' : ''}" id="btn-tab-dashboard" onclick="switchTab('dashboard')">
        📊 Bảng Thống Kê (Dashboard)
      </button>
      <button class="tab-btn ${defaultTab === 'admin' ? 'active' : ''}" id="btn-tab-admin" onclick="switchTab('admin')">
        ⚙️ Quản Trị Link (Admin)
        <span class="tab-badge" id="admin-badge-count">${safeAllLinks.length}</span>
      </button>
      <button class="tab-btn ${defaultTab === 'create' ? 'active' : ''}" id="btn-tab-create" onclick="switchTab('create')">
        ➕ Tạo Link Mới (Studio)
      </button>
    </div>

    <!-- ================================================================= -->
    <!-- TAB 1: BẢNG THỐNG KÊ (DASHBOARD) -->
    <!-- ================================================================= -->
    <div class="tab-panel ${defaultTab === 'dashboard' ? 'active' : ''}" id="tab-dashboard">
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-title">🔗 Tổng Link Hoạt Động</div>
          <div class="stat-num">${summary.total_links || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">📈 Tổng Lượt Click</div>
          <div class="stat-num">${summary.total_clicks || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">👤 Người Thật Click</div>
          <div class="stat-num" style="color: var(--success);">${summary.real_users || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">🤖 Bot / MXH Crawler</div>
          <div class="stat-num" style="color: var(--text-muted);">${summary.bots || 0}</div>
        </div>
      </div>

      <!-- Top Link -->
      <div class="card">
        <div class="card-title">
          <span>🔥 Top Link Có Lượt Click Cao Nhất</span>
          <span style="font-size: 13px; color: var(--text-muted); font-weight: normal;">Sắp xếp theo người thật</span>
        </div>
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Slug</th>
                <th>Tiêu Đề / Link Đích</th>
                <th>Người Thật</th>
                <th>Tổng Click</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              ${topLinksRows}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Phân Tích Địa Lý & Thiết Bị -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 24px;">
        <div class="card" style="margin: 0;">
          <div class="card-title">🌍 Top Quốc Gia</div>
          ${renderProgressList(globalData.countries, totalReal, 'country')}
        </div>
        <div class="card" style="margin: 0;">
          <div class="card-title">🏙️ Top Thành Phố</div>
          ${renderProgressList(globalData.cities, totalReal, 'city')}
        </div>
        <div class="card" style="margin: 0;">
          <div class="card-title">📱 Thiết Bị Người Dùng</div>
          ${renderProgressList(globalData.devices, totalReal, 'device')}
        </div>
      </div>

      <!-- Nhật Ký Truy Cập Thời Gian Thực (Phân Trang & Bộ Lọc) -->
      <div class="card" id="logsCard">
        <div class="card-title" style="margin-bottom: 14px;">
          <span>🕒 Nhật Ký Truy Cập Thời Gian Thực</span>
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
                <th>Link Truy Cập</th>
                <th>Loại Khách</th>
                <th>Địa Chỉ IP</th>
                <th>Thiết Bị / OS</th>
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

    <!-- ================================================================= -->
    <!-- TAB 2: QUẢN TRỊ LINK (ADMIN - DANH SÁCH LINK) -->
    <!-- ================================================================= -->
    <div class="tab-panel ${defaultTab === 'admin' ? 'active' : ''}" id="tab-admin">
      <div class="card">
        <div class="card-title" style="flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>📋 Danh Sách Tất Cả Link Rút Gọn (${safeAllLinks.length})</span>
          </div>
          <div style="display:flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <input type="text" id="searchInput" onkeyup="filterLinksTable()" placeholder="🔍 Tìm theo slug, tiêu đề, URL..." style="padding: 7px 14px; font-size: 13px; width: 240px; border-radius: 8px;">
            <button class="btn btn-primary btn-sm" onclick="switchTab('create');">➕ Tạo Link Mới</button>
          </div>
        </div>

        <div class="table-responsive">
          <table id="linksTable">
            <thead>
              <tr>
                <th>Slug & Link Ngắn</th>
                <th>URL Đích & Tiêu Đề</th>
                <th>Ảnh Banner</th>
                <th>Lượt Click</th>
                <th>Ngày Tạo</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              ${allLinksRows}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- TAB 3: TẠO LINK MỚI (LINK STUDIO / CREATOR) -->
    <!-- ================================================================= -->
    <div class="tab-panel ${defaultTab === 'create' ? 'active' : ''}" id="tab-create">
      <div class="card" id="createFormCard">
        <!-- Banner thông báo khi đang ở chế độ chỉnh sửa -->
        <div id="editModeBanner" class="edit-mode-banner">
          <div>
            <b style="color:#b45309;">✏️ Đang ở chế độ chỉnh sửa link:</b> <span id="editModeSlug" class="code-tag" style="font-size:14px; font-weight:700;"></span>
            <div style="font-size:12px; color:#92400e; margin-top:2px;">Thay đổi thông tin bên dưới và bấm "Cập Nhật Link" để lưu thay đổi.</div>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="cancelEditMode()">❌ Hủy Chỉnh Sửa (Về Tạo Link Mới)</button>
        </div>

        <div class="card-title">
          <span id="createFormTitle">➕ Tạo Link Rút Gọn & Tối Ưu Hóa Thẻ Meta Open Graph</span>
          <span style="font-size: 12px; color: var(--text-muted); font-weight: normal;">* Trường bắt buộc</span>
        </div>

        <form id="createLinkForm" onsubmit="handleFormSubmit(event)">
          <div class="form-grid">
            <div class="form-group">
              <label>1. URL Đích (Target URL) *</label>
              <input type="url" name="targetUrl" id="form-targetUrl" placeholder="https://domain-dich.com/bai-viet-hay" required oninput="updateLivePreview()">
              <p style="font-size:11px; color:var(--text-muted); margin-top:4px;">Người dùng thật khi click vào link sẽ được chuyển hướng tự động 302 đến URL này.</p>
            </div>
            <div class="form-group">
              <label style="display:flex; justify-content:space-between; align-items:center;">
                <span>2. Mã rút gọn (Slug) *</span>
                <button type="button" class="btn btn-secondary btn-sm" style="padding:2px 8px; font-size:11px;" onclick="generateRandomSlug()">🎲 Tạo ngẫu nhiên</button>
              </label>
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="color:var(--text-muted); font-size:14px; font-weight:600;">https://${shortDomain}/</span>
                <input type="text" name="slug" id="form-slug" placeholder="vd: khuyen-mai-2026" required style="flex:1;" oninput="updateLivePreview()">
              </div>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>3. Tiêu đề Open Graph (Title)</label>
              <input type="text" name="title" id="form-title" placeholder="Tiêu đề hiển thị to, đậm khi chia sẻ lên Facebook, Zalo, Telegram..." oninput="updateLivePreview()">
            </div>
            <div class="form-group">
              <label>4. Tên Trang / Thương Hiệu (og:site_name)</label>
              <input type="text" name="siteName" id="form-siteName" placeholder="vd: VnStar, Review Phim, Tin Tức 24h, YouTube..." oninput="updateLivePreview()">
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>5. Ảnh Banner (Tải tệp lên Cloudflare R2 hoặc Dán link ảnh)</label>
              <input type="file" name="imageFile" id="form-imageFile" accept="image/*" style="margin-bottom: 6px;" onchange="handleImageFileChange(event)">
              <div id="fileUploadStatus" style="display:none; margin-bottom:6px; font-size:12px; background:#eff6ff; border:1px solid #bfdbfe; color:#1e40af; padding:4px 8px; border-radius:6px; align-items:center; justify-content:space-between;">
                <span id="fileUploadName">📁 file.jpg</span>
                <button type="button" class="btn btn-secondary btn-sm" style="padding:2px 6px; font-size:11px;" onclick="clearSelectedImageFile()">❌ Bỏ tệp</button>
              </div>
              <input type="url" name="imageUrlInput" id="form-imageUrlInput" placeholder="Hoặc dán URL ảnh trực tiếp (https://.../banner.jpg)" oninput="updateLivePreview()">
            </div>
            <div class="form-group">
              <label>6. Mô tả Open Graph (Description)</label>
              <textarea name="description" id="form-description" rows="3" placeholder="Mô tả nội dung tóm tắt hiển thị bên dưới tiêu đề khi chia sẻ mạng xã hội..." oninput="updateLivePreview()"></textarea>
            </div>
          </div>

          <!-- Real-time Multi-Platform OG Social Preview Studio -->
          <div class="og-live-preview">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
              <span style="font-size:13px; font-weight:700; color:var(--text);">👁️ Xem Trước Hiển Thị Thẻ Open Graph Thời Gian Thực:</span>
              <div class="social-tabs">
                <button type="button" class="social-tab-btn active" id="btn-preview-fb" onclick="setSocialPreviewTab('facebook')">Facebook (1200x630)</button>
                <button type="button" class="social-tab-btn" id="btn-preview-zalo" onclick="setSocialPreviewTab('zalo')">Zalo Chat</button>
                <button type="button" class="social-tab-btn" id="btn-preview-tele" onclick="setSocialPreviewTab('telegram')">Telegram</button>
              </div>
            </div>

            <!-- Facebook & Telegram Preview Style -->
            <div id="fb-preview-wrap" class="og-preview-card">
              <div class="og-preview-img-box" id="preview-img-box">
                <span id="preview-img-placeholder">🖼️ Chưa có hình ảnh banner</span>
                <img id="preview-img-element" style="display:none;" alt="Preview">
              </div>
              <div class="og-preview-meta">
                <div class="og-preview-domain" id="preview-domain">${shortDomain.toUpperCase()}</div>
                <div class="og-preview-title" id="preview-title">Tiêu đề bài viết / video sẽ hiển thị tại đây</div>
                <div class="og-preview-desc" id="preview-desc">Nội dung tóm tắt mô tả bài viết sẽ hiển thị rõ nét trên mạng xã hội khi cào thẻ meta...</div>
              </div>
            </div>

            <!-- Zalo Preview Style -->
            <div id="zalo-preview-wrap" class="zalo-preview-card" style="display:none;">
              <div class="zalo-preview-title" id="zalo-preview-title">Tiêu đề bài viết / video sẽ hiển thị tại đây</div>
              <div class="zalo-preview-desc" id="zalo-preview-desc">Nội dung tóm tắt mô tả bài viết sẽ hiển thị rõ nét trên mạng xã hội khi cào thẻ meta...</div>
              <div style="width:100%; height:180px; background:#e2e8f0; border-radius:8px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                <img id="zalo-preview-img" style="display:none;" class="zalo-preview-img" alt="Zalo Preview">
                <span id="zalo-img-placeholder" style="color:#64748b; font-size:12px;">🖼️ Chưa có hình ảnh banner</span>
              </div>
              <div class="zalo-preview-domain" id="zalo-preview-domain">${shortDomain}</div>
            </div>
          </div>

          <div style="display:flex; justify-content: flex-end; gap: 10px; margin-top: 22px;">
            <button type="button" class="btn btn-secondary" onclick="cancelEditMode()">Làm Lại</button>
            <button type="submit" id="submitBtn" class="btn btn-primary" style="padding:10px 24px; font-size:14px;">💾 Lưu & Rút Gọn Link</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- MODAL POPUP CONFIRM DELETE -->
  <div id="confirmModal" class="modal-overlay">
    <div class="modal-container" style="max-width: 440px; text-align: center;">
      <h3 style="color: var(--danger); font-size: 18px; margin-bottom: 12px;" id="confirmModalTitle">Xác nhận thao tác</h3>
      <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;" id="confirmModalMessage">Bạn có chắc chắn muốn thực hiện hành động này?</p>
      <div style="display:flex; justify-content:center; gap: 12px;">
        <button class="btn btn-secondary" onclick="closeConfirmModal()">Hủy Bỏ</button>
        <button class="btn btn-danger" id="confirmModalOkBtn">Đồng Ý Xóa</button>
      </div>
    </div>
  </div>

  <!-- MODAL POPUP QUICK ANALYTICS -->
  <div id="statsModal" class="modal-overlay">
    <div class="modal-container">
      <button class="modal-close" onclick="closeStatsModal()">&times;</button>
      <div id="modalContent">
        <p style="text-align:center;">⏳ Đang tải dữ liệu phân tích...</p>
      </div>
    </div>
  </div>

  <script>
    const INITIAL_DEFAULT_TAB = '${defaultTab}';
    const SHORT_DOMAIN_HOST = '${shortDomain}';

    // Lưu trữ và duy trì mã xác thực Admin
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

    function showToast(message, type) {
      type = type || 'success';
      const container = document.getElementById('toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = 'toast toast-' + type;
      toast.innerHTML = '<span>' + escapeClientHTML(message) + '</span><button style="background:none;border:none;color:#fff;font-size:16px;cursor:pointer;" onclick="this.parentElement.remove()">&times;</button>';
      container.appendChild(toast);
      setTimeout(function() {
        if (toast.parentElement) {
          toast.style.animation = 'toastOut 0.3s forwards';
          setTimeout(function() { if (toast.parentElement) toast.remove(); }, 300);
        }
      }, 4000);
    }

    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(function(btn) { btn.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function(panel) { panel.classList.remove('active'); });

      var targetBtn = document.getElementById('btn-tab-' + tabId);
      var targetPanel = document.getElementById('tab-' + tabId);

      if (targetBtn && targetPanel) {
        targetBtn.classList.add('active');
        targetPanel.classList.add('active');
        localStorage.setItem('activeTab', tabId);

        // Cập nhật đường dẫn URL mượt mà không reload trang
        try {
          var newPath = tabId === 'dashboard' ? '/' : (tabId === 'create' ? '/create' : '/admin');
          if (window.location.pathname !== newPath && window.history && window.history.pushState) {
            window.history.pushState(null, '', newPath);
          }
        } catch(e) {}
      }
    }

    window.addEventListener('DOMContentLoaded', function() {
      var urlParams = new URLSearchParams(window.location.search);
      var path = window.location.pathname;
      var hash = window.location.hash.replace('#', '');
      
      var tabFromPath = null;
      if (path === '/create' || path === '/new') tabFromPath = 'create';
      else if (path === '/admin' || path === '/links') tabFromPath = 'admin';
      else if (path === '/dashboard') tabFromPath = 'dashboard';

      var tabFromUrl = urlParams.get('tab') || (hash === 'admin' || hash === 'dashboard' || hash === 'create' ? hash : null);
      var activeTab = tabFromUrl || tabFromPath || INITIAL_DEFAULT_TAB || localStorage.getItem('activeTab') || 'dashboard';
      
      switchTab(activeTab);
      updateLivePreview();
    });

    function generateRandomSlug() {
      var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      var result = '';
      for (var i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      var slugInput = document.getElementById('form-slug');
      if (slugInput) {
        slugInput.value = result;
        updateLivePreview();
        showToast('Đã tạo slug ngẫu nhiên: ' + result, 'info');
      }
    }

    function editLinkFromBtn(btn) {
      if (!btn) return;
      var ds = btn.dataset || {};
      editLinkData(ds.slug || '', ds.target || '', ds.title || '', ds.desc || '', ds.image || '', ds.sitename || '');
    }

    function editLinkData(slug, targetUrl, title, description, imageUrl, siteName) {
      switchTab('create');
      
      // Bật banner chế độ chỉnh sửa
      var editBanner = document.getElementById('editModeBanner');
      var editSlugLabel = document.getElementById('editModeSlug');
      var titleLabel = document.getElementById('createFormTitle');
      var submitBtn = document.getElementById('submitBtn');

      if (editBanner && editSlugLabel) {
        editSlugLabel.innerText = '/' + slug;
        editBanner.classList.add('active');
      }
      if (titleLabel) titleLabel.innerHTML = '✏️ Chỉnh Sửa Link Rút Gọn: <b>/' + escapeClientHTML(slug) + '</b>';
      if (submitBtn) submitBtn.innerHTML = '💾 Cập Nhật Link';

      document.getElementById('form-slug').value = slug;
      document.getElementById('form-targetUrl').value = targetUrl;
      document.getElementById('form-title').value = title;
      document.getElementById('form-description').value = description;
      document.getElementById('form-imageUrlInput').value = imageUrl;
      var siteNameInput = document.getElementById('form-siteName');
      if (siteNameInput) siteNameInput.value = siteName || '';
      
      var form = document.getElementById('createFormCard');
      if (form) form.scrollIntoView({ behavior: 'smooth' });
      
      updateLivePreview();
      showToast('Đã mở link /' + slug + ' trong Link Studio để chỉnh sửa!', 'info');
    }

    function cancelEditMode() {
      var form = document.getElementById('createLinkForm');
      if (form) form.reset();

      var editBanner = document.getElementById('editModeBanner');
      var titleLabel = document.getElementById('createFormTitle');
      var submitBtn = document.getElementById('submitBtn');

      if (editBanner) editBanner.classList.remove('active');
      if (titleLabel) titleLabel.innerHTML = '➕ Tạo Link Rút Gọn & Tối Ưu Hóa Thẻ Meta Open Graph';
      if (submitBtn) submitBtn.innerHTML = '💾 Lưu & Rút Gọn Link';

      clearSelectedImageFile();
      resetLivePreview();
    }

    function setSocialPreviewTab(platform) {
      document.querySelectorAll('.social-tab-btn').forEach(function(b) { b.classList.remove('active'); });
      var fbWrap = document.getElementById('fb-preview-wrap');
      var zaloWrap = document.getElementById('zalo-preview-wrap');

      if (platform === 'zalo') {
        document.getElementById('btn-preview-zalo').classList.add('active');
        if (fbWrap) fbWrap.style.display = 'none';
        if (zaloWrap) zaloWrap.style.display = 'block';
      } else {
        if (platform === 'telegram') {
          document.getElementById('btn-preview-tele').classList.add('active');
        } else {
          document.getElementById('btn-preview-fb').classList.add('active');
        }
        if (fbWrap) fbWrap.style.display = 'block';
        if (zaloWrap) zaloWrap.style.display = 'none';
      }
    }

    function updateLivePreview() {
      var slug = (document.getElementById('form-slug').value || '').trim();
      var title = (document.getElementById('form-title').value || '').trim();
      var desc = (document.getElementById('form-description').value || '').trim();
      var imgUrl = (document.getElementById('form-imageUrlInput').value || '').trim();
      var siteName = (document.getElementById('form-siteName') ? document.getElementById('form-siteName').value : '').trim();

      // Facebook Preview Elements
      var titleEl = document.getElementById('preview-title');
      var descEl = document.getElementById('preview-desc');
      var domainEl = document.getElementById('preview-domain');
      var imgEl = document.getElementById('preview-img-element');
      var placeholderEl = document.getElementById('preview-img-placeholder');

      // Zalo Preview Elements
      var zaloTitleEl = document.getElementById('zalo-preview-title');
      var zaloDescEl = document.getElementById('zalo-preview-desc');
      var zaloDomainEl = document.getElementById('zalo-preview-domain');
      var zaloImgEl = document.getElementById('zalo-preview-img');
      var zaloPlaceholderEl = document.getElementById('zalo-img-placeholder');

      var defaultTitle = 'Tiêu đề bài viết / video sẽ hiển thị tại đây';
      var defaultDesc = 'Nội dung tóm tắt mô tả bài viết sẽ hiển thị rõ nét trên mạng xã hội khi cào thẻ meta...';
      var displayDomain = siteName ? (siteName.toUpperCase() + (slug ? ' • /' + slug.toUpperCase() : '')) : (slug ? (SHORT_DOMAIN_HOST + '/' + slug).toUpperCase() : SHORT_DOMAIN_HOST.toUpperCase());

      if (titleEl) titleEl.innerText = title || defaultTitle;
      if (descEl) descEl.innerText = desc || defaultDesc;
      if (domainEl) domainEl.innerText = displayDomain;

      if (zaloTitleEl) zaloTitleEl.innerText = title || defaultTitle;
      if (zaloDescEl) zaloDescEl.innerText = desc || defaultDesc;
      if (zaloDomainEl) zaloDomainEl.innerText = siteName || (slug ? SHORT_DOMAIN_HOST + '/' + slug : SHORT_DOMAIN_HOST);

      var effectiveImg = currentPreviewDataUrl || imgUrl;

      if (effectiveImg) {
        if (imgEl) {
          imgEl.onerror = function() {
            if (this.src && this.src.includes('/images/')) {
              this.onerror = null;
              this.src = '/images/' + this.src.split('/images/')[1];
            }
          };
          imgEl.src = effectiveImg;
          imgEl.style.display = 'block';
        }
        if (placeholderEl) placeholderEl.style.display = 'none';

        if (zaloImgEl) {
          zaloImgEl.src = effectiveImg;
          zaloImgEl.style.display = 'block';
        }
        if (zaloPlaceholderEl) zaloPlaceholderEl.style.display = 'none';
      } else {
        if (imgEl) imgEl.style.display = 'none';
        if (placeholderEl) placeholderEl.style.display = 'block';
        if (zaloImgEl) zaloImgEl.style.display = 'none';
        if (zaloPlaceholderEl) zaloPlaceholderEl.style.display = 'block';
      }
    }

    var currentPreviewDataUrl = null;
    function handleImageFileChange(e) {
      var file = e.target.files && e.target.files[0];
      var statusBox = document.getElementById('fileUploadStatus');
      var nameEl = document.getElementById('fileUploadName');

      if (file) {
        var sizeKb = Math.round(file.size / 1024);
        var sizeText = sizeKb > 1024 ? (sizeKb / 1024).toFixed(1) + ' MB' : sizeKb + ' KB';
        if (statusBox && nameEl) {
          nameEl.innerText = '📁 ' + file.name + ' (' + sizeText + ')';
          statusBox.style.display = 'flex';
        }

        var reader = new FileReader();
        reader.onload = function(evt) {
          currentPreviewDataUrl = evt.target.result;
          updateLivePreview();
        };
        reader.readAsDataURL(file);
      } else {
        clearSelectedImageFile();
      }
    }

    function clearSelectedImageFile() {
      var fileInput = document.getElementById('form-imageFile');
      if (fileInput) fileInput.value = '';
      var statusBox = document.getElementById('fileUploadStatus');
      if (statusBox) statusBox.style.display = 'none';
      currentPreviewDataUrl = null;
      updateLivePreview();
    }

    function resetLivePreview() {
      clearSelectedImageFile();
      setTimeout(updateLivePreview, 50);
    }

    function filterLinksTable() {
      var input = document.getElementById('searchInput');
      var filter = input.value.toLowerCase();
      var table = document.getElementById('linksTable');
      var trs = table.getElementsByTagName('tr');

      for (var i = 1; i < trs.length; i++) {
        var rowText = trs[i].innerText.toLowerCase();
        trs[i].style.display = rowText.includes(filter) ? '' : 'none';
      }
    }

    function copyToClipboard(text) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function() {
          showToast('Đã sao chép: ' + text, 'success');
        }).catch(function() {
          fallbackCopy(text);
        });
      } else {
        fallbackCopy(text);
      }
    }

    function fallbackCopy(text) {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
        showToast('Đã sao chép: ' + text, 'success');
      } catch (err) {
        showToast('Không thể sao chép tự động: ' + text, 'error');
      }
      document.body.removeChild(textarea);
    }

    function readFileAsBase64(file) {
      return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function() { resolve(reader.result); };
        reader.onerror = function(err) { reject(err); };
        reader.readAsDataURL(file);
      });
    }

    async function handleFormSubmit(event) {
      event.preventDefault();
      var form = event.target;
      var submitBtn = document.getElementById('submitBtn');
      var originalText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '⏳ Đang lưu trữ...';

      try {
        var rawSlug = form.slug.value.trim();
        while (rawSlug.startsWith('/')) {
          rawSlug = rawSlug.substring(1);
        }
        var slug = rawSlug;
        var targetUrl = form.targetUrl.value.trim();
        var title = form.title.value.trim();
        var description = form.description.value.trim();
        var siteName = form.siteName ? form.siteName.value.trim() : '';
        var imageUrlInput = form.imageUrlInput ? form.imageUrlInput.value.trim() : '';
        var fileInput = form.imageFile;

        var imageBase64 = null;
        var imageType = '';
        var fileName = '';

        if (fileInput.files && fileInput.files[0]) {
          var file = fileInput.files[0];
          if (file.size > 8 * 1024 * 1024) {
            showToast('File ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 8MB.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            return;
          }
          fileName = file.name;
          imageType = file.type;
          imageBase64 = await readFileAsBase64(file);
        }

        var payload = {
          slug: slug,
          targetUrl: targetUrl,
          title: title,
          description: description,
          siteName: siteName,
          imageUrl: imageUrlInput,
          imageBase64: imageBase64,
          imageType: imageType,
          fileName: fileName
        };

        var res = await fetch('/api/links', {
          method: 'POST',
          headers: getAuthHeaders({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(payload)
        });

        var data = await res.json();

        if (res.ok && data.success) {
          showToast('✅ ' + (data.message || 'Lưu link thành công!'), 'success');
          localStorage.setItem('activeTab', 'admin');
          setTimeout(function() { window.location.href = '/admin'; }, 600);
        } else {
          showToast('❌ Lỗi: ' + (data.error || 'Thất bại!'), 'error');
        }
      } catch (err) {
        showToast('❌ Lỗi kết nối: ' + err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }

    var pendingDeleteSlug = null;
    function confirmDeleteLink(slug) {
      pendingDeleteSlug = slug;
      var modal = document.getElementById('confirmModal');
      document.getElementById('confirmModalMessage').innerHTML = 'Bạn có chắc chắn muốn xóa vĩnh viễn link <b>/' + escapeClientHTML(slug) + '</b> cùng toàn bộ <b>hình ảnh R2</b> và <b>tất cả nhật ký click</b>?<br><span style="color:var(--danger); font-size:12px; margin-top:6px; display:inline-block;">⚠️ Dữ liệu sẽ được dọn dẹp sạch sẽ và không thể khôi phục.</span>';
      var okBtn = document.getElementById('confirmModalOkBtn');
      okBtn.onclick = executeDelete;
      modal.classList.add('active');
    }

    function closeConfirmModal() {
      var modal = document.getElementById('confirmModal');
      modal.classList.remove('active');
      pendingDeleteSlug = null;
    }

    async function executeDelete() {
      if (!pendingDeleteSlug) return;
      var slug = pendingDeleteSlug;
      closeConfirmModal();

      try {
        var res = await fetch('/delete', {
          method: 'POST',
          headers: getAuthHeaders({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ slug: slug })
        });

        var data = await res.json();
        if (res.ok && data.success) {
          showToast('✅ ' + (data.message || 'Đã xóa link thành công!'), 'success');
          var row = document.getElementById('row-' + slug);
          if (row) {
            row.remove();
            var badge = document.getElementById('admin-badge-count');
            if (badge) {
              var count = parseInt(badge.innerText, 10) || 1;
              badge.innerText = Math.max(0, count - 1);
            }
          } else {
            window.location.reload();
          }
        } else {
          showToast('❌ Lỗi xóa: ' + (data.error || 'Thao tác thất bại'), 'error');
        }
      } catch (e) {
        showToast('❌ Lỗi kết nối: ' + e.message, 'error');
      }
    }

    var currentModalShortUrl = '';
    var currentModalImageUrl = '';

    function copyModalLink() {
      if (currentModalShortUrl) copyToClipboard(currentModalShortUrl);
    }

    function copyModalImage() {
      if (currentModalImageUrl) copyToClipboard(currentModalImageUrl);
    }

    function copyModalBotHtml() {
      var el = document.getElementById('modal-bot-html');
      if (el) copyToClipboard(el.innerText);
    }

    async function openStatsModal(slug) {
      var modal = document.getElementById('statsModal');
      var content = document.getElementById('modalContent');
      if (!modal || !content) return;
      modal.classList.add('active');
      content.innerHTML = '<p style="text-align:center; padding:30px;">⏳ Đang tải dữ liệu phân tích cho <b>/' + escapeClientHTML(slug) + '</b>...</p>';

      try {
        var cleanSlug = String(slug || '').trim();
        while (cleanSlug.startsWith('/')) {
          cleanSlug = cleanSlug.substring(1);
        }
        var res = await fetch('/api/stats?slug=' + encodeURIComponent(cleanSlug), {
          headers: getAuthHeaders()
        });
        if (!res.ok) {
          var errData = await res.json().catch(function() { return {}; });
          content.innerHTML = '<p style="color:red; text-align:center; padding:20px;">Lỗi máy chủ (' + res.status + '): ' + escapeClientHTML(errData.error || res.statusText || 'Không thể tải dữ liệu') + '</p>';
          return;
        }

        var data = await res.json();

        if (data.error) {
          content.innerHTML = '<p style="color:red; text-align:center; padding:20px;">Lỗi: ' + escapeClientHTML(data.error) + '</p>';
          return;
        }

        var link = data.link || {};
        var analytics = data.analytics || {};
        var summary = analytics.summary || { total_clicks: 0, real_users: 0, bots: 0 };
        var devices = analytics.devices || [];
        var osList = analytics.osList || [];
        var browsers = analytics.browsers || [];
        var shortUrl = data.shortUrl || ('https://' + window.location.host + '/' + (link.slug || cleanSlug));
        var botHtml = data.botHtml || '';
        var totalReal = summary.real_users || 1;

        currentModalShortUrl = shortUrl;
        currentModalImageUrl = link.image_url || '';

        var html = [
          '<h2 style="margin-top:0; color:var(--primary); font-size: 20px;">📊 Phân tích chi tiết: /' + escapeClientHTML(link.slug || cleanSlug) + '</h2>',
          '<div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin-bottom: 18px; font-size: 13px;">',
          '  <div style="margin-bottom: 10px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">',
          '    <b style="color: var(--primary);">🔗 Link rút gọn:</b>',
          '    <a href="' + escapeClientHTML(shortUrl) + '" target="_blank" style="color:var(--primary); font-weight:700; font-family:monospace; font-size:13px; background:#fff; padding:4px 10px; border-radius:6px; border:1px solid var(--border); word-break:break-all;">' + escapeClientHTML(shortUrl) + '</a>',
          '    <button class="btn btn-primary btn-sm" onclick="copyModalLink()">📋 Copy Link</button>',
          '    <a href="' + escapeClientHTML(shortUrl) + '" target="_blank" class="btn btn-secondary btn-sm">↗ Mở Link</a>',
          '  </div>',
          '  <p style="margin-bottom: 6px;"><b>URL Đích:</b> <a href="' + escapeClientHTML(link.target_url || '#') + '" target="_blank" style="color:var(--primary); word-break:break-all;">' + escapeClientHTML(link.target_url || '') + '</a></p>',
          link.title ? '<p style="margin-bottom: 6px;"><b>Tiêu đề OG:</b> ' + escapeClientHTML(link.title) + '</p>' : '',
          link.site_name ? '<p style="margin-bottom: 6px;"><b>Tên Trang / Brand (og:site_name):</b> <span style="color:#0284c7; font-weight:600;">' + escapeClientHTML(link.site_name) + '</span></p>' : '',
          link.description ? '<p style="margin-bottom: 6px;"><b>Mô tả OG:</b> ' + escapeClientHTML(link.description) + '</p>' : '',
          link.image_url ? (
            '<div style="margin-top: 8px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">' +
            '  <b>Link ảnh:</b> <a href="' + escapeClientHTML(link.image_url) + '" target="_blank" style="color:var(--primary); word-break:break-all; font-family:monospace; font-size:12px; background:#fff; padding:3px 8px; border-radius:4px; border:1px solid var(--border);">' + escapeClientHTML(link.image_url) + '</a>' +
            '  <button class="btn btn-secondary btn-sm" onclick="copyModalImage()">📋 Copy ảnh</button>' +
            '  <a href="' + escapeClientHTML(link.image_url) + '" target="_blank" class="btn btn-secondary btn-sm">↗ Xem ảnh</a>' +
            '</div>' +
            '<div style="margin-top: 8px;">' +
            '  <img src="' + escapeClientHTML(link.image_url) + '" onerror="handleImgError(this)" style="max-height: 120px; max-width: 100%; border-radius: 6px; border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.1);">' +
            '</div>'
          ) : '<p style="color:var(--text-muted); margin-bottom:0;"><b>Ảnh Banner:</b> Không có ảnh</p>',
          botHtml ? (
            '<div style="margin-top: 14px; border-top: 1px solid var(--border); padding-top: 12px;">' +
            '  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:8px;">' +
            '    <b>🤖 Mã HTML khi Bot / Crawler (Facebook, Zalo, Telegram) đọc:</b>' +
            '    <button class="btn btn-secondary btn-sm" onclick="copyModalBotHtml()">📋 Copy HTML Bot</button>' +
            '  </div>' +
            '  <div id="modal-bot-html" class="code-block" style="font-size:11px; max-height:160px;">' + escapeClientHTML(botHtml) + '</div>' +
            '</div>'
          ) : '',
          '</div>',
          '<div class="stat-grid" style="margin-bottom:20px;">',
          '  <div class="stat-card"><div class="stat-title">Tổng Click</div><div class="stat-num">' + (summary.total_clicks || 0) + '</div></div>',
          '  <div class="stat-card"><div class="stat-title">Người Thật</div><div class="stat-num" style="color:var(--success);">' + (summary.real_users || 0) + '</div></div>',
          '  <div class="stat-card"><div class="stat-title">Bot / Crawler</div><div class="stat-num" style="color:var(--text-muted);">' + (summary.bots || 0) + '</div></div>',
          '</div>',
          '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap:15px; margin-bottom:20px;">',
          '  <div class="card" style="margin:0;"><div class="card-title">📱 Thiết Bị</div>' + renderModalStatList(devices, totalReal, 'device') + '</div>',
          '  <div class="card" style="margin:0;"><div class="card-title">💻 Hệ Điều Hành</div>' + renderModalStatList(osList, totalReal, 'os') + '</div>',
          '  <div class="card" style="margin:0;"><div class="card-title">🌐 Trình Duyệt</div>' + renderModalStatList(browsers, totalReal, 'browser') + '</div>',
          '</div>',
          '<div style="margin-top:20px; text-align:right;">',
          '  <a href="/stats?slug=' + escapeClientHTML(link.slug || cleanSlug) + '" target="_blank" class="btn btn-primary">🔗 Mở trang báo cáo chi tiết đầy đủ</a>',
          '</div>'
        ].join('');

        content.innerHTML = html;
      } catch (err) {
        console.error('Lỗi phân tích modal:', err);
        content.innerHTML = '<p style="color:red; text-align:center; padding:20px;">Lỗi kết nối máy chủ API: ' + escapeClientHTML(err.message || err) + '</p>';
      }
    }

    function renderModalStatList(list, total, key) {
      if (!list || list.length === 0) return '<p style="color:var(--text-muted); font-size:13px;">Chưa có dữ liệu</p>';
      return list.map(function(item) {
        var name = item[key] || 'Unknown';
        var percent = Math.round((item.count / total) * 100);
        return [
          '<div style="margin-bottom:8px;">',
          '  <div style="display:flex; justify-content:space-between; font-size:13px;">',
          '    <span><b>' + escapeClientHTML(name) + '</b></span>',
          '    <span>' + item.count + ' (' + percent + '%)</span>',
          '  </div>',
          '  <div class="progress-bar-bg">',
          '    <div class="progress-bar-fill" style="width: ' + percent + '%;"></div>',
          '  </div>',
          '</div>'
        ].join('');
      }).join('');
    }

    function escapeClientHTML(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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

    function closeStatsModal() {
      document.getElementById('statsModal').classList.remove('active');
    }

    // ==========================================
    // LOGS PAGINATION & FILTERING CLIENT SCRIPT
    // ==========================================
    var logSlug = '';
    var hasSlugCol = true;
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

          if (hasSlugCol) {
            return '<tr>' +
              '<td style="font-size:12px; color:var(--text-muted); font-family:monospace;">' + escapeClientHTML(timeStr) + '</td>' +
              '<td><b>/' + escapeClientHTML(log.slug) + '</b></td>' +
              '<td>' + botBadge + '</td>' +
              '<td><code class="code-tag">' + escapeClientHTML(log.ip) + '</code></td>' +
              '<td><b>' + escapeClientHTML(log.device) + '</b> • ' + escapeClientHTML(log.os) + '</td>' +
              '<td>' + escapeClientHTML(log.country) + ' - ' + escapeClientHTML(log.city) + '</td>' +
            '</tr>';
          } else {
            return '<tr>' +
              '<td style="font-size:12px; color:var(--text-muted); font-family:monospace;">' + escapeClientHTML(timeStr) + '</td>' +
              '<td>' + botBadge + '</td>' +
              '<td><code class="code-tag">' + escapeClientHTML(log.ip) + '</code></td>' +
              '<td><b>' + escapeClientHTML(log.device) + '</b> • ' + escapeClientHTML(log.os) + '</td>' +
              '<td>' + escapeClientHTML(log.browser) + '</td>' +
              '<td>' + escapeClientHTML(log.country) + ' - ' + escapeClientHTML(log.city) + '</td>' +
            '</tr>';
          }
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
