import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Student, DailyRecord, TodoItem } from '../types';
import { db } from '../services/db';
import { DUMMY_STUDENTS } from '../services/dummyData';
import { useClass } from './ClassContext'; 
import { useSync } from './SyncContext';

interface JournalContextType {
  currentDate: string;
  setCurrentDate: (date: string) => void;
  students: Student[];
  records: DailyRecord[];
  todos: TodoItem[];
  saveCurrentRecord: (record: DailyRecord) => void;
  updateTodos: (todos: TodoItem[]) => void;
  manageStudents: (newStudents: Student[]) => void;
  isDataLoaded: boolean;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export const JournalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeClassId, isLoading: isClassLoading } = useClass();
  const { markAsDirty } = useSync();

  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const loadJournalData = useCallback(async () => {
    if (activeClassId) {
      try {
        let savedStudents = await db.students.where('classId').equals(activeClassId).toArray();
        if (savedStudents.length === 0) {
          const defaultStudents = DUMMY_STUDENTS.map(s => ({ ...s, classId: activeClassId }));
          await db.students.bulkPut(defaultStudents);
          savedStudents = defaultStudents;
        }
        setStudents(savedStudents);

        const loadedRecords = await db.records.where('classId').equals(activeClassId).toArray();
        setRecords(loadedRecords);

        const loadedTodos = await db.todos.where('classId').equals(activeClassId).toArray();
        setTodos(loadedTodos);
      } catch (error) {
        console.error('Failed to load journal data from IndexedDB:', error);
      } finally {
        setIsDataLoaded(true);
      }
    } else {
      // No class selected, clear data
      setStudents([]);
      setRecords([]);
      setTodos([]);
      setIsDataLoaded(true);
    }
  }, [activeClassId]);

  useEffect(() => {
    if (isClassLoading) {
        setIsDataLoaded(false);
        return;
    }

    loadJournalData();

    // Sync state when storage changes (optional, but good for multi-tab)
    const handleStorageChange = () => {
      loadJournalData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isClassLoading, loadJournalData]);

  const saveCurrentRecord = async (record: DailyRecord) => {
    if (!activeClassId) return;
    
    // Optimistic UI update
    setRecords(prev => {
      const idx = prev.findIndex(r => r.date === record.date);
      if (idx > -1) {
        const newRecords = [...prev];
        newRecords[idx] = record;
        return newRecords;
      }
      return [...prev, record];
    });

    const entity = { ...record, classId: activeClassId, compoundKey: `${activeClassId}_${record.date}` };
    await db.records.put(entity);
    
    markAsDirty();
  };

  const updateTodos = async (newTodos: TodoItem[]) => {
    if (!activeClassId) return;
    
    // Optimistic UI update
    setTodos(newTodos);
    
    const entities = newTodos.map(t => ({ ...t, classId: activeClassId }));
    
    await db.transaction('rw', db.todos, async () => {
      await db.todos.where('classId').equals(activeClassId).delete();
      if (entities.length > 0) {
        await db.todos.bulkPut(entities);
      }
    });

    markAsDirty();
  };

  const manageStudents = async (newStudents: Student[]) => {
    if (!activeClassId) return;
    
    // Optimistic UI update
    setStudents(newStudents);
    
    const entities = newStudents.map(s => ({ ...s, classId: activeClassId }));
    
    await db.transaction('rw', db.students, async () => {
      await db.students.where('classId').equals(activeClassId).delete();
      if (entities.length > 0) {
        await db.students.bulkPut(entities);
      }
    });

    markAsDirty();
  };

  return (
    <JournalContext.Provider value={{
      currentDate,
      setCurrentDate,
      students,
      records,
      todos,
      saveCurrentRecord,
      updateTodos,
      manageStudents,
      isDataLoaded,
    }}>
      {children}
    </JournalContext.Provider>
  );
};

export const useJournal = () => {
  const context = useContext(JournalContext);
  if (context === undefined) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
};
