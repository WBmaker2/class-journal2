import React, { useState, useEffect } from 'react';
import { Download, Calendar, FileSpreadsheet } from 'lucide-react';
import { useJournal } from '../context/JournalContext';
import { useToast } from '../context/ToastContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { usePDFExport } from '../hooks/usePDFExport';
import { useExcelExport } from '../hooks/useExcelExport';
import type { DailyRecord } from '../types';

export const ClassLogEditor: React.FC = () => {
  const { currentDate, records, saveCurrentRecord, students } = useJournal();
  const { showToast } = useToast();
  const [log, setLog] = useState('');
  const [exportMode, setExportMode] = useState<'pdf' | 'excel' | null>(null);
  const [startDate, setStartDate] = useState(currentDate);
  const [endDate, setEndDate] = useState(currentDate);
  const [isExporting, setIsExporting] = useState(false);
  
  const { exportBatchToPDF } = usePDFExport();
  const { exportToExcel } = useExcelExport();

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
    if (exportMode) {
      setStartDate(currentDate);
      setEndDate(currentDate);
    }
  }, [exportMode, currentDate]);

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

  const handleExcelExport = () => {
    const sortedRecords = getSortedRecords();
    if (sortedRecords.length === 0) {
      showToast('선택한 기간에 기록된 일지가 없습니다.', 'error');
      return;
    }

    const data = sortedRecords.map(record => ({
      날짜: record.date,
      날씨: record.weather,
      분위기: record.atmosphere,
      일지내용: record.classLog
    }));

    exportToExcel({
      data,
      filename: `학급일지_${startDate}_${endDate}`,
      sheetName: '학급일지'
    });
    setExportMode(null);
  };

  useEffect(() => {
    if (!isExporting) return;

    const performExport = async () => {
      const sortedRecords = getSortedRecords();
      const elementIds = sortedRecords.map(r => `pdf-log-${r.date}`);
      
      if (elementIds.length === 0) {
        showToast('선택한 기간에 기록된 일지가 없습니다.', 'error');
        setIsExporting(false);
        setExportMode(null);
        return;
      }

      const success = await exportBatchToPDF({
        elementIds,
        filename: `학급일지_${startDate}_${endDate}`
      });
      
      if (success) {
        showToast('PDF 파일이 생성되었습니다.', 'success');
      } else {
        showToast('PDF 생성 중 오류가 발생했습니다.', 'error');
      }

      setIsExporting(false);
      setExportMode(null);
    };

    // Use a short timeout to ensure the DOM has updated
    const timer = setTimeout(performExport, 500); // Increased delay for safety

    return () => clearTimeout(timer);
  }, [isExporting, startDate, endDate, exportBatchToPDF, showToast]);
  
  const handleBatchExport = () => {
      showToast('PDF 생성을 시작합니다. 잠시만 기다려주세요...', 'info');
      setIsExporting(true);
  };

  return (
    <>
      <Card>
        <CardHeader 
          title="학급 일지" 
          subtitle="오늘 있었던 주요 사항을 자유롭게 기록하세요" 
          actions={
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setExportMode('excel')}
                className="flex items-center gap-2 border-green-600 text-green-700 hover:bg-green-50"
              >
                <FileSpreadsheet size={16} />
                EXCEL 다운로드
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setExportMode('pdf')}
                className="flex items-center gap-2"
              >
                <Download size={16} />
                PDF 다운로드
              </Button>
            </div>
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
      {isExporting && (
        <div className="fixed top-0 left-[-9999px] pointer-events-none" style={{ zIndex: -100 }}>
           {getSortedRecords().map((record) => (
             <div 
               key={record.date} 
               id={`pdf-log-${record.date}`}
               className="bg-white p-10 mb-8 border border-gray-100"
               style={{ width: '800px', minHeight: '1100px' }}
             >
                <div className="flex justify-between items-center border-b-2 border-blue-600 pb-4 mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">{record.date}</h3>
                  <div className="text-sm font-medium text-blue-600 space-x-4 bg-blue-50 px-4 py-1 rounded-full">
                    <span>날씨: {record.weather}</span>
                    <span>분위기: {record.atmosphere}</span>
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-base leading-relaxed text-gray-800 bg-gray-50/50 p-6 rounded-xl border border-gray-100 min-h-[400px]">
                  {record.classLog}
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Export Range Modal */}
      <Modal
        isOpen={exportMode !== null}
        onClose={() => setExportMode(null)}
        title={exportMode === 'pdf' ? "학급 일지 PDF 내보내기" : "학급 일지 EXCEL 내보내기"}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setExportMode(null)}>
              취소
            </Button>
            <Button onClick={exportMode === 'pdf' ? handleBatchExport : handleExcelExport} disabled={isExporting}>
              {isExporting ? '생성 중...' : (exportMode === 'pdf' ? 'PDF 생성' : 'EXCEL 생성')}
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
