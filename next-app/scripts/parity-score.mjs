#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_FILE = 'docs/parity/efhub-parity-checklist.json';
const DEFAULT_MIN_SCORE_ENV = 'EFVN_PARITY_MIN_SCORE';
const STATUS_MULTIPLIER = {
  pass: 1,
  partial: 0.5,
  fail: 0,
  todo: 0,
  na: null
};

function parseArgs(argv) {
  const output = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      continue;
    }
    const key = arg.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      output[key] = 'true';
      continue;
    }
    output[key] = value;
    index += 1;
  }
  return output;
}

function toNumber(value, fallback = NaN) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function pad(text, width) {
  const value = String(text);
  return value.length >= width ? value : `${value}${' '.repeat(width - value.length)}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const checklistPath = path.resolve(process.cwd(), args.file || DEFAULT_FILE);
  const cliMinScore = toNumber(args.min, NaN);
  const envMinScore = toNumber(process.env[DEFAULT_MIN_SCORE_ENV], NaN);
  const minScore = Number.isFinite(cliMinScore) ? cliMinScore : envMinScore;
  const asJson = args.json === 'true';

  const raw = await fs.readFile(checklistPath, 'utf8');
  const parsed = JSON.parse(raw);
  const modules = Array.isArray(parsed.modules) ? parsed.modules : [];

  if (modules.length === 0) {
    throw new Error(`No modules found in checklist: ${checklistPath}`);
  }

  const moduleSummaries = modules.map((module) => {
    const checks = Array.isArray(module.checks) ? module.checks : [];
    let possible = 0;
    let earned = 0;

    checks.forEach((check) => {
      const weight = Number(check.weight || 0);
      if (!Number.isFinite(weight) || weight <= 0) {
        return;
      }

      const status = String(check.status || 'todo').toLowerCase();
      const multiplier =
        Object.prototype.hasOwnProperty.call(STATUS_MULTIPLIER, status)
          ? STATUS_MULTIPLIER[status]
          : STATUS_MULTIPLIER.todo;

      if (multiplier === null) {
        return;
      }

      possible += weight;
      earned += weight * multiplier;
    });

    return {
      id: String(module.id || ''),
      name: String(module.name || ''),
      weight: Number(module.weight || 0),
      checks: checks.length,
      earned: round2(earned),
      possible: round2(possible),
      percent: possible > 0 ? round2((earned / possible) * 100) : 100
    };
  });

  const totalEarned = round2(moduleSummaries.reduce((sum, item) => sum + item.earned, 0));
  const totalPossible = round2(moduleSummaries.reduce((sum, item) => sum + item.possible, 0));
  const totalPercent = totalPossible > 0 ? round2((totalEarned / totalPossible) * 100) : 100;

  const output = {
    checklistFile: checklistPath,
    referenceSite: parsed.referenceSite || null,
    updatedAt: parsed.updatedAt || null,
    minimumRequiredPercent: Number.isFinite(minScore) ? minScore : null,
    total: {
      earned: totalEarned,
      possible: totalPossible,
      percent: totalPercent
    },
    modules: moduleSummaries
  };

  if (asJson) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(output, null, 2));
  } else {
    // eslint-disable-next-line no-console
    console.log(`Parity Score: ${totalPercent}% (${totalEarned}/${totalPossible})`);
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log(
      `${pad('Module', 30)} ${pad('Score', 12)} ${pad('Percent', 10)} Checks`
    );
    // eslint-disable-next-line no-console
    console.log('-'.repeat(72));
    moduleSummaries.forEach((item) => {
      // eslint-disable-next-line no-console
      console.log(
        `${pad(item.name, 30)} ${pad(`${item.earned}/${item.possible}`, 12)} ${pad(`${item.percent}%`, 10)} ${item.checks}`
      );
    });

    if (Number.isFinite(minScore)) {
      const gatePassed = totalPercent >= minScore;
      // eslint-disable-next-line no-console
      console.log('');
      // eslint-disable-next-line no-console
      console.log(`Minimum Required: ${minScore}%`);
      // eslint-disable-next-line no-console
      console.log(`Gate Result: ${gatePassed ? 'PASS' : 'FAIL'}`);
    }
  }

  if (Number.isFinite(minScore) && totalPercent < minScore) {
    // eslint-disable-next-line no-console
    console.error(
      `[parity:score] Gate failed: ${totalPercent}% < ${minScore}% (set by --min or ${DEFAULT_MIN_SCORE_ENV}).`
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  // eslint-disable-next-line no-console
  console.error(`[parity:score] ${message}`);
  process.exit(1);
});
