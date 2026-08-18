// src/views/styles/baseStyles.js
// CSS dùng chung cho giao diện Admin Dashboard, Analytics & Login

export const BASE_STYLES = `
  :root {
    --primary: #0284c7;
    --primary-hover: #0369a1;
    --primary-light: #e0f2fe;
    --bg: #f8fafc;
    --card-bg: #ffffff;
    --text: #0f172a;
    --text-muted: #64748b;
    --border: #e2e8f0;
    --success: #10b981;
    --success-light: #d1fae5;
    --danger: #ef4444;
    --danger-light: #fee2e2;
    --warning: #f59e0b;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { 
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
    background: var(--bg); 
    color: var(--text); 
    line-height: 1.5; 
    padding: 24px 16px; 
  }
  .container { max-width: 1200px; margin: 0 auto; }
  
  /* Header */
  header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    margin-bottom: 24px; 
    flex-wrap: wrap; 
    gap: 16px; 
    background: var(--card-bg);
    padding: 16px 24px;
    border-radius: 12px;
    border: 1px solid var(--border);
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand-logo { 
    width: 38px; 
    height: 38px; 
    background: linear-gradient(135deg, #0284c7, #0369a1); 
    border-radius: 10px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    color: white; 
    font-weight: 800; 
    font-size: 18px; 
  }
  h1 { font-size: 20px; font-weight: 700; color: var(--text); }
  
  /* Tabs Navigation Bar */
  .tabs-nav {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    border-bottom: 2px solid var(--border);
    padding-bottom: 2px;
    background: transparent;
  }
  .tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-muted);
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: -2px;
    border-radius: 8px 8px 0 0;
  }
  .tab-btn:hover {
    color: var(--primary);
    background: #f1f5f9;
  }
  .tab-btn.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
    background: #f0f9ff;
  }
  .tab-badge {
    background: #e2e8f0;
    color: #475569;
    font-size: 11px;
    padding: 2px 7px;
    border-radius: 10px;
    font-weight: 700;
  }
  .tab-btn.active .tab-badge {
    background: var(--primary);
    color: white;
  }

  /* Tab Content Panels */
  .tab-panel {
    display: none;
    animation: fadeIn 0.2s ease-in-out;
  }
  .tab-panel.active {
    display: block;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Cards & Grid */
  .card { 
    background: var(--card-bg); 
    border-radius: 12px; 
    padding: 24px; 
    border: 1px solid var(--border); 
    box-shadow: 0 1px 3px rgba(0,0,0,0.03); 
    margin-bottom: 24px; 
  }
  .card-title { 
    font-weight: 700; 
    font-size: 16px; 
    margin-bottom: 18px; 
    color: var(--text); 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    gap: 8px; 
  }

  .stat-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); 
    gap: 16px; 
    margin-bottom: 24px; 
  }
  .stat-card { 
    background: var(--card-bg); 
    border-radius: 12px; 
    padding: 20px; 
    border: 1px solid var(--border); 
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }
  .stat-title { 
    font-size: 13px; 
    color: var(--text-muted); 
    font-weight: 600; 
    text-transform: uppercase; 
    letter-spacing: 0.5px; 
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .stat-num { 
    font-size: 32px; 
    font-weight: 800; 
    margin-top: 8px; 
    color: var(--text); 
    letter-spacing: -0.5px;
  }

  /* Forms */
  .form-group { margin-bottom: 18px; }
  label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text); }
  input[type="text"], input[type="url"], input[type="file"], input[type="password"], textarea { 
    width: 100%; 
    padding: 10px 14px; 
    border: 1px solid var(--border); 
    border-radius: 8px; 
    font-size: 14px; 
    outline: none; 
    transition: all 0.2s; 
    background: #fff; 
  }
  input:focus, textarea:focus { 
    border-color: var(--primary); 
    box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15); 
  }
  .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }

  /* Buttons */
  .btn { 
    display: inline-flex; 
    align-items: center; 
    justify-content: center; 
    padding: 9px 16px; 
    font-size: 13px; 
    font-weight: 600; 
    border-radius: 8px; 
    border: none; 
    cursor: pointer; 
    transition: all 0.2s; 
    text-decoration: none; 
    gap: 6px; 
    white-space: nowrap;
  }
  .btn-primary { background: var(--primary); color: #fff; }
  .btn-primary:hover { background: var(--primary-hover); }
  .btn-secondary { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }
  .btn-secondary:hover { background: #e2e8f0; }
  .btn-danger { background: var(--danger-light); color: var(--danger); }
  .btn-danger:hover { background: #fca5a5; }
  .btn-sm { padding: 5px 10px; font-size: 12px; border-radius: 6px; }

  /* Tables */
  .table-responsive { width: 100%; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
  th { background: #f8fafc; padding: 12px 14px; border-bottom: 1px solid var(--border); color: var(--text-muted); font-weight: 600; font-size: 13px; }
  td { padding: 12px 14px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  tr:hover td { background: #f8fafc; }

  .code-tag { 
    background: #f1f5f9; 
    padding: 3px 8px; 
    border-radius: 6px; 
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; 
    font-size: 12px; 
    color: #334155; 
  }
  .code-block {
    background: #0f172a;
    color: #38bdf8;
    padding: 14px;
    border-radius: 8px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    line-height: 1.5;
    overflow-x: auto;
    white-space: pre;
    border: 1px solid #1e293b;
    max-height: 280px;
    overflow-y: auto;
  }
  .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .badge-real { background: var(--success-light); color: #065f46; }
  .badge-bot { background: #f1f5f9; color: #475569; }

  .progress-bar-bg { background: #e2e8f0; border-radius: 4px; height: 8px; width: 100%; overflow: hidden; margin-top: 4px; }
  .progress-bar-fill { background: var(--primary); height: 100%; border-radius: 4px; }

  /* Modal & Toast */
  .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 1000; justify-content: center; align-items: center; padding: 20px; }
  .modal-overlay.active { display: flex; }
  .modal-container { background: #fff; border-radius: 16px; max-width: 850px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 28px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2); position: relative; }
  .modal-close { position: absolute; top: 18px; right: 20px; font-size: 24px; border: none; background: none; cursor: pointer; color: #64748b; }
  .modal-close:hover { color: #0f172a; }

  /* Toast Notification */
  #toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 999999; display: flex; flex-direction: column; gap: 10px; max-width: 380px; width: 100%; pointer-events: none; }
  .toast { padding: 14px 18px; border-radius: 10px; font-size: 14px; font-weight: 500; color: #fff; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: space-between; gap: 10px; animation: toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); pointer-events: auto; }
  .toast-success { background: #059669; border-left: 5px solid #34d399; }
  .toast-error { background: #dc2626; border-left: 5px solid #f87171; }
  .toast-info { background: #0284c7; border-left: 5px solid #38bdf8; }
  @keyframes toastIn { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes toastOut { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(20px) scale(0.95); } }

  /* OG Preview Card & Social Network Switcher */
  .og-live-preview { background: #f8fafc; border: 1px solid var(--border); border-radius: 12px; padding: 18px; margin-top: 18px; }
  .social-tabs { display: flex; gap: 6px; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
  .social-tab-btn { background: transparent; border: 1px solid var(--border); padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; color: var(--text-muted); cursor: pointer; transition: all 0.15s; }
  .social-tab-btn:hover { background: #f1f5f9; color: var(--text); }
  .social-tab-btn.active { background: #0284c7; border-color: #0284c7; color: #ffffff; }

  .og-preview-card { background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.06); max-width: 540px; }
  .og-preview-img-box { width: 100%; height: 230px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; overflow: hidden; color: #64748b; font-size: 13px; position: relative; }
  .og-preview-img-box img { width: 100%; height: 100%; object-fit: cover; }
  .og-preview-meta { padding: 12px 14px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
  .og-preview-domain { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; margin-bottom: 4px; letter-spacing: 0.5px; }
  .og-preview-title { font-weight: 700; font-size: 15px; color: #0f172a; margin-bottom: 4px; line-height: 1.3; }
  .og-preview-desc { font-size: 13px; color: #475569; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

  /* Zalo preview mode */
  .zalo-preview-card { background: #fff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; max-width: 440px; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
  .zalo-preview-title { font-weight: 700; font-size: 14px; color: #0068ff; margin-bottom: 4px; }
  .zalo-preview-desc { font-size: 12px; color: #4b5563; margin-bottom: 8px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .zalo-preview-img { width: 100%; height: 180px; object-fit: cover; border-radius: 8px; }
  .zalo-preview-domain { font-size: 11px; color: #9ca3af; margin-top: 6px; }

  /* Edit Mode Banner */
  .edit-mode-banner {
    display: none;
    background: #fffbeb;
    border: 1px solid #fef3c7;
    border-left: 4px solid #f59e0b;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 18px;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .edit-mode-banner.active { display: flex; }

  /* Log Toolbar, Filter Buttons & Pagination */
  .log-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
    background: #f8fafc;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid var(--border);
  }
  .filter-group {
    display: inline-flex;
    align-items: center;
    background: #e2e8f0;
    border-radius: 8px;
    padding: 3px;
    gap: 2px;
  }
  .filter-btn {
    border: none;
    background: transparent;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .filter-btn:hover {
    color: var(--text);
  }
  .filter-btn.active {
    background: #ffffff;
    color: var(--primary);
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .pagination-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid var(--border);
    font-size: 13px;
    color: var(--text-muted);
  }
  .pagination-nav {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }
  .page-btn {
    min-width: 32px;
    height: 32px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: #ffffff;
    color: var(--text);
    cursor: pointer;
    transition: all 0.15s;
  }
  .page-btn:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: var(--primary);
  }
  .page-btn.active {
    background: var(--primary);
    color: #ffffff;
    border-color: var(--primary);
  }
  .page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
