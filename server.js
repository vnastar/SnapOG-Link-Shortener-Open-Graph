// server.js - Node.js Local Development & Production Server for SnapOG Cloudflare Worker
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import worker from './worker.js';
import { DEFAULT_CONFIG } from './src/config/constants.js';

const PORT = 3000;
const ADMIN_DOMAIN = process.env.ADMIN_DOMAIN || DEFAULT_CONFIG.ADMIN_DOMAIN;
const SHORT_DOMAIN = process.env.SHORT_DOMAIN || DEFAULT_CONFIG.SHORT_DOMAIN;
const ADMIN_KEY = process.env.ADMIN_KEY || DEFAULT_CONFIG.ADMIN_KEY || '';
const DEFAULT_FALLBACK_URL = process.env.DEFAULT_FALLBACK_URL || 'https://shopee.vn';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

// =================================================================
// 1. CLOUDFLARE D1 IN-MEMORY / LOCAL DATABASE EMULATOR
// =================================================================
class CloudflareD1Emulator {
  constructor() {
    this.sqlite = new DatabaseSync(':memory:');
    this.initSchema();
    this.seedDemoData();
  }

  initSchema() {
    const schemaSQL = `
      CREATE TABLE IF NOT EXISTS links (
        slug TEXT PRIMARY KEY,
        target_url TEXT NOT NULL,
        title TEXT,
        description TEXT,
        image_url TEXT,
        site_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS clicks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL,
        is_bot INTEGER DEFAULT 0,
        country TEXT,
        city TEXT,
        device TEXT,
        os TEXT,
        browser TEXT,
        ip TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_clicks_slug ON clicks(slug);
      CREATE INDEX IF NOT EXISTS idx_clicks_created ON clicks(created_at);
    `;
    this.sqlite.exec(schemaSQL);
  }

