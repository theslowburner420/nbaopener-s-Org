import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, AlertCircle, CheckCircle2, TrendingUp, Handshake } from 'lucide-react';

interface NegotiationOverlayProps {
  card: any;
  state: any;
  userTeam: any;
  onAccept: (salary: number, years: number) => void;
  onClose: () => void;
  mode: 'extension' | 'signing';
}

const NegotiationOverlay: React.FC<NegotiationOverlayProps> = ({
  card,
  state,
  userTeam,
  onAccept,
  onClose,
  mode
}) => {
  // Logic: Market Demand
  const baseDemand = useMemo(() => {
    const ovr = card.stats.ovr;
    const age = card.age || 25;
    
    // Simple logic: 80 OVR ~ 15M, 90 OVR ~ 30M, 99 OVR ~ 50M
    let salary = 1_000_000;
    if (ovr > 70) salary = Math.pow(ovr - 60, 2) * 50_000;
    if (ovr > 90) salary += (ovr - 90) * 5_000_000;
    
    // Age discount/premium
    if (age < 23) salary *= 1.2; // prospect premium
    else if (age > 33) salary *= 0.8; // veteran discount
    
    // Clamp
    salary = Math.max(1_000_000, Math.min(60_000_000, salary));
    
    const years = age < 28 ? 4 : age > 34 ? 1 : 2;
    
    return { salary: Math.floor(salary / 100_000) * 100_000, years };
  }, [card]);

  const [offerSalary, setOfferSalary] = useState(baseDemand.salary);
  const [offerYears, setOfferYears] = useState(baseDemand.years);
  const [result, setResult] = useState<'pending' | 'accepted' | 'rejected' | 'insufficient_funds'>('pending');

  const capSpace = 136_000_000 - userTeam.payroll;
  const currentSalary = userTeam.contracts?.[card.id]?.salary || 0;
  const isAffordable = offerSalary <= (capSpace + currentSalary);

  const likelihood = useMemo(() => {
    let score = 50;
    const salaryRatio = offerSalary / baseDemand.salary;
    score += (salaryRatio - 1) * 200; // 10% more = +20 score
    
    const yearDiff = offerYears - baseDemand.years;
    score -= Math.abs(yearDiff) * 10;
    
    return Math.max(0, Math.min(100, score));
  }, [offerSalary, offerYears, baseDemand]);

  const handleSumbit = () => {
    if (!isAffordable && mode === 'signing') {
      setResult('insufficient_funds');
      return;
    }

    // Roll for acceptance
    const roll = Math.random() * 100;
    if (roll < likelihood) {
      setResult('accepted');
      setTimeout(() => {
        onAccept(offerSalary, offerYears);
      }, 1500);
    } else {
      setResult('rejected');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[6000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-zinc-950 border border-white/10 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col md:flex-row"
      >
        {/* LEFT: PLAYER PROFILE */}
        <div className="w-full md:w-56 bg-zinc-900/50 p-6 flex flex-col items-center justify-center gap-4 border-b md:border-b-0 md:border-r border-white/5 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-amber-500/10 to-transparent opacity-50" />
            <div className="relative z-10 space-y-4 text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-black rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl">
                   <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} className="w-full h-full object-contain scale-110" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg font-black text-black italic border-4 border-zinc-900">{card.stats.ovr}</div>
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-tight">{card.name}</h2>
                <div className="flex items-center justify-center gap-2">
                   <span className="text-[10px] font-black text-amber-500 uppercase italic bg-amber-500/10 px-2 py-0.5 rounded">{card.position}</span>
                   <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{card.age || 25}Y</span>
                </div>
              </div>
            </div>
        </div>

        {/* RIGHT: NEGOTIATION */}
        <div className="flex-1 p-6 md:p-8 space-y-6 md:space-y-8 relative">
           <button onClick={onClose} className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors">
              <X size={20} />
           </button>

           <div className="space-y-1">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                {mode === 'extension' ? 'Contract Extension' : 'Free Agency Meeting'}
              </h3>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                Negotiating with {card.name.split(' ').pop()} Agents
              </p>
           </div>

           {result === 'pending' ? (
             <div className="space-y-6">
                {/* SALARY SLIDER */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Annual Salary</span>
                      <span className="text-xl font-black text-white italic tracking-tighter tabular-nums">${(offerSalary/1e6).toFixed(2)}M</span>
                   </div>
                   <input 
                     type="range" min={1_000_000} max={60_000_000} step={500_000} 
                     value={offerSalary} onChange={(e) => setOfferSalary(Number(e.target.value))}
                     className="w-full accent-amber-500 bg-zinc-900 rounded-lg appearance-none h-2 cursor-pointer"
                   />
                   <div className="flex justify-between text-[8px] font-black text-zinc-700 uppercase">
                      <span>$1.0M</span>
                      <span>Target: ${(baseDemand.salary/1e6).toFixed(1)}M</span>
                      <span>$60M</span>
                   </div>
                </div>

                {/* YEARS SELECT */}
                <div className="space-y-4">
                   <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Contract Duration</span>
                   <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map(y => (
                        <button 
                          key={y} onClick={() => setOfferYears(y)}
                          className={`py-3 rounded-xl font-black italic transition-all ${offerYears === y ? 'bg-white text-black scale-105 shadow-xl' : 'bg-white/5 text-zinc-500 hover:text-white'}`}
                        >
                          {y}Y
                        </button>
                      ))}
                   </div>
                </div>

                {/* LIKELIHOOD BAR */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 space-y-3">
                   <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest italic">
                      <span className="text-zinc-500">Player Interest</span>
                      <span className={likelihood > 70 ? 'text-green-500' : likelihood > 40 ? 'text-amber-500' : 'text-red-500'}>
                        {likelihood > 85 ? 'Extremely Likely' : likelihood > 65 ? 'Likely' : likelihood > 40 ? 'Maybe' : 'Unlikely'}
                      </span>
                   </div>
                   <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${likelihood}%` }}
                        className={`h-full transition-all duration-300 ${likelihood > 70 ? 'bg-green-500' : likelihood > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                      />
                   </div>
                </div>

                <div className="pt-2">
                   <button 
                     onClick={handleSumbit}
                     className="w-full py-4 md:py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-sm hover:bg-amber-500 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3"
                   >
                     Submit Formal Offer
                     <Handshake size={18} />
                   </button>
                </div>
             </div>
           ) : result === 'accepted' ? (
             <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12 animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-black shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                   <CheckCircle2 size={32} />
                </div>
                <div className="text-center space-y-1">
                   <h4 className="text-2xl font-black text-white italic uppercase italic">Offer Accepted!</h4>
                   <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">He's staying with the team</p>
                </div>
             </div>
           ) : result === 'rejected' ? (
             <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-12 animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-black shadow-[0_0_40px_rgba(239,68,68,0.3)]">
                   <AlertCircle size={32} />
                </div>
                <div className="text-center space-y-1">
                   <h4 className="text-2xl font-black text-white italic uppercase italic">Offer Rejected</h4>
                   <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">The player wants more value</p>
                </div>
                <button onClick={() => setResult('pending')} className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10">Try a different offer</button>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-12">
                <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center">
                   <TrendingUp size={32} />
                </div>
                <div className="text-center space-y-1">
                   <h4 className="text-2xl font-black text-white italic uppercase italic">Salary Cap Error</h4>
                   <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">You don't have enough space to sign him</p>
                </div>
                <button onClick={onClose} className="px-8 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest">Back to Front Office</button>
             </div>
           )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NegotiationOverlay;
