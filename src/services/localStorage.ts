import type { DailyRecord, Student, TodoItem, Class, TimetableTemplate, Subject } from '../types';

const V1_KEYS = {
  RECORDS: 'cj_daily_records',
  STUDENTS: 'cj_students',
  TODOS: 'cj_todos',
};

const V2_KEY = 'cj_data';

const DEFAULT_SUBJECTS = ['국어', '수학', '사회', '과학', '도덕', '영어', '음악', '미술', '체육', '창체'];

interface ClassData {
  students: Student[];
  records: DailyRecord[];
  todos: TodoItem[];
}

interface AppData {
  classes: Class[];
  activeClassId: string | null;
  classData: Record<string, ClassData>;
  templates?: TimetableTemplate[];
  subjects?: Subject[];
}

const getInitialData = (): AppData => ({
  classes: [],
  activeClassId: null,
  classData: {},
  templates: [],
  subjects: DEFAULT_SUBJECTS.map((name, index) => ({
    id: `subject-${index}`,
    name,
    order: index
  })),
});

export const localStorageService = {
  runMigration: () => {
    const v1Records = localStorage.getItem(V1_KEYS.RECORDS);
    const v1Students = localStorage.getItem(V1_KEYS.STUDENTS);
    const v2DataExists = localStorage.getItem(V2_KEY);

    if ((v1Records || v1Students) && !v2DataExists) {
      const defaultClass: Class = { id: 'default', name: '기본 학급', order: 0 };
      const records = v1Records ? JSON.parse(v1Records) : [];
      const students = v1Students ? JSON.parse(v1Students) : [];
      const todos = localStorage.getItem(V1_KEYS.TODOS) ? JSON.parse(localStorage.getItem(V1_KEYS.TODOS)!) : [];

      const newData: AppData = {
        classes: [defaultClass],
        activeClassId: defaultClass.id,
        classData: {
          [defaultClass.id]: {
            records,
            students,
            todos,
          }
        },
        subjects: DEFAULT_SUBJECTS.map((name, index) => ({
          id: `subject-${index}`,
          name,
          order: index
        })),
      };
      
      localStorage.setItem(V2_KEY, JSON.stringify(newData));
      localStorage.removeItem(V1_KEYS.RECORDS);
      localStorage.removeItem(V1_KEYS.STUDENTS);
      localStorage.removeItem(V1_KEYS.TODOS);
    }
  },
  
  getAllData: (): AppData => {
    const dataStr = localStorage.getItem(V2_KEY);
    if (!dataStr) return getInitialData();
    
    const data: AppData = JSON.parse(dataStr);
    
    // Ensure subjects are initialized even for existing v2 data
    if (!data.subjects || data.subjects.length === 0) {
      data.subjects = DEFAULT_SUBJECTS.map((name, index) => ({
        id: `subject-${index}`,
        name,
        order: index
      }));
      localStorageService.saveAllData(data);
    }
    
    return data;
  },

  saveAllData: (data: AppData) => {
    localStorage.setItem(V2_KEY, JSON.stringify(data));
  },
  
  // Class specific data getters
  getClassData: (classId: string): ClassData => {
    const data = localStorageService.getAllData();
    return data.classData[classId] || { students: [], records: [], todos: [] };
  },

  // Records
  saveRecord: (classId: string, record: DailyRecord) => {
    const data = localStorageService.getAllData();
    if (!data.classData[classId]) data.classData[classId] = { students: [], records: [], todos: [] };
    
    const records = data.classData[classId].records;
    const index = records.findIndex(r => r.date === record.date);
    if (index > -1) {
      records[index] = record;
    } else {
      records.push(record);
    }
    localStorageService.saveAllData(data);
  },

  getRecord: (classId: string, date: string): DailyRecord | null => {
    const classData = localStorageService.getClassData(classId);
    return classData.records.find(r => r.date === date) || null;
  },

  getAllRecords: (classId: string): DailyRecord[] => {
    return localStorageService.getClassData(classId).records;
  },

  saveRecords: (classId: string, newRecords: DailyRecord[]) => {
    const data = localStorageService.getAllData();
    if (!data.classData[classId]) data.classData[classId] = { students: [], records: [], todos: [] };
    data.classData[classId].records = newRecords;
    localStorageService.saveAllData(data);
  },

  // Students
  saveStudents: (classId: string, students: Student[]) => {
    const data = localStorageService.getAllData();
    if (!data.classData[classId]) data.classData[classId] = { students: [], records: [], todos: [] };
    data.classData[classId].students = students;
    localStorageService.saveAllData(data);
  },

  getStudents: (classId: string): Student[] => {
    return localStorageService.getClassData(classId).students;
  },

  // Todos
  saveTodos: (classId: string, todos: TodoItem[]) => {
    const data = localStorageService.getAllData();
    if (!data.classData[classId]) data.classData[classId] = { students: [], records: [], todos: [] };
    data.classData[classId].todos = todos;
    localStorageService.saveAllData(data);
  },

  getTodos: (classId: string): TodoItem[] => {
    return localStorageService.getClassData(classId).todos;
  },

  // Classes
  saveClasses: (classes: Class[]) => {
    const data = localStorageService.getAllData();
    data.classes = classes;
    localStorageService.saveAllData(data);
  },

  deleteClassData: (classId: string) => {
    const data = localStorageService.getAllData();
    delete data.classData[classId];
    localStorageService.saveAllData(data);
  },

  // Active Class
  saveActiveClassId: (classId: string | null) => {
    const data = localStorageService.getAllData();
    data.activeClassId = classId;
    localStorageService.saveAllData(data);
  },

  // Timetable Templates
  saveTemplates: (templates: TimetableTemplate[]) => {
    const data = localStorageService.getAllData();
    data.templates = templates;
    localStorageService.saveAllData(data);
  },

  getTemplates: (): TimetableTemplate[] => {
    const data = localStorageService.getAllData();
    return data.templates || [];
  },

  // Subjects
  saveSubjects: (subjects: Subject[]) => {
    const data = localStorageService.getAllData();
    data.subjects = subjects;
    localStorageService.saveAllData(data);
  },

  getSubjects: (): Subject[] => {
    const data = localStorageService.getAllData();
    return data.subjects || [];
  },

  updateClassTimetable: (classId: string, timetable: any) => {
    const data = localStorageService.getAllData();
    const classIdx = data.classes.findIndex(c => c.id === classId);
    if (classIdx > -1) {
      data.classes[classIdx].timetable = timetable;
      localStorageService.saveAllData(data);
    }
  }
};
