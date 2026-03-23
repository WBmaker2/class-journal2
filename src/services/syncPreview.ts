export type SyncPreviewMode = 'conflict' | 'server-update';

interface SyncPreviewState {
  mode: SyncPreviewMode;
  localTime: string | null;
  remoteTime: string;
}

const parseLocalTime = (localTime: string | null): Date | null => {
  if (!localTime) {
    return null;
  }

  const normalized = localTime.includes('T') ? localTime : localTime.replace(' ', 'T');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const createSyncPreviewState = (
  mode: SyncPreviewMode,
  localTime: string | null,
): SyncPreviewState => {
  const localDate = parseLocalTime(localTime);
  const baseTime = localDate ? localDate.getTime() : Date.now();

  return {
    mode,
    localTime,
    remoteTime: new Date(baseTime + 5 * 60 * 1000).toISOString(),
  };
};
