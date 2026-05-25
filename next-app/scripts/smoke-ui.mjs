import { chromium } from 'playwright';

const baseUrl = process.env.EFVN_BASE_URL || 'http://127.0.0.1:4018';

function ensureOk(response, label) {
  if (!response.ok) {
    throw new Error(`${label} failed with HTTP ${response.status}`);
  }
}

async function getFirstIds() {
  const playersResponse = await fetch(`${baseUrl}/api/players?limit=2&page=1&minOvr=1`);
  ensureOk(playersResponse, 'GET /api/players');
  const playersPayload = await playersResponse.json();
  const playerId = playersPayload?.data?.[0]?.efhubId;
  const comparePlayerId = playersPayload?.data?.[1]?.efhubId || playerId;
  if (!playerId) {
    throw new Error('No player id found from /api/players');
  }

  const packsResponse = await fetch(`${baseUrl}/api/packs?limit=1&page=1`);
  ensureOk(packsResponse, 'GET /api/packs');
  const packsPayload = await packsResponse.json();
  const packId = packsPayload?.data?.[0]?.id;
  if (!packId) {
    throw new Error('No pack id found from /api/packs');
  }

  return { playerId, comparePlayerId, packId };
}

async function runStep(name, fn, failures) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${name}: ${message}`);
    console.error(`FAIL ${name}: ${message}`);
  }
}

async function waitForClientHydration(page, urlPattern) {
  try {
    await page.waitForResponse(
      (response) => response.url().includes(urlPattern) && response.status() < 500,
      { timeout: 10_000 }
    );
  } catch {
    // Ignore hydration-response timeout; next checks can still validate interaction.
  }
  await page.waitForTimeout(350);
}

async function ensureComparePanelOpen(page) {
  const compareInput = page.getByPlaceholder(
    /Nhập tên hoặc ID\/slug cầu thủ|Nhập tên hoặc player id\/slug/i
  );

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if ((await compareInput.count()) > 0) {
      return compareInput;
    }
    await page.getByRole('button', { name: 'So Sánh' }).first().click();
    try {
      await compareInput.first().waitFor({ timeout: 2_500 });
      return compareInput;
    } catch {
      // Retry clicking compare button if panel is not open yet.
    }
  }

  throw new Error('Không mở được panel so sánh trên trang cầu thủ.');
}

async function main() {
  const { playerId, comparePlayerId, packId } = await getFirstIds();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const failures = [];

  page.on('pageerror', (error) => {
    failures.push(`pageerror: ${error.message}`);
  });

  page.on('dialog', async (dialog) => {
    try {
      await dialog.accept();
    } catch {
      // Ignore dialog closure errors.
    }
  });

  await runStep(
    'Header quick search actions',
    async () => {
      await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
      const quickSearch = page.getByLabel('Tìm nhanh');
      await quickSearch.fill('Salah');
      await quickSearch.press('Enter');
      await page.waitForURL(/\/ket-qua-tim-kiem-nang-cao\?q=Salah/, { timeout: 10_000 });
      await page.getByText('Kết quả Tìm kiếm Nâng cao').waitFor({ timeout: 10_000 });
      await page.getByText(/Từ khoá: Salah/i).first().waitFor({ timeout: 10_000 });
    },
    failures
  );

  await runStep(
    'Advanced search actions',
    async () => {
      await page.goto(
        `${baseUrl}/ket-qua-tim-kiem-nang-cao?q=Salah&position=RWF&cardType=Highlight`,
        { waitUntil: 'domcontentloaded' }
      );
      await page.getByText(/Từ khoá: Salah/i).first().waitFor({ timeout: 10_000 });
      await page.getByText(/Vị trí: RWF/i).first().waitFor({ timeout: 10_000 });
      await page.getByText(/Loại thẻ: Highlight/i).first().waitFor({ timeout: 10_000 });

      await page.locator('aside button').filter({ hasText: /^CF$/ }).first().click();
      await page.locator('aside select').nth(0).selectOption('Epic');
      await page.getByRole('button', { name: /Áp dụng/i }).click();
      await page.waitForURL(/position=CF/, { timeout: 10_000 });
      await page.waitForURL(/cardType=Epic/, { timeout: 10_000 });
      await page.getByText(/Vị trí: CF/i).first().waitFor({ timeout: 10_000 });
      await page.getByText(/Loại thẻ: Epic/i).first().waitFor({ timeout: 10_000 });

      await page.getByText(/Vị trí: CF/i).first().click();
      await page.waitForURL((url) => !url.searchParams.has('position'), { timeout: 10_000 });
    },
    failures
  );

  await runStep(
    'Players page actions',
    async () => {
      await page.goto(`${baseUrl}/cau-thu`, { waitUntil: 'domcontentloaded' });
      await page.getByLabel('Sắp xếp cầu thủ').selectOption('name_asc');
      await page.getByRole('button', { name: /Áp dụng/i }).click();
      await page.getByRole('button', { name: /Đặt lại/i }).click();
      await page.locator('main a[href^="/cau-thu/"]').first().click();
      await page.waitForURL(/\/cau-thu\/.+/, { timeout: 10_000 });
    },
    failures
  );

  await runStep(
    'Player detail actions',
    async () => {
      await page.goto(`${baseUrl}/cau-thu/${playerId}`, { waitUntil: 'domcontentloaded' });
      await waitForClientHydration(page, '/api/managers?limit=200&page=1');
      const compareButtons = page.getByRole('button', { name: 'So Sánh' });
      await compareButtons.first().click();
      await page.getByRole('button', { name: 'Build Của Tôi' }).click();
      await page.getByRole('button', { name: 'Build Cộng Đồng' }).click();
      await page.getByRole('button', { name: 'Tùy Chỉnh' }).click();
      await page.getByRole('button', { name: 'Lưu Build' }).click();
      const publishResponse = page
        .waitForResponse(
          (response) =>
            response.url().includes(`/api/players/${playerId}/builds`) &&
            response.request().method() === 'POST',
          { timeout: 12_000 }
        )
        .catch(() => null);
      await page.getByRole('button', { name: /Đăng Lên Cộng Đồng|Đang Đăng/ }).click();
      await publishResponse;
      await page.getByRole('button', { name: 'Chia Sẻ Link' }).click();
      await page.getByRole('button', { name: 'Build Của Tôi' }).click();
      await page.locator('button:has-text("Build")').first().click();

      const sliderThumb = page.locator('main [role="slider"]').first();
      await sliderThumb.focus();
      await sliderThumb.press('ArrowRight');

      await page.locator('button:has-text("B")').first().click();

      await page.getByRole('button', { name: '+' }).first().click();
      await page.getByRole('button', { name: '-' }).first().click();
      await page.getByRole('button', { name: 'Tối Ưu Smart' }).click();

      const compareInput = await ensureComparePanelOpen(page);
      await compareInput.first().fill(playerId);
      await compareButtons.last().click();
      await page.getByText(/OVR/i).first().waitFor({ timeout: 10_000 });
    },
    failures
  );

  await runStep(
    'Compare page actions',
    async () => {
      await page.goto(
        `${baseUrl}/so-sanh?left=${encodeURIComponent(playerId)}&right=${encodeURIComponent(comparePlayerId)}`,
        { waitUntil: 'domcontentloaded' }
      );
      await page.getByRole('button', { name: 'Đảo Vị Trí So Sánh' }).click();
      await page.getByRole('button', { name: 'Đặt Lại So Sánh' }).click();

      const queryInputs = page.getByPlaceholder('Nhập tên hoặc ID/slug cầu thủ');
      await queryInputs.nth(0).fill(playerId);
      await page.getByRole('button', { name: 'Tìm' }).nth(0).click();
      await queryInputs.nth(1).fill(comparePlayerId);
      await page.getByRole('button', { name: 'Tìm' }).nth(1).click();
      await page.getByText('Bảng So Sánh Chỉ Số').waitFor({ timeout: 10_000 });
      await page.getByText(/Attacking Prowess/i).first().waitFor({ timeout: 10_000 });
    },
    failures
  );

  await runStep(
    'Managers page actions',
    async () => {
      await page.goto(`${baseUrl}/hlv`, { waitUntil: 'domcontentloaded' });
      await page.getByLabel('Sắp xếp HLV').selectOption('name_asc');
      await page.getByLabel('Playstyle tối thiểu').fill('70');
      await page.getByRole('button', { name: /Áp dụng/i }).click();
      await page.getByRole('button', { name: /Đặt lại/i }).click();
      await page.locator('main a[href^="/hlv/"]').first().click();
      await page.waitForURL(/\/hlv\/.+/, { timeout: 10_000 });
      await page.getByRole('link', { name: /Vào đội hình/i }).click();
      await page.waitForURL(/\/doi-hinh(\?.*)?/, { timeout: 10_000 });
    },
    failures
  );

  await runStep(
    'Lineup page actions',
    async () => {
      await page.goto(`${baseUrl}/doi-hinh`, { waitUntil: 'domcontentloaded' });
      await waitForClientHydration(page, '/api/managers?page=1&limit=200');
      const autoFillResult = page
        .getByText(
          /Đã tự điền thêm|Đã auto-fill thêm|Không tìm được cầu thủ phù hợp|Không thể auto-fill đội hình/,
          { exact: false }
        )
        .first();

      let autoFillResolved = false;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        await page.getByRole('button', { name: 'Tự Điền' }).click();
        try {
          await autoFillResult.waitFor({ timeout: 12_000 });
          autoFillResolved = true;
          break;
        } catch {
          // Retry once if hydration race caused a no-op click.
        }
      }
      if (!autoFillResolved) {
        throw new Error('Auto-fill không phản hồi sau 2 lần thử.');
      }
      await page.getByRole('button', { name: 'Gợi Ý Theo HLV' }).click();
      await page
        .getByText(/Đã gợi ý thêm|Không có cầu thủ phù hợp thêm theo/, { exact: false })
        .first()
        .waitFor({ timeout: 20_000 });

      await page.locator('button').filter({ hasText: /^CF/ }).first().click();
      await page.getByRole('button', { name: 'Xoá Vị Trí' }).click();
      await page.getByRole('button', { name: 'Xoá Tất Cả' }).click();

      await page.locator('button').filter({ hasText: /^CF/ }).first().click();
      await page.getByPlaceholder('Tìm theo tên cầu thủ...').fill('Salah');
      await page.getByRole('button', { name: 'Tìm Cầu Thủ' }).click();
      await page.waitForTimeout(1_200);

      const exactCandidate = page.locator('button:has-text("Salah")').first();
      if ((await exactCandidate.count()) > 0) {
        await exactCandidate.click();
      } else {
        const anyCandidate = page.locator('button:has-text("OVR")').first();
        if ((await anyCandidate.count()) > 0) {
          await anyCandidate.click();
        } else {
          const hasError = (await page.getByText(/Không thể tải danh sách cầu thủ/).count()) > 0;
          if (!hasError) {
            throw new Error('Search & assign did not return candidates or error state.');
          }
        }
      }
    },
    failures
  );

  await runStep(
    'Community page actions',
    async () => {
      await page.goto(`${baseUrl}/community`, { waitUntil: 'domcontentloaded' });
      const followButton = page.getByRole('button', { name: /Theo Dõi|Bỏ Theo Dõi/i }).first();
      if ((await followButton.count()) > 0) {
        const followResponse = page
          .waitForResponse(
            (response) =>
              response.url().includes('/api/community/profiles/') &&
              response.url().includes('/follow') &&
              response.request().method() !== 'GET',
            { timeout: 12_000 }
          )
          .catch(() => null);
        await followButton.click();
        await followResponse;
        await page.waitForTimeout(450);
      }
      await page.getByRole('button', { name: 'Đang Theo Dõi' }).click();
      await page.getByRole('button', { name: 'Người Theo Dõi' }).click();
      await page.getByRole('button', { name: 'Khám Phá' }).click();
      await page.locator('main select').first().selectOption('followers_desc');
      await page.getByRole('button', { name: 'Áp Dụng Bộ Lọc' }).click();
      await page.getByRole('button', { name: 'Đặt Lại' }).click();
      const nextPageButton = page.getByRole('button', { name: 'Trang Sau' });
      if ((await nextPageButton.count()) > 0 && !(await nextPageButton.isDisabled())) {
        await nextPageButton.click();
      }
      const prevPageButton = page.getByRole('button', { name: 'Trang Trước' });
      if ((await prevPageButton.count()) > 0 && !(await prevPageButton.isDisabled())) {
        await prevPageButton.click();
      }

      const firstProfile = page.locator('main a[href^="/community/"]').first();
      if ((await firstProfile.count()) > 0) {
        await firstProfile.click();
        await page.waitForURL(/\/community\/.+/, { timeout: 10_000 });
      }
    },
    failures
  );

  await runStep(
    'Profile viewer session actions',
    async () => {
      await page.goto(`${baseUrl}/ho-so`, { waitUntil: 'domcontentloaded' });
      await page.getByText('Mã viewer').first().waitFor({ timeout: 10_000 });

      const codeLocator = page.locator('code').first();
      const originalViewerId = (await codeLocator.textContent())?.trim() || '';
      if (!originalViewerId || originalViewerId === '—') {
        throw new Error('Không lấy được viewer id ban đầu.');
      }

      await page.getByRole('button', { name: 'Tạo hồ sơ mới' }).click();
      await page
        .getByText(/Đã tạo hồ sơ mới\. Mã viewer của bạn đã được thay đổi\./i)
        .waitFor({ timeout: 10_000 });

      const refreshedViewerId = (await codeLocator.textContent())?.trim() || '';
      if (!refreshedViewerId || refreshedViewerId === originalViewerId) {
        throw new Error('Viewer id không đổi sau khi tạo hồ sơ mới.');
      }

      await page.getByPlaceholder('Dán mã viewer của bạn').fill(originalViewerId);
      await page.getByRole('button', { name: 'Khôi phục' }).click();
      await page
        .getByText(/Đã khôi phục hồ sơ\./i)
        .waitFor({ timeout: 10_000 });

      const restoredViewerId = (await codeLocator.textContent())?.trim() || '';
      if (restoredViewerId !== originalViewerId) {
        throw new Error('Viewer id không quay lại mã đã khôi phục.');
      }
    },
    failures
  );

  await runStep(
    'Glossary page actions',
    async () => {
      await page.goto(`${baseUrl}/tinh-nang`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'Playstyles' }).click();
      await page.getByPlaceholder('Tìm Double Touch, Goal Poacher, Build Up...').fill('Goal Poacher');
      await page.getByText('Goal Poacher').first().waitFor({ timeout: 10_000 });
      await page.getByRole('button', { name: 'GK Skills' }).click();
      await page.getByRole('button', { name: 'Tất cả' }).click();
    },
    failures
  );

  await runStep(
    'Packs page actions',
    async () => {
      await page.goto(`${baseUrl}/packs`, { waitUntil: 'domcontentloaded' });
      const searchInput = page.getByPlaceholder('Ví dụ: Epic, Highlight...');
      await searchInput.fill('Epic');
      await searchInput.press('Enter');
      await page.goto(`${baseUrl}/packs/${packId}`, { waitUntil: 'domcontentloaded' });
      await page.getByText(/Giờ Việt Nam \(UTC\+7\)/).first().waitFor({ timeout: 10_000 });
      await page.locator('main a[href^="/cau-thu/"]').first().click();
      await page.waitForURL(/\/cau-thu\/.+/, { timeout: 10_000 });
    },
    failures
  );

  await runStep(
    'League page actions',
    async () => {
      await page.goto(`${baseUrl}/tournaments`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'Co-op Mobile' }).click();
      await page.getByRole('button', { name: 'Co-op Crossplay' }).click();
      await page.getByRole('button', { name: 'Tất Cả' }).click();
      await page.locator('main select').first().selectOption('name_asc');
      await page.getByRole('button', { name: 'Áp Dụng' }).click();
      await page.getByRole('button', { name: 'Đặt Lại' }).click();
      const nextPageButton = page.getByRole('button', { name: 'Trang Sau' });
      if ((await nextPageButton.count()) > 0 && !(await nextPageButton.isDisabled())) {
        await nextPageButton.click();
      }
      const prevPageButton = page.getByRole('button', { name: 'Trang Trước' });
      if ((await prevPageButton.count()) > 0 && !(await prevPageButton.isDisabled())) {
        await prevPageButton.click();
      }

      const firstTeam = page.locator('main a[href^="/tournaments/"]').first();
      if ((await firstTeam.count()) > 0) {
        await firstTeam.click();
        await page.waitForURL(/\/tournaments\/.+/, { timeout: 10_000 });
        await page.getByText('Biến Động 24h').first().waitFor({ timeout: 10_000 });
      }
    },
    failures
  );

  await runStep(
    'Notifications and transfer actions',
    async () => {
      await page.goto(`${baseUrl}/thong-bao`, { waitUntil: 'domcontentloaded' });
      await page.getByText('Trạng thái sync').first().waitFor({ timeout: 10_000 });
      await page.locator('main a[href^="/packs/"]').first().click();
      await page.waitForURL(/\/packs\/.+/, { timeout: 10_000 });

      await page.goto(`${baseUrl}/chuyen-nhuong`, { waitUntil: 'domcontentloaded' });
      await page.getByText('Chuyển nhượng & pack watch').first().waitFor({ timeout: 10_000 });
      await page.locator('main a[href^="/cau-thu/"]').first().click();
      await page.waitForURL(/\/cau-thu\/.+/, { timeout: 10_000 });
    },
    failures
  );

  await runStep(
    'Stitch parity routes',
    async () => {
      const routeChecks = [
        { url: '/', text: 'Tra cứu cầu thủ, build đội hình, so sánh & phân tích meta.' },
        { url: '/cam-nang', text: 'Cẩm nang cho từng nhịp chơi' },
        { url: '/tinh-nang', text: 'Thư viện tra cứu' },
        { url: '/thong-bao', text: 'Thông báo hệ thống' },
        { url: '/ho-so', text: 'Hồ sơ cá nhân' },
        { url: '/phan-tich', text: 'Phân tích meta' },
        { url: '/chuyen-nhuong', text: 'Chuyển nhượng & pack watch' },
        { url: '/chinh-sach', text: 'Chính sách' },
        { url: '/dieu-khoan', text: 'Điều khoản' },
        { url: '/hop-tac', text: 'Hợp tác' },
        { url: '/ho-tro', text: 'Hỗ trợ' }
      ];

      for (const route of routeChecks) {
        await page.goto(`${baseUrl}${route.url}`, { waitUntil: 'domcontentloaded' });
        await page.getByText(route.text, { exact: false }).first().waitFor({ timeout: 10_000 });
      }
    },
    failures
  );

  await browser.close();

  if (failures.length > 0) {
    console.error('\nSmoke UI failures:');
    failures.forEach((item) => console.error(`- ${item}`));
    process.exit(1);
  }

  console.log('\nAll smoke UI checks passed.');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Smoke UI run failed: ${message}`);
  process.exit(1);
});
