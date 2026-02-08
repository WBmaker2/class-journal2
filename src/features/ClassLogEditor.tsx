import React, { useState, useEffect } from 'react';
import { useJournal } from '../context/JournalContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import type { DailyRecord } from '../types';

export const ClassLogEditor: React.FC = () => {
  const { currentDate, records, saveCurrentRecord, students } = useJournal();
  const [log, setLog] = useState('');

  useEffect(() => {
    const existing = records.find(r => r.date === currentDate);
    if (existing) {
      setLog(existing.classLog);
    } else {
      setLog('');
    }
  }, [currentDate, records]);

  const handleSave = () => {
    const existing = records.find(r => r.date === currentDate);
    const newRecord: DailyRecord = existing ? {
      ...existing,
      classLog: log
    } : {
      date: currentDate,
      weather: 'Sunny',
      atmosphere: 'Calm',
      attendance: students.map(s => ({ studentId: s.id, status: 'Present' })),
      lessonLogs: [],
      classLog: log
    };
    saveCurrentRecord(newRecord);
  };

  return (
    <Card>
      <CardHeader title="학급 일지" subtitle="오늘 있었던 주요 사항을 자유롭게 기록하세요" />
      <CardContent className="space-y-4">
        <textarea
          value={log}
          onChange={(e) => setLog(e.target.value)}
          onBlur={handleSave}
          placeholder="오늘의 수업 내용, 특이 학생, 상담 내용 등을 입력하세요..."
          className="w-full h-64 p-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none sm:text-sm"
        />
        <p className="text-xs text-gray-400 text-right">자동 저장됨 (입력 후 포커스를 해제하세요)</p>
      </CardContent>
    </Card>
  );
};
