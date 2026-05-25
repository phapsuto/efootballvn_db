(function managersListBinding() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (!(parts.length === 1 && parts[0] === 'hlv')) {
    return;
  }

  const q = (selector) => document.querySelector(selector);
  const searchInput = q('[data-bind="managers-search"]');
  const formationSelect = q('[data-bind="managers-formation"]');
  const playstyleSelect = q('[data-bind="managers-playstyle"]');
  const listNode = q('[data-bind="managers-list"]');

  if (!listNode) {
    return;
  }

  const state = {
    page: 1,
    limit: 20,
    q: '',
    formation: '',
    playstyle: ''
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

  const bestStyle = (manager) => {
    const map = manager?.playstyleProficiency || {};
    const items = Object.entries(map);
    if (items.length === 0) {
      return { key: 'quickCounter', value: 0, label: 'Quick Counter' };
    }

    items.sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0));
    const [key, value] = items[0];
    const label = String(key)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return { key, value: Number(value || 0), label };
  };

  const renderManagers = (managers) => {
    if (!Array.isArray(managers) || managers.length === 0) {
      listNode.innerHTML =
        '<div class="p-6 rounded-lg border border-white/10 bg-slate-900 text-slate-300">Không có HLV phù hợp bộ lọc hiện tại.</div>';
      return;
    }

    listNode.innerHTML = managers
      .map((manager) => {
        const name = escapeHtml(manager.name || 'Unknown');
        const team = escapeHtml(manager.team || '-');
        const formation = escapeHtml(manager.formation || '-');
        const image = escapeHtml(
          manager.imageUrl ||
            'https://placehold.co/120x120/111827/94a3b8?text=No+Image'
        );
        const styles = manager.playstyleProficiency || {};
        const quickCounter = toNumber(styles.quickCounter, 0);
        const possession = toNumber(styles.possessionGame, 0);
        const lbc = toNumber(styles.longBallCounter, 0);
        const outWide = toNumber(styles.outWide, 0);
        const highlight = bestStyle(manager);

        return `<div class="group bg-slate-900 hover:bg-slate-800 border border-white/5 transition-all duration-300 p-5 rounded-lg flex flex-col md:flex-row items-center gap-6 shadow-lg hover:shadow-emerald-500/5">
  <div class="w-20 h-20 rounded-lg overflow-hidden bg-slate-950 border border-white/10">
    <img alt="${name}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" src="${image}"/>
  </div>
  <div class="flex-1 min-w-0">
    <div class="flex items-center gap-3 mb-2">
      <h3 class="text-2xl font-black text-white italic truncate tracking-tight">${name}</h3>
      <span class="bg-slate-800 border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 uppercase">${team}</span>
    </div>
    <div class="flex items-center gap-5">
      <div class="flex items-center gap-1.5">
        <span class="material-symbols-outlined text-emerald-500 text-sm">grid_view</span>
        <span class="text-sm font-medium text-slate-300">${formation}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="material-symbols-outlined text-blue-400 text-sm">bolt</span>
        <span class="text-sm font-medium text-slate-300">${escapeHtml(highlight.label)}: ${highlight.value}</span>
      </div>
    </div>
  </div>
  <div class="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
    <div class="bg-slate-950 p-3 rounded-lg min-w-[85px] text-center border-b-2 border-white/10">
      <div class="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">POS</div>
      <div class="text-lg font-black text-white">${possession}</div>
    </div>
    <div class="bg-slate-950 p-3 rounded-lg min-w-[85px] text-center border-b-2 border-emerald-500">
      <div class="text-[9px] text-emerald-500 font-bold uppercase tracking-wider mb-1">QC</div>
      <div class="text-lg font-black text-emerald-400">${quickCounter}</div>
    </div>
    <div class="bg-slate-950 p-3 rounded-lg min-w-[85px] text-center border-b-2 border-white/10">
      <div class="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">LBC</div>
      <div class="text-lg font-black text-white">${lbc}</div>
    </div>
    <div class="bg-slate-950 p-3 rounded-lg min-w-[85px] text-center border-b-2 border-white/10">
      <div class="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">OW</div>
      <div class="text-lg font-black text-white">${outWide}</div>
    </div>
  </div>
</div>`;
      })
      .join('');
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set('page', String(state.page));
    params.set('limit', String(state.limit));
    params.set('sortOrder', 'desc');

    if (state.q) {
      params.set('q', state.q);
    }
    if (state.formation) {
      params.set('formation', state.formation);
    }
    if (state.playstyle) {
      params.set('playstyle', state.playstyle);
    }

    return params.toString();
  };

  const loadManagers = async () => {
    try {
      const response = await fetch(`/api/managers?${buildQuery()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const managers = Array.isArray(payload?.data) ? payload.data : [];
      renderManagers(managers);
    } catch (error) {
      listNode.innerHTML =
        '<div class="p-6 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200">Lỗi tải dữ liệu HLV từ API.</div>';
    }
  };

  const applyFilters = () => {
    state.page = 1;
    state.q = (searchInput?.value || '').trim();

    const formation = (formationSelect?.value || '').trim();
    state.formation = formation.toLowerCase().startsWith('tất cả') ? '' : formation;

    const playstyle = (playstyleSelect?.value || '').trim();
    if (playstyle.toLowerCase().startsWith('mọi')) {
      state.playstyle = '';
    } else if (playstyle === 'Quick Counter') {
      state.playstyle = 'quickCounter';
    } else if (playstyle === 'Possession Game') {
      state.playstyle = 'possessionGame';
    } else if (playstyle === 'Long Ball Counter') {
      state.playstyle = 'longBallCounter';
    } else if (playstyle === 'Out Wide') {
      state.playstyle = 'outWide';
    } else {
      state.playstyle = '';
    }

    loadManagers();
  };

  searchInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      applyFilters();
    }
  });
  formationSelect?.addEventListener('change', applyFilters);
  playstyleSelect?.addEventListener('change', applyFilters);

  loadManagers();
})();
