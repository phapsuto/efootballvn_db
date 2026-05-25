#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { MongoClient } from 'mongodb';
import { loadLocalEnv } from './load-local-env.mjs';

await loadLocalEnv(process.cwd());

const DEFAULT_REPORT_PATH = path.resolve(
  process.cwd(),
  '..',
  'scraped-output',
  'status',
  'import-report.json'
);

const DIFF_SKIP_PATHS = new Set(['_id', 'createdAt', 'updatedAt', 'source.scrapedAt']);

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

function toStringValue(value, fallback = '') {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
}

function toNumberValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => toStringValue(item)).filter(Boolean);
}

function toObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function slugify(value) {
  const base = toStringValue(value).toLowerCase();
  if (!base) {
    return '';
  }
  return base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeConditionGrade(value) {
  const upper = toStringValue(value, 'C').toUpperCase();
  return ['A', 'B', 'C', 'D', 'E'].includes(upper) ? upper : 'C';
}

function normalizeVisibility(value) {
  const normalized = toStringValue(value, 'public').toLowerCase();
  return normalized === 'private' ? 'private' : 'public';
}

function normalizeBuildSource(value) {
  const normalized = toStringValue(value, 'community').toLowerCase();
  return normalized === 'user' ? 'user' : 'community';
}

function normalizeLeagueMode(value) {
  const normalized = toStringValue(value, 'mobile_coop').toLowerCase();
  return normalized === 'crossplay_coop' ? 'crossplay_coop' : 'mobile_coop';
}

function normalizeRegion(value) {
  const normalized = toStringValue(value).toLowerCase();
  if (!normalized) {
    return 'Asia & Pacific';
  }
  if (['eu', 'europe', 'chau-au', 'châu âu'].includes(normalized)) {
    return 'Europe';
  }
  if (['americas', 'america', 'north america', 'south america'].includes(normalized)) {
    return 'Americas';
  }
  if (['middle east & africa', 'middle east', 'africa', 'mea'].includes(normalized)) {
    return 'Middle East & Africa';
  }
  return 'Asia & Pacific';
}

function normalizeNumberRecord(value, options = {}) {
  const source = toObject(value);
  const output = {};
  const min = Number.isFinite(Number(options.min)) ? Number(options.min) : 0;
  const max = Number.isFinite(Number(options.max)) ? Number(options.max) : 120;
  Object.entries(source).forEach(([key, raw]) => {
    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) {
      return;
    }
    output[toStringValue(key)] = clamp(Math.round(numeric), min, max);
  });
  return output;
}

function normalizePerLevelStats(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }
  return entries
    .map((entry) => {
      const source = toObject(entry);
      const level = Math.max(1, Math.round(toNumberValue(source.level, 1)));
      const normalized = {
        level,
        stats: normalizeNumberRecord(source.stats, { min: 0, max: 120 })
      };

      const overall = Number(source.overall);
      if (Number.isFinite(overall)) {
        normalized.overall = clamp(Math.round(overall), 1, 120);
      }

      return normalized;
    })
    .filter((entry) => Object.keys(entry.stats).length > 0)
    .sort((a, b) => a.level - b.level);
}

function toIsoDate(value) {
  if (value instanceof Date) {
    return value;
  }
  const raw = toStringValue(value);
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? new Date(parsed) : new Date();
}

function getExtractionCandidates(label) {
  switch (label) {
    case 'players':
      return ['players', 'data', 'items', 'results'];
    case 'managers':
      return ['managers', 'data', 'items', 'results'];
    case 'packs':
      return ['packs', 'data', 'items', 'results'];
    case 'community':
      return ['community', 'profiles', 'data', 'items', 'results'];
    case 'league':
      return ['league', 'teams', 'data', 'items', 'results'];
    case 'builds':
      return ['builds', 'data', 'items', 'results'];
    default:
      return ['data', 'items', 'results'];
  }
}

async function readJsonEntries(filePath, label) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const raw = await fs.readFile(absolutePath, 'utf8');
  const parsed = JSON.parse(raw);

  if (Array.isArray(parsed)) {
    return {
      absolutePath,
      records: parsed,
      payloadShape: 'array',
      extractedKey: null,
      generatedAt: null,
      summary: null
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`${label} must be a JSON array or object payload: ${absolutePath}`);
  }

  const candidates = getExtractionCandidates(label);
  for (const candidate of candidates) {
    if (Array.isArray(parsed[candidate])) {
      return {
        absolutePath,
        records: parsed[candidate],
        payloadShape: 'object',
        extractedKey: candidate,
        generatedAt: toStringValue(parsed.generatedAt) || null,
        summary: toObject(parsed.summary)
      };
    }
  }

  throw new Error(
    `${label} payload does not contain an array under keys: ${candidates.join(', ')} (${absolutePath})`
  );
}

