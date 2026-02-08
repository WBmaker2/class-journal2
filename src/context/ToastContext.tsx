import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, RefreshCw } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    if (duration > 0 && type !== 'loading') {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
    
    return id;
  }, [hideToast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[300px] max-w-md
              transition-all duration-300 ease-out transform translate-x-0 opacity-100
              ${toast.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' : ''}
              ${toast.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' : ''}
              ${toast.type === 'info' ? 'bg-blue-50 border-blue-100 text-blue-800' : ''}
              ${toast.type === 'loading' ? 'bg-white border-gray-100 text-gray-800' : ''}
            `}
            style={{
                animation: 'toast-in 0.3s ease-out'
            }}
          >
            <div className="shrink-0">
              {toast.type === 'success' && <CheckCircle size={20} className="text-green-500" />}
              {toast.type === 'error' && <AlertCircle size={20} className="text-red-500" />}
              {toast.type === 'info' && <Info size={20} className="text-blue-500" />}
              {toast.type === 'loading' && <RefreshCw size={20} className="text-blue-500 animate-spin" />}
            </div>
            
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            
            {toast.type !== 'loading' && (
              <button 
                onClick={() => hideToast(toast.id)}
                className="shrink-0 p-1 rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes toast-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
