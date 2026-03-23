import { describe, expect, it } from 'vitest';
import { mergeAppData } from '../../src/services/appDataMerge';

describe('mergeAppData', () => {
  it('merges classes, class data, templates, and record conflicts conservatively', () => {
    const local = {
      classes: [{ id: 'class-a', name: 'Class A', order: 0 }],
      activeClassId: 'class-a',
      classData: {
        'class-a': {
          students: [{ id: 'student-1', name: 'Kim', number: 1, notes: [] }],
          records: [
            {
              date: '2026-03-23',
              weather: 'Sunny',
              atmosphere: 'Calm',
              attendance: [],
              lessonLogs: [],
              classLog: 'short note',
              studentNotes: { 'student-1': 'one' },
            },
          ],
          todos: [{ id: 'todo-1', content: 'Local todo', completed: false }],
        },
      },
      templates: [{ id: 'template-local', name: 'Local template', data: { days: {} } }],
      subjects: [{ id: 'subject-local', name: 'Local subject', order: 0 }],
    };

    const remote = {
      classes: [
        { id: 'class-a', name: 'Class A', order: 0 },
        { id: 'class-b', name: 'Class B', order: 1 },
      ],
      activeClassId: 'class-b',
      classData: {
        'class-a': {
          students: [
            { id: 'student-1', name: 'Kim', number: 1, notes: [] },
            { id: 'student-2', name: 'Lee', number: 2, notes: [] },
          ],
          records: [
            {
              date: '2026-03-23',
              weather: 'Sunny',
              atmosphere: 'Calm',
              attendance: [],
              lessonLogs: [],
              classLog: 'a much longer remote note that should win the conflict',
              studentNotes: { 'student-1': 'one', 'student-2': 'two' },
            },
            {
              date: '2026-03-24',
              weather: 'Cloudy',
              atmosphere: 'Energetic',
              attendance: [],
              lessonLogs: [],
              classLog: 'remote only',
              studentNotes: {},
            },
          ],
          todos: [
            { id: 'todo-1', content: 'Remote todo', completed: true },
            { id: 'todo-2', content: 'Remote only todo', completed: false },
          ],
        },
        'class-b': {
          students: [{ id: 'student-3', name: 'Park', number: 3, notes: [] }],
          records: [],
          todos: [],
        },
      },
      templates: [
        { id: 'template-local', name: 'Local template', data: { days: {} } },
        { id: 'template-remote', name: 'Remote template', data: { days: {} } },
      ],
      subjects: [{ id: 'subject-remote', name: 'Remote subject', order: 1 }],
    };

    const merged = mergeAppData(local, remote);

    expect(merged.classes).toEqual([
      { id: 'class-a', name: 'Class A', order: 0 },
      { id: 'class-b', name: 'Class B', order: 1 },
    ]);
    expect(merged.activeClassId).toBe('class-a');
    expect(merged.classData['class-a'].students).toEqual([
      { id: 'student-1', name: 'Kim', number: 1, notes: [] },
      { id: 'student-2', name: 'Lee', number: 2, notes: [] },
    ]);
    expect(merged.classData['class-a'].todos).toEqual([
      { id: 'todo-1', content: 'Local todo', completed: false },
      { id: 'todo-2', content: 'Remote only todo', completed: false },
    ]);
    expect(merged.classData['class-a'].records).toEqual([
      {
        date: '2026-03-23',
        weather: 'Sunny',
        atmosphere: 'Calm',
        attendance: [],
        lessonLogs: [],
        classLog: 'a much longer remote note that should win the conflict',
        studentNotes: { 'student-1': 'one', 'student-2': 'two' },
      },
      {
        date: '2026-03-24',
        weather: 'Cloudy',
        atmosphere: 'Energetic',
        attendance: [],
        lessonLogs: [],
        classLog: 'remote only',
        studentNotes: {},
      },
    ]);
    expect(merged.classData['class-b']).toEqual(remote.classData['class-b']);
    expect(merged.templates).toEqual([
      { id: 'template-local', name: 'Local template', data: { days: {} } },
      { id: 'template-remote', name: 'Remote template', data: { days: {} } },
    ]);
    expect(merged.subjects).toEqual(local.subjects);
  });
});
