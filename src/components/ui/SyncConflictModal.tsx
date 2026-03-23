import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface SyncConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'conflict' | 'server-update';
  localTime: string | null;
  remoteTime: string | null;
  onMerge: () => void;
  onOverwriteLocal: () => void;
  onForceUpload: () => void;
}

const SyncConflictModal: React.FC<SyncConflictModalProps> = ({
  isOpen,
  onClose,
  mode = 'conflict',
  localTime,
  remoteTime,
  onMerge,
  onOverwriteLocal,
  onForceUpload
}) => {
  const isServerUpdateMode = mode === 'server-update';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isServerUpdateMode ? '서버의 새 데이터 감지' : '데이터 동기화 충돌 감지'}
    >
      <div className="space-y-4">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
          <p className="font-semibold mb-1">
            {isServerUpdateMode ? '새로운 정보가 서버에 저장되어 있습니다.' : '클라우드에 더 최신 데이터가 있습니다.'}
          </p>
          <p>
            {isServerUpdateMode
              ? '현재 기기에도 기존 데이터가 남아 있습니다. 바로 덮어쓰기보다 먼저 병합을 검토하는 것을 권장합니다.'
              : '다른 기기에서 수정한 내용이 감지되었습니다. 현재 로컬 데이터를 그대로 업로드하면 다른 기기의 변경 사항이 사라질 수 있습니다.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-2 bg-gray-50 rounded border">
            <span className="block text-gray-500 mb-1">
              {isServerUpdateMode ? '현재 기기 최근 상태' : '마지막 동기화 (로컬)'}
            </span>
            <span className="font-mono">{localTime || '기록 없음'}</span>
          </div>
          <div className="p-2 bg-blue-50 rounded border border-blue-100">
            <span className="block text-blue-500 mb-1">
              {isServerUpdateMode ? '서버 최신 수정' : '클라우드 최신 수정'}
            </span>
            <span className="font-mono">{remoteTime || '기록 없음'}</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Button 
            fullWidth 
            onClick={onMerge}
            variant="primary"
          >
            데이터 병합 (권장)
          </Button>
          <p className="text-[10px] text-gray-400 text-center px-4">
            {isServerUpdateMode
              ? '현재 기기 데이터와 서버 변경 내용을 비교해 누락된 항목을 최대한 안전하게 합칩니다.'
              : '로컬과 클라우드의 데이터를 비교하여 누락된 항목을 합칩니다.'}
          </p>

          <div className={`flex gap-2 ${isServerUpdateMode ? 'justify-center' : ''}`}>
            <Button 
              className={isServerUpdateMode ? 'w-full' : 'flex-1'}
              onClick={onOverwriteLocal}
              variant="outline"
            >
              클라우드 내용으로 복구
            </Button>
            {!isServerUpdateMode && (
              <Button 
                className="flex-1"
                onClick={onForceUpload}
                variant="danger"
              >
                로컬 내용 강제 업로드
              </Button>
            )}
          </div>
        </div>

        <div className="pt-2">
          <Button fullWidth onClick={onClose} variant="ghost">나중에 결정</Button>
        </div>
      </div>
    </Modal>
  );
};

export default SyncConflictModal;
