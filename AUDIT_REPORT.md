# Audit Report – eFootball Next App

**Ngày audit:** 2026-04-23
**Scope:** Next.js app tại `next-app/` (Next.js 15 App Router + Tailwind + MongoDB fallback).
**Kết quả build/lint/typecheck:** ✅ `tsc --noEmit` pass, ✅ `next lint` pass, ✅ bản build trước trong `.next/` còn nguyên.

---

## 1. Tổng quan

App đã được scaffold tương đối hoàn chỉnh: routes đầy đủ theo efhub.com (cầu thủ, HLV, đội hình, packs, community, tournaments, cẩm nang, tính năng, hồ sơ, phân tích, chuyển nhượng…), có API routes với query validation (`lib/api/query.ts`), response cache TTL in-memory, rate limiting qua `middleware.ts`, gameplay engine riêng (`lib/gameplay/*`), pipeline scrape → import → sync, và localization/parity audits. Mock data fallback hoạt động tốt khi không có MongoDB.

Điểm yếu tập trung ở lớp bảo mật (session/CSRF), tính nhất quán dữ liệu lúc concurrent writes, missing indexes, và độ chặt của validation input.

---

## 2. Critical (blocker — nên fix trước khi release)

### C1. Anonymous session cookie quá dài, không server-side validate
- **File:** `lib/security/viewer-session.ts` (~dòng 67–75).
- **Vấn đề:** Cookie 1 năm, UUID v4 gen client-side-friendly, không lưu whitelist server → cookie giả mạo (đoán/brute/ghép từ log) có thể truy cập builds/follows/profile của người khác. Đây là cơ chế "auth nhẹ" duy nhất cho các endpoint mutating.
- **Impact:** Impersonate user ẩn danh → publish/delete build của người khác, giả follow.
- **Fix khuyến nghị:**
  1. TTL 30–90 ngày + sliding expiration.
  2. Lưu bảng `anonymous_sessions` (Mongo) với `createdAt`, `lastSeenAt`, `ip`, `userAgentHash` – reject cookie không có trong bảng.
  3. Dùng `crypto.randomBytes(32).toString('base64url')` thay vì UUID.
  4. `HttpOnly`, `Secure`, `SameSite=Lax` (check đã đúng chưa).

### C2. Không có CSRF protection trên state-changing API
- **Files:** `app/api/players/[id]/builds/route.ts` (POST), `app/api/players/[id]/builds/[buildId]/route.ts` (PATCH/DELETE), `app/api/community/profiles/[id]/follow/route.ts` (POST/DELETE).
- **Vấn đề:** Chỉ dựa cookie → site khác có thể gửi `fetch` với `credentials: 'include'` và force user thực hiện action.
- **Fix:** Kiểm tra `Origin` / `Referer` header, hoặc thêm CSRF token (`__Host-csrf` double-submit cookie). Chặn cross-origin POST ngay ở `middleware.ts`.

### C3. Race condition ở counter follower/following
- **File:** `lib/data/repository.ts` `setCommunityFollowState` (~2103–2157).
- **Vấn đề:** Upsert rồi `$inc` counter là 2 bước không atomic; 2 request song song có thể inc 2 lần hoặc rớt 1 lần → counter âm/lệch.
- **Fix:**
  - Dùng `findOneAndUpdate` với filter `{ followerId, targetId, active: false }` rồi `$set: { active: true }`; chỉ tăng counter khi `modifiedCount === 1`.
  - Hoặc bọc trong transaction (`session.withTransaction`).
  - Thêm test concurrent với 2 promises `Promise.all` để guard regression.

---

## 3. High (quan trọng — fix sớm)

### H1. Input validation còn lỏng ở builds/follow API
- Không kiểm `Content-Type: application/json`.
- Không validate shape của `allocations`, `condition`, `progression` (hiện chỉ parse thủ công trong `parseAllocations`).
- **Fix:** Dùng `zod` (đã nhẹ, compatible) → 1 schema/endpoint. Trả `400` với detail khi fail.