  seedDemoData() {
    // Khởi tạo 3 links demo mẫu
    const seedLinks = [
      {
        slug: 'review-phim-hay',
        target_url: 'https://vnastar.com/top-10-phim-chieu-rap-hot-nhat-2026',
        title: 'Top 10 Phim Chiếu Rạp Bom Tấn Đáng Xem Nhất 2026 | Review Phim',
        description: 'Tổng hợp danh sách các bộ phim điện ảnh đình đám, kỹ xảo mãn nhãn với điểm đánh giá cao ngất ngưởng trên IMDb.',
        image_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
        site_name: 'VnStar Review Phim'
      },
      {
        slug: 'khuyen-mai-2026',
        target_url: 'https://vnastar.com/uu-dai-ve-xem-phim-giam-gia-50',
        title: 'Săn Vé Xem Phim Giảm Giá 50% Cuối Tuần - Độc Quyền Vnastars',
        description: 'Nhận ngay mã voucher giảm 50% bắp nước và vé xem phim CGV, Lotte, BHD duy nhất trong tuần lễ ra mắt!',
        image_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop&q=80',
        site_name: 'VnStar Cinema'
      },
      {
        slug: 'khoa-hoc-online',
        target_url: 'https://vnastar.com/khoa-hoc-lap-trinh-cloud-serverless',
        title: 'Khóa Học Làm Chủ Cloudflare Workers & Serverless Toàn Diện',
        description: 'Học cách xây dựng hệ thống URL shortener, CDN cache và Edge AI với chi phí $0 trên hạ tầng Cloudflare toàn cầu.',
        image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80',
        site_name: 'VnStar Academy'
      }
    ];

    const insertLink = this.sqlite.prepare(`
      INSERT OR IGNORE INTO links (slug, target_url, title, description, image_url, site_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+7 hours', '-2 days'))
    `);

    for (const l of seedLinks) {
      insertLink.run(l.slug, l.target_url, l.title, l.description, l.image_url, l.site_name || 'VnStar SnapOG');
    }

    // Seed lịch sử clicks mẫu phong phú (Người thật + Bot, Hà Nội, TP.HCM, Đà Nẵng, Quốc tế)
    const seedClicks = [
      // Link 1: review-phim-hay (Traffic cao, có crawler Facebook/Zalo)
      ['review-phim-hay', 1, 'United States', 'Ashburn', 'Desktop', 'Linux', 'facebookexternalhit', '69.171.251.1'],
      ['review-phim-hay', 1, 'Vietnam', 'Hanoi', 'Mobile', 'iOS', 'ZaloBot', '118.69.182.10'],
      ['review-phim-hay', 0, 'Vietnam', 'Ho Chi Minh', 'Mobile', 'iOS', 'Safari', '14.161.22.45'],
      ['review-phim-hay', 0, 'Vietnam', 'Hanoi', 'Mobile', 'Android', 'Chrome Mobile', '113.190.234.12'],
      ['review-phim-hay', 0, 'Vietnam', 'Da Nang', 'Desktop', 'Windows', 'Chrome', '42.114.150.88'],
      ['review-phim-hay', 0, 'Vietnam', 'Ho Chi Minh', 'Mobile', 'iOS', 'Safari', '1.53.200.77'],
      ['review-phim-hay', 0, 'Singapore', 'Singapore', 'Desktop', 'macOS', 'Edge', '128.199.200.11'],
      ['review-phim-hay', 0, 'Vietnam', 'Hanoi', 'Mobile', 'Android', 'Chrome Mobile', '118.70.12.34'],
      ['review-phim-hay', 0, 'Vietnam', 'Hai Phong', 'Desktop', 'Windows', 'Chrome', '123.24.56.78'],

      // Link 2: khuyen-mai-2026
      ['khuyen-mai-2026', 1, 'Vietnam', 'Ho Chi Minh', 'Mobile', 'Android', 'ZaloBot', '120.72.100.1'],
      ['khuyen-mai-2026', 0, 'Vietnam', 'Ho Chi Minh', 'Mobile', 'iOS', 'Safari', '115.79.130.40'],
      ['khuyen-mai-2026', 0, 'Vietnam', 'Hanoi', 'Desktop', 'Windows', 'Chrome', '113.160.80.20'],
      ['khuyen-mai-2026', 0, 'Vietnam', 'Can Tho', 'Mobile', 'Android', 'Chrome Mobile', '171.240.10.55'],
      ['khuyen-mai-2026', 0, 'Japan', 'Tokyo', 'Desktop', 'macOS', 'Safari', '133.242.18.90'],

      // Link 3: khoa-hoc-online
      ['khoa-hoc-online', 1, 'United States', 'Mountain View', 'Desktop', 'Linux', 'TelegramBot', '149.154.161.5'],
      ['khoa-hoc-online', 0, 'Vietnam', 'Hanoi', 'Desktop', 'macOS', 'Chrome', '14.225.250.30'],
      ['khoa-hoc-online', 0, 'Vietnam', 'Ho Chi Minh', 'Desktop', 'Windows', 'Firefox', '118.69.50.22'],
      ['khoa-hoc-online', 0, 'United States', 'San Francisco', 'Desktop', 'macOS', 'Safari', '104.28.19.44']
    ];

    const insertClick = this.sqlite.prepare(`
      INSERT INTO clicks (slug, is_bot, country, city, device, os, browser, ip, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+7 hours', '-' || (abs(random()) % 120) || ' minutes'))
    `);

    for (const c of seedClicks) {
      insertClick.run(...c);
    }
  }

  exec(sql) {
    return this.sqlite.exec(sql);
  }

  prepare(sql) {
    const sqlite = this.sqlite;
    const makeStatement = (params = []) => ({
      bind(...newParams) {
        return makeStatement(newParams);
      },
      first(colName) {
        try {
          const stmt = sqlite.prepare(sql);
          const rows = stmt.all(...params);
          if (rows.length === 0) return null;
          if (colName && typeof colName === 'string') {
            return rows[0][colName] !== undefined ? rows[0][colName] : null;
          }
          return rows[0];
        } catch (e) {
          console.error('D1 first() error:', e.message, sql);
          return null;
        }
      },
      all() {
        try {
          const stmt = sqlite.prepare(sql);
          const rows = stmt.all(...params);
          return { results: rows || [], success: true };
        } catch (e) {
          console.error('D1 all() error:', e.message, sql);
          return { results: [], success: false, error: e.message };
        }
      },
      run() {
        try {
          const stmt = sqlite.prepare(sql);
          const res = stmt.run(...params);
          return { success: true, meta: res };
        } catch (e) {
          console.error('D1 run() error:', e.message, sql);
          throw e;
        }
      }
    });

    return makeStatement([]);
  }

