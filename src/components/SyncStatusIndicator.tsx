import React, { useState } from 'react';
import { useGoogleDrive } from '../hooks/useGoogleDrive';
import { CloudOff, RefreshCw, AlertTriangle, Check, UploadCloud, Monitor, Cloud } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

export const SyncStatusIndicator: React.FC = () => {
  const { 
    isLoggedIn, 
    isSyncing, 
    error, 
    pendingChanges, 
    conflictError, 
    resolveConflict,
    lastSync 
  } = useGoogleDrive();

  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!isLoggedIn) return null;

  const handleResolve = (action: 'local' | 'remote') => {
    resolveConflict(action);
    setIsModalOpen(false);
  };

  if (conflictError) {
    return (
      <>
        <div 
          className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-xs sm:text-sm font-medium border border-red-200 animate-pulse cursor-pointer hover:bg-red-100 transition-colors shadow-sm"
          onClick={() => setIsModalOpen(true)}
          title="데이터 충돌! 클릭하여 해결하세요."
        >
          <AlertTriangle size={14} />
          <span className="hidden sm:inline">충돌 해결 필요</span>
          <span className="sm:hidden">충돌!</span>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="데이터 동기화 충돌"
          footer={
            <>
              <Button variant="outline" onClick={() => handleResolve('local')}>내 데이터 유지</Button>
              <Button onClick={() => handleResolve('remote')}>클라우드 데이터 선택</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
              클라우드에 저장된 데이터가 현재 기기의 데이터보다 최신입니다. 어떤 데이터를 유지할지 선택해주세요.
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex flex-col items-center text-center space-y-2">
                <Monitor size={32} className="text-gray-400" />
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">내 기기 데이터</p>
                  <p className="text-sm font-semibold text-gray-700">{new Date(conflictError.local).toLocaleString()}</p>
                </div>
                <p className="text-xs text-gray-400">현재 수정한 내용</p>
              </div>
              
              <div className="p-4 border border-blue-100 rounded-xl bg-blue-50 flex flex-col items-center text-center space-y-2">
                <Cloud size={32} className="text-blue-500" />
                <div>
                  <p className="text-xs font-bold text-blue-400 uppercase">클라우드 데이터</p>
                  <p className="text-sm font-semibold text-blue-700">{new Date(conflictError.remote).toLocaleString()}</p>
                </div>
                <p className="text-xs text-blue-400">다른 기기에서 저장된 최신본</p>
              </div>
            </div>
            
            <p className="text-xs text-gray-400 text-center">
              * 선택하지 않은 데이터는 덮어씌워지며 복구할 수 없습니다.
            </p>
          </div>
        </Modal>
      </>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-xs sm:text-sm font-medium border border-red-200" title={error}>
        <CloudOff size={14} />
        <span className="hidden sm:inline">오류</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs sm:text-sm font-medium border border-blue-200">
        <RefreshCw size={14} className="animate-spin" />
        <span className="hidden sm:inline">동기화 중...</span>
      </div>
    );
  }

  if (pendingChanges) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-xs sm:text-sm font-medium border border-orange-200" title="변경사항이 있습니다 (자동 저장 대기중)">
        <UploadCloud size={14} />
        <span className="hidden sm:inline">저장 대기</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-full text-xs sm:text-sm font-medium border border-green-200 shadow-sm" title={`마지막 동기화: ${lastSync}`}>
      <Check size={14} />
      <span className="hidden sm:inline">동기화됨</span>
    </div>
  );
};