function sanitizeForDiff(value, pathSegments = []) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeForDiff(entry, pathSegments));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  const output = {};
  Object.entries(value).forEach(([key, nestedValue]) => {
    const nextPathSegments = [...pathSegments, key];
    const nextPath = nextPathSegments.join('.');
    if (DIFF_SKIP_PATHS.has(nextPath)) {
      return;
    }
    const sanitized = sanitizeForDiff(nestedValue, nextPathSegments);
    if (sanitized === undefined) {
      return;
    }
    output[key] = sanitized;
  });
  return output;
}

function stableSerialize(value) {
  const normalizeValue = (current) => {
    if (Array.isArray(current)) {
      return current.map((entry) => normalizeValue(entry));
    }
    if (current && typeof current === 'object') {
      return Object.keys(current)
        .sort()
        .reduce((accumulator, key) => {
          accumulator[key] = normalizeValue(current[key]);
          return accumulator;
        }, {});
    }
    return current;
  };

  return JSON.stringify(normalizeValue(sanitizeForDiff(value)));
}

function zeroWriteResult() {
  return {
    upsertedCount: 0,
    modifiedCount: 0,
    matchedCount: 0
  };
}

function sampleKeys(list) {
  return list.slice(0, 5);
}

function normalizePack(item) {
  const source = toObject(item.source);
  const id =
    toStringValue(item.id) ||
    toStringValue(item.packId) ||
    toStringValue(item.efhubId) ||
    toStringValue(item.slug);

  if (!id) {
    return null;
  }

  const startsAt = toIsoDate(item.startsAt || item.startAt || item.createdAt);
  const endsAt = toIsoDate(item.endsAt || item.endAt || item.updatedAt || startsAt);
  const name = toStringValue(item.name, 'Unknown Pack');
  const slug = toStringValue(item.slug) || slugify(name) || slugify(id) || id;

  return {
    id,
    slug,
    name,
    type: toStringValue(item.type, 'Unknown'),
    bannerImage: toStringValue(item.bannerImage),
    startsAt,
    endsAt,
    playerIds: toStringArray(item.playerIds),
    source: {
      site: toStringValue(source.site, 'scraped'),
      packUrl: toStringValue(source.packUrl, toStringValue(item.packUrl)),
      scrapedAt: toIsoDate(source.scrapedAt || item.updatedAt || item.createdAt || startsAt)
    },
    updatedAt: new Date()
  };
}

function normalizeCommunity(item) {
  const id =
    toStringValue(item.id) ||
    toStringValue(item.profileId) ||
    toStringValue(item.username) ||
    toStringValue(item.handle);

  if (!id) {
    return null;
  }

  return {
    id,
    username: toStringValue(item.username, toStringValue(item.handle, id)),
    displayName: toStringValue(item.displayName, toStringValue(item.username, id)),
    avatarUrl: toStringValue(item.avatarUrl),
    region: normalizeRegion(item.region),
    country: toStringValue(item.country, 'Unknown'),
    following: Math.max(0, Math.round(toNumberValue(item.following, 0))),
    followers: Math.max(0, Math.round(toNumberValue(item.followers, 0))),
    buildsCount: Math.max(0, Math.round(toNumberValue(item.buildsCount, 0))),
    favoritePlayerId: toStringValue(item.favoritePlayerId) || undefined,
    updatedAt: new Date()
  };
}

function normalizeLeague(item) {
  const id = toStringValue(item.id) || toStringValue(item.teamId) || toStringValue(item.name);
  if (!id) {
    return null;
  }

  return {
    id,
    name: toStringValue(item.name, 'Unknown Team'),
    logoUrl: toStringValue(item.logoUrl),
    members: Math.max(1, Math.round(toNumberValue(item.members, 1))),
    points: Math.max(0, Math.round(toNumberValue(item.points, 0))),
    mode: normalizeLeagueMode(item.mode),
    updatedAt: toIsoDate(item.updatedAt || item.lastUpdated || item.createdAt)
  };
}

