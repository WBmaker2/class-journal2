import type { AppDataSnapshot } from './appDataMerge';

export type RemoteSyncResolution = 'none' | 'download' | 'prompt-conflict' | 'prompt-server-update';

interface RemoteSyncDecisionParams {
  isInitial: boolean;
  isDirty: boolean;
  hasLocalData: boolean;
  isRemoteNewer: boolean;
}

export const hasMeaningfulLocalData = (snapshot: AppDataSnapshot): boolean => {
  if (snapshot.classes.length > 0) {
    return true;
  }

  if ((snapshot.templates || []).length > 0) {
    return true;
  }

  return Object.values(snapshot.classData).some((classData) => {
    return classData.students.length > 0 || classData.records.length > 0 || classData.todos.length > 0;
  });
};

export const getRemoteSyncResolution = ({
  isInitial,
  isDirty,
  hasLocalData,
  isRemoteNewer,
}: RemoteSyncDecisionParams): RemoteSyncResolution => {
  if (!isRemoteNewer) {
    return 'none';
  }

  if (isDirty) {
    return 'prompt-conflict';
  }

  if (isInitial && hasLocalData) {
    return 'prompt-server-update';
  }

  return 'download';
};
