import type { Class, DailyRecord, Student, Subject, TimetableTemplate, TodoItem } from '../types';

export interface ClassData {
  students: Student[];
  records: DailyRecord[];
  todos: TodoItem[];
}

export interface AppDataSnapshot {
  classes: Class[];
  activeClassId: string | null;
  classData: Record<string, ClassData>;
  templates?: TimetableTemplate[];
  subjects?: Subject[];
}

const getRecordWeight = (record: DailyRecord): number => {
  return (record.classLog?.length || 0) + Object.keys(record.studentNotes || {}).length * 10;
};

export const mergeAppData = (local: AppDataSnapshot, remote: AppDataSnapshot): AppDataSnapshot => {
  const merged: AppDataSnapshot = {
    ...local,
    classes: [...local.classes],
    classData: { ...local.classData },
    templates: [...(local.templates || [])],
    subjects: local.subjects ? [...local.subjects] : local.subjects,
  };

  const localClassIds = new Set(local.classes.map((classItem) => classItem.id));
  remote.classes.forEach((remoteClass) => {
    if (!localClassIds.has(remoteClass.id)) {
      merged.classes.push(remoteClass);
    }
  });

  const allClassIds = new Set([...Object.keys(local.classData), ...Object.keys(remote.classData)]);

  allClassIds.forEach((classId) => {
    const localClassData = local.classData[classId];
    const remoteClassData = remote.classData[classId];

    if (!localClassData && remoteClassData) {
      merged.classData[classId] = remoteClassData;
      return;
    }

    if (!localClassData || !remoteClassData) {
      return;
    }

    const localStudentIds = new Set(localClassData.students.map((student) => student.id));
    const mergedStudents = [...localClassData.students];
    remoteClassData.students.forEach((remoteStudent) => {
      if (!localStudentIds.has(remoteStudent.id)) {
        mergedStudents.push(remoteStudent);
      }
    });

    const localTodoIds = new Set(localClassData.todos.map((todo) => todo.id));
    const mergedTodos = [...localClassData.todos];
    remoteClassData.todos.forEach((remoteTodo) => {
      if (!localTodoIds.has(remoteTodo.id)) {
        mergedTodos.push(remoteTodo);
      }
    });

    const mergedRecords = [...localClassData.records];
    remoteClassData.records.forEach((remoteRecord) => {
      const localRecordIndex = mergedRecords.findIndex((record) => record.date === remoteRecord.date);

      if (localRecordIndex === -1) {
        mergedRecords.push(remoteRecord);
        return;
      }

      const localRecord = mergedRecords[localRecordIndex];
      if (getRecordWeight(remoteRecord) > getRecordWeight(localRecord)) {
        mergedRecords[localRecordIndex] = remoteRecord;
      }
    });

    merged.classData[classId] = {
      students: mergedStudents,
      records: mergedRecords,
      todos: mergedTodos,
    };
  });

  const localTemplateIds = new Set((local.templates || []).map((template) => template.id));
  (remote.templates || []).forEach((remoteTemplate) => {
    if (!localTemplateIds.has(remoteTemplate.id)) {
      if (!merged.templates) {
        merged.templates = [];
      }
      merged.templates.push(remoteTemplate);
    }
  });

  return merged;
};
