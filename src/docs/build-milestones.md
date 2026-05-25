# Build Theo Từng Phần Nhỏ

Mục tiêu: luôn giữ trạng thái "chạy được" sau mỗi phần.

## M0 - Boot Được Dự Án
- [x] `npm install`
- [x] `cp .env.example .env`
- [x] Cho phép chạy không cần Mongo bằng `DB_REQUIRED=false`
- [x] `GET /api/health` trả trạng thái DB

Kết quả mong đợi:
- Chạy `npm run dev` là vào được web ngay, kể cả khi chưa có Mongo.

## M1 - Dữ Liệu Có Thể Hiển Thị Ngay
- [x] Thêm mock data cho players/managers
- [x] API fallback mock khi DB chưa kết nối:
  - `GET /api/players`
  - `GET /api/players/:id`
  - `GET /api/managers`

Kết quả mong đợi:
- `/cau-thu`, `/cau-thu/:id`, `/hlv` có dữ liệu hiển thị ngay.

## M2 - Kích Hoạt Frontend Danh Sách
- [x] `/cau-thu` bind động từ API (`players-list.js`)
- [x] `/hlv` bind động từ API (`managers-list.js`)
- [x] Link điều hướng chính giữa các trang hoạt động

Kết quả mong đợi:
- Lọc/tìm kiếm cơ bản hoạt động trên danh sách.

## M3 - Chi Tiết Cầu Thủ (Đang Có)
- [x] `/cau-thu/:id` lấy dữ liệu từ `GET /api/players/:id`
- [x] Level slider cập nhật chỉ số theo level
- [x] Condition arrows cập nhật theo form

## M4 - Dữ Liệu Thật Từ eFHUB
- [x] Scraper Playwright + stealth delay/UA rotation
- [x] Parse DOM hiện tại + payload `__next_f`
- [ ] Chạy scrape thật định kỳ trên máy có Node + Mongo

## M5 - Ổn Định Hoá Cho Production
- [ ] Validation input query/filter
- [ ] Caching API hot endpoints
- [ ] Logging lỗi scraper/API chuẩn hóa
- [ ] Monitoring cơ bản (health + scrape summary)

## Lệnh Chạy Nhanh
```bash
npm run dev
```

```bash
curl http://localhost:3000/api/health
```

```bash
npm run scrape:once -- 40
```
