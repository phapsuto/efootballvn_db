# eFootball.vn Next App

Stack: Next.js (App Router) + Tailwind CSS + shadcn/ui.

## Run

1. Install Node.js 20+
2. Install dependencies:

```bash
npm install
```

3. (Recommended) setup env:

```bash
cp .env.example .env.local
```

4. Start dev server:

```bash
npm run dev
```

5. Open:
- http://localhost:3000/
- http://localhost:3000/cau-thu
- http://localhost:3000/cau-thu/88041460859805
- http://localhost:3000/so-sanh
- http://localhost:3000/hlv
- http://localhost:3000/doi-hinh
- http://localhost:3000/packs
- http://localhost:3000/cam-nang
- http://localhost:3000/tinh-nang
- http://localhost:3000/thong-bao
- http://localhost:3000/ho-so
- http://localhost:3000/phan-tich
- http://localhost:3000/chuyen-nhuong
- http://localhost:3000/api/health

## Notes

- If `MONGODB_URI` is available, `GET /api/players` and `GET /api/managers` read real MongoDB data.
- If MongoDB is unavailable, API auto-fallbacks to mock data in `lib/data`.
- API routes already exist:
  - `GET /api/players`
  - `GET /api/players/:id`
  - `GET /api/players/:id/calculation`
  - `GET /api/players/:id/builds`
  - `POST /api/players/:id/builds`
  - `PATCH /api/players/:id/builds/:buildId`
  - `DELETE /api/players/:id/builds/:buildId`
  - `GET /api/managers`
  - `GET /api/managers/:id`
  - `GET /api/packs`
  - `GET /api/packs/:id`
  - `GET /api/community/profiles`
  - `GET /api/community/profiles/:id`
  - `POST /api/community/profiles/:id/follow`
  - `DELETE /api/community/profiles/:id/follow`
  - `GET /api/league/rankings`
  - `GET /api/league/rankings/:id`
- Query params are validated/sanitized in `lib/api/query.ts` before accessing repository logic.
- Basic rate limiting is enabled for `/api/*` via `middleware.ts`.
- Công thức tính level/build/condition/manager được gom vào `lib/gameplay/player-calculation.ts` để frontend và API dùng chung một logic.
- `GET /api/players` hỗ trợ `sortBy`: `overall_desc`, `overall_asc`, `name_asc`, `name_desc`, `updated_desc`.
- `GET /api/players` hỗ trợ thêm filter: `nationality`, `club`, `foot`, `minHeight`, `maxHeight`.
- `GET /api/managers` hỗ trợ thêm filter/sort: `nationality`, `minStyleProficiency`, `sortBy` (`style_desc`, `style_asc`, `name_asc`, `name_desc`, `team_asc`, `team_desc`, `updated_desc`).
- `GET /api/community/profiles` hỗ trợ `country`, `sortBy` (`tab_default`, `builds_desc`, `followers_desc`, `following_desc`, `name_asc`, `name_desc`) và tự suy ra phiên người dùng ẩn danh từ cookie server-issued để trả về trạng thái `isFollowing`.
- `GET /api/community/profiles/:id` tự suy ra phiên người dùng ẩn danh từ cookie server-issued để trả về trạng thái follow theo user hiện tại.
- `GET /api/league/rankings` hỗ trợ `q` và `sortBy` (`points_desc`, `points_asc`, `members_desc`, `members_asc`, `updated_desc`, `name_asc`, `name_desc`).
- Trang HLV có route chi tiết động: `/hlv/:id`.
- Trang Community có route chi tiết động: `/community/:id`.
- Trang Rankings có route chi tiết động: `/tournaments/:id`.
- Rankings đã có hiển thị `biến động 24h` (điểm + thứ hạng) và lịch sử điểm gần nhất ở list/detail.
- Community và Rankings đã có phân trang client (nút `Trang Trước/Trang Sau`) dựa trên `meta.totalPages`.
- Từ trang chi tiết HLV, nút `Vào Đội Hình` sẽ deep-link kèm `managerId` và `formation` sang `/doi-hinh`.
- Lineup Builder có thêm action `Gợi Ý Theo HLV` (dùng top playstyle của HLV để auto-gợi ý slot trống) và thêm `Style Fit` để tính chemistry sát gameplay hơn.
- Manager influence đã chuẩn hoá theo engine chung (style tier + role affinity + fit score) cho cả projection cầu thủ và map vị trí.
- Team metrics lineup đã chuyển sang gameplay engine chung (`lib/gameplay/lineup-metrics.ts`) với các chỉ số `chemistry`, `style fit`, `tactical fit`, `balance`.
- Player detail có thêm preset progression build (`Max Smart`, `Max Attack`, `Max Creative`, `Max Defense`, `Max GK`) và hiển thị được các nhóm dữ liệu nâng cao nếu có trong DB: `Player Info`, `Additional Skills`, `Com Playing Styles`, `Player Model`, `Physics`, `Other Stats`.
- Các endpoint nóng có cache TTL in-memory (`lib/api/response-cache.ts`) và trả header `X-Cache: HIT|MISS`.
- `GET /api/health` có thêm thống kê cache để theo dõi tắc nghẽn API.
- `GET /api/health` trả thêm thống kê collection `playerBuilds` và `communityFollows` khi MongoDB sẵn sàng.
- `GET /api/health` trả thêm `pipeline` để theo dõi `scrape-status`, `import-report`, `scrape-sync-status` trong cùng một payload.
- Player detail đã dùng Community Builds thật qua API (`player_builds`), không còn hardcode.
- Community Builds đã có workflow end-to-end ngay trên màn cầu thủ: publish, đọc `scope=mine`, áp dụng lại build đã đăng, chuyển `public/private`, và xoá build của chính mình.
- Các action cộng đồng/build không còn tin `viewerId/authorId` do client tự gửi; server tự cấp anonymous session cookie và dùng session đó để xác định follow state, build ownership, và `scope=mine`.
- Công thức gameplay đã nâng cấp theo hướng parity hơn: level growth curve + build diminishing returns + condition theo nhóm chỉ số + manager style boost.
- Packs đã có timezone precision theo `Asia/Ho_Chi_Minh` với countdown `Mở sau / Còn lại / Đã đóng` ở list/detail và API.
- Stitch parity layer đã có route thật cho `Trang chủ`, `Cẩm nang`, `Từ điển Skills & Playstyles`, `Thông báo`, `Hồ sơ`, `Phân tích`, `Chuyển nhượng` và nhóm legal/support pages.
- `npm run audit:stitch:map` sẽ sinh bản đồ parity `mapped / should_drop / unmapped` cho toàn bộ control quét từ thư mục Stitch.

