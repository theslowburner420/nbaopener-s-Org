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
  Monitor,
  Settings as SettingsIcon,
  HelpCircle,
  LogOut,
  Maximize2,
  X,
  ChevronLeft,
  Plus
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

const simulateBoxScore = (lineup: Record<string, string | null>, roster: string[], isUser: boolean, playerEnergy: Record<string, number> = {}): BoxScorePlayer[] => {
  const boxScore: BoxScorePlayer[] = [];
  const starterIds = Object.values(lineup).filter(Boolean) as string[];
  const benchIds = roster.filter(id => !starterIds.includes(id)).slice(0, 5); // Take top 5 bench
  
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
  team1: any; 
  team2: any; 
  team1OVR: number;
  team2OVR: number;
  onFinish: (result: any) => void;
}> = ({ show, team1, team2, team1OVR, team2OVR, onFinish }) => {
  const [phase, setPhase] = useState<'pre' | 'sim' | 'final'>('pre');
  const [currentQuarter, setCurrentQuarter] = useState(1);
  const [timer, setTimer] = useState("12:00");
  const [scores, setScores] = useState({ s1: 0, s2: 0 });
  const [feed, setFeed] = useState<string[]>([]);
  const [ballPos, setBallPos] = useState({ x: 50, y: 50 });
  const [isClutch, setIsClutch] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!show) {
      setPhase('pre');
      setCurrentQuarter(1);
      setTimer("12:00");
      setScores({ s1: 0, s2: 0 });
      setFeed([]);
      setIsClutch(false);
      return;
    }

    // Phase 1: Pre-match (5 seconds)
    const preTimer = setTimeout(() => {
      setPhase('sim');
    }, 5000);

    return () => clearTimeout(preTimer);
  }, [show]);

  useEffect(() => {
    if (phase !== 'sim' || !show) return;

    let q = currentQuarter;
    let s1 = scores.s1;
    let s2 = scores.s2;
    let totalSeconds = 12 * 60;
    let currentSeconds = totalSeconds;
    
    // Total sim time per quarter = 10s
    // Update every 200ms
    const updateRate = 200;
    const tickSeconds = (totalSeconds / (10000 / updateRate));

    const interval = setInterval(() => {
      currentSeconds -= tickSeconds;
      if (currentSeconds <= 0) {
        if (q < 4) {
          q++;
          currentSeconds = totalSeconds;
          setCurrentQuarter(q);
          setFeed(prev => [`📊 End of Q${q-1} — ${team1.id} ${s1}, ${team2.id} ${s2}`, ...prev]);
        } else {
          clearInterval(interval);
          setPhase('final');
          return;
        }
      }

      // Update timer display
      const displayMins = Math.floor(currentSeconds / 60);
      const displaySecs = Math.floor(currentSeconds % 60);
      setTimer(`${displayMins}:${displaySecs.toString().padStart(2, '0')}`);
      setProgress(((totalSeconds - currentSeconds) / totalSeconds) * 100);

      // Clutch check (Q4, last 2 mins, diff <= 5)
      if (q === 4 && (currentSeconds / 60) <= 2 && Math.abs(s1 - s2) <= 5) {
        setIsClutch(true);
      } else {
        setIsClutch(false);
      }

      // Live play chance
      if (Math.random() > 0.75) {
        const ovrRatio = team1OVR / team2OVR;
        const pts1 = Math.random() < (0.45 * ovrRatio) ? (Math.random() > 0.7 ? 3 : 2) : 0;
        const pts2 = Math.random() < (0.45 / ovrRatio) ? (Math.random() > 0.7 ? 3 : 2) : 0;
        
        s1 += pts1;
        s2 += pts2;
        setScores({ s1, s2 });

        // Ball movement
        setBallPos({
          x: 20 + Math.random() * 60,
          y: 20 + Math.random() * 60
        });

        if (pts1 > 0 || pts2 > 0) {
          const names = ["LeBron", "Curry", "Luka", "Giannis", "Joker", "KD", "Embiid", "Tatum", "Edwards", "Shai"];
          const name = names[Math.floor(Math.random() * names.length)];
          const teamId = pts1 > 0 ? team1.id : team2.id;
          
          let action = "";
          if (pts1 === 3 || pts2 === 3) {
            action = `🔥 ${name} BURIES the three!`;
          } else {
            const randomAction = [
              `🏀 ${name} with the floater`,
              `💥 ${name} THROWS IT DOWN — and-one!`,
              `🎯 ${name} hits the pull-up mid-range`,
              `🏆 ${name} with the and-one layup`
            ][Math.floor(Math.random() * 4)];
            action = randomAction;
          }

          setFeed(prev => [`${action} — ${team1.id} ${s1}, ${team2.id} ${s2}`, ...prev]);
        } else {
            // Defensive or pass play
            const name = ["LeBron", "Curry", "Luka", "Giannis"][Math.floor(Math.random() * 4)];
            const defPlays = [
              `🛡️ ${name} with the BLOCK — ball stays here!`,
              `✋ ${name} steals it — fast break!`,
              `👁️ ${name} thread the needle for an open miss`,
              `📐 ${name} draws the charge!`
            ];
            if (Math.random() > 0.8) {
               setFeed(prev => [defPlays[Math.floor(Math.random() * defPlays.length)], ...prev]);
            }
        }
      }

    }, updateRate);

    return () => clearInterval(interval);
  }, [phase, show, team1, team2, team1OVR, team2OVR]);

  if (!show) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ 
        opacity: 1,
        backgroundColor: isClutch ? "rgba(70, 0, 0, 0.95)" : "rgba(0, 0, 0, 1)"
      }}
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden transition-colors duration-1000`}
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] scale-150" />
      </div>

      <AnimatePresence mode="wait">
        {phase === 'pre' && (
          <motion.div 
            key="pre"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center gap-12 z-10 w-full max-w-4xl p-8"
          >
            <div className="flex items-center justify-between w-full">
              <motion.div 
                initial={{ x: -100, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center space-y-6"
              >
                <div className="w-40 h-40 bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 shadow-2xl flex items-center justify-center">
                  <img src={getTeamLogo(team1.id)} className="w-full h-full object-contain" />
                </div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">{team1.name}</h3>
                <div className="text-zinc-500 font-black text-xl">OVR {team1OVR}</div>
              </motion.div>

              <div className="text-center relative">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ type: 'spring', damping: 10, delay: 0.8 }}
                  className="text-6xl font-black italic text-zinc-800"
                >
                  VS
                </motion.div>
                <div className="mt-8">
                  <p className="text-[10px] font-black tracking-[0.5em] text-zinc-500 uppercase">Win Probability</p>
                  <div className="w-64 h-2 bg-zinc-900 rounded-full mt-4 overflow-hidden border border-zinc-800">
                    <motion.div 
                      initial={{ width: "50%" }}
                      animate={{ width: `${(team1OVR / (team1OVR + team2OVR)) * 100}%` }}
                      transition={{ duration: 2, delay: 1 }}
                      className="h-full bg-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <motion.div 
                initial={{ x: 100, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center space-y-6"
              >
                <div className="w-40 h-40 bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 shadow-2xl flex items-center justify-center">
                  <img src={getTeamLogo(team2.id)} className="w-full h-full object-contain" />
                </div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">{team2.name}</h3>
                <div className="text-zinc-500 font-black text-xl">OVR {team2OVR}</div>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 50 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 1.5 }}
              className="grid grid-cols-2 gap-12 w-full bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-[3rem]"
            >
              <div className="space-y-4">
                 <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Starters — {team1.id}</p>
                 <div className="space-y-2">
                    {["Luka Doncic", "Kyrie Irving", "Klay Thompson", "PJ Washington", "Dereck Lively"].map((p, i) => (
                      <div key={i} className="flex justify-between items-center text-sm font-bold italic text-zinc-300">
                        <span>{p}</span>
                        <span className="text-zinc-600">OVR {85 + i}</span>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="space-y-4 text-right">
                 <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Starters — {team2.id}</p>
                 <div className="space-y-2">
                    {["Jayson Tatum", "Jaylen Brown", "Derrick White", "Jrue Holiday", "KP"].map((p, i) => (
                      <div key={i} className="flex justify-between items-center text-sm font-bold italic text-zinc-300 flex-row-reverse">
                        <span>{p}</span>
                        <span className="text-zinc-600">OVR {86 + i}</span>
                      </div>
                    ))}
                 </div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ opacity: [1, 0.5, 1] }} 
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-4xl font-black italic text-white"
            >
              TIP OFF IN 3...
            </motion.div>
          </motion.div>
        )}

        {phase === 'sim' && (
          <motion.div 
            key="sim"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col w-full h-full p-6 md:p-12 gap-8 z-10"
          >
            {/* Header: Scoreboard */}
            <div className="flex items-center justify-center gap-12">
               <div className="flex items-center gap-6">
                  <img src={getTeamLogo(team1.id)} className="w-16 h-16 object-contain" />
                  <span className="text-7xl font-black italic text-white tabular-nums drop-shadow-2xl">{scores.s1}</span>
               </div>
               <div className="bg-zinc-900 border border-zinc-800 px-8 py-4 rounded-3xl text-center shadow-2xl">
                  <div className="text-emerald-500 text-xs font-black uppercase tracking-widest mb-1">Q{currentQuarter}</div>
                  <div className="text-3xl font-black italic text-white tabular-nums">{timer}</div>
               </div>
               <div className="flex items-center gap-6">
                  <span className="text-7xl font-black italic text-white tabular-nums drop-shadow-2xl">{scores.s2}</span>
                  <img src={getTeamLogo(team2.id)} className="w-16 h-16 object-contain" />
               </div>
            </div>

            {/* Central: Court SVG */}
            <div className="flex-1 relative bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden group shadow-2xl shadow-emerald-500/5">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-zinc-800/30" />
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-zinc-800/30" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-zinc-800/30 rounded-full" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 border-x border-b border-zinc-800/30 rounded-b-3xl" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-32 border-x border-t border-zinc-800/30 rounded-t-3xl" />

                {/* Animated Ball */}
                <motion.div 
                  animate={{ x: `${ballPos.x}%`, y: `${ballPos.y}%` }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="absolute w-4 h-4 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.8)] z-20"
                />

                {/* Clutch Overlay */}
                {isClutch && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-red-600/20 pointer-events-none"
                  />
                )}
            </div>

            {/* Footer: Live Feed */}
            <div className="h-48 bg-zinc-950/80 backdrop-blur-md rounded-[2.5rem] border border-zinc-800 p-6 overflow-hidden flex flex-col relative">
                <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-zinc-950 to-transparent z-10" />
                <div className="flex-1 overflow-y-auto space-y-3 pt-4 no-scrollbar">
                   <AnimatePresence mode="popLayout">
                      {feed.map((line, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: -20, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          className={`p-3 rounded-xl font-bold italic text-sm ${line.includes('End of Q') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'text-zinc-300'}`}
                        >
                          {line}
                        </motion.div>
                      ))}
                   </AnimatePresence>
                </div>
            </div>
          </motion.div>
        )}

        {phase === 'final' && (
          <motion.div 
            key="final"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-12 z-10"
          >
            <motion.div 
              initial={{ opacity: 0, y: -50 }} 
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="text-xl font-black uppercase tracking-[0.6em] text-zinc-500 mb-4">MATCH FINISHED</div>
              <h2 className="text-9xl font-black italic text-white uppercase tracking-tighter drop-shadow-2xl">FINAL</h2>
            </motion.div>

            <div className="flex items-center gap-16">
              <div className="text-center space-y-4">
                 <img src={getTeamLogo(team1.id)} className="w-24 h-24 object-contain mx-auto" />
                 <div className="text-8xl font-black italic text-white">{scores.s1}</div>
              </div>
              <div className="text-4xl font-black text-zinc-800 italic">VS</div>
              <div className="text-center space-y-4">
                 <img src={getTeamLogo(team2.id)} className="w-24 h-24 object-contain mx-auto" />
                 <div className="text-8xl font-black italic text-white">{scores.s2}</div>
              </div>
            </div>

            <motion.button 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 1 }}
              onClick={() => onFinish({ s1: scores.s1, s2: scores.s2 })}
              className="bg-white text-black px-12 py-6 rounded-full font-black uppercase tracking-[0.2em] text-sm hover:scale-110 transition-all hover:bg-emerald-500"
            >
              VIEW FULL BOX SCORE
            </motion.button>
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

const CareerView: React.FC = () => {
  const { franchise, startFranchise, updateFranchise, updateGameStateAsync, addCoins, collection, setCurrentView } = useGame();
  
  const teamData = useMemo(() => 
    franchise ? NBA_TEAMS.find(t => t.id === franchise.team) : null,
    [franchise]
  );

  const nextGame = useMemo(() => 
    franchise?.schedule?.find(m => !m.played),
    [franchise?.schedule]
  );

  const opponentData = useMemo(() => 
    nextGame ? NBA_TEAMS.find(t => t.id === nextGame.opponentAbbr) : null,
    [nextGame]
  );

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

  const handleBack = () => {
    setCurrentView('home');
  };

  const handleRetire = async () => {
    // Hard reset the franchise state in the global context
    setIsSimulating(true);
    await updateGameStateAsync({ franchise: undefined });
    setIsSimulating(false);
    window.location.reload(); // Force reload to ensure clean state
  };

  const teamPayroll = useMemo(() => {
    if (!franchise) return 0;
    return franchise.roster.reduce((total, id) => {
      const card = ALL_CARDS.find(c => c.id === id);
      return total + (card ? getPlayerSalary(card) : 0);
    }, 0);
  }, [franchise]);

  const streak = useMemo(() => {
    const list = [...(franchise?.schedule || [])].filter(m => m.played).reverse();
    if (list.length === 0) return '0-0';
    const firstResult = list[0].result;
    let count = 0;
    for (const m of list) {
       if (m.result === firstResult) count++;
       else break;
    }
    return `${count}${firstResult}`;
  }, [franchise?.schedule]);

  const avgEnergy = useMemo(() => {
    const values = Object.values(franchise?.playerEnergy || {}) as number[];
    if (values.length === 0) return 100;
    return Math.round(values.reduce((a, b) => a + b, 0) / (values.length || 1));
  }, [franchise?.playerEnergy, franchise?.roster?.length]);

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

  // 2. Calculations
  const teamOVR = useMemo(() => {
    if (!franchise?.lineup) return 0;
    
    // Starters OVR
    const starterIds = Object.values(franchise.lineup).filter(Boolean) as string[];
    const starters = starterIds.map(id => ALL_CARDS.find(c => c.id === id)).filter(Boolean) as Card[];
    
    if (starters.length === 0) return 60;
    
    const sOVR = starters.reduce((acc, c) => acc + c.stats.ovr, 0) / starters.length;
    
    // Bench OVR (from roster excluding starters)
    const benchIds = franchise.roster.filter(id => !starterIds.includes(id));
    const bench = benchIds.map(id => ALL_CARDS.find(c => c.id === id)).filter(Boolean) as Card[];
    const bOVR = bench.length > 0 
      ? bench.reduce((acc, c) => acc + c.stats.ovr, 0) / bench.length 
      : sOVR - 10;

    const base = sOVR * 0.7 + bOVR * 0.3;
    
    // Synergy Bonuses
    let synergyBonus = 0;
    
    // 1. Same Team Trio
    const teamCounts: Record<string, number> = {};
    starters.forEach(c => {
       teamCounts[c.teamAbbr] = (teamCounts[c.teamAbbr] || 0) + 1;
    });
    const hasTrio = Object.values(teamCounts).some(count => count >= 3);
    if (hasTrio) synergyBonus += 3;

    // 2. Inside-Out (PG Ast > 85, C Blk > 80)
    const pg = starters.find(c => normalizePosition(c.position) === 'PG');
    const center = starters.find(c => normalizePosition(c.position) === 'C');
    if (pg && center && pg.stats.assists >= 85 && center.stats.rebounds >= 80) {
       synergyBonus += 5;
    }

    // 3. Star Power
    const hasStar = starters.some(c => c.rarity === 'franchise');
    if (hasStar) synergyBonus += 2;
    
    // Upgrades
    const coachingBonus = (franchise.upgrades.coaching - 1) * 0.8;
    const trainingBonus = (franchise.upgrades.training - 1) * 0.5;
    
    return Math.round(base + coachingBonus + trainingBonus + synergyBonus);
  }, [franchise?.lineup, franchise?.roster, franchise?.upgrades]);

  const payroll = useMemo(() => {
    return franchise?.roster.reduce((total, id) => {
      const card = ALL_CARDS.find(c => c.id === id);
      if (!card) return total;
      // Simple mock salary based on OVR
      return total + (card.stats.ovr - 60) * 0.5 + 2; 
    }, 0) || 0;
  }, [franchise?.roster]);

  const starters = useMemo(() => {
    const ids = Object.values(franchise?.lineup || {}).filter(Boolean) as string[];
    return ids.map(id => ALL_CARDS.find(c => c.id === id)).filter(Boolean) as Card[];
  }, [franchise?.lineup]);

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
    const userLineup = franchise.lineup;
    const userRoster = franchise.roster;
    
    // Calculate Energy and Momentum factors
    const energyValues = Object.values(franchise.playerEnergy || {}) as number[];
    const avgEnergyValue = energyValues.reduce((a, b) => a + b, 0) / (franchise.roster.length || 1) || 100;
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

  const handleTradeProposal = () => {
    if (!tradeUserPlayer || !tradeTargetPlayer || !tradeTargetTeam) return;
    
    const userCard = ALL_CARDS.find(c => c.id === tradeUserPlayer);
    const targetCard = ALL_CARDS.find(c => c.id === tradeTargetPlayer);
    
    if (!userCard || !targetCard) return;
    
    const userValue = userCard.stats.ovr;
    const targetValue = targetCard.stats.ovr;
    
    if (userValue >= targetValue - 1) {
       const newRoster = franchise.roster.filter(id => id !== tradeUserPlayer);
       newRoster.push(tradeTargetPlayer);
       
       const newLeagueRosters = { ...(franchise.leagueRosters || {}) };
       const targetRoster = [...(newLeagueRosters[tradeTargetTeam] || [])].filter(id => id !== tradeTargetPlayer);
       targetRoster.push(tradeUserPlayer);
       newLeagueRosters[tradeTargetTeam] = targetRoster;
       
       const newLineup = { ...franchise.lineup };
       (Object.keys(newLineup) as (keyof typeof newLineup)[]).forEach(key => {
          if (newLineup[key] === tradeUserPlayer) {
             newLineup[key] = tradeTargetPlayer;
          }
       });
       
       updateFranchise({ 
          roster: newRoster, 
          lineup: newLineup as any,
          leagueRosters: newLeagueRosters,
          chemistry: Math.max(0, (franchise.chemistry || 60) - 10)
       });
       
       addNews(`TRADE ALERT: ${teamData?.name} acquired ${targetCard.name} from ${tradeTargetTeam}!`);
       setTradeMessage(`OFFER ACCEPTED: The ${tradeTargetTeam} have accepted the trade! ${targetCard.name} joined your team.`);
       setTradeUserPlayer(null);
       setTradeTargetPlayer(null);
    } else {
       setTradeMessage(`REJECTED: The ${tradeTargetTeam} turned down the offer. They want more value for ${targetCard.name}.`);
    }
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
             team1={teamData} 
             team2={opponentData} 
             team1OVR={teamOVR}
             team2OVR={nextGame.opponentOVR || 75}
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

      {/* Top Bar HUD */}
      <div className="px-6 sm:px-8 pt-8 sm:pt-12 pb-6 sm:pb-8 bg-zinc-950/90 backdrop-blur-3xl border-b border-zinc-900 sticky top-0 z-[100]">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
           <div className="flex items-center gap-3 sm:gap-6">
              <button 
                onClick={handleBack}
                className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 flex items-center justify-center shadow-2xl">
                 <img src={getTeamLogo(franchise.team || 'LAL')} alt="Team" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                 <h2 className="text-xl sm:text-3xl font-black uppercase italic tracking-tighter leading-none" style={{ color: primaryColor }}>{teamData?.name}</h2>
                 <div className="flex items-center gap-2 mt-1">
                    <p className="text-[8px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      {franchise.wins}W - {franchise.losses}L · {franchise.currentDate}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter ${streak.endsWith('W') ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                       {streak}
                    </span>
                 </div>
              </div>
           </div>
 
           <div className="hidden sm:flex items-center gap-4">
              {nextGame && (
                 <div className="flex flex-col items-end pr-4 border-r border-zinc-800">
                    <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Next Game</span>
                    <div className="flex items-center gap-3">
                       <img src={getTeamLogo(nextGame.opponentAbbr)} className="w-6 h-6 object-contain" />
                       <p className="text-sm font-black italic uppercase">{nextGame.opponentAbbr}</p>
                    </div>
                 </div>
              )}
              <div className="flex flex-col items-end">
                 <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Avg Energy</span>
                 <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                       <div className={`h-full transition-all ${avgEnergy < 40 ? 'bg-red-500' : avgEnergy < 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${avgEnergy}%` }} />
                    </div>
                    <p className="text-xl font-black italic text-white">{avgEnergy}%</p>
                 </div>
              </div>
              <div className="h-10 w-px bg-zinc-800" />
              <div className="flex flex-col items-end">
                 <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Budget</span>
                 <p className="text-xl font-black italic text-amber-500">${(franchise.budget / 1000).toFixed(0)}K</p>
              </div>
              <div className="h-10 w-px bg-zinc-800" />
              <div className="flex flex-col items-end">
                 <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">OVR</span>
                 <p className="text-xl font-black italic text-emerald-500">{teamOVR}</p>
              </div>
           </div>

        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
            {[
              { id: 'hub', label: 'Hub', icon: LayoutDashboard },
              { id: 'lineup', label: 'Lineup', icon: Users },
              { id: 'market', label: 'Trades', icon: ShoppingCart },
              { id: 'league', label: 'League', icon: Monitor },
              { id: 'standings', label: 'Rank', icon: BarChart3 },
              { id: 'mgmt', label: 'Org', icon: Building },
              { id: 'settings', label: 'Settings', icon: SettingsIcon },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FranchiseTab)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                  activeTab === tab.id 
                    ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                    : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <tab.icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.charAt(0)}</span>
              </button>
            ))}
        </div>

        {/* News Ticker HUD */}
        <div className="mt-4 -mx-6 px-6 py-2 bg-black/40 border-t border-zinc-900 overflow-hidden">
           <div className="flex items-center gap-6 animate-marquee whitespace-nowrap">
              {news.length > 0 ? [...news, ...news].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{item}</span>
                </div>
              )) : (
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Season preparation in progress... Morning practice starting shortly...</span>
                </div>
              )}
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-7xl mx-auto space-y-8"
          >
            {activeTab === 'hub' && (
              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {/* Next Game - Main Feature */}
                  <div className="md:col-span-4 lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 sm:p-10 relative overflow-hidden group shadow-2xl">
                     <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                     <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2" />
                     
                     <div className="relative z-10 space-y-8 sm:space-y-12">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <Calendar size={18} className="text-zinc-600" />
                              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Next Assignment</span>
                           </div>
                           <div className="px-4 py-1.5 bg-zinc-950 border border-zinc-800 rounded-full text-[8px] font-black uppercase tracking-widest text-zinc-400">
                              Week {Math.floor((franchise.wins + franchise.losses) / 3) + 1} · Game {franchise.wins + franchise.losses + 1}/82
                           </div>
                        </div>

                        <div className="flex items-center justify-around gap-4">
                           <div className="text-center space-y-4 flex-1">
                              <div className="relative group/logo">
                                 <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full scale-0 group-hover/logo:scale-110 transition-transform duration-500" />
                                 <div className="w-20 h-20 sm:w-28 sm:h-28 bg-zinc-800/50 backdrop-blur-md rounded-3xl flex items-center justify-center p-4 sm:p-6 shadow-2xl border border-white/5 group-hover:scale-105 transition-transform relative z-10">
                                    <img src={getTeamLogo(franchise.team || 'LAL')} alt="Logo" className="w-full h-full object-contain" />
                                 </div>
                              </div>
                              <p className="text-xs font-black uppercase italic tracking-[0.1em] text-zinc-400">{teamData?.name || 'Your Team'}</p>
                           </div>

                           <div className="flex flex-col items-center gap-3 shrink-0">
                              <div className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                                 <span className="text-xl font-black italic text-zinc-700">VS</span>
                              </div>
                              <div className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-[7px] font-bold text-zinc-600 uppercase tracking-widest">Primetime</div>
                           </div>

                           <div className="text-center space-y-4 flex-1">
                              <div className="relative group/logo">
                                 <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full scale-0 group-hover/logo:scale-110 transition-transform duration-500" />
                                 <div className="w-20 h-20 sm:w-28 sm:h-28 bg-zinc-800/50 backdrop-blur-md rounded-3xl flex items-center justify-center p-4 sm:p-6 shadow-2xl border border-white/10 group-hover:scale-105 transition-transform relative z-10">
                                    <img src={getTeamLogo(nextGame?.opponentAbbr || 'BOS')} alt="Opponent" className="w-full h-full object-contain" />
                                 </div>
                              </div>
                              <p className="text-xs font-black uppercase italic tracking-[0.1em] text-zinc-400">{nextGame?.opponentTeam || 'TBD'}</p>
                           </div>
                        </div>

                        <button 
                          onClick={simulateMatch}
                          disabled={isSimulating}
                          className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 group/btn overflow-hidden relative"
                        >
                           <div className="relative z-10 flex items-center gap-3">
                              {isSimulating ? <RefreshCw className="animate-spin" size={18} /> : <Zap fill="currentColor" size={18} />}
                              {isSimulating ? 'Analyzing Data...' : 'Advance Schedule'}
                           </div>
                        </button>
                     </div>
                  </div>

                 {/* Team Health Indicators */}
                 <div className="md:col-span-2 lg:col-span-2 space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 space-y-6 shadow-xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl opacity-50" />
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <Heart size={14} style={{ color: primaryColor }} />
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Chemistry</span>
                          </div>
                          <span className="text-xl font-black italic text-white">{franchise.chemistry || 60}%</span>
                       </div>
                       <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${franchise.chemistry || 60}%` }} 
                            style={{ backgroundColor: primaryColor }}
                            className="h-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
                          />
                       </div>
                       
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Users size={14} className="text-blue-500" />
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Fan Support</span>
                          </div>
                          <span className="text-xl font-black italic text-white">{franchise.fanSupport || 50}%</span>
                       </div>
                       <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${franchise.fanSupport || 50}%` }} 
                            className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                          />
                       </div>

                       <div className="pt-2 border-t border-zinc-800">
                          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest mb-3 text-zinc-600">
                             <span>Organization LVL {franchise.level || 1}</span>
                             <span>{franchise.xp}/{ (franchise.level || 1) * 2500 } XP</span>
                          </div>
                          <div className="h-1 w-full bg-zinc-800 rounded-full">
                             <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(franchise.xp / ((franchise.level || 1) * 2500)) * 100}%` }} />
                          </div>
                       </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 flex flex-col justify-between aspect-square shadow-xl group">
                       <div className="flex items-center justify-between">
                          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-black shadow-[0_10px_20px_rgba(245,158,11,0.3)] transition-transform group-hover:scale-110">
                             <DollarSign size={24} />
                          </div>
                          <div className="flex items-center gap-2">
                             <TrendingUp size={14} className="text-emerald-500" />
                             <span className="text-[8px] font-black text-emerald-500 uppercase">+12%</span>
                          </div>
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Available Budget</p>
                          <h4 className="text-4xl font-black italic tracking-tighter text-white">${(franchise.budget / 1000).toFixed(0)}K</h4>
                          <div className="mt-4 flex gap-1">
                             {[1,2,3,4,5].map(i => <div key={i} className="h-0.5 flex-1 bg-emerald-500/20" />)}
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* News Feed */}
                 <div className="md:col-span-3 lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 overflow-hidden flex flex-col shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                          League Feed
                       </h3>
                       <button className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors">Clear All</button>
                    </div>
                    <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pr-2">
                       {news.length > 0 ? news.map((item, i) => (
                         <div key={i} className="group p-5 bg-black/40 border border-white/5 rounded-3xl space-y-3 hover:bg-black/60 hover:border-zinc-700 transition-all duration-300">
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-500">Verified Broadcast</span>
                               </div>
                               <span className="text-[8px] font-bold text-zinc-600 uppercase">2m ago</span>
                            </div>
                            <p className="text-[11px] font-bold text-zinc-300 leading-relaxed tracking-wide group-hover:text-white transition-colors">{item}</p>
                         </div>
                       )) : (
                         <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-4 py-10 opacity-30">
                            <Newspaper size={48} strokeWidth={1} />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Monitoring league chatter...</p>
                         </div>
                       )}
                    </div>
                 </div>

                 {/* Record & Last 5 */}
                 <div className="md:col-span-3 lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-8 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Season Progress</h3>
                          <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Western Conference</p>
                       </div>
                       <div className="text-right">
                          <span className="text-2xl font-black italic tracking-tighter text-white">{franchise.wins} - {franchise.losses}</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl text-center group hover:bg-zinc-900 transition-colors">
                          <p className="text-[9px] font-black text-zinc-600 uppercase mb-3 italic tracking-widest">Standing</p>
                          <div className="text-4xl font-black italic text-white flex items-center justify-center gap-1 group-hover:scale-110 transition-transform">
                             <span className="text-emerald-500 font-black">#</span>
                             { (franchise.conferenceStandings?.findIndex(s => s.teamId === franchise.team) ?? 0) + 1 }
                          </div>
                       </div>
                       <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl text-center group hover:bg-zinc-900 transition-colors">
                          <p className="text-[9px] font-black text-zinc-600 uppercase mb-3 italic tracking-widest">Winning Ratio</p>
                          <div className="text-3xl font-black italic text-zinc-400 group-hover:text-emerald-400 transition-colors">
                             {franchise.wins + franchise.losses > 0 ? (franchise.wins / (franchise.wins + franchise.losses)).toFixed(3).replace('0.', '.') : '.000'}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 italic">Recent Form</h4>
                          <span className="text-[8px] font-black text-zinc-700 uppercase">Legacy Status</span>
                       </div>
                       <div className="flex gap-3">
                          {franchise.schedule.filter(m => m.played).slice(-5).map((m, idx) => (
                            <div key={idx} className={`flex-1 h-12 rounded-2xl flex items-center justify-center text-sm font-black italic transition-all hover:scale-110 ${m.result === 'W' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                               {m.result}
                            </div>
                          ))}
                          {[...Array(Math.max(0, 5 - franchise.schedule.filter(m => m.played).length))].map((_, i) => (
                            <div key={i} className="flex-1 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-800 flex items-center justify-center text-[10px] font-black italic">—</div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'lineup' && (
              <div className="space-y-8 pb-32">
                 <div className="flex border-b border-zinc-900 mb-8 sticky top-[240px] bg-zinc-950 z-[70] pt-4">
                    {(['court', 'bench', 'depth', 'chemistry'] as const).map(tab => (
                       <button 
                         key={tab}
                         onClick={() => setLineupSubTab(tab)}
                         className={`px-8 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${lineupSubTab === tab ? 'text-white' : 'text-zinc-600'}`}
                       >
                         {tab.replace('_', ' ')}
                         {lineupSubTab === tab && <motion.div layoutId="lineupSubTab" className="absolute bottom-0 left-0 right-0 h-1 bg-white" />}
                       </button>
                    ))}
                 </div>

                 {lineupSubTab === 'court' && (
                    <div className="space-y-12">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 flex items-center justify-between shadow-xl">
                             <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 font-black italic text-2xl border border-emerald-500/20">
                                   {teamOVR}
                                </div>
                                <div>
                                   <h3 className="text-xl font-black uppercase italic tracking-tighter">Team OVR</h3>
                                   <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Calculated from Starters + Bonuses</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-zinc-600 mb-1">Rotation Depth</p>
                                <p className="text-xl font-black italic">{franchise.roster.length}/15</p>
                             </div>
                          </div>

                          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 space-y-4 shadow-xl">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <DollarSign size={18} className="text-amber-500" />
                                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Salary Payroll</span>
                                </div>
                                <span className={`text-sm font-black italic ${teamPayroll > SALARY_CAP ? 'text-red-500' : 'text-zinc-400'}`}>
                                   ${(teamPayroll / 1000000).toFixed(1)}M / ${(SALARY_CAP / 1000000).toFixed(0)}M
                                </span>
                             </div>
                             <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, (teamPayroll / SALARY_CAP) * 100)}%` }}
                                  className={`h-full transition-all duration-1000 ${teamPayroll > SALARY_CAP ? 'bg-red-500' : 'bg-amber-500'}`}
                                />
                             </div>
                          </div>
                       </div>

                       <div className="relative aspect-[4/5] sm:aspect-[3/2] bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden p-4 sm:p-12 shadow-2xl">
                          <div className="absolute inset-0 opacity-10 pointer-events-none">
                             <div className="absolute inset-x-0 top-0 h-1/2 border-b border-zinc-800/10" />
                          </div>
                          
                          {/* Court Markings */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] aspect-square border border-zinc-800/20 rounded-full pointer-events-none" />
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-32 border-x border-t border-zinc-800/30 bg-black/10 rounded-t-3xl pointer-events-none" />

                          <div className="relative z-10 grid grid-cols-5 gap-2 sm:gap-4 h-full items-center">
                             {(['PG', 'SG', 'SF', 'PF', 'C'] as const).map(pos => {
                                const cardId = franchise.lineup?.[pos];
                                const card = cardId ? ALL_CARDS.find(c => c.id === cardId) : null;
                                const energy = cardId ? (franchise.playerEnergy?.[cardId] ?? 100) : 100;
                                
                                const posStyles: Record<string, string> = {
                                  PG: 'translate-y-4 sm:translate-y-12',
                                  SG: '-translate-y-4 sm:-translate-y-8',
                                  SF: '-translate-y-4 sm:-translate-y-8',
                                  PF: 'translate-y-4 sm:translate-y-12',
                                  C: 'scale-110 -translate-y-8 sm:-translate-y-20'
                                };

                                return (
                                  <div key={pos} className={`flex flex-col items-center gap-1 sm:gap-3 transition-transform ${posStyles[pos]}`}>
                                     <div className="flex flex-col items-center">
                                        <span className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-tighter">{pos}</span>
                                        {card && (
                                           <div className="flex items-center gap-1">
                                              <Zap size={8} className={energy < 50 ? 'text-red-500' : 'text-emerald-500'} fill="currentColor" />
                                              <span className={`text-[6px] sm:text-[8px] font-black ${energy < 50 ? 'text-red-500' : 'text-zinc-500'}`}>{Math.round(energy)}%</span>
                                           </div>
                                        )}
                                     </div>
                                     <div 
                                       onClick={() => setShowPicker({ pos })}
                                       className={`w-full max-w-[120px] aspect-[4/6] rounded-xl sm:rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                                         card ? 'border-transparent' : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
                                       }`}
                                     >
                                        {card ? (
                                          <div className="scale-75 sm:scale-100 hover:scale-105 transition-transform">
                                             <CardItem card={card} isOwned={true} mode="mini" />
                                          </div>
                                        ) : (
                                          <Plus className="text-zinc-800" size={24} strokeWidth={3} />
                                        )}
                                     </div>
                                  </div>
                                );
                             })}
                          </div>
                       </div>
                    </div>
                 )}

                 {lineupSubTab === 'bench' && (
                    <div className="space-y-8">
                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                          {franchise.roster.filter(id => !Object.values(franchise.lineup || {}).includes(id)).map(id => {
                             const card = ALL_CARDS.find(c => c.id === id);
                             if (!card) return null;
                             const energy = franchise.playerEnergy?.[id] ?? 100;
                             
                             return (
                               <div key={id} className="relative group">
                                  <CardItem card={card} isOwned={true} mode="mini" />
                                  <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-4 rounded-[1.5rem] transition-all space-y-4">
                                     <div className="text-center">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Energy</p>
                                        <div className="flex items-center gap-2">
                                           <Zap size={14} className={energy < 50 ? 'text-red-500' : 'text-emerald-500'} fill="currentColor" />
                                           <span className="text-xl font-black italic">{Math.round(energy)}%</span>
                                        </div>
                                     </div>
                                     <button 
                                       onClick={() => {
                                          const pos = normalizePosition(card.position);
                                          updateFranchise({ lineup: { ...franchise.lineup, [pos]: id } });
                                       }}
                                       className="w-full py-3 bg-white text-black text-[10px] font-black uppercase rounded-xl hover:bg-emerald-400 transition-colors"
                                     >
                                        Insert in Lineup
                                     </button>
                                  </div>
                               </div>
                             );
                          })}
                       </div>
                    </div>
                 )}

                 {lineupSubTab === 'chemistry' && (
                    <div className="space-y-8">
                       <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 space-y-10">
                          <div className="text-center space-y-2">
                             <h3 className="text-3xl font-black uppercase italic tracking-tighter">Team Symmetries</h3>
                             <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em]">Active Synergy Bonuses</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {/* Synergy 1: Trio */}
                             <div className={`p-8 rounded-[2.5rem] border transition-all ${
                               Object.values(starters.reduce((acc, c) => { acc[c.teamAbbr] = (acc[c.teamAbbr] || 0) + 1; return acc; }, {} as any)).some((v: any) => v >= 3)
                               ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-black/20 border-zinc-800 grayscale opacity-40'
                             }`}>
                                <div className="flex items-center gap-6">
                                   <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-2xl">
                                      <Users size={32} className="text-emerald-400" />
                                   </div>
                                   <div>
                                      <h4 className="text-xl font-black uppercase italic tracking-tight">Active Trio</h4>
                                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">+3 OVR Group Bonus</p>
                                   </div>
                                </div>
                             </div>

                             {/* Synergy 2: Inside-Out */}
                             <div className={`p-8 rounded-[2.5rem] border transition-all ${
                               (starters.find(c => normalizePosition(c.position) === 'PG')?.stats.assists >= 85 && starters.find(c => normalizePosition(c.position) === 'C')?.stats.rebounds >= 80)
                               ? 'bg-amber-500/10 border-amber-500/20' : 'bg-black/20 border-zinc-800 grayscale opacity-40'
                             }`}>
                                <div className="flex items-center gap-6">
                                   <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-2xl">
                                      <Zap size={32} className="text-amber-400" />
                                   </div>
                                   <div>
                                      <h4 className="text-xl font-black uppercase italic tracking-tight">Inside-Out Play</h4>
                                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">+5 OVR Offensive Flow</p>
                                   </div>
                                </div>
                             </div>

                             {/* Synergy 3: Star Power */}
                             <div className={`p-8 rounded-[2.5rem] border transition-all ${
                               starters.some(c => c.rarity === 'franchise')
                               ? 'bg-purple-500/10 border-purple-500/20' : 'bg-black/20 border-zinc-800 grayscale opacity-40'
                             }`}>
                                <div className="flex items-center gap-6">
                                   <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-2xl">
                                      <Star size={32} className="text-purple-400" />
                                   </div>
                                   <div>
                                      <h4 className="text-xl font-black uppercase italic tracking-tight">Star Power</h4>
                                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">+2 OVR Momentum Boost</p>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}
              </div>
            )}

            {activeTab === 'market' && (
              <div className="space-y-8 pb-32">
                <div className="flex border-b border-zinc-900 mb-8 sticky top-[240px] bg-zinc-950 z-[70] pt-4">
                    {(['waivers', 'trades', 'free_agency'] as const).map(tab => (
                       <button 
                         key={tab}
                         onClick={() => setMarketSubTab(tab)}
                         className={`px-8 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${marketSubTab === tab ? 'text-white' : 'text-zinc-600'}`}
                       >
                         {tab.replace('_', ' ')}
                         {marketSubTab === tab && <motion.div layoutId="marketSubTab" className="absolute bottom-0 left-0 right-0 h-1 bg-white" />}
                       </button>
                    ))}
                 </div>

                {marketSubTab === 'waivers' && (
                    <div className="space-y-8">
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-900/50 p-8 rounded-[3rem] border border-zinc-800">
                          <div className="space-y-2">
                             <h3 className="text-2xl font-black uppercase italic tracking-tighter">Waiver Wire</h3>
                             <p className="text-zinc-500 text-xs font-black uppercase tracking-widest leading-relaxed">
                                Players released by other teams or G-League prospects.<br/>
                                <span className="text-emerald-500">Refresh every 7 games played.</span>
                             </p>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="bg-black/40 px-6 py-3 rounded-2xl border border-zinc-800">
                                <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">Session Index</p>
                                <p className="text-xl font-black italic">{Math.floor((franchise.wins + franchise.losses) / 7) + 1}</p>
                             </div>
                             <div className="bg-black/40 px-6 py-3 rounded-2xl border border-zinc-800">
                                <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">Cap Space</p>
                                <p className="text-xl font-black italic text-amber-500">${((SALARY_CAP - teamPayroll)/1000000).toFixed(1)}M</p>
                             </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                          {(franchise.waiverPool || ALL_CARDS.filter(c => c.stats.ovr >= 70 && c.stats.ovr <= 78 && !franchise.roster.includes(c.id)).slice(0, 10).map(c => c.id)).map(id => {
                             const card = ALL_CARDS.find(c => c.id === id);
                             if (!card) return null;
                             const salary = (card.stats.ovr - 65) * 0.4 + 1.5;
                             const canAfford = teamPayroll + salary <= SALARY_CAP;

                             return (
                               <div key={id} className="relative group">
                                  <CardItem card={card} isOwned={true} mode="mini" />
                                  <div className="absolute inset-0 bg-black/95 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-4 rounded-[1.5rem] transition-all gap-4">
                                     <div className="text-center">
                                        <p className="text-[8px] font-black text-zinc-500 uppercase">Min Salary</p>
                                        <p className="text-sm font-black italic">${salary.toFixed(1)}M</p>
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
                                       className="w-full py-3 bg-white text-black text-[9px] font-black uppercase rounded-lg hover:bg-emerald-400 disabled:opacity-30"
                                     >
                                        Claim Player
                                     </button>
                                  </div>
                               </div>
                             );
                          })}
                       </div>
                    </div>
                 )}

                {marketSubTab === 'trades' && (
                    <div className="space-y-8">
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
                             <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black uppercase italic tracking-tighter">{franchise.team} Assets</h3>
                                <span className={`text-[10px] font-black uppercase ${tradeUserPlayer ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                   {tradeUserPlayer ? 'Asset Ready' : 'Select Player'}
                                </span>
                             </div>
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 h-[400px] overflow-y-auto pr-2 no-scrollbar">
                                {franchise.roster.map(id => {
                                   const card = ALL_CARDS.find(c => c.id === id);
                                   if (!card) return null;
                                   return (
                                      <div key={id} onClick={() => setTradeUserPlayer(id)} className={`cursor-pointer transition-all relative ${tradeUserPlayer === id ? 'scale-105 ring-2 ring-emerald-500 rounded-[1.5rem]' : 'opacity-40 grayscale hover:opacity-100'}`}>
                                         <CardItem card={card} isOwned={true} mode="mini" />
                                      </div>
                                   );
                                })}
                             </div>
                          </div>

                          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
                             <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                   <h3 className="text-xl font-black uppercase italic tracking-tighter text-zinc-400">Target Team</h3>
                                   <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[200px]">
                                      {NBA_TEAMS.filter(t => t.id !== franchise.team).slice(0, 5).map(t => (
                                         <button key={t.id} onClick={() => setTradeTargetTeam(t.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] border ${tradeTargetTeam === t.id ? 'bg-white text-black border-white' : 'bg-black border-zinc-800 text-zinc-500'}`}>{t.id.slice(0, 2)}</button>
                                      ))}
                                   </div>
                                </div>
                             </div>

                             {tradeTargetTeam ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 h-[400px] overflow-y-auto pr-2 no-scrollbar">
                                   {(franchise.leagueRosters?.[tradeTargetTeam] || []).map(id => {
                                      const card = ALL_CARDS.find(c => c.id === id);
                                      if (!card) return null;
                                      return (
                                         <div key={id} onClick={() => setTradeTargetPlayer(id)} className={`cursor-pointer transition-all relative ${tradeTargetPlayer === id ? 'scale-105 ring-2 ring-amber-500 rounded-[1.5rem]' : 'opacity-40 grayscale hover:opacity-100'}`}>
                                            <CardItem card={card} isOwned={true} mode="mini" />
                                         </div>
                                      );
                                   })}
                                </div>
                             ) : (
                                <div className="h-[400px] flex flex-col items-center justify-center text-center opacity-20 space-y-4">
                                   <RefreshCw size={40} className="animate-spin-slow" />
                                   <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Select rival organization<br/>to initialize trade terminal</p>
                                </div>
                             )}
                          </div>
                       </div>

                       <div className="flex justify-center pt-8">
                          <button 
                            disabled={!tradeUserPlayer || !tradeTargetPlayer}
                            onClick={handleTradeProposal}
                            className="bg-white text-black px-16 py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20"
                          >
                             Propound Trade Agreement
                          </button>
                       </div>
                    </div>
                 )}

                 {marketSubTab === 'free_agency' && (
                    <div className="space-y-8">
                       <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-[1.5rem]">
                          <Search size={20} className="text-zinc-600 ml-2" />
                          <input 
                            value={marketSearch}
                            onChange={(e) => setMarketSearch(e.target.value)}
                            placeholder="Search veteran free agents..." 
                            className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest text-white flex-1" 
                          />
                       </div>
                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                          {ALL_CARDS.filter(c => !franchise.roster.includes(c.id))
                            .filter(c => c.name.toLowerCase().includes(marketSearch.toLowerCase()))
                            .slice(0, 18).map(card => {
                             const salary = (card.stats.ovr - 60) * 0.5 + 2;
                             const signFee = Math.floor(card.stats.ovr * 1500);
                             const teamPay = franchise.roster.reduce((t, id) => t + (ALL_CARDS.find(c => c.id === id)?.stats.ovr ? (ALL_CARDS.find(c => c.id === id)!.stats.ovr - 60) * 0.5 + 2 : 0), 0);
                             const canAfford = franchise.budget >= signFee && (teamPay + salary <= SALARY_CAP);
                             
                             return (
                               <div key={card.id} className="relative group">
                                  <CardItem card={card} isOwned={true} mode="mini" />
                                  <div className="absolute inset-0 bg-black/95 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-4 rounded-[1.5rem] transition-all gap-3 text-center">
                                     <div>
                                        <p className="text-[8px] font-black text-zinc-500 uppercase">Annual Salary</p>
                                        <p className="text-xs font-black italic">${salary.toFixed(1)}M</p>
                                     </div>
                                     <button 
                                       disabled={!canAfford}
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
                                          setNews(prev => [`${teamData?.name} signed ${card.name} from Free Agency.`, ...prev].slice(0, 5));
                                       }}
                                       className="w-full py-3 bg-white text-black text-[9px] font-black uppercase rounded-lg"
                                     >
                                        Sign Veteran
                                     </button>
                                  </div>
                               </div>
                             );
                          })}
                       </div>
                    </div>
                 )}
              </div>
            )}

            {activeTab === 'standings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* East Conference */}
                <div className="space-y-6">
                  <h3 className="text-xl font-black italic uppercase text-blue-500 border-l-4 border-blue-500 pl-4">Eastern Conference</h3>
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
                    <div className="grid grid-cols-10 p-5 border-b border-zinc-800 bg-black/60 text-[9px] font-black uppercase text-zinc-500 tracking-widest">
                       <div className="col-span-1">#</div>
                       <div className="col-span-4">Team</div>
                       <div className="col-span-1 text-center">W</div>
                       <div className="col-span-1 text-center">L</div>
                       <div className="col-span-1 text-center">GB</div>
                       <div className="col-span-2 text-right">PCT</div>
                    </div>
                    <div className="divide-y divide-zinc-800/20">
                      {franchise.conferenceStandings?.filter(s => s.conference === 'East').sort((a,b) => b.pct - a.pct).map((s, idx) => (
                        <div key={s.teamId} className={`grid grid-cols-10 p-4 items-center ${s.teamId === franchise.team ? 'bg-emerald-500/10 border-l-[4px] border-emerald-500' : ''}`}>
                           <div className="col-span-1 text-[10px] font-black text-zinc-600 italic">{idx + 1}</div>
                           <div className="col-span-4 flex items-center gap-3">
                              <span className="text-[10px] font-black uppercase italic truncate">{s.teamName}</span>
                           </div>
                           <div className="col-span-1 text-center text-xs font-black">{s.wins}</div>
                           <div className="col-span-1 text-center text-xs font-bold text-zinc-600">{s.losses}</div>
                           <div className="col-span-1 text-center text-[10px] font-bold text-zinc-500">{(idx === 0 ? '-' : (franchise.conferenceStandings?.filter(cs => cs.conference === 'East')[0].wins - s.wins))}</div>
                           <div className="col-span-2 text-right text-[10px] font-bold text-zinc-500">.{Math.round(s.pct * 1000).toString().padStart(3, '0')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* West Conference */}
                <div className="space-y-6">
                  <h3 className="text-xl font-black italic uppercase text-red-500 border-l-4 border-red-500 pl-4">Western Conference</h3>
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
                    <div className="grid grid-cols-10 p-5 border-b border-zinc-800 bg-black/60 text-[9px] font-black uppercase text-zinc-500 tracking-widest">
                       <div className="col-span-1">#</div>
                       <div className="col-span-4">Team</div>
                       <div className="col-span-1 text-center">W</div>
                       <div className="col-span-1 text-center">L</div>
                       <div className="col-span-1 text-center">GB</div>
                       <div className="col-span-2 text-right">PCT</div>
                    </div>
                    <div className="divide-y divide-zinc-800/20">
                      {franchise.conferenceStandings?.filter(s => s.conference === 'West').sort((a,b) => b.pct - a.pct).map((s, idx) => (
                        <div key={s.teamId} className={`grid grid-cols-10 p-4 items-center ${s.teamId === franchise.team ? 'bg-emerald-500/10 border-l-[4px] border-emerald-500' : ''}`}>
                           <div className="col-span-1 text-[10px] font-black text-zinc-600 italic">{idx + 1}</div>
                           <div className="col-span-4 flex items-center gap-3">
                              <span className="text-[10px] font-black uppercase italic truncate">{s.teamName}</span>
                           </div>
                           <div className="col-span-1 text-center text-xs font-black">{s.wins}</div>
                           <div className="col-span-1 text-center text-xs font-bold text-zinc-600">{s.losses}</div>
                           <div className="col-span-1 text-center text-[10px] font-bold text-zinc-500">{(idx === 0 ? '-' : (franchise.conferenceStandings?.filter(cs => cs.conference === 'West')[0].wins - s.wins))}</div>
                           <div className="col-span-2 text-right text-[10px] font-bold text-zinc-500">.{Math.round(s.pct * 1000).toString().padStart(3, '0')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-8">
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter">Season Leaders</h2>
                 <div className="bg-zinc-900/40 border border-zinc-800 rounded-[3rem] overflow-hidden">
                    <div className="grid grid-cols-12 p-6 border-b border-zinc-800 bg-black/60 text-[9px] font-black uppercase text-zinc-500 tracking-widest italic">
                       <div className="col-span-5">Player / Team</div>
                       <div className="col-span-1 text-center">GP</div>
                       <div className="col-span-2 text-center">PPG</div>
                       <div className="col-span-2 text-center">RPG</div>
                       <div className="col-span-2 text-center">APG</div>
                    </div>
                    <div className="divide-y divide-zinc-800/20 max-h-[600px] overflow-y-auto no-scrollbar">
                       {(franchise.playerSeasonStats || []).sort((a,b) => b.avgPts - a.avgPts).map((stat, idx) => (
                         <div key={stat.cardId} className="grid grid-cols-12 p-5 items-center hover:bg-zinc-800/30 transition-all">
                            <div className="col-span-5 flex items-center gap-4">
                               <span className="text-[10px] font-black text-zinc-700 italic">{idx + 1}</span>
                               <div>
                                  <p className="text-xs font-black uppercase tracking-tight italic">{stat.playerName}</p>
                                  <p className="text-[9px] font-bold text-zinc-600 uppercase">{stat.teamAbbr}</p>
                               </div>
                            </div>
                            <div className="col-span-1 text-center text-xs font-bold">{stat.gamesPlayed}</div>
                            <div className="col-span-2 text-center text-xs font-black text-white">{stat.avgPts.toFixed(1)}</div>
                            <div className="col-span-2 text-center text-xs font-black text-zinc-400">{stat.avgReb.toFixed(1)}</div>
                            <div className="col-span-2 text-center text-xs font-black text-zinc-400">{stat.avgAst.toFixed(1)}</div>
                         </div>
                       ))}
                       {(!franchise.playerSeasonStats || franchise.playerSeasonStats.length === 0) && (
                         <div className="py-32 text-center">
                            <p className="text-zinc-600 font-black uppercase tracking-widest text-[10px]">No stats recorded yet. Play a game to start simulation.</p>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'mgmt' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {[
                    { id: 'coaching', label: 'Offensive Strategies', icon: Target, val: franchise.upgrades.coaching, color: 'text-orange-500', desc: 'Boost team offensive flow and playbook complexity.' },
                    { id: 'scouting', label: 'Global Scouting Network', icon: Search, val: franchise.upgrades.scouting, color: 'text-blue-500', desc: 'Improve free agent identification and talent reports.' },
                    { id: 'training', label: 'Performance Center', icon: Activity, val: franchise.upgrades.training, color: 'text-purple-500', desc: 'Accelerate player progression and recovery.' },
                    { id: 'facilities', label: 'Modern Arena Facilities', icon: Building, val: franchise.upgrades.facilities, color: 'text-emerald-500', desc: 'Increases revenue per home game and fan loyalty.' },
                  ].map(u => (
                    <div key={u.id} className="p-8 bg-zinc-900/40 border border-zinc-800 rounded-[3rem] space-y-6 hover:border-zinc-600 transition-all">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className={`w-14 h-14 rounded-2xl bg-black/40 flex items-center justify-center ${u.color}`}><u.icon size={28} /></div>
                             <div>
                                <h4 className="text-lg font-black uppercase italic tracking-tight">{u.label}</h4>
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Upgrade Organization</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <span className="text-[10px] font-black uppercase text-zinc-500">Level</span>
                             <p className="text-xl font-black italic">{u.val}</p>
                          </div>
                       </div>
                       <p className="text-xs text-zinc-500 leading-relaxed">{u.desc}</p>
                       <div className="space-y-4">
                          <div className="flex gap-1.5">
                             {[...Array(10)].map((_, i) => (
                               <div key={i} className={`flex-1 h-2 rounded-full ${i < u.val ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-zinc-800'}`} />
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
                            className="w-full py-4 bg-zinc-800/50 hover:bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-30 border border-zinc-700/50"
                          >
                             Enhance — ${(u.val * 100).toFixed(0)}K
                          </button>
                       </div>
                    </div>
                  ))}
                  
                  {/* Action Card: Recovery */}
                  <div className="p-8 bg-black border border-zinc-700 rounded-[3rem] space-y-6 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2" />
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-red-500 flex items-center justify-center text-black shadow-[0_0_20px_rgba(239,68,68,0.3)]"><Zap size={28} fill="currentColor" /></div>
                        <div>
                           <h4 className="text-lg font-black uppercase italic tracking-tight">Cryotherapy Session</h4>
                           <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Team-wide Recovery</p>
                        </div>
                     </div>
                     <p className="text-xs text-zinc-500 leading-relaxed">Restore 30% energy for all players in the roster. Essential for back-to-back matchups.</p>
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
                        className="w-full py-5 bg-red-500 hover:bg-red-400 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl active:scale-95 transition-all disabled:opacity-30"
                     >
                        Execute Session — $50K
                     </button>
                  </div>
              </div>
            )}

            {activeTab === 'league' && (
               <div className="space-y-8">
                  <div className="flex items-center justify-between">
                     <h2 className="text-3xl font-black uppercase italic tracking-tighter">League Scoreboard</h2>
                     <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">{franchise.currentDate} Session</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {(() => {
                        const yesterday = new Date(new Date(franchise.currentDate || '2025-10-22').getTime() - 86400000).toISOString().split('T')[0];
                        const results = franchise.leagueHistory?.[yesterday] || [];
                        
                        if (results.length === 0) return <div className="col-span-full py-20 text-center text-zinc-700">No games played yesterday.</div>;

                        return results.map((game, i) => (
                           <div key={i} className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-6 hover:border-zinc-700 transition-all">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                    <img src={getTeamLogo(game.away)} className="w-10 h-10 object-contain" />
                                    <div>
                                       <p className="text-[10px] font-black text-zinc-600 uppercase">Away</p>
                                       <p className="text-lg font-black italic">{game.away}</p>
                                    </div>
                                 </div>
                                 <div className={`text-3xl font-black italic ${game.awayScore > game.homeScore ? 'text-white' : 'text-zinc-700'}`}>{game.awayScore}</div>
                              </div>
                              <div className="h-px w-full bg-zinc-800/50 relative">
                                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 px-2 text-[8px] font-black text-zinc-800 italic uppercase">Final</div>
                              </div>
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                    <img src={getTeamLogo(game.home)} className="w-10 h-10 object-contain" />
                                    <div>
                                       <p className="text-[10px] font-black text-zinc-600 uppercase">Home</p>
                                       <p className="text-lg font-black italic">{game.home}</p>
                                    </div>
                                 </div>
                                 <div className={`text-3xl font-black italic ${game.homeScore > game.awayScore ? 'text-white' : 'text-zinc-700'}`}>{game.homeScore}</div>
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
                   {franchise.roster.map(id => {
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
                   {franchise.roster.length === 0 && <p className="col-span-full text-center py-20 text-zinc-600 font-black uppercase">No players in roster. Sign some from the market!</p>}
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
                          {showRecap.stats.slice(0, 3).map((p: any, i: number) => (
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
