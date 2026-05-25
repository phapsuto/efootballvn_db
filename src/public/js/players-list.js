(function playersListBinding() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (!(parts.length === 1 && parts[0] === 'cau-thu')) {
    return;
  }

  const q = (selector) => document.querySelector(selector);

  const searchInput = q('[data-bind="players-search"]');
  const minOvrInput = q('[data-bind="players-min-ovr"]');
  const applyButton = q('[data-action="apply-player-filters"]');
  const totalNode = q('[data-bind="players-total"]');
  const gridNode = q('[data-bind="players-grid"]');
  const compactListNode = q('[data-bind="players-compact-list"]');

  if (!gridNode) {
    return;
  }

  const state = {
    page: 1,
    limit: 24,
    q: '',
    minOvr: 70
  };

  const escapeHtml = (value) =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const toStat = (player, keyList) => {
    const stats = player?.stats?.maxLevel || {};
    for (const key of keyList) {
      const value = toNumber(stats[key], NaN);
      if (!Number.isNaN(value)) {
        return value;
      }
    }
    return 0;
  };

  const renderGrid = (players) => {
    if (!Array.isArray(players) || players.length === 0) {
      gridNode.innerHTML =
        '<div class="col-span-full p-6 rounded-xl border border-white/10 bg-slate-900/70 text-sm text-slate-300">Không có cầu thủ phù hợp bộ lọc hiện tại.</div>';
      return;
    }

    gridNode.innerHTML = players
      .map((player) => {
        const id = encodeURIComponent(player.efhubId || player.slug || '');
        const image = escapeHtml(
          player?.images?.card ||
            player?.images?.portrait ||
            'https://placehold.co/320x420/111827/94a3b8?text=No+Image'
        );
        const name = escapeHtml(player.name || 'Unknown');
        const club = escapeHtml(player.club || '-');
        const cardType = escapeHtml(player.cardType || 'Standard');
        const position = escapeHtml((player.positions && player.positions[0]) || '-');
        const ovr = toNumber(player?.overall?.max || player?.overall?.base, 0);
        const spd = toStat(player, ['speed']);
        const dri = toStat(player, ['dribbling', 'ballControl', 'tightPossession']);
        const pas = toStat(player, ['lowPass', 'loftedPass']);

        return `<a href="/cau-thu/${id}" class="group relative bg-slate-900 p-4 rounded-xl border border-white/5 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/5">
  <div class="absolute top-4 right-4 z-10 text-right">
    <div class="text-4xl font-black text-emerald-500 italic leading-none">${ovr}</div>
    <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">OVR</div>
  </div>
  <div class="relative w-full aspect-[4/5] mb-4 bg-slate-800 rounded-lg overflow-hidden">
    <img alt="${name}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" src="${image}"/>
    <div class="absolute bottom-0 left-0 p-3 w-full bg-gradient-to-t from-slate-900 to-transparent">
      <span class="bg-emerald-500 text-slate-950 px-2 py-0.5 text-[10px] font-black rounded uppercase">${cardType}</span>
    </div>
  </div>
  <div class="flex justify-between items-start">
    <div>
      <h3 class="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors uppercase">${name}</h3>
      <div class="flex items-center gap-2 mt-1">
        <span class="text-emerald-500 font-bold text-[10px] px-1.5 py-0.5 bg-emerald-500/10 rounded">${position}</span>
        <span class="text-slate-500 text-[10px] font-bold uppercase">${club}</span>
      </div>
    </div>
  </div>
  <div class="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
    <div class="text-center"><div class="text-xs font-bold text-slate-200">${spd}</div><div class="text-[8px] font-bold text-slate-500 uppercase">SPD</div></div>
    <div class="text-center border-x border-white/5"><div class="text-xs font-bold text-slate-200">${dri}</div><div class="text-[8px] font-bold text-slate-500 uppercase">DRI</div></div>
    <div class="text-center"><div class="text-xs font-bold text-slate-200">${pas}</div><div class="text-[8px] font-bold text-slate-500 uppercase">PAS</div></div>
  </div>
</a>`;
      })
      .join('');
  };

  const renderCompactList = (players) => {
    if (!compactListNode) {
      return;
    }

    const compact = (players || []).slice(0, 5);
    if (compact.length === 0) {
      compactListNode.innerHTML =
        '<div class="py-4 text-sm text-slate-400">Chưa có dữ liệu cầu thủ để hiển thị.</div>';
      return;
    }

    compactListNode.innerHTML = compact
      .map((player) => {
        const id = encodeURIComponent(player.efhubId || player.slug || '');
        const image = escapeHtml(
          player?.images?.thumbnail ||
            player?.images?.card ||
            'https://placehold.co/80x80/111827/94a3b8?text=No+Image'
        );
        const name = escapeHtml(player.name || 'Unknown');
        const club = escapeHtml(player.club || '-');
        const position = escapeHtml((player.positions && player.positions[0]) || '-');
        const ovr = toNumber(player?.overall?.max || player?.overall?.base, 0);
        const def = toStat(player, ['defensiveAwareness', 'ballWinning']);
        const phy = toStat(player, ['physicalContact', 'stamina']);

        return `<a href="/cau-thu/${id}" class="flex items-center justify-between py-3 border-b border-white/5 hover:bg-white/5 transition-all px-3 rounded-lg cursor-pointer">
  <div class="flex items-center gap-4">
    <div class="w-12 h-12 bg-slate-800 rounded-lg overflow-hidden">
      <img alt="${name}" class="w-full h-full object-cover" src="${image}"/>
    </div>
    <div>
      <div class="text-sm font-bold text-white uppercase">${name}</div>
      <div class="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">${position} | ${club}</div>
    </div>
  </div>
  <div class="flex gap-8 items-center">
    <div class="text-center w-12"><div class="text-[8px] font-bold text-slate-500">DEF</div><div class="text-sm font-black text-emerald-500">${def}</div></div>
    <div class="text-center w-12"><div class="text-[8px] font-bold text-slate-500">PHY</div><div class="text-sm font-black text-white">${phy}</div></div>
    <div class="text-2xl font-black text-emerald-500 w-12 text-right italic">${ovr}</div>
  </div>
</a>`;
      })
      .join('');
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set('page', String(state.page));
    params.set('limit', String(state.limit));
    params.set('sortBy', 'overall.max');
    params.set('sortOrder', 'desc');

    if (state.q) {
      params.set('q', state.q);
    }
    if (state.minOvr > 0) {
      params.set('minOvr', String(state.minOvr));
    }

    return params.toString();
  };

  const loadPlayers = async () => {
    if (totalNode) {
      totalNode.textContent = 'Đang tải dữ liệu cầu thủ...';
    }

    try {
      const response = await fetch(`/api/players?${buildQuery()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const players = Array.isArray(payload?.data) ? payload.data : [];
      const total = toNumber(payload?.meta?.total, players.length);

      if (totalNode) {
        totalNode.textContent = `Tìm thấy ${total.toLocaleString('vi-VN')} cầu thủ phù hợp`;
      }

      renderGrid(players);
      renderCompactList(players);
    } catch (error) {
      if (totalNode) {
        totalNode.textContent = 'Không thể tải dữ liệu cầu thủ.';
      }
      gridNode.innerHTML =
        '<div class="col-span-full p-6 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-200">Lỗi tải dữ liệu từ API.</div>';
    }
  };

  const applyFilters = () => {
    state.page = 1;
    state.q = (searchInput?.value || '').trim();
    state.minOvr = toNumber(minOvrInput?.value, 70);
    loadPlayers();
  };

  applyButton?.addEventListener('click', applyFilters);
  searchInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      applyFilters();
    }
  });
  minOvrInput?.addEventListener('change', applyFilters);

  loadPlayers();
})();
