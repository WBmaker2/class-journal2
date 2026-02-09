import React, { useState, useEffect } from 'react';
import { Download, Calendar } from 'lucide-react';
import { useJournal } from '../context/JournalContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { usePDFExport } from '../hooks/usePDFExport';
import type { DailyRecord } from '../types';

export const ClassLogEditor: React.FC = () => {
  const { currentDate, records, saveCurrentRecord, students } = useJournal();
  const [log, setLog] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(currentDate);
  const [endDate, setEndDate] = useState(currentDate);
  const [isExporting, setIsExporting] = useState(false);
  
  const { exportBatchToPDF } = usePDFExport();

  const currentRecord = records.find(r => r.date === currentDate);

  useEffect(() => {
    if (currentRecord) {
      setLog(currentRecord.classLog);
    } else {
      setLog('');
    }
  }, [currentDate, currentRecord]);

  // Update default dates when modal opens
  useEffect(() => {
    if (isExportModalOpen) {
      setStartDate(currentDate);
      setEndDate(currentDate);
    }
  }, [isExportModalOpen, currentDate]);

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
      classLog: log,
      studentNotes: {},
    };
    saveCurrentRecord(newRecord);
  };

  const getSortedRecords = () => {
    return records
      .filter(r => r.date >= startDate && r.date <= endDate && r.classLog.trim() !== '')
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const handleBatchExport = async () => {
    setIsExporting(true);
    // Allow React to render the hidden elements
    setTimeout(async () => {
      const sortedRecords = getSortedRecords();
      const elementIds = sortedRecords.map(r => `pdf-log-${r.date}`);
      
      if (elementIds.length === 0) {
        alert('선택한 기간에 기록된 일지가 없습니다.');
        setIsExporting(false);
        return;
      }

      await exportBatchToPDF({
        elementIds,
        filename: `학급일지_${startDate}_${endDate}`
      });
      
      setIsExporting(false);
      setIsExportModalOpen(false);
    }, 500);
  };

  return (
    <>
      <Card>
        <CardHeader 
          title="학급 일지" 
          subtitle="오늘 있었던 주요 사항을 자유롭게 기록하세요" 
          actions={
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Download size={16} />
              PDF 다운로드
            </Button>
          }
        />
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

      {/* Hidden Render Area for Batch Export */}
      {(isExportModalOpen || isExporting) && (
        <div className="fixed top-0 left-0 pointer-events-none" style={{ zIndex: 1000 }}>
           {/* Render all records in range */}
           {getSortedRecords().map((record) => (
             <div 
               key={record.date} 
               id={`pdf-log-${record.date}`}
               className="bg-white p-6 border-b border-gray-300 mb-4"
               style={{ width: '800px', position: 'absolute', top: 0, left: '-9999px' }}
             >
                <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-3">
                  <h3 className="text-xl font-bold text-gray-800">{record.date}</h3>
                  <div className="text-sm text-gray-500 space-x-3">
                    <span>{record.weather}</span>
                    <span>|</span>
                    <span>{record.atmosphere}</span>
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 min-h-[100px]">
                  {record.classLog}
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Export Range Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="학급 일지 PDF 내보내기"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleBatchExport} disabled={isExporting}>
              {isExporting ? '생성 중...' : 'PDF 생성'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            다운로드할 일지의 기간을 설정하세요.<br/>
            <span className="text-xs text-gray-400">* 내용이 있는 일지만 포함됩니다.</span>
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">시작일</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <Calendar className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">종료일</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <Calendar className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
