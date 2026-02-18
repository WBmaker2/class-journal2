import React from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';

export const SyncStatusIndicator: React.FC = () => {
  const { isLoggedIn, isSyncing, lastSync, isDirty } = useSupabase();

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-1.5 text-gray-400 bg-gray-100 px-2 py-1 rounded-full text-[10px] font-medium border border-gray-200">
        <CloudOff size={12} />
        <span>미연동</span>
      </div>
    );
  }

  const getStatus = () => {
    if (isSyncing) return { label: '클라우드 동기화 중...', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: <RefreshCw size={12} className="animate-spin" /> };
    if (isDirty) return { label: '자동 저장 대기 중...', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: <Cloud size={12} className="animate-pulse" /> };
    return { label: '클라우드 동기화 완료', color: 'bg-green-50 text-green-600 border-green-200', icon: <Cloud size={12} /> };
  };

  const status = getStatus();

  return (
    <div className="flex flex-col items-start gap-1">
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium border transition-colors whitespace-nowrap ${status.color}`}>
        {status.icon}
        <span>{status.label}</span>
      </div>
      {lastSync && (
        <span className="text-[10px] text-gray-400 whitespace-nowrap leading-tight">
          최근: {lastSync}
        </span>
      )}
    </div>
  );
};
