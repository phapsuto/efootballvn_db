const Manager = require('../models/manager.model');
const MOCK_MANAGERS = require('../data/mockManagers');
const { isDatabaseConnected } = require('../config/database');

const parseListQuery = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));

  return {
    page,
    limit,
    q: query.q?.trim(),
    formation: query.formation?.trim(),
    playstyle: query.playstyle?.trim(),
    sortOrder: query.sortOrder === 'asc' ? 1 : -1
  };
};

const filterMockManagers = (managers, options) =>
  managers.filter((manager) => {
    if (options.q) {
      const search = options.q.toLowerCase();
      const hit = [manager.name, manager.shortName, manager.team]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
      if (!hit) {
        return false;
      }
    }

    if (options.formation) {
      if (String(manager.formation || '').toLowerCase() !== options.formation.toLowerCase()) {
        return false;
      }
    }

    if (options.playstyle) {
      const score = Number(manager?.playstyleProficiency?.[options.playstyle] || 0);
      if (score < 1) {
        return false;
      }
    }

    return true;
  });

const sortMockManagers = (managers, options) =>
  managers.sort((a, b) => {
    const key = 'quickCounter';
    const left = Number(a?.playstyleProficiency?.[key] || 0);
    const right = Number(b?.playstyleProficiency?.[key] || 0);
    if (left === right) {
      return 0;
    }
    return left > right ? options.sortOrder : -options.sortOrder;
  });

const buildManagerFilter = (options) => {
  const filter = {};

  if (options.q) {
    filter.$text = { $search: options.q };
  }

  if (options.formation) {
    filter.formation = options.formation;
  }

  if (options.playstyle) {
    filter[`playstyleProficiency.${options.playstyle}`] = { $gte: 1 };
  }

  return filter;
};

const listManagers = async (query) => {
  const options = parseListQuery(query);

  if (!isDatabaseConnected()) {
    const filtered = filterMockManagers(MOCK_MANAGERS, options);
    const sorted = sortMockManagers([...filtered], options);
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

  const filter = buildManagerFilter(options);

  const [items, total] = await Promise.all([
    Manager.find(filter)
      .sort({ 'playstyleProficiency.quickCounter': options.sortOrder, updatedAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    Manager.countDocuments(filter)
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

module.exports = {
  listManagers
};
