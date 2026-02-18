import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, supabaseService } from '../services/supabase';
import { localStorageService } from '../services/localStorage';
import { encryptionService } from '../services/encryption';
import { useToast } from './ToastContext';

interface SupabaseContextType {
  user: User | null;
  session: any;
  isLoggedIn: boolean;
  isSyncing: boolean;
  lastSync: string | null;
  securityKey: string | null;
  setSecurityKey: (key: string | null) => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  syncData: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [securityKey, setSecurityKey] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!_event.includes('SIGNED_IN')) {
          setSecurityKey(null); // Clear key on logout
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await supabaseService.signInWithGoogle();
    } catch (error: any) {
      showToast('로그인 중 오류가 발생했습니다: ' + error.message, 'error');
    }
  };

  const signOut = async () => {
    try {
      await supabaseService.signOut();
      setSecurityKey(null);
      showToast('로그아웃 되었습니다.', 'success');
    } catch (error: any) {
      showToast('로그아웃 중 오류가 발생했습니다.', 'error');
    }
  };

  const syncData = useCallback(async () => {
    if (!user) return;
    
    // If we have cloud data but no security key, we can't sync.
    // The UI should trigger the modal in this case.
    if (!securityKey) {
        // We trigger a check to see if cloud data exists
        const cloudResult = await supabaseService.fetchUserData(user.id);
        if (cloudResult) return; // Wait for key
    }

    setIsSyncing(true);
    try {
      const cloudResult = await supabaseService.fetchUserData(user.id);
      const localData = localStorageService.getAllData();
      
      if (cloudResult && securityKey) {
        const encryptedData = cloudResult.data;
        
        // v3.1 Logic: Check if it's an encrypted format
        if (encryptedData.isEncrypted) {
            try {
                const decrypted = encryptionService.decrypt(encryptedData.payload, securityKey);
                localStorageService.saveAllData(decrypted);
                setLastSync(new Date(cloudResult.updated_at).toLocaleString());
                showToast('클라우드 데이터를 복호화하여 동기화했습니다.', 'success');
            } catch (e) {
                showToast('보안 비밀번호가 올바르지 않습니다.', 'error');
                setSecurityKey(null); // Force re-entry
            }
        } else {
            // Migration from v3.0 (plain) to v3.1 (encrypted)
            // If cloud is plain, we download it, then re-upload as encrypted
            localStorageService.saveAllData(encryptedData);
            const encryptedForCloud = {
                isEncrypted: true,
                payload: encryptionService.encrypt(encryptedData, securityKey),
                updatedAt: new Date().toISOString()
            };
            await supabaseService.upsertUserData(user.id, encryptedForCloud);
            showToast('기존 데이터를 암호화하여 클라우드에 업데이트했습니다.', 'success');
        }
      } else if (!cloudResult && securityKey) {
        // First time cloud sync: Encrypt and Upload local data
        const encryptedPayload = encryptionService.encrypt(localData, securityKey);
        const encryptedForCloud = {
            isEncrypted: true,
            payload: encryptedPayload,
            updatedAt: new Date().toISOString()
        };
        await supabaseService.upsertUserData(user.id, encryptedForCloud);
        setLastSync(new Date().toLocaleString());
        showToast('로컬 데이터를 암호화하여 클라우드에 백업했습니다.', 'success');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      showToast('동기화 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [user, securityKey, showToast]);

  // Sync when key is provided
  useEffect(() => {
    if (user && securityKey) {
      syncData();
    }
  }, [user, securityKey, syncData]);

  return (
    <SupabaseContext.Provider value={{
      user,
      session,
      isLoggedIn: !!user,
      isSyncing,
      lastSync,
      securityKey,
      setSecurityKey,
      signIn,
      signOut,
      syncData
    }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
