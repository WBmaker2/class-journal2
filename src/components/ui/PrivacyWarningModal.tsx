import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface PrivacyWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const PrivacyWarningModal: React.FC<PrivacyWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [hideToday, setHideToday] = useState(false);

  const handleConfirm = () => {
    if (hideToday) {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`hidePrivacyWarning_${today}`, 'true');
    }
    onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="학생 개인정보 보호 안내"
      footer={
        <div className="flex justify-between items-center w-full">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={hideToday}
              onChange={(e) => setHideToday(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            오늘 하루 이 알림창 보지 않기
          </label>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button onClick={handleConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              확인
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-sm text-gray-700 bg-red-50 p-4 rounded-lg border border-red-100">
        <div className="flex items-center gap-2 text-red-600 font-bold text-base mb-2">
          <AlertTriangle size={24} />
          <span>경고: 민감한 개인정보 포함</span>
        </div>
        <p className="font-bold text-red-800 text-base">
          다운로드하시는 자료에는 학생의 민감한 개인정보가 포함되어 있습니다.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>다운로드한 파일은 <strong>암호를 설정하여 안전하게 보관</strong>해 주세요.</li>
          <li>업무 목적 외의 사용 및 외부 유출을 엄격히 금지합니다.</li>
          <li>사용 목적이 달성된 파일은 <strong>즉시 영구 삭제</strong>해 주세요.</li>
        </ul>
        <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-red-200">
          ※ 관련 법령에 따라 개인정보 유출 시 법적 책임이 발생할 수 있습니다.
        </p>
      </div>
    </Modal>
  );
};
