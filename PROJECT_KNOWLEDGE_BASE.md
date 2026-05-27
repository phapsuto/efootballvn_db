# 🧠 DỰ ÁN eFOOTBALL.VN - BẢN ĐỒ TRI THỨC VÀ KHỞI CHẠY (PROJECT KNOWLEDGE BASE)

> **Dành cho Trợ lý AI mới:** Hãy đọc kỹ tài liệu này trước tiên khi bắt đầu phiên làm việc. Đây là tài liệu lưu trữ toàn bộ trạng thái, cấu trúc, cơ sở dữ liệu và các tính năng hiện tại của dự án eFootball.vn để bạn có thể tiếp quản và hỗ trợ nhà phát triển một cách chính xác và hiệu quả nhất mà không cần hỏi lại các thông tin cơ bản.

---

## 📂 1. TỔNG QUAN VÀ CẤU TRÚC THƯ MỤC DỰ ÁN

Dự án eFootball.vn là một cổng thông tin và bộ công cụ tối ưu dành cho cộng đồng người chơi eFootball tại Việt Nam. Dự án được chia làm 2 phần chính:

### A. Express Backend & Scraper (`/src`)
*   **Nhiệm vụ:** Chịu trách nhiệm chạy crawler (cào dữ liệu từ eFHUB), cung cấp API thô cho các tác vụ nặng, và quản lý các tác vụ đồng bộ nền (cron jobs).
*   **Cổng hoạt động:** `http://localhost:3000`
*   **Điểm khởi chạy:** `src/server.js` (hoặc chạy qua lệnh `node src/server.js` hay `npm run start`).
*   **Các thư mục con quan trọng:**
    *   `src/scraper/`: Chứa mã nguồn cào dữ liệu cầu thủ và huấn luyện viên từ eFHUB (`efhubScraper.js`).
    *   `src/jobs/`: Định nghĩa các tác vụ định kỳ (sync/scrape cron jobs).
    *   `src/models/` & `src/controllers/`: Định nghĩa schema Mongoose (cho MongoDB) và logic điều hướng API backend.
    *   `scraped-output/`: Thư mục lưu trữ dữ liệu cào thô định dạng JSON (`players.latest.json`, `player-sample.json`). Thư mục `bootstrap/` chứa dữ liệu seed ban đầu cho MongoDB.

### B. Next.js 15 App Router Frontend (`/next-app`)
*   **Nhiệm vụ:** Giao diện người dùng cao cấp, tích hợp đầy đủ các công cụ phân tích chỉ số, so sánh đối đầu, xây dựng đội hình, từ điển kỹ năng và góc cẩm nang học viện.
*   **Cổng hoạt động:** `http://localhost:3001`
*   **Đặc điểm nổi bật:** Tích hợp thiết kế kính mờ (Glassmorphism) cao cấp, bám sát bộ token Stitch thiết kế thể thao hiện đại, tối ưu hóa SEO và tốc độ tải trang cực nhanh.
*   **Các thư mục con quan trọng:**
    *   `next-app/app/`: Chứa các trang giao diện (App Router). Ví dụ: `/cau-thu` (danh sách), `/cau-thu/[id]` (chi tiết), `/hlv` (huấn luyện viên), `/doi-hinh` (dựng đội hình), `/cam-nang` (góc học viện & lối chơi).
    *   `next-app/components/`: Các component tái sử dụng cao cấp (ví dụ: `guides/guides-client.tsx`, `glossary/glossary-library-client.tsx`, `lineup/lineup-builder-client.tsx`, `layout/site-header.tsx`).
    *   `next-app/lib/data/repository.ts`: Lớp trung gian chịu trách nhiệm đọc/ghi dữ liệu. **Cực kỳ quan trọng:** Repository tự động phát hiện kết nối MongoDB cục bộ để truy vấn dữ liệu thực, nếu MongoDB không khả dụng sẽ tự động chuyển sang đọc mock data từ các tệp JSON cục bộ để đảm bảo dự án không bị crash!
    *   `next-app/lib/gameplay/`: Chứa lõi tính toán chỉ số cầu thủ lên cấp tối đa (`player-calculation.ts`), độ ảnh hưởng của HLV (`manager-influence.ts`), và hiệu suất đội hình (`lineup-metrics.ts`).
    *   `next-app/public/images/playstyles/`: Nơi lưu trữ 5 sơ đồ chiến thuật lối chơi đồng đội chuẩn meta Konami dạng ảnh vector tối màu cao cấp (`possession_game.png`, `quick_counter.png`, `long_ball_counter.png`, `out_wide.png`, `long_ball.png`).

