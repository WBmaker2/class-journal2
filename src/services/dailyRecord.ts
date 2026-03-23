import type { AttendanceEntry, DailyRecord, Student } from '../types';

export const createDefaultDailyRecord = (
  date: string,
  students: Pick<Student, 'id'>[],
  overrides: Partial<Omit<DailyRecord, 'date'>> = {},
): DailyRecord => {
  return {
    date,
    weather: 'Sunny',
    atmosphere: 'Calm',
    attendance: students.map((student) => ({ studentId: student.id, status: 'Present' })),
    lessonLogs: [],
    classLog: '',
    studentNotes: {},
    ...overrides,
  };
};

export const mergeAttendanceWithStudents = (
  attendance: AttendanceEntry[],
  students: Pick<Student, 'id'>[],
): AttendanceEntry[] => {
  const existingStudentIds = new Set(attendance.map((entry) => entry.studentId));

  return [
    ...attendance,
    ...students
      .filter((student) => !existingStudentIds.has(student.id))
      .map((student) => ({ studentId: student.id, status: 'Present' as const })),
  ];
};
