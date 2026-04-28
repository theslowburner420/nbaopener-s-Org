import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../context/GameContext';
import { ALL_CARDS } from '../data/cards';
import { 
  Card, 
  CareerMatch, 
  FranchiseState, 
  TeamStanding, 
  GameEvent, 
  GameLog,
  MarketPhase,
  PlayerContract,
  BoxScorePlayer
} from '../types';
import { 
  NBA_TEAMS, 
  getCPUTeamOVR, 
  generateSchedule, 
  generateInitialStandings 
} from '../data/nbaTeams';
import { 
  Building, 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  ShoppingCart, 
  Settings, 
  Zap, 
  Calendar, 
  Star, 
  Trophy, 
  ChevronRight, 
  Search, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  TrendingUp, 
  Activity,
  User,
  Briefcase,
  Target,
  Medal,
  Clock,
  DollarSign,
  PieChart,
  Newspaper,
  Heart,
  Flame,
  ArrowUpRight,
  History,
  Play,
  CreditCard,
  Check,
  LayoutGrid,
  Monitor,
  Settings as SettingsIcon,
  HelpCircle,
  LogOut,
  Maximize2,
  Coins,
  X,
  ChevronLeft,
  Plus,
  Play
} from 'lucide-react';
import { getTeamLogo } from '../data/nbaTeams';
import CardItem from '../components/CardItem';

type FranchiseTab = 'hub' | 'lineup' | 'market' | 'standings' | 'stats' | 'mgmt' | 'league' | 'settings';
type LineupTab = 'court' | 'bench' | 'depth' | 'chemistry';
type CareerMarketTab = 'waivers' | 'trades' | 'free_agency';

const normalizePosition = (pos: string): 'PG' | 'SG' | 'SF' | 'PF' | 'C' => {
  if (pos.includes('PG')) return 'PG';
  if (pos.includes('SG')) return 'SG';
  if (pos.includes('SF')) return 'SF';
  if (pos.includes('PF')) return 'PF';
  if (pos.includes('C')) return 'C';
  return 'SF';
};

const simulateBoxScore = (lineup: Record<string, string | null>, roster: string[] = [], isUser: boolean, playerEnergy: Record<string, number> = {}): BoxScorePlayer[] => {
  const boxScore: BoxScorePlayer[] = [];
  const starterIds = Object.values(lineup || {}).filter(Boolean) as string[];
  const benchIds = (roster || []).filter(id => !starterIds.includes(id)).slice(0, 5); // Take top 5 bench
  
  const allPlayers = [...starterIds, ...benchIds];
  
  allPlayers.forEach(id => {
    const card = ALL_CARDS.find(c => c.id === id);
    if (!card) return;

    const isStarter = starterIds.includes(id);
    const energy = playerEnergy[id] ?? 100;
    const energyFactor = energy / 100;
    
    const mins = isStarter 
      ? Math.round((28 + Math.floor(Math.random() * 10)) * energyFactor) 
      : Math.round((10 + Math.floor(Math.random() * 10)) * energyFactor);
    
    // Performance based on OVR + Random + Energy
    const stats = card.stats || { ovr: 75, points: 15, rebounds: 5, assists: 5 };
    const perfFactor = (stats.ovr / 80) * (0.8 + Math.random() * 0.4) * energyFactor;
    
    const pts = Math.round((stats.points || (stats.ovr * 0.2)) * (mins / 30) * perfFactor);
    const reb = Math.round((stats.rebounds || (stats.ovr * 0.1)) * (mins / 30) * perfFactor);
    const ast = Math.round((stats.assists || (stats.ovr * 0.1)) * (mins / 30) * perfFactor);
    
    const fgMade = Math.round(pts / 2.2);
    const fgAtt = Math.round(fgMade / (0.35 + Math.random() * 0.25));
    
    boxScore.push({
      cardId: id,
      name: card.name,
      position: card.position,
      nbaId: card.nbaId,
      minutes: mins,
      pts,
      reb,
      ast,
      stl: Math.floor(Math.random() * 3),
      blk: Math.floor(Math.random() * 2),
      to: Math.floor(Math.random() * 4),
      fg: `${fgMade}/${fgAtt}`,
      threePt: `${Math.floor(fgMade * 0.3)}/${Math.floor(fgAtt * 0.35)}`,
      ft: `${Math.floor(pts * 0.15)}/${Math.floor(pts * 0.2)}`,
      plusMinus: Math.floor(Math.random() * 20 - 10)
    });
  });

  return boxScore;
};

const FRANCHISE_CARDS = ALL_CARDS.filter(c => 
  ['bench','starter','allstar','franchise'].includes(c.rarity) && !c.isHistorical
);

// --- New Sub-components for Simulation and Reset ---

const getPlayerSalary = (card: Card) => {
  const base = card.rarity === 'bench' ? 800000 : 
               card.rarity === 'starter' ? 4500000 : 
               card.rarity === 'allstar' ? 12000000 : 
               card.rarity === 'franchise' ? 35000000 : 800000;
  const ovrBonus = (card.stats.ovr - 70) * 250000;
  return base + Math.max(0, ovrBonus);
};

const SALARY_CAP = 140000000; // $140M