function normalizeBuild(item) {
  const id =
    toStringValue(item.id) ||
    toStringValue(item.buildId) ||
    `build_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const playerId = toStringValue(item.playerId) || toStringValue(item.efhubId);
  if (!playerId) {
    return null;
  }

  const allocationSource = toObject(item.allocations);
  const allocations = {
    shooting: Math.max(0, Math.round(toNumberValue(allocationSource.shooting, 0))),
    passing: Math.max(0, Math.round(toNumberValue(allocationSource.passing, 0))),
    dribbling: Math.max(0, Math.round(toNumberValue(allocationSource.dribbling, 0))),
    dexterity: Math.max(0, Math.round(toNumberValue(allocationSource.dexterity, 0))),
    lowerBodyStrength: Math.max(
      0,
      Math.round(toNumberValue(allocationSource.lowerBodyStrength, 0))
    ),
    aerialStrength: Math.max(0, Math.round(toNumberValue(allocationSource.aerialStrength, 0))),
    defending: Math.max(0, Math.round(toNumberValue(allocationSource.defending, 0))),
    gk1: Math.max(0, Math.round(toNumberValue(allocationSource.gk1, 0))),
    gk2: Math.max(0, Math.round(toNumberValue(allocationSource.gk2, 0))),
    gk3: Math.max(0, Math.round(toNumberValue(allocationSource.gk3, 0)))
  };
  const derivedPointsUsed = Object.values(allocations).reduce(
    (sum, value) => sum + Math.max(0, Number(value || 0)),
    0
  );

  return {
    id,
    playerId,
    name: toStringValue(item.name, 'Build'),
    level: Math.max(1, Math.round(toNumberValue(item.level, 1))),
    condition: normalizeConditionGrade(item.condition),
    allocations,
    pointsUsed: Math.max(0, Math.round(toNumberValue(item.pointsUsed, derivedPointsUsed))),
    likes: Math.max(0, Math.round(toNumberValue(item.likes, 0))),
    visibility: normalizeVisibility(item.visibility),
    authorId: toStringValue(item.authorId, 'guest'),
    authorName: toStringValue(item.authorName, 'Anonymous'),
    authorCountry: toStringValue(item.authorCountry) || undefined,
    source: normalizeBuildSource(item.source),
    createdAt: toIsoDate(item.createdAt),
    updatedAt: toIsoDate(item.updatedAt || item.createdAt)
  };
}

function normalizePlayer(item) {
  const source = toObject(item.source);
  const stats = toObject(item.stats);
  const overall = toObject(item.overall);
  const levels = toObject(item.levels);
  const condition = toObject(item.condition);
  const images = toObject(item.images);

  const efhubId =
    toStringValue(item.efhubId) || toStringValue(item.id) || toStringValue(item.playerId);

  if (!efhubId) {
    return null;
  }

  const name = toStringValue(item.name, 'Unknown Player');
  const statsLevel1 = normalizeNumberRecord(stats.level1, { min: 0, max: 120 });
  const statsMaxLevel = normalizeNumberRecord(stats.maxLevel, { min: 0, max: 120 });
  const levelsMax = Math.max(
    1,
    Math.round(toNumberValue(levels.max, toNumberValue(item.maxLevel, 1)))
  );
  const levelsCurrent = clamp(
    Math.max(1, Math.round(toNumberValue(levels.current, 1))),
    1,
    levelsMax
  );
  const pointsCapRaw = Math.max(0, Math.round(toNumberValue(toObject(item.build).pointsCap, 0)));
  const pointsCap = pointsCapRaw > 0 ? pointsCapRaw : Math.max(0, (levelsMax - 1) * 2);
  const overallBase = clamp(
    Math.round(toNumberValue(overall.base, toNumberValue(item.overallBase, 1))),
    1,
    120
  );
  const overallMax = clamp(
    Math.max(
      overallBase,
      Math.round(toNumberValue(overall.max, toNumberValue(item.overallMax, overallBase)))
    ),
    1,
    120
  );
  const normalizedSlug =
    toStringValue(item.slug) || slugify(name) || slugify(efhubId) || efhubId;
  const positions = Array.from(
    new Set(toStringArray(item.positions).map((position) => position.toUpperCase()))
  ).filter(Boolean);
  const conditionGrade = normalizeConditionGrade(condition.form);
  const conditionInjury = clamp(
    Math.round(toNumberValue(condition.injuryResistance, 2)),
    1,
    3
  );
  const positionRatings = normalizeNumberRecord(item.positionRatings, { min: 40, max: 120 });
  const perLevelStats = normalizePerLevelStats(stats.perLevel);

  return {
    efhubId,
    slug: normalizedSlug,
    name,
    shortName: toStringValue(item.shortName, name),
    nationality: toStringValue(item.nationality, 'Unknown'),
    club: toStringValue(item.club, 'Unknown Club'),
    league: toStringValue(item.league, 'Unknown League'),
    positions: positions.length > 0 ? positions : ['CF'],
    cardType: toStringValue(item.cardType, 'Standard'),
    rarity: toStringValue(item.rarity, toStringValue(item.cardType, 'Standard')),
    overall: {
      base: overallBase,
      max: overallMax
    },
    levels: {
      current: levelsCurrent,
      max: levelsMax
    },
    stats: {
      level1: statsLevel1,
      maxLevel: statsMaxLevel,
      perLevel: perLevelStats
    },
    skills: toStringArray(item.skills),
    playstyles: toStringArray(item.playstyles),
    condition: {
      form: conditionGrade,
      injuryResistance: conditionInjury
    },
    build: {
      pointsCap
    },
    positionRatings,
    images: {
      card: toStringValue(images.card),
      portrait: toStringValue(images.portrait),
      thumbnail: toStringValue(images.thumbnail)
    },
    source: {
      site: toStringValue(source.site, 'scraped'),
      playerUrl: toStringValue(source.playerUrl),
      scrapedAt: source.scrapedAt ? new Date(source.scrapedAt) : new Date()
    },
    updatedAt: new Date()
  };
}

function normalizeManager(item) {
  const source = toObject(item.source);
  const proficiency = toObject(item.playstyleProficiency);
  const affinity = toObject(item.affinity);
  const efhubId =
    toStringValue(item.efhubId) || toStringValue(item.id) || toStringValue(item.managerId);

  if (!efhubId) {
    return null;
  }

  return {
    efhubId,
    name: toStringValue(item.name, 'Unknown Manager'),
    shortName: toStringValue(item.shortName, toStringValue(item.name, 'Unknown Manager')),
    nationality: toStringValue(item.nationality, 'Unknown'),
    team: toStringValue(item.team, 'Unknown Team'),
    formation: toStringValue(item.formation, '4-3-3'),
    playstyleProficiency: {
      quickCounter: clamp(Math.round(toNumberValue(proficiency.quickCounter, 0)), 0, 100),
      possessionGame: clamp(Math.round(toNumberValue(proficiency.possessionGame, 0)), 0, 100),
      longBallCounter: clamp(Math.round(toNumberValue(proficiency.longBallCounter, 0)), 0, 100),
      outWide: clamp(Math.round(toNumberValue(proficiency.outWide, 0)), 0, 100),
      longBall: clamp(Math.round(toNumberValue(proficiency.longBall, 0)), 0, 100)
    },
    affinity: {
      attack: clamp(Math.round(toNumberValue(affinity.attack, 0)), 0, 100),
      midfield: clamp(Math.round(toNumberValue(affinity.midfield, 0)), 0, 100),
      defense: clamp(Math.round(toNumberValue(affinity.defense, 0)), 0, 100)
    },
    imageUrl: toStringValue(item.imageUrl),
    source: {
      site: toStringValue(source.site, 'scraped'),
      managerUrl: toStringValue(source.managerUrl),
      scrapedAt: source.scrapedAt ? new Date(source.scrapedAt) : new Date()
    },
    updatedAt: new Date()
  };
}

async function importEntity(db, options) {
  const {
    entity,
    filePath,
    collectionName,
    keyField,
    normalizer
  } = options;

  const input = await readJsonEntries(filePath, entity);
  const normalizedRecords = input.records.map(normalizer).filter(Boolean);
  const dedupedByKey = new Map();
  const duplicateKeys = [];

  normalizedRecords.forEach((record) => {
    const key = toStringValue(record[keyField]);
    if (!key) {
      return;
    }
    if (dedupedByKey.has(key)) {
      duplicateKeys.push(key);
    }
    dedupedByKey.set(key, record);
  });

  const records = [...dedupedByKey.values()];
  const keys = records.map((record) => toStringValue(record[keyField])).filter(Boolean);
  const collection = db.collection(collectionName);
  const existingDocuments =
    keys.length > 0 ? await collection.find({ [keyField]: { $in: keys } }).toArray() : [];
  const existingByKey = new Map(
    existingDocuments.map((document) => [toStringValue(document[keyField]), document])
  );

  const operations = [];
  const newKeys = [];
  const updatedKeys = [];
  const unchangedKeys = [];

  records.forEach((record) => {
    const key = toStringValue(record[keyField]);
    const recordCreatedAt = record.createdAt instanceof Date ? record.createdAt : new Date();
    const { createdAt: _createdAt, ...mutableRecord } = record;
    const previous = existingByKey.get(key);
    if (!previous) {
      newKeys.push(key);
      operations.push({
        updateOne: {
          filter: { [keyField]: key },
          update: { $set: mutableRecord, $setOnInsert: { createdAt: recordCreatedAt } },
          upsert: true
        }
      });
      return;
    }

    const previousSerialized = stableSerialize(previous);
    const nextSerialized = stableSerialize(record);
    if (previousSerialized === nextSerialized) {
      unchangedKeys.push(key);
      return;
    }

    updatedKeys.push(key);
    operations.push({
      updateOne: {
        filter: { [keyField]: key },
        update: { $set: mutableRecord, $setOnInsert: { createdAt: recordCreatedAt } },
        upsert: true
      }
    });
  });

  const writeResult =
    operations.length > 0 ? await collection.bulkWrite(operations, { ordered: false }) : zeroWriteResult();

  const report = {
    entity,
    collection: collectionName,
    keyField,
    input: {
      file: input.absolutePath,
      payloadShape: input.payloadShape,
      extractedKey: input.extractedKey,
      generatedAt: input.generatedAt,
      summary: input.summary,
      totalRaw: input.records.length,
      totalNormalized: normalizedRecords.length,
      totalUnique: records.length,
      invalidCount: Math.max(0, input.records.length - normalizedRecords.length),
      duplicateKeyCount: duplicateKeys.length,
      duplicateKeySamples: sampleKeys(duplicateKeys)
    },
    detection: {
      newCount: newKeys.length,
      updatedCount: updatedKeys.length,
      unchangedCount: unchangedKeys.length,
      newSamples: sampleKeys(newKeys),
      updatedSamples: sampleKeys(updatedKeys),
      unchangedSamples: sampleKeys(unchangedKeys)
    },
    write: {
      operations: operations.length,
      upsertedCount: writeResult.upsertedCount || 0,
      modifiedCount: writeResult.modifiedCount || 0,
      matchedCount: writeResult.matchedCount || 0
    }
  };

  // eslint-disable-next-line no-console
  console.log(
    `[${entity}] new=${report.detection.newCount} updated=${report.detection.updatedCount} unchanged=${report.detection.unchangedCount} ops=${report.write.operations}`
  );

  return report;
}

function aggregateReports(reports, meta) {
  const totals = reports.reduce(
    (accumulator, report) => {
      accumulator.newCount += report.detection.newCount;
      accumulator.updatedCount += report.detection.updatedCount;
      accumulator.unchangedCount += report.detection.unchangedCount;
      accumulator.invalidCount += report.input.invalidCount;
      accumulator.duplicateKeyCount += report.input.duplicateKeyCount;
      accumulator.operations += report.write.operations;
      return accumulator;
    },
    {
      newCount: 0,
      updatedCount: 0,
      unchangedCount: 0,
      invalidCount: 0,
      duplicateKeyCount: 0,
      operations: 0
    }
  );

  return {
    version: 2,
    generatedAt: new Date().toISOString(),
    database: meta.database,
    reportPath: meta.reportPath,
    datasets: reports,
    totals
  };
}

async function writeReport(reportPath, report) {
  const absolutePath = path.resolve(process.cwd(), reportPath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, JSON.stringify(report, null, 2), 'utf8');
  // eslint-disable-next-line no-console
  console.log(`[import] report saved: ${absolutePath}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help === 'true') {
    // eslint-disable-next-line no-console
    console.log(
      [
        'Usage:',
        '  node scripts/import-scraped-data.mjs --uri <mongo-uri> --db <db-name> --players <players.json> --managers <managers.json> --packs <packs.json> --community <community.json> --league <league.json>',
        '',
        'Options:',
        '  --uri                MongoDB connection URI (or set MONGODB_URI)',
        '  --db                 Database name (default: efootball_vn)',
        '  --players            JSON array or object payload file for players',
        '  --managers           JSON array or object payload file for managers',
        '  --packs              JSON array or object payload file for packs',
        '  --community          JSON array or object payload file for community profiles',
        '  --league             JSON array or object payload file for league rankings',
        '  --builds             JSON array or object payload file for player builds',
        `  --report             Report output path (default: ${DEFAULT_REPORT_PATH})`,
        '  --playersCollection  Collection name for players (default: players)',
        '  --managersCollection Collection name for managers (default: managers)',
        '  --packsCollection    Collection name for packs (default: packs)',
        '  --communityCollection Collection for community profiles (default: community_profiles)',
        '  --leagueCollection   Collection for league rankings (default: league_rankings)',
        '  --playerBuildsCollection Collection for player builds (default: player_builds)'
      ].join('\n')
    );
    return;
  }

  const uri = args.uri || process.env.MONGODB_URI;
  const dbName = args.db || process.env.MONGODB_DB_NAME || 'efootball_vn';
  const reportPath = args.report || process.env.SCRAPER_IMPORT_REPORT_PATH || DEFAULT_REPORT_PATH;
  const playersFile = args.players;
  const managersFile = args.managers;
  const packsFile = args.packs;
  const communityFile = args.community;
  const leagueFile = args.league;
  const buildsFile = args.builds;
  const playersCollection = args.playersCollection || process.env.PLAYERS_COLLECTION || 'players';
  const managersCollection = args.managersCollection || process.env.MANAGERS_COLLECTION || 'managers';
  const packsCollection = args.packsCollection || process.env.PACKS_COLLECTION || 'packs';
  const communityCollection =
    args.communityCollection || process.env.COMMUNITY_COLLECTION || 'community_profiles';
  const leagueCollection = args.leagueCollection || process.env.LEAGUE_COLLECTION || 'league_rankings';
  const playerBuildsCollection =
    args.playerBuildsCollection || process.env.PLAYER_BUILDS_COLLECTION || 'player_builds';

  if (!uri) {
    throw new Error('Missing Mongo URI. Use --uri or set MONGODB_URI.');
  }
  if (!playersFile && !managersFile && !packsFile && !communityFile && !leagueFile && !buildsFile) {
    throw new Error(
      'Provide at least one input: --players / --managers / --packs / --community / --league / --builds.'
    );
  }

  const client = new MongoClient(uri, { maxPoolSize: 15 });
  await client.connect();

  try {
    const db = client.db(dbName);
    const reports = [];

    if (playersFile) {
      reports.push(
        await importEntity(db, {
          entity: 'players',
          filePath: playersFile,
          collectionName: playersCollection,
          keyField: 'efhubId',
          normalizer: normalizePlayer
        })
      );
    }

    if (managersFile) {
      reports.push(
        await importEntity(db, {
          entity: 'managers',
          filePath: managersFile,
          collectionName: managersCollection,
          keyField: 'efhubId',
          normalizer: normalizeManager
        })
      );
    }

    if (packsFile) {
      reports.push(
        await importEntity(db, {
          entity: 'packs',
          filePath: packsFile,
          collectionName: packsCollection,
          keyField: 'id',
          normalizer: normalizePack
        })
      );
    }

    if (communityFile) {
      reports.push(
        await importEntity(db, {
          entity: 'community',
          filePath: communityFile,
          collectionName: communityCollection,
          keyField: 'id',
          normalizer: normalizeCommunity
        })
      );
    }

    if (leagueFile) {
      reports.push(
        await importEntity(db, {
          entity: 'league',
          filePath: leagueFile,
          collectionName: leagueCollection,
          keyField: 'id',
          normalizer: normalizeLeague
        })
      );
    }

    if (buildsFile) {
      reports.push(
        await importEntity(db, {
          entity: 'builds',
          filePath: buildsFile,
          collectionName: playerBuildsCollection,
          keyField: 'id',
          normalizer: normalizeBuild
        })
      );
    }

    const aggregate = aggregateReports(reports, {
      database: dbName,
      reportPath: path.resolve(process.cwd(), reportPath)
    });
    await writeReport(reportPath, aggregate);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(`[import-scraped-data] ${error.message}`);
  process.exit(1);
});
