(function playerDetailBinding() {
  const pageParts = window.location.pathname.split('/').filter(Boolean);
  const routeRoot = pageParts[0] || '';
  const playerId = pageParts[1] || '';

  if (routeRoot !== 'cau-thu' || !playerId) {
    return;
  }

  const STAT_ALIASES = {
    'Attacking Prowess': ['attackingProwess', 'offensiveAwareness'],
    Finishing: ['finishing'],
    'Low Pass': ['lowPass'],
    Speed: ['speed'],
    Acceleration: ['acceleration'],
    Tackling: ['tackling', 'ballWinning'],
    Interception: ['interception', 'trackingBack'],
    'Defensive Awareness': ['defensiveAwareness'],
    Stamina: ['stamina'],
    'Physical Contact': ['physicalContact']
  };

  const CONDITION_ICONS = {
    A: 'north',
    B: 'north_east',
    C: 'east',
    D: 'south_east',
    E: 'south'
  };

  const q = (selector) => document.querySelector(selector);
  const qa = (selector) => Array.from(document.querySelectorAll(selector));

  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const toTitleCaseFromSlug = (value) =>
    String(value || '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const escapeHtml = (value) =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const normalizeStats = (statsObject) => {
    const normalized = {};
    const entries =
      statsObject instanceof Map
        ? Array.from(statsObject.entries())
        : Object.entries(statsObject || {});

    entries.forEach(([key, value]) => {
      const numeric = toNumber(value);
      if (numeric !== null) {
        normalized[key] = numeric;
      }
    });

    return normalized;
  };

  const pickStatValue = (stats, aliases) => {
    for (const alias of aliases) {
      const numeric = toNumber(stats[alias]);
      if (numeric !== null) {
        return numeric;
      }
    }

    return null;
  };

  const toConditionGrade = (raw) => {
    if (typeof raw === 'string') {
      const grade = raw.trim().toUpperCase();
      if (['A', 'B', 'C', 'D', 'E'].includes(grade)) {
        return grade;
      }
    }

    const numeric = toNumber(raw);
    if (numeric === null) {
      return 'C';
    }

    const map = {
      5: 'A',
      4: 'B',
      3: 'C',
      2: 'D',
      1: 'E',
      0: 'E'
    };

    return map[numeric] || 'C';
  };

  const applyConditionStyle = (card, grade, isActive) => {
    const icon = card.querySelector('[data-condition-icon]');
    if (icon) {
      icon.textContent = CONDITION_ICONS[grade] || 'east';
      icon.classList.remove('text-slate-400', 'text-emerald-400');
      icon.classList.add(isActive ? 'text-emerald-400' : 'text-slate-400');
    }

    card.classList.remove('bg-emerald-500/10', 'border', 'border-emerald-500/30', 'bg-white/5', 'opacity-40', 'grayscale');

    if (isActive) {
      card.classList.add('bg-emerald-500/10', 'border', 'border-emerald-500/30');
    } else {
      card.classList.add('bg-white/5', 'opacity-40', 'grayscale');
    }
  };

  const updateConditionCards = (grade) => {
    qa('[data-condition-card]').forEach((card) => {
      const cardGrade = (card.getAttribute('data-condition-card') || '').toUpperCase();
      const isActive = cardGrade === grade;
      applyConditionStyle(card, cardGrade, isActive);
    });
  };

  const interpolate = (start, end, ratio) => Math.round(start + (end - start) * ratio);

  const deriveLevelStats = (player, level) => {
    const maxLevel = Math.max(
      1,
      toNumber(player?.levels?.max) ||
        toNumber(player?.levelCap) ||
        toNumber(player?.levels?.current) ||
        1
    );

    const level1Stats = normalizeStats(player?.stats?.level1 || {});
    const maxStats = normalizeStats(player?.stats?.maxLevel || {});

    const perLevel = Array.isArray(player?.stats?.perLevel) ? player.stats.perLevel : [];
    const exact = perLevel.find((entry) => toNumber(entry?.level) === level);
    if (exact?.stats) {
      return {
        stats: normalizeStats(exact.stats),
        maxLevel
      };
    }

    const startStats = Object.keys(level1Stats).length > 0 ? level1Stats : maxStats;
    const endStats = Object.keys(maxStats).length > 0 ? maxStats : startStats;

    if (maxLevel <= 1 || level === 1 || startStats === endStats) {
      return {
        stats: { ...startStats },
        maxLevel
      };
    }

    const ratio = (level - 1) / (maxLevel - 1);
    const mergedKeys = new Set([...Object.keys(startStats), ...Object.keys(endStats)]);
    const calculated = {};

    mergedKeys.forEach((key) => {
      const start = toNumber(startStats[key]);
      const end = toNumber(endStats[key]);

      if (start === null && end === null) {
        return;
      }

      const safeStart = start === null ? end : start;
      const safeEnd = end === null ? safeStart : end;
      calculated[key] = interpolate(safeStart, safeEnd, ratio);
    });

    return {
      stats: calculated,
      maxLevel
    };
  };

  const deriveOverallAtLevel = (player, level, maxLevel) => {
    const base = toNumber(player?.overall?.base);
    const max = toNumber(player?.overall?.max);

    if (base === null && max === null) {
      return null;
    }

    if (base === null) {
      return max;
    }

    if (max === null || maxLevel <= 1) {
      return base;
    }

    return interpolate(base, max, (level - 1) / (maxLevel - 1));
  };

  const updateStatRows = (stats) => {
    qa('[data-stat-row]').forEach((row) => {
      const rowName = row.getAttribute('data-stat-row') || '';
      const aliases = STAT_ALIASES[rowName] || [rowName];
      const value = pickStatValue(stats, aliases);

      if (value === null) {
        return;
      }

      const valueNode = row.querySelector('[data-stat-value]');
      const barNode = row.querySelector('[data-stat-bar]');

      if (valueNode) {
        valueNode.textContent = String(value);
        valueNode.classList.remove('text-emerald-400', 'text-amber-500', 'text-slate-500', 'text-slate-400');

        if (value >= 90) {
          valueNode.classList.add('text-emerald-400');
        } else if (value >= 75) {
          valueNode.classList.add('text-amber-500');
        } else {
          valueNode.classList.add('text-slate-500');
        }
      }

      if (barNode) {
        const percentage = Math.max(0, Math.min(100, value));
        barNode.style.width = `${percentage}%`;
        barNode.classList.remove('bg-emerald-500', 'stat-bar-glow', 'bg-amber-500', 'bg-slate-600', 'bg-slate-500');

        if (value >= 90) {
          barNode.classList.add('bg-emerald-500', 'stat-bar-glow');
        } else if (value >= 75) {
          barNode.classList.add('bg-amber-500');
        } else if (value >= 60) {
          barNode.classList.add('bg-slate-500');
        } else {
          barNode.classList.add('bg-slate-600');
        }
      }
    });
  };

  const renderSkills = (skills) => {
    const listNode = q('[data-bind="skills-list"]');
    const countNode = q('[data-bind="skills-count"]');

    if (!listNode) {
      return;
    }

    const normalized = (skills || []).map(toTitleCaseFromSlug).filter(Boolean);

    if (countNode) {
      countNode.textContent = `${normalized.length}/10`;
    }

    if (normalized.length === 0) {
      listNode.innerHTML = '<div class="p-4 text-sm text-slate-400 bg-slate-950/40 rounded-lg border border-white/5">Chưa có Skills</div>';
      return;
    }

    listNode.innerHTML = normalized
      .map(
        (skill) =>
          `<div class="flex items-center justify-between p-4 bg-slate-950/40 rounded-lg border border-white/5 group hover:border-emerald-500/50 transition-colors"><span class="text-sm font-semibold text-slate-200">${escapeHtml(
            skill
          )}</span><span class="material-symbols-outlined text-emerald-500 text-sm">verified</span></div>`
      )
      .join('');
  };

  const renderPlaystyles = (playstyles) => {
    const listNode = q('[data-bind="playstyles-list"]');
    if (!listNode) {
      return;
    }

    const normalized = (playstyles || []).map(toTitleCaseFromSlug).filter(Boolean);

    if (normalized.length === 0) {
      listNode.innerHTML = '<div class="p-4 text-sm text-slate-400 bg-slate-950/40 rounded-lg border border-white/5">Chưa có Playstyles</div>';
      return;
    }

    listNode.innerHTML = normalized
      .slice(0, 3)
      .map(
        (item) =>
          `<div class="p-5 bg-slate-950/40 rounded-lg border border-white/5 flex items-start space-x-4 hover:border-amber-500/50 transition-colors"><span class="material-symbols-outlined text-amber-500">bolt</span><div><h4 class="text-sm font-black text-white">${escapeHtml(
            item
          )}</h4><p class="text-xs text-slate-400 leading-relaxed mt-1.5">Playstyle kích hoạt theo dữ liệu eFootball.</p></div></div>`
      )
      .join('');
  };

  const updateHeader = (player, level, maxLevel, overall) => {
    const playerName = player?.name || 'Chưa có dữ liệu';
    const primaryPosition = Array.isArray(player?.positions) && player.positions.length > 0 ? player.positions[0] : '-';
    const primaryPlaystyle = Array.isArray(player?.playstyles) && player.playstyles.length > 0 ? player.playstyles[0] : 'Player';

    const nameNode = q('[data-bind="player-name"]');
    const positionNode = q('[data-bind="player-position-line"]');
    const cardTypeNode = q('[data-bind="card-type"]');
    const ratingNode = q('[data-bind="overall-rating"]');
    const levelNode = q('[data-bind="level-label"]');
    const imageNode = q('[data-bind="player-card-image"]');

    if (nameNode) {
      nameNode.textContent = playerName.toUpperCase();
    }

    if (positionNode) {
      positionNode.textContent = `${primaryPosition} | ${toTitleCaseFromSlug(primaryPlaystyle).toUpperCase()}`;
    }

    if (cardTypeNode) {
      cardTypeNode.textContent = (player?.cardType || 'Standard').toUpperCase();
    }

    if (ratingNode && overall !== null) {
      ratingNode.textContent = String(overall);
    }

    if (levelNode) {
      levelNode.textContent = `LV. ${level}/${maxLevel}`;
    }

    if (imageNode && player?.images?.card) {
      imageNode.src = player.images.card;
      imageNode.alt = `${playerName} Card`;
    }
  };

  const setSliderBounds = (maxLevel, selectedLevel) => {
    const slider = q('[data-bind="level-slider"]');
    if (!slider) {
      return;
    }

    slider.min = '1';
    slider.max = String(maxLevel);
    slider.value = String(selectedLevel);
  };

  const renderAtLevel = (player, level) => {
    const { stats, maxLevel } = deriveLevelStats(player, level);
    const overall = deriveOverallAtLevel(player, level, maxLevel);

    setSliderBounds(maxLevel, level);
    updateHeader(player, level, maxLevel, overall);
    updateStatRows(stats);
    updateConditionCards(toConditionGrade(player?.condition?.form));
  };

  const renderError = (message) => {
    const nameNode = q('[data-bind="player-name"]');
    const posNode = q('[data-bind="player-position-line"]');

    if (nameNode) {
      nameNode.textContent = 'KHONG TIM THAY';
    }

    if (posNode) {
      posNode.textContent = message;
    }
  };

  const wireSlider = (player) => {
    const slider = q('[data-bind="level-slider"]');
    if (!slider) {
      return;
    }

    slider.addEventListener('input', (event) => {
      const selected = Math.max(1, toNumber(event.target.value) || 1);
      renderAtLevel(player, selected);
    });
  };

  const loadPlayer = async () => {
    try {
      const response = await fetch(`/api/players/${encodeURIComponent(playerId)}`);

      if (!response.ok) {
        renderError('Khong tim thay cau thu tu API.');
        return;
      }

      const payload = await response.json();
      const player = payload?.data;

      if (!player) {
        renderError('Du lieu cau thu khong hop le.');
        return;
      }

      const maxLevel =
        Math.max(1, toNumber(player?.levels?.max) || toNumber(player?.levelCap) || 1);
      const defaultLevel = maxLevel;

      renderAtLevel(player, defaultLevel);
      renderSkills(player?.skills || []);
      renderPlaystyles(player?.playstyles || []);
      wireSlider(player);
    } catch (error) {
      renderError('Loi ket noi den backend.');
    }
  };

  loadPlayer();
})();
