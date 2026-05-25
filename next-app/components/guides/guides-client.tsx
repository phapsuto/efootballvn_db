'use client';

import React, { useState } from 'react';
import { Search, X, BookOpen, Award, Shield, Plus, Check, Loader2, Play } from 'lucide-react';

type GuideItem = {
  id: string;
  category: string;
  title: string;
  summary: string;
  content: string;
  diagramUrl?: string;
};

interface GuidesClientProps {
  initialGuides: GuideItem[];
}

export function GuidesClient({ initialGuides }: GuidesClientProps) {
  const [guides, setGuides] = useState<GuideItem[]>(initialGuides);
  const [activeTab, setActiveTab] = useState<'all' | 'terms' | 'controls' | 'playstyles'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuide, setSelectedGuide] = useState<GuideItem | null>(null);
  
  // Admin Mode state
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  
  // Admin Form input states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Chỉ số & Thuật ngữ');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [diagramUrl, setDiagramUrl] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const filteredGuides = guides.filter((guide) => {
    const matchesSearch =
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'terms' && guide.category === 'Chỉ số & Thuật ngữ') ||
      (activeTab === 'controls' && guide.category === 'Kỹ thuật điều khiển') ||
      (activeTab === 'playstyles' && guide.category === 'Lối chơi đồng đội');

    return matchesSearch && matchesTab;
  });

  const handleCreateGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !content.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ các trường thông tin bắt buộc.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/guides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          category: category.trim(),
          summary: summary.trim(),
          content: content.trim(),
          diagramUrl: diagramUrl.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi xuất bản bài viết.');
      }

      // Prepend to local state
      setGuides((prev) => [data, ...prev]);
      setSuccessMsg('Xuất bản cẩm nang thành công!');
      
      // Reset form
      setTitle('');
      setSummary('');
      setContent('');
      setDiagramUrl('');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Có lỗi không xác định.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Toggle Panel */}
      <div className="flex justify-between items-center bg-surface-container/30 px-6 py-3 rounded-xl border border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Shield className={`w-5 h-5 ${isAdminMode ? 'text-primary animate-pulse' : 'text-on-surface-variant/40'}`} />
          <div>
            <p className="text-xs font-bold text-on-surface">Chế độ Quản trị viên</p>
            <p className="text-[10px] text-on-surface-variant">Tạo & chỉnh sửa cẩm nang hướng dẫn meta.</p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsAdminMode(!isAdminMode);
            if (isAdminMode) setShowAdminForm(false);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
            isAdminMode
              ? 'bg-primary/20 text-primary border-primary/40 shadow-inner'
              : 'bg-white/5 text-on-surface-variant border-white/5 hover:bg-white/10'
          }`}
        >
          {isAdminMode ? 'Thoát Admin' : 'Kích hoạt Admin'}
        </button>
      </div>

      {/* Admin Guide Form (Collapsible) */}
      {isAdminMode && (
        <div className="bg-surface-container/60 p-6 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md space-y-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-base font-black text-on-surface flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Viết cẩm nang mới &amp; cập nhật Meta
            </h3>
            <button
              onClick={() => setShowAdminForm(!showAdminForm)}
              className="text-xs font-bold text-primary uppercase tracking-wider hover:underline"
            >
              {showAdminForm ? 'Thu gọn form [-]' : 'Mở rộng form [+]'}
            </button>
          </div>

          {(showAdminForm || !showAdminForm) && (
            <form onSubmit={handleCreateGuide} className={`space-y-4 ${showAdminForm ? 'block' : 'hidden'}`}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Tiêu đề cẩm nang *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Lối chơi tạt cánh đánh đầu Out Wide mới..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-surface-container-high/60 border border-white/5 rounded-xl text-sm focus:outline-none focus:border-primary/50 text-on-surface"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Danh mục *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-surface-container-high/60 border border-white/5 rounded-xl text-sm focus:outline-none focus:border-primary/50 text-on-surface"
                  >
                    <option value="Chỉ số & Thuật ngữ">Chỉ số &amp; Thuật ngữ</option>
                    <option value="Kỹ thuật điều khiển">Kỹ thuật điều khiển</option>
                    <option value="Lối chơi đồng đội">Lối chơi đồng đội</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Tóm tắt ngắn *</label>
                <input
                  type="text"
                  required
                  placeholder="Mô tả tóm tắt nội dung cẩm nang trong 1-2 câu..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-4 py-2 bg-surface-container-high/60 border border-white/5 rounded-xl text-sm focus:outline-none focus:border-primary/50 text-on-surface"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Sơ đồ chiến thuật / Diagram URL (Tùy chọn)</label>
                  <select
                    value={diagramUrl}
                    onChange={(e) => setDiagramUrl(e.target.value)}
                    className="w-full px-4 py-2 bg-surface-container-high/60 border border-white/5 rounded-xl text-sm focus:outline-none focus:border-primary/50 text-on-surface"
                  >
                    <option value="">Không sử dụng sơ đồ</option>
                    <option value="/images/playstyles/possession_game.png">Possession Game Diagram</option>
                    <option value="/images/playstyles/quick_counter.png">Quick Counter Diagram</option>
                    <option value="/images/playstyles/long_ball_counter.png">Long Ball Counter Diagram</option>
                    <option value="/images/playstyles/out_wide.png">Out Wide Diagram</option>
                    <option value="/images/playstyles/long_ball.png">Long Ball Diagram</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Hoặc link ảnh tự do</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={diagramUrl.startsWith('/images/') ? '' : diagramUrl}
                    onChange={(e) => setDiagramUrl(e.target.value)}
                    disabled={diagramUrl.startsWith('/images/')}
                    className="w-full px-4 py-2 bg-surface-container-high/60 border border-white/5 rounded-xl text-sm focus:outline-none focus:border-primary/50 text-on-surface disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Nội dung hướng dẫn chuyên sâu *</label>
                <textarea
                  required
                  rows={8}
                  placeholder="Nhập toàn bộ bài phân tích lối chơi, cách phối hợp, mẹo tay cầm và setup đội hình..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-high/60 border border-white/5 rounded-xl text-sm focus:outline-none focus:border-primary/50 text-on-surface font-sans leading-relaxed"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold">
                  ⚠️ {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1">
                  <Check className="w-4 h-4 text-emerald-400" /> {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-primary text-on-primary font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 flex justify-center items-center gap-2 hover:-translate-y-0.5 disabled:opacity-55"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang xuất bản...
                  </>
                ) : (
                  'Xuất bản cẩm nang mới'
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Controls & Tabs Container */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-surface-container/60 p-4 rounded-xl backdrop-blur-md border border-white/5">
        {/* Tabs */}
        <div className="flex flex-wrap p-1 bg-surface-container-high/40 rounded-lg border border-white/5 gap-1 md:gap-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-md transition-all ${
              activeTab === 'all'
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-md transition-all ${
              activeTab === 'terms'
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Chỉ số &amp; Thuật ngữ
          </button>
          <button
            onClick={() => setActiveTab('controls')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-md transition-all ${
              activeTab === 'controls'
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Kỹ thuật chơi
          </button>
          <button
            onClick={() => setActiveTab('playstyles')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-md transition-all ${
              activeTab === 'playstyles'
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Lối chơi đồng đội
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm thuật ngữ hoặc kỹ thuật..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-surface-container-high/40 text-on-surface placeholder-on-surface-variant/60 rounded-xl border border-white/5 focus:outline-none focus:border-primary/50 transition-all text-sm backdrop-blur-md"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Cards */}
      {filteredGuides.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGuides.map((guide) => (
            <div
              key={guide.id}
              onClick={() => setSelectedGuide(guide)}
              className="group cursor-pointer flex flex-col justify-between p-6 bg-surface-container/40 hover:bg-surface-container-high/60 border border-white/5 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`stitch-chip text-[10px] uppercase font-bold tracking-wider ${
                      guide.category === 'Chỉ số & Thuật ngữ'
                        ? 'stitch-chip-emerald'
                        : guide.category === 'Lối chơi đồng đội'
                        ? 'stitch-chip-amber'
                        : 'stitch-chip-sky'
                    }`}
                  >
                    {guide.category}
                  </span>
                  <BookOpen className="w-4 h-4 text-on-surface-variant/40 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-lg font-black text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                  {guide.title}
                </h3>
                <p className="text-sm leading-6 text-on-surface-variant/80 line-clamp-3">
                  {guide.summary}
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary group-hover:underline">
                  Đọc cẩm nang →
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-surface-container/20 rounded-2xl border border-white/5 text-center">
          <BookOpen className="w-12 h-12 text-on-surface-variant/40 mb-3" />
          <h3 className="text-lg font-bold text-on-surface">Không tìm thấy nội dung phù hợp</h3>
          <p className="text-sm text-on-surface-variant mt-1">
            Hãy thử tìm kiếm với các từ khóa khác hoặc chuyển danh mục.
          </p>
        </div>
      )}

      {/* Glassmorphic Modal */}
      {selectedGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-lg transition-opacity duration-300">
          <div
            className="absolute inset-0 bg-transparent"
            onClick={() => setSelectedGuide(null)}
          />
          <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-surface-container rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header background glow */}
            <div
              className={`absolute top-0 inset-x-0 h-40 bg-gradient-to-b opacity-10 pointer-events-none ${
                selectedGuide.category === 'Chỉ số & Thuật ngữ'
                  ? 'from-emerald-500 to-transparent'
                  : selectedGuide.category === 'Lối chơi đồng đội'
                  ? 'from-amber-500 to-transparent'
                  : 'from-sky-500 to-transparent'
              }`}
            />

            {/* Modal Header */}
            <div className="relative flex items-start justify-between p-6 sm:p-8 pb-4 border-b border-white/5">
              <div>
                <span
                  className={`stitch-chip text-[10px] uppercase font-bold tracking-wider ${
                    selectedGuide.category === 'Chỉ số & Thuật ngữ'
                      ? 'stitch-chip-emerald'
                      : selectedGuide.category === 'Lối chơi đồng đội'
                      ? 'stitch-chip-amber'
                      : 'stitch-chip-sky'
                  }`}
                >
                  {selectedGuide.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-on-surface mt-2 pr-8">
                  {selectedGuide.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedGuide(null)}
                className="absolute top-6 right-6 z-50 p-2 rounded-full bg-white/5 text-on-surface-variant hover:text-on-surface hover:bg-white/10 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6">
              <div className="p-4 rounded-xl bg-surface-container-high/60 border border-white/5 text-sm leading-6 text-on-surface">
                <strong>Tóm tắt:</strong> {selectedGuide.summary}
              </div>

              {/* Diagram Illustration */}
              {selectedGuide.diagramUrl && (
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 aspect-square max-w-md mx-auto shadow-inner group">
                  <img
                    src={selectedGuide.diagramUrl}
                    alt={`Sơ đồ chiến thuật ${selectedGuide.title}`}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md border border-white/10 text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1">
                    <Play className="w-3.5 h-3.5 fill-primary text-primary" /> Sơ đồ Meta Konami
                  </div>
                </div>
              )}

              {/* Guide Content */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                  <Award className="w-4 h-4" />
                  <span>Phân tích &amp; Hướng dẫn</span>
                </div>
                <div className="text-sm sm:text-base leading-7 text-on-surface-variant space-y-4 whitespace-pre-line">
                  {selectedGuide.content}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
