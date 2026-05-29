#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';
import { loadLocalEnv } from './load-local-env.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NEXT_APP_ROOT = path.resolve(__dirname, '..');

// Load environment variables (.env.local, .env)
await loadLocalEnv(NEXT_APP_ROOT);

const API_KEY = 'L-}i@R-KwsGk&nB;C4)RBSB+_AQsTSK5Sxa&d:>oz54';
const BASE_URL = 'https://api2.efootbase.com/api/players';
const USER_AGENT = 'Dart/3.3 (dart:io)';

const PLAYSTYLE_ID_MAP = {
  0: 'None',
  1: 'Goal Poacher',
  2: 'Dummy Runner',
  3: 'Fox in the Box',
  4: 'Prolific Winger',
  5: 'Roaming Flank',
  6: 'Hole Player',
  7: 'Box-to-Box',
  8: 'Anchor Man',
  9: 'The Destroyer',
  10: 'Orchestrator',
  11: 'Offensive Full-back',
  12: 'Defensive Full-back',
  13: 'Classic No. 10',
  14: 'Creative Playmaker',
  15: 'Build Up',
  16: 'Offensive Goalkeeper',
  17: 'Defensive Goalkeeper',
  18: 'Deep-Lying Forward',
  19: 'Cross Specialist',
  20: 'Orchestrator',
  22: 'Target Man'
};

