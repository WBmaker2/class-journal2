import React, { useState, useEffect } from 'react';
import { useJournal } from '../context/JournalContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Save } from 'lucide-react';
import { Button } from '../components/ui/Button';
import type { DailyRecord } from '../types';

export const StudentCumulativeRecord: React.FC = () => {
  const { currentDate, students, records, saveCurrentRecord } = useJournal();
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const record = records.find(r => r.date === currentDate);
    if (record && record.studentNotes) {
      setStudentNotes(record.studentNotes);
    } else {
      setStudentNotes({});
    }
  }, [currentDate, records]);

  const handleNoteChange = (studentId: string, note: string) => {
    setStudentNotes(prev => ({
      ...prev,
      [studentId]: note
    }));
  };

  const handleSave = () => {
    const existing = records.find(r => r.date === currentDate);
    const newRecord: DailyRecord = existing ? {
      ...existing,
      studentNotes
    } : {
      date: currentDate,
      weather: 'Sunny',
      atmosphere: 'Calm',
      attendance: students.map(s => ({ studentId: s.id, status: 'Present' })),
      lessonLogs: [],
      classLog: '',
      studentNotes
    };
    saveCurrentRecord(newRecord);
  };

  return (
    <Card>
      <CardHeader title="학생별 누가기록" subtitle={`${currentDate} 학생별 관찰 내용 기록`} 
        actions={
          <Button onClick={handleSave} size="sm" className="flex items-center gap-2">
            <Save size={16} />
            저장
          </Button>
        }
      />
      <CardContent>
        <div className="divide-y divide-gray-100">
          {students.map(student => (
            <div key={student.id} className="py-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="w-24 shrink-0 font-medium text-gray-900">
                <span className="text-gray-400 mr-2">{student.number}번</span>
                {student.name}
              </div>
              <div className="flex-1 w-full">
                <input
                  type="text"
                  value={studentNotes[student.id] || ''}
                  onChange={(e) => handleNoteChange(student.id, e.target.value)}
                  placeholder="오늘의 특이사항을 기록하세요..."
                  className="w-full p-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onBlur={handleSave} 
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
