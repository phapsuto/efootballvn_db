#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const STITCH_CANDIDATES = [path.resolve(ROOT, '../Stitch'), path.resolve(ROOT, '../stitch')];
const REPORT_MD = path.resolve(ROOT, 'docs/parity/stitch-control-parity.md');
const REPORT_JSON = path.resolve(ROOT, 'docs/parity/stitch-control-parity.json');

async function resolveStitchRoot() {
  for (const candidate of STITCH_CANDIDATES) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isDirectory()) {
        return candidate;
      }
    } catch {
      // Continue.
    }
  }
  throw new Error(`Không tìm thấy thư mục Stitch tại: ${STITCH_CANDIDATES.join(', ')}`);
}

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTagLabel(rawTag) {
  const withoutTags = rawTag.replace(/<[^>]+>/g, ' ');
  return normalizeWhitespace(withoutTags).slice(0, 120);
}

function normalizeForMatch(value) {
  return normalizeWhitespace(value)
    .replaceAll('Đ', 'D')
    .replaceAll('đ', 'd')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function parseControls(html) {
  const controls = [];
  const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  const anchorRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;

  let match;
  while ((match = buttonRegex.exec(html))) {
    const attrs = match[1] || '';
    const label = cleanTagLabel(match[2] || '') || '[icon-only]';
    controls.push({ type: 'button', label, href: '', attrs });
  }

  while ((match = anchorRegex.exec(html))) {
    const attrs = match[1] || '';
    const hrefMatch = attrs.match(/\bhref\s*=\s*"([^"]*)"/i) || attrs.match(/\bhref\s*=\s*'([^']*)'/i);
    const href = normalizeWhitespace(hrefMatch?.[1] || '');
    const label = cleanTagLabel(match[2] || '') || '[icon-only]';
    controls.push({ type: 'anchor', label, href, attrs });
  }

  return controls;
}

async function collectCodeHtmlFiles(directory) {
  const stack = [directory];
  const files = [];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      break;
    }
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.resolve(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolute);
        continue;
      }
      if (entry.isFile() && entry.name === 'code.html') {
        files.push(absolute);
      }
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function moduleFromFile(file) {
  if (file.includes('c_u_th') && file.includes('chi_ti_t')) return 'player_detail';
  if (file.includes('c_u_th')) return 'players_database';
  if (file.includes('hlv') && file.includes('chi_ti_t')) return 'manager_detail';
  if (file.includes('hlv')) return 'managers_database';
  if (file.includes('x_y_d_ng_i_h_nh')) return 'lineup';
  if (file.includes('so_s_nh')) return 'compare';
  if (file.includes('trung_t_m_c_ng_c')) return 'tools_hub';
  if (file.includes('th_vi_n_h_ng_d_n')) return 'guide_library';
  if (file.includes('t_i_n_k_n_ng')) return 'glossary';
  if (file.includes('h_s_c_nh_n')) return 'profile';
  if (file.includes('chi_ti_t_i_tuy_n')) return 'tournaments';
  if (file.includes('k_t_qu_t_m_ki_m_n_ng_cao')) return 'player_search';
  return 'misc';
}

function route(label, target, reason) {
  return { status: 'mapped', target, reason };
}

function drop(reason) {
  return { status: 'should_drop', target: null, reason };
}

function unhandled(reason) {
  return { status: 'unmapped', target: null, reason };
}

