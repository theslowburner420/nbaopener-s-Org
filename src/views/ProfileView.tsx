import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { supabase } from '../lib/supabase';
import { LogOut, Trash2, User as UserIcon, Check, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ProfileView: React.FC = () => {
  const { user, logout } = useGame();
  const [username, setUsername] = useState(user?.username || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(1);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;

    setIsUpdating(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: username }
      });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Username updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update username' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!supabase || !user) return;
    
    setIsUpdating(true);
    try {
      // Delete the profile record from the database
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      // Sign out the user
      await logout();
      window.location.reload();
    } catch (err: any) {
      console.error('Error during account deletion:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to delete account' });
    } finally {
      setIsUpdating(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto px-4 py-6 scrollbar-hide">
      <div className="max-w-md mx-auto space-y-8 pb-20">
        {/* Profile Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <UserIcon size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter italic">My Account</h2>
            <p className="text-zinc-500 text-sm font-medium">{user?.email}</p>
          </div>
        </div>

        {/* Username Form */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Profile Settings</h3>
          <form onSubmit={handleUpdateUsername} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-zinc-600 ml-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                placeholder="Enter username..."
              />
            </div>
            
            {message && (
              <div className={`text-[10px] font-bold uppercase px-3 py-2 rounded-lg ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdating || username === user?.username}
              className="w-full bg-white text-black font-black uppercase py-3 rounded-xl text-xs tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUpdating ? 'Updating...' : 'Save Changes'}
              {!isUpdating && <Check size={14} />}
            </button>
          </form>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => logout()}
            className="w-full bg-zinc-900 text-white font-black uppercase py-4 rounded-2xl text-xs tracking-widest border border-zinc-800 hover:bg-zinc-800 transition-all flex items-center justify-center gap-3"
          >
            <LogOut size={16} className="text-zinc-500" />
            Sign Out
          </button>
        </div>

        {/* Danger Zone */}
        <div className="pt-8 border-t border-zinc-900">
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle size={16} />
              <h3 className="text-xs font-black uppercase tracking-widest">Danger Zone</h3>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full bg-red-500/10 text-red-500 font-black uppercase py-3 rounded-xl text-[10px] tracking-widest border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={14} />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-zinc-950 border border-zinc-900 rounded-3xl p-8 space-y-6 shadow-2xl"
            >
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500">
                  <AlertTriangle size={32} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-black uppercase italic">Are you sure?</h4>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                    {deleteConfirmStep === 1 
                      ? "This action will permanently delete your account and all your collected cards."
                      : "This is your final warning. All progress will be lost forever."}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {deleteConfirmStep === 1 ? (
                  <button
                    onClick={() => setDeleteConfirmStep(2)}
                    className="w-full bg-red-500 text-white font-black uppercase py-4 rounded-xl text-xs tracking-widest hover:bg-red-600 transition-colors"
                  >
                    Yes, I understand
                  </button>
                ) : (
                  <button
                    onClick={handleDeleteAccount}
                    className="w-full bg-red-600 text-white font-black uppercase py-4 rounded-xl text-xs tracking-widest hover:bg-red-700 transition-colors shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                  >
                    Permanently Delete
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full bg-zinc-900 text-white font-black uppercase py-4 rounded-xl text-xs tracking-widest border border-zinc-800 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileView;
