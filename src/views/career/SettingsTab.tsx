import React from 'react';
import { motion } from 'motion/react';
import { Settings, LogOut, Trash2, Save, Cloud, ShieldCheck } from 'lucide-react';

interface SettingsTabProps {
  state: any;
  onLogout: () => void;
  onReset: () => void;
  onRefresh: () => void;
  isSaving: boolean;
}

const SettingsTab: React.FC<SettingsTabProps> = React.memo(({ 
  state, 
  onLogout, 
  onReset, 
  onRefresh,
  isSaving
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto space-y-12 pb-32"
    >
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-zinc-900 rounded-3xl mx-auto flex items-center justify-center text-zinc-500 border border-white/5">
           <Settings size={32} />
        </div>
        <h2 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter text-white">System Settings</h2>
        <p className="text-zinc-500 text-xs md:text-lg font-medium max-w-xl mx-auto">
          Manage your franchise cloud synchronization, account preferences, and general game configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-10 space-y-8">
           <div className="flex items-center gap-4">
              <Cloud size={20} className="text-blue-500" />
              <h3 className="text-lg font-black italic uppercase italic tracking-tighter text-white">Cloud Management</h3>
           </div>
           
           <div className="space-y-4">
              <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2">
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Auth Status</p>
                 <div className="flex items-center gap-3">
                    <ShieldCheck size={14} className={state.user ? "text-green-500" : "text-zinc-800"} />
                    <p className="text-xs font-bold text-white">{state.user ? `Logged in as ${state.user.username}` : 'Guest Mode (Local Only)'}</p>
                 </div>
              </div>

              <div className="flex flex-col gap-3">
                 <button 
                  onClick={onRefresh}
                   className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-3"
                 >
                    <Save size={14} /> {isSaving ? 'Syncing...' : 'Force Cloud Refresh'}
                 </button>
                 
                 {state.user ? (
                   <button 
                    onClick={onLogout}
                    className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 rounded-2xl border border-red-500/20 text-[10px] font-black uppercase tracking-widest text-red-500 transition-all flex items-center justify-center gap-3"
                   >
                      <LogOut size={14} /> End Session (Logout)
                   </button>
                 ) : (
                   <button 
                    onClick={onLogout}
                    className="w-full py-4 bg-amber-500 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3"
                   >
                      Sign In to Save
                   </button>
                 )}
              </div>
           </div>
        </div>

        <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-10 space-y-8">
           <div className="flex items-center gap-4">
              <Trash2 size={24} className="text-red-500" />
              <h3 className="text-lg font-black italic uppercase italic tracking-tighter text-white">Danger Zone</h3>
           </div>
           
           <div className="space-y-6">
              <p className="text-[10px] font-medium text-zinc-500 tracking-wide uppercase">
                Resetting your franchise will permanently delete all league progress, statistics, and roster changes. This action cannot be undone.
              </p>
              
              <button 
                onClick={onReset}
                className="w-full py-6 bg-red-600 hover:bg-red-500 text-white rounded-3xl font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95"
              >
                 Hard Reset Franchise
              </button>
           </div>
        </div>
      </div>

      <div className="text-center pt-24 opacity-20 group hover:opacity-100 transition-opacity">
          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.5em]">Franchise Engine v4.2.0 • Build 2026-05</p>
      </div>
    </motion.div>
  );
});

export default SettingsTab;
