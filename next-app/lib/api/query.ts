export function parsePositiveInt(
  value: string | null,
  fallback: number,
  max: number
) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, max);
}

export function parseOptionalNumberInRange(
  value: string | null,
  min: number,
  max: number
) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.min(max, Math.max(min, parsed));
}

type ParseTextOptions = {
  maxLength?: number;
};

export function parseOptionalText(
  value: string | null,
  options: ParseTextOptions = {}
) {
  if (!value) {
    return undefined;
  }

  const maxLength = Math.max(1, options.maxLength ?? 120);
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, maxLength);
}

export function parseEnum<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T
): T {
  if (!value) {
    return fallback;
  }

  return allowed.includes(value as T) ? (value as T) : fallback;
}
