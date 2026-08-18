# 🚀 Hướng Dẫn Cài Đặt & Triển Khai SnapOG trên Cloudflare Workers

**SnapOG** là giải pháp rút gọn link thông minh, tối ưu hóa hiển thị thẻ Open Graph (Facebook, Zalo, Telegram, TikTok, iMessage...) và phân tích lượt click theo thời gian thực (phân tách người dùng thật vs Bot/Crawler MXH). 

Toàn bộ hệ thống chạy **100% Serverless trên Cloudflare Edge**, đảm bảo tốc độ phản hồi cực nhanh (< 50ms), chi phí 0đ (hoàn toàn miễn phí trên Cloudflare Free Tier) và chịu tải hàng triệu lượt truy cập.

---

## 📑 Mục Lục
1. [Mô hình Kiến trúc & Hai Tên Miền](#1-mô-hình-kiến-trúc--hai-tên-miền)
2. [Cách 1: Triển khai Siêu Tốc qua Wrangler CLI (Khuyên dùng - Nhanh nhất trong 3 phút)](#2-cách-1-triển-khai-siêu-tốc-qua-wrangler-cli-khuyên-dùng)
3. [Cách 2: Triển khai Tự Động qua GitHub Actions (CI/CD)](#3-cách-2-triển-khai-tự-động-qua-github-actions-cicd)
4. [Cách 3: Triển khai qua Giao diện Web Cloudflare Dashboard](#4-cách-3-triển-khai-qua-giao-diện-web-cloudflare-dashboard)
5. [Bảng Cấu Hình Biến Môi Trường & Bindings](#5-bảng-cấu-hình-biến-môi-trường--bindings)
6. [Cấu Trúc Mã Nguồn Dự Án](#6-cấu-trúc-mã-nguồn-dự-án)
7. [Kiểm Thử Sau Khi Triển Khai](#7-kiểm-thử-sau-khi-triển-khai)
8. [Tối Ưu Bảo Mật & Chống Spam / DDoS](#8-tối-ưu-bảo-mật--chống-spam--ddos)
9. [Xử Lý Sự Cố Thường Gặp (Troubleshooting / FAQ)](#9-xử-lý-sự-cố-thường-gặp-troubleshooting--faq)

---

## 1. Mô hình Kiến trúc & Hai Tên Miền

Hệ thống hoạt động với kiến trúc định tuyến thông minh dựa trên Domain truy cập:

| Tên Miền (Ví dụ) | Loại Tên Miền | Chức Năng Chính |
| :--- | :--- | :--- |
| **`admin.yourdomain.com`** | **Admin Domain** | Mở Bảng điều khiển quản trị (Dashboard), Quản trị Link (CRUD), xem Biểu đồ phân tích Analytics, Phân trang và Lọc logs người thật/bot. |
| **`short.yourdomain.com`** | **Short Domain** | Tên miền ngắn chia sẻ lên MXH. Tự động trả về thẻ Meta OG chuẩn đẹp cho Bot MXH hoặc chuyển hướng tức thì (Redirect 302) đến URL đích khi người thật bấm vào. |

### Các Dịch Vụ Cloudflare Sử Dụng:
- **Cloudflare Workers**: Xử lý định tuyến (Router), phân biệt Bot/Người thật, phục vụ hình ảnh và render HTML.
- **Cloudflare D1**: Cơ sở dữ liệu SQLite Serverless lưu cấu hình link (`links`) và lịch sử click (`clicks`).
- **Cloudflare R2**: Kho lưu trữ Object Storage (tương thích AWS S3) lưu ảnh banner Open Graph.

---

## 2. Cách 1: Triển khai Siêu Tốc qua Wrangler CLI (Khuyên dùng)

Đây là cách nhanh nhất, chính xác nhất và tự động hóa việc đóng gói toàn bộ mã nguồn `src/`.

### 📌 Bước 1: Cài đặt Wrangler & Đăng nhập Cloudflare
Mở Terminal trên máy tính và chạy:
```bash
# Cài đặt wrangler CLI toàn cục (hoặc dùng npx)
npm install -g wrangler

# Đăng nhập vào tài khoản Cloudflare của bạn (sẽ mở trình duyệt để xác thực)
wrangler login
```

### 📌 Bước 2: Tạo Cơ sở dữ liệu Cloudflare D1
```bash
# Tạo database D1 tên 'link_analytics'
wrangler d1 create link_analytics
```
*Sau khi chạy, Terminal sẽ in ra thông tin cấu hình, ví dụ:*
```text
[[d1_databases]]
binding = "DB"
database_name = "link_analytics"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 📌 Bước 3: Khởi tạo Cấu trúc Bảng CSDL (Schema)
Chạy lệnh sau để tạo bảng `links`, `clicks` và các chỉ mục (indexes) trên Cloudflare D1:
```bash
wrangler d1 execute link_analytics --file=./schema.sql --remote
```

### 📌 Bước 4: Tạo Kho lưu trữ Cloudflare R2
```bash
# Tạo R2 bucket để lưu ảnh Open Graph
wrangler r2 bucket create og-images-bucket
```

### 📌 Bước 5: Cập nhật file `wrangler.toml`
Mở file `wrangler.toml` ở thư mục gốc của dự án và cập nhật thông tin thực tế của bạn:
```toml
name = "snapog-worker"
main = "worker.js"
compatibility_date = "2024-01-01"

# 1. Liên kết CSDL D1
[[d1_databases]]
binding = "DB"
database_name = "link_analytics"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" # Thay bằng ID D1 vừa tạo ở Bước 2

# 2. Liên kết Kho lưu trữ R2
[[r2_buckets]]
binding = "MY_R2_BUCKET"
bucket_name = "og-images-bucket"

# 3. Cấu hình Tên miền hệ thống
[vars]
ADMIN_DOMAIN = "admin.yourdomain.com"
SHORT_DOMAIN = "short.yourdomain.com"
```

### 📌 Bước 6: Thiết lập Mật khẩu Quản trị (`ADMIN_KEY`)
Chạy lệnh sau để thiết lập mật khẩu đăng nhập an toàn (được mã hóa dạng Secret trên Cloudflare):
```bash
wrangler secret put ADMIN_KEY
# Nhập mật khẩu quản trị bạn muốn đặt (ví dụ: MatKhauCuaBan@2026) và nhấn Enter
```

### 📌 Bước 7: Triển khai Worker lên Cloudflare
```bash
wrangler deploy
```

### 📌 Bước 8: Gắn Tên Miền Tùy Chỉnh (Custom Domains)
1. Truy cập [Cloudflare Dashboard](https://dash.cloudflare.com/) $\rightarrow$ **Workers & Pages** $\rightarrow$ Chọn Worker `snapog-worker`.
2. Vào **Settings** $\rightarrow$ **Domains & Routes** (hoặc **Triggers**).
3. Nhấn **Add Custom Domain** $\rightarrow$ Nhập domain Admin: `admin.yourdomain.com`.
4. Nhấn **Add Custom Domain** $\rightarrow$ Nhập domain Rút gọn: `short.yourdomain.com`.
5. *Xong! Cloudflare sẽ tự động trỏ DNS và kích hoạt SSL HTTPS trong vòng 1 phút.*

---

## 3. Cách 2: Triển khai Tự Động qua GitHub Actions (CI/CD)

Dự án đã có sẵn file workflow `.github/workflows/deploy.yml`. Mỗi khi bạn `git push` lên nhánh `main` hoặc `master`, Worker sẽ tự động được build và deploy.

### 📌 Các bước cấu hình:
1. Đẩy mã nguồn lên kho chứa (Repository) GitHub của bạn.
2. Lấy Cloudflare API Token:
   - Truy cập **Cloudflare Dashboard** $\rightarrow$ **My Profile** $\rightarrow$ **API Tokens** $\rightarrow$ **Create Token**.
   - Chọn template **Edit Cloudflare Workers** $\rightarrow$ Tạo Token và lưu lại.
3. Lấy Cloudflare Account ID:
   - Truy cập **Workers & Pages** $\rightarrow$ Copy **Account ID** ở cột bên phải.
4. Cấu hình GitHub Secrets:
   - Vào GitHub Repo của bạn $\rightarrow$ **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions** $\rightarrow$ **New repository secret**.
   - Thêm 2 secret:
     - `CLOUDFLARE_API_TOKEN`: *(Dán Token vừa tạo)*
     - `CLOUDFLARE_ACCOUNT_ID`: *(Dán Account ID)*
5. Push code lên GitHub, kiểm tra tab **Actions** để xem tiến trình deploy tự động hoàn tất.

---

## 4. Cách 3: Triển khai qua Giao diện Web Cloudflare Dashboard

Nếu bạn muốn cấu hình 100% bằng chuột trên trình duyệt web:

### 🔹 Bước 1: Tạo D1 Database
1. Tại [Cloudflare Dashboard](https://dash.cloudflare.com/), vào **Storage & Databases** $\rightarrow$ **D1 SQL Database**.
2. Nhấn **Create database** $\rightarrow$ Đặt tên: `link_analytics` $\rightarrow$ Nhấn **Create**.
3. Vào database `link_analytics` $\rightarrow$ Chuyển sang tab **Console**.
4. Mở file `schema.sql`, copy toàn bộ nội dung dán vào Console và nhấn **Execute**.

### 🔹 Bước 2: Tạo R2 Bucket
1. Vào **R2 Object Storage** $\rightarrow$ Nhấn **Create bucket**.
2. Đặt tên: `og-images-bucket` $\rightarrow$ Nhấn **Create Bucket**.

### 🔹 Bước 3: Tạo Worker & Cấu hình Bindings
1. Vào **Workers & Pages** $\rightarrow$ **Create Application** $\rightarrow$ **Create Worker** $\rightarrow$ Đặt tên `snapog-worker` $\rightarrow$ **Deploy**.
2. Sau khi deploy bản mẫu, vào **Settings** của Worker:
   - **D1 Database Bindings**: Thêm binding với **Variable name** = `DB`, chọn database `link_analytics`.
   - **R2 Bucket Bindings**: Thêm binding với **Variable name** = `MY_R2_BUCKET`, chọn bucket `og-images-bucket`.
   - **Variables and Secrets**:
     - Thêm biến `ADMIN_DOMAIN`: giá trị `admin.yourdomain.com`
     - Thêm biến `SHORT_DOMAIN`: giá trị `short.yourdomain.com`
     - Thêm secret `ADMIN_KEY`: giá trị mật khẩu đăng nhập của bạn.
3. Gắn **Custom Domains** trong mục **Domains & Routes** cho cả 2 tên miền.
4. Sử dụng lệnh `wrangler deploy` từ máy tính hoặc đẩy qua GitHub Actions để đưa toàn bộ mã nguồn `src/` lên Worker.

---

## 5. Bảng Cấu Hình Biến Môi Trường & Bindings

| Loại Khai Báo | Tên Biến (Variable Name) | Giá Trị Yêu Cầu | Ghi Chú |
| :--- | :--- | :--- | :--- |
| **D1 Database Binding** | `DB` | `link_analytics` | Bắt buộc. Lưu trữ bảng `links` và `clicks`. |
| **R2 Bucket Binding** | `MY_R2_BUCKET` | `og-images-bucket` | Bắt buộc. Lưu trữ file ảnh Open Graph. |
| **Environment Variable** | `ADMIN_DOMAIN` | `admin.yourdomain.com` | Bắt buộc. Chỉ định domain mở Dashboard. |
| **Environment Variable** | `SHORT_DOMAIN` | `short.yourdomain.com` | Bắt buộc. Chỉ định domain rút gọn và bắt crawler. |
| **Secret (Encrypted)** | `ADMIN_KEY` | `Mật khẩu bí mật` | Bắt buộc. Dùng để đăng nhập xác thực trang quản trị. |
| **Environment Variable** | `R2_PUBLIC_URL` | *(Tùy chọn)* `https://cdn.yourdomain.com` | Nếu bạn dùng CDN riêng cho ảnh R2 thay vì qua Worker. |

---

## 6. Cấu Trúc Mã Nguồn Dự Án

```text
├── worker.js                  # Entry point chính cho Cloudflare Worker Production
├── server.js                  # Máy chủ Node.js Local Development & Live Preview
├── wrangler.toml              # Cấu hình Cloudflare Wrangler (D1, R2, Vars)
├── wrangler.jsonc             # Cấu hình Wrangler JSONC
├── schema.sql                 # Cấu trúc CSDL SQLite/D1 và chỉ mục tối ưu
├── .github/workflows/
│   └── deploy.yml             # Tự động hóa CI/CD Deploy với GitHub Actions
├── src/
│   ├── index.js               # Điểm vào Worker chính (Xử lý Fetch & Context)
│   ├── router.js              # Bộ định tuyến Router (Admin Domain vs Short Domain)
│   ├── config/
│   │   └── constants.js       # Hằng số cấu hình & Danh sách User-Agent Bot crawler MXH
│   ├── controllers/
│   │   ├── authController.js      # Xử lý Đăng nhập / Đăng xuất
│   │   ├── dashboardController.js # Render HTML Dashboard & Trang Analytics
│   │   ├── linkController.js      # CRUD link, upload ảnh và thống kê nhanh
│   │   ├── logController.js       # Phân trang và lọc lịch sử click
│   │   ├── imageController.js     # Phân phối ảnh từ Cloudflare R2
│   │   └── redirectController.js  # Phân loại Bot/Người thật & Chuyển hướng 302
│   ├── middlewares/
│   │   └── authMiddleware.js  # Xác thực Cookie / Bearer Token / URL Key
│   ├── services/
│   │   ├── linkService.js     # Thao tác CSDL bảng links (CRUD, UPSERT, Cleanup)
│   │   ├── clickService.js    # Ghi nhận Click & Thống kê Analytics (GMT+7)
│   │   └── r2StorageService.js# Tương tác kho lưu trữ Cloudflare R2
│   ├── utils/
│   │   ├── security.js        # Escape HTML, chống XSS, sinh chuỗi ngẫu nhiên
│   │   ├── time.js            # Định dạng và xử lý thời gian GMT+7
│   │   ├── uaParser.js        # Phân tích thiết bị, OS, trình duyệt & Bot
│   │   ├── cookie.js          # Xử lý Cookie xác thực đa môi trường
│   │   └── response.js        # Tạo phản hồi chuẩn JSON, HTML, Redirect, CORS
│   └── views/
│       ├── styles/baseStyles.js       # Hệ thống CSS Dark/Light Theme tối ưu
│       ├── components/progressList.js # Thành phần thanh biểu đồ phần trăm
│       ├── templates/ogMetaTemplate.js# Mẫu thẻ Meta Open Graph cho Bot MXH
│       └── pages/
│           ├── dashboardPage.js       # Giao diện Dashboard quản trị 3 tab
│           ├── analyticsPage.js       # Giao diện Báo cáo thống kê chi tiết
│           ├── loginPage.js           # Giao diện trang Đăng nhập bảo mật
│           └── forbiddenPage.js       # Giao diện trang báo lỗi 403/404/500
```

---

## 7. Kiểm Thử Sau Khi Triển Khai

Sau khi cấu hình xong, hãy thực hiện quy trình 4 bước kiểm thử để đảm bảo mọi tính năng hoạt động 100%:

### 1. Kiểm tra Trang Quản Trị (Dashboard):
- Truy cập `https://admin.yourdomain.com/`.
- Nhập `ADMIN_KEY` đã tạo và đăng nhập.
- Thử tạo một link rút gọn:
  - **Slug**: `test-link`
  - **URL Đích**: `https://vnexpress.net`
  - **Tiêu đề**: `Bài viết trải nghiệm SnapOG`
  - **Tải ảnh banner**: Chọn một ảnh từ máy tính (PNG/JPG/WebP).
- Nhấn **Lưu & Rút Gọn Link**.

### 2. Kiểm tra Hiển Thị Open Graph trên Facebook / Zalo / Telegram:
- Mở công cụ [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/).
- Nhập link rút gọn của bạn: `https://short.yourdomain.com/test-link`.
- Nhấn **Thu thập thông tin mới** (Scrape Again).
- 👉 **Kết quả chuẩn**: Facebook hiển thị đầy đủ hình ảnh banner cỡ lớn, tiêu đề, mô tả và tên thương hiệu (`og:site_name`).

### 3. Kiểm tra Chuyển Hướng Người Thật (Redirect):
- Mở link `https://short.yourdomain.com/test-link` trên trình duyệt điện thoại hoặc máy tính.
- 👉 **Kết quả chuẩn**: Bạn được chuyển hướng ngay lập tức (HTTP 302) sang trang đích `https://vnexpress.net`.

### 4. Kiểm tra Báo Cáo Thống Kê (Analytics & Logs):
- Mở lại trang quản trị `https://admin.yourdomain.com/stats?slug=test-link`.
- 👉 **Kết quả chuẩn**: Hệ thống ghi nhận lượt click từ thiết bị của bạn vào mục **👤 Người thật**, và lượt cào của Facebook Debugger vào mục **🤖 Bot / Crawler** với đầy đủ IP, thiết bị, hệ điều hành, thành phố và quốc gia.

---

## 8. Tối Ưu Bảo Mật & Chống Spam / DDoS

1. **Bảo vệ Trang Quản trị với Cloudflare Zero Trust (Khuyên dùng)**:
   - Vào **Zero Trust** $\rightarrow$ **Access** $\rightarrow$ **Applications**.
   - Thêm chính sách bảo vệ cho `admin.yourdomain.com` (chỉ cho phép đăng nhập qua Email OTP hoặc tài khoản Google/GitHub của bạn).
2. **Bật Bot Fight Mode**:
   - Vào domain `short.yourdomain.com` $\rightarrow$ **Security** $\rightarrow$ **Bots** $\rightarrow$ Bật **Bot Fight Mode**.
3. **Giới Hạn Tần Suất Truy Cập (Rate Limiting)**:
   - Vào **Security** $\rightarrow$ **WAF** $\rightarrow$ **Rate limiting rules**.
   - Tạo quy tắc: Giới hạn tối đa **50 requests / 10 giây / IP** trên domain `short.yourdomain.com` để ngăn chặn spam click ảo.

---

## 9. Xử Lý Sự Cố Thường Gặp (Troubleshooting / FAQ)

### ❓ 1. Tại sao chia sẻ lên Facebook/Zalo không hiện ảnh banner?
- **Nguyên nhân 1**: Facebook đã lưu cache dữ liệu cũ của link.
  - **Khắc phục**: Dán link vào [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) và bấm nút **Scrape Again**.
- **Nguyên nhân 2**: Thiếu R2 Bucket Binding (`MY_R2_BUCKET`).
  - **Khắc phục**: Kiểm tra tab **Settings > Variables** của Worker xem tên biến đã đặt chính xác là `MY_R2_BUCKET` và trỏ đúng bucket hay chưa.

### ❓ 2. Báo lỗi `Database binding không hợp lệ` hoặc `db.prepare is not a function`?
- **Nguyên nhân**: Chưa thêm D1 Database Binding hoặc đặt sai tên biến.
- **Khắc phục**: Vào **Settings > Variables > D1 Database Bindings**, chắc chắn rằng tên biến là `DB` (viết hoa) và liên kết tới database `link_analytics`.

### ❓ 3. Truy cập vào domain Admin bị chuyển hướng sai hoặc không mở được Dashboard?
- **Nguyên nhân**: Giá trị biến môi trường `ADMIN_DOMAIN` không khớp với tên miền thực tế.
- **Khắc phục**: Kiểm tra biến `ADMIN_DOMAIN` trong `wrangler.toml` hoặc Cloudflare Dashboard (ví dụ: `admin.yourdomain.com`, **không** chứa tiền tố `https://` hay dấu `/` ở cuối).

### ❓ 4. Khi xóa một link, ảnh và nhật ký click có được dọn dẹp không?
- **Hoàn toàn có**: Khi xóa link từ Dashboard, hệ thống tự động:
  1. Xóa file ảnh vật lý tương ứng trên **Cloudflare R2 Bucket**.
  2. Xóa toàn bộ dữ liệu nhật ký click của link trong bảng **`clicks`** trên D1.
  3. Xóa bản ghi link trong bảng **`links`** trên D1.

---

🎉 **Hệ thống SnapOG của bạn đã sẵn sàng hoạt động với hiệu năng và độ ổn định cao nhất trên nền tảng Cloudflare Serverless!**
