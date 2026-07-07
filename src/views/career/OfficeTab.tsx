import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sparkles, Activity, TrendingUp, Building, History, X, Star, FileText, CheckCircle2, DollarSign, Heart, AlertCircle } from 'lucide-react';
import { PlayerHeadshot } from '../../components/PlayerHeadshot';

interface OfficeTabProps {
  state: any;
  userTeam: any;
  findCard: (id: string, season?: number) => any;
  handleNegotiationStart: (playerId: string) => void;
  setState: (state: any) => void;
}

interface Dilemma {
  id: string;
  title: string;
  category: string;
  scenario: string;
  icon: string;
  options: {
    label: string;
    description: string;
    consequences: {
      chemistry?: number;
      moral?: number;
      fanSupport?: number;
      budget?: number; // represented in payroll adjustment or positive budget notes
    };
  }[];
}

const OfficeTab: React.FC<OfficeTabProps> = React.memo(({ 
  state, 
  userTeam,
  findCard,
  handleNegotiationStart,
  setState
}) => {
  const [subTab, setSubTab] = React.useState<'dilemmas' | 'legacy' | 'hof' | 'contracts'>('dilemmas');
  const [activeDilemma, setActiveDilemma] = React.useState<Dilemma | null>(null);
  const [completedDilemmas, setCompletedDilemmas] = React.useState<string[]>([]);
  const [lastImpactReport, setLastImpactReport] = React.useState<any | null>(null);

  // Responsive layout state
  const [isMobile, setIsMobile] = React.useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!state || !userTeam) return null;

  const trophyCase = state.trophyCase || [];
  const seasonHistory = state.seasonHistory || [];
  const draftPicks = userTeam.draftPicks || [];
  const roster = userTeam.roster || [];
  const contracts = userTeam.contracts || {};
  const hallOfFame = state.hallOfFame || [];

  // Team states initializer in userTeam
  React.useEffect(() => {
    let mutated = false;
    if (userTeam.chemistry === undefined) {
      userTeam.chemistry = 68;
      mutated = true;
    }
    if (userTeam.moral === undefined) {
      userTeam.moral = 74;
      mutated = true;
    }
    if (userTeam.fanSupport === undefined) {
      userTeam.fanSupport = 70;
      mutated = true;
    }
    if (mutated) {
      setState({ ...state });
    }
  }, [userTeam, state, setState]);

  // Static dilemmas catalog with substantial impact metrics
  const DILEMMAS: Dilemma[] = [
    {
      id: "media_circus",
      title: "Exclusive Cable Rights Deal",
      category: "COMMERCIALS",
      scenario: "A national streaming network offers a massive $18M cash package for exclusive broadcast privileges. However, games will be restricted behind a premium paywall, locking out average fans.",
      icon: "📺",
      options: [
        {
          label: "Accept Streaming Deal",
          description: "Infuse high commercial liquidity into payroll while accepting negative local backlash.",
          consequences: { budget: 18000000, fanSupport: -15, chemistry: -3 }
        },
        {
          label: "Broaden Free Television",
          description: "Reject raw cash to maximize accessibility, dramatically boosting community affection.",
          consequences: { budget: -4000000, fanSupport: 25, moral: 8 }
        }
      ]
    },
    {
      id: "locker_room",
      title: "Locker Room Collision",
      category: "DYNAMICS",
      scenario: "During intensive drills, your elite player has publicly mocked a raw rookie. The locker room is split on whether to punish your star athlete or sweep it under the rug.",
      icon: "🏀",
      options: [
        {
          label: "Impose Public Fine",
          description: "Standardize equality across players. Generates pristine chemistry at the expense of player moral.",
          consequences: { chemistry: 18, moral: -12 }
        },
        {
          label: "Coordinate Quiet Counseling",
          description: "Maintain player comfort while sacrificing internal hierarchy and discipline indices.",
          consequences: { chemistry: -10, moral: 15, fanSupport: 5 }
        }
      ]
    },
    {
      id: "gym_renovation",
      title: "Therapeutic Center Overhaul",
      category: "INFRASTRUCTURE",
      scenario: "The head training director advises rebuilding the medical spa or hiring world-renowned physical therapists to stabilize player fatigue from double games.",
      icon: "🏨",
      options: [
        {
          label: "Invest in Hyperbaric Spa",
          description: "Allocate heavy finance into wellness facilities, boosting player health condition and high synergy.",
          consequences: { budget: -15000000, chemistry: 12, moral: 18 }
        },
        {
          label: "Accept Basic Gym Standard",
          description: "Conserve budget and maintain status quo with standard rehabilitation limits.",
          consequences: { budget: 2000000, chemistry: -2, fanSupport: -5 }
        }
      ]
    },
    {
      id: "practice_drills",
      title: "Double-Session Tactical Drills",
      category: "TRAINING",
      scenario: "Before the crucial division game, the team is showing low strategic coherence. You can order double-session focus drills, which will exhaustion spikes but enhance chemistry.",
      icon: "⏱️",
      options: [
        {
          label: "Order Double Drills",
          description: "Double down on severe conditioning. Increases roster chemistry while heavily reducing basic moral.",
          consequences: { chemistry: 22, moral: -16 }
        },
        {
          label: "Host Team Leisure Dinner",
          description: "Ditch practice to relieve exhaustion, allowing roster moral to recover completely.",
          consequences: { chemistry: -8, moral: 20, fanSupport: 8 }
        }
      ]
    },
    {
      id: "draft_promos",
      title: "Stadium Fan Giveaway",
      category: "PR",
      scenario: "The PR agency presents a custom merchandise night. Doing so requires an layout fee, but guarantees fans show unconditional loyalty in home games.",
      icon: "🧢",
      options: [
        {
          label: "Sponsor Vintage Jerseys",
          description: "Sponsor premium jersey giveaways, boosting community fans and overall team reputation.",
          consequences: { budget: -6000000, fanSupport: 22, moral: 10 }
        },
        {
          label: "Pass on Marketing Idea",
          description: "Save marketing money, letting fan support standardizes at current levels.",
          consequences: { budget: 1000000, fanSupport: -8 }
        }
      ]
    }
  ];

  const handleResolveDilemma = (dilemmaId: string, optionIndex: number) => {
    const dilemma = DILEMMAS.find(d => d.id === dilemmaId);
    if (!dilemma) return;

    const chosenOption = dilemma.options[optionIndex];
    const cons = chosenOption.consequences;

    // Mutate state with consequences
    const updatedUserTeam = { ...userTeam };
    if (cons.chemistry) updatedUserTeam.chemistry = Math.min(100, Math.max(0, (updatedUserTeam.chemistry || 0) + cons.chemistry));
    if (cons.moral) updatedUserTeam.moral = Math.min(100, Math.max(0, (updatedUserTeam.moral || 0) + cons.moral));
    if (cons.fanSupport) updatedUserTeam.fanSupport = Math.min(100, Math.max(0, (updatedUserTeam.fanSupport || 0) + cons.fanSupport));
    
    // Budget adjustments (represented directly as team payroll or dynamic capital notes)
    if (cons.budget) {
      if (cons.budget > 0) {
        // Boost finance context internally
        updatedUserTeam.payroll = Math.max(0, updatedUserTeam.payroll - cons.budget);
      } else {
        updatedUserTeam.payroll += Math.abs(cons.budget);
      }
    }

    // Save state
    const newState = { ...state };
    newState.teams[state.userTeamId] = updatedUserTeam;
    
    setCompletedDilemmas(prev => [...prev, dilemmaId]);
    setLastImpactReport({
      title: dilemma.title,
      chosen: chosenOption.label,
      cons
    });
    
    setState(newState);
    setActiveDilemma(null);
  };

  return (
    <motion.div 
      key="office"
      initial={{ opacity: 0, scale: 0.99 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.99 }}
      className="max-w-[1400px] mx-auto space-y-8 pb-32 px-4 md:px-8 select-none"
    >
       {/* BOARDROOM NAVIGATION */}
       <div className="flex bg-zinc-950 p-1 rounded-xl w-full md:w-fit mx-auto border border-white/5 overflow-x-auto no-scrollbar shrink-0 max-w-full">
         {[
           { id: 'dilemmas', label: 'Dilemmas', icon: <FileText size={12} /> },
           { id: 'legacy', label: 'Legacy', icon: <Trophy size={12} /> },
           { id: 'hof', label: 'HOF', icon: <Star size={12} /> },
           { id: 'contracts', label: 'Contracts', icon: <Building size={12} /> }
         ].map((t) => (
           <button
             key={t.id}
             onClick={() => {
               setSubTab(t.id as any);
               setLastImpactReport(null);
             }}
             className={`whitespace-nowrap flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer
               ${subTab === t.id ? 'bg-white text-black font-extrabold shadow-sm' : 'text-zinc-550 hover:text-white'}
             `}
           >
             {t.icon}
             <span>{t.label}</span>
           </button>
         ))}
       </div>

       {/* DYNAMIC METRICS BOARDROOM STATUS HUD */}
       <div className="grid grid-cols-3 gap-3 md:gap-6 select-none">
         {/* Team Chemistry status card */}
         {(() => {
           const chemVal = userTeam.chemistry ?? 68;
           const chemRadius = 24;
           const chemCircumference = 2 * Math.PI * chemRadius;
           const chemStrokeDashoffset = chemCircumference - (chemVal / 100) * chemCircumference;
           return (
             <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-emerald-500/20 p-3 md:p-5 rounded-xl md:rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 relative overflow-hidden shadow-2xl group hover:border-emerald-500/40 transition-all duration-300">
               <div className="space-y-1 text-center md:text-left">
                 <p className="text-[7px] font-black text-zinc-550 uppercase tracking-widest leading-none">TEAM COHESION</p>
                 <p className="text-[10px] md:text-sm font-black text-white italic uppercase tracking-wider leading-none mt-1">CHEMISTRY</p>
                 <span className="hidden md:inline-block text-[7px] bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 font-bold px-1.5 py-0.5 rounded leading-none mt-1.5">STABLE</span>
               </div>
               <div className="relative w-12 h-12 md:w-14 md:h-14 shrink-0 flex items-center justify-center">
                 <svg className="w-12 h-12 md:w-14 md:h-14 transform -rotate-90">
                   <circle cx="24" cy="24" r={chemRadius} className="stroke-zinc-900 fill-none" strokeWidth="3" />
                   <circle 
                     cx="24" cy="24" r={chemRadius} 
                     className="stroke-emerald-500 fill-none transition-all duration-1000 ease-out" 
                     strokeWidth="3.5" 
                     strokeDasharray={chemCircumference}
                     strokeDashoffset={chemStrokeDashoffset}
                     strokeLinecap="round"
                   />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center">
                   <span className="text-[10px] md:text-xs font-black text-white font-mono italic">{chemVal}%</span>
                 </div>
               </div>
             </div>
           );
         })()}

         {/* Team Moral status card */}
         {(() => {
           const moralVal = userTeam.moral ?? 74;
           const moralRadius = 24;
           const moralCircumference = 2 * Math.PI * moralRadius;
           const moralStrokeDashoffset = moralCircumference - (moralVal / 100) * moralCircumference;
           return (
             <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-indigo-500/20 p-3 md:p-3 rounded-xl md:rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 relative overflow-hidden shadow-2xl group hover:border-indigo-500/40 transition-all duration-300">
               <div className="space-y-1 text-center md:text-left">
                 <p className="text-[7px] font-black text-zinc-550 uppercase tracking-widest leading-none">ROSTER HAPPY</p>
                 <p className="text-[10px] md:text-sm font-black text-white italic uppercase tracking-wider leading-none mt-1">MORAL</p>
                 <span className="hidden md:inline-block text-[7px] bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 font-bold px-1.5 py-0.5 rounded leading-none mt-1.5">OPTIMISM</span>
               </div>
               <div className="relative w-12 h-12 md:w-14 md:h-14 shrink-0 flex items-center justify-center">
                 <svg className="w-12 h-12 md:w-14 md:h-14 transform -rotate-90">
                   <circle cx="24" cy="24" r={moralRadius} className="stroke-zinc-900 fill-none" strokeWidth="3" />
                   <circle 
                     cx="24" cy="24" r={moralRadius} 
                     className="stroke-indigo-500 fill-none transition-all duration-1000 ease-out" 
                     strokeWidth="3.5" 
                     strokeDasharray={moralCircumference}
                     strokeDashoffset={moralStrokeDashoffset}
                     strokeLinecap="round"
                   />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center">
                   <span className="text-[10px] md:text-xs font-black text-white font-mono italic">{moralVal}%</span>
                 </div>
               </div>
             </div>
           );
         })()}

         {/* Fan Support status card */}
         {(() => {
           const fansVal = userTeam.fanSupport ?? 70;
           const fansRadius = 24;
           const fansCircumference = 2 * Math.PI * fansRadius;
           const fansStrokeDashoffset = fansCircumference - (fansVal / 100) * fansCircumference;
           return (
             <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-amber-500/20 p-3 md:p-5 rounded-xl md:rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 relative overflow-hidden shadow-2xl group hover:border-amber-500/40 transition-all duration-300">
               <div className="space-y-1 text-center md:text-left">
                 <p className="text-[7px] font-black text-zinc-550 uppercase tracking-widest leading-none">ATTENDANCE</p>
                 <p className="text-[10px] md:text-sm font-black text-white italic uppercase tracking-wider leading-none mt-1">FAN SUPPORT</p>
                 <span className="hidden md:inline-block text-[7px] bg-amber-500/10 border border-amber-500/15 text-amber-500 font-bold px-1.5 py-0.5 rounded leading-none mt-1.5">SOLD OUT</span>
               </div>
               <div className="relative w-12 h-12 md:w-14 md:h-14 shrink-0 flex items-center justify-center">
                 <svg className="w-12 h-12 md:w-14 md:h-14 transform -rotate-90">
                   <circle cx="24" cy="24" r={fansRadius} className="stroke-zinc-900 fill-none" strokeWidth="3" />
                   <circle 
                     cx="24" cy="24" r={fansRadius} 
                     className="stroke-amber-500 fill-none transition-all duration-1000 ease-out" 
                     strokeWidth="3.5" 
                     strokeDasharray={fansCircumference}
                     strokeDashoffset={fansStrokeDashoffset}
                     strokeLinecap="round"
                   />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center">
                   <span className="text-[10px] md:text-xs font-black text-white font-mono italic">{fansVal}%</span>
                 </div>
               </div>
             </div>
           );
         })()}
       </div>

       {subTab === 'dilemmas' && (
         <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-white/5 pb-4">
               <div>
                  <h3 className="text-lg md:text-2xl font-black italic uppercase tracking-tighter text-white">STRATEGIC DILEMMAS</h3>
                  <p className="text-[8px] md:text-[9.5px] font-bold text-zinc-650 uppercase tracking-widest leading-none mt-1">Accept high risk alternatives to boost dynamic franchise coefficients</p>
               </div>
               <span className="text-[8px] border border-white/10 text-zinc-550 font-black px-2.5 py-1 rounded-full uppercase tracking-wider bg-zinc-950 leading-none">
                  LEVEL 1 EXECUTIVE SECTOR
               </span>
            </div>

            {/* Dilemma impact banner if any */}
            {lastImpactReport && (
              <motion.div 
                initial={{ scale: 0.98, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="bg-emerald-500/[0.02] border border-emerald-500/20 p-5 rounded-2xl flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-emerald-400 uppercase tracking-wider">DECISION RESOLVED SUCCESSFULLY</p>
                  <p className="text-xs md:text-sm font-bold text-zinc-200 uppercase">{lastImpactReport.title} — {lastImpactReport.chosen}</p>
                </div>
                <div className="flex gap-3 text-[9px] md:text-xs font-mono font-bold italic shrink-0">
                  {lastImpactReport.cons.chemistry && (
                    <span className={lastImpactReport.cons.chemistry > 0 ? "text-emerald-400" : "text-rose-450"}>
                      CHEM {lastImpactReport.cons.chemistry > 0 ? `+${lastImpactReport.cons.chemistry}` : lastImpactReport.cons.chemistry}%
                    </span>
                  )}
                  {lastImpactReport.cons.moral && (
                    <span className={lastImpactReport.cons.moral > 0 ? "text-indigo-400" : "text-rose-450"}>
                      MORAL {lastImpactReport.cons.moral > 0 ? `+${lastImpactReport.cons.moral}` : lastImpactReport.cons.moral}%
                    </span>
                  )}
                  {lastImpactReport.cons.fanSupport && (
                    <span className={lastImpactReport.cons.fanSupport > 0 ? "text-amber-500" : "text-rose-450"}>
                      FANS {lastImpactReport.cons.fanSupport > 0 ? `+${lastImpactReport.cons.fanSupport}` : lastImpactReport.cons.fanSupport}%
                    </span>
                  )}
                  {lastImpactReport.cons.budget && (
                    <span className={lastImpactReport.cons.budget > 0 ? "text-emerald-400" : "text-rose-450"}>
                      BUDGET {lastImpactReport.cons.budget > 0 ? `+${(lastImpactReport.cons.budget/1e6).toFixed(0)}M` : `-${(Math.abs(lastImpactReport.cons.budget)/1e6).toFixed(0)}M`}
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* BENTO GRID OF DILEMMAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {DILEMMAS.map((d) => {
                const isDone = completedDilemmas.includes(d.id);
                return (
                  <motion.div 
                    key={d.id}
                    whileHover={isDone ? {} : { y: -6, scale: 1.02 }}
                    onClick={() => {
                      if (!isDone) setActiveDilemma(d);
                    }}
                    className={`bg-zinc-950 border-2 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative h-76 overflow-hidden ${
                      isDone 
                        ? 'opacity-35 border-zinc-900 cursor-default' 
                        : 'border-zinc-800 cursor-pointer hover:border-amber-500/40 hover:shadow-[0_20px_40px_rgba(245,158,11,0.06)]'
                    }`}
                  >
                     {/* Decorative high-tech subtle grid blueprint background */}
                     <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                     <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none opacity-40" />

                     {/* Executive tab dossier banner specifying the category with vintage folder stamp style */}
                     <div className="absolute top-0 left-6 h-5 px-2.5 bg-zinc-900 border-x border-b border-zinc-800 rounded-b-lg flex items-center justify-center leading-none">
                       <span className="text-[6.5px] font-black text-amber-500 tracking-wider uppercase">{d.category}</span>
                     </div>

                     {/* Overlay resolved mark */}
                     {isDone ? (
                       <div className="absolute top-3.5 right-4 text-[7px] font-bold text-zinc-500 border border-zinc-800 bg-zinc-950/90 px-2 py-0.5 rounded uppercase leading-none italic flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          RESOLVED
                       </div>
                     ) : (
                       <div className="absolute top-3.5 right-4 text-[7px] font-black text-amber-500/95 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 leading-none">
                          PRESIDENTIAL ACTION
                       </div>
                     )}

                     <div className="space-y-4 mt-4 relative z-10">
                        <div className="flex items-center gap-3">
                           <div className="text-lg bg-zinc-900 border border-zinc-800 w-11 h-11 rounded-xl flex items-center justify-center p-1">
                              {d.icon}
                           </div>
                           <div className="leading-tight">
                              <span className="text-[7.5px] font-bold text-zinc-500 tracking-widest uppercase leading-none">ADMINISTRATIVE REPORT</span>
                              <h4 className="text-xs md:text-sm font-sans font-black text-white italic uppercase w-44 truncate leading-none mt-1">{d.title}</h4>
                           </div>
                        </div>

                        <p className="text-zinc-400 text-[10px] font-normal leading-relaxed tracking-wide uppercase">
                          {d.scenario.slice(0, 110)}...
                        </p>
                     </div>

                     <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[8.5px] font-black uppercase tracking-wider text-zinc-500 leading-none relative z-10">
                       <span className="font-mono text-zinc-650">{d.options.length} DECISION BRANCHES</span>
                       <span className="text-zinc-400 group-hover:text-amber-500 transition-colors flex items-center gap-1">ANALYZE FILES &rarr;</span>
                     </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

       {subTab === 'legacy' && (
          <div className="space-y-12">
             {/* TROPHY CASE */}
             <div className="space-y-8 relative">
                <div className="flex items-center justify-between px-2">
                   <div className="space-y-1.5 leading-none">
                      <h3 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter text-white">THE CHAMPION VAULT</h3>
                      <p className="text-[8px] md:text-[9.5px] font-black text-zinc-550 uppercase tracking-widest leading-none">Your corporate dynasty credentials</p>
                   </div>
                   <Trophy className="text-zinc-700 md:w-10 md:h-10 shrink-0" size={28} />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 font-sans">
                   {[
                     { type: 'CHAMP', label: 'WORLD TITLES', icon: <Trophy size={18} />, color: 'bg-zinc-100 text-black', glow: 'shadow-md border border-white/15' },
                     { type: 'MVP', label: 'MVP AWARDS', icon: <Sparkles size={18} />, color: 'bg-zinc-900 text-zinc-200', glow: 'shadow-sm border border-white/5' },
                     { type: 'DPOY', label: 'DPOY FLIES', icon: <Activity size={18} />, color: 'bg-zinc-900 text-zinc-400', glow: 'shadow-sm border border-white/5' },
                     { type: 'ALL_NBA', label: 'ALL-NBA PICKS', icon: <Star size={18} />, color: 'bg-zinc-900 text-zinc-400', glow: 'shadow-sm border border-white/5' }
                   ].map((t) => {
                     const achievements = (state.trophyCase || []).filter((item: any) => item.type === t.type);
                     return (
                       <div key={t.label} className="group relative bg-gradient-to-b from-zinc-950 to-zinc-900/40 border border-white/5 hover:border-amber-500/30 rounded-[2rem] p-5 md:p-8 flex flex-col items-center justify-center gap-2 md:gap-4 transition-all duration-300 overflow-hidden shadow-[0_4px_25px_rgba(245,158,11,0.01)]">
                         {/* Animated golden reflection sweep effect */}
                         <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1200ms] ease-out bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none" />
                         
                         <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-1 group-hover:scale-110 transition-transform duration-300 ${t.color} ${t.glow} group-hover:drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]`}>
                             {t.icon}
                         </div>
                         <div className="text-center">
                             <p className="text-[7.5px] md:text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1.5">{t.label}</p>
                             <p className="text-2xl md:text-3xl font-black text-white italic font-mono leading-none">{achievements.length}</p>
                         </div>
                       </div>
                     );
                   })}
                </div>

                {state.trophyCase.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                     {trophyCase.slice().reverse().map((award: any, i: number) => {
                         const player = award.playerId ? findCard(award.playerId) : null;
                         return (
                           <motion.div 
                             initial={{ opacity: 0, x: -10 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: i * 0.05 }}
                             key={`${award.type}-${award.season}-${i}`}
                             className="flex items-center gap-4 bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-800 p-4 rounded-xl hover:border-amber-500/30 transition-all duration-300 hover:shadow-[0_8px_16px_rgba(245,158,11,0.03)] group"
                           >
                               <div className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 border border-zinc-850 bg-zinc-90 w-fit ${award.type === 'CHAMP' ? 'text-amber-400 bg-zinc-900 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)] animate-pulse' : 'text-zinc-400 bg-zinc-950'}`}>
                                 <Trophy size={14} />
                               </div>
                               <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-1.5 mb-0.5 leading-none">
                                     <span className="text-[8px] font-black text-amber-500 italic uppercase">Season {award.season}</span>
                                     <span className="text-[6.5px] font-black text-zinc-650 uppercase tracking-widest">• {award.type}</span>
                                 </div>
                                 <h4 className="text-xs md:text-sm font-black text-white italic truncate leading-none uppercase mt-1">
                                     {award.type === 'CHAMP' ? 'World Champions' : player?.name || award.label || 'Major Award'}
                                 </h4>
                               </div>
                           </motion.div>
                         );
                     })}
                  </div>
                ) : (
                  <div className="bg-zinc-950/40 border-2 border-dashed border-zinc-900 rounded-2xl p-10 md:p-16 text-center space-y-4">
                     <Trophy className="text-zinc-800 mx-auto md:w-12 md:h-12 shrink-0 animate-pulse" size={32} />
                     <div className="space-y-1">
                         <p className="text-base font-black text-zinc-600 uppercase italic leading-none">Empty Vault Archives</p>
                         <p className="text-[8px] font-bold text-zinc-750 uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">Establish your strategic dynasty to claim your first trophy legacy</p>
                     </div>
                  </div>
                )}
             </div>

             {/* SEASON HISTORY */}
             <div className="space-y-6">
                <div className="flex items-center justify-between px-2 text-sans leading-none">
                   <div className="space-y-1.5 leading-none">
                      <h3 className="text-lg md:text-2xl font-black uppercase italic tracking-tighter text-white leading-none">Franchise Ledger</h3>
                      <p className="text-[8px] md:text-[9.5px] font-bold text-zinc-550 uppercase tracking-widest leading-none">Year-by-Year Performance records</p>
                   </div>
                </div>
                
                <div className="bg-zinc-950 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                   <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-white/5 bg-zinc-950 text-[8px] md:text-[9.5px] font-black text-zinc-500 uppercase tracking-widest">
                           <th className="px-6 py-4 font-black">Fiscal Year</th>
                           <th className="px-4 py-4 text-center">Outcome Record</th>
                           <th className="px-4 py-4 text-center">Playoffs Standing</th>
                           <th className="px-4 py-4">Season Winner</th>
                           <th className="px-6 py-4 text-right">Roster Accolades</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {seasonHistory.slice().reverse().map((h: any) => (
                           <tr key={h.seasonYear} className="hover:bg-white/[0.015] transition-colors duration-150">
                              <td className="px-6 py-3.5 font-black text-amber-500 italic uppercase">Season {h.seasonYear}</td>
                              <td className="px-4 py-3.5 font-bold font-mono text-zinc-300 text-center">{h.wins}W - {h.losses}L</td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${h.playoffResult.includes('CHAMP') ? 'bg-white text-black md:font-extrabold' : 'bg-zinc-900 text-zinc-500 border border-white/5'}`}>
                                  {h.playoffResult}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-zinc-400 font-medium italic uppercase text-[11px]">{h.champion}</td>
                              <td className="px-6 py-3.5 text-right">
                                 <div className="flex justify-end gap-1.5 flex-wrap">
                                    {h.mvp && <span className="px-2 py-0.5 bg-zinc-900 border border-white/10 text-zinc-400 rounded text-[7.5px] font-black uppercase">MVP</span>}
                                    {h.allNba?.length > 0 && <span className="px-2 py-0.5 bg-zinc-900 border border-white/10 text-zinc-400 rounded text-[7.5px] font-black uppercase">ALL-NBA</span>}
                                 </div>
                              </td>
                           </tr>
                        ))}
                        {seasonHistory.length === 0 && (
                           <tr>
                              <td colSpan={5} className="py-14 text-center text-zinc-700 italic font-black uppercase tracking-widest text-[9px]">No historical season history archived yet</td>
                           </tr>
                        )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
       )}

       {subTab === 'hof' && (
          <div className="space-y-8">
             <div className="flex items-center justify-between px-2 leading-none">
                 <div className="space-y-1.5 leading-none">
                     <h3 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter text-white leading-none">Cooperstown Court</h3>
                     <p className="text-[8px] md:text-[9.5px] font-bold text-zinc-550 uppercase tracking-widest leading-none">Retired legends of the corporation</p>
                 </div>
                 <Star className="text-zinc-700 md:w-10 md:h-10 shrink-0" size={28} />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {(state.hallOfFame || []).map((player: any) => (
                   <div key={player.id} className="bg-zinc-950 border border-white/5 rounded-[2.5rem] p-6 space-y-6 relative overflow-hidden group hover:border-white/10 transition-all">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.01] blur-2xl rounded-full" />
                      
                      <div className="flex items-center gap-4">
                         <div className="w-16 h-16 bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 pointer-events-none p-0.5">
                            <PlayerHeadshot nbaId={player.card?.nbaId} name={player.name} />
                         </div>
                         <div className="space-y-1">
                            <h4 className="text-base font-black text-white italic truncate w-44 uppercase font-bold tracking-tight">{player.name}</h4>
                            <p className="text-[8px] font-bold text-amber-500 uppercase tracking-widest">{player.seasonsPlayed} SEASONS ACTIVE</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 border-y border-white/5 py-4 text-center">
                         <div>
                            <p className="text-[7.5px] font-black text-zinc-500 uppercase leading-none">Points</p>
                            <p className="text-sm font-black text-white font-mono mt-1 italic">{player.stats.points}</p>
                         </div>
                         <div className="border-x border-white/5">
                            <p className="text-[7.5px] font-black text-zinc-500 uppercase leading-none">Rebounds</p>
                            <p className="text-sm font-black text-white font-mono mt-1 italic">{player.stats.rebounds}</p>
                         </div>
                         <div>
                            <p className="text-[7.5px] font-black text-zinc-500 uppercase leading-none">Assists</p>
                            <p className="text-sm font-black text-white font-mono mt-1 italic">{player.stats.assists}</p>
                         </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                         {player.awards.map((a: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-zinc-90 w-fit rounded text-[7px] font-black border border-white/5 text-zinc-500 uppercase tracking-wider">{a}</span>
                         ))}
                      </div>
                   </div>
                ))}
                {hallOfFame.length === 0 && (
                   <div className="col-span-full py-16 text-center space-y-3.5 bg-zinc-950 rounded-[2rem] border border-dashed border-white/5">
                      <Star size={36} className="text-zinc-850 mx-auto animate-spin duration-[4000ms]" />
                      <p className="text-zinc-650 font-black uppercase italic tracking-widest text-[9.5px]">No legends retired on file yet</p>
                   </div>
                )}
             </div>
          </div>
       )}

       {subTab === 'contracts' && (
          <div className="space-y-10">
             {/* FINANCE & ASSETS */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-zinc-950 border border-white/5 rounded-[2rem] p-6 md:p-8 space-y-6 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.01] blur-2xl rounded-full" />
                   <div className="flex items-center justify-between relative z-10 leading-none">
                     <div className="space-y-1 leading-none">
                       <h3 className="text-lg md:text-2xl font-black uppercase italic tracking-tighter text-white leading-none">Fiscal Audit</h3>
                       <p className="text-[8px] md:text-[9.5px] font-bold text-zinc-550 uppercase tracking-widest italic leading-none">Roster payroll caps and financial margin limit</p>
                     </div>
                     <Building size={20} className="text-zinc-700" />
                   </div>

                   <div className="space-y-4 relative z-10">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-[7.5px] font-black text-zinc-550 uppercase tracking-widest leading-none">Roster Payroll</p>
                          <p className="text-base md:text-xl font-black text-white italic font-mono leading-none">${(userTeam.payroll / 1000000).toFixed(1)}M</p>
                        </div>
                        <div className="space-y-1 border-x border-white/5 px-4 text-center">
                          <p className="text-[7.5px] font-black text-zinc-550 uppercase tracking-widest leading-none border-b border-transparent">Hard Budget Cap</p>
                          <p className="text-base md:text-xl font-black text-zinc-400 italic font-mono leading-none">$136.0M</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-[7.5px] font-black text-zinc-550 uppercase tracking-widest leading-none">Usable Space</p>
                          <p className={`text-base md:text-xl font-black italic font-mono leading-none ${userTeam.payroll > 136000000 ? 'text-rose-450' : 'text-emerald-400'}`}>
                            ${((136000000 - userTeam.payroll) / 1000000).toFixed(1)}M
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                         <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((userTeam.payroll / 136000000) * 100, 100)}%` }}
                              className={`h-full rounded-full transition-all duration-1000 ${userTeam.payroll > 136000000 ? 'bg-rose-500' : 'bg-amber-500'}`}
                            />
                         </div>
                         <div className="flex justify-between text-[7px] font-mono font-bold text-zinc-650 uppercase tracking-widest">
                           <span>CURRENT MARGIN UTILIZATION</span>
                           <span className="text-zinc-500">{((userTeam.payroll / 136000000) * 100).toFixed(1)}% USED</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 rounded-[2rem] p-6 md:p-8 space-y-6 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.01] blur-2xl rounded-full" />
                   <div className="flex items-center justify-between relative z-10 leading-none">
                     <div className="space-y-1 leading-none">
                       <h3 className="text-lg md:text-2xl font-black uppercase italic tracking-tighter text-white leading-none">Draft Wealth</h3>
                       <p className="text-[8px] md:text-[9.5px] font-bold text-zinc-550 uppercase tracking-widest italic leading-none">Secured draft equity certificates on ledger</p>
                     </div>
                     <History size={20} className="text-zinc-700" />
                   </div>

                      <div className="flex flex-wrap gap-2 relative z-10 pb-2">
                      {draftPicks.slice(0, 10).map((p: any) => (
                         <div key={p.id} className="px-4 py-2.5 bg-zinc-900/60 border border-white/5 rounded-xl flex flex-col items-start gap-1 cursor-default hover:border-white/10 transition-colors">
                            <span className="text-[7.5px] font-black text-zinc-500 uppercase leading-none">{p.year} {p.round === 1 ? '1ST ROUND' : '2ND ROUND'}</span>
                            <span className="text-[10px] font-black text-white italic tracking-tighter leading-none">{p.originalOwnerId} Pick</span>
                         </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* STATS TABLE PAYROLL REGISTRY */}
             <div className="space-y-6 leading-none">
                <div className="flex items-center justify-between px-2">
                   <div className="space-y-1.5 leading-none">
                      <h3 className="text-lg md:text-2xl font-black uppercase italic tracking-tighter text-white leading-none">Contract Ledger</h3>
                      <p className="text-[8px] md:text-[9.5px] font-bold text-zinc-550 uppercase tracking-widest leading-none">Active roster contract conditions and financial splits</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                   {roster.slice().sort((a: string, b: string) => (contracts[b]?.salary || 0) - (contracts[a]?.salary || 0)).map((id: string) => {
                      const card = findCard(id);
                      const contract = contracts[id];
                      if (!card || !contract) return null;
                      const isExpiring = contract.yearsRemaining === 1;

                      return (
                         <div key={id} className="bg-zinc-950 border border-white/5 rounded-2xl p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.01] transition-all relative overflow-hidden group">
                            {isExpiring && <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />}
                            
                            <div className="flex items-center gap-4 flex-1">
                               <div className="relative shrink-0 pointer-events-none">
                                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 overflow-hidden relative p-0.2">
                                     <PlayerHeadshot nbaId={card.nbaId} name={card.name} />
                                  </div>
                               </div>

                               <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap leading-none">
                                     <span className="text-[7.5px] font-black bg-zinc-900 border border-white/5 text-zinc-500 px-1.5 py-0.5 rounded uppercase leading-none">{card.position}</span>
                                      <div className={`text-[7.5px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest italic flex items-center leading-none
                                         ${contract.contractType === 'max' || contract.contractType === 'supermax' ? 'border-amber-500 text-amber-500 bg-amber-500/5' : 
                                           contract.contractType === 'mid' ? 'border-zinc-500 text-zinc-400 bg-zinc-950' :
                                           contract.contractType === 'rookie' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5' :
                                           contract.contractType === 'two-way' ? 'border-purple-500 text-purple-500 bg-purple-500/5' :
                                           'border-zinc-800 text-zinc-650 bg-zinc-950'}
                                      `}>
                                         {contract.contractType?.toUpperCase() || 'PRO VETERAN'} 
                                         {contract.contractType === 'supermax' && <Sparkles size={8} className="ml-1 text-amber-400" />}
                                      </div>
                                  </div>
                                  <h4 className="text-sm font-black text-white uppercase italic truncate mt-1 leading-none group-hover:text-amber-500 transition-colors">{card.name}</h4>
                               </div>
                            </div>

                            <div className="flex items-center justify-between md:flex-col md:items-end gap-2 md:gap-3 border-t md:border-t-0 border-white/5 pt-3 md:pt-0 shrink-0">
                               <div className="text-left md:text-right">
                                  <p className="text-sm md:text-lg font-black text-white italic font-mono leading-none">${(contract.salary/1e6).toFixed(1)}M</p>
                                  <div className="flex items-center gap-1 mt-1 justify-start md:justify-end">
                                     <div className={`w-1 h-1 rounded-full ${contract.yearsRemaining <= 2 ? 'bg-amber-500 animate-pulse' : 'bg-zinc-550'}`} />
                                      <p className={`text-[8px] font-bold uppercase tracking-widest ${contract.yearsRemaining <= 2 ? 'text-amber-500' : 'text-zinc-650'}`}>
                                         {contract.yearsRemaining}Y CONDITIONAL
                                      </p>
                                  </div>
                                </div>

                               <div className="flex gap-2">
                                  <button 
                                    onClick={() => {
                                      if (true) {
                                        const newState = { ...state };
                                        const team = newState.teams[state.userTeamId];
                                        team.roster = team.roster.filter((rid: string) => rid !== id);
                                        delete team.contracts[id];
                                        newState.freeAgentPool.push(id);
                                        setState(newState);
                                      }
                                    }}
                                    className="h-8 w-8 flex items-center justify-center bg-zinc-900 border border-white/5 hover:bg-rose-500/80 hover:text-white rounded-xl transition-all cursor-pointer"
                                  >
                                    <X size={13} />
                                  </button>
                                   {contract.canExtend && (
                                     <button 
                                       onClick={() => handleNegotiationStart(id)}
                                       className="px-4 py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-400 transition-all shadow-lg active:scale-95 cursor-pointer"
                                     >
                                       Extend Offer
                                     </button>
                                   )}
                               </div>
                            </div>
                         </div>
                      );
                   })}
                </div>
             </div>
          </div>
       )}

       {/* STRATEGIC DILEMMA ACTION DECISION MODAL */}
       <AnimatePresence>
         {activeDilemma && (
           <div className="fixed inset-0 z-[12000] flex items-end md:items-center justify-center p-0 md:p-4">
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               onClick={() => setActiveDilemma(null)}
               className="absolute inset-0 bg-black/95 backdrop-blur-2xl" 
             />

             <motion.div 
               initial={isMobile ? { y: '100%' } : { scale: 0.94, y: 30, opacity: 0 }} 
               animate={isMobile ? { y: 0 } : { scale: 1, y: 0, opacity: 1 }} 
               exit={isMobile ? { y: '100%' } : { scale: 0.94, y: 30, opacity: 0 }}
               transition={{ type: "spring", stiffness: 350, damping: 28 }}
               className={isMobile
                 ? "fixed bottom-0 left-0 right-0 max-h-[85vh] rounded-t-[2.5rem] bg-zinc-950 border-t border-white/10 p-5 flex flex-col gap-5 overflow-y-auto z-20 shadow-3xl pb-safe text-zinc-350"
                 : "relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[2rem] p-6 md:p-10 space-y-6 z-20 shadow-3xl text-zinc-350"
               }
             >
               {/* Grabbable indicator for mobile bottom sheets */}
               {isMobile && (
                 <div className="w-12 h-1 bg-zinc-750 rounded-full mx-auto mb-1 shrink-0 opacity-80" />
               )}
               {/* Close button modal */}
               <button 
                 onClick={() => setActiveDilemma(null)}
                 className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-zinc-900 border border-white/5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
               >
                 <X size={16} />
               </button>

               <div className="space-y-4">
                 <div className="flex items-center gap-3">
                   <span className="text-3xl p-1 bg-zinc-90 border border-white/10 rounded-2xl w-14 h-14 flex items-center justify-center">{activeDilemma.icon}</span>
                   <div>
                     <span className="text-[7.5px] font-black font-mono tracking-widest text-[#a1a1aa] bg-zinc-900 border border-white/5 px-2 py-0.5 rounded uppercase leading-none">{activeDilemma.category} DESK</span>
                     <h3 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter mt-1 leading-none">{activeDilemma.title}</h3>
                   </div>
                 </div>

                 <p className="text-sm text-zinc-400 uppercase tracking-wide leading-relaxed p-4 bg-zinc-900/40 border border-white/5 rounded-2xl">
                   {activeDilemma.scenario}
                 </p>
               </div>

               {/* CHOOSE SYSTEM OPTIONS */}
               <div className="space-y-3">
                 <p className="text-[7.5px] font-black text-zinc-550 uppercase tracking-widest leading-none">STRATEGIC PATHWAYS</p>
                 <div className="grid grid-cols-1 gap-3">
                   {activeDilemma.options.map((opt, i) => (
                     <div 
                       key={i}
                       onClick={() => handleResolveDilemma(activeDilemma.id, i)}
                       className="border border-amber-500/25 hover:border-amber-500/60 bg-zinc-950/80 backdrop-blur-md w-full rounded-2xl p-4 cursor-pointer hover:bg-amber-500/[0.02] transition-all duration-200 text-left group flex justify-between items-center relative overflow-hidden shadow-[0_4px_15px_rgba(245,158,11,0.02)]"
                     >
                       <div className="absolute inset-y-0 left-0 w-1 bg-amber-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                       <div className="space-y-1">
                         <h4 className="text-xs md:text-sm font-black text-white uppercase italic group-hover:text-amber-400 transition-colors leading-none">{opt.label}</h4>
                         <p className="text-zinc-400 text-[9px] font-medium leading-relaxed uppercase tracking-wide">{opt.description}</p>
                       </div>
                       
                       {/* Floating consequence visual summary */}
                       <div className="flex gap-1.5 md:gap-2 text-[8.5px] md:text-[9.5px] font-mono shrink-0 italic text-right flex-col items-end pl-4 select-none">
                         {opt.consequences.chemistry && (
                           <span className={opt.consequences.chemistry > 0 ? "text-emerald-400" : "text-rose-450"}>
                             CHEM {opt.consequences.chemistry > 0 ? `+${opt.consequences.chemistry}%` : `${opt.consequences.chemistry}%`}
                           </span>
                         )}
                         {opt.consequences.moral && (
                           <span className={opt.consequences.moral > 0 ? "text-indigo-400" : "text-rose-450"}>
                             MORAL {opt.consequences.moral > 0 ? `+${opt.consequences.moral}%` : `${opt.consequences.moral}%`}
                           </span>
                         )}
                         {opt.consequences.fanSupport && (
                           <span className={opt.consequences.fanSupport > 0 ? "text-amber-500" : "text-rose-450"}>
                             FANS {opt.consequences.fanSupport > 0 ? `+${opt.consequences.fanSupport}%` : `${opt.consequences.fanSupport}%`}
                           </span>
                         )}
                         {opt.consequences.budget && (
                           <span className={opt.consequences.budget > 0 ? "text-emerald-400" : "text-rose-450"}>
                             CASH {opt.consequences.budget > 0 ? `+$${(opt.consequences.budget/1e6).toFixed(0)}M` : `-$${(Math.abs(opt.consequences.budget)/1e6).toFixed(0)}M`}
                           </span>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

               <div className="border-t border-white/5 pt-4 flex items-center justify-between text-[7px] font-black tracking-widest text-zinc-650 uppercase leading-none">
                 <span>Dilemma Desk Protocol active</span>
                 <span>All consequences are saved permanently</span>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
    </motion.div>
  );
});

export default OfficeTab;
