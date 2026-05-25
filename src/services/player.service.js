const Player = require('../models/player.model');
const MOCK_PLAYERS = require('../data/mockPlayers');
const { isDatabaseConnected } = require('../config/database');

const parseListQuery = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));

  return {
    page,
    limit,
    q: query.q?.trim(),
    position: query.position?.trim(),
    cardType: query.cardType?.trim(),
    playstyle: query.playstyle?.trim(),
    minOvr: Number.parseInt(query.minOvr, 10),
    sortBy: query.sortBy || 'overall.max',
    sortOrder: query.sortOrder === 'asc' ? 1 : -1
  };
};

const getByPath = (obj, path) =>
  String(path || '')
    .split('.')
    .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);

const buildPlayerFilter = (options) => {
  const filter = {};

  if (options.q) {
    filter.$text = { $search: options.q };
  }

  if (options.position) {
    filter.positions = options.position.toUpperCase();
  }

  if (options.cardType) {
    filter.cardType = options.cardType;
  }

  if (options.playstyle) {
    filter.playstyles = options.playstyle;
  }

  if (!Number.isNaN(options.minOvr)) {
    filter['overall.max'] = { $gte: options.minOvr };
  }

  return filter;
};

const filterMockPlayers = (players, options) =>
  players.filter((player) => {
    if (options.q) {
      const search = options.q.toLowerCase();
      const hit = [player.name, player.shortName, player.club]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
      if (!hit) {
        return false;
      }
    }

    if (options.position) {
      const expected = options.position.toUpperCase();
      const positions = Array.isArray(player.positions) ? player.positions : [];
      if (!positions.includes(expected)) {
        return false;
      }
    }

    if (options.cardType) {
      if (String(player.cardType || '').toLowerCase() !== options.cardType.toLowerCase()) {
        return false;
      }
    }

    if (options.playstyle) {
      const playstyles = Array.isArray(player.playstyles) ? player.playstyles : [];
      const hasPlaystyle = playstyles.some(
        (item) => String(item).toLowerCase() === options.playstyle.toLowerCase()
      );
      if (!hasPlaystyle) {
        return false;
      }
    }

    if (!Number.isNaN(options.minOvr)) {
      const ovr = Number(player?.overall?.max || 0);
      if (ovr < options.minOvr) {
        return false;
      }
    }

    return true;
  });

const sortMockPlayers = (players, options) =>
  players.sort((a, b) => {
    const left = getByPath(a, options.sortBy);
    const right = getByPath(b, options.sortBy);

    if (left === right) {
      return 0;
    }

    if (left === undefined || left === null) {
      return 1;
    }

    if (right === undefined || right === null) {
      return -1;
    }

    if (left > right) {
      return options.sortOrder;
    }

    return -options.sortOrder;
  });

const listPlayers = async (query) => {
  const options = parseListQuery(query);

  if (!isDatabaseConnected()) {
    const filtered = filterMockPlayers(MOCK_PLAYERS, options);
    const sorted = sortMockPlayers([...filtered], options);
    const offset = (options.page - 1) * options.limit;
    const paged = sorted.slice(offset, offset + options.limit);

    return {
      data: paged,
      meta: {
        page: options.page,
        limit: options.limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / options.limit) || 1,
        source: 'mock'
      }
    };
  }

  const filter = buildPlayerFilter(options);

  const [items, total] = await Promise.all([
    Player.find(filter)
      .sort({ [options.sortBy]: options.sortOrder, updatedAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    Player.countDocuments(filter)
  ]);

  return {
    data: items,
    meta: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit)
    }
  };
};

const getPlayerById = async (id) =>
  (isDatabaseConnected()
    ? Player.findOne({
        $or: [{ efhubId: id }, { slug: id }]
      }).lean()
    : MOCK_PLAYERS.find((player) => player.efhubId === id || player.slug === id) || null);

module.exports = {
  listPlayers,
  getPlayerById
};
