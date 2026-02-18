export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Early Leave';
export type Weather = 'Sunny' | 'Cloudy' | 'Rainy' | 'Snowy' | 'Windy' | 'Stormy' | 'Foggy';
export type Atmosphere = 'Calm' | 'Energetic' | 'Distracted' | 'Tired' | 'Passionate' | 'Harmonious' | 'Tense' | 'Joyful';

export interface Student {
  id: string;
  name: string;
  number: number;
  photo?: string;
  notes: string[];
}

export interface AttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
}

export interface LessonLog {
  period: number;
  subject: string;
  content: string;
}

export interface DailyRecord {
  date: string; // ISO format (YYYY-MM-DD)
  weather: Weather;
  atmosphere: Atmosphere;
  attendance: AttendanceEntry[];
  lessonLogs: LessonLog[];
  classLog: string; // Markdown
  studentNotes: Record<string, string>; // Student ID -> Note
}

export interface TodoItem {
  id: string;
  content: string;
  completed: boolean;
  dueDate?: string;
}

export interface Class {
  id: string;
  name: string;
  order: number;
}

declare global {
  const gapi: any;
  const google: any;
}
