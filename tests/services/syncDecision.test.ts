import { describe, expect, it } from 'vitest';
import {
  getRemoteSyncResolution,
  hasMeaningfulLocalData,
} from '../../src/services/syncDecision';

describe('hasMeaningfulLocalData', () => {
  it('treats a fresh snapshot with only default metadata as empty', () => {
    const snapshot = {
      classes: [],
      activeClassId: null,
      templates: [],
      subjects: [
        { id: 'subject-0', name: '국어', order: 0 },
        { id: 'subject-1', name: '수학', order: 1 },
      ],
      classData: {},
    };

    expect(hasMeaningfulLocalData(snapshot)).toBe(false);
  });

  it('treats existing classes or class data as meaningful local data', () => {
    const snapshot = {
      classes: [{ id: 'class-a', name: '1반', order: 0 }],
      activeClassId: 'class-a',
      templates: [],
      subjects: [],
      classData: {
        'class-a': {
          students: [{ id: 'student-1', name: 'Kim', number: 1, notes: [] }],
          records: [],
          todos: [],
        },
      },
    };

    expect(hasMeaningfulLocalData(snapshot)).toBe(true);
  });
});

describe('getRemoteSyncResolution', () => {
  it('prompts a merge-first review on initial login when local data exists and the server is newer', () => {
    expect(
      getRemoteSyncResolution({
        isInitial: true,
        isDirty: false,
        hasLocalData: true,
        isRemoteNewer: true,
      }),
    ).toBe('prompt-server-update');
  });

  it('keeps the existing conflict prompt when local edits are dirty', () => {
    expect(
      getRemoteSyncResolution({
        isInitial: false,
        isDirty: true,
        hasLocalData: true,
        isRemoteNewer: true,
      }),
    ).toBe('prompt-conflict');
  });

  it('auto-downloads on initial login when there is no meaningful local data', () => {
    expect(
      getRemoteSyncResolution({
        isInitial: true,
        isDirty: false,
        hasLocalData: false,
        isRemoteNewer: true,
      }),
    ).toBe('download');
  });
});
