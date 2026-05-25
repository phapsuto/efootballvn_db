#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const STITCH_ROOT = path.resolve(ROOT, '../stitch');
const REPORT_MD = path.resolve(ROOT, 'docs/parity/stitch-controls-audit.md');
const REPORT_JSON = path.resolve(ROOT, 'docs/parity/stitch-controls-audit.json');

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTagLabel(rawTag) {
  const withoutTags = rawTag.replace(/<[^>]+>/g, ' ');
  return normalizeWhitespace(withoutTags).slice(0, 80);
}

function parseControls(html) {
  const buttons = [];
  const anchors = [];

  const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  let buttonMatch;
  while ((buttonMatch = buttonRegex.exec(html))) {
    const attrs = buttonMatch[1] || '';
    const body = buttonMatch[2] || '';
    const text = cleanTagLabel(body);
    const hasDataAction = /\bdata-action\s*=/.test(attrs);
    buttons.push({
      text: text || '[icon-only]',
      hasDataAction
    });
  }

  const anchorRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let anchorMatch;
  while ((anchorMatch = anchorRegex.exec(html))) {
    const attrs = anchorMatch[1] || '';
    const body = anchorMatch[2] || '';
    const text = cleanTagLabel(body);
    const hrefMatch = attrs.match(/\bhref\s*=\s*"([^"]*)"/i) || attrs.match(/\bhref\s*=\s*'([^']*)'/i);
    const href = normalizeWhitespace(hrefMatch?.[1] || '');
    anchors.push({
      text: text || '[icon-only]',
      href
    });
  }

  return { buttons, anchors };
}

function toRelativeFilePath(absolutePath) {
  return path.relative(STITCH_ROOT, absolutePath).replaceAll(path.sep, '/');
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

function renderMarkdown(report) {
  const lines = [];
  lines.push('# Stitch Controls Audit');
  lines.push('');
  lines.push(`- Generated at: ${report.generatedAt}`);
  lines.push(`- Stitch files scanned: ${report.summary.totalFiles}`);
  lines.push(`- Total buttons: ${report.summary.totalButtons}`);
  lines.push(`- Buttons with \`data-action\`: ${report.summary.buttonsWithDataAction}`);
  lines.push(`- Anchor links: ${report.summary.totalAnchors}`);
  lines.push(`- Placeholder anchors (\`href="#"\`): ${report.summary.placeholderAnchors}`);
  lines.push(`- Likely placeholder buttons (no \`data-action\`): ${report.summary.placeholderButtons}`);
  lines.push('');
  lines.push('## Files');
  lines.push('');
  lines.push('| File | Buttons | `data-action` | Anchors | `href="#"` | Likely Placeholder Buttons |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: |');

  report.files.forEach((file) => {
    lines.push(
      `| \`${file.file}\` | ${file.totalButtons} | ${file.buttonsWithDataAction} | ${file.totalAnchors} | ${file.placeholderAnchors} | ${file.placeholderButtons} |`
    );
  });

  lines.push('');
  lines.push('## Top Placeholder Controls');
  lines.push('');
  if (report.topPlaceholderControls.length === 0) {
    lines.push('- Không phát hiện placeholder control.');
  } else {
    report.topPlaceholderControls.forEach((item) => {
      lines.push(`- \`${item.file}\`: ${item.controlType} -> ${item.label}`);
    });
  }

  lines.push('');
  lines.push('## Interpretation');
  lines.push('');
  lines.push(
    '- Đây là audit template UI Stitch: nhiều control được thiết kế để demo visual nên chưa có route/action thật.'
  );
  lines.push(
    '- Khi port vào Next app, các control quan trọng cần map sang route API/UI thật thay vì giữ `href="#"` hoặc button rỗng.'
  );

  return `${lines.join('\n')}\n`;
}

async function main() {
  const files = await collectCodeHtmlFiles(STITCH_ROOT);
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalFiles: 0,
      totalButtons: 0,
      buttonsWithDataAction: 0,
      totalAnchors: 0,
      placeholderAnchors: 0,
      placeholderButtons: 0
    },
    files: [],
    topPlaceholderControls: []
  };

  for (const file of files) {
    const html = await fs.readFile(file, 'utf8');
    const { buttons, anchors } = parseControls(html);

    const buttonsWithDataAction = buttons.filter((item) => item.hasDataAction).length;
    const placeholderButtons = buttons.filter((item) => !item.hasDataAction);
    const placeholderAnchors = anchors.filter(
      (item) => item.href === '#' || item.href === '' || item.href.toLowerCase() === 'javascript:void(0)'
    );

    const fileSummary = {
      file: toRelativeFilePath(file),
      totalButtons: buttons.length,
      buttonsWithDataAction,
      totalAnchors: anchors.length,
      placeholderAnchors: placeholderAnchors.length,
      placeholderButtons: placeholderButtons.length
    };
    report.files.push(fileSummary);

    report.summary.totalFiles += 1;
    report.summary.totalButtons += buttons.length;
    report.summary.buttonsWithDataAction += buttonsWithDataAction;
    report.summary.totalAnchors += anchors.length;
    report.summary.placeholderAnchors += placeholderAnchors.length;
    report.summary.placeholderButtons += placeholderButtons.length;

    placeholderAnchors.slice(0, 5).forEach((item) => {
      report.topPlaceholderControls.push({
        file: fileSummary.file,
        controlType: 'anchor',
        label: `${item.text || '[link]'} (href="#")`
      });
    });
    placeholderButtons.slice(0, 5).forEach((item) => {
      report.topPlaceholderControls.push({
        file: fileSummary.file,
        controlType: 'button',
        label: item.text || '[button]'
      });
    });
  }

  await fs.mkdir(path.dirname(REPORT_MD), { recursive: true });
  await fs.writeFile(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await fs.writeFile(REPORT_MD, renderMarkdown(report), 'utf8');

  // eslint-disable-next-line no-console
  console.log(
    `Stitch controls audit complete: ${report.summary.totalFiles} files, ${report.summary.placeholderAnchors} placeholder anchors, ${report.summary.placeholderButtons} placeholder buttons.`
  );
  // eslint-disable-next-line no-console
  console.log(`- Markdown report: ${REPORT_MD}`);
  // eslint-disable-next-line no-console
  console.log(`- JSON report: ${REPORT_JSON}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  // eslint-disable-next-line no-console
  console.error(`[audit:stitch] ${message}`);
  process.exit(1);
});