const POS_FIELDS = [
  'amf', 'cb', 'cf', 'cmf', 'dmf', 'gk', 'lb', 'lmf', 'lwf', 'rb', 'rmf', 'rwf', 'ss'
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function mapStats(source) {
  if (!source) return {};
  return {
    offensiveAwareness: source.offensive_awareness ?? 40,
    ballControl: source.ball_control ?? 40,
    dribbling: source.dribbling ?? 40,
    tightPossession: source.tight_possession ?? 40,
    lowPass: source.low_pass ?? 40,
    loftedPass: source.lofted_pass ?? 40,
    finishing: source.finishing ?? 40,
    heading: source.heading ?? 40,
    setPieceTaking: source.set_piece_taking ?? 40,
    curl: source.curl ?? 40,
    defensiveAwareness: source.defensive_awareness ?? 40,
    trackingBack: source.defensive_engagement ?? 40, 
    ballWinning: source.tackling ?? 40,             
    aggression: source.aggression ?? 40,
    gkAwareness: source.gk_awareness ?? 40,
    gkCatching: source.gk_catching ?? 40,
    gkClearing: source.gk_parrying ?? 40,            
    gkReflexes: source.gk_reflexes ?? 40,
    gkReach: source.gk_reach ?? 40,
    speed: source.speed ?? 40,
    acceleration: source.acceleration ?? 40,
    kickingPower: source.kicking_power ?? 40,
    jump: source.jumping ?? 40,                     
    physicalContact: source.physical_contact ?? 40,
    balance: source.balance ?? 40,
    stamina: source.stamina ?? 40
  };
}

async function downloadImageWithRetry(url, localPath, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
      });
      if (res.status === 200) {
        const buffer = await res.arrayBuffer();
        await fs.writeFile(localPath, Buffer.from(buffer));
        return true;
      }
      if (res.status === 404) {
        // Stop retrying on 404
        return false;
      }
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await sleep(1000 * attempt);
    }
  }
  return false;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  
  if (args.help === 'true') {
    console.log(
      [
        'Usage:',
        '  node scripts/sync-efbase.mjs [options]',
        '',
        'Options:',
        '  --pages <num>     Number of pages to sync (default: unlimited, crawls until no more data)',
        '  --limit <num>     Players per page (default: 50, max: 100)',
        '  --startPage <num> Page to start crawling from (default: 1)',
        '  --maxPlayers <num>Maximum players to sync in this run',
        '  --onlyNew         Skip downloading images and DB updates if player exists in DB (default: false)'
      ].join('\n')
    );
    return;
  }

  const startPage = Math.max(1, Number(args.startPage || 1));
  const playersPerPage = Math.min(100, Math.max(1, Number(args.limit || 50)));
  const pageLimit = args.pages ? Number(args.pages) : null;
  const maxPlayers = args.maxPlayers ? Number(args.maxPlayers) : null;
  const onlyNew = args.onlyNew === 'true';

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/efootball_vn';
  const dbName = process.env.MONGODB_DB_NAME || 'efootball_vn';
  
  console.log(`[sync-efbase] Connecting to MongoDB: ${mongoUri} (DB: ${dbName})`);
  const client = new MongoClient(mongoUri, { maxPoolSize: 10 });
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection('players');

  // Create public players images directory
  const imagesDir = path.join(NEXT_APP_ROOT, 'public', 'images', 'players');
  await fs.mkdir(imagesDir, { recursive: true });

  console.log(`[sync-efbase] Synchronizing from eFootbase API...`);
  console.log(`[sync-efbase] Configuration: startPage=${startPage}, limit=${playersPerPage}, pages=${pageLimit || 'ALL'}, maxPlayers=${maxPlayers || 'ALL'}`);

  let page = startPage;
  let playersSynced = 0;
  let newPlayersCount = 0;
  let updatedPlayersCount = 0;
  let failedDownloadsCount = 0;

  while (true) {
    if (pageLimit && (page - startPage) >= pageLimit) {
      console.log(`[sync-efbase] Reached specified page limit: ${pageLimit} pages.`);
      break;
    }

    if (maxPlayers && playersSynced >= maxPlayers) {
      console.log(`[sync-efbase] Reached specified maximum player limit: ${maxPlayers}.`);
      break;
    }

    const url = `${BASE_URL}?limit=${playersPerPage}&page=${page}`;
    console.log(`\n[sync-efbase] Fetching page ${page}...`);
    
    let body;
    try {
      const res = await fetch(url, {
        headers: {
          'x-api-key': API_KEY,
          'User-Agent': USER_AGENT,
          'accept': 'application/json'
        }
      });

      if (res.status !== 200) {
        console.error(`[sync-efbase] Failed to fetch page ${page}. HTTP Status: ${res.status}`);
        break;
      }

      body = await res.json();
    } catch (error) {
      console.error(`[sync-efbase] Network error on page ${page}:`, error.message);
      break;
    }

    const playersData = body.data || [];
    if (playersData.length === 0) {
      console.log(`[sync-efbase] Page ${page} returned no data. Synchronization completed!`);
      break;
    }

    console.log(`[sync-efbase] Processing ${playersData.length} players from page ${page}...`);

    for (const player of playersData) {
      if (maxPlayers && playersSynced >= maxPlayers) {
        break;
      }

      const efhubId = String(player.id);
      
      // Map positions
      const positions = [];
      POS_FIELDS.forEach(f => {
        if (player[f] === 2) {
          positions.push(f.toUpperCase());
        }
      });

      // Map playstyle
      const playstyleString = PLAYSTYLE_ID_MAP[player.playing_style] || 'None';
      const playstyles = playstyleString !== 'None' ? [playstyleString] : [];

      // Check if player exists in DB
      const existing = await collection.findOne({ efhubId });
      if (onlyNew && existing) {
        // Skip entirely to speed up if onlyNew is true
        playersSynced += 1;
        continue;
      }

      // Handle Image Download
      const imageName = `${efhubId}.png`;
      const localImagePath = path.join(imagesDir, imageName);
      const relativeImagePath = `/images/players/${imageName}`;
      
      let hasImage = false;
      try {
        await fs.access(localImagePath);
        hasImage = true;
      } catch {
        // Image does not exist locally, download it
        const cdnUrl = player.card_images?.transparent || `https://cdn.assets.efootbase.com/eFPlayers/players/${efhubId}/transparent.png`;
        try {
          console.log(`  -> Downloading image for ${player.name} (${efhubId})...`);
          const success = await downloadImageWithRetry(cdnUrl, localImagePath);
          if (success) {
            hasImage = true;
            // Sleep slightly to be extremely polite to their CDN
            await sleep(200);
          } else {
            console.warn(`  [!] CDN image not found (404) for ${player.name}`);
            failedDownloadsCount += 1;
          }
        } catch (imgError) {
          console.error(`  [!] Error downloading image for ${player.name}:`, imgError.message);
          failedDownloadsCount += 1;
        }
      }

      // Prepare player document matching our schema
      const playerDoc = {
        efhubId,
        slug: player.name_normalized ? `${player.name_normalized.replace(/\s+/g, '-')}-${efhubId}` : efhubId,
        name: player.name || 'Unknown Player',
        shortName: player.name || 'Unknown Player',
        nationality: player.nationality || 'Unknown',
        club: player.team_name || 'Unknown Club',
        league: String(player.league || 'Unknown League'),
        positions: positions.length > 0 ? positions : ['CF'],
        cardType: player.featured === 'none' ? 'Standard' : (player.featured || 'Standard'),
        rarity: player.featured === 'none' ? 'Standard' : (player.featured || 'Standard'),
        overall: {
          base: player.overall_rating ?? 60,
          max: player.overall_at_max_level ?? 80
        },
        levels: {
          current: 1,
          max: player.max_level ?? 1
        },
        stats: {
          level1: mapStats(player),
          maxLevel: mapStats(player.max_attributes || player),
          perLevel: []
        },
        skills: [], // We can populate if we want, but keeping it simple as eFootbase API represents them as s_ booleans
        playstyles,
        boosterId: player.booster_id || 0,
        booster: player.booster ? {
          name: player.booster.name || '',
          stats: player.booster.stats || {}
        } : null,
        condition: {
          form: player.form === 2 ? 'A' : (player.form === 1 ? 'B' : 'C'),
          injuryResistance: player.injury_resistance ?? 2
        },
        images: {
          card: relativeImagePath,
          portrait: relativeImagePath,
          render: relativeImagePath,
          thumbnail: relativeImagePath
        },
        source: {
          site: 'efootbase.com',
          playerUrl: `https://api2.efootbase.com/api/players?id=${efhubId}`,
          scrapedAt: new Date()
        },
        updatedAt: new Date()
      };

      // Extract skills from s_ boolean fields in eFootbase
      Object.keys(player).forEach(key => {
        if (key.startsWith('s_') && player[key] === 1) {
          // Map to correct name
          const skillKey = key.slice(2).replace(/_/g, ' ');
          // Capitalize words
          const formattedSkill = skillKey.replace(/\b\w/g, char => char.toUpperCase())
            .replace('Gk', 'GK')
            .replace('One Touch', 'One-touch')
            .replace('Super Sub', 'Super-sub')
            .replace('Through Passing', 'Through Passing');
          playerDoc.skills.push(formattedSkill);
        }
      });

      // Upsert player into MongoDB
      const res = await collection.updateOne(
        { efhubId },
        { 
          $set: playerDoc,
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );

      if (res.upsertedCount > 0) {
        newPlayersCount += 1;
        console.log(`  [NEW] Imported: ${player.name} (Overall: ${playerDoc.overall.base} -> ${playerDoc.overall.max})`);
      } else {
        updatedPlayersCount += 1;
      }

      playersSynced += 1;
    }

    console.log(`[sync-efbase] Page ${page} finished. Total synced so far: ${playersSynced}`);

    // Polite sleep between pages to make requests indistinguishable from natural app usage
    const pageDelay = Math.floor(Math.random() * 2000) + 1500;
    console.log(`[sync-efbase] Sleeping for ${pageDelay}ms before fetching next page...`);
    await sleep(pageDelay);

    page += 1;
  }

  console.log(`\n[sync-efbase] Synchronization Summary:`);
  console.log(`  - Total Players Synced: ${playersSynced}`);
  console.log(`  - New Players Added: ${newPlayersCount}`);
  console.log(`  - Existing Players Updated: ${updatedPlayersCount}`);
  console.log(`  - Failed/Missing Image Downloads: ${failedDownloadsCount}`);
  
  await client.close();
  console.log(`[sync-efbase] MongoDB connection closed. All done!`);
}

main().catch((error) => {
  console.error(`[sync-efbase] Fatal error:`, error);
  process.exit(1);
});
