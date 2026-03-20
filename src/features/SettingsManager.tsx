import React from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LogIn, LogOut, CloudUpload, RefreshCw, FileDown, FileUp, ShieldCheck, CheckCircle2, Lock, Key } from 'lucide-react';
import { localStorageService } from '../services/localStorage';
import { useToast } from '../context/ToastContext';
import { ClassManager } from './ClassManager';
import { SubjectManager } from './SubjectManager';
import { useAuth } from '../context/AuthContext';
import { useSecurity } from '../context/SecurityContext';
import { useSync } from '../context/SyncContext';

export const SettingsManager: React.FC = () => {
  const { showToast } = useToast();
  const { user, isLoggedIn, signIn, signOut } = useAuth();
  const { securityKey, setSecurityKey } = useSecurity();
  const { isSyncing, lastSync, uploadData, downloadData } = useSync();

  const handleResetSecurityKey = () => {
    if (confirm('현재 세션의 보안 비밀번호를 초기화하시겠습니까? (서버 데이터는 삭제되지 않으며, 다시 입력해야 합니다.)')) {
      setSecurityKey(null);
      showToast('보안 비밀번호 세션이 초기화되었습니다.', 'info');
    }
  };

  const handleExportJson = () => {
    const data = localStorageService.getAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `class_journal_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('전체 데이터 백업 파일이 생성되었습니다.', 'success');
  };

  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Basic validation
        if (data.classes && data.classData) {
            localStorageService.saveAllData(data);
            showToast('데이터가 성공적으로 복구되었습니다. 앱을 새로고침합니다.', 'success');
            setTimeout(() => window.location.reload(), 1000);
        } else {
            throw new Error('Invalid backup file format');
        }

      } catch (err) {
        console.error('Failed to parse backup file', err);
        showToast('백업 파일 형식이 올바르지 않습니다.', 'error');
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Cloud Sync Section (v3.1) */}
      <Card>
        <CardHeader 
          title="간편 클라우드 동기화" 
          subtitle="구글 계정으로 로그인하여 데이터를 안전하게 클라우드에 보관하세요." 
        />
        <CardContent className="space-y-6">
          {!isLoggedIn ? (
            <div className="bg-blue-50 p-4 md:p-6 rounded-xl border border-blue-100 flex flex-col items-center text-center space-y-3 md:space-y-4">
              <div className="bg-blue-600 p-2 md:p-3 rounded-full text-white">
                <ShieldCheck size={28} className="md:w-8 md:h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-blue-900 text-base md:text-lg">복잡한 설정이 필요 없습니다!</h3>
                <p className="text-blue-700 text-xs md:text-sm">
                  구글 로그인 하나로 모든 기기에서<br className="md:hidden" />
                  데이터를 자동으로 동기화할 수 있습니다.
                </p>
              </div>
              <Button onClick={signIn} className="w-full md:w-auto h-11 md:h-12 px-6 md:px-8 text-base md:text-lg flex items-center justify-center gap-2 md:gap-3 shadow-lg">
                <LogIn size={20} />
                구글 계정으로 시작하기
              </Button>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {/* User Profile & Security Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                    <div className="bg-blue-100 p-1.5 md:p-2 rounded-full text-blue-600 shrink-0">
                      <CheckCircle2 size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs md:text-sm font-bold text-gray-900 truncate">{user?.email}</p>
                      <p className="text-[10px] md:text-xs text-green-600 font-medium">로그인됨</p>
                    </div>
                  </div>
                  <Button onClick={signOut} variant="ghost" size="sm" className="text-red-500 shrink-0">
                    <LogOut size={16} />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 md:p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="bg-indigo-600 p-1.5 md:p-2 rounded-full text-white shrink-0">
                      <Lock size={18} className="md:w-5 md:h-5" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm font-bold text-indigo-900">종단간 암호화(E2EE)</p>
                      <p className="text-[10px] md:text-xs text-indigo-600 font-medium">
                        {securityKey ? '보안 키 활성화됨' : '보안 키 필요'}
                      </p>
                    </div>
                  </div>
                  {securityKey && (
                    <Button onClick={handleResetSecurityKey} variant="ghost" size="sm" className="text-indigo-400 shrink-0">
                      <Key size={16} />
                    </Button>
                  )}
                </div>
              </div>

              {/* Sync Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 items-stretch">
                <div className="p-3 md:p-4 bg-white border border-gray-200 rounded-lg flex items-center justify-between">
                  <div className="space-y-0.5 md:space-y-1">
                    <p className="text-[10px] md:text-xs text-gray-400 font-medium uppercase">최근 동기화</p>
                    <p className="text-xs md:text-sm font-bold text-gray-700">{lastSync || '기록 없음'}</p>
                  </div>
                  {isSyncing ? (
                    <RefreshCw size={20} className="text-blue-500 animate-spin" />
                  ) : (
                    <Button onClick={() => downloadData()} variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <RefreshCw size={18} className="text-gray-400" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => uploadData()} 
                    disabled={isSyncing || !securityKey}
                    className="h-11 md:h-full flex items-center justify-center gap-1.5 md:gap-2 text-sm md:text-base px-2"
                  >
                    <CloudUpload size={18} className="md:w-5 md:h-5" />
                    <span className="truncate">백업</span>
                  </Button>
                  <Button 
                    onClick={() => downloadData()} 
                    disabled={isSyncing || !securityKey}
                    variant="outline"
                    className="h-11 md:h-full flex items-center justify-center gap-1.5 md:gap-2 text-sm md:text-base border-blue-200 text-blue-600 hover:bg-blue-50 px-2"
                  >
                    <RefreshCw size={18} className="md:w-5 md:h-5" />
                    <span className="truncate">복구</span>
                  </Button>
                </div>
              </div>
              
              {!securityKey && (
                <p className="text-xs text-center text-red-500 animate-pulse font-medium">
                  ⚠️ 데이터를 동기화하려면 보안 비밀번호를 입력해야 합니다.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Local Backup Section */}
      <Card>
        <CardHeader title="PC 로컬 백업/복구" subtitle="인터넷 연결 없이 파일로 데이터를 저장합니다." />
        <CardContent className="p-3 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <Button 
              onClick={handleExportJson} 
              variant="outline"
              className="flex items-center justify-center gap-2 border-green-600 text-green-700 hover:bg-green-50 h-10 md:h-11 text-sm md:text-base"
            >
              <FileDown size={18} />
              PC로 백업 (JSON)
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
                id="json-upload"
              />
              <label htmlFor="json-upload">
                <div className="flex items-center justify-center gap-2 cursor-pointer h-10 md:h-11 px-4 py-2 rounded-md border border-orange-200 text-orange-700 font-medium hover:bg-orange-50 transition-colors text-sm md:text-base">
                  <FileUp size={18} />
                  PC에서 복구 (JSON)
                </div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <ClassManager />
      <SubjectManager />
    </div>
  );
};
