#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUTPUT_DIR = path.resolve(REPO_ROOT, '..', 'scraped-output', 'bootstrap');

const SOURCES = [
  {
    input: path.resolve(REPO_ROOT, 'lib', 'data', 'mockManagers.ts'),
    exportName: 'MOCK_MANAGERS',
    output: 'managers.seed.json'
  },
  {
    input: path.resolve(REPO_ROOT, 'lib', 'data', 'mockPacks.ts'),
    exportName: 'MOCK_PACKS',
    output: 'packs.seed.json'
  },
  {
    input: path.resolve(REPO_ROOT, 'lib', 'data', 'mockCommunity.ts'),
    exportName: 'MOCK_COMMUNITY_PROFILES',
    output: 'community.seed.json'
  },
  {
    input: path.resolve(REPO_ROOT, 'lib', 'data', 'mockLeague.ts'),
    exportName: 'MOCK_LEAGUE_TEAMS',
    output: 'league.seed.json'
  },
  {
    input: path.resolve(REPO_ROOT, 'lib', 'data', 'mockBuilds.ts'),
    exportName: 'MOCK_PLAYER_BUILDS',
    output: 'builds.seed.json'
  }
];

function transformTypeScriptModule(source, exportName) {
  return source
    .replace(/^import type .*$/gm, '')
    .replace(
      new RegExp(`export const ${exportName}\\s*:[^=]+=`),
      'globalThis.__seedData ='
    );
}

async function loadSeedData(inputPath, exportName) {
  const source = await readFile(inputPath, 'utf8');
  const transformed = transformTypeScriptModule(source, exportName);
  const context = { globalThis: {}, console };
  vm.createContext(context);
  vm.runInContext(transformed, context, { filename: inputPath });

  const data = context.globalThis.__seedData;
  if (!Array.isArray(data)) {
    throw new Error(`Expected ${exportName} to evaluate to an array in ${inputPath}`);
  }
  return data;
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const report = [];
  for (const source of SOURCES) {
    const data = await loadSeedData(source.input, source.exportName);
    const outputPath = path.resolve(OUTPUT_DIR, source.output);
    await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    report.push({ file: outputPath, count: data.length });
  }

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
