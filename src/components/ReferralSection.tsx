import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { validateAndApplyReferralCode, getReferralCountForUsername } from '../services/referralService';
import { Users, Copy, Check, Gift, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReferralSectionProps {
  onCodeApplied?: () => void;
}

export const ReferralSection: React.FC<ReferralSectionProps> = ({ onCodeApplied }) => {
  const { user, updateGameState, pendingReferral } = useGame();
  const [inputCode, setInputCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [referralsCount, setReferralsCount] = useState<number>(0);

  const currentUsername = user?.username || 'Guest';

  useEffect(() => {
    if (currentUsername) {
      getReferralCountForUsername(currentUsername).then(count => {
        setReferralsCount(count);
      });
    }
  }, [currentUsername]);

  const handleCopyCode = () => {
    if (!currentUsername) return;
    navigator.clipboard.writeText(currentUsername);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!inputCode.trim()) return;

    setIsValidating(true);

    try {
      const res = await validateAndApplyReferralCode(
        inputCode,
        currentUsername,
        user?.id || 'guest-id'
      );

      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        setInputCode('');
        updateGameState({
          pendingReferral: {
            inviterUsername: res.inviterUsername || inputCode.trim(),
            status: 'PENDING',
            createdAt: Date.now()
          }
        });
        if (onCodeApplied) onCodeApplied();
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Failed to validate referral code.' });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="w-full bg-zinc-900/90 border border-white/10 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
            <Users size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-base font-black italic uppercase tracking-tight text-white flex items-center gap-2">
              Referral System
              <span className="text-[10px] normal-case not-italic font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Anti-Fraud Protected
              </span>
            </h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Invite friends using your username
            </p>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
            Confirmed Referrals
          </span>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-xs italic">
            <Sparkles size={12} />
            <span>{referralsCount}/3</span>
          </div>
        </div>
      </div>

      {/* Share / Your Code Section */}
      <div className="mb-6 bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            Your Referral Code (Username)
          </p>
          <p className="text-lg font-black text-white italic tracking-tight uppercase">
            {currentUsername}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopyCode}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-white/10"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Referral Code Form or Applied Badge */}
      {pendingReferral && pendingReferral.status === 'PENDING' ? (
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-xs font-black uppercase text-emerald-400 tracking-wider">
              Referral Code Active ({pendingReferral.inviterUsername})
            </p>
            <p className="text-[11px] font-medium text-emerald-200/80 leading-snug">
              Referral code applied! Open your first free pack to claim your bonus rewards.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleApplyCode} className="space-y-3">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-1.5">
              REFERRAL CODE
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Enter friend's username (Optional)"
                className="flex-1 bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-xs font-bold text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors uppercase"
              />
              <button
                type="submit"
                disabled={isValidating || !inputCode.trim()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs uppercase tracking-widest hover:from-amber-400 hover:to-amber-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
              >
                {isValidating ? 'Checking...' : 'Apply Code'}
              </button>
            </div>
            <p className="text-[10px] font-bold text-zinc-400 mt-1.5 leading-normal">
              Enter a friend's username to receive bonus coins and a free pack after opening your first pack!
            </p>
          </div>

          {/* Feedback Messages */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                {feedback.type === 'success' ? (
                  <Check size={16} className="text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      )}
    </div>
  );
};
