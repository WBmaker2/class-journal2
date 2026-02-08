import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';
import { Button } from '../components/ui/Button';
import { Plus, Pencil, Trash2, Save, X, UserX } from 'lucide-react';
import type { Student } from '../types';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';

interface StudentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentManagerModal: React.FC<StudentManagerModalProps> = ({ isOpen, onClose }) => {
  const { students, manageStudents } = useJournal();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  
  // For custom delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
    showToast(`${newName} 학생을 등록했습니다.`, 'success');
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
    showToast('학생 정보를 수정했습니다.', 'success');
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const executeDelete = () => {
    if (!deleteId) return;
    const student = students.find(s => s.id === deleteId);
    const updated = students.filter(s => s.id !== deleteId);
    manageStudents(updated);
    showToast(`${student?.name} 학생을 삭제했습니다.`, 'info');
    setDeleteId(null);
  };

  const deleteTarget = students.find(s => s.id === deleteId);

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="학생 관리"
      >
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
            <h4 className="text-sm font-bold text-blue-700 mb-3 flex items-center gap-2">
              <Plus size={16} /> 신규 학생 등록
            </h4>
            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                type="number"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                placeholder="번호"
                className="w-16 p-2 bg-white border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                min="1"
              />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="이름"
                className="flex-1 p-2 bg-white border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              <Button type="submit" size="sm" className="shadow-sm">
                추가
              </Button>
            </form>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">학생 명단 ({students.length}명)</h4>
            <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden bg-white">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                  {editingId === student.id ? (
                    <div className="flex gap-2 w-full items-center animate-in fade-in slide-in-from-left-2 duration-200">
                      <input
                        type="number"
                        value={editNumber}
                        onChange={(e) => setEditNumber(e.target.value)}
                        className="w-12 p-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 p-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button onClick={saveEdit} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors">
                        <Save size={18} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-blue-500/50 w-6 text-center text-sm">{student.number}</span>
                        <span className="font-semibold text-gray-700">{student.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => startEdit(student)} 
                          className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-all"
                          title="수정"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => confirmDelete(student.id)} 
                          className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {students.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <UserX size={32} className="opacity-20" />
                  <p className="text-sm">등록된 학생이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="학생 삭제 확인"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>취소</Button>
            <Button variant="primary" className="bg-red-600 hover:bg-red-700 focus:ring-red-500" onClick={executeDelete}>삭제하기</Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center space-y-4 py-2">
          <div className="p-3 bg-red-100 text-red-600 rounded-full">
            <Trash2 size={24} />
          </div>
          <div>
            <p className="text-gray-900 font-bold text-lg">
              {deleteTarget?.number}번 {deleteTarget?.name} 학생을 삭제하시겠습니까?
            </p>
            <p className="text-gray-500 text-sm mt-1">
              기존에 기록된 출결 및 수업 기록은 유지되지만,<br />
              더 이상 목록에는 나타나지 않습니다.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};