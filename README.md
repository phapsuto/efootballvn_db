# eFootball Hub VN — Cơ sở dữ liệu & Công cụ chuyên sâu

Chào mừng bạn đến với **eFootball Hub VN**, nền tảng cơ sở dữ liệu chuyên sâu, giả lập tăng điểm (build), so sánh cầu thủ và xây dựng đội hình chiến thuật chuyên nghiệp tối ưu dành cho cộng đồng eFootball Việt Nam.

Dự án được xây dựng trên mô hình Full-stack hiện đại kết hợp sức mạnh của **Next.js 15**, **Express.js**, **MongoDB**, và hệ thống tự động đồng bộ (Scraper) thông minh hoạt động mượt mà cả trên Máy tính và Thiết bị di động.

---

## 🚀 Tính Năng Nổi Bật

### 1. Song Ngữ (Bilingual Mode) Chuyên Sâu
Tất cả các thông số chuyên sâu về cầu thủ được thiết lập song ngữ dựa trên thuật ngữ chuẩn của cộng đồng eFootball Việt Nam, đồng thời giữ nguyên hoàn toàn các tên riêng (tên cầu thủ, huấn luyện viên, câu lạc bộ, giải đấu) đúng như nguyên bản:
* **Vị trí (Positions)**: `CF (Tiền đạo cắm)`, `AMF (Tiền vệ tấn công)`, `DMF (Tiền vệ phòng ngự)`, `CB (Trung vệ)`, `LB (Hậu vệ cánh trái)`, `RB (Hậu vệ cánh phải)`,...
* **Phong cách chơi (Playstyles)**: `Goal Poacher (Kẻ săn bàn)`, `Box-to-Box (Tiền vệ con thoi)`, `Anchor Man (Tiền vệ mỏ neo)`, `Creative Playmaker (Nhạc trưởng sáng tạo)`, `Fox in the Box (Sát thủ vòng cấm)`,...
* **Kỹ năng cầu thủ (Skills & COM Playstyles)**: `Double Touch (Gạt bóng hai chân)`, `Marseille Turn (Xoay compa)`, `One-touch Pass (Chuyền một chạm)`, `First Time Shot (Dứt điểm một chạm)`, `Acrobatic Finishing (Móc bóng / Vô-lê)`,...
* **Chỉ số thuộc tính (Stats/Attributes)**: `Attacking Prowess (Nhận thức tấn công)`, `Dribbling (Rê bóng)`, `Kicking Power (Lực sút)`, `Physical Contact (Tranh chấp tì đè)`, `GK Reflexes (Phản xạ thủ môn)`,...
* **Bản đồ tăng điểm (Build Engine)**: Các danh mục nâng cấp chỉ số hiển thị song ngữ dễ hiểu: `Lower Body Strength (Sức mạnh thân dưới / Lực chân)`, `Aerial Strength (Không chiến / Tranh chấp)`, `Defending (Phòng ngự)`, `GK 1 (Phản xạ / Bắt bóng)`,...

### 2. Trình Giả Lập Tăng Điểm (Player Build Engine)
* Tự động tính toán điểm thuộc tính của cầu thủ theo cấp độ (Level) từ 1 đến Cấp tối đa (Max Level).
* Hỗ trợ gán điểm tăng cường (Allocations) thủ công hoặc sử dụng các bộ tối ưu có sẵn nhanh chóng (**Smart**, **Attack**, **Creative**, **Defense**, **GK**).
* Tự động đồng bộ và lưu trữ các cấu hình nâng điểm (Builds) cá nhân trên trình duyệt người dùng hoặc chia sẻ công khai lên **Cộng đồng** để cùng thảo luận.

### 3. Công Cụ So Sánh Đối Đầu (Player Comparison Engine)
* So sánh trực quan thông số thuộc tính của hai cầu thủ bất kỳ.
* Hỗ trợ tùy chỉnh cấp độ (Level) riêng biệt, tình trạng phong độ (Condition: A, B, C, D, E) và xem bảng chênh lệch chỉ số (Diff value) trực quan.

### 4. Công Cụ Xây Dựng Đội Hình (Lineup Builder)
* Thiết lập sơ đồ chiến thuật tùy chọn (`4-3-3`, `4-2-3-1`, `4-4-2`, `3-4-3`, `3-5-2`, `5-2-1-2`).
* Chọn huấn luyện viên (HLV) và tính toán chính xác chỉ số tổng quan (OVR), điểm gắn kết lối chơi (Tactical Boosts) dựa trên chỉ số kỹ năng của HLV.

### 5. Từ Điển 73+ Tính Năng (Skills & Playstyles) Chuyên Sâu (`/tinh-nang`)
* Tích hợp kho tri thức từ điển khổng lồ giải thích cặn kẽ 73+ kỹ năng cầu thủ (Double Touch, One-touch Pass, Blitz Curler,...) và phong cách chơi (Goal Poacher, Build Up, Anchor Man,...).
* Mỗi mục tính năng được biên soạn công phu bằng **Gemini AI** dài 150-300 từ bao gồm: dịch nghĩa chuẩn tiếng Việt, phân tích cơ chế hoạt động ẩn trên sân, **nút bấm tay cầm PlayStation/Xbox chi tiết để kích hoạt** và mẹo chơi chuyên nghiệp (Pro Tips).
* Pop-up hiển thị mượt mà trên cả máy tính và điện thoại.

