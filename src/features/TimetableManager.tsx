import React, { useState, useEffect } from 'react';
import { useClass } from '../context/ClassContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Save, Copy, Trash2, Plus, Minus } from 'lucide-react';
import type { Timetable } from '../types';

const DAYS = ['월', '화', '수', '목', '금'];
const SUBJECTS = ['국어', '수학', '사회', '과학', '영어', '음악', '미술', '체육', '도덕', '실과', '창체', '자치', '동아리'];

export const TimetableManager: React.FC = () => {
  const { activeClassId, classes, updateTimetable, templates, saveTemplate, deleteTemplate } = useClass();
  const [editingTimetable, setEditingTimetable] = useState<Timetable>({ days: {} });
  const [maxPeriods, setMaxPeriods] = useState(6);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const activeClass = classes.find(c => c.id === activeClassId);

  useEffect(() => {
    if (activeClass?.timetable) {
      setEditingTimetable(activeClass.timetable);
      // Find max period in current timetable
      let maxP = 6;
      Object.values(activeClass.timetable.days).forEach(day => {
        const periods = Object.keys(day).map(Number);
        if (periods.length > 0) {
          maxP = Math.max(maxP, ...periods);
        }
      });
      setMaxPeriods(maxP);
    } else {
      // Default empty timetable
      const defaultTimetable: Timetable = { days: {} };
      for (let i = 0; i < 5; i++) {
        defaultTimetable.days[i] = {};
        for (let j = 1; j <= 6; j++) {
          defaultTimetable.days[i][j] = { subject: '', startTime: '', endTime: '' };
        }
      }
      setEditingTimetable(defaultTimetable);
      setMaxPeriods(6);
    }
  }, [activeClassId, classes]);

  const handleCellChange = (dayIndex: number, period: number, value: string) => {
    const updated = { ...editingTimetable };
    if (!updated.days[dayIndex]) updated.days[dayIndex] = {};
    updated.days[dayIndex][period] = {
      ...(updated.days[dayIndex][period] || { startTime: '', endTime: '' }),
      subject: value
    };
    setEditingTimetable(updated);
  };

  const handleSave = () => {
    if (activeClassId) {
      updateTimetable(activeClassId, editingTimetable);
      alert('학급 시간표가 저장되었습니다.');
    }
  };

  const handleSaveAsTemplate = () => {
    if (!newTemplateName.trim()) {
      alert('템플릿 이름을 입력해주세요.');
      return;
    }
    saveTemplate(newTemplateName, editingTimetable);
    setNewTemplateName('');
    setShowTemplateModal(false);
    alert('템플릿으로 저장되었습니다.');
  };

  const applyTemplate = (templateData: Timetable) => {
    if (confirm('현재 시간표가 템플릿 내용으로 대체됩니다. 계속하시겠습니까?')) {
      setEditingTimetable(templateData);
      // Update max periods based on template
      let maxP = 6;
      Object.values(templateData.days).forEach(day => {
        const periods = Object.keys(day).map(Number);
        if (periods.length > 0) {
          maxP = Math.max(maxP, ...periods);
        }
      });
      setMaxPeriods(maxP);
    }
  };

  if (!activeClassId) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader 
          title={`${activeClass?.name} 주간 시간표 설정`} 
          subtitle="요일별 정규 수업 시간을 설정하세요. 설정된 시간표는 일지 작성 시 자동 반영됩니다." 
        />
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-50 w-20">교시</th>
                  {DAYS.map((day, i) => (
                    <th key={i} className="border p-2 bg-gray-50">{day}요일</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxPeriods }, (_, i) => i + 1).map(period => (
                  <tr key={period}>
                    <td className="border p-2 text-center font-bold text-blue-600 bg-gray-50">
                      {period}
                    </td>
                    {DAYS.map((_, dayIndex) => (
                      <td key={dayIndex} className="border p-1">
                        <select
                          value={editingTimetable.days[dayIndex]?.[period]?.subject || ''}
                          onChange={(e) => handleCellChange(dayIndex, period, e.target.value)}
                          className="w-full p-1 text-sm border-none focus:ring-1 focus:ring-blue-500 rounded"
                        >
                          <option value="">-</option>
                          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setMaxPeriods(prev => Math.min(10, prev + 1))}>
                <Plus size={14} className="mr-1" /> 교시 추가
              </Button>
              <Button variant="outline" size="sm" onClick={() => setMaxPeriods(prev => Math.max(1, prev - 1))}>
                <Minus size={14} className="mr-1" /> 교시 축소
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowTemplateModal(true)}>
                <Copy size={16} className="mr-2" /> 템플릿 관리
              </Button>
              <Button onClick={handleSave}>
                <Save size={16} className="mr-2" /> 시간표 저장
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Management Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader title="시간표 템플릿 관리" />
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">현재 시간표를 템플릿으로 저장</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="템플릿 이름 (예: 6학년 기본)"
                    className="flex-1 p-2 border rounded-md text-sm"
                  />
                  <Button onClick={handleSaveAsTemplate} size="sm">저장</Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <label className="text-sm font-medium block mb-2">내 템플릿 목록</label>
                {templates.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">저장된 템플릿이 없습니다.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {templates.map(tpl => (
                      <div key={tpl.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border">
                        <span className="text-sm font-medium">{tpl.name}</span>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => applyTemplate(tpl.data)}
                            className="text-blue-600 h-8 px-2"
                          >
                            적용
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deleteTemplate(tpl.id)}
                            className="text-red-500 h-8 px-2"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setShowTemplateModal(false)}>닫기</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
