-- ==============================================================================
-- SnapOG Migration & Update Script (Cloudflare D1 / SQLite)
-- Mục đích: Tự động khởi tạo bảng, chỉ mục và thêm các cột mới nếu CSDL chưa có
-- Đảm bảo không làm mất hoặc ghi đè dữ liệu đang có trong database.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. KHỞI TẠO CÁC BẢNG (NẾU CHƯA TỒN TẠI)
-- ------------------------------------------------------------------------------

-- Bảng quản lý danh sách Link rút gọn
CREATE TABLE IF NOT EXISTS links (
    slug TEXT PRIMARY KEY,
    target_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    image_url TEXT,
    site_name TEXT,
    created_at DATETIME DEFAULT (datetime('now', '+7 hours'))
);

-- Bảng lưu nhật ký chi tiết các lượt truy cập (Real Users & Bots/Crawlers)
CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL,
    is_bot INTEGER DEFAULT 0,
    country TEXT DEFAULT 'Unknown',
    city TEXT DEFAULT 'Unknown',
    device TEXT DEFAULT 'Desktop',
    os TEXT DEFAULT 'Unknown OS',
    browser TEXT DEFAULT 'Unknown Browser',
    ip TEXT DEFAULT 'Unknown',
    created_at DATETIME DEFAULT (datetime('now', '+7 hours')),
    FOREIGN KEY (slug) REFERENCES links(slug) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- 2. TẠO INDEXES TỐI ƯU TRUY VẤN (NẾU CHƯA CÓ)
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_clicks_slug ON clicks(slug);
CREATE INDEX IF NOT EXISTS idx_clicks_created ON clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_clicks_is_bot ON clicks(is_bot);
CREATE INDEX IF NOT EXISTS idx_links_created ON links(created_at);

-- ------------------------------------------------------------------------------
-- 3. CẬP NHẬT BỔ SUNG CỘT CHO BẢNG ĐÃ TỒN TẠI TỪ PHIÊN BẢN CŨ
-- (Chạy khi nâng cấp từ database cũ thiếu cột site_name, title, description, ...)
-- ------------------------------------------------------------------------------

-- Bổ sung các cột cho bảng links (nếu CSDL phiên bản trước chưa có)
-- ALTER TABLE links ADD COLUMN title TEXT;
-- ALTER TABLE links ADD COLUMN description TEXT;
-- ALTER TABLE links ADD COLUMN image_url TEXT;
-- ALTER TABLE links ADD COLUMN site_name TEXT;
-- ALTER TABLE links ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Bổ sung các cột cho bảng clicks (nếu CSDL phiên bản trước chưa có)
-- ALTER TABLE clicks ADD COLUMN is_bot INTEGER DEFAULT 0;
-- ALTER TABLE clicks ADD COLUMN country TEXT DEFAULT 'Unknown';
-- ALTER TABLE clicks ADD COLUMN city TEXT DEFAULT 'Unknown';
-- ALTER TABLE clicks ADD COLUMN device TEXT DEFAULT 'Desktop';
-- ALTER TABLE clicks ADD COLUMN os TEXT DEFAULT 'Unknown OS';
-- ALTER TABLE clicks ADD COLUMN browser TEXT DEFAULT 'Unknown Browser';
-- ALTER TABLE clicks ADD COLUMN ip TEXT DEFAULT 'Unknown';
-- ALTER TABLE clicks ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;