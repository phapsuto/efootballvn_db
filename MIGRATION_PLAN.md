# Migration Plan – Stitch UI cho toàn bộ app

## 1. Design system nguồn

Dùng **Stellar Pitch** (bộ `*_efootball.vn_style`) làm hệ thống chính. Các mockup mobile (`*_mobile`) dùng để lấy variant responsive. Bộ **Nexus** (Kinetic Grid) chỉ giữ làm reference cho cải tiến tương lai (typography aggressive + Space Grotesk display), không apply ngay vì sẽ phá nhiều page đã có.

### Token chuẩn

| Token | Hex | Tailwind |
|-------|-----|----------|
| `background` | `#020617` | `bg-slate-950` |
| `surface` | `#0f172a` | `bg-slate-900` |
| `surface-variant` | `#1e293b` | `bg-slate-800` |
| `surface-muted` | `#0b1220` | – |
| `outline` | `#475569` | `border-slate-600` |
| `on-surface` | `#f8fafc` | `text-slate-50` |
| `on-surface-variant` | `#cbd5e1` | `text-slate-300` |
| `primary` | `#0A3D91` | – (thêm) |
| `secondary` (accent) | `#10b981` | `emerald-500` |
| `tertiary` (highlight) | `#FFD700` | `amber-400` |

Radius: `0.5rem` (card), `0.75rem` (container), `9999px` (pill).

Font: `Inter` (đã có) cho body + headline. `Space Grotesk` giữ như secondary headline tuỳ chọn. Icon: `Material Symbols Outlined` (mới) song song với `lucide-react` (đã dùng).

## 2. Chuẩn hoá foundation (được làm trong session này)

1. `tailwind.config.ts`: thêm colors `surface`, `surface-variant`, `on-surface`, `on-surface-variant`, `outline`, giữ nguyên tokens shadcn cũ để component cũ không vỡ.
2. `app/globals.css`: nạp `Material Symbols Outlined`, thêm utility `.stitch-glass`, `.stitch-nav-link`, `.stitch-side-rail`, `.stitch-card`, `.stitch-position-chip`, `.stitch-stat` → tái sử dụng được xuyên suốt.
3. `components/layout/site-header.tsx`: viết lại theo Stitch nav (logo + menu trung tâm + icon + CTA "Tham gia"), giữ prop `activeHref` để tránh vỡ các page hiện gọi.
4. `components/layout/site-footer.tsx`: đồng bộ typography + spacing Stitch, remove border 1px.
5. Component primitive (`button`, `card`, `input`, `badge`): cập nhật default variant sang style Stitch (rounded-lg, emerald active).

## 3. Migration theo route

Mức độ ưu tiên / estimation (1 "ngày dev" ≈ 1 người-ngày).

| Route | Stitch source | Độ khó | Notes |
|-------|---------------|--------|-------|
| `/` (trang chủ) | `c_s_d_li_u_c_u_th_efootball.vn_style` + `nexus_efootball/DESIGN.md` cho hero | 1 ngày | Đã có `app/page.tsx` 262 dòng, refactor hero + grid widget |
| `/cau-thu` list | `c_s_d_li_u_c_u_th_efootball.vn_style/code.html` | 1.5 ngày | Bên trái sidebar filter, bên phải grid card 4 col, chip OVR phải |
| `/cau-thu/[id]` detail | `chi_ti_t_c_u_th_c_p_nh_t/code.html` (bản mới nhất) + `chi_ti_t_c_u_th_efootball.vn_style` làm ref | 2 ngày | Hero player, stat radar, condition selector, community builds tab |
| `/hlv` list | `c_s_d_li_u_hlv_efootball.vn_style` | 1 ngày | Layout tương tự player list, đổi badge thành formation + philosophy |
| `/hlv/[id]` detail | `chi_ti_t_hlv_mobile` + nhân bản player detail | 1 ngày | Sync tone với player detail |
| `/doi-hinh` | `x_y_d_ng_i_h_nh_efootball.vn_style` | 2–3 ngày | Canvas sân + slot 4-3-3, sidebar player pool, metrics panel |
| `/so-sanh` | `so_s_nh_c_u_th_mobile` (chưa có desktop) | 1 ngày | Cần thiết kế desktop tuỳ biến từ mobile |
| `/packs`, `/packs/[id]` | – (chưa có Stitch) | 0.5 ngày | Bám Stitch design system; layout card + countdown |
| `/community`, `/community/[id]` | `h_s_c_nh_n_mobile` làm ref | 1 ngày | Hero user, grid profile card |
| `/tournaments`, `/tournaments/[id]` | – | 1 ngày | Leaderboard table: alternate row `surface-container-low/lowest` |
| `/cam-nang`, `/tinh-nang` | `th_vi_n_h_ng_d_n`, `c_ng_c_h_ng_d_n_mobile` | 0.5 ngày | Content-heavy, ưu tiên typography |
| `/cong-cu`, `/trung-tam-cong-cu` | `trung_t_m_c_ng_c` | 0.5 ngày | Grid tool + CTA |
| `/ho-so` | `h_s_c_nh_n_mobile` | 0.5 ngày | Profile hero + tabs |
| `/phan-tich` | – | 0.5 ngày | Dashboard + charts |
| `/chuyen-nhuong` | – | 0.5 ngày | Timeline/table |
| `/thong-bao` | `nexus_efootball/DESIGN.md` (glass dropdown pattern) | 0.25 ngày | |
| `/ho-tro`, `/hop-tac`, `/dieu-khoan`, `/chinh-sach` | – | 0.25 ngày / page | Static content |

