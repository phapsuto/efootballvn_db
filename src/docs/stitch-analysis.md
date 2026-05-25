# Stitch Analysis (Initial)

## 1. Available Screens in `/stitch`

### Desktop-ready (`*_efootball.vn_style`)
- `stitch/c_s_d_li_u_c_u_th_efootball.vn_style/code.html`
  - Player database/list page.
  - Candidate route: `/cau-thu`
- `stitch/chi_ti_t_c_u_th_efootball.vn_style/code.html`
  - Player detail page with level slider + condition arrows UI.
  - Candidate route: `/cau-thu/:id`
- `stitch/c_s_d_li_u_hlv_efootball.vn_style/code.html`
  - Manager database/list page.
  - Candidate route: `/hlv`
- `stitch/x_y_d_ng_i_h_nh_efootball.vn_style/code.html`
  - Squad builder page.
  - Candidate route: `/doi-hinh`

### Complementary mobile screens
- Player list/detail mobile, manager list/detail mobile, tools, guides, profile, compare, advanced search.
- These are useful for responsive phase 2 after desktop routes are wired.

## 2. Current Integration Approach
- Keep Stitch screens as visual source of truth.
- Serve desktop pages through Express routes first.
- Add API-backed data binding progressively for:
  - Player list filters/search.
  - Player detail dynamic level stats (`/cau-thu/:id`).
  - Condition arrows state.

## 3. Localization Notes
- Most labels are already Vietnamese.
- Keep technical eFootball terms in English:
  - `Skills`, `Playstyles`, stat names (`Finishing`, `Low Pass`, etc.).

## 4. Data Contract Needed for UI Binding

### For `/api/players/:id`
- `name`, `cardType`, `positions`, `overall.base`, `overall.max`
- `levels.max`
- `stats.level1` and `stats.maxLevel`
- `skills[]`, `playstyles[]`
- `condition.form`
- `images.card`

### For `/api/players`
- Paginated list with filter params:
  - `q`, `position`, `cardType`, `playstyle`, `minOvr`, `page`, `limit`

### For `/api/managers`
- `q`, `formation`, `playstyle`, `page`, `limit`

## 5. Observations for Scraper Implementation
- Stitch screens are static mockups and contain no data JS logic.
- eFHUB scraping must infer selectors dynamically and include fallback selectors.
- Max-level stats should be captured by setting range input to max and re-reading stats.
