import { SiteHeader } from '@/components/layout/site-header';
import { GlossaryLibraryClient } from '@/components/glossary/glossary-library-client';
import { listPlayers } from '@/lib/data/repository';

import descriptions from './descriptions.json';

function toTitleCase(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((token) => {
      if (token.length <= 3 && token.toUpperCase() === token) {
        return token;
      }
      return token.charAt(0).toUpperCase() + token.slice(1);
    })
    .join(' ');
}

function getSkillDescription(label: string): string {
  const normalized = label.trim().toLowerCase().replace(/-/g, ' ').replace(/[^a-z0-9 ]/g, '');
  
  for (const [key, val] of Object.entries(descriptions.skills)) {
    const keyNorm = key.trim().toLowerCase().replace(/-/g, ' ').replace(/[^a-z0-9 ]/g, '');
    if (keyNorm === normalized || keyNorm === normalized + 's' || keyNorm + 's' === normalized) {
      return val;
    }
  }
  return `Mục tra cứu cho ${label}. Trang này giữ tên kỹ thuật English nhưng mô tả bằng tiếng Việt để dùng song song với dữ liệu game gốc.`;
}

function getPlaystyleDescription(label: string): string {
  const normalized = label.trim().toLowerCase().replace(/-/g, ' ').replace(/[^a-z0-9 ]/g, '');
  
  for (const [key, val] of Object.entries(descriptions.playstyles)) {
    const keyNorm = key.trim().toLowerCase().replace(/-/g, ' ').replace(/[^a-z0-9 ]/g, '');
    if (keyNorm === normalized || keyNorm === normalized + 's' || keyNorm + 's' === normalized) {
      return val;
    }
  }
  return `Mục tra cứu cho ${label}. Dùng để hiểu hành vi di chuyển và ưu tiên chiến thuật của cầu thủ trong eFootball.`;
}

function buildGlossaryItems(players: Awaited<ReturnType<typeof listPlayers>>['data']) {
  const map = new Map<string, { id: string; name: string; category: 'player_skill' | 'playstyle' | 'gk_skill'; description: string; tags: string[] }>();

  players.forEach((player) => {
    player.skills.forEach((skill) => {
      const label = toTitleCase(skill);
      const isGkSkill = /\bGK\b/i.test(label) || /^GK/i.test(label) || /Goalkeeping/i.test(label);
      const key = `${isGkSkill ? 'gk_skill' : 'player_skill'}:${label}`;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: label,
          category: isGkSkill ? 'gk_skill' : 'player_skill',
          description: getSkillDescription(label),
          tags: isGkSkill ? ['Goalkeeper', 'Skill'] : ['Player', 'Skill']
        });
      }
    });

    player.playstyles.forEach((playstyle) => {
      const label = toTitleCase(playstyle);
      const key = `playstyle:${label}`;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: label,
          category: 'playstyle',
          description: getPlaystyleDescription(label),
          tags: ['Playstyle', player.positions[0] || 'Role']
        });
      }
    });
  });

  [
    { id: 'player_skill:Double Touch', name: 'Double Touch', category: 'player_skill' as const, description: getSkillDescription('Double Touch'), tags: ['Dribbling', 'Skill'] },
    { id: 'player_skill:One-touch Pass', name: 'One-touch Pass', category: 'player_skill' as const, description: getSkillDescription('One-touch Pass'), tags: ['Passing', 'Skill'] },
    { id: 'playstyle:Goal Poacher', name: 'Goal Poacher', category: 'playstyle' as const, description: getPlaystyleDescription('Goal Poacher'), tags: ['CF', 'Playstyle'] },
    { id: 'playstyle:Build Up', name: 'Build Up', category: 'playstyle' as const, description: getPlaystyleDescription('Build Up'), tags: ['CB', 'Playstyle'] },
    { id: 'gk_skill:GK Low Punt', name: 'GK Low Punt', category: 'gk_skill' as const, description: getSkillDescription('GK Low Punt'), tags: ['Goalkeeper', 'Distribution'] }
  ].forEach((item) => {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  });

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export default async function FeaturesPage() {
  const playersResult = await listPlayers({ page: 1, limit: 80, minOvr: 1, sortBy: 'name_asc' });
  const items = buildGlossaryItems(playersResult.data);

  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/tinh-nang" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        <header className="mb-8">
          <p className="stitch-label-accent">Thư viện · Skills · Playstyles</p>
          <h1 className="stitch-headline text-4xl sm:text-5xl mt-2">Từ điển tính năng</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
            Tra cứu Player Skills, Playstyles và GK Skills bằng tiếng Việt. Dữ liệu tổng hợp
            trực tiếp từ kho cầu thủ của app để luôn khớp với bản build hiện tại.
          </p>
        </header>
        <GlossaryLibraryClient items={items} />
      </main>
    </div>
  );
}