**Total estimate:** ~14–16 ngày dev cho toàn bộ.

## 4. Quy tắc viết lại

1. **No 1px border for sectioning** — dùng background shift (`bg-slate-900` → `bg-slate-800`).
2. **Card radius 0.5rem / 0.75rem**, không dùng `rounded-2xl` trừ hero.
3. **Label style**: `text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500`.
4. **Active state**: border bottom / ring `emerald-500/40`, icon text `text-emerald-300`.
5. **Divider**: thay bằng `space-y-2` + alternating background.
6. **Icons**: prefer `lucide-react` (đã có) – đồng bộ trong app. Chỉ dùng Material Symbols khi cần icon mà lucide thiếu.
7. **Hero display headline**: `text-4xl font-black italic uppercase tracking-tight text-white`, `clamp(2.6rem, 4vw, 4.9rem)` ở `.ef-display` đang có – giữ nguyên.

## 5. Quy trình migrate mỗi page

1. Lấy `code.html` từ folder Stitch tương ứng, đọc kỹ cấu trúc HTML.
2. Map các `data-bind="..."` / `data-action="..."` placeholder → handler React hiện có.
3. Copy layout HTML vào JSX (replace `class` → `className`, `<span class="material-symbols-outlined">icon</span>` → `<MaterialIcon name="icon" />` hoặc `lucide-react` tương đương).
4. Chạy `npm run lint` + thủ công mở trong dev để so sánh với `screen.png` từ Stitch.
5. Snapshot trước/sau (Playwright screenshot) thêm vào `docs/parity/`.

## 6. Smoke & audit sau mỗi batch

- `npm run lint`
- `npm run audit:stitch:map` → check drop `unmapped` và không tăng `should_drop`.
- `npm run audit:localization` → đảm bảo không leak English.
- Với page nặng, `npm run smoke:ui`.

## 7. Thứ tự phát hành đề xuất

**Sprint 1 (foundation + UX stops):**
- Foundation tokens / nav / footer.
- `/cau-thu` list + detail.
- `/hlv` list + detail.
- `/doi-hinh`.

**Sprint 2 (còn lại):**
- `/packs`, `/so-sanh`, `/community`, `/tournaments`.
- `/cam-nang`, `/tinh-nang`, `/cong-cu`, `/ho-so`, `/phan-tich`, `/chuyen-nhuong`, `/thong-bao`.
- Legal/support pages.

**Sprint 3:** fix audit findings (Audit C1–C3, H1–H6), thêm integration tests.

## 8. Rủi ro

- Lineup builder (`lineup-builder-client.tsx` 857 dòng) + player detail (1216 dòng) quá lớn → refactor song song với migrate UI sẽ dễ vỡ. Đề xuất: split component TRƯỚC (logic giữ nguyên), sau đó mới thay UI.
- Material Symbols kéo về một font-face lớn; nếu team muốn performance strict, port icon sang `lucide-react` 100%.
- `data-bind` placeholder trong Stitch có thể trùng với hệ client hiện tại — cần kiểm placeholder nào đã có handler JS để nối.