const ResetCareerModal: React.FC<{ show: boolean; onConfirm: () => void; onCancel: () => void }> = ({ show, onConfirm, onCancel }) => {
  if (!show) return null;
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 text-center space-y-8"
      >
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto text-red-500">
          <AlertCircle size={40} />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Reset Career?</h2>
          <p className="text-zinc-500 text-sm font-medium">
            This will permanently delete your franchise progress, roster, and league standings. 
            <span className="text-white font-bold block mt-2 underline">Your global collection and coins will NOT be affected.</span>
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button 
            onClick={onConfirm}
            className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-500 transition-all shadow-[0_10px_30px_rgba(220,38,38,0.3)]"
          >
            CONFIRM RESET
          </button>
          <button 
            onClick={onCancel}
            className="w-full bg-zinc-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-700 transition-all border border-zinc-700"
          >
            CANCEL
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const MatchSimulationOverlay: React.FC<{ 
  show: boolean; 
  userTeam: any; 
  oppTeam: any; 
  userLineup: Card[];
  oppLineup: Card[];
  userOVR: number;
  oppOVR: number;
  onFinish: (result: any) => void;
}> = ({ show, userTeam, oppTeam, userLineup, oppLineup, userOVR, oppOVR, onFinish }) => {
  const [phase, setPhase] = useState<'pregame' | 'live' | 'result'>('pregame');
  const [countdown, setCountdown] = useState(3);
  const [currentQuarter, setCurrentQuarter] = useState(1);
  const [timerInQuarter, setTimerInQuarter] = useState(720);
  const [scores, setScores] = useState({ user: 0, opp: 0 });
  const [feed, setFeed] = useState<{text: string, type?: 'highlight' | 'score' | 'quarter', emoji: string}[]>([]);
  const [isClutch, setIsClutch] = useState(false);
  const [quarterEnding, setQuarterEnding] = useState(false);
  const [showResultTab, setShowResultTab] = useState<'summary' | 'boxscore'>('summary');

  const TICK_MS = 1000;
  const winProb = (userOVR / (userOVR + oppOVR)) * 100;

  useEffect(() => {
    if (!show) {
      setPhase('pregame');
      setCountdown(3);
      setCurrentQuarter(1);
      setTimerInQuarter(720);
      setScores({ user: 0, opp: 0 });
      setFeed([]);
      setIsClutch(false);
      setShowResultTab('summary');
      return;
    }

    const cdInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(cdInterval);
          setTimeout(() => setPhase('live'), 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(cdInterval);
  }, [show]);

  useEffect(() => {
    if (phase !== 'live' || !show || quarterEnding) return;

    const interval = setInterval(() => {
      setTimerInQuarter(prev => {
        const next = Math.max(0, prev - (45 + Math.floor(Math.random() * 30)));
        
        if (next === 0) {
          setQuarterEnding(true);
          setFeed(prevFeed => [
            { text: `QUARTER ${currentQuarter} OVER`, emoji: '🔔', type: 'quarter' },
            ...prevFeed
          ]);
          
          setTimeout(() => {
            if (currentQuarter < 4) {
              setCurrentQuarter(prevQ => prevQ + 1);
              setTimerInQuarter(720);
              setQuarterEnding(false);
            } else {
              setPhase('result');
            }
          }, 1500);
          
          return 0;
        }

        generatePlay();
        return next;
      });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [phase, show, currentQuarter, quarterEnding, isClutch, scores]);

  const generatePlay = () => {
    const timeRemaining = timerInQuarter;
    const diff = Math.abs(scores.user - scores.opp);
    const isClutchTime = currentQuarter === 4 && diff <= 5 && timeRemaining < 120;
    if (isClutchTime !== isClutch) setIsClutch(isClutchTime);

    const userAttacking = Math.random() < (userOVR / (userOVR + oppOVR));
    const attackingTeam = userAttacking ? userTeam : oppTeam;
    const lineup = userAttacking ? userLineup : oppLineup;
    const player = lineup[Math.floor(Math.random() * lineup.length)];

    let playText = "";
    let scoreChange = 0;
    let emoji = "🏀";
    let type: any = undefined;

    const roll = Math.random();
    if (roll < 0.2) {
      playText = `${player.name} misses the shot.`;
      emoji = "⭕";
    } else if (roll < 0.35) {
      playText = `${player.name} with a huge block!`;
      emoji = "🚫";
      type = 'highlight';
    } else {
      scoreChange = Math.random() > 0.3 ? 2 : 3;
      playText = `${player.name} score for ${attackingTeam.id}!`;
      emoji = scoreChange === 3 ? "🎯" : "⛹️";
      type = 'score';
    }

    if (scoreChange > 0) {
      if (userAttacking) setScores(prev => ({ ...prev, user: prev.user + scoreChange }));
      else setScores(prev => ({ ...prev, opp: prev.opp + scoreChange }));
    }
    
    setFeed(prev => [{ text: playText, type, emoji }, ...prev].slice(0, 50));
  };

  if (!show) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-[10000] bg-zinc-950 flex flex-col font-sans"
    >
      <AnimatePresence mode="wait">
        {phase === 'pregame' && (
          <motion.div 
            key="pregame"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-8 gap-12 text-center"
          >
            <div className="flex items-center justify-between w-full max-w-sm">
               <div className="space-y-4">
                  <div className="w-20 h-20 bg-zinc-900 rounded-3xl p-4 border border-zinc-800 mx-auto">
                    <img src={getTeamLogo(userTeam.id)} className="w-full h-full object-contain" />
                  </div>
                  <div className="text-xl font-black text-white italic uppercase">{userTeam.id}</div>
               </div>
               <div className="text-2xl font-black text-zinc-800 italic">VS</div>
               <div className="space-y-4">
                  <div className="w-20 h-20 bg-zinc-900 rounded-3xl p-4 border border-zinc-800 mx-auto">
                    <img src={getTeamLogo(oppTeam.id)} className="w-full h-full object-contain" />
                  </div>
                  <div className="text-xl font-black text-zinc-500 italic uppercase">{oppTeam.id}</div>
               </div>
            </div>

            <div className="w-full max-w-xs h-1 bg-zinc-900 rounded-full overflow-hidden">
               <motion.div initial={{ width: "50%" }} animate={{ width: `${winProb}%` }} className="h-full bg-emerald-500" />
            </div>

            <AnimatePresence>
               {countdown > 0 && (
                  <motion.div 
                    key={countdown}
                    initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                    className="text-8xl font-black italic text-white"
                  >
                    {countdown}
                  </motion.div>
               )}
            </AnimatePresence>
          </motion.div>
        )}

        {phase === 'live' && (
          <motion.div 
            key="live"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Display Header */}
            <div className={`pt-12 pb-8 px-8 space-y-4 transition-colors duration-700 ${isClutch ? 'bg-red-950/20' : 'bg-gradient-to-b from-zinc-900/50 to-transparent'}`}>
               <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                  <span className={isClutch ? 'text-red-500 animate-pulse' : ''}>{isClutch ? '🔥 Clutch Time' : `Quarter ${currentQuarter}`}</span>
                  <span>|</span>
                  <span className="tabular-nums">{Math.floor(timerInQuarter/60)}:{Math.round(timerInQuarter%60).toString().padStart(2, '0')}</span>
               </div>
               
               <div className="flex items-center justify-between max-w-xs mx-auto">
                  <div className="flex flex-col items-center gap-2">
                     <span className="text-8xl font-black italic text-white tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">{scores.user}</span>
                     <span className="text-xs font-black text-zinc-600 uppercase">{userTeam.id}</span>
                  </div>
                  <div className="text-4xl font-black text-zinc-900 italic self-center mt-[-10px]">VS</div>
                  <div className="flex flex-col items-center gap-2">
                     <span className="text-8xl font-black italic text-zinc-500 tabular-nums">{scores.opp}</span>
                     <span className="text-xs font-black text-zinc-600 uppercase">{oppTeam.id}</span>
                  </div>
               </div>
            </div>

            {/* Play Feed */}
            <div className="flex-1 bg-zinc-950 px-6 pt-6 overflow-hidden flex flex-col">
               <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar flex flex-col-reverse">
                  <AnimatePresence mode="popLayout">
                    {feed.map((play, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 items-center text-sm font-bold ${
                           play.type === 'quarter' ? 'justify-center py-4 text-emerald-500 border-y border-zinc-900' :
                           play.type === 'score' ? 'text-white' : 'text-zinc-500'
                        }`}
                      >
                         <span className="text-lg opacity-80">{play.emoji}</span>
                         <span className={play.type === 'highlight' ? 'text-amber-500 font-black italic' : ''}>
                           {play.text}
                         </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div className="h-8 bg-gradient-to-t from-zinc-950 to-transparent sticky bottom-0" />
               </div>
            </div>
          </motion.div>
        )}

        {phase === 'result' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col bg-zinc-950"
          >
             <div className="pt-16 pb-8 text-center space-y-2">
                <motion.div 
                   initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                   className={`text-9xl font-black italic tracking-tighter ${scores.user > scores.opp ? 'text-emerald-500' : 'text-red-500'}`}
                >
                   {scores.user > scores.opp ? 'W' : 'L'}
                </motion.div>
                <div className="text-2xl font-black text-white italic tabular-nums">
                   {scores.user} - {scores.opp}
                </div>
             </div>

             <div className="flex-1 flex flex-col">
                <div className="px-6 flex gap-1 border-b border-zinc-900">
                   {['summary', 'boxscore'].map((tab) => (
                      <button 
                         key={tab}
                         onClick={() => setShowResultTab(tab as any)}
                         className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest relative transition-colors ${showResultTab === tab ? 'text-white' : 'text-zinc-600'}`}
                      >
                         {tab}
                         {showResultTab === tab && <motion.div layoutId="resTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white shadow-[0_0_10px_white]" />}
                      </button>
                   ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                   {showResultTab === 'summary' && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                         <div className="bg-zinc-900 p-6 rounded-[2rem] space-y-4">
                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Post-Game Thoughts</h4>
                            <p className="text-zinc-300 font-bold italic leading-relaxed text-sm">
                               {scores.user > scores.opp ? 
                               "Total team effort in the clutch. The rotations were crisp and the perimeter defense held firm when it mattered most." : 
                               "Tough night at the office. We couldn't close out the defensive boards and left too many easy points on the table."}
                            </p>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="bg-zinc-900 p-5 rounded-3xl text-center space-y-1">
                               <p className="text-[8px] font-black text-zinc-500 uppercase">XP Gained</p>
                               <p className="text-xl font-black text-emerald-500">+{scores.user > scores.opp ? 120 : 45}</p>
                            </div>
                            <div className="bg-zinc-900 p-5 rounded-3xl text-center space-y-1">
                               <p className="text-[8px] font-black text-zinc-500 uppercase">Credits</p>
                               <p className="text-xl font-black text-amber-500">+${scores.user > scores.opp ? '2.5' : '1.0'}K</p>
                            </div>
                         </div>
                      </div>
                   )}
                   {showResultTab === 'boxscore' && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 h-full overflow-x-auto">
                         <table className="w-full text-left">
                            <thead className="border-b border-zinc-900">
                               <tr className="text-[8px] font-black text-zinc-600 uppercase">
                                  <th className="py-2 pr-4">Player</th>
                                  <th className="py-2 px-2">PTS</th>
                                  <th className="py-2 px-2">REB</th>
                                  <th className="py-2 px-2">AST</th>
                               </tr>
                            </thead>
                            <tbody>
                               {userLineup.map((p, i) => (
                                  <tr key={i} className="border-b border-zinc-900/50">
                                     <td className="py-3 pr-4">
                                        <div className="text-xs font-black text-white italic uppercase">{p.name.split(' ').pop()}</div>
                                        <div className="text-[8px] font-bold text-zinc-600 uppercase">{p.position}</div>
                                     </td>
                                     <td className="py-3 px-2 text-sm font-black text-zinc-400">{(scores.user / 6).toFixed(0)}</td>
                                     <td className="py-3 px-2 text-sm font-bold text-zinc-600">{(Math.random() * 8).toFixed(0)}</td>
                                     <td className="py-3 px-2 text-sm font-bold text-zinc-600">{(Math.random() * 5).toFixed(0)}</td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   )}
                </div>
                
                <div className="p-6">
                   <button 
                      onClick={() => onFinish({ s1: scores.user, s2: scores.opp })}
                      className="w-full bg-white text-black py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-transform"
                   >
                      Back to Hub
                   </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ResultScreen: React.FC<{ recap: any; onClose: () => void }> = ({ recap, onClose }) => {
  if (!recap) return null;
  
  // Sort players by points for box score
  const sortedBox = [...(recap.boxScore || [])].sort((a, b) => b.pts - a.pts);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
        
        {/* Banner Area */}
        <div className="p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-8 bg-zinc-950/40 border-b border-zinc-800">
           <div className="text-center sm:text-left space-y-4">
              <h2 className={`text-6xl sm:text-8xl font-black italic uppercase tracking-tighter ${recap.isWin ? 'text-emerald-500' : 'text-red-500'}`}>
                 {recap.isWin ? 'VICTORY' : 'DEFEAT'}
              </h2>
              <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.4em]">{recap.opponentAbbr} @ {recap.userAbbr || 'USER'}</p>
           </div>
           
           <div className="flex items-center gap-8 sm:gap-12">
               <div className="text-center">
                  <img src={getTeamLogo(recap.userTeam)} className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto mb-2" />
                  <div className="text-4xl sm:text-6xl font-black italic text-white">{recap.userScore}</div>
               </div>
               <div className="text-2xl font-black text-zinc-800 italic">VS</div>
               <div className="text-center">
                  <img src={getTeamLogo(recap.oppTeam)} className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto mb-2" />
                  <div className="text-4xl sm:text-6xl font-black italic text-white">{recap.oppScore}</div>
               </div>
           </div>
        </div>

        {/* Box Score Area */}
        <div className="p-6 sm:p-10 space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-black italic uppercase tracking-tight text-white flex items-center gap-3">
                 <Medal className="text-emerald-500" />
                 Game Box Score
              </h3>
              <div className="flex items-center gap-4">
                 <div className="bg-zinc-800/50 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                    Attendance: {Math.floor(18000 + Math.random() * 2000)}
                 </div>
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                 <thead>
                    <tr className="border-b border-zinc-800">
                       <th className="pb-4 text-[10px] font-black uppercase text-zinc-600 tracking-widest pl-4">PLAYER</th>
                       <th className="pb-4 text-[10px] font-black uppercase text-zinc-600 tracking-widest text-center">MIN</th>
                       <th className="pb-4 text-[10px] font-black uppercase text-zinc-600 tracking-widest text-center">PTS</th>
                       <th className="pb-4 text-[10px] font-black uppercase text-zinc-600 tracking-widest text-center">REB</th>
                       <th className="pb-4 text-[10px] font-black uppercase text-zinc-600 tracking-widest text-center">AST</th>
                       <th className="pb-4 text-[10px] font-black uppercase text-zinc-600 tracking-widest text-center">STL</th>
                       <th className="pb-4 text-[10px] font-black uppercase text-zinc-600 tracking-widest text-center">BLK</th>
                       <th className="pb-4 text-[10px] font-black uppercase text-zinc-600 tracking-widest text-center pr-4">+/-</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-800/50">
                    {sortedBox.map((p, i) => (
                      <tr key={i} className="group hover:bg-zinc-800/30 transition-colors">
                        <td className="py-4 pl-4">
                           <div className="flex items-center gap-3">
                              {i === 0 && <span className="text-emerald-500">👑</span>}
                              <span className="font-extrabold italic text-zinc-300 group-hover:text-white">{p.name}</span>
                              <span className="text-[10px] text-zinc-600 font-bold uppercase">{p.position}</span>
                           </div>
                        </td>
                        <td className="text-center font-bold text-zinc-500 tabular-nums">{p.minutes}</td>
                        <td className={`text-center font-black italic tabular-nums ${p.pts >= 20 ? 'text-emerald-500' : 'text-white'}`}>{p.pts}</td>
                        <td className="text-center font-bold text-zinc-400 tabular-nums">{p.reb}</td>
                        <td className="text-center font-bold text-zinc-400 tabular-nums">{p.ast}</td>
                        <td className="text-center font-bold text-zinc-500 tabular-nums">{p.stl}</td>
                        <td className="text-center font-bold text-zinc-500 tabular-nums">{p.blk}</td>
                        <td className={`text-center font-black italic tabular-nums pr-4 ${p.plusMinus > 0 ? 'text-emerald-500' : p.plusMinus < 0 ? 'text-red-500' : 'text-zinc-600'}`}>
                           {p.plusMinus > 0 ? `+${p.plusMinus}` : p.plusMinus}
                        </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           {/* Rewards Area */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-zinc-800">
              <div className="bg-zinc-800/30 rounded-2xl p-6 border border-zinc-800 flex items-center gap-6">
                 <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                    <Zap size={24} />
                 </div>
                 <div>
                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">XP Gained</div>
                    <div className="text-3xl font-black text-emerald-500">+{recap.xp}</div>
                 </div>
              </div>
              <div className="bg-zinc-800/30 rounded-2xl p-6 border border-zinc-800 flex items-center gap-6">
                 <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                    <DollarSign size={24} />
                 </div>
                 <div>
                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Profit</div>
                    <div className="text-3xl font-black text-amber-500">+${(recap.income / 1000).toFixed(0)}K</div>
                 </div>
              </div>
              <div className="bg-zinc-800/30 rounded-2xl p-6 border border-zinc-800 flex items-center gap-6">
                 <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500">
                    <TrendingUp size={24} />
                 </div>
                 <div>
                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Rating</div>
                    <div className="text-3xl font-black text-purple-500">+{Math.floor(Math.random() * 5) + 2}</div>
                 </div>
              </div>
           </div>
        </div>

        <div className="p-8 sm:p-10 bg-zinc-950/20 border-t border-zinc-800 text-center space-y-6">
           <p className="text-zinc-500 italic text-sm px-12 leading-relaxed">
              "{recap.narrative || 'A hard-fought battle from both sides today at the arena.'}"
           </p>
           <button 
             onClick={onClose}
             className="bg-white text-black px-16 py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm hover:scale-105 transition-all shadow-2xl shadow-white/5 active:scale-95"
           >
             CONTINUE TO HUB
           </button>
        </div>
      </div>
    </motion.div>
  );
};

const getMarketPhase = (gamesPlayed: number): MarketPhase => {
  if (gamesPlayed < 30) return 'regular_season';
  if (gamesPlayed >= 30 && gamesPlayed <= 32) return 'trade_deadline';
  if (gamesPlayed < 82) return 'regular_season';
  return 'free_agency';
};

const generateInitialContracts = (roster: Card[]): PlayerContract[] => {
  return roster.map(card => {
    let yearsLeft = 1;
    let type: PlayerContract['type'] = 'minimum';
    
    if (card.rarity === 'franchise') {
      yearsLeft = 4 + Math.floor(Math.random() * 2);
      type = 'max';
    } else if (card.rarity === 'allstar') {
      yearsLeft = 3 + Math.floor(Math.random() * 2);
      type = 'max';
    } else if (card.rarity === 'starter') {
      yearsLeft = 2 + Math.floor(Math.random() * 2);
      type = 'veteran';
    } else {
      yearsLeft = 1 + Math.floor(Math.random() * 2);
      type = 'minimum';
    }

    return {
      cardId: card.id,
      yearsLeft,
      salary: card.stats.ovr > 85 ? (card.stats.ovr - 60) * 0.8 + 15 : (card.stats.ovr - 60) * 0.4 + 2,
      type,
      canExtend: yearsLeft <= 1,
      canTrade: true
    };
  });
};

const buildTeamRoster = (teamAbbr: string) => {
  const cards = FRANCHISE_CARDS.filter(c => c.teamAbbr === teamAbbr);
  const lineup: Record<string, string | null> = { PG: null, SG: null, SF: null, PF: null, C: null };
  const roster: string[] = cards.map(c => c.id);

  (['PG', 'SG', 'SF', 'PF', 'C'] as const).forEach(pos => {
    const posCards = cards.filter(c => normalizePosition(c.position) === pos);
    if (posCards.length > 0) {
      const best = posCards.reduce((prev, curr) => (curr.stats.ovr > prev.stats.ovr ? curr : prev));
      lineup[pos] = best.id;
    }
  });

  // Fill empty slots with best available bench
  Object.keys(lineup).forEach(pos => {
    if (!lineup[pos]) {
      const available = cards.filter(c => !Object.values(lineup).includes(c.id));
      if (available.length > 0) {
        const best = available.reduce((prev, curr) => (curr.stats.ovr > prev.stats.ovr ? curr : prev));
        lineup[pos] = best.id;
      }
    }
  });

  return { lineup, roster };
};

const buildAllTeamRosters = (): Record<string, string[]> => {
  return NBA_TEAMS.reduce((acc, team) => {
    if (team.dataAbbr) {
      acc[team.id] = FRANCHISE_CARDS
        .filter(c => c.teamAbbr === team.dataAbbr)
        .map(c => c.id);
    } else {
      acc[team.id] = [];
    }
    return acc;
  }, {} as Record<string, string[]>);
};

const TEAM_NEWS = [
  "New practice facility nearing completion in {city}.",
  "Speculation grows over {player}'s contract extension.",
  "Fan support reaches new heights after recent performance.",
  "Injury concerns for several starters ahead of next matchup.",
  "Trade rumors involving {team} starting to heat up as deadline approaches.",
  "Local media praises {player}'s leadership in the locker room.",
  "League executives monitoring {team}'s aggressive market moves.",
  "Ticket sales surging as {team} climbs the standings.",
];
const PositionSlot: React.FC<{ pos: string; cardId: string | null | undefined; energy: number; onSelect: () => void }> = ({ pos, cardId, energy, onSelect }) => {
  const card = cardId ? ALL_CARDS.find(c => c.id === cardId) : null;
  
  return (
    <div onClick={onSelect} className="relative group cursor-pointer h-full">
       <div className={`h-full w-full min-h-[160px] sm:min-h-[200px] rounded-[2rem] sm:rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden flex flex-col items-center justify-center relative ${
          cardId ? 'bg-zinc-950 border-white/10 group-hover:border-white group-hover:shadow-[0_20px_50px_rgba(255,255,255,0.1)]' : 'bg-black/40 border-dashed border-zinc-800 hover:border-zinc-700'
       }`}>
          {card ? (
             <>
                <div className="absolute inset-x-0 bottom-0 top-[20%] bg-gradient-to-t from-white/[0.03] to-transparent pointer-events-none" />
                <motion.img 
                   initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                   src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} 
                   className="w-[120%] h-[120%] object-contain object-bottom mb-4 relative z-10 transition-transform group-hover:scale-110 duration-700"
                />
                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                   <div className={`px-4 py-2 rounded-2xl text-[10px] font-black italic border shadow-2xl ${
                      card.rarity === 'franchise' ? 'bg-purple-600 border-purple-400 text-white' :
                      card.rarity === 'allstar' ? 'bg-amber-500 border-amber-300 text-black' :
                      card.rarity === 'starter' ? 'bg-blue-600 border-blue-400 text-white' :
                      'bg-zinc-800 border-zinc-700 text-zinc-400'
                   }`}>
                      {card.stats.ovr} OVR
                   </div>
                </div>
                <div className="absolute bottom-6 inset-x-4 z-20 space-y-2">
                   <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black italic text-white uppercase truncate">{card.name.split(' ').pop()}</span>
                         <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">{pos}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                         <div className="w-12 h-1 bg-zinc-900 rounded-full overflow-hidden">
                            <div className={`h-full ${energy < 50 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${energy}%` }} />
                         </div>
                         <span className="text-[6px] font-black text-zinc-600">FITNESS</span>
                      </div>
                   </div>
                </div>
             </>
          ) : (
             <div className="flex flex-col items-center gap-4 group-hover:scale-110 transition-transform duration-500">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-700 border border-zinc-800">
                   <Plus size={24} />
                </div>
                <div className="text-center">
                   <span className="text-xs font-black italic text-zinc-600 uppercase tracking-tighter">{pos}</span>
                   <p className="text-[7px] font-black text-zinc-800 uppercase tracking-widest">Assign Slot</p>
                </div>
             </div>
          )}
       </div>
    </div>
  );
};

const CareerView: React.FC = () => {
  const { franchise, startFranchise, updateFranchise, updateGameStateAsync, addCoins, collection, setCurrentView } = useGame();
  
  // 1. Calculations (Moved up to avoid hosting issues)
  const nextGame = useMemo(() => {
    return franchise?.schedule?.find(m => !m.played);
  }, [franchise?.schedule]);

  const teamData = useMemo(() => {
    return franchise ? NBA_TEAMS.find(t => t.id === franchise.team) : null;
  }, [franchise?.team]);

  const nextOpponent = useMemo(() => {
    if (!nextGame) return NBA_TEAMS[0];
    return NBA_TEAMS.find(t => t.id === nextGame.opponentAbbr) || NBA_TEAMS[0];
  }, [nextGame]);

  const opponentData = useMemo(() => {
    if (!nextOpponent) return null;
    return NBA_TEAMS.find(t => t.id === nextOpponent.id);
  }, [nextOpponent]);

  const activeStarters = useMemo(() => {
    if (!franchise?.lineup) return [] as Card[];
    const starterIds = Object.values(franchise.lineup).filter(Boolean) as string[];
    return starterIds.map(id => ALL_CARDS.find(c => c.id === id)).filter(Boolean) as Card[];
  }, [franchise?.lineup]);

  const teamOVR = useMemo(() => {
    if (activeStarters.length === 0) return 60;
    
    const sOVR = activeStarters.reduce((acc, c) => acc + c.stats.ovr, 0) / activeStarters.length;
    
    // Bench OVR (from roster excluding starters)
    const starterIds = activeStarters.map(c => c.id);
    const benchIds = (franchise?.roster || []).filter(id => !starterIds.includes(id));
    const bench = benchIds.map(id => ALL_CARDS.find(c => c.id === id)).filter(Boolean) as Card[];
    const bOVR = bench.length > 0 
      ? bench.reduce((acc, c) => acc + c.stats.ovr, 0) / bench.length 
      : sOVR - 10;

    const base = sOVR * 0.75 + bOVR * 0.25;
    
    // Synergy Bonuses
    let synergyBonus = 0;
    
    // 1. Same Team Trio
    const teamCounts: Record<string, number> = {};
    activeStarters.forEach(c => {
       teamCounts[c.teamAbbr] = (teamCounts[c.teamAbbr] || 0) + 1;
    });
    const hasTrio = Object.values(teamCounts).some(count => count >= 3);
    if (hasTrio) synergyBonus += 3;

    // 2. Inside-Out (PG Ast > 85, C Blk > 80)
    const pg = activeStarters.find(c => normalizePosition(c.position) === 'PG');
    const center = activeStarters.find(c => normalizePosition(c.position) === 'C');
    if (pg && center && pg.stats.assists >= 85 && center.stats.rebounds >= 80) {
       synergyBonus += 5;
    }

    // 3. Star Power
    const hasStar = activeStarters.some(c => c.rarity === 'franchise');
    if (hasStar) synergyBonus += 2;
    
    // Upgrades
    const coachingBonus = ((franchise?.upgrades?.coaching || 1) - 1) * 0.8;
    const trainingBonus = ((franchise?.upgrades?.training || 1) - 1) * 0.5;
    
    return Math.round(base + coachingBonus + trainingBonus + synergyBonus);
  }, [activeStarters, franchise?.roster, franchise?.upgrades]);

  const teamPayroll = useMemo(() => {
    if (!franchise?.roster) return 0;
    const cards = franchise.roster.map(id => ALL_CARDS.find(c => c.id === id)).filter(Boolean) as Card[];
    return cards.reduce((acc, c) => acc + getPlayerSalary(c), 0);
  }, [franchise?.roster]);

  const streak = useMemo(() => {
    const played = (franchise?.schedule || []).filter(m => m.played);
    if (played.length === 0) return '-';
    let count = 0;
    const lastResult = played[played.length - 1].result;
    for (let i = played.length - 1; i >= 0; i--) {
       if (played[i].result === lastResult) count++;
       else break;
    }
    return `${count}${lastResult}`;
  }, [franchise?.schedule]);

  const avgEnergy = useMemo(() => {
    const values = Object.values(franchise?.playerEnergy || {}) as number[];
    if (values.length === 0) return 100;
    return Math.round(values.reduce((a, b) => a + b, 0) / (values.length || 1));
  }, [franchise?.playerEnergy, franchise?.roster?.length]);

  const startersList = useMemo(() => {
    const ids = Object.values(franchise?.lineup || {}).filter(Boolean) as string[];
    return ids.map(id => ALL_CARDS.find(c => c.id === id)).filter(Boolean) as Card[];
  }, [franchise?.lineup]);

  const primaryColor = teamData?.primaryColor || '#10b981';
  const secondaryColor = teamData?.secondaryColor || '#ffffff';

  const [activeTab, setActiveTab] = useState<FranchiseTab>('hub');
  const [lineupSubTab, setLineupSubTab] = useState<LineupTab>('court');
  const [marketSubTab, setMarketSubTab] = useState<CareerMarketTab>('waivers');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showSimOverlay, setShowSimOverlay] = useState(false);
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [tradeTargetTeam, setTradeTargetTeam] = useState<string | null>(null);
  const [tradeTargetPlayer, setTradeTargetPlayer] = useState<string | null>(null);
  const [tradeUserPlayer, setTradeUserPlayer] = useState<string | null>(null);
  const [tradeMessage, setTradeMessage] = useState<string | null>(null);
  const [showRecap, setShowRecap] = useState<any>(null);
  const [showPicker, setShowPicker] = useState<{ pos: string } | null>(null);
  const [marketSearch, setMarketSearch] = useState('');
  const [news, setNews] = useState<string[]>([]);

  const handleTradeProposal = () => {
    if (!franchise || !tradeUserPlayer || !tradeTargetPlayer || !tradeTargetTeam) return;
    
    const player1 = ALL_CARDS.find(c => c.id === tradeUserPlayer);
    const player2 = ALL_CARDS.find(c => c.id === tradeTargetPlayer);
    if (!player1 || !player2) return;
    
    // value logic
    const v1 = Math.pow(player1.stats.ovr, 2);
    const v2 = Math.pow(player2.stats.ovr, 2);
    const success = v1 >= v2 * 1.15; // CPU greediness factor
    
    if (success) {
      const rosters = { ...(franchise.leagueRosters || {}) };
      const userRoster = [...franchise.roster].filter(id => id !== tradeUserPlayer);
      const targetRoster = [...(rosters[tradeTargetTeam] || [])].filter(id => id !== tradeTargetPlayer);
      
      userRoster.push(tradeTargetPlayer);
      targetRoster.push(tradeUserPlayer);
      rosters[tradeTargetTeam] = targetRoster;
      
      const contracts = [...(franchise.contracts || [])].filter(c => c.cardId !== tradeUserPlayer);
      contracts.push({
        cardId: tradeTargetPlayer,
        yearsLeft: 1 + Math.floor(Math.random() * 2),
        salary: (player2.stats.ovr - 65) * 0.4 + 5,
        type: player2.stats.ovr > 85 ? 'max' : 'veteran',
        canExtend: true,
        canTrade: true
      });

      const newLineup = { ...franchise.lineup };
      (Object.keys(newLineup) as (keyof typeof newLineup)[]).forEach(key => {
        if (newLineup[key] === tradeUserPlayer) {
          newLineup[key] = tradeTargetPlayer;
        }
      });

      updateFranchise({ 
        roster: userRoster, 
        leagueRosters: rosters,
        contracts,
        lineup: newLineup as any,
        chemistry: Math.max(0, (franchise.chemistry || 60) - 10)
      });
      
      setTradeMessage(`TRADE APPROVED! Obtained ${player2.name}`);
      setNews(prev => [`TRADE: ${teamData?.name} acquired ${player2.name} from ${tradeTargetTeam}.`, ...prev].slice(0, 5));
      setTradeUserPlayer(null);
      setTradeTargetPlayer(null);
    } else {
      setTradeMessage(`OFFER REJECTED: The ${tradeTargetTeam} front office needs more value.`);
    }
    setTimeout(() => setTradeMessage(null), 3000);
  };

  const handleExtendContract = (cardId: string) => {
    if (!franchise) return;
    const contractIdx = franchise.contracts.findIndex(c => c.cardId === cardId);
    if (contractIdx === -1) return;
    
    const existing = franchise.contracts[contractIdx];
    if (!existing.canExtend) return;

    const newContracts = [...franchise.contracts];
    newContracts[contractIdx] = {
      ...existing,
      yearsLeft: existing.yearsLeft + 3,
      salary: existing.salary * 1.1, // 10% raise
      canExtend: false
    };

    updateFranchise({ contracts: newContracts });
    setNews(prev => [`CONTRACT: ${ALL_CARDS.find(c => c.id === cardId)?.name} signed a 3-year extension.`, ...prev].slice(0, 5));
  };

  const handleReleasePlayer = (cardId: string) => {
    if (!franchise) return;
    const contract = franchise.contracts.find(c => c.cardId === cardId);
    if (!contract) return;

    // Release penalty: 30% of remaining salary as dead cap/instant cost
    const penalty = contract.salary * 0.3 * 1000000;
    
    const newRoster = franchise.roster.filter(id => id !== cardId);
    const newContracts = franchise.contracts.filter(c => c.cardId !== cardId);
    const newLineup = { ...franchise.lineup };
    Object.keys(newLineup).forEach(pos => {
      if (newLineup[pos] === cardId) newLineup[pos] = null;
    });

    updateFranchise({
      roster: newRoster,
      contracts: newContracts,
      lineup: newLineup,
      budget: franchise.budget - penalty
    });
    
    setNews(prev => [`WAIVED: ${ALL_CARDS.find(c => c.id === cardId)?.name} has been released.`, ...prev].slice(0, 5));
  };

  const handleBack = () => {
    setCurrentView('home');
  };

  const handleRetire = async () => {
    // Reset the franchise state as requested
    setIsSimulating(true);
    const resetFranchise: any = {
      isActive: false,
      team: null,
      level: 1,
      xp: 0,
      budget: 5000000,
      season: 1,
      wins: 0,
      losses: 0,
      schedule: [],
      upgrades: { coaching: 1, scouting: 1, training: 1, facilities: 1 },
      roster: [],
      leagueRosters: {},
      contracts: [],
      currentDate: '2025-10-22',
      marketPhase: 'regular_season',
      playerSeasonStats: [],
      lineup: { PG: null, SG: null, SF: null, PF: null, C: null },
      currentMatchIndex: 0,
      gameLogs: [],
      activeEvents: [],
      milestones: [],
      salaryCap: 140588000,
      payroll: 0,
      conferenceStandings: [],
      waiverPool: [],
      gamesSinceWaiverRefresh: 0
    };
    await updateGameStateAsync({ franchise: resetFranchise });
    setIsSimulating(false);
    setActiveTab('hub');
    setSelectedTeam(null);
  };

  // 1. Initialization
  useEffect(() => {
    if (franchise?.isActive && (!franchise.leagueRosters || Object.keys(franchise.leagueRosters).length === 0)) {
       // Initialize all league rosters with real player IDs
       const rosters: Record<string, string[]> = {};
       NBA_TEAMS.forEach(team => {
        rosters[team.id] = ALL_CARDS
          .filter(c => c.teamAbbr === team.dataAbbr && !c.isHistorical)
          .map(c => c.id);
       });
       updateFranchise({ leagueRosters: rosters });
    }
  }, [franchise?.isActive, updateFranchise]);

  useEffect(() => {
    if (franchise?.isActive && (!franchise.conferenceStandings || (franchise.conferenceStandings as any).length === 0)) {
      const standings = NBA_TEAMS.map(team => ({
        teamId: team.id,
        teamName: team.name,
        teamAbbr: team.id,
        conference: team.conference as 'East' | 'West',
        division: team.division,
        wins: 0,
        losses: 0,
        pct: 0,
        gb: 0,
        streak: '-',
        isUser: team.id === franchise.team,
        homeRecord: '0-0',
        awayRecord: '0-0',
        last10: '0-0',
        pointsFor: 0,
        pointsAgainst: 0
      })) as TeamStanding[];

      updateFranchise({
        conferenceStandings: standings,
        schedule: generateSchedule(franchise.team || 'LAL', FRANCHISE_CARDS) as CareerMatch[]
      });
    }
  }, [franchise?.isActive, franchise?.conferenceStandings, updateFranchise, franchise?.team]);

  // 3. Simulation Engine
  const simulateMatch = async () => {
    if (!franchise || isSimulating) return;
    
    const nextGame = franchise.schedule?.find(m => !m.played);
    if (!nextGame) return;

    setShowSimOverlay(true);
  };

  const handleFinishSim = async (simData: { s1: number, s2: number }) => {
    setShowSimOverlay(false);
    const nextGame = franchise.schedule?.find(m => !m.played);
    if (!nextGame) return;

    setIsSimulating(true);
    
    // We'll use the scores from the immersive simulation
    const userScore = simData.s1;
    const oppScore = simData.s2;
    const isWin = userScore > oppScore;

    // 1. Simulate Player Stats for this game
    const userLineup = franchise.lineup || {};
    const userRoster = franchise.roster || [];
    
    // Calculate Energy and Momentum factors
    const energyValues = Object.values(franchise.playerEnergy || {}) as number[];
    const avgEnergyValue = energyValues.reduce((a, b) => a + b, 0) / ((franchise.roster || []).length || 1) || 100;
    const energyFactor = 0.85 + (avgEnergyValue / 100) * 0.3; // 0.85 to 1.15
    
    const last5 = (franchise.schedule || []).filter(m => m.played).slice(-5);
    const winRate = last5.length > 0 ? last5.filter(m => m.result === 'W').length / last5.length : 0.5;
    const momentumFactor = 0.95 + (winRate * 0.1); // 0.95 to 1.05

    const userBoxScore = simulateBoxScore(userLineup, userRoster, true, franchise.playerEnergy || {});
    
    // Opponent logic (Simplified OVR based)
    const nextOpp = NBA_TEAMS.find(t => t.id === nextGame.opponentAbbr);
    const oppOVR = nextGame.opponentOVR || 75;
    
    // Create a mock opponent box score for the recap
    const opponentBoxScore: BoxScorePlayer[] = [
      { 
        cardId: 'opponent-star', 
        name: `${nextGame.opponentAbbr} Star`, 
        position: 'G',
        pts: Math.round(oppScore * 0.3), 
        reb: 8, 
        ast: 6, 
        stl: 1, 
        blk: 1, 
        to: 2,
        plusMinus: oppScore - userScore,
        fg: '8/17',
        threePt: '2/5',
        ft: '4/4',
        minutes: 36, 
        nbaId: 201939 
      }
    ];

    // 2. Accumulate Season Stats for User Players
    const updatedUserSeasonStats = [...(franchise.playerSeasonStats || [])];
    userBoxScore.forEach(box => {
      const existing = updatedUserSeasonStats.find(s => s.cardId === box.cardId);
      if (existing) {
        existing.gamesPlayed += 1;
        existing.totalPts += box.pts;
        existing.totalReb += box.reb;
        existing.totalAst += box.ast;
        existing.totalStl += box.stl;
        existing.totalBlk += box.blk;
        existing.avgPts = existing.totalPts / existing.gamesPlayed;
        existing.avgReb = existing.totalReb / existing.gamesPlayed;
        existing.avgAst = existing.totalAst / existing.gamesPlayed;
        existing.avgStl = existing.totalStl / existing.gamesPlayed;
        existing.avgBlk = existing.totalBlk / existing.gamesPlayed;
      } else {
        updatedUserSeasonStats.push({
          cardId: box.cardId,
          playerName: box.name,
          teamAbbr: franchise.team || 'USER',
          gamesPlayed: 1,
          totalPts: box.pts,
          totalReb: box.reb,
          totalAst: box.ast,
          totalStl: box.stl,
          totalBlk: box.blk,
          avgPts: box.pts,
          avgReb: box.reb,
          avgAst: box.ast,
          avgStl: box.stl,
          avgBlk: box.blk
        });
      }
    });

    const matchStats: CareerMatch = {
      ...nextGame,
      played: true,
      result: isWin ? 'W' : 'L',
      score: [userScore, oppScore],
      boxScore: userBoxScore,
      mvp: userBoxScore.sort((a, b) => b.pts - a.pts)[0]?.name,
      narrative: isWin ? "Dominant team performance." : "Close battle, tough result.",
    };

    const newSchedule = franchise.schedule.map(m => m.id === nextGame.id ? matchStats : m);
    
    // 3. Update League Standings
    // Sim CPU Game Results for the day
    const leagueDaily: { home: string; away: string; homeScore: number; awayScore: number }[] = [];
    const otherTeams = NBA_TEAMS.filter(t => t.id !== franchise.team);
    // Shuffle other teams to pair them
    const shuffledTeams = [...otherTeams].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffledTeams.length; i += 2) {
      if (shuffledTeams[i] && shuffledTeams[i+1]) {
        const home = shuffledTeams[i];
        const away = shuffledTeams[i+1];
        const hRoster = (franchise.leagueRosters || {})[home.id];
        const aRoster = (franchise.leagueRosters || {})[away.id];
        const hOvr = getCPUTeamOVR(home.id, ALL_CARDS, hRoster);
        const aOvr = getCPUTeamOVR(away.id, ALL_CARDS, aRoster);
        const hScore = 95 + Math.round(Math.random() * 30 + (hOvr - 75));
        const aScore = 95 + Math.round(Math.random() * 30 + (aOvr - 75));
        leagueDaily.push({ home: home.id, away: away.id, homeScore: hScore, awayScore: aScore });
      }
    }

    const newLeagueHistory = { ...(franchise.leagueHistory || {}) };
    newLeagueHistory[franchise.currentDate] = leagueDaily;

    const newStandings = (franchise.conferenceStandings || []).map(s => {
      if (s.teamId === franchise.team) {
        const w = s.wins + (isWin ? 1 : 0);
        const l = s.losses + (isWin ? 0 : 1);
        return {
          ...s,
          wins: w,
          losses: l,
          pct: w / (w + l),
          pointsFor: (s.pointsFor || 0) + userScore,
          pointsAgainst: (s.pointsAgainst || 0) + oppScore
        };
      }
      
      // Update from daily results
      const game = leagueDaily.find(g => g.home === s.teamId || g.away === s.teamId);
      if (game) {
        const isHome = game.home === s.teamId;
        const ptsFor = isHome ? game.homeScore : game.awayScore;
        const ptsAg = isHome ? game.awayScore : game.homeScore;
        const won = ptsFor > ptsAg;
        
        const w = s.wins + (won ? 1 : 0);
        const l = s.losses + (won ? 0 : 1);
        
        return {
          ...s,
          wins: w,
          losses: l,
          pct: w / (w + l),
          pointsFor: (s.pointsFor || 0) + ptsFor,
          pointsAgainst: (s.pointsAgainst || 0) + ptsAg
        };
      }
      
      return s;
    }).sort((a, b) => b.pct - a.pct);

    // 4. Update Depth Systems (Chemistry, Fan Support, Energy, Waivers)
    const chemDelta = isWin ? 2 : -1;
    const supportDelta = isWin ? 3 : -2;

    const gamesPlayedSinceRefresh = (franchise.gamesSinceWaiverRefresh || 0) + 1;
    let nextWaiverPool = franchise.waiverPool;
    let nextGamesSinceWaiverRefresh = gamesPlayedSinceRefresh;

    if (gamesPlayedSinceRefresh >= 7) {
      nextWaiverPool = ALL_CARDS
        .filter(c => c.stats.ovr >= 70 && c.stats.ovr <= 80 && !franchise.roster.includes(c.id))
        .sort(() => Math.random() - 0.5)
        .slice(0, 12)
        .map(c => c.id);
      nextGamesSinceWaiverRefresh = 0;
    }
    
    // Generate a news item
    const newsTemplates = TEAM_NEWS;
    const teamInfo = NBA_TEAMS.find(t => t.id === franchise.team);
    const opponentInfo = NBA_TEAMS.find(t => t.id === nextGame.opponentAbbr);
    
    const randomNews = newsTemplates[Math.floor(Math.random() * newsTemplates.length)]
      .replace('{city}', teamInfo?.city || 'the city')
      .replace('{team}', franchise.team || 'the team')
      .replace('{player}', userBoxScore[0]?.name || 'a key player');

    setNews(prev => [randomNews, ...prev].slice(0, 5));

    // Determine MVP of the game
    const mvpCandidate = isWin 
      ? [...userBoxScore].sort((a,b) => (b.pts + b.reb + b.ast) - (a.pts + a.reb + a.ast))[0]
      : [...opponentBoxScore].sort((a,b) => (b.pts + b.reb + b.ast) - (a.pts + a.reb + a.ast))[0];

    setShowRecap({
      isWin,
      userTeam: franchise.team || 'USER',
      oppTeam: nextGame.opponentAbbr,
      userScore,
      oppScore,
      opponentAbbr: nextGame.opponentAbbr,
      userAbbr: franchise.team || 'USER',
      boxScore: userBoxScore,
      mvp: mvpCandidate,
      xp: isWin ? 600 : 250,
      income: isWin ? 60000 : 25000,
      narrative: isWin ? "Dominant team performance. The chemistry was off the charts today." : "Close battle, tough result. The squad needs to regroup and focus on the next one.",
    });

    // Update Energy: Reduce for those who played, recover for others
    const newEnergy = { ...(franchise.playerEnergy || {}) };
    franchise.roster.forEach(id => {
      const box = userBoxScore.find(p => p.cardId === id);
      if (box) {
        // Lose energy based on minutes (approx 0.5 per minute)
        newEnergy[id] = Math.max(20, (newEnergy[id] ?? 100) - (box.minutes * 0.4));
      } else {
        // Recover energy (approx 15 per game sat out)
        newEnergy[id] = Math.min(100, (newEnergy[id] ?? 100) + 15);
      }
    });

    updateFranchise({
      schedule: newSchedule,
      wins: franchise.wins + (isWin ? 1 : 0),
      losses: franchise.losses + (isWin ? 0 : 1),
      xp: franchise.xp + (isWin ? 600 : 250),
      budget: franchise.budget + (isWin ? 60000 : 25000),
      chemistry: Math.min(100, Math.max(0, (franchise.chemistry || 60) + chemDelta)),
      fanSupport: Math.min(100, Math.max(0, (franchise.fanSupport || 50) + supportDelta)),
      playerEnergy: newEnergy,
      waiverPool: nextWaiverPool,
      gamesSinceWaiverRefresh: nextGamesSinceWaiverRefresh,
      leagueHistory: newLeagueHistory,
      conferenceStandings: newStandings as TeamStanding[],
      playerSeasonStats: updatedUserSeasonStats,
      currentDate: new Date(new Date(franchise.currentDate || '2025-10-22').getTime() + 86400000).toISOString().split('T')[0],
      marketPhase: getMarketPhase(franchise.wins + franchise.losses + 1)
    });

    setMatchResult(matchStats);
    setIsSimulating(false);
  };

  const addNews = (msg: string) => {
    setNews(prev => [msg, ...prev].slice(0, 50));
  };


   const handlePlayNextGame = () => {
    if (!franchise || isSimulating) return;
    const nextMatch = franchise.schedule?.find(m => !m.played);
    if (!nextMatch) return;
    setShowSimOverlay(true);
  };
   
  // 4. Render Helpers
  const handleStartFranchise = (teamId: string) => {
    const teamDef = NBA_TEAMS.find(t => t.id === teamId);
    if (!teamDef?.dataAbbr) return;

    const { lineup, roster } = buildTeamRoster(teamDef.dataAbbr);
    const rosterCards = roster.map(id => FRANCHISE_CARDS.find(c => c.id === id)).filter(Boolean) as Card[];
    const contracts = generateInitialContracts(rosterCards);
    const leagueRosters = buildAllTeamRosters();

    const initialState: Partial<FranchiseState> = {
      budget: 1000000,
      season: 2025,
      wins: 0,
      losses: 0,
      roster,
      lineup: lineup as FranchiseState['lineup'],
      leagueRosters,
      contracts,
      currentDate: '2025-10-22',
      marketPhase: 'regular_season',
      playerSeasonStats: [],
      chemistry: 60,
      fanSupport: 50,
      upgrades: {
        coaching: 1,
        scouting: 1,
        training: 1,
        facilities: 1
      },
      conferenceStandings: []
    };

    startFranchise(teamId, roster, initialState);
  };

  if (!franchise?.isActive) {
    return (
      <div className="h-full w-full bg-zinc-950 flex flex-col items-center overflow-y-auto pt-32 pb-20 px-6 font-sans">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="text-center space-y-6 mb-12">
          <div className="w-24 h-24 bg-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl">
            <Building size={48} className="text-white" />
          </div>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white leading-tight">Franchise<br/>Overhaul</h1>
          <p className="text-zinc-500 text-sm font-medium tracking-wide max-w-sm mx-auto">Select your organization and lead them to championship glory in this RPG management mode.</p>
        </motion.div>

        <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {NBA_TEAMS.map(team => (
            <motion.div
              key={team.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTeam(team.id)}
              className={`p-4 rounded-2xl cursor-pointer border transition-all ${
                selectedTeam === team.id ? 'bg-emerald-600 border-emerald-400' : 'bg-zinc-900/50 border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center font-black italic text-lg text-white">
                    {team.id.charAt(0)}
                 </div>
                 <h3 className="text-xs font-black uppercase italic tracking-tight text-white">{team.name}</h3>
              </div>
            </motion.div>
          ))}
        </div>

        {selectedTeam && (
          <motion.button 
            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            onClick={() => handleStartFranchise(selectedTeam)}
            className="fixed bottom-10 py-5 px-12 bg-white text-black rounded-3xl font-black uppercase tracking-[0.3em] text-xs shadow-2xl hover:scale-105 transition-all"
          >
            Draft Front Office
          </motion.button>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col overflow-hidden text-white font-sans">
      {/* Modals & Overlays */}
      <AnimatePresence>
         {showRetireModal && (
           <ResetCareerModal 
             show={showRetireModal} 
             onConfirm={handleRetire} 
             onCancel={() => setShowRetireModal(false)} 
           />
         )}
         {showSimOverlay && teamData && opponentData && nextGame && (
           <MatchSimulationOverlay 
             show={showSimOverlay} 
             userTeam={teamData} 
             oppTeam={opponentData} 
             userLineup={startersList}
             oppLineup={(() => {
               const rosters = franchise.leagueRosters || {};
               const oppRoster = rosters[opponentData.id] || [];
               const oppCards = oppRoster.map(id => ALL_CARDS.find(c => c.id === id)).filter(Boolean) as Card[];
               if (oppCards.length >= 5) {
                  return oppCards.sort((a,b) => b.stats.ovr - a.stats.ovr).slice(0, 5);
               }
               // Mock if no roster
               return Array(5).fill(null).map((_, i) => ({
                 name: `Player ${i+1}`,
                 position: ['PG','SG','SF','PF','C'][i],
                 stats: { ovr: (nextGame.opponentOVR || 75) + i - 2, points: 15, rebounds: 5, assists: 5 }
               } as any));
             })()}
             userOVR={teamOVR}
             oppOVR={nextGame.opponentOVR || 75}
             onFinish={handleFinishSim} 
           />
         )}
         {showRecap && (
           <ResultScreen 
             recap={showRecap} 
             onClose={() => setShowRecap(null)} 
           />
         )}
       </AnimatePresence>

       {/* Header - Sticky Mobile Header */}
      <header 
        className="sticky top-0 z-[100] px-6 py-8 flex flex-col gap-4 relative overflow-hidden"
        style={{ 
          background: `linear-gradient(to bottom, #10b98188, #09090b)` 
        }}
      >
         <div className="absolute inset-0 bg-zinc-950/20 backdrop-blur-3xl" />
         
         <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
               <div 
                 onClick={handleBack}
                 className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center p-2 border border-white/10 active:scale-90 transition-transform cursor-pointer"
               >
                  <img src={getTeamLogo(franchise.team)} className="w-full h-full object-contain" />
               </div>
               <div>
                  <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none">
                     {NBA_TEAMS.find(t => t.id === franchise.team)?.name || 'Franchise'}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{franchise.wins}-{franchise.losses}</span>
                     <div className="w-1 h-1 rounded-full bg-zinc-800" />
                     <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">RANK {(franchise.conferenceStandings?.findIndex(s => s.isUser) ?? 0) + 1}</span>
                  </div>
               </div>
            </div>

            <div 
              onClick={() => setActiveTab('settings')}
              className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-white border border-zinc-800 active:rotate-90 transition-all cursor-pointer"
            >
               <SettingsIcon size={20} />
            </div>
         </div>

         {/* Quick Stats Ticker/Bar */}
         <div className="flex gap-4 overflow-x-auto no-scrollbar relative z-10 pt-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-xl border border-zinc-900 shrink-0">
               <Coins size={12} className="text-amber-500" />
               <span className="text-xs font-black tabular-nums text-white">{(franchise.budget / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-xl border border-zinc-900 shrink-0">
               <Star size={12} className="text-emerald-500" />
               <span className="text-xs font-black text-white">{teamOVR} OVR</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-xl border border-zinc-900 shrink-0">
               <Users size={12} className="text-blue-500" />
               <span className="text-xs font-black text-white">{franchise.roster.length}/15</span>
            </div>
         </div>
         
         {/* News Ticker HUD */}
         <div className="mt-2 -mx-6 px-6 py-2 bg-black/40 border-t border-zinc-900/50 overflow-hidden relative z-10">
            <div className="flex items-center gap-6 animate-marquee whitespace-nowrap">
               {news.length > 0 ? [...news, ...news].map((item, i) => (
                 <div key={i} className="flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{item}</span>
                 </div>
               )) : (
                 <div className="flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-zinc-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 italic">No league updates at this time. Season prep is underway...</span>
                 </div>
               )}
            </div>
         </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-7xl mx-auto space-y-4"
          >
            {activeTab === 'hub' && nextOpponent && (
              <div className="space-y-6 pb-40 px-6">
                 {/* Next Game Card */}
                 <div className="pt-6">
                    <div className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 p-8 space-y-8 relative overflow-hidden group shadow-2xl">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                       
                       <div className="flex items-center justify-between relative z-10">
                          <span className="px-4 py-1.5 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-full">Next Match</span>
                       </div>

                       <div className="flex items-center gap-6 relative z-10">
                          <div className="w-20 h-20 bg-zinc-950 rounded-3xl p-4 border border-zinc-800 shadow-inner">
                             <img src={getTeamLogo(nextOpponent.id)} className="w-full h-full object-contain" />
                          </div>
                          <div>
                             <h3 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none">{nextOpponent.name}</h3>
                             <div className="flex items-center gap-3 mt-2">
                                <span className="text-emerald-500 font-black text-xs uppercase tracking-widest">OVR {getCPUTeamOVR(nextOpponent.id, ALL_CARDS)}</span>
                                <span className="text-zinc-600 font-black text-[10px] uppercase tracking-widest">CHANCE {Math.round((teamOVR / (teamOVR + getCPUTeamOVR(nextOpponent.id, ALL_CARDS))) * 100)}%</span>
                             </div>
                          </div>
                       </div>

                       <button 
                          onClick={handlePlayNextGame}
                          className="w-full h-20 bg-emerald-500 hover:bg-white text-black rounded-[2rem] flex items-center justify-center gap-4 transition-all shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-95 relative z-10"
                       >
                          <Play fill="currentColor" size={24} />
                          <span className="text-sm font-black uppercase tracking-[0.3em] italic">Start Game</span>
                       </button>
                    </div>
                 </div>

                 {/* Stats Cards */}
                 <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Payroll', val: `$${(teamPayroll/1000000).toFixed(1)}M`, color: 'text-amber-500' },
                      { label: 'Energy', val: `${avgEnergy}%`, color: 'text-emerald-500' },
                      { label: 'Chem', val: `${franchise.chemistry}%`, color: 'text-blue-500' }
                    ].map((item, i) => (
                      <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 text-center space-y-1">
                         <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{item.label}</p>
                         <p className={`text-xl font-black italic tabular-nums ${item.color}`}>{item.val}</p>
                      </div>
                    ))}
                 </div>

                 {/* Quick Actions Grid */}
                 <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'lineup', label: 'Roster', icon: Users, color: 'bg-indigo-500' },
                      { id: 'market', label: 'Market', icon: ShoppingCart, color: 'bg-emerald-500' },
                      { id: 'standings', label: 'League', icon: BarChart3, color: 'bg-blue-500' },
                      { id: 'settings', label: 'Settings', icon: SettingsIcon, color: 'bg-zinc-600' }
                    ].map((action) => (
                      <button 
                         key={action.id}
                         onClick={() => setActiveTab(action.id as FranchiseTab)}
                         className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col items-start gap-4 hover:border-white/20 transition-all active:scale-95 shadow-xl relative overflow-hidden"
                      >
                         <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center text-black shadow-lg relative z-10`}>
                            <action.icon size={18} strokeWidth={3} />
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-200 relative z-10">{action.label}</span>
                      </button>
                    ))}
                 </div>

                 {/* Recent Results */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                       <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Recent Results</h4>
                       <History size={14} className="text-zinc-800" />
                    </div>
                    <div className="space-y-2">
                       {franchise.schedule?.filter(m => m.played).slice(-5).reverse().map((game, i) => (
                          <div key={i} className="bg-zinc-900/50 border border-zinc-900 rounded-2xl p-4 flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${game.result === 'W' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                   {game.result}
                                </div>
                                <div>
                                   <p className="text-[10px] font-black uppercase text-zinc-500">{game.isHome ? 'Vs' : 'At'} {game.opponentAbbr}</p>
                                   <p className="text-sm font-black italic text-white tabular-nums">{game.score}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-bold text-zinc-600">GAME {game.gameNumber}</p>
                             </div>
                          </div>
                       ))}
                       {(!franchise.schedule || franchise.schedule.filter(m => m.played).length === 0) && (
                          <div className="py-12 bg-zinc-950 border border-zinc-900 rounded-3xl flex flex-col items-center justify-center text-zinc-800 gap-2">
                             <Target size={24} strokeWidth={1} />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em]">No Games Played</span>
                          </div>
                       )}
                    </div>
                 </div>

                 {/* News */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                       <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">League News</h4>
                       <Newspaper size={14} className="text-zinc-800" />
                    </div>
                    <div className="space-y-3">
                       {news.slice(0, 3).map((item, i) => (
                          <div key={i} className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-4 flex gap-4 items-start italic group hover:bg-zinc-900/50 transition-colors">
                             <div className="mt-1.5 w-1 h-1 rounded-full bg-zinc-800 group-hover:bg-emerald-500 transition-colors" />
                             <p className="text-[11px] font-medium text-zinc-400 group-hover:text-white transition-colors leading-relaxed">{item}</p>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
            )}
            {activeTab === 'lineup' && (
              <div className="space-y-12 pb-32">
                 <div className="flex border-b border-zinc-900 mb-12 sticky top-[180px] bg-zinc-950 z-[70] pt-6 items-center justify-between">
                    <div className="flex gap-2 sm:gap-6">
                      {(['court', 'bench', 'depth', 'chemistry', 'contracts'] as const).map(tab => (
                          <button 
                            key={tab}
                            onClick={() => setLineupSubTab(tab as any)}
                            className={`px-8 sm:px-12 py-5 text-[10px] sm:text-xs font-black uppercase tracking-[0.4em] transition-all relative group/tab ${lineupSubTab === tab ? 'text-white' : 'text-zinc-700'}`}
                          >
                            <span className="relative z-10">{tab.replace('_', ' ')}</span>
                            {lineupSubTab === (tab as any) && (
                              <>
                                <motion.div layoutId="lineupSubTab" className="absolute bottom-0 left-0 right-0 h-1 bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)] z-20" />
                                <div className="absolute inset-0 bg-white/[0.03] rounded-t-2xl z-0" />
                              </>
                            )}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-zinc-800 transition-all group-hover/tab:w-full z-10" />
                          </button>
                      ))}
                    </div>
                    <div className="hidden lg:flex items-center gap-10 px-8">
                       <div className="flex flex-col items-end border-r border-zinc-900 pr-10">
                          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1 italic">Rotation Strength</span>
                          <span className="text-2xl font-black italic text-emerald-500 tabular-nums">{teamOVR} OVR</span>
                       </div>
                       <div className="flex flex-col items-end">
                          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1 italic">Salary Efficiency</span>
                          <span className={`text-2xl font-black italic tabular-nums ${teamPayroll > SALARY_CAP ? 'text-red-500' : 'text-amber-500'}`}>
                             {Math.round((teamPayroll/SALARY_CAP)*100)}%
                          </span>
                       </div>
                    </div>
                 </div>

                 {lineupSubTab === 'court' && (
                    <div className="space-y-16 pb-32 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10">
                           <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                              <div className="absolute inset-0 bg-emerald-500/[0.01] pointer-events-none" />
                              <div className="flex items-center justify-between relative z-10">
                                 <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 text-emerald-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                       <Target size={28} />
                                    </div>
                                    <div className="flex flex-col">
                                       <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">Offensive Skill</h3>
                                       <p className="text-3xl font-black italic text-white tabular-nums tracking-tighter">{teamOVR}</p>
                                    </div>
                                 </div>
                                 <div className="flex flex-col items-end gap-1 text-emerald-500">
                                    <TrendingUp size={16} />
                                    <span className="text-[10px] font-black italic">+2.5%</span>
                                 </div>
                              </div>
                           </div>

                           <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group lg:col-span-2">
                              <div className="absolute inset-0 bg-amber-500/[0.01] pointer-events-none" />
                              <div className="flex items-center gap-8 relative z-10">
                                 <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                    <CreditCard size={28} />
                                 </div>
                                 <div className="flex-1">
                                    <div className="flex items-center justify-between mb-3">
                                       <div className="flex flex-col">
                                          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">Financial Cap Hub</h3>
                                          <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest mt-1">Season Budget Utilization</span>
                                       </div>
                                       <div className="text-right">
                                          <span className={`text-[11px] font-black italic px-4 py-1.5 rounded-xl border ${teamPayroll > SALARY_CAP ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                             ${Math.max(0, (SALARY_CAP - teamPayroll)/1000000).toFixed(2)}M Credits Remaining
                                          </span>
                                       </div>
                                    </div>
                                    <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden p-1 border border-zinc-800 shadow-inner">
                                       <motion.div 
                                         initial={{ width: 0 }} 
                                         animate={{ width: `${Math.min(100, (teamPayroll/SALARY_CAP)*100)}%` }} 
                                         className={`h-full rounded-full transition-all duration-1000 ${teamPayroll > SALARY_CAP ? 'bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]'}`} 
                                       />
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                              <div className="absolute inset-0 bg-blue-500/[0.01] pointer-events-none" />
                              <div className="flex items-center justify-between relative z-10 h-full">
                                 <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 text-blue-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                       <Users size={28} />
                                    </div>
                                    <div className="flex flex-col">
                                       <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">Roster Unit</h3>
                                       <p className="text-3xl font-black italic text-white tabular-nums tracking-tighter">{franchise.roster.length} / 15</p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Tactical Court View */}
                        <div className="relative w-full aspect-[3.5/5] sm:aspect-[16/9] bg-zinc-950 rounded-3xl sm:rounded-[6rem] border-2 sm:border-4 border-zinc-900 shadow-2xl p-3 sm:p-24 overflow-hidden group">
                           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03),transparent)] pointer-events-none" />
                           <div className="absolute inset-x-12 inset-y-16 sm:inset-x-24 sm:inset-y-40 z-0 opacity-[0.05] pointer-events-none transition-opacity group-hover:opacity-[0.1] duration-1000">
                               <svg width="100%" height="100%" viewBox="0 0 1000 600" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                                 <path d="M500 0V600M0 300H1000M0 2H998V598H2V2ZM500 400C555.228 400 600 355.228 600 300C600 244.772 555.228 200 500 200C444.772 200 400 244.772 400 300C400 355.228 444.772 400 500 400Z" stroke="white" strokeWidth="6" strokeLinecap="round"/>
                                 <path d="M0 150H200V450H0M1000 150H800V450H1000" stroke="white" strokeWidth="6" strokeLinecap="round"/>
                                 <path d="M0 60C180 60 320 160 320 300C320 440 180 540 0 540M1000 60C820 60 680 160 680 300C680 440 820 540 1000 540" stroke="white" strokeWidth="6" strokeLinecap="round"/>
                                 <circle cx="500" cy="300" r="10" fill="white" className="animate-pulse" />
                               </svg>
                           </div>

                           <div className="relative z-10 w-full h-full">
                             <div className="absolute left-[5%] top-1/2 -translate-y-1/2">
                                <PositionSlot pos="PG" cardId={franchise.lineup?.PG} energy={franchise.playerEnergy?.[franchise.lineup?.PG || ''] || 100} onSelect={() => setShowPicker({ pos: 'PG' })} />
                             </div>
                             <div className="absolute left-[20%] sm:left-[24%] top-[5%] sm:top-[12%]">
                                <PositionSlot pos="SG" cardId={franchise.lineup?.SG} energy={franchise.playerEnergy?.[franchise.lineup?.SG || ''] || 100} onSelect={() => setShowPicker({ pos: 'SG' })} />
                             </div>
                             <div className="absolute left-[20%] sm:left-[24%] bottom-[5%] sm:bottom-[12%]">
                                <PositionSlot pos="PF" cardId={franchise.lineup?.PF} energy={franchise.playerEnergy?.[franchise.lineup?.PF || ''] || 100} onSelect={() => setShowPicker({ pos: 'PF' })} />
                             </div>
                             <div className="absolute left-[45%] top-1/2 -translate-y-1/2 scale-[0.8] sm:scale-110">
                                <PositionSlot pos="C" cardId={franchise.lineup?.C} energy={franchise.playerEnergy?.[franchise.lineup?.C || ''] || 100} onSelect={() => setShowPicker({ pos: 'C' })} />
                             </div>
                             <div className="absolute left-[72%] sm:left-[68%] top-1/2 -translate-y-1/2">
                                <PositionSlot pos="SF" cardId={franchise.lineup?.SF} energy={franchise.playerEnergy?.[franchise.lineup?.SF || ''] || 100} onSelect={() => setShowPicker({ pos: 'SF' })} />
                             </div>

                             <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-12 pointer-events-none pr-10">
                                <div className="text-right space-y-2 opacity-20 group-hover:opacity-100 transition-all duration-700 translate-x-10 group-hover:translate-x-0">
                                   <div className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-700 italic">Offensive Logic</div>
                                   <p className="text-xl font-black italic text-emerald-500 uppercase tracking-tighter shadow-sm">Triangle Flow</p>
                                </div>
                                <div className="text-right space-y-2 opacity-20 group-hover:opacity-100 transition-all duration-700 translate-x-14 group-hover:translate-x-0 delay-75">
                                   <div className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">DEFENSIVE ANCHOR</div>
                                   <p className="text-sm font-black italic text-zinc-400 uppercase tracking-tighter">ELITE RIM PROTECT</p>
                                </div>
                                <div className="text-right space-y-1.5 translate-x-12 group-hover:translate-x-0 transition-transform delay-150">
                                   <div className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">TEMPO ADAPT</div>
                                   <p className="text-sm font-black italic text-zinc-500 uppercase tracking-tighter">UP-TEMPO RELIANCE</p>
                                </div>
                             </div>
                           </div>
                        </div>
                    </div>
                 )}

                 {lineupSubTab === 'bench' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
                       <div className="flex items-center justify-between px-2">
                          <div className="space-y-1">
                             <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 italic">Roster Reserves</h3>
                             <p className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">Select targets to replace active starters</p>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="px-5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-3">
                                <Users size={14} className="text-zinc-600" />
                                <span className="text-[10px] font-black italic text-zinc-400 uppercase">{franchise.roster.filter(id => !Object.values(franchise.lineup || {}).includes(id)).length} Units Available</span>
                             </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 sm:gap-12">
                          {franchise.roster.filter(id => !Object.values(franchise.lineup || {}).includes(id)).map(id => {
                             const card = ALL_CARDS.find(c => c.id === id);
                             if (!card) return null;
                             const energy = franchise.playerEnergy?.[id] ?? 100;
                             
                             return (
                               <div key={id} className="relative group perspective-1000">
                                  <div className="transition-all duration-500 group-hover:rotate-y-12 group-hover:scale-105">
                                    <CardItem card={card} isOwned={true} mode="mini" />
                                  </div>
                                  <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-6 rounded-[2rem] transition-all duration-300 space-y-6 backdrop-blur-sm border border-white/10 z-20">
                                     <div className="text-center group/energy">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase mb-2 tracking-widest">Health Battery</p>
                                        <div className="flex items-center gap-3 justify-center">
                                           <Zap size={18} className={`${energy < 50 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`} fill="currentColor" />
                                           <span className="text-2xl font-black italic text-white tabular-nums">{Math.round(energy)}%</span>
                                        </div>
                                     </div>
                                     <button 
                                       onClick={() => {
                                          const pos = normalizePosition(card.position);
                                          updateFranchise({ lineup: { ...franchise.lineup, [pos]: id } });
                                       }}
                                       className="w-full py-4 bg-white text-black text-[10px] font-black uppercase rounded-2xl hover:bg-emerald-400 transition-all active:scale-95 shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                                     >
                                        ACTIVATE IN LINEUP
                                     </button>
                                  </div>
                                  <div className="mt-4 flex items-center justify-between px-2">
                                     <span className="text-[8px] font-black text-zinc-700 uppercase italic tracking-widest">{card.position} Unit</span>
                                     <div className="w-8 h-1 bg-zinc-900 rounded-full overflow-hidden">
                                        <div className={`h-full ${energy < 50 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${energy}%` }} />
                                     </div>
                                  </div>
                               </div>
                             );
                          })}
                       </div>
                    </div>
                 )}

                 {lineupSubTab === 'chemistry' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
                       <div className="bg-zinc-950 border-2 border-zinc-900 rounded-[3.5rem] p-10 sm:p-16 space-y-16 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-emerald-500/[0.02] blur-[150px] pointer-events-none" />
                          <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-blue-500/[0.02] blur-[150px] pointer-events-none" />
                          
                          <div className="relative z-10 text-center space-y-4">
                             <div className="flex items-center justify-center gap-3 mb-2">
                                <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500/60">Tactical Synchronization</span>
                                <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-emerald-500" />
                             </div>
                             <h3 className="text-4xl sm:text-6xl font-black uppercase italic tracking-tighter text-white">Squad Symmetries</h3>
                             <p className="text-zinc-600 text-[10px] sm:text-xs font-black uppercase tracking-[0.4em] max-w-xl mx-auto">Active synergy algorithms derived from current rotation composition</p>
                          </div>

                          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                             {/* Synergy 1: Trio */}
                             <div className={`p-10 rounded-[2.5rem] border-2 transition-all duration-500 relative group overflow-hidden ${
                               Object.values(activeStarters.reduce((acc, c) => { acc[c.teamAbbr] = (acc[c.teamAbbr] || 0) + 1; return acc; }, {} as any)).some((v: any) => v >= 3)
                               ? 'bg-emerald-500/[0.08] border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)]' : 'bg-white/[0.02] border-zinc-800 grayscale opacity-40'
                             }`}>
                                <div className="flex flex-col items-center text-center gap-6">
                                   <div className="w-20 h-20 bg-zinc-950 border border-zinc-800 rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                      <Users size={36} className="text-emerald-500" />
                                   </div>
                                   <div className="space-y-2">
                                      <h4 className="text-2xl font-black uppercase italic tracking-tight text-white">Active Trio</h4>
                                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">+3 OVR Composition Bonus</p>
                                   </div>
                                   <div className="h-1 w-20 bg-zinc-900 rounded-full overflow-hidden">
                                      <div className={`h-full bg-emerald-500 transition-all duration-1000 ${Object.values(activeStarters.reduce((acc, c) => { acc[c.teamAbbr] = (acc[c.teamAbbr] || 0) + 1; return acc; }, {} as any)).some((v: any) => v >= 3) ? 'w-full' : 'w-0'}`} />
                                   </div>
                                </div>
                             </div>

                             {/* Synergy 2: Inside-Out */}
                             <div className={`p-10 rounded-[2.5rem] border-2 transition-all duration-500 relative group overflow-hidden ${
                               (activeStarters.find(c => normalizePosition(c.position) === 'PG')?.stats.assists >= 85 && activeStarters.find(c => normalizePosition(c.position) === 'C')?.stats.rebounds >= 80)
                               ? 'bg-amber-500/[0.08] border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.1)]' : 'bg-white/[0.02] border-zinc-800 grayscale opacity-40'
                             }`}>
                                <div className="flex flex-col items-center text-center gap-6">
                                   <div className="w-20 h-20 bg-zinc-950 border border-zinc-800 rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                      <Zap size={36} className="text-amber-500" />
                                   </div>
                                   <div className="space-y-2">
                                      <h4 className="text-2xl font-black uppercase italic tracking-tight text-white">Inside-Out Play</h4>
                                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">+5 OVR Logic Efficiency</p>
                                   </div>
                                   <div className="h-1 w-20 bg-zinc-900 rounded-full overflow-hidden">
                                      <div className={`h-full bg-amber-500 transition-all duration-1000 ${(activeStarters.find(c => normalizePosition(c.position) === 'PG')?.stats.assists >= 85 && activeStarters.find(c => normalizePosition(c.position) === 'C')?.stats.rebounds >= 80) ? 'w-full' : 'w-0'}`} />
                                   </div>
                                </div>
                             </div>

                             {/* Synergy 3: Star Power */}
                             <div className={`p-10 rounded-[2.5rem] border-2 transition-all duration-500 relative group overflow-hidden ${
                               activeStarters.some(c => c.rarity === 'franchise')
                               ? 'bg-purple-500/[0.08] border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.1)]' : 'bg-white/[0.02] border-zinc-800 grayscale opacity-40'
                             }`}>
                                <div className="flex flex-col items-center text-center gap-6">
                                   <div className="w-20 h-20 bg-zinc-950 border border-zinc-800 rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                      <Star size={36} className="text-purple-500" />
                                   </div>
                                   <div className="space-y-2">
                                      <h4 className="text-2xl font-black uppercase italic tracking-tight text-white">Star Power</h4>
                                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">+2 OVR Momentum Factor</p>
                                   </div>
                                   <div className="h-1 w-20 bg-zinc-900 rounded-full overflow-hidden">
                                      <div className={`h-full bg-purple-500 transition-all duration-1000 ${activeStarters.some(c => c.rarity === 'franchise') ? 'w-full' : 'w-0'}`} />
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

                 {lineupSubTab === 'contracts' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 space-y-10 shadow-2xl">
                           <div className="flex items-center justify-between border-b border-zinc-800 pb-8">
                              <div className="space-y-1">
                                 <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Payroll Matrix</h3>
                                 <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Active Player Commitments & Cap Status</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Cap Space</p>
                                 <p className={`text-3xl font-black italic tabular-nums ${teamPayroll > SALARY_CAP ? 'text-red-500' : 'text-emerald-500'}`}>
                                    ${((SALARY_CAP - teamPayroll)/1000000).toFixed(2)}M
                                 </p>
                              </div>
                           </div>

                           <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                 <thead>
                                    <tr className="text-[9px] font-black uppercase text-zinc-600 tracking-widest border-b border-zinc-800">
                                       <th className="py-6 px-4">Player</th>
                                       <th className="py-6 px-4">Years</th>
                                       <th className="py-6 px-4">Salary</th>
                                       <th className="py-6 px-4">Type</th>
                                       <th className="py-6 px-4 text-right">Actions</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-zinc-800/50">
                                    {franchise.roster.map(id => {
                                       const card = ALL_CARDS.find(c => c.id === id);
                                       const contract = (franchise.contracts || []).find(c => c.cardId === id);
                                       if (!card || !contract) return null;
                                       return (
                                          <tr key={id} className="group hover:bg-white/[0.02]">
                                             <td className="py-6 px-4">
                                                <div className="flex items-center gap-4">
                                                   <div className={`w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center p-1 border ${
                                                      card.rarity === 'franchise' ? 'border-purple-500/50' : 
                                                      card.rarity === 'allstar' ? 'border-amber-500/50' : 'border-zinc-800'
                                                   }`}>
                                                      <img src={getTeamLogo(card.teamAbbr)} className="w-full h-full object-contain" />
                                                   </div>
                                                   <div>
                                                      <p className="text-sm font-black italic uppercase text-zinc-200">{card.name}</p>
                                                      <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">OVR {card.stats.ovr} · {card.position}</p>
                                                   </div>
                                                </div>
                                             </td>
                                             <td className="py-6 px-4">
                                                <span className={`text-xs font-black italic ${contract.yearsLeft === 1 ? 'text-red-500' : 'text-zinc-400'}`}>
                                                   {contract.yearsLeft} YRS
                                                </span>
                                             </td>
                                             <td className="py-6 px-4 text-sm font-black italic text-white/80 tabular-nums">${contract.salary.toFixed(2)}M</td>
                                             <td className="py-6 px-4">
                                                <span className="text-[9px] font-black uppercase px-3 py-1 rounded-lg border border-zinc-800 text-zinc-500">
                                                   {contract.type}
                                                </span>
                                             </td>
                                             <td className="py-6 px-4">
                                                <div className="flex items-center justify-end gap-2">
                                                   {contract.canExtend && (
                                                      <button 
                                                        onClick={() => handleExtendContract(id)}
                                                        className="px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black rounded-lg text-[9px] font-black uppercase transition-all"
                                                      >
                                                         Extend
                                                      </button>
                                                   )}
                                                   <button 
                                                      onClick={() => handleReleasePlayer(id)}
                                                      className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-[9px] font-black uppercase transition-all"
                                                   >
                                                      Waive
                                                   </button>
                                                </div>
                                             </td>
                                          </tr>
                                       );
                                    })}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                    </div>
                 )}
              </div>
            )}

            {activeTab === 'market' && (
              <div className="space-y-12 pb-32">
                 <div className="flex border-b border-zinc-900 mb-12 sticky top-[240px] bg-zinc-950/90 backdrop-blur-3xl z-[70] pt-6 pr-10 items-center justify-between">
                    <div className="flex gap-2">
                        {(['waivers', 'trades', 'free_agency'] as const).map(tab => (
                           <button 
                             key={tab}
                             onClick={() => setMarketSubTab(tab)}
                             className={`px-12 py-6 text-[11px] font-black uppercase tracking-[0.5em] transition-all relative group/tab ${marketSubTab === tab ? 'text-white' : 'text-zinc-700 hover:text-zinc-500'}`}
                           >
                             <span className="relative z-10">{tab.replace('_', ' ')}</span>
                             {marketSubTab === tab && (
                               <>
                                 <motion.div 
                                   layoutId="marketSubTab" 
                                   className="absolute bottom-0 left-0 right-0 h-1 bg-white shadow-[0_0_20px_rgba(255,255,255,0.6)] z-20" 
                                 />
                                 <div className="absolute inset-0 bg-white/[0.03] rounded-t-3xl z-0" />
                               </>
                             )}
                             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-zinc-800 transition-all group-hover/tab:w-full z-10" />
                           </button>
                        ))}
                    </div>
                    <div className="hidden lg:flex items-center gap-10">
                       <div className="flex flex-col items-end">
                          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest italic mb-1">Market Volatility</span>
                          <div className="flex items-center gap-2 text-emerald-500">
                             <TrendingUp size={14} />
                             <span className="text-lg font-black italic">LOW</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {marketSubTab === 'waivers' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] shadow-[0_30px_80px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent)] pointer-events-none" />
                          <div className="relative z-10 space-y-6">
                             <div className="flex items-center gap-4">
                                <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981] animate-pulse" />
                                <div className="space-y-1">
                                   <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white">Waiver Central</h3>
                                   <div className="h-0.5 w-24 bg-emerald-500/50" />
                                </div>
                             </div>
                             <div className="space-y-3">
                                <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] leading-relaxed max-w-xl">
                                   Strategic asset acquisition protocol. Monitoring international pool & domestic veteran releases.
                                </p>
                                <div className="flex items-center gap-3 py-2 px-4 bg-zinc-950/50 border border-zinc-800 rounded-xl w-fit">
                                   <RefreshCw size={14} className="text-emerald-500 animate-spin-slow" />
                                   <span className="text-[10px] font-black text-emerald-500 uppercase italic tracking-widest">
                                      Database Sync: {7 - ((franchise.wins + franchise.losses) % 7)} matches remaining
                                   </span>
                                </div>
                             </div>
                          </div>
                          <div className="relative z-10 flex flex-wrap items-center gap-6">
                             <div className="bg-zinc-950 border-2 border-zinc-900 px-10 py-7 rounded-[2rem] shadow-inner group/stat hover:border-amber-500/30 transition-colors relative">
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 italic">Operation Capital</p>
                                <div className="flex items-baseline gap-2">
                                   <p className="text-3xl font-black italic text-amber-500 tabular-nums">${(franchise.budget/1000).toFixed(0)}K</p>
                                   <span className="text-[9px] font-bold text-zinc-700 uppercase">Credits</span>
                                </div>
                                {tradeMessage && (
                                   <div className="absolute -top-12 left-0 right-0 animate-in fade-in slide-in-from-bottom-2 z-[100]">
                                      <div className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-2xl ${tradeMessage.includes('APPROVED') || tradeMessage.includes('ACCEPTED') ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-red-500 text-white border-red-400'}`}>
                                         {tradeMessage}
                                      </div>
                                   </div>
                                )}
                             </div>
                             <div className="bg-zinc-950 border-2 border-zinc-900 px-10 py-7 rounded-[2rem] shadow-inner group/stat hover:border-blue-500/30 transition-colors">
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 italic">Roster Capacity</p>
                                <div className="flex items-baseline gap-2">
                                   <p className="text-3xl font-black italic text-zinc-300 tabular-nums">{franchise.roster.length}</p>
                                   <span className="text-lg font-black text-zinc-700">/ 15</span>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-10 sm:gap-14">
                          {(franchise.waiverPool || ALL_CARDS.filter(c => c.stats.ovr >= 70 && c.stats.ovr <= 78 && !(franchise.roster || []).includes(c.id)).slice(0, 10).map(c => c.id)).map(id => {
                             const card = ALL_CARDS.find(c => c.id === id);
                             if (!card) return null;
                             const salary = (card.stats.ovr - 65) * 0.4 + 1.5;
                             const canAfford = teamPayroll + salary <= SALARY_CAP;

                             return (
                               <div key={id} className="relative group perspective-1000">
                                  <div className="transition-all duration-700 group-hover:rotate-y-12 group-hover:scale-105 group-hover:-translate-y-4">
                                     <CardItem card={card} isOwned={true} mode="mini" />
                                  </div>
                                  <div className="absolute inset-x-2 -bottom-2 bg-zinc-950 border-2 border-zinc-800 rounded-[2.5rem] p-6 opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-3xl z-30 translate-y-10 group-hover:translate-y-0 backdrop-blur-2xl bg-opacity-95">
                                     <div className="flex flex-col gap-4 mb-6">
                                        <div className="flex items-center justify-between">
                                           <span className="text-[9px] font-black text-zinc-600 uppercase italic">Annual Commitment</span>
                                           <span className="text-sm font-black italic text-white shadow-sm">${salary.toFixed(2)}M</span>
                                        </div>
                                        <div className="h-0.5 w-full bg-zinc-900 rounded-full" />
                                     </div>
                                     <button 
                                       disabled={!canAfford || franchise.roster.length >= 15}
                                       onClick={() => {
                                          const newContract: PlayerContract = {
                                            cardId: card.id,
                                            yearsLeft: 1,
                                            salary: salary,
                                            type: 'minimum',
                                            canExtend: true,
                                            canTrade: true
                                          };
                                          updateFranchise({
                                            roster: [...franchise.roster, id],
                                            contracts: [...(franchise.contracts || []), newContract]
                                          });
                                          setNews(prev => [`${teamData?.name} claimed ${card.name} off waivers.`, ...prev].slice(0, 5));
                                       }}
                                       className="w-full py-4 bg-white text-black text-[10px] font-black uppercase rounded-2xl hover:bg-emerald-400 hover:shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all active:scale-95 disabled:opacity-30 disabled:hover:bg-white disabled:hover:shadow-none"
                                     >
                                        Initiate Claim
                                     </button>
                                  </div>
                                  <div className="absolute top-2 left-2 bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded-lg text-[8px] font-black uppercase italic backdrop-blur-md border border-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                     WAIVER TARGET
                                  </div>
                               </div>
                             );
                          })}
                       </div>
                    </div>
                 )}

                 {marketSubTab === 'trades' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                          {/* User Assets */}
                          <div className="bg-zinc-900 border border-zinc-800 rounded-[3.5rem] p-10 space-y-10 relative overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)] group/assets">
                             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.02),transparent)] pointer-events-none" />
                             <div className="flex items-center justify-between relative z-10">
                                <div className="space-y-2">
                                   <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Your Assets</h3>
                                   <div className="flex items-center gap-3">
                                      <div className="h-0.5 w-12 bg-white/20" />
                                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 italic">Front Office Inventory</p>
                                   </div>
                                </div>
                                <div className={`w-4 h-4 rounded-full transition-all duration-500 scale-110 ${tradeUserPlayer ? 'bg-emerald-500 shadow-[0_0_20px_#10b981]' : 'bg-zinc-800'}`} />
                             </div>
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 h-[550px] overflow-y-auto pr-6 no-scrollbar relative z-10 scroll-smooth pb-10">
                                {(franchise.roster || []).map(id => {
                                   const card = ALL_CARDS.find(c => c.id === id);
                                   if (!card) return null;
                                   return (
                                      <div 
                                        key={id} 
                                        onClick={() => setTradeUserPlayer(id)} 
                                        className={`cursor-pointer transition-all duration-500 relative rounded-[2.5rem] p-1.5 ${tradeUserPlayer === id ? 'bg-white shadow-[0_20px_60px_rgba(255,255,255,0.2)] scale-105 z-20' : 'opacity-30 grayscale hover:opacity-100 hover:scale-[1.02] hover:grayscale-0'}`}
                                      >
                                         <CardItem card={card} isOwned={true} mode="mini" />
                                         {tradeUserPlayer === id && (
                                            <div className="absolute -top-3 -right-3 bg-emerald-500 text-black p-2 rounded-2xl shadow-xl z-30 animate-in zoom-in-50 duration-300">
                                               <Check size={18} strokeWidth={4} />
                                            </div>
                                         )}
                                      </div>
                                   );
                                })}
                             </div>
                          </div>

                          {/* Target Team Assets */}
                          <div className="bg-zinc-900 border border-zinc-800 rounded-[3.5rem] p-10 space-y-10 relative overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)] group/negotiation">
                             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.02),transparent)] pointer-events-none" />
                             <div className="space-y-8 relative z-10">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                   <div className="space-y-2">
                                      <h3 className="text-3xl font-black uppercase italic tracking-tighter text-zinc-400">Rival Assets</h3>
                                      <div className="flex items-center gap-3">
                                         <div className="h-0.5 w-12 bg-zinc-800" />
                                         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700 italic">Negotiation Target</p>
                                      </div>
                                   </div>
                                   <div className="flex gap-3 overflow-x-auto no-scrollbar max-w-full sm:max-w-[280px] py-3 px-1">
                                      {NBA_TEAMS.filter(t => t.id !== franchise.team).map(t => (
                                         <button 
                                           key={t.id} 
                                           onClick={() => setTradeTargetTeam(t.id)} 
                                           className={`w-14 h-14 rounded-2xl flex items-center justify-center p-3 shrink-0 transition-all border-2 relative overflow-hidden group/team ${tradeTargetTeam === t.id ? 'bg-white border-white scale-110 shadow-2xl z-20' : 'bg-black/40 border-zinc-900 grayscale hover:grayscale-0 hover:border-zinc-700'}`}
                                         >
                                            <img src={getTeamLogo(t.id)} alt={t.id} className="w-full h-full object-contain relative z-10" />
                                            {tradeTargetTeam === t.id && (
                                              <div className="absolute inset-0 bg-white shadow-inner pointer-events-none" />
                                            )}
                                         </button>
                                      ))}
                                   </div>
                                </div>
                             </div>

                             {tradeTargetTeam ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 h-[550px] overflow-y-auto pr-6 no-scrollbar relative z-10 scroll-smooth pb-10">
                                   {(franchise.leagueRosters?.[tradeTargetTeam] || []).map(id => {
                                      const card = ALL_CARDS.find(c => c.id === id);
                                      if (!card) return null;
                                      return (
                                         <div 
                                           key={id} 
                                           onClick={() => setTradeTargetPlayer(id)} 
                                           className={`cursor-pointer transition-all duration-500 relative rounded-[2.5rem] p-1.5 ${tradeTargetPlayer === id ? 'bg-amber-500 shadow-[0_20px_60px_rgba(245,158,11,0.3)] scale-105 z-20' : 'opacity-30 grayscale hover:opacity-100 hover:scale-[1.02] hover:grayscale-0'}`}
                                         >
                                            <CardItem card={card} isOwned={true} mode="mini" />
                                            {tradeTargetPlayer === id && (
                                              <div className="absolute -top-3 -right-3 bg-white text-black p-2 rounded-2xl shadow-xl z-30 animate-in zoom-in-50 duration-300">
                                                 <Check size={18} strokeWidth={4} className="text-amber-600" />
                                              </div>
                                            )}
                                         </div>
                                      );
                                   })}
                                </div>
                             ) : (
                                <div className="h-[550px] flex flex-col items-center justify-center text-center space-y-10 bg-black/40 border-2 border-zinc-900 rounded-[3rem] relative overflow-hidden">
                                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02),transparent)]" />
                                   <div className="w-24 h-24 bg-zinc-950 border border-zinc-800 rounded-[2rem] flex items-center justify-center text-zinc-800 shadow-inner group-hover/negotiation:scale-110 transition-transform duration-1000">
                                      <RefreshCw size={48} className="animate-spin-slow opacity-20" />
                                   </div>
                                   <div className="space-y-4 relative z-10 px-10">
                                      <p className="text-[11px] font-black uppercase tracking-[0.5em] leading-relaxed text-zinc-700">Initialize Secure Line</p>
                                      <p className="text-[9px] font-bold text-zinc-800 uppercase tracking-widest">Connect to remote front office to access roster database</p>
                                   </div>
                                </div>
                             )}
                          </div>
                       </div>

                       <div className="flex flex-col items-center gap-8 pt-16">
                          <button 
                            disabled={!tradeUserPlayer || !tradeTargetPlayer}
                            onClick={handleTradeProposal}
                            className={`px-32 py-8 rounded-[3rem] font-black uppercase tracking-[0.6em] text-xs transition-all active:scale-95 shadow-[0_40px_100px_rgba(0,0,0,0.5)] ${tradeUserPlayer && tradeTargetPlayer ? 'bg-white text-black hover:bg-emerald-400 hover:shadow-[0_20px_60px_rgba(16,185,129,0.3)]' : 'bg-zinc-900 text-zinc-700 border border-zinc-800 opacity-50'}`}
                          >
                             {tradeUserPlayer && tradeTargetPlayer ? 'EXECUTE TRADE PROTOCOL' : 'AWAITING COMPLIANCE'}
                          </button>
                          <AnimatePresence>
                            {tradeUserPlayer && tradeTargetPlayer && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="flex flex-col items-center gap-3"
                              >
                                <div className="flex items-center gap-4 text-emerald-500">
                                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                   <p className="text-[10px] font-black uppercase tracking-[0.4em] italic">Negotiation Algorithm Analyzing Leverage...</p>
                                </div>
                                <div className="h-[2px] w-48 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                       </div>
                    </div>
                 )}

                 {marketSubTab === 'free_agency' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                       <div className="flex flex-col md:flex-row items-center gap-10 bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] shadow-[0_30px_80px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03),transparent)] pointer-events-none" />
                          <div className="w-20 h-20 bg-zinc-950 border border-zinc-800 rounded-[1.5rem] flex items-center justify-center text-zinc-500 shadow-inner shrink-0 relative z-10 group-focus-within:text-blue-500 transition-colors">
                             <Search size={32} />
                          </div>
                          <div className="flex-1 w-full relative z-10">
                             <div className="space-y-2 mb-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-600 italic">Database Scanner</h3>
                                <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">Global veteran scouting network active</p>
                             </div>
                             <input 
                               value={marketSearch}
                               onChange={(e) => setMarketSearch(e.target.value)}
                               placeholder="FILTER BY PLAYER NAME, POSITION, OR RATING..." 
                               className="bg-transparent border-none outline-none text-xl sm:text-3xl font-black uppercase tracking-[0.1em] text-white w-full placeholder:text-zinc-800 italic" 
                             />
                          </div>
                          <div className="shrink-0 flex items-center gap-6 relative z-10">
                             <div className="bg-zinc-950 px-10 py-7 rounded-[2rem] border-2 border-zinc-900 text-center shadow-inner">
                                <p className="text-[10px] font-black text-zinc-600 uppercase mb-2 italic tracking-widest">Cap Reserve</p>
                                <div className="flex items-baseline gap-2">
                                   <p className="text-3xl font-black italic text-amber-500 tabular-nums">${((SALARY_CAP - teamPayroll)/1000000).toFixed(2)}M</p>
                                   <span className="text-[9px] font-bold text-zinc-700 uppercase">Credits</span>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
                          {ALL_CARDS.filter(c => !(franchise.roster || []).includes(c.id))
                             .filter(c => c.name.toLowerCase().includes(marketSearch.toLowerCase()))
                             .slice(0, 18).map(card => {
                              const salary = (card.stats.ovr - 60) * 0.5 + 2;
                              const signFee = Math.floor(card.stats.ovr * 1500);
                              const teamPay = (franchise.roster || []).reduce((t, id) => t + (ALL_CARDS.find(c => c.id === id)?.stats.ovr ? (ALL_CARDS.find(c => c.id === id)!.stats.ovr - 60) * 0.5 + 2 : 0), 0);
                              const canAfford = franchise.budget >= signFee && (teamPay + salary <= SALARY_CAP);
                              
                              return (
                                <div key={card.id} className="relative group perspective-1000">
                                   <div className="transition-all duration-700 group-hover:rotate-y-12 group-hover:scale-105 group-hover:-translate-y-4">
                                      <CardItem card={card} isOwned={true} mode="mini" />
                                   </div>
                                   <div className="absolute inset-x-2 -bottom-2 bg-zinc-950 border-2 border-zinc-800 rounded-[2.5rem] p-6 opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-3xl z-30 translate-y-10 group-hover:translate-y-0 backdrop-blur-2xl bg-opacity-95">
                                      <div className="space-y-6 mb-6">
                                         <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                               <span className="text-[10px] font-black text-zinc-600 uppercase italic">Annual Hit</span>
                                               <span className="text-sm font-black italic text-white">${salary.toFixed(2)}M</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                               <span className="text-[10px] font-black text-zinc-600 uppercase italic">Agency Fee</span>
                                               <div className="flex items-baseline gap-1 text-emerald-500">
                                                  <DollarSign size={10} strokeWidth={4} />
                                                  <span className="text-sm font-black italic tabular-nums">{(signFee / 1000).toFixed(1)}K</span>
                                               </div>
                                            </div>
                                         </div>
                                         <div className="h-0.5 w-full bg-zinc-900 rounded-full" />
                                      </div>
                                      <button 
                                        disabled={!canAfford || franchise.roster.length >= 15}
                                        onClick={() => {
                                           const newContract: PlayerContract = {
                                             cardId: card.id,
                                             yearsLeft: 2,
                                             salary: salary,
                                             type: card.stats.ovr > 85 ? 'max' : 'mid-level',
                                             canExtend: false,
                                             canTrade: true
                                           };
                                           updateFranchise({
                                              budget: franchise.budget - signFee,
                                              roster: [...franchise.roster, card.id],
                                              contracts: [...(franchise.contracts || []), newContract]
                                           });
                                           setNews(prev => [`AGENT: ${card.name} has signed with ${teamData?.name}.`, ...prev].slice(0, 5));
                                        }}
                                        className="w-full py-4 bg-white text-black text-[10px] font-black uppercase rounded-2xl hover:bg-emerald-400 hover:shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all active:scale-95 disabled:opacity-30 disabled:hover:bg-white transition-all font-black"
                                      >
                                         Negotiate Terms
                                      </button>
                                   </div>
                                </div>
                              );
                           })}
                          {ALL_CARDS.filter(c => !franchise.roster.includes(c.id)).length === 0 && (
                            <div className="col-span-full py-20 text-center space-y-4">
                               <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center mx-auto text-zinc-700 shadow-inner">
                                  <Users size={40} />
                               </div>
                               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-800">No active candidates identified in search</p>
                            </div>
                          )}
                       </div>
                    </div>
                 )}
              </div>
            )}

            {activeTab === 'standings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 pb-32">
                {/* East Conference */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                     <div className="w-1.5 h-12 bg-blue-500 rounded-full" />
                     <div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Eastern Conference</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Atlantic, Central & Southeast divisions</p>
                     </div>
                  </div>
                  
                  <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none" />
                    <div className="grid grid-cols-10 p-6 border-b border-zinc-800 bg-black/40 text-[9px] font-black uppercase text-zinc-500 tracking-widest italic">
                       <div className="col-span-1">RK</div>
                       <div className="col-span-4">FRANCHISE</div>
                       <div className="col-span-1 text-center">W</div>
                       <div className="col-span-1 text-center">L</div>
                       <div className="col-span-1 text-center">GB</div>
                       <div className="col-span-2 text-right">PCT</div>
                    </div>
                    <div className="divide-y divide-zinc-800/40">
                      {franchise.conferenceStandings?.filter(s => s.conference === 'East').sort((a,b) => b.pct - a.pct).map((s, idx) => (
                        <div key={s.teamId} className={`grid grid-cols-10 p-5 items-center transition-colors group hover:bg-zinc-800/20 ${s.teamId === franchise.team ? 'bg-emerald-500/10 border-l-4 border-emerald-500' : ''}`}>
                           <div className="col-span-1 text-[11px] font-black text-zinc-700 italic group-hover:text-white transition-colors">{idx + 1}</div>
                           <div className="col-span-4 flex items-center gap-4">
                              <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center p-1.5 shrink-0 shadow-lg">
                                 <img src={getTeamLogo(s.teamId)} alt="Logo" className="w-full h-full object-contain" />
                              </div>
                              <span className="text-[11px] font-black uppercase italic tracking-tight text-zinc-300 truncate">{s.teamName}</span>
                           </div>
                           <div className="col-span-1 text-center text-[12px] font-black text-white">{s.wins}</div>
                           <div className="col-span-1 text-center text-[12px] font-bold text-zinc-600">{s.losses}</div>
                           <div className="col-span-1 text-center text-[10px] font-black text-emerald-500/60 group-hover:text-emerald-500">
                             {idx === 0 ? '--' : (franchise.conferenceStandings?.filter(cs => cs.conference === 'East')[0].wins - s.wins)}
                           </div>
                           <div className="col-span-2 text-right text-[11px] font-black text-zinc-400 tabular-nums italic">.{Math.round(s.pct * 1000).toString().padStart(3, '0')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* West Conference */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                     <div className="w-1.5 h-12 bg-red-500 rounded-full" />
                     <div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Western Conference</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Northwest, Pacific & Southwest divisions</p>
                     </div>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[100px] pointer-events-none" />
                    <div className="grid grid-cols-10 p-6 border-b border-zinc-800 bg-black/40 text-[9px] font-black uppercase text-zinc-500 tracking-widest italic">
                       <div className="col-span-1">RK</div>
                       <div className="col-span-4">FRANCHISE</div>
                       <div className="col-span-1 text-center">W</div>
                       <div className="col-span-1 text-center">L</div>
                       <div className="col-span-1 text-center">GB</div>
                       <div className="col-span-2 text-right">PCT</div>
                    </div>
                    <div className="divide-y divide-zinc-800/40">
                      {franchise.conferenceStandings?.filter(s => s.conference === 'West').sort((a,b) => b.pct - a.pct).map((s, idx) => (
                        <div key={s.teamId} className={`grid grid-cols-10 p-5 items-center transition-colors group hover:bg-zinc-800/20 ${s.teamId === franchise.team ? 'bg-emerald-500/10 border-l-4 border-emerald-500' : ''}`}>
                           <div className="col-span-1 text-[11px] font-black text-zinc-700 italic group-hover:text-white transition-colors">{idx + 1}</div>
                           <div className="col-span-4 flex items-center gap-4">
                              <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center p-1.5 shrink-0 shadow-lg">
                                 <img src={getTeamLogo(s.teamId)} alt="Logo" className="w-full h-full object-contain" />
                              </div>
                              <span className="text-[11px] font-black uppercase italic tracking-tight text-zinc-300 truncate">{s.teamName}</span>
                           </div>
                           <div className="col-span-1 text-center text-[12px] font-black text-white">{s.wins}</div>
                           <div className="col-span-1 text-center text-[12px] font-bold text-zinc-600">{s.losses}</div>
                           <div className="col-span-1 text-center text-[10px] font-black text-emerald-500/60 group-hover:text-emerald-500">
                             {idx === 0 ? '--' : (franchise.conferenceStandings?.filter(cs => cs.conference === 'West')[0].wins - s.wins)}
                           </div>
                           <div className="col-span-2 text-right text-[11px] font-black text-zinc-400 tabular-nums italic">.{Math.round(s.pct * 1000).toString().padStart(3, '0')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-8">
                     <div className="space-y-2">
                        <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Season Analytics</h2>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em]">Player Performance Metrics</p>
                     </div>
                     <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 px-6 py-3 rounded-2xl shadow-xl">
                        <BarChart3 size={18} className="text-blue-500" />
                        <span className="text-[10px] font-black uppercase text-zinc-400">Live Metric Simulation</span>
                     </div>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl relative">
                     <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[150px] pointer-events-none" />
                     
                     <div className="grid grid-cols-12 p-8 border-b border-zinc-800 bg-black/60 text-[9px] font-black uppercase text-zinc-600 tracking-[0.2em] italic relative z-10">
                        <div className="col-span-1">RK</div>
                        <div className="col-span-5">Player Entity</div>
                        <div className="col-span-1 text-center">GP</div>
                        <div className="col-span-1 text-center">TEAM</div>
                        <div className="col-span-2 text-center text-white">PPG</div>
                        <div className="col-span-1 text-center">RPG</div>
                        <div className="col-span-1 text-center">APG</div>
                     </div>

                     <div className="divide-y divide-zinc-800/20 max-h-[700px] overflow-y-auto no-scrollbar relative z-10">
                        {(franchise.playerSeasonStats || []).sort((a,b) => b.avgPts - a.avgPts).map((stat, idx) => (
                          <div key={stat.cardId} className="grid grid-cols-12 p-6 items-center hover:bg-zinc-800/40 transition-all group">
                             <div className="col-span-1">
                                <span className={`text-[12px] font-black italic ${idx < 3 ? 'text-white' : 'text-zinc-700'} group-hover:text-white transition-colors`}>
                                   {(idx + 1).toString().padStart(2, '0')}
                                </span>
                             </div>
                             <div className="col-span-5 flex items-center gap-5">
                                <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center p-1 border border-zinc-800 shadow-inner group-hover:scale-110 transition-transform">
                                   <img src={getTeamLogo(ALL_CARDS.find(c => c.id === stat.cardId)?.team || '')} className="w-full h-full object-contain opacity-40 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="space-y-0.5">
                                   <p className="text-sm font-black uppercase tracking-tight italic text-zinc-300 group-hover:text-white transition-colors underline-offset-4 group-hover:underline decoration-zinc-700">{stat.playerName}</p>
                                   <div className="flex items-center gap-2">
                                      <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{normalizePosition(ALL_CARDS.find(c => c.id === stat.cardId)?.position || '')}</span>
                                      <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Efficiency: {((stat.avgPts + stat.avgReb + stat.avgAst) / 3).toFixed(1)}</span>
                                   </div>
                                </div>
                             </div>
                             <div className="col-span-1 text-center tabular-nums text-xs font-bold text-zinc-600">{stat.gamesPlayed}</div>
                             <div className="col-span-1 text-center">
                                <span className="bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800 text-[10px] font-black italic text-zinc-500 group-hover:text-zinc-200 transition-colors uppercase">{stat.teamAbbr}</span>
                             </div>
                             <div className="col-span-2 text-center">
                                <span className="text-xl font-black italic text-white tabular-nums group-hover:scale-110 inline-block transition-transform">{stat.avgPts.toFixed(1)}</span>
                             </div>
                             <div className="col-span-1 text-center tabular-nums text-xs font-black text-zinc-400 group-hover:text-zinc-200 transition-colors">{stat.avgReb.toFixed(1)}</div>
                             <div className="col-span-1 text-center tabular-nums text-xs font-black text-zinc-400 group-hover:text-zinc-200 transition-colors">{stat.avgAst.toFixed(1)}</div>
                          </div>
                        ))}
                        {(!franchise.playerSeasonStats || franchise.playerSeasonStats.length === 0) && (
                          <div className="py-48 text-center space-y-6">
                             <div className="w-20 h-20 bg-zinc-950 rounded-[2rem] flex items-center justify-center mx-auto text-zinc-800 border border-zinc-900 shadow-inner">
                                <BarChart3 size={40} />
                             </div>
                             <div className="space-y-2">
                                <p className="text-zinc-600 font-black uppercase tracking-[0.4em] text-[10px]">No statistical data accumulated.</p>
                                <p className="text-zinc-800 text-[8px] font-bold uppercase tracking-widest leading-relaxed">Play games to populate centralized performance database</p>
                             </div>
                          </div>
                        )}
                     </div>
                  </div>
              </div>
            )}

            {activeTab === 'mgmt' && (
              <div className="space-y-12 pb-32">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    {[
                       { id: 'coaching', label: 'Tactical Analytics', icon: Target, val: franchise.upgrades.coaching, color: 'text-orange-500', bg: 'bg-orange-500/10', desc: 'Optimize playbook and offensive execution flow.' },
                       { id: 'scouting', label: 'Global Intel', icon: Search, val: franchise.upgrades.scouting, color: 'text-blue-500', bg: 'bg-blue-500/10', desc: 'Expand recruitment database and prospect depth.' },
                       { id: 'training', label: 'Performance Lab', icon: Activity, val: franchise.upgrades.training, color: 'text-purple-500', bg: 'bg-purple-500/10', desc: 'Maximize genetic potential and injury recovery.' },
                       { id: 'facilities', label: 'Fan Experience', icon: Building, val: franchise.upgrades.facilities, color: 'text-emerald-500', bg: 'bg-emerald-500/10', desc: 'Modernize stadium to driving revenue and loyalty.' },
                     ].map(u => (
                       <div key={u.id} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-8 flex flex-col group transition-all hover:bg-zinc-900/80 shadow-2xl relative overflow-hidden">
                          <div className={`absolute top-0 right-0 w-24 h-24 ${u.bg} blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity`} />
                          
                          <div className="flex items-center justify-between relative z-10">
                             <div className={`w-14 h-14 rounded-2xl ${u.bg} flex items-center justify-center ${u.color} shadow-inner`}>
                                <u.icon size={28} />
                             </div>
                             <div className="text-right">
                                <span className="text-[9px] font-black uppercase text-zinc-600 italic tracking-[0.2em]">Rank</span>
                                <p className="text-2xl font-black italic text-zinc-400">0{u.val}</p>
                             </div>
                          </div>

                          <div className="space-y-2 relative z-10">
                             <h4 className="text-lg font-black uppercase italic tracking-tighter text-white">{u.label}</h4>
                             <p className="text-[10px] font-bold text-zinc-500 leading-relaxed min-h-[3rem] line-clamp-2">{u.desc}</p>
                          </div>

                          <div className="space-y-5 relative z-10 mt-auto">
                             <div className="flex gap-1.5 h-1.5">
                                {[...Array(10)].map((_, i) => (
                                  <div key={i} className={`flex-1 rounded-full transition-all duration-500 ${i < u.val ? (i === u.val - 1 ? 'bg-zinc-100 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-zinc-700') : 'bg-zinc-950 shadow-inner'}`} />
                                ))}
                             </div>
                             <button 
                               onClick={() => {
                                  const cost = u.val * 100000;
                                  if (franchise.budget >= cost && u.val < 10) {
                                     updateFranchise({
                                        budget: franchise.budget - cost,
                                        upgrades: { ...franchise.upgrades, [u.id]: u.val + 1 }
                                     });
                                  }
                               }}
                               disabled={franchise.budget < u.val * 100000 || u.val >= 10}
                               className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all disabled:opacity-10 hover:bg-zinc-200 shadow-xl group-hover:scale-[1.02] active:scale-95"
                             >
                                Upgrade · ${(u.val * 100).toFixed(0)}K
                             </button>
                          </div>
                       </div>
                     ))}
                 </div>

                 {/* Action Cards Grid */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 flex flex-col sm:flex-row gap-10 items-center shadow-2xl relative overflow-hidden group">
                       <div className="absolute inset-0 bg-red-500/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                       <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 shadow-2xl relative z-10 group-hover:scale-105 transition-transform">
                          <Zap size={56} className="text-red-500" fill="currentColor" />
                       </div>
                       <div className="space-y-6 relative z-10 flex-1">
                          <div className="space-y-2">
                             <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                <h4 className="text-2xl font-black uppercase italic tracking-tighter text-white">Advanced Cryo-Recovery</h4>
                             </div>
                             <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest italic">Emergency Medical Protocol</p>
                          </div>
                          <p className="text-xs text-zinc-500 leading-relaxed">Instantly restore 30% energy across entire active roster. Vital for post-intensity recovery cycles.</p>
                          <button 
                             onClick={() => {
                                const cost = 50000;
                                if (franchise.budget >= cost) {
                                   const newEnergy = { ...(franchise.playerEnergy || {}) };
                                   franchise.roster.forEach(id => {
                                      newEnergy[id] = Math.min(100, (newEnergy[id] ?? 100) + 30);
                                   });
                                   updateFranchise({ budget: franchise.budget - cost, playerEnergy: newEnergy });
                                }
                             }}
                             disabled={franchise.budget < 50000}
                             className="px-10 py-5 bg-red-500 hover:bg-red-400 text-white rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] shadow-[0_15px_40px_rgba(239,68,68,0.2)] transition-all active:scale-95 disabled:opacity-20 flex items-center gap-3"
                          >
                             Execute Process · $50K
                          </button>
                       </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 flex flex-col sm:flex-row gap-10 items-center shadow-2xl relative overflow-hidden group">
                       <div className="absolute inset-0 bg-amber-500/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                       <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 shadow-2xl relative z-10 group-hover:scale-105 transition-transform">
                          <Users size={56} className="text-amber-500" />
                       </div>
                       <div className="space-y-6 relative z-10 flex-1">
                          <div className="space-y-2">
                             <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <h4 className="text-2xl font-black uppercase italic tracking-tighter text-white">Press Conference</h4>
                             </div>
                             <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest italic">Strategic PR Management</p>
                          </div>
                          <p className="text-xs text-zinc-500 leading-relaxed">Host a media event to handle fan expectations and boost morale. Increases Fan Support by 15%.</p>
                          <button 
                             onClick={() => {
                                const cost = 25000;
                                if (franchise.budget >= cost) {
                                   updateFranchise({ 
                                      budget: franchise.budget - cost, 
                                      fanSupport: Math.min(100, (franchise.fanSupport || 50) + 15) 
                                   });
                                }
                             }}
                             disabled={franchise.budget < 25000}
                             className="px-10 py-5 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] shadow-[0_15px_40px_rgba(245,158,11,0.2)] transition-all active:scale-95 disabled:opacity-20 flex items-center gap-3"
                          >
                             Schedule Meet · $25K
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'league' && (
               <div className="space-y-12 pb-32">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-8">
                     <div className="space-y-2">
                        <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Daily Recap</h2>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em]">Session: {franchise.currentDate}</p>
                     </div>
                     <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 px-6 py-3 rounded-2xl">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase text-zinc-400">Live Archives Sync</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {(() => {
                        const yesterday = new Date(new Date(franchise.currentDate || '2025-10-22').getTime() - 86400000).toISOString().split('T')[0];
                        const results = franchise.leagueHistory?.[yesterday] || [];
                        
                        if (results.length === 0) return (
                          <div className="col-span-full py-40 text-center space-y-4">
                             <div className="w-20 h-20 bg-zinc-950 rounded-3xl flex items-center justify-center mx-auto text-zinc-800 border border-zinc-900">
                                <Activity size={40} />
                             </div>
                             <p className="text-zinc-700 font-black uppercase tracking-[0.4em] text-[10px]">No historical data found for previous cycle.</p>
                          </div>
                        );

                        return results.map((game, i) => (
                           <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden group hover:border-zinc-500 transition-all shadow-2xl relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                              
                              <div className="p-8 space-y-8 relative z-10">
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                       <div className="w-14 h-14 bg-zinc-950 rounded-2xl p-2 flex items-center justify-center border border-zinc-800 shadow-inner group-hover:scale-105 transition-transform">
                                          <img src={getTeamLogo(game.away)} className="w-full h-full object-contain" />
                                       </div>
                                       <div>
                                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest italic">Visitor</p>
                                          <p className="text-xl font-black italic text-white leading-tight">{game.away.split(' ').pop()}</p>
                                       </div>
                                    </div>
                                    <div className={`text-4xl font-black italic tracking-tighter ${game.awayScore > game.homeScore ? 'text-white' : 'text-zinc-700'}`}>{game.awayScore}</div>
                                 </div>

                                 <div className="flex items-center gap-4 px-2">
                                    <div className="flex-1 h-px bg-zinc-800" />
                                    <div className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em] italic">Final</div>
                                    <div className="flex-1 h-px bg-zinc-800" />
                                 </div>

                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                       <div className="w-14 h-14 bg-zinc-950 rounded-2xl p-2 flex items-center justify-center border border-zinc-800 shadow-inner group-hover:scale-105 transition-transform">
                                          <img src={getTeamLogo(game.home)} className="w-full h-full object-contain" />
                                       </div>
                                       <div>
                                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest italic">Home</p>
                                          <p className="text-xl font-black italic text-white leading-tight">{game.home.split(' ').pop()}</p>
                                       </div>
                                    </div>
                                    <div className={`text-4xl font-black italic tracking-tighter ${game.homeScore > game.awayScore ? 'text-white' : 'text-zinc-700'}`}>{game.homeScore}</div>
                                 </div>
                              </div>
                              
                              <div className="bg-zinc-950 border-t border-zinc-800 p-4 flex items-center justify-center">
                                 <span className="text-[7px] font-black text-zinc-600 uppercase tracking-[0.5em]">Game Archives Reference: {i+1}</span>
                              </div>
                           </div>
                        ));
                     })()}
                  </div>
               </div>
            )}

            {activeTab === 'settings' && (
               <div className="max-w-2xl mx-auto space-y-12 py-12">
                  <div className="space-y-4">
                     <h2 className="text-4xl font-black uppercase italic tracking-tighter">Franchise State</h2>
                     <p className="text-zinc-500 text-sm">Manage your career progression and save data.</p>
                  </div>

                  <div className="space-y-4">
                     <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] space-y-6">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center">
                              <LogOut size={28} />
                           </div>
                           <div>
                              <h4 className="text-xl font-black uppercase italic">Reset Career</h4>
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">This action is irreversible</p>
                           </div>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed">Starting a new game will wipe all progression, collection in franchise mode, and standings. Coins and items in your global inventory are preserved.</p>
                        <button 
                           onClick={handleRetire}
                           className="w-full py-5 bg-red-500 hover:bg-red-400 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all active:scale-95"
                        >
                           Retire & New Game
                        </button>
                     </div>

                     <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 bg-zinc-800 text-zinc-400 rounded-2xl flex items-center justify-center">
                              <HelpCircle size={28} />
                           </div>
                           <div>
                              <h4 className="text-xl font-black uppercase italic">Franchise Help</h4>
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tutorial & FAQ</p>
                           </div>
                        </div>
                        <button className="p-4 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors">
                           <ChevronRight size={20} />
                        </button>
                     </div>
                  </div>
               </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Roster Picker Overlay */}
      <AnimatePresence>
        {showPicker && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col pt-24 px-6 pb-12">
             <div className="max-w-6xl mx-auto w-full space-y-6">
                <div className="flex items-center justify-between">
                   <h2 className="text-2xl font-black uppercase italic tracking-tighter">Assign Starter: {showPicker.pos}</h2>
                   <button onClick={() => setShowPicker(null)} className="p-3 bg-zinc-900 rounded-full hover:bg-zinc-800"><Zap size={20} /></button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 overflow-y-auto max-h-[70vh] no-scrollbar">
                   {(franchise.roster || []).map(id => {
                      const card = ALL_CARDS.find(c => c.id === id);
                      if (!card) return null;
                      const energy = franchise.playerEnergy?.[id] ?? 100;
                      return (
                        <div key={id} onClick={() => {
                          updateFranchise({ lineup: { ...franchise.lineup, [showPicker.pos]: id } });
                          setShowPicker(null);
                        }} className="cursor-pointer hover:scale-105 transition-transform relative">
                          <CardItem card={card} isOwned={true} mode="mini" />
                          <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[6px] font-black uppercase ${energy < 50 ? 'bg-red-500 text-white' : 'bg-zinc-900 text-zinc-400'}`}>
                            {Math.round(energy)}% ENRG
                          </div>
                        </div>
                      );
                   })}
                   {(franchise.roster || []).length === 0 && <p className="col-span-full text-center py-20 text-zinc-600 font-black uppercase">No players in roster. Sign some from the market!</p>}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Modal */}
      <AnimatePresence>
        {matchResult && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 z-[300] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6">
             <motion.div initial={{ scale:0.9, y:20 }} animate={{ scale:1, y:0 }} className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh]">
                <div className={`p-10 text-center space-y-4 ${matchResult.result === 'W' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                   <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl ${matchResult.result === 'W' ? 'bg-emerald-500':'bg-red-500'}`}>
                      <h2 className="text-5xl font-black text-white italic">{matchResult.result}</h2>
                   </div>
                   <div>
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{matchResult.result === 'W' ? 'VICTORY' : 'DEFEAT'}</h3>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-2">{matchResult.opponentTeam} · {matchResult.score?.[0]}-{matchResult.score?.[1]}</p>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 italic">Game MVP</h4>
                         <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Player of the Game</span>
                      </div>
                      <div className="p-4 bg-zinc-900 rounded-2xl flex items-center justify-between border border-emerald-500/20">
                         <span className="font-black italic uppercase text-white">{matchResult.mvp}</span>
                         <Star size={16} className="text-amber-500" fill="currentColor" />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 italic">Team Box Score</h4>
                      <div className="rounded-2xl border border-zinc-800 overflow-hidden">
                         <div className="grid grid-cols-12 p-3 bg-zinc-900 text-[8px] font-black uppercase text-zinc-600 tracking-tighter">
                            <div className="col-span-5">Player</div>
                            <div className="col-span-2 text-center">MIN</div>
                            <div className="col-span-2 text-center">PTS</div>
                            <div className="col-span-1 text-center">REB</div>
                            <div className="col-span-1 text-center">AST</div>
                            <div className="col-span-1 text-center">+/-</div>
                         </div>
                         <div className="divide-y divide-zinc-800">
                            {matchResult.boxScore?.map((p: BoxScorePlayer) => (
                              <div key={p.cardId} className="grid grid-cols-12 p-3 items-center text-[9px] font-bold">
                                 <div className="col-span-5 text-white italic uppercase truncate">{p.name}</div>
                                 <div className="col-span-2 text-center text-zinc-500">{p.minutes}</div>
                                 <div className="col-span-2 text-center font-black">{p.pts}</div>
                                 <div className="col-span-1 text-center">{p.reb}</div>
                                 <div className="col-span-1 text-center">{p.ast}</div>
                                 <div className={`col-span-1 text-center font-black ${p.plusMinus > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {p.plusMinus > 0 ? '+' : ''}{p.plusMinus}
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="p-8 bg-zinc-950 border-t border-zinc-900">
                   <button onClick={() => setMatchResult(null)} className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl active:scale-95 transition-all">Advance Schedule</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Post Game Recap Modal */}
      <AnimatePresence>
        {showRecap && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
          >
            <motion.div 
              style={{ borderColor: primaryColor }}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-4xl bg-zinc-900 border-t-4 rounded-[3rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2">
                 <div className="p-12 space-y-8 bg-gradient-to-br from-zinc-900 to-black">
                    <div className="flex items-center justify-between">
                       <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${showRecap.isWin ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}>
                          {showRecap.isWin ? 'Final Victory' : 'Tough Loss'}
                       </span>
                       <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Regular Season</span>
                    </div>

                    <div className="flex items-center justify-between items-end">
                       <div className="text-center space-y-4">
                          <img src={getTeamLogo(franchise.team || 'LAL')} className="w-20 h-20 mx-auto drop-shadow-2xl" />
                          <h2 className="text-6xl font-black italic tracking-tighter">{showRecap.userScore}</h2>
                       </div>
                       <div className="text-3xl font-black italic text-zinc-800 pb-2">VS</div>
                       <div className="text-center space-y-4">
                          <img src={getTeamLogo(showRecap.opponentAbbr)} className="w-20 h-20 mx-auto drop-shadow-2xl opacity-60" />
                          <h2 className="text-6xl font-black italic tracking-tighter text-zinc-600">{showRecap.oppScore}</h2>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-zinc-800/40 rounded-2xl border border-zinc-800">
                          <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">Fan Impact</p>
                          <p className={`text-xl font-black italic ${showRecap.isWin ? 'text-emerald-500': 'text-red-500'}`}>
                             {showRecap.isWin ? '+3%' : '-2%'} Support
                          </p>
                       </div>
                       <div className="p-4 bg-zinc-800/40 rounded-2xl border border-zinc-800">
                          <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">Revenue</p>
                          <p className="text-xl font-black italic text-amber-500">+${showRecap.income / 1000}K</p>
                       </div>
                    </div>

                    <button 
                      onClick={() => setShowRecap(null)}
                      style={{ backgroundColor: primaryColor }}
                      className="w-full py-6 rounded-2xl text-black font-black uppercase tracking-[0.4em] text-xs shadow-2xl hover:brightness-110 active:scale-95 transition-all"
                    >
                       Continue Season
                    </button>
                 </div>

                 <div className="bg-zinc-800/30 p-12 space-y-8 border-l border-zinc-800/50">
                    <div className="flex items-center gap-3">
                       <Star size={20} className="text-amber-500" />
                       <h3 className="text-lg font-black uppercase italic tracking-tight">Player of the Game</h3>
                    </div>

                    <div className="flex items-center gap-6 p-6 bg-zinc-900 border border-zinc-800 rounded-3xl">
                       <div className="w-24 h-24 bg-zinc-800 rounded-2xl flex-shrink-0">
                          <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${showRecap.mvp?.nbaId || '977'}.png`} className="w-full h-full object-cover rounded-2xl" />
                       </div>
                       <div>
                          <p className="text-xl font-black italic tracking-tight leading-tight">{showRecap.mvp?.name}</p>
                          <div className="grid grid-cols-3 gap-4 mt-3">
                             <div className="text-center">
                                <p className="text-[8px] font-black text-zinc-500 uppercase">PTS</p>
                                <p className="text-lg font-black italic">{showRecap.mvp?.pts}</p>
                             </div>
                             <div className="text-center">
                                <p className="text-[8px] font-black text-zinc-500 uppercase">REB</p>
                                <p className="text-lg font-black italic">{showRecap.mvp?.reb}</p>
                             </div>
                             <div className="text-center">
                                <p className="text-[8px] font-black text-zinc-500 uppercase">AST</p>
                                <p className="text-lg font-black italic">{showRecap.mvp?.ast}</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Top Performers</h4>
                       <div className="space-y-2">
                          {(showRecap.stats || showRecap.boxScore || []).slice(0, 3).map((p: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-zinc-800/50">
                               <span className="font-bold text-zinc-400">{p.name}</span>
                               <span className="font-black italic text-zinc-200">{p.pts} PTS · {p.reb} REB · {p.ast} AST</span>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CareerView;