### 6. Cẩm Nang Học Viện eFootball Cao Cấp (`/cam-nang`)
* Bộ 8 cẩm nang chuyên sâu giải thích chi tiết các thuật ngữ cốt lõi và kỹ thuật điều khiển meta của game: bẫy chỉ số OVR, Trạng thái mũi tên phong độ (Player Form), cơ chế ổn định ẩn (Conditioning Consistency), cách tăng Progression Points thủ công (Manual Allocation), kỹ thuật sút lực mạnh (Stunning Shot), cướp bóng bằng L2/LT (Match-up Defense), **kỹ thuật tối thượng Super Cancel (R1+R2 / RB+RT)** và bứt tốc đẩy bóng Sharp Touch.
* Tích hợp bộ lọc tab phân loại mượt mà và thanh **Tìm kiếm thời gian thực (Live Search)** hiển thị tức thì. Giao diện xem dạng **Glassmorphic Overlay Modal** hiện đại và lôi cuốn.

---

## 🛠️ Kiến Trúc Hệ Thống & Công Nghệ

Dự án hoạt động theo cấu trúc Full-stack phân tách rõ ràng:
* **Frontend Web App (`/next-app`)**: 
  - Framework: **Next.js 15 (App Router)**, React 18, TypeScript.
  - Styling: **Tailwind CSS v3**, Radix UI primitives.
  - Iconography: **Lucide React** (loại bỏ hoàn toàn các lỗi font biểu tượng bị hiển thị dạng văn bản trước đây).
* **Express.js API Engine (`/src`)**:
  - Máy chủ trung gian cung cấp các Endpoint API tốc độ cao cho ứng dụng frontend.
  - Tích hợp hệ thống giới hạn tần suất yêu cầu (**API Rate Limiting**) để đảm bảo an ninh mạng.
* **Stealth Scraper Service (`/src/scraper`)**:
  - Dựa trên **Playwright** với chiến thuật Stealth (User-Agent rotation, độ trễ ngẫu nhiên 5-12s, chống phát hiện bot).
  - Tự động cào dữ liệu mới nhất từ eFHUB và nạp trực tiếp vào cơ sở dữ liệu.
* **Database & Scheduler**:
  - Cơ sở dữ liệu: **MongoDB** (Lưu trữ ổn định, truy vấn nhanh với cơ chế chỉ mục thông minh).
  - Cron Scheduler: Tự động chạy cào dữ liệu theo giờ Việt Nam (`Asia/Ho_Chi_Minh`) phân tách nhịp giờ thường (mỗi 1 tiếng) và giờ cao điểm (mỗi 30 phút tối thứ Hai/thứ Năm).

---

## 📁 Cấu Trúc Thư Mục

```text
.
├── src/                               # 🟢 Express.js API & Scraper Backend
│   ├── config/                        # Cấu hình Database & Biến môi trường
│   ├── controllers/                   # Xử lý các nghiệp vụ (Players, Managers)
│   ├── middleware/                    # Rate Limiting & Bảo mật API
│   ├── models/                        # Lược đồ MongoDB Mongoose (Player, Manager, Pack)
│   ├── routes/                        # Định tuyến các endpoint API
│   ├── scraper/                       # Playwright stealth scraper engine
│   ├── services/                      # Nghiệp vụ xử lý dữ liệu và logic game
│   ├── jobs/                          # Cron scheduler đồng bộ định kỳ
│   └── server.js                      # Điểm chạy máy chủ Express API (Port 3000)
│
├── next-app/                          # 🔵 Next.js 15 Frontend Web App
│   ├── app/                           # Cấu trúc App Router của Next.js
│   │   ├── cau-thu/                   # Trang danh sách & chi tiết cầu thủ
│   │   ├── so-sanh/                   # Trang so sánh 2 cầu thủ
│   │   ├── doi-hinh/                  # Trang xây dựng đội hình chiến thuật
│   │   ├── cong-cu/                   # Trang trung tâm công cụ
│   │   └── cam-nang/                  # Thư viện cẩm nang và hướng dẫn
│   ├── components/                    # Các thành phần giao diện (UI Components)
│   ├── lib/                           # Game logic, MongoDB client & Translations
│   │   └── utils/
│   │       └── translations.ts        # 🔴 Từ điển song ngữ Anh-Việt chuẩn
│   ├── tests/                         # Bộ kiểm thử Parity và snapshot
│   └── package.json                   # Cấu hình Next.js (Port 3001)
│
├── scraped-output/                    # Dữ liệu hạt giống (Seed JSON) & fallback
└── mongodb-local/                     # MongoDB nhúng cục bộ cho macOS
```

---