  async batch(statements) {
    const results = [];
    for (const stmt of statements) {
      if (stmt && typeof stmt.all === 'function') {
        results.push(await stmt.all());
      } else if (stmt && typeof stmt.run === 'function') {
        results.push(await stmt.run());
      }
    }
    return results;
  }
}

// =================================================================
// 2. CLOUDFLARE R2 IN-MEMORY STORAGE EMULATOR
// =================================================================
class CloudflareR2Emulator {
  constructor() {
    this.storage = new Map();
  }

  async put(key, body, options = {}) {
    let buffer;
    if (Buffer.isBuffer(body)) {
      buffer = body;
    } else if (body instanceof Uint8Array) {
      buffer = Buffer.from(body);
    } else if (typeof body === 'string') {
      buffer = Buffer.from(body);
    } else if (body && typeof body.arrayBuffer === 'function') {
      const ab = await body.arrayBuffer();
      buffer = Buffer.from(ab);
    } else {
      buffer = Buffer.from(String(body || ''));
    }

    const contentType = options?.httpMetadata?.contentType || 'image/jpeg';
    const etag = `"${Date.now()}-${Math.random().toString(36).substring(2, 8)}"`;

    this.storage.set(key, {
      buffer,
      httpMetadata: { contentType },
      httpEtag: etag,
      size: buffer.length,
      uploaded: new Date()
    });

    return { 
      key, 
      size: buffer.length, 
      etag, 
      httpEtag: etag, 
      httpMetadata: { contentType } 
    };
  }

  async get(key) {
    const item = this.storage.get(key);
    if (!item) return null;

    return {
      body: item.buffer,
      httpMetadata: item.httpMetadata,
      httpEtag: item.httpEtag,
      size: item.size,
      uploaded: item.uploaded,
      writeHttpMetadata(headers) {
        if (item.httpMetadata?.contentType) {
          headers.set('Content-Type', item.httpMetadata.contentType);
        }
      },
      async arrayBuffer() {
        return item.buffer.buffer.slice(item.buffer.byteOffset, item.buffer.byteOffset + item.buffer.byteLength);
      },
      async text() {
        return item.buffer.toString('utf-8');
      }
    };
  }

  async head(key) {
    const item = this.storage.get(key);
    if (!item) return null;
    return {
      key,
      size: item.size,
      httpEtag: item.httpEtag,
      httpMetadata: item.httpMetadata,
      uploaded: item.uploaded
    };
  }

  async delete(keys) {
    if (Array.isArray(keys)) {
      keys.forEach(k => this.storage.delete(k));
    } else if (typeof keys === 'string') {
      this.storage.delete(keys);
    }
    return true;
  }

  async list(options = {}) {
    const prefix = options.prefix || '';
    const objects = [];
    for (const [key, val] of this.storage.entries()) {
      if (!prefix || key.startsWith(prefix)) {
        objects.push({
          key,
          size: val.size,
          httpEtag: val.httpEtag,
          uploaded: val.uploaded || new Date()
        });
      }
    }
    return { objects, truncated: false };
  }
}

// Khởi tạo các singleton emulators
const dbMock = new CloudflareD1Emulator();
const r2Mock = new CloudflareR2Emulator();

// Môi trường bindings truyền cho Cloudflare Worker (hỗ trợ tất cả alias tên biến)
const workerEnv = {
  DB: dbMock,
  LINKS_DB: dbMock,
  MY_R2_BUCKET: r2Mock,
  R2_BUCKET: r2Mock,
  IMAGES_BUCKET: r2Mock,
  R2: r2Mock,
  ADMIN_DOMAIN,
  SHORT_DOMAIN,
  ADMIN_KEY,
  DEFAULT_FALLBACK_URL,
  R2_PUBLIC_URL
};

