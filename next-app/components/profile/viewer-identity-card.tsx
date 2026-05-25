'use client';

import { Copy, Check, RefreshCw, Save, KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; message: string };

export function ViewerIdentityCard() {
  const [viewerId, setViewerId] = useState('');
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [copied, setCopied] = useState(false);

  const loadCurrent = async () => {
    setStatus({ kind: 'loading' });
    try {
      const res = await fetch('/api/viewer/session', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { viewerId?: string };
      setViewerId(data.viewerId || '');
      setStatus({ kind: 'idle' });
    } catch {
      setStatus({ kind: 'error', message: 'Không tải được mã viewer hiện tại.' });
    }
  };

  useEffect(() => {
    void loadCurrent();
  }, []);

  const copy = async () => {
    if (!viewerId) return;
    try {
      await navigator.clipboard.writeText(viewerId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setStatus({ kind: 'error', message: 'Trình duyệt không cho phép copy tự động. Hãy chọn và copy thủ công.' });
    }
  };

  const restore = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setStatus({ kind: 'loading' });
    try {
      const res = await fetch('/api/viewer/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewerId: trimmed })
      });
      const data = (await res.json().catch(() => ({}))) as { viewerId?: string; message?: string };
      if (!res.ok) {
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      setViewerId(data.viewerId || trimmed);
      setInput('');
      setStatus({ kind: 'success', message: 'Đã khôi phục hồ sơ. Tải lại trang để thấy build và follows của bạn.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không khôi phục được mã viewer.';
      setStatus({ kind: 'error', message });
    }
  };

  const resetFresh = async () => {
    if (!confirm('Tạo hồ sơ mới sẽ mất quyền truy cập mã hiện tại nếu bạn chưa sao lưu. Tiếp tục?')) {
      return;
    }
    setStatus({ kind: 'loading' });
    try {
      await fetch('/api/viewer/session', { method: 'DELETE' });
      await loadCurrent();
      setStatus({ kind: 'success', message: 'Đã tạo hồ sơ mới. Mã viewer của bạn đã được thay đổi.' });
    } catch {
      setStatus({ kind: 'error', message: 'Không thể reset phiên.' });
    }
  };

  return (
    <section className="rounded-xl bg-surface-container p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <KeyRound className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="stitch-label-accent">Mã hồ sơ ẩn danh</p>
          <h2 className="stitch-section-title mt-1">Mã viewer</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Mã này giữ build, follows và dữ liệu cá nhân của bạn. Cookie hết hạn sau 30 ngày — hãy sao lưu mã
            để khôi phục trên thiết bị khác hoặc sau khi xoá cookie.
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-surface-container-high/60 p-4 space-y-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-outline">Mã hiện tại</div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 truncate rounded-md border border-on-surface/10 bg-background/60 px-3 py-2 font-mono text-sm text-primary-fixed">
            {viewerId || '—'}
          </code>
          <button
            type="button"
            onClick={copy}
            disabled={!viewerId}
            className="inline-flex items-center gap-2 rounded-lg border border-on-surface/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-on-surface transition-all hover:bg-white/10 disabled:opacity-40"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Đã copy' : 'Copy mã'}
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-surface-container-high/60 p-4 space-y-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-outline">Khôi phục từ mã đã lưu</div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Dán mã viewer của bạn"
            className="h-11 flex-1 rounded-lg border border-on-surface/10 bg-background/60 px-3 font-mono text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={restore}
            disabled={!input.trim() || status.kind === 'loading'}
            className="stitch-cta inline-flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Save className="h-4 w-4" />
            Khôi phục
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={resetFresh}
          className="inline-flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-error transition-all hover:bg-error/20"
        >
          <RefreshCw className="h-4 w-4" />
          Tạo hồ sơ mới
        </button>
        <p className="text-[11px] text-outline">
          Ai có mã này sẽ đăng nhập được vào hồ sơ ẩn danh của bạn. Giữ an toàn như mật khẩu.
        </p>
      </div>

      {status.kind === 'error' ? (
        <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-xs text-error">
          {status.message}
        </div>
      ) : null}
      {status.kind === 'success' ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-primary-fixed">
          {status.message}
        </div>
      ) : null}
    </section>
  );
}