function classifyControl({ type, label, href, file }) {
  const normalized = normalizeForMatch(label);
  const fileKey = normalizeForMatch(file);
  const rawFile = String(file || '');

  if (href && href !== '#' && href.toLowerCase() !== 'javascript:void(0)') {
    return route(label, href, 'Stitch control đã có href cụ thể.');
  }

  if (
    normalized === '[icon only]' ||
    normalized === 'chevron right' ||
    normalized === 'arrow back' ||
    normalized === 'share' ||
    normalized === 'settings' ||
    normalized === 'swap horiz' ||
    normalized === 'expand more' ||
    normalized === 'person add'
  ) {
    return drop('Icon shell hoặc hành vi native được thay bằng route/action rõ ràng trong Next app.');
  }

  if (normalized.includes('trang chu') || normalized.includes('home')) {
    return route(label, '/', 'Map sang landing page thay cho nav placeholder.');
  }
  if (normalized.includes('cau thu') || normalized.includes('database')) {
    return route(label, '/cau-thu', 'Map sang database cầu thủ.');
  }
  if (normalized.includes('hlv')) {
    return route(label, '/hlv', 'Map sang database HLV hoặc detail HLV.');
  }
  if (normalized.includes('doi hinh') || normalized.includes('squad')) {
    return route(label, '/doi-hinh', 'Map sang lineup builder hoặc detail đội hình.');
  }
  if (normalized.includes('cong cu') || normalized.includes('tools') || normalized.includes('build tools')) {
    return route(label, '/cong-cu', 'Map sang trung tâm công cụ.');
  }
  if (normalized.includes('cam nang') || normalized.includes('huong dan')) {
    return route(label, '/cam-nang', 'Map sang thư viện cẩm nang.');
  }
  if (normalized.includes('tinh nang') || normalized.includes('player skills') || normalized.includes('playstyles') || normalized.includes('gk skills')) {
    return route(label, '/tinh-nang', 'Map sang từ điển Skills & Playstyles.');
  }
  if (normalized.includes('thong bao') || normalized.includes('notifications')) {
    return route(label, '/thong-bao', 'Map sang dashboard thông báo hệ thống.');
  }
  if (normalized.includes('person') || normalized.includes('login') || normalized.includes('tham gia')) {
    return route(label, '/ho-so', 'Map sang hồ sơ local dashboard.');
  }
  if (normalized.includes('thu hang') || normalized.includes('leaderboard') || normalized.includes('giai dau')) {
    return route(label, '/tournaments', 'Map sang rankings/tournaments.');
  }
  if (normalized.includes('cong dong')) {
    return route(label, '/community', 'Map sang module cộng đồng.');
  }
  if (normalized.includes('chuyen nhuong')) {
    return route(label, '/chuyen-nhuong', 'Map sang transfer & pack watch route.');
  }
  if (normalized.includes('phan tich') || normalized.includes('analytics')) {
    return route(label, '/phan-tich', 'Map sang analytics hub.');
  }
  if (normalized.includes('chinh sach')) {
    return route(label, '/chinh-sach', 'Map sang trang chính sách.');
  }
  if (normalized.includes('dieu khoan')) {
    return route(label, '/dieu-khoan', 'Map sang trang điều khoản.');
  }
  if (normalized.includes('hop tac')) {
    return route(label, '/hop-tac', 'Map sang trang hợp tác.');
  }
  if (normalized.includes('ho tro')) {
    return route(label, '/ho-tro', 'Map sang trang hỗ trợ.');
  }
  if (normalized.includes('so sanh')) {
    return route(label, '/so-sanh', 'Map sang compare module.');
  }
  if (normalized.includes('bo loc nang cao') || normalized.includes('tune')) {
    return route(label, '/cau-thu', 'Bộ lọc nâng cao được gom vào trang cầu thủ.');
  }
  if (normalized.includes('chi tiet')) {
    return route(label, '/cau-thu/[id]', 'CTA dẫn vào player detail.');
  }
  if (normalized.includes('kham pha')) {
    return route(label, '/cam-nang#noi-bat', 'Map sang section nổi bật trong cẩm nang.');
  }
  if (normalized.includes('su dung ngay')) {
    return route(label, fileKey.includes('huong_dan') ? '/cam-nang' : '/cong-cu', 'CTA mở module thật thay cho button demo.');
  }
  if (normalized.includes('tao doi hinh') || normalized.includes('luu doi hinh') || normalized.includes('tu dong chon')) {
    return route(label, '/doi-hinh', 'Map sang lineup builder với action tương ứng.');
  }
  if (normalized.includes('4 2 1 3')) {
    return route(label, '/doi-hinh', 'Formation selector được thay bằng form thật trong lineup builder.');
  }
  if (normalized.includes('tat ca')) {
    if (rawFile.includes('t_i_n_k_n_ng')) return route(label, '/tinh-nang', 'Filter mặc định nằm trên glossary page.');
    if (rawFile.includes('hlv')) return route(label, '/hlv', 'Filter mặc định nằm trên managers page.');
    return route(label, '/cau-thu', 'Filter mặc định nằm trên players page.');
  }
  if (
    normalized === 'gk' ||
    normalized === 'cb' ||
    normalized === 'lb' ||
    normalized === 'rb' ||
    normalized === 'cmf' ||
    normalized === 'dmf' ||
    normalized === 'lmf' ||
    normalized === 'rmf' ||
    normalized.includes('tien dao') ||
    normalized.includes('tien ve') ||
    normalized.includes('hau ve') ||
    normalized.includes('thu mon')
  ) {
    return route(label, '/cau-thu', 'Bộ lọc vị trí được gom vào panel filter trên trang cầu thủ.');
  }
  if (normalized.includes('so do') || normalized.includes('loi choi') || normalized.includes('quoc tich')) {
    return route(label, '/hlv', 'Bộ lọc HLV được gom vào managers page.');
  }
  if (normalized.includes('thong ke') || normalized.includes('lich thi dau') || normalized.includes('tin tuc')) {
    return route(label, '/tournaments/[id]', 'Tabs đội tuyển được gom vào team detail thật.');
  }
  if (normalized.includes('xem tat ca')) {
    if (rawFile.includes('th_vi_n_h_ng_d_n')) return route(label, '/cam-nang', 'Link mở đầy đủ thư viện cẩm nang.');
    return route(label, '/cau-thu', 'Link mở danh sách đầy đủ của module tương ứng.');
  }
  if (normalized.includes('gioi thieu') || normalized.includes('ve chung toi')) {
    return route(label, '/', 'Landing page hiện đóng vai trò giới thiệu sản phẩm.');
  }
  if (normalized.includes('lien he')) {
    return route(label, '/ho-tro', 'Điểm vào thật cho hỗ trợ/liên hệ.');
  }
  if (normalized.includes('quyen rieng tu')) {
    return route(label, '/chinh-sach', 'Nội dung privacy được gộp vào trang chính sách.');
  }
  if (normalized.includes('hoc tap')) {
    return route(label, '/cam-nang', 'Mục học tập được gộp vào cẩm nang.');
  }
  if (normalized.includes('cai dat')) {
    return route(label, '/ho-so', 'Thiết lập được gộp vào hồ sơ local dashboard.');
  }
  if (normalized.includes('tan cong')) {
    return route(label, '/phan-tich#tan-cong', 'Section analytics cho tấn công đã có route thật.');
  }
  if (normalized.includes('phong ngu')) {
    return route(label, '/phan-tich#phong-ngu', 'Section analytics cho phòng ngự đã có route thật.');
  }
  if (normalized.includes('chi so')) {
    return route(label, '/phan-tich#chi-so', 'Section analytics cho chỉ số đã có route thật.');
  }
  if (
    normalized === '1' ||
    normalized === '2' ||
    normalized === '3' ||
    normalized === '12' ||
    normalized.includes('filter list')
  ) {
    return drop('Control phân trang hoặc toggle filter của template được thay bằng UI phân trang/lọc thật trong app.');
  }
  if (normalized.includes('compare arrows')) {
    return route(label, '/so-sanh', 'Icon compare được thay bằng compare module thật.');
  }
  if (
    normalized.includes('playstyle') ||
    normalized.includes('position') ||
    normalized.includes('offensive') ||
    normalized.includes('defensive') ||
    normalized.includes('balance')
  ) {
    return route(label, '/doi-hinh', 'Metrics và selector này đã được gom vào lineup builder thật.');
  }
  if (normalized.includes('add circle')) {
    return drop('Icon thêm cầu thủ trong template được thay bằng luồng chọn slot/cầu thủ thật.');
  }
  if (normalized.includes('ap dung bo loc') || normalized.includes('sap xep')) {
    if (rawFile.includes('hlv')) return route(label, '/hlv', 'Action filter/sort đã có trên managers page.');
    return route(label, '/cau-thu', 'Action filter/sort đã có trên players page.');
  }
  if (normalized.includes('upgrade')) {
    return drop('CTA monetization/premium không nằm trong scope web app hiện tại.');
  }
  if (type === 'button' && /(star|lock|chevron|menu|more|grid view)/.test(normalized)) {
    return drop('Control trang trí hoặc shell mobile được bỏ khi port sang web app.');
  }

  return unhandled('Chưa có parity rule cho control này.');
}

