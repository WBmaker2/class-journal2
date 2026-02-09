import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { useJournal } from '../context/JournalContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { usePDFExport } from '../hooks/usePDFExport';
import type { DailyRecord } from '../types';

export const ClassLogEditor: React.FC = () => {
  const { currentDate, records, saveCurrentRecord, students } = useJournal();
  const [log, setLog] = useState('');
  const { exportToPDF } = usePDFExport();

  const currentRecord = records.find(r => r.date === currentDate);

  useEffect(() => {
    if (currentRecord) {
      setLog(currentRecord.classLog);
    } else {
      setLog('');
    }
  }, [currentDate, currentRecord]);

  const handleSave = () => {
    const newRecord: DailyRecord = currentRecord ? {
      ...currentRecord,
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

  const handleDownloadPDF = () => {
    exportToPDF({
      filename: `학급일지_${currentDate}`,
      elementId: 'pdf-log-content'
    });
  };

  return (
    <Card>
      <CardHeader 
        title="학급 일지" 
        subtitle="오늘 있었던 주요 사항을 자유롭게 기록하세요" 
        actions={
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            PDF 다운로드
          </Button>
        }
      />
      <CardContent className="space-y-4">
        {/* Hidden area for PDF capture to include header info */}
        <div id="pdf-log-content" className="p-8 bg-white hidden print:block" style={{ width: '800px', position: 'absolute', left: '-9999px' }}>
          <div className="border-b-2 border-blue-600 pb-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-900">학급 일지</h1>
            <div className="mt-2 text-gray-600 flex gap-4">
              <span><strong>날짜:</strong> {currentDate}</span>
              <span><strong>날씨:</strong> {currentRecord?.weather || 'Sunny'}</span>
              <span><strong>학급 분위기:</strong> {currentRecord?.atmosphere || 'Calm'}</span>
            </div>
          </div>
          <div className="whitespace-pre-wrap text-lg leading-relaxed text-gray-800 min-h-[500px]">
            {log || '기록된 내용이 없습니다.'}
          </div>
          <div className="mt-12 pt-4 border-t border-gray-200 text-sm text-gray-400 text-center">
            Class Journal App | {new Date().toLocaleString()}
          </div>
        </div>

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
