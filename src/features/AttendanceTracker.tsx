import React, { useState, useEffect } from 'react';
import { useJournal } from '../context/JournalContext';
import type { AttendanceStatus, Weather, Atmosphere, DailyRecord } from '../types';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { UserPlus } from 'lucide-react';
import { StudentManagerModal } from './StudentManagerModal';

const WEATHER_OPTIONS: { value: Weather; emoji: string; label: string }[] = [
  { value: 'Sunny', emoji: '☀️', label: '맑음' },
  { value: 'Cloudy', emoji: '☁️', label: '흐림' },
  { value: 'Rainy', emoji: '☔', label: '비' },
  { value: 'Snowy', emoji: '❄️', label: '눈' },
  { value: 'Windy', emoji: '🌬️', label: '바람' },
  { value: 'Stormy', emoji: '⚡', label: '천둥' },
  { value: 'Foggy', emoji: '🌫️', label: '안개' },
];

const ATMOSPHERE_OPTIONS: { value: Atmosphere; emoji: string; label: string }[] = [
  { value: 'Calm', emoji: '🧘', label: '차분함' },
  { value: 'Energetic', emoji: '🏃', label: '활기참' },
  { value: 'Joyful', emoji: '✨', label: '즐거움' },
  { value: 'Passionate', emoji: '🔥', label: '열정적' },
  { value: 'Harmonious', emoji: '🤝', label: '화목함' },
  { value: 'Distracted', emoji: '🌀', label: '산만함' },
  { value: 'Tense', emoji: '🤐', label: '긴장됨' },
  { value: 'Tired', emoji: '🥱', label: '피곤함' },
];

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  Present: '출석',
  Absent: '결석',
  Late: '지각',
  'Early Leave': '조퇴',
};

export const AttendanceTracker: React.FC = () => {
  const { currentDate, students, records, saveCurrentRecord } = useJournal();
  const [record, setRecord] = useState<DailyRecord | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  useEffect(() => {
    const existing = records.find(r => r.date === currentDate);
    if (existing) {
      // Check if any current students are missing from the record
      const existingStudentIds = new Set(existing.attendance.map(a => a.studentId));
      const missingStudents = students.filter(s => !existingStudentIds.has(s.id));

      if (missingStudents.length > 0) {
        // Add missing students with default 'Present' status
        const newAttendance = [
          ...existing.attendance,
          ...missingStudents.map(s => ({ studentId: s.id, status: 'Present' as AttendanceStatus }))
        ];
        const updatedRecord = { ...existing, attendance: newAttendance };
        setRecord(updatedRecord);
        saveCurrentRecord(updatedRecord); // Sync to storage/context immediately
      } else {
        setRecord(existing);
      }
    } else {
      setRecord({
        date: currentDate,
        weather: 'Sunny',
        atmosphere: 'Calm',
        attendance: students.map(s => ({ studentId: s.id, status: 'Present' })),
        lessonLogs: [],
        classLog: '',
      });
    }
  }, [currentDate, records, students, saveCurrentRecord]);

  const updateRecord = (updates: Partial<DailyRecord>) => {
    if (!record) return;
    const newRecord = { ...record, ...updates };
    setRecord(newRecord);
    saveCurrentRecord(newRecord);
  };

  const updateAttendance = (studentId: string, status: AttendanceStatus) => {
    if (!record) return;
    
    const exists = record.attendance.some(a => a.studentId === studentId);
    let newAttendance;

    if (exists) {
      newAttendance = record.attendance.map(a => 
        a.studentId === studentId ? { ...a, status } : a
      );
    } else {
      // Handle case where student is not yet in attendance record
      newAttendance = [...record.attendance, { studentId, status }];
    }

    updateRecord({ attendance: newAttendance });
  };

  if (!record) return null;

  return (
    <div className="space-y-6 relative">
      <Card>
        <CardHeader title="오늘의 정보" subtitle="날씨와 교실 분위기를 기록하세요" />
        <CardContent className="flex flex-col gap-6">
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">오늘의 날씨</label>
            <div className="flex flex-wrap gap-2">
              {WEATHER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateRecord({ weather: opt.value })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all min-w-[64px] ${
                    record.weather === opt.value 
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 scale-105' 
                    : 'bg-white border border-gray-100 text-gray-400 hover:border-blue-200 hover:bg-blue-50/30'
                  }`}
                  title={opt.label}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className={`text-xs font-medium ${record.weather === opt.value ? 'text-white' : 'text-gray-500'}`}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">교실 분위기</label>
            <div className="flex flex-wrap gap-2">
              {ATMOSPHERE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateRecord({ atmosphere: opt.value })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all min-w-[64px] ${
                    record.atmosphere === opt.value 
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-200 scale-105' 
                    : 'bg-white border border-gray-100 text-gray-400 hover:border-purple-200 hover:bg-purple-50/30'
                  }`}
                  title={opt.label}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className={`text-xs font-medium ${record.atmosphere === opt.value ? 'text-white' : 'text-gray-500'}`}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="출결 관리" subtitle={`총원: ${students.length}명`} />
        <CardContent>
          <div className="divide-y divide-gray-100">
            {students.map((student) => {
              const status = record.attendance.find(a => a.studentId === student.id)?.status || 'Present';
              return (
                <div key={student.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-gray-400 w-6">{student.number}</span>
                    <span className="font-semibold text-gray-900">{student.name}</span>
                  </div>
                  <div className="flex gap-1">
                    {(['Present', 'Absent', 'Late', 'Early Leave'] as AttendanceStatus[]).map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={status === s ? 'primary' : 'outline'}
                        onClick={() => updateAttendance(student.id, s)}
                        className={status === s ? (s === 'Present' ? 'bg-green-600' : s === 'Absent' ? 'bg-red-600' : 'bg-yellow-600') : ''}
                      >
                        {STATUS_LABELS[s]}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Floating Action Button for Student Management */}
      <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40">
        <button
          onClick={() => setIsStudentModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg flex items-center gap-2 transition-all hover:scale-105"
          title="학생 관리"
        >
          <UserPlus size={24} />
          <span className="font-medium hidden md:inline">학생 관리</span>
        </button>
      </div>

      <StudentManagerModal 
        isOpen={isStudentModalOpen} 
        onClose={() => setIsStudentModalOpen(false)} 
      />
    </div>
  );
};