// =================================================================
// 3. THANH ĐIỀU KHIỂN SIMULATION (EDGE CONTROL CENTER)
// =================================================================
function injectSimulationToolbar(html, currentUrl, reqHeaders) {
  const currentHost = currentUrl.hostname;
  const simDomain = currentUrl.searchParams.get('simulate_domain') || '';
  const isShortView = simDomain === SHORT_DOMAIN || currentHost === SHORT_DOMAIN;

  const toolbarHtml = `
    <!-- SNAPOG LIVE PREVIEW CONTROL BAR -->
    <div id="snapog-preview-bar" style="position: sticky; top: 0; z-index: 999999; background: #0f172a; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; border-bottom: 1px solid #334155; box-shadow: 0 4px 12px rgba(0,0,0,0.25); padding: 8px 16px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;">
      <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; color: #38bdf8; font-size: 14px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          <span>SnapOG Live Edge Demo</span>
        </div>
        <span style="color: #64748b;">|</span>
        
        <!-- Bộ chuyển đổi chế độ xem Domain -->
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="color: #94a3b8; font-size: 12px;">Chế độ Tên miền:</span>
          <a href="/${currentUrl.searchParams.get('slug') ? 'stats?slug=' + currentUrl.searchParams.get('slug') : ''}" style="text-decoration: none; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 12px; transition: all 0.15s; ${!isShortView ? 'background: #0284c7; color: #ffffff;' : 'background: #1e293b; color: #94a3b8;'}">
            🛡️ Admin: ${ADMIN_DOMAIN}
          </a>
          <a href="/review-phim-hay?simulate_domain=${encodeURIComponent(SHORT_DOMAIN)}" style="text-decoration: none; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 12px; transition: all 0.15s; ${isShortView ? 'background: #f59e0b; color: #000000;' : 'background: #1e293b; color: #94a3b8;'}">
            🔗 Rút gọn: ${SHORT_DOMAIN}
          </a>
        </div>
      </div>

      <!-- Công cụ kích hoạt Traffic thử nghiệm -->
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <button onclick="triggerSimulatedClick('review-phim-hay')" style="background: #10b981; color: white; border: none; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: opacity 0.2s;" title="Tạo 1 lượt click ngẫu nhiên từ Hà Nội / HCM để cập nhật biểu đồ">
          ⚡ Bắn 1 Click Người Thật
        </button>

        <button onclick="triggerSimulatedBot('review-phim-hay')" style="background: #8b5cf6; color: white; border: none; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;" title="Mô phỏng Facebook Crawler quét thẻ Open Graph">
          🤖 Bot FB Cào Thẻ OG
        </button>

        <a href="/" style="background: #334155; color: #cbd5e1; text-decoration: none; padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 500;">
          🔄 Làm Mới
        </a>
      </div>
    </div>

    <script>
      async function triggerSimulatedClick(slug) {
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '⏳ Đang gửi...';
        btn.disabled = true;

        const cities = [
          { city: 'Hanoi', country: 'Vietnam', os: 'iOS', browser: 'Safari', device: 'Mobile' },
          { city: 'Ho Chi Minh', country: 'Vietnam', os: 'Android', browser: 'Chrome Mobile', device: 'Mobile' },
          { city: 'Da Nang', country: 'Vietnam', os: 'Windows', browser: 'Chrome', device: 'Desktop' },
          { city: 'Tokyo', country: 'Japan', os: 'macOS', browser: 'Safari', device: 'Desktop' },
          { city: 'Singapore', country: 'Singapore', os: 'iOS', browser: 'Safari', device: 'Mobile' }
        ];
        const randomTarget = cities[Math.floor(Math.random() * cities.length)];

        try {
          await fetch('/__simulate_click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              slug: slug || 'review-phim-hay',
              is_bot: 0,
              ...randomTarget
            })
          });
          btn.innerHTML = '✅ Đã ghi nhận Click!';
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } catch(e) {
          btn.innerHTML = '❌ Lỗi';
          setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 1500);
        }
      }

      async function triggerSimulatedBot(slug) {
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '⏳ Bot đang quét...';
        btn.disabled = true;

        try {
          await fetch('/__simulate_click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              slug: slug || 'review-phim-hay',
              is_bot: 1,
              city: 'Ashburn',
              country: 'United States',
              os: 'Linux',
              browser: 'facebookexternalhit',
              device: 'Desktop'
            })
          });
          btn.innerHTML = '✅ Đã ghi nhận Bot FB!';
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } catch(e) {
          btn.innerHTML = '❌ Lỗi';
          setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 1500);
        }
      }
    </script>
  `;

  if (html.includes('<body')) {
    return html.replace(/<body([^>]*)>/i, `<body$1>${toolbarHtml}`);
  }
  return toolbarHtml + html;
}

