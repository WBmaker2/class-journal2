import React from 'react';
import { useClass } from '../context/ClassContext';

export const ClassSelector: React.FC = () => {
  const { classes, activeClassId, setActiveClassId, isLoading } = useClass();

  if (isLoading) {
    return (
        <div className="p-2">
            <div className="w-full h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
    );
  }

  return (
    <div className="p-2">
      <label htmlFor="class-selector" className="block text-sm font-medium text-gray-700 mb-1">
        학급 선택
      </label>
      <select
        id="class-selector"
        value={activeClassId || ''}
        onChange={(e) => setActiveClassId(e.target.value)}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
        disabled={classes.length === 0}
      >
        {classes.length === 0 && <option>학급을 추가해주세요</option>}
        {classes.sort((a,b) => a.order - b.order).map(c => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
};
