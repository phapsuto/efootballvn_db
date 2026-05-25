# eFHUB Feature Parity Checklist

This folder tracks parity against [eFHUB](https://efhub.com) using weighted scoring.

## Files

- `efhub-parity-checklist.json`: source of truth for modules/checks/status.
- `../../scripts/parity-score.mjs`: scoring script.

## Status meaning

- `pass`: fully matched (100% of check weight)
- `partial`: partially matched (50% of check weight)
- `fail` / `todo`: not matched (0%)
- `na`: excluded from denominator

## Run scoring

```bash
npm run parity:score
```

Optional:

```bash
node scripts/parity-score.mjs --file docs/parity/efhub-parity-checklist.json --json
node scripts/parity-score.mjs --min 90
```

## Quality gate

```bash
npm run parity:gate
npm run check:quality
```

- `parity:gate` mặc định fail nếu parity `< 90%`.
- Có thể override ngưỡng bằng env `EFVN_PARITY_MIN_SCORE`.
- Parity tests đọc dữ liệu thật từ `scraped-output` (đệ quy), có thể điều chỉnh qua:
  - `EFVN_PARITY_MAX_PLAYERS` (mặc định `12`)
  - `EFVN_PARITY_MIN_PLAYERS` (mặc định `1`)
  - `EFVN_PARITY_PLAYERS_JSON` (list file JSON tùy chỉnh, ngăn cách bằng dấu phẩy)

## Update process

1. Open `efhub-parity-checklist.json`
2. Update each check's `status` and `evidence`
3. Re-run `npm run parity:score`
4. Keep evidence concrete (file path, route, test command, screenshot link)
