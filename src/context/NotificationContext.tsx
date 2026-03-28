import React, { createContext, useContext, useState, useCallback } from 'react';
import { Achievement } from '../types';
import AchievementToast from '../components/AchievementToast';
import { AnimatePresence, motion } from 'motion/react';
import { Info, XCircle, CheckCircle2 } from 'lucide-react';

type NotificationType = 'achievement' | 'error' | 'success' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  achievement?: Achievement;
  message?: string;
}

interface NotificationContextType {
  notify: (achievement: Achievement) => void;
  notifyError: (message: string) => void;
  notifySuccess: (message: string) => void;
  notifyInfo: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setQueue(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    setQueue(prev => [...prev, { ...notification, id }]);
    
    setTimeout(() => {
      removeNotification(id);
    }, 4000);
  }, [removeNotification]);

  const notify = useCallback((achievement: Achievement) => {
    addNotification({ type: 'achievement', achievement });
  }, [addNotification]);

  const notifyError = useCallback((message: string) => {
    addNotification({ type: 'error', message });
  }, [addNotification]);

  const notifySuccess = useCallback((message: string) => {
    addNotification({ type: 'success', message });
  }, [addNotification]);

  const notifyInfo = useCallback((message: string) => {
    addNotification({ type: 'info', message });
  }, [addNotification]);

  return (
    <NotificationContext.Provider value={{ notify, notifyError, notifySuccess, notifyInfo }}>
      {children}
      <div className="fixed top-6 left-0 right-0 z-[9999] flex flex-col items-center pointer-events-none px-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {queue.slice(0, 3).map((notif) => (
            <motion.div
              layout
              key={notif.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="pointer-events-auto"
            >
              {notif.type === 'achievement' && notif.achievement ? (
                <AchievementToast achievement={notif.achievement} />
              ) : (
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl ${
                    notif.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                    notif.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                    'bg-zinc-900/90 border-zinc-800 text-zinc-300'
                  }`}
                >
                  {notif.type === 'error' && <XCircle size={18} />}
                  {notif.type === 'success' && <CheckCircle2 size={18} />}
                  {notif.type === 'info' && <Info size={18} />}
                  <span className="text-sm font-bold tracking-tight">{notif.message}</span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};
