import React from 'react';
import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';
import { FranchiseState, PlayoffSeries } from '../franchise/types';
import { getTeamLogo } from '../data/nbaTeams';

interface MatchupNodeProps {
  series: PlayoffSeries;
  label: string;
  state: FranchiseState;
  isActive: boolean;
}

export const MatchupNode: React.FC<MatchupNodeProps> = ({ series, label, state, isActive }) => {
  const team1 = state.teams[series.team1Id];
  const team2 = state.teams[series.team2Id];
  if (!team1 || !team2) return null;

  const targetWins = series.round === 0 ? 1 : 4;
  const isFinished = series.wins1 >= targetWins || series.wins2 >= targetWins;
  const winnerId = series.wins1 >= targetWins ? series.team1Id : series.wins2 >= targetWins ? series.team2Id : null;

  const isTeam1Winner = winnerId === series.team1Id;
  const isTeam2Winner = winnerId === series.team2Id;

  return (
    <div 
      className={`will-change-transform bg-zinc-950/90 border rounded-2xl p-4.5 min-w-[240px] relative transition-all duration-500 ease-out flex flex-col justify-between shadow-xl hover:shadow-[0_10px_25px_rgba(245,158,11,0.06)] hover:scale-[1.02] ${
        isActive 
          ? 'border-amber-500/45 ring-2 ring-amber-500/10' 
          : 'border-white/10'
      } ${
        isFinished 
          ? 'border-emerald-500/35 bg-gradient-to-br from-zinc-950/95 to-emerald-950/15 shadow-[0_4px_20px_rgba(16,185,129,0.04)]' 
          : ''
      }`}
      style={{ willChange: 'transform' }}
    >
      {/* Glow highlight indicators */}
      {isFinished && (
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-400 opacity-90 rounded-b-2xl" />
      )}
      {series.id === 'finals' && isFinished && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-505/5 to-yellow-501/5 rounded-2xl pointer-events-none animate-pulse" />
      )}

      <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3.5">
        <span className="text-[9px] font-black text-amber-500 tracking-widest uppercase italic">{label}</span>
        <span className="text-[9px] font-bold text-zinc-500 tracking-wider">
          {isFinished ? 'FINALIZED' : `GAME ${series.wins1 + series.wins2 + 1}`}
        </span>
      </div>

      <div className="space-y-3">
        {/* Team 1 Row */}
        <div className={`flex items-center justify-between transition-all duration-500 ${isTeam1Winner ? 'scale-[1.03] text-amber-400 font-extrabold translate-x-1' : 'text-zinc-300'}`}>
          <div className="flex items-center gap-2.5">
            <span className="text-[9px] font-semibold text-zinc-600 w-3">{series.seed1 || ''}</span>
            <div className="w-7 h-7 bg-black rounded-lg p-1 flex items-center justify-center border border-white/5 shrink-0 shadow-inner">
              <img src={getTeamLogo(series.team1Id)} className="w-[85%] h-[85%] object-contain" referrerPolicy="no-referrer" />
            </div>
            <span className="text-[12px] font-black uppercase italic tracking-wide">{team1.abbreviation}</span>
            {isTeam1Winner && (
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10B981]" />
            )}
          </div>
          <span className={`text-[15px] font-black italic font-mono tabular-nums ${isTeam1Winner ? 'text-amber-400 text-[17px]' : 'text-zinc-600'}`}>
            {series.wins1}
          </span>
        </div>

        {/* Team 2 Row */}
        <div className={`flex items-center justify-between transition-all duration-500 ${isTeam2Winner ? 'scale-[1.03] text-amber-400 font-extrabold translate-x-1' : 'text-zinc-300'}`}>
          <div className="flex items-center gap-2.5">
            <span className="text-[9px] font-semibold text-zinc-600 w-3">{series.seed2 || ''}</span>
            <div className="w-7 h-7 bg-black rounded-lg p-1 flex items-center justify-center border border-white/5 shrink-0 shadow-inner">
              <img src={getTeamLogo(series.team2Id)} className="w-[85%] h-[85%] object-contain" referrerPolicy="no-referrer" />
            </div>
            <span className="text-[12px] font-black uppercase italic tracking-wide">{team2.abbreviation}</span>
            {isTeam2Winner && (
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10B981]" />
            )}
          </div>
          <span className={`text-[15px] font-black italic font-mono tabular-nums ${isTeam2Winner ? 'text-amber-400 text-[17px]' : 'text-zinc-600'}`}>
            {series.wins2}
          </span>
        </div>
      </div>
    </div>
  );
};

