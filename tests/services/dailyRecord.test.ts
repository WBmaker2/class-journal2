import { describe, expect, it } from 'vitest';
import { createDefaultDailyRecord, mergeAttendanceWithStudents } from '../../src/services/dailyRecord';

describe('createDefaultDailyRecord', () => {
  it('creates a default daily record for the given date and students', () => {
    const students = [
      { id: 'student-1', name: 'Kim', number: 1, notes: [] },
      { id: 'student-2', name: 'Lee', number: 2, notes: [] },
    ];

    const record = createDefaultDailyRecord('2026-03-23', students);

    expect(record).toEqual({
      date: '2026-03-23',
      weather: 'Sunny',
      atmosphere: 'Calm',
      attendance: [
        { studentId: 'student-1', status: 'Present' },
        { studentId: 'student-2', status: 'Present' },
      ],
      lessonLogs: [],
      classLog: '',
      studentNotes: {},
    });
  });
});

describe('mergeAttendanceWithStudents', () => {
  it('preserves existing attendance and appends missing students as present', () => {
    const students = [
      { id: 'student-1', name: 'Kim', number: 1, notes: [] },
      { id: 'student-2', name: 'Lee', number: 2, notes: [] },
      { id: 'student-3', name: 'Park', number: 3, notes: [] },
    ];
    const attendance = [
      { studentId: 'student-1', status: 'Absent' },
      { studentId: 'student-3', status: 'Late' },
    ];

    const merged = mergeAttendanceWithStudents(attendance, students);

    expect(merged).toEqual([
      { studentId: 'student-1', status: 'Absent' },
      { studentId: 'student-3', status: 'Late' },
      { studentId: 'student-2', status: 'Present' },
    ]);
    expect(attendance).toEqual([
      { studentId: 'student-1', status: 'Absent' },
      { studentId: 'student-3', status: 'Late' },
    ]);
  });
});
