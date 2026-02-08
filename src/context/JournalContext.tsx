import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Student, DailyRecord, TodoItem } from '../types';
import { localStorageService } from '../services/localStorage';
import { DUMMY_STUDENTS } from '../services/dummyData';

interface JournalContextType {
  currentDate: string;
  setCurrentDate: (date: string) => void;
  students: Student[];
  records: DailyRecord[];
  todos: TodoItem[];
  saveCurrentRecord: (record: DailyRecord) => void;
  updateTodos: (todos: TodoItem[]) => void;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export const JournalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);

  useEffect(() => {
    // Initialize data
    const savedStudents = localStorageService.getStudents();
    if (savedStudents.length === 0) {
      localStorageService.saveStudents(DUMMY_STUDENTS);
      setStudents(DUMMY_STUDENTS);
    } else {
      setStudents(savedStudents);
    }

    setRecords(localStorageService.getAllRecords());
    setTodos(localStorageService.getTodos());
  }, []);

  const saveCurrentRecord = (record: DailyRecord) => {
    localStorageService.saveRecord(record);
    setRecords(localStorageService.getAllRecords());
  };

  const updateTodos = (newTodos: TodoItem[]) => {
    localStorageService.saveTodos(newTodos);
    setTodos(newTodos);
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
