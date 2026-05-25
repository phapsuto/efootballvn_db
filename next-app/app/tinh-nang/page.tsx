import { SiteHeader } from '@/components/layout/site-header';
import { GlossaryLibraryClient } from '@/components/glossary/glossary-library-client';
import { listPlayers } from '@/lib/data/repository';

const SKILL_DESCRIPTIONS: Record<string, string> = {
  'Double Touch': 'Kỹ thuật rê bóng hai nhịp giúp cầu thủ đổi hướng nhanh và thoát pressing trong phạm vi hẹp.',
  'One-touch Pass': 'Tăng độ mượt và độ chính xác cho các đường chuyền một chạm khi nhịp luân chuyển cần thật nhanh.',
  'Through Passing': 'Nâng chất lượng các đường chọc khe xuyên tuyến cho những tình huống xé khối phòng ngự.',
  'Long Range Shooting': 'Tạo lợi thế cho các pha dứt điểm ngoài vòng cấm với lực và quỹ đạo ổn định hơn.',
  'First Time Shot': 'Giúp cầu thủ kết thúc bóng ngay nhịp đầu mà không cần thêm chạm chỉnh sửa.',
  'GK Low Punt': 'Cho phép thủ môn phát bóng thấp và nhanh để chuyển trạng thái phản công trực tiếp.',
  'Man Marking': 'Tăng khả năng bám người khi cần khóa một mối đe dọa cụ thể của đối phương.',
  'Interception': 'Cải thiện đọc đường chuyền và khả năng cắt bóng ở khu vực trung tuyến hoặc hành lang trong.'
};

const PLAYSTYLE_DESCRIPTIONS: Record<string, string> = {
  'Goal Poacher': 'Tiền đạo luôn tìm khoảng trống sau lưng hàng thủ và ưu tiên chạy cắt mặt để dứt điểm sớm.',
  'Build Up': 'Trung vệ lùi thấp để nhận bóng và khởi phát build-up an toàn ngay từ tuyến dưới.',
  'Box To Box': 'Tiền vệ hoạt động trọn chiều dài sân, hỗ trợ cả pressing lẫn xâm nhập khu vực 16m50.',
  'Creative Playmaker': 'Nhạc trưởng tổ chức bóng ở half-space, ưu tiên chuyền mở khóa và giữ nhịp tấn công.',
  'Mazing Run': 'Thiên hướng kéo bóng và vượt tuyến bằng những pha rê dắt trực diện.',
  'Incisive Run': 'Xu hướng bứt vào khoảng trống phía sau hàng tiền vệ để nhận đường chuyền quyết định.'
};

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
          description:
            SKILL_DESCRIPTIONS[label] ||
            `Mục tra cứu cho ${label}. Trang này giữ tên kỹ thuật English nhưng mô tả bằng tiếng Việt để dùng song song với dữ liệu game gốc.`,
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
          description:
            PLAYSTYLE_DESCRIPTIONS[label] ||
            `Mục tra cứu cho ${label}. Dùng để hiểu hành vi di chuyển và ưu tiên chiến thuật của cầu thủ trong eFootball.`,
          tags: ['Playstyle', player.positions[0] || 'Role']
        });
      }
    });
  });

  [
    { id: 'player_skill:Double Touch', name: 'Double Touch', category: 'player_skill' as const, description: SKILL_DESCRIPTIONS['Double Touch'], tags: ['Dribbling', 'Skill'] },
    { id: 'player_skill:One-touch Pass', name: 'One-touch Pass', category: 'player_skill' as const, description: SKILL_DESCRIPTIONS['One-touch Pass'], tags: ['Passing', 'Skill'] },
    { id: 'playstyle:Goal Poacher', name: 'Goal Poacher', category: 'playstyle' as const, description: PLAYSTYLE_DESCRIPTIONS['Goal Poacher'], tags: ['CF', 'Playstyle'] },
    { id: 'playstyle:Build Up', name: 'Build Up', category: 'playstyle' as const, description: PLAYSTYLE_DESCRIPTIONS['Build Up'], tags: ['CB', 'Playstyle'] },
    { id: 'gk_skill:GK Low Punt', name: 'GK Low Punt', category: 'gk_skill' as const, description: SKILL_DESCRIPTIONS['GK Low Punt'], tags: ['Goalkeeper', 'Distribution'] }
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
