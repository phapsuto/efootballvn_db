#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const PROJECT_ROOT = process.cwd();
const TARGET_DIRECTORIES = ['app', 'components'];
const OUTPUT_JSON = path.resolve(PROJECT_ROOT, 'docs', 'parity', 'localization-audit.json');
const OUTPUT_MD = path.resolve(PROJECT_ROOT, 'docs', 'parity', 'localization-audit.md');

const DISALLOWED_PATTERNS = [
  { label: 'auto fill', regex: /\bauto fill\b/i },
  { label: 'deep-link', regex: /\bdeep-link\b/i },
  { label: 'ranking team', regex: /\branking team\b/i },
  { label: 'player detail', regex: /\bplayer detail\b/i },
  { label: 'Tactical Fit', regex: /\bTactical Fit\b/i },
  { label: 'team chemistry', regex: /\bteam chemistry\b/i },
  { label: 'Fit style', regex: /\bFit style\b/i },
  { label: 'Role affinity', regex: /\bRole affinity\b/i },
  { label: 'Tactical score', regex: /\bTactical score\b/i }
];

async function walk(directoryPath) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolutePath)));
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) {
      continue;
    }
    files.push(absolutePath);
  }

  return files;
}

function toRelative(filePath) {
  return path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');
}

function buildMarkdown(report) {
  const lines = [
    '# Localization Audit',
    '',
    `- Generated at: ${report.generatedAt}`,
    `- Status: ${report.ok ? 'pass' : 'fail'}`,
    `- Files scanned: ${report.filesScanned}`,
    `- Findings: ${report.findings.length}`,
    ''
  ];

  if (report.findings.length === 0) {
    lines.push('- Không phát hiện residual English UI phrase nằm trong danh sách cấm.');
    return `${lines.join('\n')}\n`;
  }

  lines.push('| Phrase | File | Line | Snippet |');
  lines.push('| --- | --- | --- | --- |');
  report.findings.forEach((finding) => {
    lines.push(
      `| ${finding.label} | ${finding.file} | ${finding.line} | ${finding.snippet.replace(/\|/g, '\\|')} |`
    );
  });
  return `${lines.join('\n')}\n`;
}

async function main() {
  const files = [];
  for (const directory of TARGET_DIRECTORIES) {
    const absoluteDirectory = path.resolve(PROJECT_ROOT, directory);
    files.push(...(await walk(absoluteDirectory)));
  }

  const findings = [];

  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      DISALLOWED_PATTERNS.forEach((pattern) => {
        if (!pattern.regex.test(line)) {
          return;
        }
        findings.push({
          label: pattern.label,
          file: toRelative(filePath),
          line: index + 1,
          snippet: line.trim()
        });
      });
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    ok: findings.length === 0,
    filesScanned: files.length,
    findings
  };

  await fs.mkdir(path.dirname(OUTPUT_JSON), { recursive: true });
  await fs.writeFile(OUTPUT_JSON, JSON.stringify(report, null, 2), 'utf8');
  await fs.writeFile(OUTPUT_MD, buildMarkdown(report), 'utf8');

  // eslint-disable-next-line no-console
  console.log(
    `[audit-localization] ${report.ok ? 'pass' : 'fail'} files=${report.filesScanned} findings=${report.findings.length}`
  );

  if (!report.ok) {
    process.exit(1);
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(`[audit-localization] ${error.message}`);
  process.exit(1);
});
