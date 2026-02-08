import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';
import { Button } from '../components/ui/Button';
import { Plus, X, Pencil, Trash2, Save } from 'lucide-react';
import type { Student } from '../types';

interface StudentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentManagerModal: React.FC<StudentManagerModalProps> = ({ isOpen, onClose }) => {
  const { students, manageStudents } = useJournal();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newNumber) return;

    const newStudent: Student = {
      id: Date.now().toString(),
      name: newName,
      number: parseInt(newNumber),
      notes: []
    };

    const updated = [...students, newStudent].sort((a, b) => a.number - b.number);
    manageStudents(updated);
    setNewName('');
    setNewNumber('');
  };

  const startEdit = (student: Student) => {
    setEditingId(student.id);
    setEditName(student.name);
    setEditNumber(student.number.toString());
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim() || !editNumber) return;

    const updated = students.map(s => 
      s.id === editingId 
        ? { ...s, name: editName, number: parseInt(editNumber) } 
        : s
    ).sort((a, b) => a.number - b.number);

    manageStudents(updated);
    setEditingId(null);
  };

  const deleteStudent = (id: string) => {
    if (window.confirm('정말 삭제하시겠습니까? 관련 기록은 유지되지만 학생 목록에서 사라집니다.')) {
      const updated = students.filter(s => s.id !== id);
      manageStudents(updated);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">학생 관리</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 border-b bg-gray-50">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="number"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              placeholder="번호"
              className="w-16 p-2 border rounded text-sm"
              min="1"
            />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="이름"
              className="flex-1 p-2 border rounded text-sm"
            />
            <Button type="submit" size="sm" className="whitespace-nowrap">
              <Plus size={16} /> 추가
            </Button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {students.map((student) => (
            <div key={student.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-200">
              {editingId === student.id ? (
                <div className="flex gap-2 w-full items-center">
                  <input
                    type="number"
                    value={editNumber}
                    onChange={(e) => setEditNumber(e.target.value)}
                    className="w-12 p-1 border rounded text-sm"
                  />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 p-1 border rounded text-sm"
                  />
                  <button onClick={saveEdit} className="text-green-600 p-1">
                    <Save size={18} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-gray-400 p-1">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-gray-500 w-6 text-center">{student.number}</span>
                    <span className="font-medium">{student.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(student)} className="text-blue-400 hover:text-blue-600 p-1">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => deleteStudent(student.id)} className="text-gray-300 hover:text-red-500 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {students.length === 0 && (
            <p className="text-center text-gray-400 py-4">등록된 학생이 없습니다.</p>
          )}
        </div>
        
        <div className="p-4 border-t text-right">
          <Button onClick={onClose} variant="secondary">닫기</Button>
        </div>
      </div>
    </div>
  );
};
