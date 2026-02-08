import type { DailyRecord, Student, TodoItem } from '../types';

const KEYS = {
  RECORDS: 'cj_daily_records',
  STUDENTS: 'cj_students',
  TODOS: 'cj_todos',
};

export const localStorageService = {
  // Records
  saveRecord: (record: DailyRecord) => {
    const records = localStorageService.getAllRecords();
    const index = records.findIndex(r => r.date === record.date);
    if (index > -1) {
      records[index] = record;
    } else {
      records.push(record);
    }
    localStorage.setItem(KEYS.RECORDS, JSON.stringify(records));
  },

  getRecord: (date: string): DailyRecord | null => {
    const records = localStorageService.getAllRecords();
    return records.find(r => r.date === date) || null;
  },

  getAllRecords: (): DailyRecord[] => {
    const data = localStorage.getItem(KEYS.RECORDS);
    return data ? JSON.parse(data) : [];
  },

  // Students
  saveStudents: (students: Student[]) => {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
  },

  getStudents: (): Student[] => {
    const data = localStorage.getItem(KEYS.STUDENTS);
    return data ? JSON.parse(data) : [];
  },

  // Todos
  saveTodos: (todos: TodoItem[]) => {
    localStorage.setItem(KEYS.TODOS, JSON.stringify(todos));
  },

  getTodos: (): TodoItem[] => {
    const data = localStorage.getItem(KEYS.TODOS);
    return data ? JSON.parse(data) : [];
  },
};
