#!/usr/bin/env node

import process from 'node:process';
import { MongoClient } from 'mongodb';

function toStringValue(value, fallback = '') {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  return fallback;
}

async function ensureIndexes() {
  const uri =
    toStringValue(process.env.MONGODB_URI) || 'mongodb://127.0.0.1:27017/efootball_vn';
  const dbName = toStringValue(process.env.MONGODB_DB_NAME) || 'efootball_vn';
  const playersCollection = toStringValue(process.env.PLAYERS_COLLECTION, 'players');
  const managersCollection = toStringValue(process.env.MANAGERS_COLLECTION, 'managers');
  const packsCollection = toStringValue(process.env.PACKS_COLLECTION, 'packs');
  const communityCollection = toStringValue(
    process.env.COMMUNITY_COLLECTION,
    'community_profiles'
  );
  const leagueCollection = toStringValue(process.env.LEAGUE_COLLECTION, 'league_rankings');
  const playerBuildsCollection = toStringValue(
    process.env.PLAYER_BUILDS_COLLECTION,
    'player_builds'
  );
  const communityFollowsCollection = toStringValue(
    process.env.COMMUNITY_FOLLOWS_COLLECTION,
    'community_follows'
  );

  const client = new MongoClient(uri, { maxPoolSize: 10 });
  await client.connect();

  try {
    const db = dbName ? client.db(dbName) : client.db();

    await Promise.all([
      db.collection(playersCollection).createIndex({ efhubId: 1 }, { unique: true, name: 'ux_players_efhubId' }),
      db.collection(playersCollection).createIndex(
        { slug: 1 },
        {
          unique: true,
          partialFilterExpression: { slug: { $gt: '' } },
          name: 'ux_players_slug'
        }
      ),
      db.collection(playersCollection).createIndex(
        { name: 'text', shortName: 'text', club: 'text', nationality: 'text' },
        { name: 'tx_players_search' }
      ),
      db.collection(playersCollection).createIndex(
        { positions: 1, 'overall.max': -1, updatedAt: -1 },
        { name: 'ix_players_position_ovr_updated' }
      ),
      db.collection(playersCollection).createIndex(
        { 'overall.max': -1, updatedAt: -1, name: 1 },
        { name: 'ix_players_ovr_updated_name_desc' }
      ),
      db.collection(playersCollection).createIndex(
        { 'overall.max': 1, updatedAt: -1, name: 1 },
        { name: 'ix_players_ovr_updated_name_asc' }
      ),
      db.collection(playersCollection).createIndex(
        { name: 1, 'overall.max': -1, updatedAt: -1 },
        { name: 'ix_players_name_ovr_updated' }
      ),
      db.collection(playersCollection).createIndex(
        { updatedAt: -1, 'overall.max': -1, name: 1 },
        { name: 'ix_players_updated_ovr_name' }
      ),
      db.collection(playersCollection).createIndex(
        { cardType: 1, playstyles: 1, 'overall.max': -1, updatedAt: -1 },
        { name: 'ix_players_cardtype_playstyles_ovr' }
      ),
      db.collection(playersCollection).createIndex(
        { nationality: 1, club: 1, updatedAt: -1 },
        { name: 'ix_players_country_club_updated' }
      ),
      db.collection(playersCollection).createIndex(
        { 'bio.heightCm': 1, updatedAt: -1 },
        { name: 'ix_players_bio_height_updated' }
      ),
      db.collection(playersCollection).createIndex(
        { heightCm: 1, updatedAt: -1 },
        { name: 'ix_players_heightcm_updated' }
      ),
      db.collection(playersCollection).createIndex(
        { height: 1, updatedAt: -1 },
        { name: 'ix_players_height_updated' }
      ),

      db.collection(managersCollection).createIndex(
        { efhubId: 1 },
        { unique: true, name: 'ux_managers_efhubId' }
      ),
      db.collection(managersCollection).createIndex(
        { name: 'text', shortName: 'text', team: 'text', nationality: 'text' },
        { name: 'tx_managers_search' }
      ),
      db.collection(managersCollection).createIndex(
        { formation: 1, updatedAt: -1 },
        { name: 'ix_managers_formation_updated' }
      ),
      db.collection(managersCollection).createIndex(
        { nationality: 1, updatedAt: -1 },
        { name: 'ix_managers_country_updated' }
      ),
      db.collection(managersCollection).createIndex(
        { team: 1, name: 1, updatedAt: -1 },
        { name: 'ix_managers_team_name_updated' }
      ),
      db.collection(managersCollection).createIndex(
        { updatedAt: -1, name: 1 },
        { name: 'ix_managers_updated_name' }
      ),
      db.collection(managersCollection).createIndex(
        { 'playstyleProficiency.quickCounter': -1, updatedAt: -1 },
        { name: 'ix_managers_style_qc_updated' }
      ),
      db.collection(managersCollection).createIndex(
        { 'playstyleProficiency.possessionGame': -1, updatedAt: -1 },
        { name: 'ix_managers_style_pos_updated' }
      ),
      db.collection(managersCollection).createIndex(
        { 'playstyleProficiency.longBallCounter': -1, updatedAt: -1 },
        { name: 'ix_managers_style_lbc_updated' }
      ),
      db.collection(managersCollection).createIndex(
        { 'playstyleProficiency.outWide': -1, updatedAt: -1 },
        { name: 'ix_managers_style_ow_updated' }
      ),
      db.collection(managersCollection).createIndex(
        { 'playstyleProficiency.longBall': -1, updatedAt: -1 },
        { name: 'ix_managers_style_lb_updated' }
      ),

      db.collection(packsCollection).createIndex({ id: 1 }, { unique: true, name: 'ux_packs_id' }),
      db.collection(packsCollection).createIndex(
        { slug: 1 },
        {
          unique: true,
          partialFilterExpression: { slug: { $gt: '' } },
          name: 'ux_packs_slug'
        }
      ),
      db.collection(packsCollection).createIndex(
        { startsAt: -1, endsAt: -1, updatedAt: -1 },
        { name: 'ix_packs_dates' }
      ),
      db.collection(packsCollection).createIndex(
        { startsAt: -1, updatedAt: -1, name: 1 },
        { name: 'ix_packs_starts_updated_name' }
      ),
      db.collection(packsCollection).createIndex(
        { type: 1, startsAt: -1, updatedAt: -1 },
        { name: 'ix_packs_type_dates' }
      ),

      db.collection(communityCollection).createIndex(
        { id: 1 },
        { unique: true, name: 'ux_community_id' }
      ),
      db.collection(communityCollection).createIndex(
        { username: 1 },
        {
          unique: true,
          partialFilterExpression: { username: { $gt: '' } },
          name: 'ux_community_username'
        }
      ),
      db.collection(communityCollection).createIndex(
        { region: 1, country: 1, followers: -1, buildsCount: -1 },
        { name: 'ix_community_region_country_rank' }
      ),
      db.collection(communityCollection).createIndex(
        { followers: -1, following: -1, updatedAt: -1 },
        { name: 'ix_community_social_rank' }
      ),
      db.collection(communityCollection).createIndex(
        { buildsCount: -1, updatedAt: -1, displayName: 1 },
        { name: 'ix_community_builds_updated_name' }
      ),
      db.collection(communityCollection).createIndex(
        { following: -1, updatedAt: -1, displayName: 1 },
        { name: 'ix_community_following_updated_name' }
      ),
      db.collection(communityCollection).createIndex(
        { displayName: 1, followers: -1, updatedAt: -1 },
        { name: 'ix_community_name_followers_updated_asc' }
      ),
      db.collection(communityCollection).createIndex(
        { displayName: -1, followers: -1, updatedAt: -1 },
        { name: 'ix_community_name_followers_updated_desc' }
      ),

      db.collection(leagueCollection).createIndex(
        { id: 1 },
        { unique: true, name: 'ux_league_id' }
      ),
      db.collection(leagueCollection).createIndex(
        { mode: 1, points: -1, members: -1, updatedAt: -1 },
        { name: 'ix_league_mode_points_members_updated' }
      ),
      db.collection(leagueCollection).createIndex(
        { name: 1, updatedAt: -1 },
        { name: 'ix_league_name_updated' }
      ),
      db.collection(leagueCollection).createIndex(
        { mode: 1, updatedAt: -1, points: -1, name: 1 },
        { name: 'ix_league_mode_updated_points_name' }
      ),
      db.collection(leagueCollection).createIndex(
        { members: -1, points: -1, updatedAt: -1, name: 1 },
        { name: 'ix_league_members_points_updated_name' }
      ),

      db.collection(playerBuildsCollection).createIndex(
        { id: 1 },
        { unique: true, name: 'ux_player_builds_id' }
      ),
      db.collection(playerBuildsCollection).createIndex(
        { playerId: 1, visibility: 1, likes: -1, createdAt: -1 },
        { name: 'ix_player_builds_player_visibility_likes_created' }
      ),
      db.collection(playerBuildsCollection).createIndex(
        { playerId: 1, authorId: 1, createdAt: -1 },
        { name: 'ix_player_builds_player_author_created' }
      ),
      db.collection(playerBuildsCollection).createIndex(
        { playerId: 1, visibility: 1, likes: -1, updatedAt: -1, createdAt: -1 },
        { name: 'ix_player_builds_player_visibility_likes_updated_created' }
      ),
      db.collection(playerBuildsCollection).createIndex(
        { playerId: 1, authorId: 1, updatedAt: -1, createdAt: -1 },
        { name: 'ix_player_builds_player_author_updated_created' }
      ),
      db.collection(playerBuildsCollection).createIndex(
        { updatedAt: -1 },
        { name: 'ix_player_builds_updated' }
      ),

      db.collection(communityFollowsCollection).createIndex(
        { followerId: 1, followingId: 1 },
        { unique: true, name: 'ux_community_follows_pair' }
      ),
      db.collection(communityFollowsCollection).createIndex(
        { followerId: 1, updatedAt: -1 },
        { name: 'ix_community_follows_follower_updated' }
      ),
      db.collection(communityFollowsCollection).createIndex(
        { followingId: 1, updatedAt: -1 },
        { name: 'ix_community_follows_following_updated' }
      )
    ]);

    // eslint-disable-next-line no-console
    console.log('[db:indexes] MongoDB indexes ensured successfully.');
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        {
          db: db.databaseName,
          collections: {
            players: playersCollection,
            managers: managersCollection,
            packs: packsCollection,
            community: communityCollection,
            league: leagueCollection,
            playerBuilds: playerBuildsCollection,
            communityFollows: communityFollowsCollection
          }
        },
        null,
        2
      )
    );
  } finally {
    await client.close();
  }
}

ensureIndexes().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  // eslint-disable-next-line no-console
  console.error(`[db:indexes] ${message}`);
  process.exit(1);
});
