import Dexie, { Table } from 'dexie';
import type { Class, Student, DailyRecord, TodoItem } from '../types';

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
  value: unknown;
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

// Helper functions for data migration and access

export const migrateFromLocalStorage = async () => {
  const isMigrated = await db.metadata.get('migratedFromLocalStorage');
  if (isMigrated?.value) return;

  const v2DataStr = localStorage.getItem('cj_data');
  if (v2DataStr) {
    try {
      const data = JSON.parse(v2DataStr);
      await importDatabase(data);
      await db.metadata.put({ key: 'migratedFromLocalStorage', value: true });
      console.log('Successfully migrated data from localStorage to IndexedDB');
    } catch (e) {
      console.error('Failed to migrate data from localStorage:', e);
    }
  } else {
    // No existing data, just mark as migrated
    await db.metadata.put({ key: 'migratedFromLocalStorage', value: true });
  }
};

export const exportDatabase = async () => {
  const classes = await db.classes.toArray();
  const students = await db.students.toArray();
  const records = await db.records.toArray();
  const todos = await db.todos.toArray();
  
  const activeClassIdMeta = await db.metadata.get('activeClassId');
  const templatesMeta = await db.metadata.get('templates');
  const subjectsMeta = await db.metadata.get('subjects');

  const classData: Record<string, unknown> = {};
  
  classes.forEach(c => {
    classData[c.id] = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      students: students.filter(s => s.classId === c.id).map(({ classId: _cid, ...rest }) => rest),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      records: records.filter(r => r.classId === c.id).map(({ classId: _cid, compoundKey: _ck, ...rest }) => rest),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      todos: todos.filter(t => t.classId === c.id).map(({ classId: _cid, ...rest }) => rest),
    };
  });

  return {
    classes,
    activeClassId: activeClassIdMeta?.value || null,
    templates: templatesMeta?.value || [],
    subjects: subjectsMeta?.value || [],
    classData
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const importDatabase = async (data: Record<string, any>) => {
  await db.transaction('rw', db.classes, db.students, db.records, db.todos, db.metadata, async () => {
    await db.classes.clear();
    await db.students.clear();
    await db.records.clear();
    await db.todos.clear();
    // Don't clear metadata completely to preserve things like migratedFromLocalStorage
    
    if (data.classes && data.classes.length > 0) {
      await db.classes.bulkPut(data.classes);
    }
    
    if (data.activeClassId) await db.metadata.put({ key: 'activeClassId', value: data.activeClassId });
    if (data.templates) await db.metadata.put({ key: 'templates', value: data.templates });
    if (data.subjects) await db.metadata.put({ key: 'subjects', value: data.subjects });
    
    if (data.classData) {
      const studentsToPut: StudentEntity[] = [];
      const recordsToPut: RecordEntity[] = [];
      const todosToPut: TodoEntity[] = [];

      for (const classId of Object.keys(data.classData)) {
        const cd = data.classData[classId];
        
        if (cd.students) {
          studentsToPut.push(...cd.students.map((s: Student) => ({ ...s, classId })));
        }
        if (cd.records) {
          recordsToPut.push(...cd.records.map((r: DailyRecord) => ({ 
            ...r, 
            classId,
            compoundKey: `${classId}_${r.date}`
          })));
        }
        if (cd.todos) {
          todosToPut.push(...cd.todos.map((t: TodoItem) => ({ ...t, classId })));
        }
      }

      if (studentsToPut.length > 0) await db.students.bulkPut(studentsToPut);
      if (recordsToPut.length > 0) await db.records.bulkPut(recordsToPut);
      if (todosToPut.length > 0) await db.todos.bulkPut(todosToPut);
    }
  });
};