### H2. Thiếu index MongoDB cho query nóng
- `players` có regex trên `name`, `club`, `nationality`, `slug` nhưng không guarantee index (`ensure-mongo-indexes.mjs` chỉ tạo unique key chưa đủ).
- **Fix:** Bổ sung index composite: `{ overall: -1, name: 1 }`, `{ nationality: 1, overall: -1 }`, `{ slug: 1 }` unique, và text index cho search.

### H3. Rate limit không phân biệt action
- `middleware.ts` đếm toàn bộ request `/api/*` theo IP/viewer, nhưng 1 viewer có thể spam follow-unfollow, hoặc spam tạo build (DB bloat).
- **Fix:** Thêm scoped limiter ở từng handler (ví dụ tạo build ≤ 10/min, follow ≤ 30/min).

### H4. Cache in-memory không LRU thực thụ
- `lib/api/response-cache.ts` evict theo `createdAt` → nhiều endpoint cùng hot sẽ đá nhau.
- **Fix:** Dùng Map insertion order (JS Map giữ order) + `cache.delete(key); cache.set(key, value)` mỗi lần HIT để chuyển về LRU thực.

### H5. `calculatePlayerProjection` thiếu guard null manager
- **File:** `lib/gameplay/player-calculation.ts`, xung quanh dòng 227–280.
- **Vấn đề:** Không đảm bảo khi `manager === null` hoặc influence trả về `undefined`.
- **Fix:** Early return / default 0 + thêm test case `evaluateManagerInfluenceForPlayer(player, null)`.

### H6. Mock vs Mongo schema có thể lệch
- Khi tăng feature (additional skills, com styles…), mock không đồng bộ → dev test với mock xanh nhưng prod đỏ.
- **Fix:** Tạo `lib/data/schema.ts` với `zod` definition, chạy validate cả mock lẫn Mongo data tại boot/tests.

---

## 4. Medium (code quality, DX)

| ID | Vấn đề | Khuyến nghị |
|----|--------|-------------|
| M1 | `parseAllocations` duplicate giữa 2 route builds | Move vào `lib/api/query.ts` |
| M2 | `player-detail-client.tsx` 1216 dòng, `lineup-builder-client.tsx` 857 dòng – quá lớn | Split theo section (stats, builds, community, progression) |
| M3 | Không có `generateMetadata` cho `/cau-thu/[id]`, `/hlv/[id]` | Thêm SEO metadata (og:image, title player) |
| M4 | Không có Error Boundary cho page | Thêm `app/error.tsx`, `app/(route)/error.tsx` cho từng segment nặng |
| M5 | `lib/sync/` tồn tại nhưng không ai import | Xác nhận còn cần, hoặc remove |
| M6 | Test chỉ cover gameplay parity | Thêm integration test cho API builds/follow |
| M7 | Thiếu `Cache-Control` public cho GET API | Thêm `Cache-Control: public, s-maxage=30, stale-while-revalidate=60` |

---

## 5. Low (nitpick)

- Trộn tiếng Việt / tiếng Anh ở message lỗi. Cân nhắc `lib/api/errors.ts` với mã + message VN.
- Nhiều chỗ dùng `any` ẩn (inline types). Kéo về `types/` chung.
- `.env.local` đã commit – kiểm tra không chứa secret thật.
- Scrollbar styling chỉ support webkit – ok, không blocker.

---

## 6. Kết luận audit

Chất lượng code tổng thể khá (lint/type pass, có structure rõ, có doc), nhưng **3 vấn đề blocker về bảo mật/đồng bộ** nên xử lý trước khi mở public: session cookie, CSRF, race follow-counter. Sau đó ưu tiên H1–H4 để chịu tải thật.

UI hiện tại đã có bộ Tailwind utility riêng (`ef-shell`, `ef-panel`…), khá nhất quán nhưng **chưa bám Stitch design**. Chi tiết migration ở `MIGRATION_PLAN.md`.
