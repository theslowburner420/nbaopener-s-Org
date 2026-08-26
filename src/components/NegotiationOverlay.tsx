import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, AlertCircle, CheckCircle, TrendingUp, Handshake, AlertTriangle, MessageSquare } from 'lucide-react';

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
  // 1. Calculate Base Demand
  const baseDemand = useMemo(() => {
    const ovr = card.stats.ovr;
    const age = card.age || 25;
    
    // Formula: 80 OVR ~ 15M, 90 OVR ~ 30M, 99 OVR ~ 50M
    let salary = 1_000_000;
    if (ovr > 70) salary = Math.pow(ovr - 60, 2) * 52_000;
    if (ovr > 90) salary += (ovr - 90) * 5_500_000;
    
    // Age calculations
    if (age < 23) salary *= 1.25; // young prospect premium
    else if (age > 33) salary *= 0.75; // old veteran discount
    
    salary = Math.max(1_000_000, Math.min(60_000_000, salary));
    const years = age < 27 ? 4 : age > 33 ? 1 : 2;
    
    return { salary: Math.floor(salary / 100_000) * 100_000, years };
  }, [card]);

  const [offerSalary, setOfferSalary] = useState(baseDemand.salary);
  const [offerYears, setOfferYears] = useState(baseDemand.years);
  const [result, setResult] = useState<'pending' | 'accepted' | 'rejected' | 'insufficient_funds'>('pending');

  // Hardcoded salary cap of $140.5M
  const SALARY_CAP = 140_500_000;
  // Luxury tax threshold of $150.0M
  const LUXURY_TAX_THRESHOLD = 150_000_000;

  const currentPayroll = userTeam?.payroll || 0;
  const currentSalary = userTeam?.contracts?.[card.id]?.salary || 0;
  
  // Calculate remaining room on cap taking into account replacing current salary if extension
  const availableCapSpace = SALARY_CAP - currentPayroll + (mode === 'extension' ? currentSalary : 0);
  const isAffordable = offerSalary <= availableCapSpace;

  // Real-time calculation of player alignment/interest
  const likelihood = useMemo(() => {
    let score = 50;
    const salaryRatio = offerSalary / baseDemand.salary;
    score += (salaryRatio - 1) * 250; // generous scale
    
    const yearDiff = offerYears - baseDemand.years;
    score -= Math.abs(yearDiff) * 15;
    
    // Age alignment logic
    if (card.age > 33 && offerYears > 3) {
      score -= 20; // Vets don't want long contracts or drag out negotiations
    }
    if (card.age < 24 && offerYears < 2) {
      score -= 25; // Young players want long-term securirty
    }

    return Math.max(0, Math.min(100, score));
  }, [offerSalary, offerYears, baseDemand, card]);

  // Real-time tactical dialogue quoting from agent
  const agentDialogue = useMemo(() => {
    const ratio = offerSalary / baseDemand.salary;
    const lastName = card.name.split(' ').pop() || 'client';

    if (card.age < 24 && offerYears < 2) {
      return `"${lastName} is a future star with immense upside. A short ${offerYears}-year contract does not represent a serious commitment to his development. We want long-term safety."`;
    }
    if (card.age > 33 && offerYears > 3) {
      return `"${lastName} appreciates the ${offerYears}-year tenure stability, but at his age, committing this long physically is a risk. Let's adjust down or expect high premiums."`;
    }

    if (ratio < 0.70) {
      return `"Is this a joke? My client didn't work this hard to settle for pennies. You need to respect ${lastName}'s status with a realistic bid."`;
    }
    if (ratio < 0.90) {
      return `"We are listening, but frankly, this is an under-market proposal. Raise the numbers first, or we will consult rival organizations in Free Agency."`;
    }
    if (ratio >= 0.90 && ratio < 1.05) {
      return `"This is a very professional, fair valuation of ${lastName}'s capabilities. If the parameters stay here, we are extremely interested."`;
    }
    if (ratio >= 1.05 && ratio < 1.25) {
      return `"Delicious! This represents true marquee respect. My client is ready to buy a home, suit up, and bring a championship here."`;
    }
    return `"Blockbuster offer! This is an elite max contract. Where is the pen? We are signing right now!"`;
  }, [offerSalary, offerYears, baseDemand, card]);

  const handleSumbit = () => {
    if (!isAffordable && mode === 'signing') {
      setResult('insufficient_funds');
      return;
    }

    // Roll based on computed threshold interest percentage
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

  // Circular progress angles
  const radius = 34;
  const strokeDashoffset = useMemo(() => {
    const totalPayrollAfterOffer = currentPayroll + offerSalary - (mode === 'extension' ? currentSalary : 0);
    const fraction = totalPayrollAfterOffer / LUXURY_TAX_THRESHOLD;
    const circumference = 2 * Math.PI * radius;
    return circumference - Math.min(1, fraction) * circumference;
  }, [currentPayroll, offerSalary, mode, currentSalary]);

  const projectPayrollTotal = currentPayroll + offerSalary - (mode === 'extension' ? currentSalary : 0);
  const isEnteringLuxuryTax = projectPayrollTotal > SALARY_CAP;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[6000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-6"
    >
      <motion.div 
        initial={{ scale: 0.92, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-zinc-950 border border-white/10 w-full max-w-[850px] rounded-[2.5rem] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.8)] flex flex-col md:flex-row relative"
      >
        {/* LEFT ASPECT: PLAYER CARD AND AGENT QUOTE BUBBLE */}
        <div className="w-full md:w-64 bg-zinc-900/60 p-6 flex flex-col items-center justify-between gap-6 border-b md:border-b-0 md:border-r border-white/5 relative overflow-hidden shrink-0">
            <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-amber-500/10 to-transparent opacity-40" />
            
            <div className="relative z-10 space-y-4 text-center w-full mt-4">
              <div className="relative inline-block">
                <div className="w-24 h-24 md:w-28 md:h-28 bg-black rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl relative">
                   <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} className="w-full h-full object-contain scale-110" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-md font-black text-black italic border-3 border-zinc-950 shadow-lg">{card.stats.ovr}</div>
              </div>
              
              <div className="space-y-1.5">
                <h2 className="text-lg md:text-xl font-black text-white italic tracking-tighter uppercase leading-tight">{card.name}</h2>
                <div className="flex items-center justify-center gap-2">
                   <span className="text-[9px] font-black text-amber-500 uppercase italic bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/10">{card.position}</span>
                   <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest">{card.age} Years Old</span>
                </div>
              </div>
            </div>

            {/* Tactical Agent Dialogue Speech Bubble */}
            <div className="relative z-10 w-full bg-zinc-950/80 border border-white/5 p-4 rounded-2xl space-y-2 mt-4">
              <p className="text-[7.5px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                <MessageSquare size={10} /> Agent Response
              </p>
              <p className="text-[10px] italic text-zinc-300 leading-relaxed text-left font-medium">
                {agentDialogue}
              </p>
            </div>
        </div>

        {/* RIGHT ASPECT: NEGOTIATION SCREEN CAP AND INTEREST */}
        <div className="flex-1 p-6 md:p-8 space-y-6 md:space-y-8 relative">
           <button onClick={onClose} className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors">
              <X size={18} />
           </button>

           <div className="space-y-1">
              <h3 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter text-white">
                {mode === 'extension' ? 'Contract Extension' : 'Free Agent Signing'}
              </h3>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                Negotiating salary cap with representative agents • Max Cap: $140.5M
              </p>
           </div>

           {result === 'pending' ? (
             <div className="space-y-5 md:space-y-6">
                
                {/* SALARY CAP INTERACTIVE SLIDER */}
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Annual Salary</span>
                      <span className="text-xl md:text-2.5xl font-black text-white italic tracking-tighter tabular-nums">${(offerSalary/1e6).toFixed(2)}M / Year</span>
                   </div>
                   <input 
                     type="range" min={1_000_000} max={60_000_000} step={500_000} 
                     value={offerSalary} onChange={(e) => setOfferSalary(Number(e.target.value))}
                     className="w-full accent-amber-500 bg-zinc-900 rounded-lg appearance-none h-2.5 cursor-pointer"
                   />
                   <div className="flex justify-between text-[7px] font-black text-zinc-650 uppercase tracking-widest leading-none">
                      <span>Min $1.0M</span>
                      <span className="text-amber-500 font-extrabold pb-0.5">Target Wage Demand: ${(baseDemand.salary/1e6).toFixed(1)}M</span>
                      <span>Max $60.0M</span>
                   </div>
                </div>

                {/* YEARS CONTRACT VALUE SELECTOR */}
                <div className="space-y-3">
                   <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Contract Duration</span>
                   <div className="grid grid-cols-5 gap-2.5">
                      {[1, 2, 3, 4, 5].map(y => (
                        <button 
                          key={y} onClick={() => setOfferYears(y)}
                          className={`py-3.5 rounded-xl font-black text-xs italic transition-all ${offerYears === y ? 'bg-white text-black scale-102 shadow-2xl font-black' : 'bg-white/5 text-zinc-500 hover:text-white border border-white/5'}`}
                        >
                          {y} Year{y > 1 ? 's' : ''}
                        </button>
                      ))}
                   </div>
                </div>

                {/* INTERACTIVE THERMOMETER DISPLAY & CIRULAR WATER METER */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Player Interest Thermometer */}
                  <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4.5 space-y-3 flex flex-col justify-between">
                     <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                        <span className="text-zinc-550">Thermometer Interest</span>
                        <span className={`font-mono font-black italic px-2 py-0.5 rounded leading-none ${likelihood > 80 ? 'bg-green-500/10 text-emerald-400' : likelihood > 45 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                          {likelihood}%
                        </span>
                     </div>
                     <div className="relative h-4 w-full bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${likelihood}%` }}
                          transition={{ duration: 0.3 }}
                          className={`h-full rounded-full ${likelihood > 80 ? 'bg-gradient-to-r from-emerald-600 to-green-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : likelihood > 45 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-red-650 to-rose-400'}`}
                        />
                     </div>
                     <p className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-widest">
                       {likelihood > 80 ? 'CHASE SECURED: Player is ready to execute' : likelihood > 45 ? 'ALIGNMENT: They may accept under negotiation' : 'WARNING: High probability of rejection'}
                     </p>
                  </div>

                  {/* Circular Salary Cap and Fluorescent warnings */}
                  <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4.5 flex items-center justify-between gap-4">
                     <div className="space-y-2 min-w-0">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none">Projected Payroll</p>
                        <p className="text-base font-black text-white italic font-mono leading-none">${(projectPayrollTotal/1e6).toFixed(1)}M</p>
                        
                        {isEnteringLuxuryTax ? (
                          <div className="bg-red-500/10 border border-red-500/35 p-1 px-2 rounded font-mono text-[7px] font-black text-red-500 uppercase tracking-wider animate-pulse flex items-center gap-1">
                            <AlertTriangle size={8} /> LUXURY TAX DANGERZONE
                          </div>
                        ) : (
                          <p className="text-[7px] font-extrabold text-emerald-400 uppercase tracking-widest">✓ Healthy CAP Margin</p>
                        )}
                     </div>

                     <div className="relative w-16 h-16 shrink-0">
                       <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                         <circle cx="40" cy="40" r={radius} fill="transparent" stroke="#27272a" strokeWidth="6" />
                         <motion.circle 
                           cx="40" cy="40" r={radius} fill="transparent" 
                           stroke={isEnteringLuxuryTax ? '#ef4444' : '#10b981'} 
                           strokeWidth="6" 
                           strokeDasharray={2 * Math.PI * radius}
                           strokeDashoffset={strokeDashoffset}
                           transition={{ duration: 0.5, ease: "easeOut" }}
                         />
                       </svg>
                       <div className="absolute inset-0 flex items-center justify-center text-[7.5px] font-black font-mono text-zinc-400 uppercase">
                         Cap
                       </div>
                     </div>
                  </div>
                </div>

                {/* Submission CTA */}
                <div className="pt-2">
                   <button 
                     onClick={handleSumbit}
                     className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-500 active:scale-[0.98] transition-all shadow-2xl flex items-center justify-center gap-2.5 duration-150"
                   >
                     <span>Transmit Formal Proposal Contract</span>
                     <Handshake size={15} />
                   </button>
                </div>
             </div>
           ) : result === 'accepted' ? (
             <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-16 animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-black shadow-[0_0_50px_rgba(34,197,94,0.4)]">
                   <CheckCircle size={32} />
                </div>
                <div className="text-center space-y-1">
                   <h4 className="text-2xl font-black text-white italic uppercase italic">Contract Approved!</h4>
                   <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">Additions updated inside Franchise active line-up</p>
                </div>
             </div>
           ) : result === 'rejected' ? (
             <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-10 animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-black shadow-[0_0_50px_rgba(239,68,68,0.4)]">
                   <AlertCircle size={32} />
                </div>
                <div className="text-center space-y-1">
                   <h4 className="text-xl font-black text-white italic uppercase italic">Deal Rejected</h4>
                   <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Your offer did not reach the threshold the agent demands</p>
                </div>
                <button onClick={() => setResult('pending')} className="px-8 py-3 bg-zinc-900 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 text-white transition-all">Revise Contract Terms</button>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-12">
                <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center">
                   <TrendingUp size={32} />
                </div>
                <div className="text-center space-y-1">
                   <h4 className="text-2xl font-black text-white italic uppercase italic">CAP FAILURE</h4>
                   <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">You have pierced the absolute Hard Cap boundary. Settle roster space first.</p>
                </div>
                <button onClick={onClose} className="px-8 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest">Close FRONT OFFICE MEETING</button>
             </div>
           )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NegotiationOverlay;
