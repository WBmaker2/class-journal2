import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, migrateFromLocalStorage } from '../services/db';
import { useSync } from './SyncContext';
import { useToast } from './ToastContext';
import type { Class, Timetable, TimetableTemplate, Subject } from '../types';

const DEFAULT_SUBJECTS = ['국어', '수학', '사회', '과학', '도덕', '영어', '음악', '미술', '체육', '창체'];

interface ClassContextType {
  classes: Class[];
  activeClassId: string | null;
  setActiveClassId: (id: string | null) => void;
  addClass: (name: string) => void;
  updateClass: (id: string, name: string) => void;
  deleteClass: (id: string) => void;
  reorderClasses: (classes: Class[]) => void;
  isLoading: boolean;
  templates: TimetableTemplate[];
  saveTemplate: (name: string, data: Timetable) => void;
  deleteTemplate: (id: string) => void;
  updateTimetable: (classId: string, timetable: Timetable) => void;
  subjects: Subject[];
  addSubject: (name: string) => void;
  updateSubject: (id: string, name: string) => void;
  deleteSubject: (id: string) => void;
  reorderSubjects: (subjects: Subject[]) => void;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export const ClassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [activeClassId, setActiveClassIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState<TimetableTemplate[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const { markAsDirty } = useSync();
  const { showToast } = useToast();

  const loadAllData = async () => {
    try {
      await migrateFromLocalStorage();

      const loadedClasses = await db.classes.toArray();
      loadedClasses.sort((a, b) => a.order - b.order);
      setClasses(loadedClasses);

      const loadedTemplatesMeta = await db.metadata.get('templates');
      setTemplates((loadedTemplatesMeta?.value as TimetableTemplate[]) || []);

      let loadedSubjectsMeta = await db.metadata.get('subjects');
      if (!loadedSubjectsMeta?.value || (loadedSubjectsMeta.value as Subject[]).length === 0) {
        const defaultSubjects = DEFAULT_SUBJECTS.map((name, index) => ({
          id: `subject-${index}`,
          name,
          order: index
        }));
        await db.metadata.put({ key: 'subjects', value: defaultSubjects });
        loadedSubjectsMeta = { key: 'subjects', value: defaultSubjects };
      }
      setSubjects(loadedSubjectsMeta.value as Subject[]);

      const savedActiveClassIdMeta = await db.metadata.get('activeClassId');
      if (savedActiveClassIdMeta?.value) {
        setActiveClassIdState(savedActiveClassIdMeta.value as string);
      } else if (loadedClasses.length > 0) {
        setActiveClassIdState(loadedClasses[0].id);
      }
    } catch (e) {
      console.error('Failed to load data from IndexedDB:', e);
      showToast('데이터를 불러오는데 실패했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();

    const handleStorageChange = () => {
      loadAllData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setActiveClassId = async (id: string | null) => {
    setActiveClassIdState(id);
    if (id) {
      await db.metadata.put({ key: 'activeClassId', value: id });
    } else {
      await db.metadata.delete('activeClassId');
    }
    markAsDirty();
  };

  const addClass = async (name: string) => {
    const newClass: Class = {
      id: self.crypto.randomUUID(),
      name,
      order: classes.length,
    };
    const updatedClasses = [...classes, newClass];
    setClasses(updatedClasses);
    
    await db.classes.put(newClass);
    if (!activeClassId) {
        setActiveClassId(newClass.id);
    }
    markAsDirty();
  };

  const updateClass = async (id: string, name: string) => {
    const updatedClasses = classes.map(c => c.id === id ? { ...c, name } : c);
    setClasses(updatedClasses);
    
    const classToUpdate = updatedClasses.find(c => c.id === id);
    if (classToUpdate) {
      await db.classes.put(classToUpdate);
    }
    markAsDirty();
  };

  const deleteClass = async (id: string) => {
    const updatedClasses = classes.filter(c => c.id !== id);
    setClasses(updatedClasses);
    
    await db.transaction('rw', [db.classes, db.students, db.records, db.todos], async () => {
      await db.classes.delete(id);
      await db.students.where('classId').equals(id).delete();
      await db.records.where('classId').equals(id).delete();
      await db.todos.where('classId').equals(id).delete();
    });

    if (activeClassId === id) {
        const newActiveClassId = updatedClasses.length > 0 ? updatedClasses[0].id : null;
        setActiveClassId(newActiveClassId);
    }
    markAsDirty();
  };

  const reorderClasses = async (newlyOrderedClasses: Class[]) => {
    const updatedClasses = newlyOrderedClasses.map((c, index) => ({ ...c, order: index }));
    setClasses(updatedClasses);
    await db.classes.bulkPut(updatedClasses);
    markAsDirty();
  };

  const saveTemplate = async (name: string, data: Timetable) => {
    const newTemplate: TimetableTemplate = {
      id: self.crypto.randomUUID(),
      name,
      data,
    };
    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    await db.metadata.put({ key: 'templates', value: updatedTemplates });
    markAsDirty();
  };

  const deleteTemplate = async (id: string) => {
    const updatedTemplates = templates.filter(t => t.id !== id);
    setTemplates(updatedTemplates);
    await db.metadata.put({ key: 'templates', value: updatedTemplates });
    markAsDirty();
  };

  const updateTimetable = async (classId: string, timetable: Timetable) => {
    const updatedClasses = classes.map(c => c.id === classId ? { ...c, timetable } : c);
    setClasses(updatedClasses);
    const classToUpdate = updatedClasses.find(c => c.id === classId);
    if (classToUpdate) {
      await db.classes.put(classToUpdate);
    }
    markAsDirty();
  };

  const addSubject = async (name: string) => {
    const newSubject: Subject = {
      id: self.crypto.randomUUID(),
      name,
      order: subjects.length,
    };
    const updatedSubjects = [...subjects, newSubject];
    setSubjects(updatedSubjects);
    await db.metadata.put({ key: 'subjects', value: updatedSubjects });
    markAsDirty();
  };

  const updateSubject = async (id: string, name: string) => {
    const updatedSubjects = subjects.map(s => s.id === id ? { ...s, name } : s);
    setSubjects(updatedSubjects);
    await db.metadata.put({ key: 'subjects', value: updatedSubjects });
    markAsDirty();
  };

  const deleteSubject = async (id: string) => {
    const updatedSubjects = subjects.filter(s => s.id !== id);
    setSubjects(updatedSubjects);
    await db.metadata.put({ key: 'subjects', value: updatedSubjects });
    markAsDirty();
  };

  const reorderSubjects = async (newlyOrderedSubjects: Subject[]) => {
    const updatedSubjects = newlyOrderedSubjects.map((s, index) => ({ ...s, order: index }));
    setSubjects(updatedSubjects);
    await db.metadata.put({ key: 'subjects', value: updatedSubjects });
    markAsDirty();
  };

  return (
    <ClassContext.Provider value={{ 
        classes, 
        activeClassId, 
        setActiveClassId,
        addClass,
        updateClass,
        deleteClass,
        reorderClasses,
        isLoading,
        templates,
        saveTemplate,
        deleteTemplate,
        updateTimetable,
        subjects,
        addSubject,
        updateSubject,
        deleteSubject,
        reorderSubjects
    }}>
      {children}
    </ClassContext.Provider>
  );
};

export const useClass = () => {
  const context = useContext(ClassContext);
  if (context === undefined) {
    throw new Error('useClass must be used within a ClassProvider');
  }
  return context;
};
