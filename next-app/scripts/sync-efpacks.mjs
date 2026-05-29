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
const PACKS_URL = 'https://api2.efootbase.com/api/packs';
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

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/efootball_vn';
  const dbName = process.env.MONGODB_DB_NAME || 'efootball_vn';
  
  console.log(`[sync-efpacks] Connecting to MongoDB: ${mongoUri}`);
  const client = new MongoClient(mongoUri, { maxPoolSize: 10 });
  await client.connect();
  const db = client.db(dbName);
  const packsCollection = db.collection('packs');
  const playersCollection = db.collection('players');

  // Create public players images directory
  const imagesDir = path.join(NEXT_APP_ROOT, 'public', 'images', 'players');
  await fs.mkdir(imagesDir, { recursive: true });

  console.log(`[sync-efpacks] Fetching packs from eFootbase API...`);
  
  let json;
  try {
    const res = await fetch(PACKS_URL, {
      headers: {
        'x-api-key': API_KEY,
        'User-Agent': USER_AGENT,
        'accept': 'application/json'
      }
    });

    if (res.status !== 200) {
      console.error(`[sync-efpacks] Failed to fetch packs. HTTP Status: ${res.status}`);
      await client.close();
      process.exit(1);
    }

    json = await res.json();
  } catch (error) {
    console.error(`[sync-efpacks] Network error fetching packs:`, error.message);
    await client.close();
    process.exit(1);
  }

  const rawPacks = json.data?.packs || [];
  console.log(`[sync-efpacks] Found ${rawPacks.length} packs to process.`);

  let packsCreated = 0;
  let packsUpdated = 0;
  let playersSynced = 0;

  for (const pack of rawPacks) {
    const slug = slugify(pack.name);
    const id = `pack-${slug}-${pack.time}`;
    const startsAt = new Date(pack.time * 1000);
    // Standard duration is 30 days
    const endsAt = new Date(pack.time * 1000 + 30 * 24 * 60 * 60 * 1000);
    const playerIds = pack.list ? pack.list.map(String) : [];

    // Infer pack type from player card_type or rarity
    let inferredType = 'Featured';
    if (pack.players && pack.players.length > 0) {
      const firstPlayer = pack.players[0];
      const featuredLabel = String(firstPlayer.featured || '').toLowerCase();
      if (featuredLabel.includes('epic')) {
        inferredType = 'Epic';
      } else if (featuredLabel.includes('showtime') || featuredLabel.includes('show time')) {
        inferredType = 'Show Time';
      } else if (featuredLabel.includes('highlight')) {
        inferredType = 'Highlight';
      } else if (featuredLabel.includes('club selection')) {
        inferredType = 'Club Selection';
      } else if (firstPlayer.card_type === 6) {
        inferredType = 'Epic';
      } else if (firstPlayer.card_type === 7) {
        inferredType = 'Show Time';
      }
    }

    // Set banner image
    const bannerImage = `https://placehold.co/1200x420/0f172a/e2e8f0.png?text=${encodeURIComponent(pack.name)}`;

    const packDoc = {
      id,
      slug,
      name: pack.name,
      type: inferredType,
      bannerImage,
      startsAt,
      endsAt,
      playerIds,
      source: {
        site: 'efootbase.com',
        packUrl: PACKS_URL,
        scrapedAt: new Date()
      },
      updatedAt: new Date()
    };

    // Upsert Pack
    const packResult = await packsCollection.updateOne(
      { id },
      {
        $set: packDoc,
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );

    if (packResult.upsertedCount > 0) {
      packsCreated += 1;
      console.log(`[PACK NEW] Imported Pack: "${pack.name}" (Type: ${inferredType}, Players: ${playerIds.length})`);
    } else {
      packsUpdated += 1;
    }

    // Sync Players inside this pack
    if (pack.players && pack.players.length > 0) {
      for (const player of pack.players) {
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

        // Handle Image Download
        const imageName = `${efhubId}.png`;
        const localImagePath = path.join(imagesDir, imageName);
        const relativeImagePath = `/images/players/${imageName}`;
        
        let hasImage = false;
        try {
          await fs.access(localImagePath);
          hasImage = true;
        } catch {
          // Download transparent portrait
          const cdnUrl = player.card_images?.transparent || `https://cdn.assets.efootbase.com/eFPlayers/players/${efhubId}/transparent.png`;
          try {
            console.log(`  -> Downloading image for Pack Player ${player.name} (${efhubId})...`);
            const success = await downloadImageWithRetry(cdnUrl, localImagePath);
            if (success) {
              hasImage = true;
              await sleep(150);
            }
          } catch (imgError) {
            console.error(`  [!] Error downloading image for Pack Player ${player.name}:`, imgError.message);
          }
        }

        // Map player fields (supporting full Booster information!)
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
          skills: [],
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

        // Extract skills
        Object.keys(player).forEach(key => {
          if (key.startsWith('s_') && player[key] === 1) {
            const skillKey = key.slice(2).replace(/_/g, ' ');
            const formattedSkill = skillKey.replace(/\b\w/g, char => char.toUpperCase())
              .replace('Gk', 'GK')
              .replace('One Touch', 'One-touch')
              .replace('Super Sub', 'Super-sub')
              .replace('Through Passing', 'Through Passing');
            playerDoc.skills.push(formattedSkill);
          }
        });

        // Upsert Player
        await playersCollection.updateOne(
          { efhubId },
          { 
            $set: playerDoc,
            $setOnInsert: { createdAt: new Date() }
          },
          { upsert: true }
        );

        playersSynced += 1;
      }
    }
  }

  console.log(`\n[sync-efpacks] Sync finished successfully!`);
  console.log(`  - New Packs Added: ${packsCreated}`);
  console.log(`  - Existing Packs Updated: ${packsUpdated}`);
  console.log(`  - Total Pack Players Synced: ${playersSynced}`);

  await client.close();
  console.log(`[sync-efpacks] MongoDB connection closed.`);
}

main().catch((error) => {
  console.error(`[sync-efpacks] Fatal error:`, error);
  process.exit(1);
});
