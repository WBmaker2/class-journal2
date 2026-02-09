import React, { useState, useEffect } from 'react';
import { Download, Calendar } from 'lucide-react';
import { useJournal } from '../context/JournalContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { usePDFExport } from '../hooks/usePDFExport';
import type { DailyRecord, Student } from '../types';

export const StudentCumulativeRecord: React.FC = () => {
  const { currentDate, students, records, saveCurrentRecord } = useJournal();
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({});
  
  // Export states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(currentDate);
  const [endDate, setEndDate] = useState(currentDate);
  const [isExporting, setIsExporting] = useState(false);
  
  const { exportBatchToPDF } = usePDFExport();

  useEffect(() => {
    const record = records.find(r => r.date === currentDate);
    if (record && record.studentNotes) {
      setStudentNotes(record.studentNotes);
    } else {
      setStudentNotes({});
    }
  }, [currentDate, records]);

  // Update default dates when modal opens
  useEffect(() => {
    if (isExportModalOpen) {
      setStartDate(currentDate);
      setEndDate(currentDate);
    }
  }, [isExportModalOpen, currentDate]);

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

  const getStudentSummaries = () => {
    const filteredRecords = records
      .filter(r => r.date >= startDate && r.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date));

    const summaries: { student: Student; entries: { date: string; note: string }[] }[] = [];

    students.forEach(student => {
      const entries: { date: string; note: string }[] = [];
      filteredRecords.forEach(record => {
        const note = record.studentNotes?.[student.id];
        if (note && note.trim() !== '') {
          entries.push({ date: record.date, note });
        }
      });

      if (entries.length > 0) {
        summaries.push({ student, entries });
      }
    });

    return summaries;
  };

  const handleBatchExport = async () => {
    setIsExporting(true);
    setTimeout(async () => {
      const summaries = getStudentSummaries();
      const elementIds = summaries.map(s => `pdf-student-${s.student.id}`);
      
      if (elementIds.length === 0) {
        alert('선택한 기간에 기록된 내용이 없습니다.');
        setIsExporting(false);
        return;
      }

      await exportBatchToPDF({
        elementIds,
        filename: `학생별누가기록_${startDate}_${endDate}`
      });
      
      setIsExporting(false);
      setIsExportModalOpen(false);
    }, 500);
  };

  return (
    <>
      <Card>
        <CardHeader 
          title="학생별 누가기록" 
          subtitle={`${currentDate} 학생별 관찰 내용 기록`}
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
          <p className="text-xs text-gray-400 text-right mt-4">자동 저장됨 (입력 후 포커스를 해제하세요)</p>
        </CardContent>
      </Card>

      {/* Hidden Render Area for Batch Export */}
      {(isExportModalOpen || isExporting) && (
        <div className="fixed top-0 left-0 pointer-events-none" style={{ zIndex: 1000 }}>
           {getStudentSummaries().map((summary) => (
             <div 
               key={summary.student.id} 
               id={`pdf-student-${summary.student.id}`}
               className="bg-white p-8 border-b border-gray-300 mb-4"
               style={{ width: '800px', position: 'absolute', top: 0, left: '-9999px' }}
             >
                <div className="border-b-2 border-gray-800 pb-4 mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    <span className="text-gray-500 mr-2">{summary.student.number}번</span>
                    {summary.student.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    기간: {startDate} ~ {endDate}
                  </p>
                </div>
                <div className="space-y-4">
                  {summary.entries.map((entry, index) => (
                    <div key={`${summary.student.id}-${entry.date}`} className="flex gap-4">
                      <div className="w-24 shrink-0 text-sm font-bold text-gray-500 pt-1">
                        {entry.date}
                      </div>
                      <div className="flex-1 text-gray-900 bg-gray-50 p-3 rounded-lg text-sm leading-relaxed">
                        {entry.note}
                      </div>
                    </div>
                  ))}
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Export Range Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="학생별 누가기록 PDF 내보내기"
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
            다운로드할 기록의 기간을 설정하세요.<br/>
            <span className="text-xs text-gray-400">* 기록이 있는 학생만 포함됩니다.</span>
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