function renderMarkdown(report) {
  const lines = [];
  lines.push('# Stitch Control Parity Map');
  lines.push('');
  lines.push(`- Generated at: ${report.generatedAt}`);
  lines.push(`- Stitch root: ${report.stitchRoot}`);
  lines.push(`- Files scanned: ${report.summary.totalFiles}`);
  lines.push(`- Controls scanned: ${report.summary.totalControls}`);
  lines.push(`- Mapped: ${report.summary.mapped}`);
  lines.push(`- Should drop: ${report.summary.shouldDrop}`);
  lines.push(`- Unmapped: ${report.summary.unmapped}`);
  lines.push('');
  lines.push('## Module Summary');
  lines.push('');
  lines.push('| Module | Controls | Mapped | Should drop | Unmapped |');
  lines.push('| --- | ---: | ---: | ---: | ---: |');
  report.modules.forEach((module) => {
    lines.push(
      `| ${module.module} | ${module.totalControls} | ${module.mapped} | ${module.shouldDrop} | ${module.unmapped} |`
    );
  });
  lines.push('');
  lines.push('## Control Table');
  lines.push('');
  lines.push('| File | Module | Type | Label | Status | Target | Reason |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  report.controls.forEach((control) => {
    lines.push(
      `| \`${control.file}\` | ${control.module} | ${control.type} | ${control.label.replaceAll('|', '\\|')} | ${control.status} | ${control.target || '-'} | ${control.reason.replaceAll('|', '\\|')} |`
    );
  });
  lines.push('');
  return `${lines.join('\n')}\n`;
}

