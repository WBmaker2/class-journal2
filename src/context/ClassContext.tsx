import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { localStorageService } from '../services/localStorage';
import type { Class } from '../types';

interface ClassContextType {
  classes: Class[];
  activeClassId: string | null;
  setActiveClassId: (id: string | null) => void;
  addClass: (name: string) => void;
  updateClass: (id: string, name: string) => void;
  deleteClass: (id: string) => void;
  reorderClasses: (classes: Class[]) => void;
  isLoading: boolean;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export const ClassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [activeClassId, setActiveClassIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    localStorageService.runMigration();
    const allData = localStorageService.getAllData();
    setClasses(allData.classes);
    const savedActiveClassId = allData.activeClassId;
    if (savedActiveClassId) {
      setActiveClassIdState(savedActiveClassId);
    } else if (allData.classes.length > 0) {
      setActiveClassIdState(allData.classes[0].id);
    }
    setIsLoading(false);
  }, []);

  const setActiveClassId = (id: string | null) => {
    setActiveClassIdState(id);
    localStorageService.saveActiveClassId(id);
  };

  const addClass = (name: string) => {
    const newClass: Class = {
      id: self.crypto.randomUUID(),
      name,
      order: classes.length,
    };
    const updatedClasses = [...classes, newClass];
    setClasses(updatedClasses);
    localStorageService.saveClasses(updatedClasses);
    if (!activeClassId) {
        setActiveClassId(newClass.id);
    }
  };

  const updateClass = (id: string, name: string) => {
    const updatedClasses = classes.map(c => c.id === id ? { ...c, name } : c);
    setClasses(updatedClasses);
    localStorageService.saveClasses(updatedClasses);
  };

  const deleteClass = (id: string) => {
    const updatedClasses = classes.filter(c => c.id !== id);
    setClasses(updatedClasses);
    localStorageService.saveClasses(updatedClasses);
    localStorageService.deleteClassData(id);

    if (activeClassId === id) {
        const newActiveClassId = updatedClasses.length > 0 ? updatedClasses[0].id : null;
        setActiveClassId(newActiveClassId);
    }
  };

  const reorderClasses = (newlyOrderedClasses: Class[]) => {
    const updatedClasses = newlyOrderedClasses.map((c, index) => ({ ...c, order: index }));
    setClasses(updatedClasses);
    localStorageService.saveClasses(updatedClasses);
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
        isLoading
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
