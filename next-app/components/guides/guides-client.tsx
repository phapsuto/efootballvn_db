'use client';

import React, { useState } from 'react';
import { Search, X, BookOpen, Award } from 'lucide-react';

type GuideItem = {
  id: string;
  category: string;
  title: string;
  summary: string;
  content: string;
};

interface GuidesClientProps {
  initialGuides: GuideItem[];
}

export function GuidesClient({ initialGuides }: GuidesClientProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'terms' | 'controls'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuide, setSelectedGuide] = useState<GuideItem | null>(null);

  const filteredGuides = initialGuides.filter((guide) => {
    const matchesSearch =
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'terms' && guide.category === 'Chỉ số & Thuật ngữ') ||
      (activeTab === 'controls' && guide.category === 'Kỹ thuật điều khiển');

    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      {/* Controls & Tabs Container */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-surface-container/60 p-4 rounded-xl backdrop-blur-md border border-white/5">
        {/* Tabs */}
        <div className="flex p-1 bg-surface-container-high/40 rounded-lg max-w-max border border-white/5">
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
            Chỉ số & Thuật ngữ
          </button>
          <button
            onClick={() => setActiveTab('controls')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-md transition-all ${
              activeTab === 'controls'
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Kỹ thuật điều khiển
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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-on-surface-variant hover:text-on-surface hover:bg-white/10 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6">
              <div className="p-4 rounded-xl bg-surface-container-high/60 border border-white/5 text-sm leading-6 text-on-surface">
                <strong>Tóm tắt:</strong> {selectedGuide.summary}
              </div>

              {/* Guide Content */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                  <Award className="w-4 h-4" />
                  <span>Phân tích & Hướng dẫn</span>
                </div>
                <div className="text-sm sm:text-base leading-7 text-on-surface-variant space-y-4 whitespace-pre-line">
                  {selectedGuide.content}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-surface-container-high/60 border-t border-white/5 flex justify-end">
              <button
                onClick={() => setSelectedGuide(null)}
                className="px-5 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-lg bg-primary text-on-primary hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
              >
                Đóng cẩm nang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