---

## 🗄️ 2. HỆ THỐNG CƠ SỞ DỮ LIỆU (MONGODB CỤC BỘ)

*   **Chuỗi kết nối (Connection URI):** `mongodb://127.0.0.1:27017/efootball_vn`
*   **Đường dẫn thư mục MongoDB nội bộ:** `mongodb-local/`
    *   *Lệnh khởi chạy MongoDB ngầm trên macOS:*
        `./mongodb-local/server/bin/mongod --dbpath ./mongodb-local/data`
*   **Các Collections chính trong Database:**
    *   `players`: Danh sách cầu thủ thực tế (đã seed 40 siêu sao thế giới).
    *   `managers`: Danh sách huấn luyện viên (đã seed 3 HLV nổi bật nhất).
    *   `packs`: Các gói thẻ cầu thủ sự kiện.
    *   `guides`: Nơi lưu trữ các bài viết cẩm nang học viện và phân tích meta.
    *   `player_builds`: Lưu các công thức nâng chỉ số cầu thủ do người dùng xây dựng.
    *   `community_profiles` & `community_follows`: Quản lý hồ sơ người dùng ẩn danh và liên kết theo dõi chéo.

---

## ✨ 3. CÁC TÍNH NĂNG NỔI BẬT ĐÃ ĐƯỢC TÍCH HỢP HOÀN THIỆN

1.  **Từ điển kỹ năng & Chỉ số chuyên sâu (`/tinh-nang`):** Giải thích chi tiết 73+ kỹ năng (Double Touch, Blitz Curler, One-touch Pass) kèm phong cách chơi (Goal Poacher, Anchorman).
2.  **Cẩm nang Lối chơi & Sơ đồ Chiến thuật Meta (`/cam-nang`):**
    *   Phân tích chi tiết 5 phong cách chơi đồng đội (Possession Game, Quick Counter, Long Ball Counter, Out Wide, Long Ball) kèm theo các sơ đồ chiến thuật có đồ họa neon bóng đá cao cấp bám sát meta eFootball 2026 của Konami.
3.  **Công cụ Đăng bài dành cho Admin (Admin Guide Panel):**
    *   Tích hợp trực tiếp tại giao diện `/cam-nang` cho các tài khoản có quyền Admin.
    *   Cho phép viết bài mới gồm: Tiêu đề, Tóm tắt, Nội dung chi tiết, Phân loại (Chỉ số & Thuật ngữ, Lối chơi đồng đội, Phân tích Meta), chọn ảnh Sơ đồ minh họa có sẵn hoặc nhập link ảnh.
    *   Khi Admin nhấn "Xuất bản bài viết", bài viết sẽ lưu trực tiếp vào MongoDB và hiển thị tức thì trên cả trang `/cam-nang` lẫn mục "Cập nhật mới nhất" ngoài **Trang chủ (`/`)**.
4.  **Hệ thống phiên ẩn danh bảo mật (`efvn_viewer`):**
    *   Mã hóa cookie bằng HMAC SHA-256 giúp lưu trữ và bảo vệ các tương tác nâng chỉ số cầu thủ (Builds) và theo dõi cộng đồng (Follows) trọn đời mà không cần đăng nhập phức tạp.

---

## 🛠️ 4. HƯỚNG DẪN CHẠY MÔI TRƯỜNG & KIỂM TRA

