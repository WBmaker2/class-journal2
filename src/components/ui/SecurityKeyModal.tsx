import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from './Card';
import { Button } from './Button';
import { ShieldAlert, Lock, Eye, EyeOff, Info } from 'lucide-react';
import { useSupabase } from '../../context/SupabaseContext';

export const SecurityKeyModal: React.FC = () => {
  const { isLoggedIn, securityKey, setSecurityKey } = useSupabase();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  // Only show if logged in but no security key
  if (!isLoggedIn || securityKey) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) {
      alert('보안 비밀번호는 최소 4자리 이상이어야 합니다.');
      return;
    }
    setSecurityKey(password);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <Card className="w-full max-w-md shadow-2xl border-blue-100 overflow-hidden">
        <div className="bg-blue-600 p-6 text-white flex flex-col items-center text-center space-y-2">
          <div className="bg-white/20 p-3 rounded-full">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-bold">보안 비밀번호 입력</h2>
          <p className="text-blue-100 text-sm">
            데이터를 암호화하거나 복호화하기 위해<br />
            비밀번호가 필요합니다.
          </p>
        </div>
        
        <CardContent className="p-6 space-y-4">
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex gap-3">
            <ShieldAlert className="text-amber-600 flex-shrink-0" size={20} />
            <div className="text-xs text-amber-800 leading-relaxed">
              <strong>주의:</strong> 이 비밀번호는 서버에 저장되지 않습니다. 
              분실 시 관리자도 데이터를 복구해 드릴 수 없으니 꼭 기억해 주세요!
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">보안 비밀번호</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요 (4자리 이상)"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-lg font-bold">
              확인 및 동기화 시작
            </Button>
          </form>

          <div className="pt-2 flex items-start gap-2 text-gray-400">
            <Info size={14} className="mt-0.5" />
            <p className="text-[10px]">
              처음 사용하시는 경우, 지금 입력하시는 비밀번호가 앞으로의 보안 키가 됩니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
