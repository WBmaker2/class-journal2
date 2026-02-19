import React, { useState } from 'react';
import { useClass } from '../context/ClassContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PlusCircle, Trash, Edit, Save, GripVertical } from 'lucide-react';
import type { Subject } from '../types';

export const SubjectManager: React.FC = () => {
  const { subjects, addSubject, updateSubject, deleteSubject, reorderSubjects } = useClass();
  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState('');

  const handleAddSubject = () => {
    if (newSubjectName.trim()) {
      addSubject(newSubjectName.trim());
      setNewSubjectName('');
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setEditingSubjectName(subject.name);
  };

  const handleSave = (id: string) => {
    if (editingSubjectName.trim()) {
      updateSubject(id, editingSubjectName.trim());
      setEditingSubjectId(null);
      setEditingSubjectName('');
    }
  };
  
  // Basic drag-and-drop handlers
  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("subjectId", id);
  };

  const onDrop = (e: React.DragEvent, targetId: string) => {
    const sourceId = e.dataTransfer.getData("subjectId");
    if (sourceId === targetId) return;

    const sourceIndex = subjects.findIndex(s => s.id === sourceId);
    const targetIndex = subjects.findIndex(s => s.id === targetId);
    
    const reordered = [...subjects];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    reorderSubjects(reordered);
  };

  return (
    <Card>
      <CardHeader 
        title="과목 관리"
        subtitle="전체 학급에 공통으로 적용될 과목 목록을 관리하고 순서를 변경할 수 있습니다."
      />
      <CardContent className="space-y-4">
        {/* Add Subject Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            placeholder="새 과목 이름 (예: 창의적 체험활동)"
            className="flex-grow block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
          />
          <Button onClick={handleAddSubject} className="flex items-center justify-center gap-2 min-w-[80px] whitespace-nowrap">
            <PlusCircle size={16} />
            추가
          </Button>
        </div>

        {/* Subject List */}
        <div className="space-y-2">
          {subjects.sort((a,b) => a.order - b.order).map(subject => (
            <div
              key={subject.id}
              draggable
              onDragStart={(e) => onDragStart(e, subject.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, subject.id)}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-grab hover:bg-white transition-colors"
            >
              <div className="text-gray-400">
                <GripVertical size={16} />
              </div>
              <div className="flex-grow flex items-center justify-between">
                {editingSubjectId === subject.id ? (
                  <input
                    type="text"
                    value={editingSubjectName}
                    onChange={(e) => setEditingSubjectName(e.target.value)}
                    className="flex-grow rounded-md border-gray-300 shadow-sm p-1 border"
                    autoFocus
                    onBlur={() => handleSave(subject.id)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSave(subject.id)}
                  />
                ) : (
                  <span className="font-medium">{subject.name}</span>
                )}
                <div className="flex items-center gap-2">
                  {editingSubjectId === subject.id ? (
                    <Button onClick={() => handleSave(subject.id)} variant="ghost" size="sm">
                      <Save size={16} />
                    </Button>
                  ) : (
                    <Button onClick={() => handleEdit(subject)} variant="ghost" size="sm">
                      <Edit size={16} />
                    </Button>
                  )}
                  <Button onClick={() => deleteSubject(subject.id)} variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                    <Trash size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400">
          * 항목을 드래그하여 순서를 변경할 수 있습니다.
        </p>
      </CardContent>
    </Card>
  );
};
