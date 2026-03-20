import Dexie, { Table } from 'dexie';
import type { Class, Student, DailyRecord, TodoItem, TimetableTemplate, Subject } from '../types';

export interface StudentEntity extends Student {
  classId: string;
}

export interface RecordEntity extends DailyRecord {
  classId: string;
  compoundKey?: string; // e.g., `${classId}_${date}`
}

export interface TodoEntity extends TodoItem {
  classId: string;
}

export interface MetadataEntity {
  key: string;
  value: any;
}

export class ClassJournalDB extends Dexie {
  classes!: Table<Class, string>;
  students!: Table<StudentEntity, string>;
  records!: Table<RecordEntity, string>;
  todos!: Table<TodoEntity, string>;
  metadata!: Table<MetadataEntity, string>;

  constructor() {
    super('ClassJournalDB');
    this.version(1).stores({
      classes: 'id',
      students: 'id, classId',
      records: 'compoundKey, classId, date',
      todos: 'id, classId',
      metadata: 'key'
    });
  }
}

export const db = new ClassJournalDB();
