import React, { useState, useEffect } from 'react';
import { useJournal } from '../context/JournalContext';
import type { AttendanceStatus, Weather, Atmosphere, DailyRecord } from '../types';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sun, Cloud, CloudRain, Snowflake, Wind, Smile, Zap, Meh, Moon, UserPlus } from 'lucide-react';
import { StudentManagerModal } from './StudentManagerModal';

const WEATHER_OPTIONS: { value: Weather; icon: any; label: string }[] = [
  { value: 'Sunny', icon: Sun, label: '맑음' },
  { value: 'Cloudy', icon: Cloud, label: '흐림' },
  { value: 'Rainy', icon: CloudRain, label: '비' },
  { value: 'Snowy', icon: Snowflake, label: '눈' },
  { value: 'Windy', icon: Wind, label: '바람' },
];

const ATMOSPHERE_OPTIONS: { value: Atmosphere; icon: any; label: string }[] = [
  { value: 'Calm', icon: Moon, label: '차분함' },
  { value: 'Energetic', icon: Zap, label: '활기참' },
  { value: 'Distracted', icon: Meh, label: '산만함' },
  { value: 'Tired', icon: Smile, label: '피곤함' },
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
        <CardContent className="flex flex-wrap gap-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">날씨</label>
            <div className="flex gap-2">
              {WEATHER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateRecord({ weather: opt.value })}
                  className={`p-2 rounded-lg transition-all ${record.weather === opt.value ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                  title={opt.label}
                >
                  <opt.icon size={20} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">분위기</label>
            <div className="flex gap-2">
              {ATMOSPHERE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateRecord({ atmosphere: opt.value })}
                  className={`p-2 rounded-lg transition-all ${record.atmosphere === opt.value ? 'bg-purple-100 text-purple-600 ring-2 ring-purple-500' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                  title={opt.label}
                >
                  <opt.icon size={20} />
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
