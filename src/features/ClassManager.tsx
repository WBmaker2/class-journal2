import React, { useState } from 'react';
import { useClass } from '../context/ClassContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PlusCircle, Trash, Edit, Save } from 'lucide-react';

export const ClassManager: React.FC = () => {
  const { classes, addClass, updateClass, deleteClass, reorderClasses } = useClass();
  const [newClassName, setNewClassName] = useState('');
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingClassName, setEditingClassName] = useState('');

  const handleAddClass = () => {
    if (newClassName.trim()) {
      addClass(newClassName.trim());
      setNewClassName('');
    }
  };

  const handleEdit = (classItem: { id: string, name: string }) => {
    setEditingClassId(classItem.id);
    setEditingClassName(classItem.name);
  };

  const handleSave = (id: string) => {
    if (editingClassName.trim()) {
      updateClass(id, editingClassName.trim());
      setEditingClassId(null);
      setEditingClassName('');
    }
  };
  
  // Basic drag-and-drop handlers
  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("classId", id);
  };

  const onDrop = (e: React.DragEvent, targetId: string) => {
    const sourceId = e.dataTransfer.getData("classId");
    if (sourceId === targetId) return;

    const sourceIndex = classes.findIndex(c => c.id === sourceId);
    const targetIndex = classes.findIndex(c => c.id === targetId);
    
    const reordered = [...classes];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    reorderClasses(reordered);
  };

  return (
    <Card>
      <CardHeader 
        title="학급 관리"
        subtitle="새 학급을 추가하거나 기존 학급의 순서를 변경, 삭제할 수 있습니다."
      />
      <CardContent className="space-y-4">
        {/* Add Class Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            placeholder="새 학급 이름 (예: 1학년 1반)"
            className="flex-grow block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            onKeyPress={(e) => e.key === 'Enter' && handleAddClass()}
          />
          <Button onClick={handleAddClass} className="flex items-center justify-center gap-2 min-w-[80px] whitespace-nowrap">
            <PlusCircle size={16} />
            추가
          </Button>
        </div>

        {/* Class List */}
        <div className="space-y-2">
          {classes.sort((a,b) => a.order - b.order).map(classItem => (
            <div
              key={classItem.id}
              draggable
              onDragStart={(e) => onDragStart(e, classItem.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, classItem.id)}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-grab"
            >
              {editingClassId === classItem.id ? (
                <input
                  type="text"
                  value={editingClassName}
                  onChange={(e) => setEditingClassName(e.target.value)}
                  className="flex-grow rounded-md border-gray-300 shadow-sm p-1 border"
                  autoFocus
                  onBlur={() => handleSave(classItem.id)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSave(classItem.id)}
                />
              ) : (
                <span className="font-medium">{classItem.name}</span>
              )}
              <div className="flex items-center gap-2">
                {editingClassId === classItem.id ? (
                  <Button onClick={() => handleSave(classItem.id)} variant="ghost" size="sm">
                    <Save size={16} />
                  </Button>
                ) : (
                  <Button onClick={() => handleEdit(classItem)} variant="ghost" size="sm">
                    <Edit size={16} />
                  </Button>
                )}
                <Button onClick={() => deleteClass(classItem.id)} variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                  <Trash size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