## MongoDB Indexes (recommended)

```bash
npm run db:indexes
```

- Script sẽ đảm bảo index cho các collection:
  - `players`, `managers`, `packs`, `community_profiles`, `league_rankings`, `player_builds`, `community_follows`
- Có thể đổi tên collection qua `.env.local`:
  - `PLAYERS_COLLECTION`, `MANAGERS_COLLECTION`, `PACKS_COLLECTION`, `COMMUNITY_COLLECTION`, `LEAGUE_COLLECTION`, `PLAYER_BUILDS_COLLECTION`, `COMMUNITY_FOLLOWS_COLLECTION`

## Quality checks

1. Lint + type check + production build:

```bash
npm run lint
npm run build
```

2. Smoke test UI (kiểm tra các nút/chức năng chính theo kịch bản tự động):

```bash
# terminal 1
npm run start -- --port 4018

# terminal 2
EFVN_BASE_URL="http://127.0.0.1:4018" npm run smoke:ui
```

- Script smoke UI nằm ở `scripts/smoke-ui.mjs`.
- Script sẽ đi qua các trang chính (`/`, `/cau-thu`, `/cau-thu/:id`, `/so-sanh`, `/hlv`, `/doi-hinh`, `/community`, `/packs`, `/tournaments`) và thêm round-trip check cho nhóm route Stitch mới (`/cam-nang`, `/tinh-nang`, `/thong-bao`, `/ho-so`, `/phan-tich`, `/chuyen-nhuong`, legal/support).

3. Audit Stitch controls (rà soát nút/link placeholder trong bộ giao diện Stitch):

```bash
npm run audit:stitch
```

- Kết quả xuất ra:
  - `docs/parity/stitch-controls-audit.md`
  - `docs/parity/stitch-controls-audit.json`

4. Stitch parity map (đánh dấu `mapped / should_drop / unmapped` cho từng control):

```bash
npm run audit:stitch:map
```

- Kết quả xuất ra:
  - `docs/parity/stitch-control-parity.md`
  - `docs/parity/stitch-control-parity.json`

## Import scraped JSON to MongoDB

```bash
npm run import:data -- --uri "mongodb://127.0.0.1:27017/efootball_vn" --db "efootball_vn" --players "/absolute/path/players.json" --managers "/absolute/path/managers.json" --packs "/absolute/path/packs.json" --community "/absolute/path/community.json" --league "/absolute/path/league.json"
```

- `--players`, `--managers`, `--packs`, `--community`, `--league`, `--builds` đều là tuỳ chọn, có thể chạy riêng từng loại dữ liệu.
- Script sẽ `upsert` theo khóa định danh (`efhubId` hoặc `id`) để tránh nhân bản dữ liệu.
- Import pipeline giờ đọc được cả JSON array lẫn object payload từ scraper và sinh `../scraped-output/status/import-report.json` với thống kê `new / updated / unchanged`.
- Các script sync/import trong `next-app/scripts` sẽ tự đọc `.env.local` và `.env` trước khi chạy.

## Pipeline scrape -> import (khuyến nghị)

1. Tại thư mục gốc `eFootball`, chạy scrape JSON:

```bash
npm run scrape:once -- 40 --out ./scraped-output/players.json
```

2. Quay về `next-app`, import vào MongoDB:

```bash
npm run import:data -- --uri "mongodb://127.0.0.1:27017/efootball_vn" --db "efootball_vn" --players "../scraped-output/players.json"
```

3. Hoặc chạy sync một lệnh ngay trong `next-app`:

```bash
npm run sync:once -- --maxPlayers 40
```

- `sync:once` sẽ gọi root scraper, ghi JSON ra `../scraped-output/players.latest.json`, import vào MongoDB và cập nhật:
  - `../scraped-output/status/scrape-status.json`
  - `../scraped-output/status/import-report.json`
  - `../scraped-output/status/scrape-sync-status.json`
- Nếu Mongo chưa chạy, `sync:once` vẫn scrape ra JSON nhưng bước import sẽ fail rõ ràng với `ECONNREFUSED 127.0.0.1:27017`, và trạng thái này xuất hiện trong `GET /api/health -> pipeline.sync.lastRun.error`.
- `sync:cron` sẽ giữ scheduler chạy theo nhịp:
  - cơ bản: mỗi giờ vào phút `12`
  - cao điểm: thêm phút `42` tối thứ Hai và thứ Năm theo `Asia/Ho_Chi_Minh`

## Localization audit

```bash
npm run audit:localization
```

- Script sẽ quét `app/` + `components/` để chặn residual English UI phrases không được phép.
- Kết quả xuất ra:
  - `docs/parity/localization-audit.json`
  - `docs/parity/localization-audit.md`
