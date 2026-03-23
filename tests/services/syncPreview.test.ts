import { describe, expect, it } from 'vitest';
import { createSyncPreviewState } from '../../src/services/syncPreview';

describe('createSyncPreviewState', () => {
  it('creates a preview payload with a future remote timestamp for server-update mode', () => {
    const preview = createSyncPreviewState('server-update', '2026-03-23 18:30:00');

    expect(preview.mode).toBe('server-update');
    expect(preview.localTime).toBe('2026-03-23 18:30:00');
    expect(new Date(preview.remoteTime).getTime()).toBeGreaterThan(new Date('2026-03-23T18:30:00').getTime());
  });

  it('creates a preview payload for conflict mode even when local time is missing', () => {
    const preview = createSyncPreviewState('conflict', null);

    expect(preview.mode).toBe('conflict');
    expect(preview.localTime).toBeNull();
    expect(typeof preview.remoteTime).toBe('string');
  });
});
