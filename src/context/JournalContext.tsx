import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Student, DailyRecord, TodoItem } from '../types';
import { localStorageService } from '../services/localStorage';
import { DUMMY_STUDENTS } from '../services/dummyData';
import { useClass } from './ClassContext'; 
import { useSupabase } from './SupabaseContext';

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
  const { markAsDirty } = useSupabase();

  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    if (isClassLoading) {
        setIsDataLoaded(false);
        return;
    }

    if (activeClassId) {
      const savedStudents = localStorageService.getStudents(activeClassId);
      if (savedStudents.length === 0) {
        localStorageService.saveStudents(activeClassId, DUMMY_STUDENTS);
        setStudents(DUMMY_STUDENTS);
      } else {
        setStudents(savedStudents);
      }

      setRecords(localStorageService.getAllRecords(activeClassId));
      setTodos(localStorageService.getTodos(activeClassId));
      setIsDataLoaded(true);
    } else {
      // No class selected, clear data
      setStudents([]);
      setRecords([]);
      setTodos([]);
      setIsDataLoaded(true);
    }
  }, [activeClassId, isClassLoading]);

  const saveCurrentRecord = (record: DailyRecord) => {
    if (!activeClassId) return;
    localStorageService.saveRecord(activeClassId, record);
    setRecords(localStorageService.getAllRecords(activeClassId));
    markAsDirty();
  };

  const updateTodos = (newTodos: TodoItem[]) => {
    if (!activeClassId) return;
    localStorageService.saveTodos(activeClassId, newTodos);
    setTodos(newTodos);
    markAsDirty();
  };

  const manageStudents = (newStudents: Student[]) => {
    if (!activeClassId) return;
    localStorageService.saveStudents(activeClassId, newStudents);
    setStudents(newStudents);
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