## 💻 Hướng Dẫn Cài Đặt & Chạy Dự Án

### 📋 Yêu cầu hệ thống
* **Node.js** >= 18.x
* **npm** >= 9.x
* **macOS** (hoặc Linux/Windows với MongoDB tương ứng)

---

### Bước 1: Cài đặt Dependencies
Chạy lệnh cài đặt từ thư mục gốc của dự án:
```bash
# Cài đặt cho Express Backend
npm install

# Di chuyển vào next-app và cài đặt cho Next.js Frontend
cd next-app
npm install
```

### Bước 2: Cấu hình Biến môi trường (`.env`)
Tạo tệp `.env` tại thư mục gốc từ mẫu `.env.example`:
```bash
cp .env.example .env
```
Mở tệp `.env` và thiết lập kết nối:
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/efootball_vn
DB_REQUIRED=true
NEXT_APP_PORT=3001
```

---

### Bước 3: Khởi chạy MongoDB Cục bộ (macOS)
Dự án được tích hợp sẵn MongoDB cục bộ trong thư mục `mongodb-local/`. Khởi chạy máy chủ cơ sở dữ liệu:
```bash
# Từ thư mục gốc của dự án
./mongodb-local/server/bin/mongod --dbpath ./mongodb-local/data
```
Máy chủ MongoDB sẽ chạy ở chế độ nền trên cổng mặc định `27017`.

---

### Bước 4: Tạo Chỉ Mục & Nhập Dữ Liệu Hạt Giống (Seeding)
Sau khi MongoDB đã hoạt động, chúng ta khởi tạo cấu trúc và nạp dữ liệu:

```bash
# Di chuyển vào thư mục next-app
cd next-app

# 1. Khởi tạo chỉ mục tìm kiếm thông minh
npm run db:indexes

# 2. Nhập dữ liệu cầu thủ, HLV, packs mẫu vào MongoDB
npm run import:data
```
*Hệ thống sẽ nạp trực tiếp hơn 40 cầu thủ hàng đầu thế giới (Lewandowski, Rodri, Haaland, Bellingham,...), các gói thẻ packs, danh sách huấn luyện viên mẫu và bảng xếp hạng hoạt động.*

---

### Bước 5: Khởi chạy hệ thống Server

Chúng ta khởi động song song 2 dịch vụ để chạy toàn bộ hệ thống:

1. **Khởi chạy Express API Backend (Port 3000)**:
   ```bash
   # Từ thư mục gốc của dự án
   npm run dev
   ```
   *Máy chủ sẽ kết nối trực tiếp đến MongoDB cục bộ tại địa chỉ `mongodb://127.0.0.1:27017/efootball_vn`.*

2. **Khởi chạy Next.js Frontend (Port 3001)**:
   ```bash
   # Mở một terminal mới, di chuyển vào thư mục next-app
   cd next-app
   npm run dev
   ```
Mở trình duyệt web của bạn và truy cập: **`http://localhost:3001`**.

---

## 🧪 Kiểm Thử & Kiểm Định Chất Lượng

Dự án trang bị một bộ kiểm tra chất lượng tự động nghiêm ngặt tại thư mục `next-app/`. Để kích hoạt toàn bộ bài test và kiểm định chất lượng tĩnh trước khi đóng gói production:

```bash
cd next-app
npm run check:quality
```

Quy trình tự động thực hiện 5 bước chất lượng vàng:
1. **ESLint Linting**: Phân tích cú pháp JavaScript/TypeScript để đảm bảo không có lỗi cảnh báo.
2. **Parity Tests**: Chạy 7/7 bài kiểm thử độ khớp thông số giữa thuật toán Next.js và Express.
3. **Localization Audit**: Kiểm tra và tối ưu hóa 64 tệp cấu hình dịch thuật bản địa hóa.
4. **Stitch Control Parity**: Đảm bảo 100/100 các thành phần điều hướng đều được map sang route thật.
5. **Next.js Production Build**: Thực thi đóng gói thử nghiệm toàn bộ 30 route để đảm bảo không có lỗi Type-check hay Runtime.

---

## 📈 Giám Sát Cập Nhật (Stealth Scraper Sync)
* **Chạy cào thử nghiệm (Dry Run)**:
  ```bash
  # Cào thủ công 40 cầu thủ mới nhất từ eFHUB
  npm run sync:once
  ```
* **Chạy Scheduler đồng bộ nền**:
  ```bash
  # Kích hoạt hệ thống cron tự động kiểm tra cập nhật liên tục
  npm run sync:cron
  ```
  Nhịp cào được cấu hình tối ưu để tránh bị nhà cung cấp chặn IP và bám sát múi giờ Việt Nam.

---

## 🤝 Bản Quyền & Phát Triển
Dự án được tối ưu hóa cho cộng đồng eFootball Việt Nam bởi **eFootball Hub VN**.
Mọi thông tin chi tiết và phản hồi, vui lòng gửi yêu cầu hỗ trợ qua mục **Hỗ trợ** trên ứng dụng web!
