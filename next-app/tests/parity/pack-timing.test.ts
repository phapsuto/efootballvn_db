import test from 'node:test';
import assert from 'node:assert/strict';

import { getPackTiming } from '../../lib/packs/pack-timing';

test('Pack timing shows upcoming countdown with Ho Chi Minh timezone precision', () => {
  const timing = getPackTiming(
    {
      startsAt: '2026-04-20T10:00:00.000Z',
      endsAt: '2026-04-27T09:59:00.000Z'
    },
    Date.parse('2026-04-20T08:30:00.000Z')
  );

  assert.equal(timing.status, 'upcoming');
  assert.equal(timing.statusLabel, 'Sắp mở');
  assert.match(timing.startsAtLabel, /20\/04\/2026/);
  assert.match(timing.startsAtLabel, /17:00/);
  assert.match(timing.countdownLabel, /Mở sau/);
});

test('Pack timing shows active countdown and expired state correctly', () => {
  const activeTiming = getPackTiming(
    {
      startsAt: '2026-04-17T09:00:00.000Z',
      endsAt: '2026-04-17T12:00:00.000Z'
    },
    Date.parse('2026-04-17T10:15:00.000Z')
  );
  assert.equal(activeTiming.status, 'active');
  assert.match(activeTiming.countdownLabel, /Còn lại/);

  const expiredTiming = getPackTiming(
    {
      startsAt: '2026-04-10T09:00:00.000Z',
      endsAt: '2026-04-10T12:00:00.000Z'
    },
    Date.parse('2026-04-10T12:45:00.000Z')
  );
  assert.equal(expiredTiming.status, 'expired');
  assert.match(expiredTiming.countdownLabel, /Đã đóng/);
});
