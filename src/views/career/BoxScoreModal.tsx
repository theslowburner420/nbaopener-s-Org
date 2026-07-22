import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Trophy, User, ArrowRight } from 'lucide-react';
import { MatchResult, BoxScoreEntry, TeamObject } from '../../franchise/types';
import { getTeamLogo } from '../../data/nbaTeams';

interface BoxScoreModalProps {
  result: MatchResult;
  homeTeam: TeamObject;
  awayTeam: TeamObject;
  userTeamId: string;
  onContinue: () => void;
}

const BoxScoreModal: React.FC<BoxScoreModalProps> = ({ result, homeTeam, awayTeam, userTeamId, onContinue }) => {
  const [showRivalStats, setShowRivalStats] = useState(false);
  const isHome = userTeamId === homeTeam.teamId;
  const userTeamObj = isHome ? homeTeam : awayTeam;
  const rivalTeamObj = isHome ? awayTeam : homeTeam;
  const userScore = isHome ? result.score.home : result.score.away;
  const rivalScore = isHome ? result.score.away : result.score.home;
  const isWin = userScore > rivalScore;

  const userBox = isHome ? result.boxScore.home : result.boxScore.away;
  const rivalBox = isHome ? result.boxScore.away : result.boxScore.home;

  const calculateEFF = (e: BoxScoreEntry) => e.points + e.rebounds + e.assists + (e.steals || 0) + (e.blocks || 0);
  const findMVP = () => {
    const all = [...result.boxScore.home, ...result.boxScore.away];
    return all.reduce((prev, current) => (calculateEFF(current) > calculateEFF(prev) ? current : prev));
  };

  const mvp = findMVP();

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="fixed inset-0 z-[5000] bg-black/95 backdrop-blur-xl flex flex-col pt-safe"
    >
      {/* HEADER */}
      <div className="p-6 md:p-12 space-y-6">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex flex-col items-center gap-2">
            <img src={getTeamLogo(awayTeam.teamId)} className="w-12 h-12 md:w-20 md:h-20 object-contain" />
            <span className="text-[10px] font-black uppercase text-zinc-500">{awayTeam.abbreviation}</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 md:gap-8">
              <span className={`text-4xl md:text-7xl font-black italic ${!isHome && isWin ? 'text-white' : 'text-zinc-700'}`}>{result.score.away}</span>
              <span className="text-zinc-800 text-2xl font-black">—</span>
              <span className={`text-4xl md:text-7xl font-black italic ${isHome && isWin ? 'text-white' : 'text-zinc-700'}`}>{result.score.home}</span>
            </div>
            <div className={`mt-2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isWin ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}>
              {isWin ? 'Victory' : 'Defeat'}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <img src={getTeamLogo(homeTeam.teamId)} className="w-12 h-12 md:w-20 md:h-20 object-contain" />
            <span className="text-[10px] font-black uppercase text-zinc-500">{homeTeam.abbreviation}</span>
          </div>
        </div>

        {/* QUARTERS */}
        <div className="max-w-2xl mx-auto bg-white/5 rounded-2xl overflow-hidden border border-white/5">
          <table className="w-full text-[10px] md:text-xs">
            <thead>
              <tr className="bg-white/10 text-zinc-400 font-black uppercase tracking-widest">
                <th className="px-4 py-2 text-left">Team</th>
                {result.periods.home.map((_, i) => <th key={i} className="px-2 py-2 text-center">Q{i+1}</th>)}
                <th className="px-4 py-2 text-center text-white">TOT</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-white/5">
                <td className="px-4 py-3 font-black text-white">{awayTeam.abbreviation}</td>
                {result.periods.away.map((p, i) => <td key={i} className="px-2 py-3 text-center text-zinc-400 font-mono">{p}</td>)}
                <td className="px-4 py-3 text-center font-black text-amber-500">{result.score.away}</td>
              </tr>
              <tr className="border-t border-white/5">
                <td className="px-4 py-3 font-black text-white">{homeTeam.abbreviation}</td>
                {result.periods.home.map((p, i) => <td key={i} className="px-2 py-3 text-center text-zinc-400 font-mono">{p}</td>)}
                <td className="px-4 py-3 text-center font-black text-amber-500">{result.score.home}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto px-4 md:px-12 pb-32 no-scrollbar">
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* GAME MVP */}
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Trophy size={120} />
            </div>
            <div className="w-24 h-24 md:w-32 md:h-32 bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 shrink-0">
               <User className="w-full h-full p-6 text-zinc-700" />
            </div>
            <div className="space-y-4 text-center md:text-left">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 italic">Game Performance Leader</span>
                <h3 className="text-3xl font-black italic uppercase italic tracking-tighter text-white">{mvp.name}</h3>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-4">
                 <div className="text-center">
                    <p className="text-[8px] font-black text-zinc-500 uppercase">Points</p>
                    <p className="text-xl font-black text-white italic">{mvp.points}</p>
                 </div>
                 <div className="w-px h-8 bg-white/10" />
                 <div className="text-center">
                    <p className="text-[8px] font-black text-zinc-500 uppercase">Rebounds</p>
                    <p className="text-xl font-black text-white italic">{mvp.rebounds}</p>
                 </div>
                 <div className="w-px h-8 bg-white/10" />
                 <div className="text-center">
                    <p className="text-[8px] font-black text-zinc-500 uppercase">Assists</p>
                    <p className="text-xl font-black text-white italic">{mvp.assists}</p>
                 </div>
              </div>
            </div>
          </div>

          {/* USER BOX SCORE */}
          <div className="space-y-4">
             <h4 className="px-2 text-sm font-black uppercase text-white tracking-widest flex items-center gap-2">
               <div className="w-2 h-2 bg-amber-500 rounded-full" />
               {userTeamObj.name} Stats
             </h4>
             <div className="bg-zinc-950 rounded-3xl border border-white/5 overflow-x-auto">
               <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="bg-white/5 text-[9px] font-black uppercase text-zinc-500 tracking-widest">
                       <th className="px-6 py-4 sticky left-0 bg-zinc-950">Player</th>
                       <th className="px-4 py-4 text-center">MIN</th>
                       <th className="px-4 py-4 text-center">PTS</th>
                       <th className="px-4 py-4 text-center">REB</th>
                       <th className="px-4 py-4 text-center">AST</th>
                       <th className="px-4 py-4 text-center">STL</th>
                       <th className="px-4 py-4 text-center">BLK</th>
                       <th className="px-4 py-4 text-right">+/-</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {userBox.sort((a,b) => b.minutes - a.minutes).map((e) => (
                      <tr key={e.playerId} className={`hover:bg-white/5 transition-colors ${e.points >= 20 ? 'bg-amber-500/5' : ''}`}>
                         <td className="px-6 py-4 font-black italic uppercase text-xs text-white sticky left-0 bg-zinc-950 z-10">{e.name}</td>
                         <td className="px-4 py-4 text-center font-mono text-xs text-zinc-500">{e.minutes}</td>
                         <td className="px-4 py-4 text-center font-black text-sm text-white italic">{e.points}</td>
                         <td className="px-4 py-4 text-center font-black text-xs text-zinc-400 italic">{e.rebounds}</td>
                         <td className="px-4 py-4 text-center font-black text-xs text-zinc-400 italic">{e.assists}</td>
                         <td className="px-4 py-4 text-center font-bold text-[10px] text-zinc-600">{e.steals}</td>
                         <td className="px-4 py-4 text-center font-bold text-[10px] text-zinc-600">{e.blocks}</td>
                         <td className={`px-4 py-4 text-right font-mono text-xs ${e.plusMinus > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{e.plusMinus > 0 ? `+${e.plusMinus}` : e.plusMinus}</td>
                      </tr>
                    ))}
                    <tr className="bg-white/5 font-black uppercase text-[10px]">
                       <td className="px-6 py-4 sticky left-0 bg-zinc-950 z-10">TOTALS</td>
                       <td className="px-4 py-4 text-center">240</td>
                       <td className="px-4 py-4 text-center text-amber-500 text-sm">{userScore}</td>
                       <td className="px-4 py-4 text-center text-white">{userBox.reduce((s,e) => s + e.rebounds, 0)}</td>
                       <td className="px-4 py-4 text-center text-white">{userBox.reduce((s,e) => s + e.assists, 0)}</td>
                       <td className="px-4 py-4 text-center text-zinc-500">{userBox.reduce((s,e) => s + (e.steals || 0), 0)}</td>
                       <td className="px-4 py-4 text-center text-zinc-500">{userBox.reduce((s,e) => s + (e.blocks || 0), 0)}</td>
                       <td className="px-4 py-4 text-right text-zinc-500">—</td>
                    </tr>
                  </tbody>
               </table>
             </div>
          </div>

          {/* RIVAL STATS (Collapsable) */}
          <div className="space-y-4">
             <button 
              onClick={() => setShowRivalStats(!showRivalStats)}
              className="w-full flex items-center justify-between px-6 py-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all"
             >
                <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 bg-zinc-700 rounded-full" />
                  Rival: {rivalTeamObj.name} Stats
                </h4>
                {showRivalStats ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
             </button>

             <AnimatePresence>
               {showRivalStats && (
                 <motion.div 
                   initial={{ height: 0, opacity: 0 }} 
                   animate={{ height: 'auto', opacity: 1 }} 
                   exit={{ height: 0, opacity: 0 }}
                   className="overflow-hidden bg-zinc-950 rounded-3xl border border-white/5 overflow-x-auto"
                 >
                   <table className="w-full text-left min-w-[600px]">
                      <thead>
                        <tr className="bg-white/5 text-[9px] font-black uppercase text-zinc-500 tracking-widest">
                           <th className="px-6 py-4 sticky left-0 bg-zinc-950">Player</th>
                           <th className="px-4 py-4 text-center">MIN</th>
                           <th className="px-4 py-4 text-center">PTS</th>
                           <th className="px-4 py-4 text-center">REB</th>
                           <th className="px-4 py-4 text-center">AST</th>
                           <th className="px-4 py-4 text-center">STL</th>
                           <th className="px-4 py-4 text-center">BLK</th>
                           <th className="px-4 py-4 text-right">+/-</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {rivalBox.sort((a,b) => b.minutes - a.minutes).map((e) => (
                          <tr key={e.playerId} className="hover:bg-white/5">
                             <td className="px-6 py-4 font-black italic uppercase text-xs text-white sticky left-0 bg-zinc-950 z-10">{e.name}</td>
                             <td className="px-4 py-4 text-center font-mono text-xs text-zinc-500">{e.minutes}</td>
                             <td className="px-4 py-4 text-center font-black text-sm text-zinc-300 italic">{e.points}</td>
                             <td className="px-4 py-4 text-center font-bold text-xs text-zinc-500">{e.rebounds}</td>
                             <td className="px-4 py-4 text-center font-bold text-xs text-zinc-500">{e.assists}</td>
                             <td className="px-4 py-4 text-center font-bold text-[10px] text-zinc-600">{e.steals || 0}</td>
                             <td className="px-4 py-4 text-center font-bold text-[10px] text-zinc-600">{e.blocks || 0}</td>
                             <td className={`px-4 py-4 text-right font-mono text-xs ${e.plusMinus > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{e.plusMinus > 0 ? `+${e.plusMinus}` : e.plusMinus}</td>
                          </tr>
                        ))}
                        <tr className="bg-white/5 font-black uppercase text-[10px]">
                           <td className="px-6 py-4 sticky left-0 bg-zinc-950 z-10">TOTALS</td>
                           <td className="px-4 py-4 text-center">240</td>
                           <td className="px-4 py-4 text-center text-amber-500 text-sm">{rivalScore}</td>
                           <td className="px-4 py-4 text-center text-white">{rivalBox.reduce((s,e) => s + e.rebounds, 0)}</td>
                           <td className="px-4 py-4 text-center text-white">{rivalBox.reduce((s,e) => s + e.assists, 0)}</td>
                           <td className="px-4 py-4 text-center text-zinc-500">{rivalBox.reduce((s,e) => s + (e.steals || 0), 0)}</td>
                           <td className="px-4 py-4 text-center text-zinc-500">{rivalBox.reduce((s,e) => s + (e.blocks || 0), 0)}</td>
                           <td className="px-4 py-4 text-right text-zinc-500">—</td>
                        </tr>
                      </tbody>
                   </table>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>
      </div>

      {/* CONTINUE BUTTON */}
      <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black via-black to-transparent">
         <button 
          onClick={onContinue}
          className="w-full h-[52px] bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-amber-500 transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)] active:scale-95"
         >
           Continue Advancement
           <ArrowRight size={16} />
         </button>
      </div>
    </motion.div>
  );
};

export default BoxScoreModal;
