import React, { useState, useEffect } from 'react';
import { useJournal } from '../context/JournalContext';
import { useClass } from '../context/ClassContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import type { DailyRecord, LessonLog } from '../types';

export const LessonLogManager: React.FC = () => {
  const { currentDate, records, saveCurrentRecord, students } = useJournal();
  const { activeClassId, classes, subjects } = useClass();
  const [lessonLogs, setLessonLogs] = useState<LessonLog[]>([]);

  useEffect(() => {
    const existing = records.find(r => r.date === currentDate);
    if (existing && existing.lessonLogs.length > 0) {
      setLessonLogs(existing.lessonLogs);
    } else {
      // Get subject from timetable if available
      const activeClass = classes.find(c => c.id === activeClassId);
      const dayOfWeek = new Date(currentDate).getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
      const timetableDay = dayOfWeek >= 1 && dayOfWeek <= 5 ? dayOfWeek - 1 : null; // 0-4 for Mon-Fri

      const initialLogs = Array.from({ length: 6 }, (_, i) => {
        const period = i + 1;
        let subject = '';
        if (activeClass?.timetable?.days && timetableDay !== null) {
          subject = activeClass.timetable.days[timetableDay]?.[period]?.subject || '';
        }
        
        return {
          period,
          subject,
          content: ''
        };
      });
      setLessonLogs(initialLogs);
    }
  }, [currentDate, records, activeClassId, classes]);

  const updateLesson = (period: number, updates: Partial<LessonLog>) => {
    const newLogs = lessonLogs.map(log => 
      log.period === period ? { ...log, ...updates } : log
    );
    setLessonLogs(newLogs);
    
    const existing = records.find(r => r.date === currentDate);
    const newRecord: DailyRecord = existing ? {
      ...existing,
      lessonLogs: newLogs
    } : {
      date: currentDate,
      weather: 'Sunny',
      atmosphere: 'Calm',
      attendance: students.map(s => ({ studentId: s.id, status: 'Present' })),
      lessonLogs: newLogs,
      classLog: '',
      studentNotes: {},
    };
    saveCurrentRecord(newRecord);
  };

  return (
    <Card>
      <CardHeader title="시간표 및 수업 기록" subtitle="교시별 과목과 간단한 수업 내용을 기록하세요" />
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lessonLogs.map((log) => (
            <div key={log.period} className="p-4 rounded-lg border border-gray-100 bg-gray-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-blue-600">{log.period}교시</span>
                <select
                  value={log.subject}
                  onChange={(e) => updateLesson(log.period, { subject: e.target.value })}
                  className="text-sm border-gray-200 rounded-md p-1"
                >
                  <option value="">과목 선택</option>
                  {subjects.sort((a,b) => a.order - b.order).map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={log.content}
                placeholder="학습 주제 또는 활동 요약"
                onChange={(e) => updateLesson(log.period, { content: e.target.value })}
                className="w-full text-sm p-2 rounded border border-gray-200"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
