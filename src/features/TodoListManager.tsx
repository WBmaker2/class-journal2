import React, { useState, useRef } from 'react';
import { useJournal } from '../context/JournalContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Plus, CheckCircle, Circle, Trash2, GripVertical } from 'lucide-react';
import type { TodoItem } from '../types';

export const TodoListManager: React.FC = () => {
  const { todos, updateTodos, currentDate } = useJournal();
  const [newTodo, setNewTodo] = useState('');
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Filter todos for the selected date
  const filteredTodos = todos.filter(todo => todo.dueDate === currentDate);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const todo: TodoItem = {
      id: Date.now().toString(),
      content: newTodo,
      completed: false,
      dueDate: currentDate // Use selected date
    };

    updateTodos([...todos, todo]);
    setNewTodo('');
  };

  const toggleTodo = (id: string) => {
    const updated = todos.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    updateTodos(updated);
  };

  const deleteTodo = (id: string) => {
    const updated = todos.filter(t => t.id !== id);
    updateTodos(updated);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnter = (position: number) => {
    dragOverItem.current = position;
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }

    // Reorder filtered list
    const newFiltered = [...filteredTodos];
    const draggedItemContent = newFiltered[dragItem.current];
    newFiltered.splice(dragItem.current, 1);
    newFiltered.splice(dragOverItem.current, 0, draggedItemContent);

    // Sync with global todos
    // Replace items of currentDate in global todos with items from newFiltered in order
    const newTodos = [...todos];
    let filteredIdx = 0;
    for (let i = 0; i < newTodos.length; i++) {
      if (newTodos[i].dueDate === currentDate) {
        newTodos[i] = newFiltered[filteredIdx];
        filteredIdx++;
      }
    }

    updateTodos(newTodos);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <Card className="h-full">
      <CardHeader title="할 일 목록(To Do List)" subtitle={`${currentDate} 업무를 관리하세요`} />
      <CardContent>
        <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="새로운 할 일 추가..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
          </button>
        </form>

        <div className="space-y-2 h-[600px] overflow-y-auto">
          {filteredTodos.length === 0 ? (
            <p className="text-center text-gray-400 py-4 text-sm">등록된 할 일이 없습니다.</p>
          ) : (
            filteredTodos.map((todo, index) => (
              <div 
                key={todo.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  todo.completed ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200'
                } hover:shadow-md cursor-move`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-gray-400 cursor-grab active:cursor-grabbing">
                    <GripVertical size={16} />
                  </div>
                  <button 
                    onClick={() => toggleTodo(todo.id)}
                    className={`transition-colors ${
                      todo.completed ? 'text-green-500' : 'text-gray-300 hover:text-blue-500'
                    }`}
                  >
                    {todo.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                  </button>
                  <span className={`text-sm ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {todo.content}
                  </span>
                </div>
                
                <button 
                  onClick={() => deleteTodo(todo.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="삭제"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
