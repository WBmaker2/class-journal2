import type { Student, DailyRecord, Weather, Atmosphere, AttendanceStatus } from '../types';

export const DUMMY_STUDENTS: Student[] = [
  { id: '1', name: '김철수', number: 1, notes: [] },
  { id: '2', name: '이영희', number: 2, notes: [] },
  { id: '3', name: '박지민', number: 3, notes: [] },
  { id: '4', name: '최다은', number: 4, notes: [] },
  { id: '5', name: '정우진', number: 5, notes: [] },
];

export const generateDummyRecords = (): DailyRecord[] => {
  const records: DailyRecord[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    records.push({
      date: dateStr,
      weather: ['Sunny', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 3)] as Weather,
      atmosphere: ['Calm', 'Energetic', 'Distracted'][Math.floor(Math.random() * 3)] as Atmosphere,
      attendance: DUMMY_STUDENTS.map(s => ({
        studentId: s.id,
        status: (Math.random() > 0.1 ? 'Present' : 'Absent') as AttendanceStatus,
      })),
      lessonLogs: [
        { period: 1, subject: '국어', content: '시의 표현 기법 학습' },
        { period: 2, subject: '수학', content: '분수의 덧셈과 뺄셈' },
      ],
      classLog: `오늘 학급 분위기는 대체로 ${i % 2 === 0 ? '좋았습니다' : '산만했습니다'}.`,
    });
  }
  
  return records;
};
