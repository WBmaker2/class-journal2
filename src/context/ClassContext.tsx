import React, { createContext, useContext, useState, useEffect } from 'react';
import { localStorageService } from '../services/localStorage';
import type { Class, Timetable, TimetableTemplate, Subject } from '../types';

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

  useEffect(() => {
    localStorageService.runMigration();
    const allData = localStorageService.getAllData();
    setClasses(allData.classes);
    setTemplates(allData.templates || []);
    setSubjects(allData.subjects || []);
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

  const saveTemplate = (name: string, data: Timetable) => {
    const newTemplate: TimetableTemplate = {
      id: self.crypto.randomUUID(),
      name,
      data,
    };
    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorageService.saveTemplates(updatedTemplates);
  };

  const deleteTemplate = (id: string) => {
    const updatedTemplates = templates.filter(t => t.id !== id);
    setTemplates(updatedTemplates);
    localStorageService.saveTemplates(updatedTemplates);
  };

  const updateTimetable = (classId: string, timetable: Timetable) => {
    const updatedClasses = classes.map(c => c.id === classId ? { ...c, timetable } : c);
    setClasses(updatedClasses);
    localStorageService.updateClassTimetable(classId, timetable);
  };

  const addSubject = (name: string) => {
    const newSubject: Subject = {
      id: self.crypto.randomUUID(),
      name,
      order: subjects.length,
    };
    const updatedSubjects = [...subjects, newSubject];
    setSubjects(updatedSubjects);
    localStorageService.saveSubjects(updatedSubjects);
  };

  const updateSubject = (id: string, name: string) => {
    const updatedSubjects = subjects.map(s => s.id === id ? { ...s, name } : s);
    setSubjects(updatedSubjects);
    localStorageService.saveSubjects(updatedSubjects);
  };

  const deleteSubject = (id: string) => {
    const updatedSubjects = subjects.filter(s => s.id !== id);
    setSubjects(updatedSubjects);
    localStorageService.saveSubjects(updatedSubjects);
  };

  const reorderSubjects = (newlyOrderedSubjects: Subject[]) => {
    const updatedSubjects = newlyOrderedSubjects.map((s, index) => ({ ...s, order: index }));
    setSubjects(updatedSubjects);
    localStorageService.saveSubjects(updatedSubjects);
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