async function main() {
  const stitchRoot = await resolveStitchRoot();
  const files = await collectCodeHtmlFiles(stitchRoot);
  const report = {
    generatedAt: new Date().toISOString(),
    stitchRoot,
    summary: {
      totalFiles: files.length,
      totalControls: 0,
      mapped: 0,
      shouldDrop: 0,
      unmapped: 0
    },
    modules: [],
    controls: []
  };

  const moduleStats = new Map();

  for (const absoluteFile of files) {
    const html = await fs.readFile(absoluteFile, 'utf8');
    const parsed = parseControls(html);
    const relativeFile = path.relative(stitchRoot, absoluteFile).replaceAll(path.sep, '/');
    const module = moduleFromFile(relativeFile);

    if (!moduleStats.has(module)) {
      moduleStats.set(module, {
        module,
        totalControls: 0,
        mapped: 0,
        shouldDrop: 0,
        unmapped: 0
      });
    }

    for (const control of parsed) {
      const classification = classifyControl({ ...control, file: relativeFile });
      report.controls.push({
        file: relativeFile,
        module,
        type: control.type,
        label: control.label,
        href: control.href,
        status: classification.status,
        target: classification.target,
        reason: classification.reason
      });
      report.summary.totalControls += 1;
      if (classification.status === 'mapped') {
        report.summary.mapped += 1;
      } else if (classification.status === 'should_drop') {
        report.summary.shouldDrop += 1;
      } else {
        report.summary.unmapped += 1;
      }

      const stats = moduleStats.get(module);
      stats.totalControls += 1;
      if (classification.status === 'mapped') {
        stats.mapped += 1;
      } else if (classification.status === 'should_drop') {
        stats.shouldDrop += 1;
      } else {
        stats.unmapped += 1;
      }
    }
  }

  report.modules = Array.from(moduleStats.values()).sort((a, b) => a.module.localeCompare(b.module));

  await fs.mkdir(path.dirname(REPORT_MD), { recursive: true });
  await fs.writeFile(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await fs.writeFile(REPORT_MD, renderMarkdown(report), 'utf8');

  console.log(`Stitch parity map complete: ${report.summary.mapped} mapped, ${report.summary.shouldDrop} should_drop, ${report.summary.unmapped} unmapped.`);
  console.log(`- Markdown report: ${REPORT_MD}`);
  console.log(`- JSON report: ${REPORT_JSON}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[stitch:parity] ${message}`);
  process.exit(1);
});