Mỗi khi muốn khởi chạy toàn bộ dự án hoặc kiểm thử nhanh, hãy thực hiện các lệnh sau:

### Khởi chạy Database MongoDB
```bash
# Đứng tại thư mục gốc dự án
./mongodb-local/server/bin/mongod --dbpath ./mongodb-local/data
```

### Khởi chạy Backend Server (Port 3000)
```bash
# Đứng tại thư mục gốc dự án
node src/server.js
```

### Khởi chạy Next.js Frontend (Port 3001)
```bash
# Đứng tại thư mục next-app
cd next-app
PORT=3001 npm run dev
```

### Kiểm tra build sản phẩm (Không lỗi Type/Linter)
```bash
# Đứng tại thư mục next-app
npm run build
```
*(Hiện tại bản build Next.js đã được cấu hình và kiểm thử thành công 100% không có bất kỳ lỗi biên dịch hay cảnh báo linter nào chặn lại!)*

---

## 🔄 5. LỊCH SỬ FIX CÁC LỖI QUAN TRỌNG GẦN ĐÂY

Nếu gặp các hiện tượng lạ sau, đây là cách chúng tôi đã sửa và bạn cần ghi nhớ:

1.  **Lỗi trang hiển thị chữ thô (font Times New Roman, mất hết CSS):**
    *   *Nguyên nhân:* Do xung đột cache Next.js (`.next/`) giữa bản build production tĩnh và máy chủ dev server.
    *   *Cách sửa:* Xóa thư mục cache `.next` (`rm -rf next-app/.next`) và khởi động lại dev server, giao diện kính mờ và CSS Tailwind sẽ lập tức hoạt động lại hoàn hảo.
2.  **Lỗi biên dịch TypeScript ở `latestGuides.map`:**
    *   *Nguyên nhân:* Tham số `guide` trong vòng lặp map ở trang chủ `page.tsx` bị thiếu định dạng type cụ thể do kết quả `JSON.parse(JSON.stringify())` trả về kiểu `any`.
    *   *Cách sửa:* Đã import chính xác `type Guide` từ `@/lib/data/repository` và ép kiểu rõ ràng cho tham số `(guide: Guide)` giúp Next.js build thông qua 100%.
3.  **Lỗi serialization MongoDB Object IDs:**
    *   *Nguyên nhân:* Next.js App Router chặn việc truyền các đối tượng MongoDB Document phức tạp có chứa kiểu dữ liệu `_id` từ Server Component sang Client Component.
    *   *Cách sửa:* Đã bọc dữ liệu trả về từ repository qua lớp lọc phẳng `JSON.parse(JSON.stringify(guides))` để loại bỏ hoàn toàn các thuộc tính phi-nguyên-thủy (non-serializable).

---

## 🚀 6. HƯỚNG PHÁT TRIỂN TIẾP THEO CHO AI MỚI

Khi bạn (Trợ lý AI mới) tiếp quản dự án dưới tài khoản Google mới của anh To, hãy tập trung vào các hạng mục sau:
1.  **Hoàn thiện Parity UI:** Tiếp tục chuyển đổi các trang còn lại theo quy tắc token trong `MIGRATION_PLAN.md` (không dùng border 1px, dùng radius card nhỏ, áp dụng hiệu ứng `.stitch-glass` cao cấp).
2.  **Cải tiến hệ thống Scraper:** Tích hợp cơ chế tự động chạy cron job cào cầu thủ mới từ eFHUB mỗi khi Konami cập nhật Live Update vào thứ Năm hàng tuần.
3.  **Mở rộng bộ tính toán chỉ số:** Bổ sung tính toán chi tiết cho các thẻ cầu thủ đặc biệt có chỉ số tăng cường (Booster Cards) dựa trên các điều kiện kích hoạt booster khác nhau.

**Hãy làm việc hết mình để đưa eFootball.vn trở thành ứng dụng số 1 cho game thủ Việt Nam!**
