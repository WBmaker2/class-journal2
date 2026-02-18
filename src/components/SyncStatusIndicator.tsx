import React from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';

export const SyncStatusIndicator: React.FC = () => {
  const { isLoggedIn, isSyncing, lastSync } = useSupabase();

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-1.5 text-gray-400 bg-gray-100 px-2 py-1 rounded-full text-[10px] font-medium border border-gray-200">
        <CloudOff size={12} />
        <span>미연동</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border transition-colors ${
        isSyncing 
          ? 'bg-blue-50 text-blue-600 border-blue-200' 
          : 'bg-green-50 text-green-600 border-green-200'
      }`}>
        {isSyncing ? (
          <RefreshCw size={12} className="animate-spin" />
        ) : (
          <Cloud size={12} />
        )}
        <span>{isSyncing ? '동기화 중...' : '동기화 완료'}</span>
      </div>
      {lastSync && (
        <span className="text-[10px] text-gray-400 hidden sm:inline">
          최근: {lastSync}
        </span>
      )}
    </div>
  );
};