// =================================================================
// 4. HTTP SERVER & REQUEST CONVERSION
// =================================================================
const server = http.createServer(async (req, res) => {
  try {
    const fullUrlString = `http://${req.headers.host || 'localhost:3000'}${req.url}`;
    const parsedUrl = new URL(fullUrlString);

    // Endpoint hỗ trợ bắn click thử nghiệm từ Top Toolbar
    if (parsedUrl.pathname === '/__simulate_click' && req.method === 'POST') {
      let bodyData = '';
      for await (const chunk of req) {
        bodyData += chunk;
      }
      try {
        const data = JSON.parse(bodyData || '{}');
        const db = workerEnv.DB.sqlite;
        const stmt = db.prepare(`
          INSERT INTO clicks (slug, is_bot, country, city, device, os, browser, ip, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+7 hours'))
        `);
        stmt.run(
          data.slug || 'review-phim-hay',
          data.is_bot ? 1 : 0,
          data.country || 'Vietnam',
          data.city || 'Hanoi',
          data.device || 'Desktop',
          data.os || 'Windows',
          data.browser || 'Chrome',
          '14.161.' + Math.floor(Math.random() * 250) + '.' + Math.floor(Math.random() * 250)
        );
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
    }

    // Đọc body request
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const bodyBuffer = Buffer.concat(buffers);

    // Chuyển đổi thành Web Standards Headers
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v);
      } else if (value !== undefined) {
        headers.set(key, value);
      }
    }

    // Giả lập thông số Cloudflare Edge Network (request.cf)
    const cf = {
      country: req.headers['cf-ipcountry'] || 'VN',
      city: 'Hanoi',
      continent: 'AS',
      latitude: '21.0285',
      longitude: '105.8542',
      timezone: 'Asia/Ho_Chi_Minh'
    };

    const requestInit = {
      method: req.method,
      headers
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && bodyBuffer.length > 0) {
      requestInit.body = bodyBuffer;
    }

    const webRequest = new Request(fullUrlString, requestInit);
    Object.defineProperty(webRequest, 'cf', { value: cf, writable: false });

    // Mock ExecutionContext của Cloudflare Worker
    const ctx = {
      waitUntil(promise) {
        if (promise && typeof promise.then === 'function') {
          promise.catch(e => console.error('ctx.waitUntil error:', e));
        }
      },
      passThroughOnException() {}
    };

    // Gọi trực tiếp fetch() của Worker
    const response = await worker.fetch(webRequest, workerEnv, ctx);

    // Chuyển đổi Response headers sang Node response
    const responseHeaders = {};
    for (const [k, v] of response.headers.entries()) {
      responseHeaders[k] = v;
    }
    
    // Đảm bảo lấy đầy đủ mảng Set-Cookie nếu có
    if (typeof response.headers.getSetCookie === 'function') {
      const setCookies = response.headers.getSetCookie();
      if (setCookies && setCookies.length > 0) {
        responseHeaders['set-cookie'] = setCookies;
      }
    }

    // Xử lý 302 Chuyển hướng cho Short link trong iframe live demo
    if (response.status >= 300 && response.status < 400 && response.headers.has('Location')) {
      const targetLocation = response.headers.get('Location') || '';
      const isExternalTarget = targetLocation.startsWith('http://') || targetLocation.startsWith('https://');
      const isInternalRedirect = targetLocation.startsWith('/') || (isExternalTarget && (targetLocation.includes(req.headers.host || 'localhost')));

      // Nếu là redirect nội bộ (ví dụ: /login -> /, /logout -> /, /stats?slug=...) -> Chuyển hướng thực sự ngay, KHÔNG chặn màn hình
      if (isInternalRedirect) {
        if (responseHeaders['set-cookie']) {
          res.setHeader('Set-Cookie', responseHeaders['set-cookie']);
        }
        res.writeHead(response.status, responseHeaders);
        res.end();
        return;
      }

      // Nếu truy cập từ trình duyệt có accept text/html tới URL ngoài (như shopee, vnastar...) trên domain rút gọn
      if (!req.headers['x-requested-with'] && (req.headers['accept'] || '').includes('text/html')) {
        const transitionHtml = `<!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <title>Chuyển hướng SnapOG</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 540px; width: 100%; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
            .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(16,185,129,0.15); color: #34d399; padding: 6px 14px; border-radius: 9999px; font-weight: 600; font-size: 13px; margin-bottom: 16px; }
            h2 { margin: 0 0 12px 0; font-size: 22px; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; word-break: break-all; }
            .btn { display: inline-block; background: #0284c7; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; transition: background 0.2s; }
            .btn:hover { background: #0369a1; }
            .back-link { display: block; margin-top: 16px; color: #64748b; font-size: 13px; text-decoration: none; }
            .back-link:hover { color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">🚀 302 Chuyển Hướng Thành Công</div>
            <h2>Đang chuyển hướng tới URL đích</h2>
            <p>Hệ thống đã ghi nhận 1 lượt click an toàn và chuẩn bị chuyển bạn tới:<br><strong style="color: #38bdf8;">${targetLocation}</strong></p>
            <a href="${targetLocation}" target="_blank" rel="noopener noreferrer" class="btn">Mở URL Đích Ngay Bây Giờ &rarr;</a>
            <a href="/" class="back-link">&larr; Quay lại Trang Quản Trị SnapOG</a>
          </div>
        </body>
        </html>`;

        const finalHtml = injectSimulationToolbar(transitionHtml, parsedUrl, req.headers);
        if (responseHeaders['set-cookie']) {
          res.setHeader('Set-Cookie', responseHeaders['set-cookie']);
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(finalHtml);
        return;
      }

      if (responseHeaders['set-cookie']) {
        res.setHeader('Set-Cookie', responseHeaders['set-cookie']);
      }
      res.writeHead(response.status, responseHeaders);
      res.end();
      return;
    }

    // Trả về HTML kèm Top Toolbar
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      let htmlText = await response.text();
      htmlText = injectSimulationToolbar(htmlText, parsedUrl, req.headers);
      
      delete responseHeaders['content-length'];
      res.writeHead(response.status, responseHeaders);
      res.end(htmlText);
      return;
    }

    // Trả về dữ liệu nhị phân hoặc JSON
    const arrayBuffer = await response.arrayBuffer();
    delete responseHeaders['content-length'];
    res.writeHead(response.status, responseHeaders);
    res.end(Buffer.from(arrayBuffer));

  } catch (err) {
    console.error('Lỗi thực thi server:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Lỗi máy chủ demo: ${err.message}\n${err.stack}`);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=============================================================`);
  console.log(`🚀 SnapOG Live Edge Server đang chạy tại http://localhost:${PORT}`);
  console.log(`🛡️  Admin Domain:    ${ADMIN_DOMAIN}`);
  console.log(`🔗 Shortener Domain: ${SHORT_DOMAIN}`);
  console.log(`🗄️  D1 Database:     In-Memory SQLite (Schema & Seed Data loaded)`);
  console.log(`📦 R2 Storage:      In-Memory Object Storage active`);
  console.log(`=============================================================\n`);
});
