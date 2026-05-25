import type { Pack } from '@/types/domain';

export const PACK_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const PACK_TIMEZONE_LABEL = 'Giờ Việt Nam (UTC+7)';

function formatPackDateTime(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: PACK_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

function formatDurationVi(ms: number) {
  const absoluteMs = Math.max(0, Math.abs(ms));
  const totalMinutes = Math.floor(absoluteMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts = [];
  if (days > 0) {
    parts.push(`${days} ngày`);
  }
  if (hours > 0) {
    parts.push(`${hours} giờ`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes} phút`);
  }
  return parts.slice(0, 2).join(' ');
}

export function getPackTiming(pack: Pick<Pack, 'startsAt' | 'endsAt'>, now = Date.now()) {
  const startsAtMs = Date.parse(pack.startsAt);
  const endsAtMs = Date.parse(pack.endsAt);

  const hasValidStart = Number.isFinite(startsAtMs);
  const hasValidEnd = Number.isFinite(endsAtMs);
  const startsAt = hasValidStart ? new Date(startsAtMs) : null;
  const endsAt = hasValidEnd ? new Date(endsAtMs) : null;

  const status =
    hasValidStart && now < startsAtMs
      ? 'upcoming'
      : hasValidEnd && now > endsAtMs
        ? 'expired'
        : 'active';
  const statusLabel =
    status === 'active' ? 'Đang mở' : status === 'upcoming' ? 'Sắp mở' : 'Đã kết thúc';

  const countdownLabel =
    status === 'upcoming' && hasValidStart
      ? `Mở sau ${formatDurationVi(startsAtMs - now)}`
      : status === 'active' && hasValidEnd
        ? `Còn lại ${formatDurationVi(endsAtMs - now)}`
        : hasValidEnd
          ? `Đã đóng ${formatDurationVi(now - endsAtMs)} trước`
          : 'Không có dữ liệu thời gian';

  return {
    status,
    statusLabel,
    timezone: PACK_TIMEZONE,
    timezoneLabel: PACK_TIMEZONE_LABEL,
    startsAtLabel: startsAt ? formatPackDateTime(startsAt) : 'N/A',
    endsAtLabel: endsAt ? formatPackDateTime(endsAt) : 'N/A',
    timeWindowLabel: `${startsAt ? formatPackDateTime(startsAt) : 'N/A'} - ${
      endsAt ? formatPackDateTime(endsAt) : 'N/A'
    }`,
    countdownLabel
  };
}
