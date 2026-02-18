import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Eye, EyeOff, Save, Lock, HelpCircle, ExternalLink, LogIn, LogOut, CloudUpload, CloudDownload, RefreshCw, FileDown, FileUp } from 'lucide-react';
import { useGoogleDrive } from '../hooks/useGoogleDrive';
import { localStorageService } from '../services/localStorage';
import { useToast } from '../context/ToastContext';
import { ClassManager } from './ClassManager';
import { SubjectManager } from './SubjectManager';

const STORAGE_KEY = 'cj_google_config';

// Simple obfuscation/encryption for local storage (Client-side only)
const encrypt = (text: string) => {
  if (!text) return '';
  try {
    return btoa(text.split('').map((char, index) => 
      String.fromCharCode(char.charCodeAt(0) ^ (index % 255))
    ).join(''));
  } catch (e) {
    console.error('Encryption failed', e);
    return text;
  }
};

const decrypt = (encrypted: string) => {
  if (!encrypted) return '';
  try {
    return atob(encrypted).split('').map((char, index) => 
      String.fromCharCode(char.charCodeAt(0) ^ (index % 255))
    ).join('');
  } catch (e) {
    console.error('Decryption failed', e);
    return '';
  }
};

export const SettingsManager: React.FC = () => {
  const [clientId, setClientId] = useState('');
  const [showSecrets, setShowSecrets] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { showToast } = useToast();

  const { 
    isLoggedIn, 
    isSyncing, 
    lastSync, 
    error, 
    autoSync,
    setAutoSync,
    handleLogin, 
    handleLogout, 
    uploadData, 
    downloadData 
  } = useGoogleDrive();

  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setClientId(decrypt(parsed.clientId));
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    }
  }, []);

  const handleSave = () => {
    const config = {
      clientId: encrypt(clientId),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setIsSaved(true);
    showToast('설정이 저장되었습니다.', 'success');
    setTimeout(() => setIsSaved(false), 2000);
  };

  const onLogin = async () => {
    if (!clientId) {
      showToast('Client ID를 먼저 입력하고 저장해주세요.', 'error');
      return;
    }
    try {
      await handleLogin(clientId);
    } catch (err) {
      showToast('로그인에 실패했습니다. API 설정을 확인해주세요.', 'error');
      console.error(err);
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
      <Card>
        <CardHeader 
          title="Google Drive 연동 설정" 
          subtitle="학급 일지 데이터를 Google Drive에 백업하기 위해 Client ID를 입력해주세요." 
        />
        <CardContent className="space-y-6">
          {/* Guide Section */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-3">
            <h3 className="font-semibold text-blue-800 flex items-center gap-2">
              <HelpCircle size={18} />
              구글 로그인 설정 가이드 (필독!)
            </h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p>
                <strong>로그인 실패 시 99%는 '승인된 자바스크립트 원본' 설정 문제입니다.</strong>
              </p>
              <ol className="list-decimal list-inside ml-1 space-y-1">
                <li>
                  <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="underline font-medium hover:text-blue-900 inline-flex items-center gap-1">
                    Google Cloud Console <ExternalLink size={12} />
                  </a>에 접속합니다. 새 프로젝트를 생성합니다.
                </li>
                <li>[API 및 서비스] &gt; [사용자 인증 정보]으로 이동합니다. <strong>'+ 사용자 인증정보 만들기 - OAuth 2.0 클라이언트 ID'</strong>를 선택합니다.</li>
                <li>
                  애플리케이션 유형 - <strong>웹 애플리케이션</strong> 선택, <strong>승인된 자바스크립트 원본</strong> 항목에 아래 주소를 <strong>반드시 추가</strong>하세요:
                  <br />
                  <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-mono mt-1 block w-fit">https://class-journal2.vercel.app</code>
                  <span className="text-xs text-blue-600">(마지막에 '/'가 없어야 합니다)</span>
                </li>
                <li>[API 및 서비스] - [사용설정된 API 및 서비스] 에서 <strong>'+API 및 서비스 사용 설정'</strong> 버튼을 클릭합니다. 'drive'를 검색 하고 <strong>'Google Drive API'</strong>를 선택 후 '사용' 버튼을 클릭합니다.</li>
                <li>[API 및 서비스] - [OAuth 동의 화면] - 대상 화면에서 <strong>테스트 사용자</strong>에 본인 이메일 주소를 입력하여 추가합니다. 같은 페이지 위에 있는 <strong>'앱 게시'</strong> 버튼을 클릭합니다.</li>
                <li>[API 및 서비스] - [사용자 인증 정보] - <strong>클라이언트 ID</strong>를 복사하여 아래에 입력하세요.</li>
                <li><a href="https://goldenrabbit.co.kr/articles/p4esg2wuouyO0dTyDYGG" target="_blank" rel="noreferrer" className="underline font-medium hover:text-blue-900 inline-flex items-center gap-1">
                    OAuth 2.0 클라이언트 ID 발급 방법 참고 자료<ExternalLink size={12} /></a>
                    <br /> ※ 승인된 자바스크립트 원본 주소는 꼭 위 안내된 주소를 입력하세요. 승인된 리디렉션 URI는 비워둡니다.</li>
              </ol>
            </div>
          </div>

          {/* Input Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Client ID</label>
              <div className="relative">
                <input
                  type={showSecrets ? "text" : "password"}
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Example: 123456789-abcdef.apps.googleusercontent.com"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showSecrets ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex gap-4">
              <Button onClick={handleSave} className="flex-1 md:flex-none flex items-center gap-2">
                {isSaved ? <Lock size={16} /> : <Save size={16} />}
                {isSaved ? '저장되었습니다' : '설정 저장하기'}
              </Button>
              
              {!isLoggedIn ? (
                <Button onClick={onLogin} variant="outline" className="flex-1 md:flex-none flex items-center gap-2">
                  <LogIn size={16} />
                  Google 로그인
                </Button>
              ) : (
                <Button onClick={handleLogout} variant="ghost" className="flex-1 md:flex-none flex items-center gap-2 text-red-500">
                  <LogOut size={16} />
                  로그아웃
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Status Section */}
      <Card>
        <CardHeader title="데이터 동기화 (Google Drive)" subtitle="클라우드에 안전하게 백업합니다." />
        <CardContent>
          {!isLoggedIn ? (
            <div className="text-center py-8 text-gray-500">
              <p>동기화를 위해 먼저 Google 계정으로 로그인해 주세요.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Auto Sync Toggle */}
              <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">자동 동기화</p>
                    {autoSync ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 font-medium">켜짐</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-500 font-medium">꺼짐</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">데이터 변경 시 30초 후 자동으로 백업합니다.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoSync} 
                    onChange={(e) => setAutoSync(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">최근 동기화</p>
                  <p className="text-xs text-gray-500">{lastSync || '기록 없음'}</p>
                </div>
                {isSyncing && <RefreshCw size={20} className="text-blue-500 animate-spin" />}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => uploadData(false)} 
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-2"
                >
                  <CloudUpload size={18} />
                  데이터 올리기 (백업)
                </Button>
                <Button 
                  onClick={downloadData} 
                  variant="outline" 
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-2"
                >
                  <CloudDownload size={18} />
                  데이터 내려받기 (복구)
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Local Backup Section */}
      <Card>
        <CardHeader title="PC 로컬 백업/복구" subtitle="인터넷 연결 없이 파일로 데이터를 저장합니다." />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={handleExportJson} 
              variant="outline"
              className="flex items-center justify-center gap-2 border-green-600 text-green-700 hover:bg-green-50"
            >
              <FileDown size={18} />
              PC로 백업 (JSON 내보내기)
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
                <div className="flex items-center justify-center gap-2 cursor-pointer h-10 px-4 py-2 rounded-md border border-orange-200 text-orange-700 font-medium hover:bg-orange-50 transition-colors">
                  <FileUp size={18} />
                  PC에서 복구 (JSON 가져오기)
                </div>
              </label>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            * 브라우저 캐시 삭제 시 데이터가 사라지는 것을 방지하기 위해 주기적으로 백업 파일을 다운로드해두세요.
          </p>
        </CardContent>
      </Card>

      <ClassManager />
      <SubjectManager />
    </div>
  );
};