interface BracketCanvasProps {
  state: FranchiseState;
  onSimulateRound: () => void;
  onSimulateUserGame: () => void;
}

export const BracketCanvas: React.FC<BracketCanvasProps> = ({ state, onSimulateRound, onSimulateUserGame }) => {
  const seriesArray = state.playoffSeries || [];

  // Sort and group playoffs series
  const playInSeries = seriesArray.filter(s => s.round === 0);
  const round1Series = seriesArray.filter(s => s.round === 1);
  const round2Series = seriesArray.filter(s => s.round === 2);
  const round3Series = seriesArray.filter(s => s.round === 3);
  const finalsSeries = seriesArray.filter(s => s.round === 4);

  const userInvolvedActiveSeries = seriesArray.find(s => 
    !s.winnerId && (s.team1Id === state.userTeamId || s.team2Id === state.userTeamId)
  );

  // Auto-detect currently active playoff round or fallback
  const activeRoundDetected = seriesArray.find(s => !s.winnerId)?.round ?? (state.championId ? 4 : 1);
  const [selectedRound, setSelectedRound] = React.useState<number>(activeRoundDetected);

  const roundsList = [
    { id: 0, label: 'Play-In', count: playInSeries.length },
    { id: 1, label: 'First Round', count: round1Series.length },
    { id: 2, label: 'Conf Semis', count: round2Series.length },
    { id: 3, label: 'Conf Finals', count: round3Series.length },
    { id: 4, label: 'Finals & Champ', count: finalsSeries.length },
  ].filter(r => r.id === 0 ? playInSeries.length > 0 : true);

  return (
    <div className="flex flex-col h-full bg-zinc-950/50 rounded-2xl md:rounded-3xl overflow-hidden border border-white/5">
      {/* Header Area */}
      <div className="p-4 bg-zinc-950/60 border-b border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
        <div className="space-y-0.5">
          <h3 className="text-base md:text-lg font-black italic uppercase tracking-tight text-white leading-tight">
            Postseason Bracket
          </h3>
          <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-wider italic leading-none">
            Play-In tournament & best-of-7 playoff matchups
          </p>
        </div>

        <div className="flex items-center gap-2">
          {userInvolvedActiveSeries && (
            <button
              onClick={onSimulateUserGame}
              className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 text-black hover:bg-amber-400 active:scale-95 rounded-xl font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all shadow-xl shadow-amber-950/20"
            >
              Simulate Matchup
            </button>
          )}
          {!state.championId && (
            <button
              onClick={onSimulateRound}
              className="flex-1 sm:flex-none px-4 py-2 bg-white text-black hover:bg-zinc-200 active:scale-95 rounded-xl font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all shadow-xl"
            >
              Simulate Game
            </button>
          )}
        </div>
      </div>

      {/* MOBILE ROUND PILL SELECTOR (Shown on mobile/small viewports only) */}
      <div className="flex md:hidden overflow-x-auto gap-2 px-4 py-3 bg-zinc-950/30 border-b border-white/5 shrink-0 no-scrollbar">
        {roundsList.map((r) => {
          const isActive = selectedRound === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setSelectedRound(r.id)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 transition-all ${
                isActive 
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10' 
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {/* RESPONSIVE LAYOUT CONTAINER */}
      {/* 1. Mobile Viewport (Only selected round is shown, completely avoiding horizontal scrolls) */}
      <div className="block md:hidden flex-1 overflow-y-auto px-4 py-6">
        {selectedRound === 0 && playInSeries.length > 0 && (
          <div className="space-y-4">
            <div className="text-center font-black text-xs text-amber-500 uppercase tracking-widest border-b border-white/5 pb-2.5 mb-4 leading-none">
              Play-In Tournament
            </div>
            <div className="space-y-4">
              {playInSeries.map(s => {
                let label = `PLAYIN GAME`;
                if (s.id.includes('7v8')) label = `${s.conference} 7v8 (G_A)`;
                else if (s.id.includes('9v10')) label = `${s.conference} 9v10 (G_B)`;
                else if (s.id.includes('final')) label = `${s.conference} Game C`;
                return (
                  <MatchupNode 
                    key={s.id} 
                    series={s} 
                    label={label} 
                    state={state} 
                    isActive={s.id === userInvolvedActiveSeries?.id}
                  />
                );
              })}
            </div>
          </div>
        )}

        {selectedRound === 1 && (
          <div className="space-y-6">
            <div className="text-center font-black text-xs text-blue-500 uppercase tracking-widest border-b border-white/5 pb-2.5 mb-4 leading-none">
              Quarterfinals (R1)
            </div>
            {round1Series.length === 0 ? (
              <div className="text-zinc-650 text-xs italic text-center py-20 uppercase font-bold tracking-wider leading-none">
                Play-In active
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-extrabold text-blue-500/70 uppercase tracking-widest text-center border-b border-white/5 pb-1">East Conference</p>
                  {round1Series.filter(s => s.conference === 'East').map((s, idx) => (
                    <MatchupNode 
                      key={s.id} 
                      series={s} 
                      label={`East QF Series ${idx+1}`} 
                      state={state} 
                      isActive={s.id === userInvolvedActiveSeries?.id}
                    />
                  ))}
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-extrabold text-red-500/70 uppercase tracking-widest text-center border-b border-white/5 pb-1">West Conference</p>
                  {round1Series.filter(s => s.conference === 'West').map((s, idx) => (
                    <MatchupNode 
                      key={s.id} 
                      series={s} 
                      label={`West QF Series ${idx+1}`} 
                      state={state} 
                      isActive={s.id === userInvolvedActiveSeries?.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedRound === 2 && (
          <div className="space-y-6">
            <div className="text-center font-black text-xs text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-2.5 mb-4 leading-none">
              Conference Semifinals (R2)
            </div>
            {round2Series.length === 0 ? (
              <div className="text-zinc-650 text-xs italic text-center py-20 uppercase font-bold tracking-wider leading-none">
                R1 series active
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-extrabold text-indigo-400/80 uppercase tracking-widest text-center border-b border-white/5 pb-1">East Semis</p>
                  {round2Series.filter(s => s.conference === 'East').map((s, idx) => (
                    <MatchupNode 
                      key={s.id} 
                      series={s} 
                      label={`East Semis ${idx+1}`} 
                      state={state} 
                      isActive={s.id === userInvolvedActiveSeries?.id}
                    />
                  ))}
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-extrabold text-red-400/80 uppercase tracking-widest text-center border-b border-white/5 pb-1">West Semis</p>
                  {round2Series.filter(s => s.conference === 'West').map((s, idx) => (
                    <MatchupNode 
                      key={s.id} 
                      series={s} 
                      label={`West Semis ${idx+1}`} 
                      state={state} 
                      isActive={s.id === userInvolvedActiveSeries?.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedRound === 3 && (
          <div className="space-y-6">
            <div className="text-center font-black text-xs text-rose-500 uppercase tracking-widest border-b border-white/5 pb-2.5 mb-4 leading-none">
              Conference Finals (R3)
            </div>
            {round3Series.length === 0 ? (
              <div className="text-zinc-650 text-xs italic text-center py-20 uppercase font-bold tracking-wider leading-none">
                R2 series active
              </div>
            ) : (
              <div className="space-y-4">
                {round3Series.map(s => (
                  <MatchupNode 
                    key={s.id} 
                    series={s} 
                    label={s.conference === 'East' ? 'East Conference Finals' : 'West Conference Finals'} 
                    state={state} 
                    isActive={s.id === userInvolvedActiveSeries?.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {selectedRound === 4 && (
          <div className="space-y-6 flex flex-col items-center">
            <div className="text-center font-black text-xs text-amber-500 uppercase tracking-widest border-b border-white/5 pb-2.5 mb-4 leading-none w-full">
              NBA Finals (R4)
            </div>
            {finalsSeries.length === 0 ? (
              <div className="text-zinc-650 text-xs italic text-center py-20 uppercase font-bold tracking-wider leading-none flex flex-col items-center">
                <Trophy className="opacity-10 mb-2" size={32} />
                Finals pending
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center gap-6 w-full">
                <Trophy className="text-amber-500 animate-pulse drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]" size={40} />
                
                {finalsSeries.map(s => (
                  <MatchupNode 
                    key={s.id} 
                    series={s} 
                    label="NBA Grand Finals" 
                    state={state} 
                    isActive={s.id === userInvolvedActiveSeries?.id}
                  />
                ))}

                {state.championId && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 100 }}
                    className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black px-5 py-3.5 rounded-2xl text-center shadow-xl w-full"
                  >
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-amber-950">
                      NBA Champion
                    </p>
                    <p className="text-sm font-black uppercase italic tracking-wide leading-none mt-1 text-[#221802]">
                      {state.teams[state.championId]?.name || 'Champion Team'}
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Desktop Viewport (Classic beautiful side-by-side wide-canvas design) */}
      <div 
        className="hidden md:flex flex-1 overflow-x-auto overflow-y-auto px-6 md:px-8 py-8 gap-8 items-stretch select-none scroll-smooth min-h-[500px]"
        style={{ 
          willChange: 'transform', 
          transform: 'translate3d(0,0,0)',
        }}
      >
        {/* Column 1: Play-In stage */}
        <div className="flex flex-col justify-around gap-6 min-w-[245px] shrink-0 border-r border-white/5 pr-6">
          <div className="text-center font-black text-xs text-amber-500 uppercase tracking-widest border-b border-amber-550/10 pb-2.5 mb-2.5 leading-none">
            Play-In Tournament
          </div>
          {playInSeries.length === 0 ? (
            <div className="text-zinc-660 text-xs italic text-center py-20 uppercase font-bold tracking-wider leading-none">
              Playoffs started
            </div>
          ) : (
            <div className="space-y-4 flex flex-col justify-around h-full">
              {playInSeries.map(s => {
                let label = `PLAYIN GAME`;
                if (s.id.includes('7v8')) label = `${s.conference} 7v8 (G_A)`;
                else if (s.id.includes('9v10')) label = `${s.conference} 9v10 (G_B)`;
                else if (s.id.includes('final')) label = `${s.conference} Game C`;
                return (
                  <MatchupNode 
                    key={s.id} 
                    series={s} 
                    label={label} 
                    state={state} 
                    isActive={s.id === userInvolvedActiveSeries?.id}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Column 2: First Round (QF) */}
        <div className="flex flex-col justify-around gap-6 min-w-[245px] shrink-0 border-r border-white/5 pr-6">
          <div className="text-center font-black text-xs text-blue-500 uppercase tracking-widest border-b border-blue-550/10 pb-2.5 mb-2.5 leading-none">
            Quarterfinals (R1)
          </div>
          {round1Series.length === 0 ? (
            <div className="text-zinc-650 text-xs italic text-center py-20 uppercase font-bold tracking-wider leading-none">
              Play-In active
            </div>
          ) : (
            <div className="flex flex-col justify-around h-full gap-4">
              <div className="space-y-3">
                <p className="text-[10px] font-extrabold text-blue-500/70 uppercase tracking-widest text-center border-b border-blue-500/5 pb-1">East Conference</p>
                {round1Series.filter(s => s.conference === 'East').map((s, idx) => (
                  <MatchupNode 
                    key={s.id} 
                    series={s} 
                    label={`East QF Series ${idx+1}`} 
                    state={state} 
                    isActive={s.id === userInvolvedActiveSeries?.id}
                  />
                ))}
              </div>
              <div className="space-y-3 mt-6">
                <p className="text-[10px] font-extrabold text-red-500/70 uppercase tracking-widest text-center border-b border-red-500/5 pb-1">West Conference</p>
                {round1Series.filter(s => s.conference === 'West').map((s, idx) => (
                  <MatchupNode 
                    key={s.id} 
                    series={s} 
                    label={`West QF Series ${idx+1}`} 
                    state={state} 
                    isActive={s.id === userInvolvedActiveSeries?.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Column 3: Conference Semifinals (R2) */}
        <div className="flex flex-col justify-around gap-6 min-w-[245px] shrink-0 border-r border-white/5 pr-6">
          <div className="text-center font-black text-xs text-indigo-400 uppercase tracking-widest border-b border-indigo-550/10 pb-2.5 mb-2.5 leading-none">
            Semifinals (R2)
          </div>
          {round2Series.length === 0 ? (
            <div className="text-zinc-650 text-xs italic text-center py-20 uppercase font-bold tracking-wider leading-none">
              R1 series active
            </div>
          ) : (
            <div className="flex flex-col justify-around h-full gap-4">
              <div className="space-y-3">
                <p className="text-[10px] font-extrabold text-indigo-400/80 uppercase tracking-widest text-center border-b border-indigo-500/5 pb-1">East Semis</p>
                {round2Series.filter(s => s.conference === 'East').map((s, idx) => (
                  <MatchupNode 
                    key={s.id} 
                    series={s} 
                    label={`East Semis ${idx+1}`} 
                    state={state} 
                    isActive={s.id === userInvolvedActiveSeries?.id}
                  />
                ))}
              </div>
              <div className="space-y-3 mt-6">
                <p className="text-[10px] font-extrabold text-red-400/80 uppercase tracking-widest text-center border-b border-red-550/5 pb-1">West Semis</p>
                {round2Series.filter(s => s.conference === 'West').map((s, idx) => (
                  <MatchupNode 
                    key={s.id} 
                    series={s} 
                    label={`West Semis ${idx+1}`} 
                    state={state} 
                    isActive={s.id === userInvolvedActiveSeries?.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Column 4: Conference Finals (R3) */}
        <div className="flex flex-col justify-around gap-6 min-w-[245px] shrink-0 border-r border-white/5 pr-6">
          <div className="text-center font-black text-xs text-rose-500 uppercase tracking-widest border-b border-rose-550/10 pb-2.5 mb-2.5 leading-none">
            Conf Finals (R3)
          </div>
          {round3Series.length === 0 ? (
            <div className="text-zinc-650 text-xs italic text-center py-20 uppercase font-bold tracking-wider leading-none">
              R2 series active
            </div>
          ) : (
            <div className="flex flex-col justify-around h-full gap-8">
              {round3Series.map(s => (
                <MatchupNode 
                  key={s.id} 
                  series={s} 
                  label={s.conference === 'East' ? 'East Conference Finals' : 'West Conference Finals'} 
                  state={state} 
                  isActive={s.id === userInvolvedActiveSeries?.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Column 5: NBA Finals & Champion */}
        <div className="flex flex-col justify-center items-center gap-6 min-w-[270px] shrink-0">
          <div className="text-center font-black text-xs text-amber-500 uppercase tracking-widest border-b border-amber-500/10 pb-2.5 mb-2.5 leading-none w-full">
            NBA Finals (R4)
          </div>
          {finalsSeries.length === 0 ? (
            <div className="text-zinc-650 text-xs italic text-center py-20 uppercase font-bold tracking-wider leading-none flex flex-col items-center">
              <Trophy className="opacity-10 mb-2" size={32} />
              Finals pending
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center gap-6 w-full">
              <Trophy className="text-amber-500 animate-pulse drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]" size={40} />
              
              {finalsSeries.map(s => (
                <MatchupNode 
                  key={s.id} 
                  series={s} 
                  label="NBA Grand Finals" 
                  state={state} 
                  isActive={s.id === userInvolvedActiveSeries?.id}
                />
              ))}

              {state.championId && (
                <motion.div 
                   initial={{ scale: 0.9, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   transition={{ type: "spring", stiffness: 100 }}
                   className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black px-5 py-3.5 rounded-2xl text-center shadow-xl w-full"
                >
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-amber-950">
                    NBA Champion
                  </p>
                  <p className="text-sm font-black uppercase italic tracking-wide leading-none mt-1 text-[#221802]">
                    {state.teams[state.championId]?.name || 'Champion Team'}
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
