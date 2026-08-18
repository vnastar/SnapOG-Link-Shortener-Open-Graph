// src/views/pages/loginPage.js
// Giao diện Đăng Nhập Quản Trị Hệ Thống (ADMIN_KEY Authentication)

import { BASE_STYLES } from '../styles/baseStyles.js';
import { escapeHTML } from '../../utils/security.js';

/**
 * Render trang đăng nhập quản trị
 * @param {string} errorMessage Thông báo lỗi (nếu có)
 * @param {string} adminDomain Tên miền quản trị
 * @returns {string} HTML markup
 */
export function renderLoginPage(errorMessage = "", adminDomain = "snapog.vnastar.com") {
  const errorAlert = errorMessage ? `<div id="serverErrorAlert" class="alert-error">⚠️ ${escapeHTML(errorMessage)}</div>` : `<div id="serverErrorAlert" style="display:none;" class="alert-error"></div>`;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SnapOG - Đăng Nhập Quản Trị</title>
  <style>
    ${BASE_STYLES}
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #0f172a;
      padding: 20px;
    }
    .login-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 36px 30px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .login-header {
      text-align: center;
      margin-bottom: 24px;
    }
    .login-logo {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #0284c7, #0369a1);
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 22px;
      font-weight: 800;
      margin-bottom: 12px;
    }
    .alert-error {
      background: #fee2e2;
      border: 1px solid #fca5a5;
      color: #b91c1c;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 18px;
    }
    .alert-success {
      background: #dcfce7;
      border: 1px solid #86efac;
      color: #15803d;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 18px;
    }
  </style>
</head>
<body>
  <div class="login-card">
    <div class="login-header">
      <div class="login-logo">S</div>
      <h1>SnapOG Edge Admin</h1>
      <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Quản lý link và phân tích Open Graph</p>
    </div>

    ${errorAlert}
    <div id="dynamicAlert" style="display:none;"></div>

    <form id="loginForm" method="POST" action="/login" onsubmit="handleLoginSubmit(event)">
      <div class="form-group" style="position: relative;">
        <label for="adminKeyInput">Mật khẩu Quản trị (ADMIN_KEY)</label>
        <div style="display: flex; gap: 6px;">
          <input type="password" id="adminKeyInput" name="adminKey" placeholder="Nhập mã bí mật ADMIN_KEY..." required autofocus autocomplete="current-password" style="flex:1;">
          <button type="button" onclick="togglePasswordVisibility()" class="btn btn-secondary" style="padding: 0 12px; font-size: 14px;" title="Hiện/ẩn mật khẩu">👁️</button>
        </div>
      </div>
      <button type="submit" id="loginBtn" class="btn btn-primary" style="width: 100%; padding: 12px; font-size: 14px; margin-top: 6px;">
        🔐 Đăng Nhập Quản Trị
      </button>
    </form>

    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: var(--text-muted);">
      Serverless Edge Admin • Cloudflare Worker
    </div>
  </div>

  <script>
    function togglePasswordVisibility() {
      var input = document.getElementById('adminKeyInput');
      if (input.type === 'password') {
        input.type = 'text';
      } else {
        input.type = 'password';
      }
    }

    // Tự động kiểm tra nếu có token trong localStorage
    window.addEventListener('DOMContentLoaded', async function() {
      var savedKey = localStorage.getItem('snapog_admin_key');
      if (savedKey) {
        if (!document.getElementById('adminKeyInput').value) {
          document.getElementById('adminKeyInput').value = savedKey;
        }
        // Kiểm tra xem token đã lưu có hợp lệ không, nếu có thì tự động vào Dashboard
        try {
          var testRes = await fetch('/api/links', {
            headers: { 
              'Authorization': 'Bearer ' + savedKey,
              'x-admin-key': savedKey
            }
          });
          var testData = await testRes.json().catch(function() { return {}; });
          if (testRes.ok && testData.success) {
            var dynamicAlert = document.getElementById('dynamicAlert');
            dynamicAlert.className = 'alert-success';
            dynamicAlert.innerHTML = '🔑 Đã nhận diện phiên đăng nhập hợp lệ! Đang mở Dashboard...';
            dynamicAlert.style.display = 'block';
            setTimeout(function() {
              window.location.href = '/?key=' + encodeURIComponent(savedKey);
            }, 300);
          }
        } catch(e) {}
      }
    });

    async function handleLoginSubmit(e) {
      e.preventDefault();
      var form = document.getElementById('loginForm');
      var keyInput = document.getElementById('adminKeyInput').value.trim();
      var loginBtn = document.getElementById('loginBtn');
      var dynamicAlert = document.getElementById('dynamicAlert');
      var serverAlert = document.getElementById('serverErrorAlert');

      if (serverAlert) serverAlert.style.display = 'none';

      if (!keyInput) {
        dynamicAlert.className = 'alert-error';
        dynamicAlert.innerHTML = '⚠️ Vui lòng nhập mật khẩu quản trị!';
        dynamicAlert.style.display = 'block';
        return;
      }

      loginBtn.disabled = true;
      loginBtn.innerHTML = '⏳ Đang xác thực...';

      try {
        var res = await fetch('/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ adminKey: keyInput })
        });

        var data = await res.json().catch(function() { return {}; });

        if (res.ok && data.success) {
          // Lưu token vào localStorage và sessionStorage để dùng cho mọi request
          localStorage.setItem('snapog_admin_key', keyInput);
          sessionStorage.setItem('snapog_admin_key', keyInput);

          dynamicAlert.className = 'alert-success';
          dynamicAlert.innerHTML = '✅ Đăng nhập thành công! Đang chuyển hướng vào Dashboard...';
          dynamicAlert.style.display = 'block';

          setTimeout(function() {
            window.location.href = '/?key=' + encodeURIComponent(keyInput);
          }, 200);
        } else {
          loginBtn.disabled = false;
          loginBtn.innerHTML = '🔐 Đăng Nhập Quản Trị';
          dynamicAlert.className = 'alert-error';
          dynamicAlert.innerHTML = '⚠️ ' + (data.error || 'Mật khẩu quản trị không chính xác. Vui lòng thử lại!');
          dynamicAlert.style.display = 'block';
        }
      } catch (err) {
        console.error('Lỗi khi gọi API login:', err);
        // Nếu fetch gặp lỗi, fallback gửi form chuẩn
        form.submit();
      }
    }
  </script>
</body>
</html>`;
}
