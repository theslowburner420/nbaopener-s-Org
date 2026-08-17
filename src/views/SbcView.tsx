import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Puzzle, Trophy, Sparkles, Search, ArrowLeft, Layers, Filter, CheckCircle2, 
  Award, ChevronRight, Coins, Package, ShieldCheck, ChevronUp, ChevronDown, Eye
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { ALL_CARDS } from '../data/cards';
import { SBC_GROUPS } from '../data/sbcChallenges';
import { sbcService } from '../services/sbcService';
import { Card, SbcGroup, SbcSegment } from '../types';
import { SbcGroupCard } from '../components/sbc/SbcGroupCard';
import { SbcSegmentCard } from '../components/sbc/SbcSegmentCard';
import { SbcCourtBuilder } from '../components/sbc/SbcCourtBuilder';
import { SegmentClaimModal, GrandRewardModal } from '../components/sbc/SbcCelebrationModals';
import CardItem from '../components/CardItem';
import CardDetailModal from '../components/CardDetailModal';
import { isScreamEditionActive } from '../constants/screamEdition';

type CategoryFilter = 'all' | 'dynasty' | 'hof_legends' | 'franchise_icons' | 'fan_favourites' | 'rookie_series' | 'clutch_moments' | 'scream' | 'completed';

interface SbcViewProps {
  initialCategory?: CategoryFilter;
}

export const SbcView: React.FC<SbcViewProps> = ({ initialCategory = 'all' }) => {
  const { 
    collection, 
    customCards, 
    completedSbcs, 
    addCoins, 
    addPackToInventory, 
    addCustomCard, 
    updateGameStateAsync,
    isPremium
  } = useGame();

  // Scream Edition active status (via Halloween date window or admin override)
  const isScreamActive = isScreamEditionActive(isPremium);

  // Visible SBC Groups filtered by Scream event availability
  const visibleSbcGroups = useMemo(() => {
    return SBC_GROUPS.filter(g => {
      const isScream = g.category === 'scream' || g.id.includes('scream');
      if (isScream && !isScreamActive) {
        return false;
      }
      return true;
    });
  }, [isScreamActive]);

  // Navigation State
  const [selectedGroup, setSelectedGroup] = useState<SbcGroup | null>(null);
  const [activeSegment, setActiveSegment] = useState<SbcSegment | null>(null);

  // Filters State
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');

  // Update category when initialCategory prop changes
  React.useEffect(() => {
    if (initialCategory) {
      setCategoryFilter(initialCategory);
    }
  }, [initialCategory]);

  // Card Inspection Modal State
  const [inspectCard, setInspectCard] = useState<Card | null>(null);

  // Modals & Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [segmentClaimModalOpen, setSegmentClaimModalOpen] = useState(false);
  const [claimedSegment, setClaimedSegment] = useState<SbcSegment | null>(null);
  const [grandRewardModalOpen, setGrandRewardModalOpen] = useState(false);
  const [unlockedMasterCard, setUnlockedMasterCard] = useState<Card | null>(null);

  // All available cards pool for reward generator
  const allAvailableCards = useMemo(() => {
    return [...ALL_CARDS, ...(customCards || [])];
  }, [customCards]);

  // Duplicate cards available in collection
  const availableDuplicates = useMemo(() => {
    return sbcService.getDuplicates(collection, allAvailableCards);
  }, [collection, allAvailableCards]);

  // Total completed stats
  const totalStats = useMemo(() => {
    let completedGroups = 0;
    let completedSegments = 0;
    let totalSegments = 0;

    visibleSbcGroups.forEach(g => {
      totalSegments += g.segments.length;
      if (sbcService.isGroupCompleted(g, completedSbcs)) {
        completedGroups++;
      }
      g.segments.forEach(seg => {
        if (sbcService.isSegmentCompleted(seg.id, completedSbcs, g.id)) {
          completedSegments++;
        }
      });
    });

    return {
      completedGroups,
      totalGroups: visibleSbcGroups.length,
      completedSegments,
      totalSegments
    };
  }, [completedSbcs, visibleSbcGroups]);

  // Filtered SBC Groups for the Hub
  const filteredGroups = useMemo(() => {
    return visibleSbcGroups.filter(group => {
      const isFinished = sbcService.isGroupCompleted(group, completedSbcs);
      if (categoryFilter === 'completed') {
        if (!isFinished) return false;
      } else if (categoryFilter !== 'all' && group.category !== categoryFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          group.name.toLowerCase().includes(q) ||
          group.description.toLowerCase().includes(q) ||
          group.reward.playerName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [categoryFilter, searchQuery, completedSbcs, visibleSbcGroups]);

  // Handle submitting a squad segment
  const handleSubmitSquad = async (submittedCards: Card[]) => {
    if (!activeSegment || !selectedGroup || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 1. Deduct duplicate cards from collection (1 duplicate per card)
      const newCollection = { ...collection };
      submittedCards.forEach(c => {
        const currentQty = newCollection[c.id] || 0;
        newCollection[c.id] = Math.max(1, currentQty - 1);
      });

      // 2. Add segment ID to completed list
      const currentCompleted = completedSbcs || [];
      const newCompleted = Array.from(new Set([...currentCompleted, activeSegment.id]));

      // 3. Award segment rewards (Coins and/or Pack)
      if (activeSegment.segmentReward.coins) {
        await addCoins(activeSegment.segmentReward.coins);
      }
      if (activeSegment.segmentReward.packType) {
        await addPackToInventory({
          id: activeSegment.segmentReward.packType,
          type: activeSegment.segmentReward.packType,
          name: activeSegment.segmentReward.packName || 'Reward Pack'
        });
      }

      // 4. Check if this completes all segments in the group
      const allSegmentsDone = selectedGroup.segments.every(
        seg => seg.id === activeSegment.id || newCompleted.includes(seg.id)
      );

      if (allSegmentsDone) {
        // Mark the entire group as completed
        newCompleted.push(selectedGroup.id);

        // Generate Master Reward Card
        const rewardCard = sbcService.generateRewardCard(
          selectedGroup.reward.playerName,
          selectedGroup.reward.rarity,
          selectedGroup.reward.ovr,
          allAvailableCards,
          selectedGroup.reward.imageUrl,
          selectedGroup.reward.playerId
        );

        // Add Master Card to collection
        newCollection[rewardCard.id] = (newCollection[rewardCard.id] || 0) + 1;
        await addCustomCard(rewardCard);

        // Update state in cloud / local
        await updateGameStateAsync({
          collection: newCollection,
          completedSbcs: Array.from(new Set(newCompleted))
        });

        // Open Grand Master Reward Modal
        setUnlockedMasterCard(rewardCard);
        setGrandRewardModalOpen(true);
        setActiveSegment(null);
      } else {
        // Save intermediate segment completion
        await updateGameStateAsync({
          collection: newCollection,
          completedSbcs: newCompleted
        });

        // Open Segment Claim Modal
        setClaimedSegment(activeSegment);
        setSegmentClaimModalOpen(true);
      }
    } catch (err) {
      console.error('Error submitting SBC squad:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find next uncompleted squad in active group
  const handleProceedToNextSquad = () => {
    if (!selectedGroup) return;
    setSegmentClaimModalOpen(false);
    const nextUncompleted = selectedGroup.segments.find(
      seg => !sbcService.isSegmentCompleted(seg.id, completedSbcs, selectedGroup.id)
    );
    if (nextUncompleted) {
      setActiveSegment(nextUncompleted);
    } else {
      setActiveSegment(null);
    }
  };

  // =========================================================================
  // VIEW LEVEL 3: SQUAD CREATION COURT BUILDER
  // =========================================================================
  if (activeSegment && selectedGroup) {
    return (
      <div className="h-[100dvh] w-full flex flex-col bg-zinc-950 text-white overflow-hidden relative">
        <SbcCourtBuilder
          segment={activeSegment}
          group={selectedGroup}
          availableDuplicates={availableDuplicates}
          isSubmitting={isSubmitting}
          onBack={() => setActiveSegment(null)}
          onSubmitSquad={handleSubmitSquad}
          onInspectCard={(c) => setInspectCard(c)}
        />

        {/* Card Detail Modal */}
        <CardDetailModal
          card={inspectCard}
          onClose={() => setInspectCard(null)}
        />

        {/* Celebration Modals */}
        <SegmentClaimModal
          isOpen={segmentClaimModalOpen}
          segment={claimedSegment}
          group={selectedGroup}
          onClose={() => {
            setSegmentClaimModalOpen(false);
            setActiveSegment(null);
          }}
          onNextSquad={handleProceedToNextSquad}
          hasNextSquad={
            selectedGroup.segments.some(
              seg => !sbcService.isSegmentCompleted(seg.id, completedSbcs, selectedGroup.id)
            )
          }
        />

        <GrandRewardModal
          isOpen={grandRewardModalOpen}
          rewardCard={unlockedMasterCard}
          group={selectedGroup}
          onClose={() => {
            setGrandRewardModalOpen(false);
            setActiveSegment(null);
          }}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW LEVEL 2: SBC SET DETAILS HUB (Master Card + Squad Segments List)
  // =========================================================================
  if (selectedGroup) {
    const { completedCount, totalCount, percentage, isFinished } = sbcService.getGroupProgress(
      selectedGroup,
      completedSbcs
    );

    // Build reward preview card
    const masterPreviewCard = sbcService.generateRewardCard(
      selectedGroup.reward.playerName,
      selectedGroup.reward.rarity,
      selectedGroup.reward.ovr,
      allAvailableCards,
      selectedGroup.reward.imageUrl,
      selectedGroup.reward.playerId
    );

    return (
      <div className="min-h-screen bg-zinc-950 text-white p-3 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto flex flex-col gap-4 sm:gap-6">
          {/* Header Navigation */}
          <div className="flex items-center justify-between bg-zinc-900/90 border border-white/10 rounded-2xl p-3 sm:p-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedGroup(null)}
              className="p-2 sm:p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 sm:gap-2 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to SBCs</span>
            </motion.button>

            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="text-[10px] sm:text-xs uppercase font-bold text-zinc-400 shrink-0">
                SBC Set:
              </span>
              <span className="text-xs sm:text-sm font-black text-amber-400 truncate max-w-[140px] sm:max-w-none">
                {selectedGroup.name}
              </span>
            </div>
          </div>

          {/* Master Card & Progress Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 bg-gradient-to-b from-zinc-900/90 via-zinc-900/50 to-zinc-950 border border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl items-center">
            {/* Left: 3D Master Card Showcase with Inspect Action */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-1 sm:p-2">
              <div 
                onClick={() => setInspectCard(masterPreviewCard)}
                className="relative group cursor-zoom-in flex flex-col items-center max-w-[220px] w-full"
                title="Click to inspect card in 3D"
              >
                <div className="absolute -inset-3 bg-gradient-to-r from-amber-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />
                <CardItem card={masterPreviewCard} isOwned={true} width={200} onClick={() => setInspectCard(masterPreviewCard)} />
                
                {/* Inspect Button Pill */}
                <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/90 hover:bg-amber-500 hover:text-zinc-950 text-amber-300 border border-amber-400/40 text-[11px] sm:text-xs font-bold transition-all shadow-md">
                  <Eye className="w-3.5 h-3.5" />
                  <span>3D Inspect Card</span>
                </div>
              </div>
            </div>

            {/* Right: Set Information & Progress */}
            <div className="lg:col-span-7 flex flex-col justify-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                  Master Reward Card
                </span>
                {isFinished && (
                  <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] sm:text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Unlocked & Claimed</span>
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">
                {selectedGroup.name}
              </h1>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {selectedGroup.description}
              </p>

              {/* Progress Box */}
              <div className="bg-black/50 border border-white/10 rounded-2xl p-3.5 sm:p-4 mt-1 sm:mt-2">
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 font-bold text-zinc-300 text-[11px] sm:text-xs">
                    <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                    <span>Squad Challenges Progress</span>
                  </div>
                  <span className={`font-black text-[11px] sm:text-xs ${isFinished ? 'text-emerald-400' : 'text-amber-300'}`}>
                    {completedCount} / {totalCount} Squads ({percentage}%)
                  </span>
                </div>

                <div className="w-full h-2.5 sm:h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full rounded-full ${
                      isFinished
                        ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]'
                        : 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Squad Challenges (Segments) List */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Puzzle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <span>Required Squads ({selectedGroup.segments.length})</span>
              </h3>
              <span className="text-[10px] sm:text-xs text-zinc-400">
                Complete all to unlock Master
              </span>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              {selectedGroup.segments.map((segment, idx) => {
                const isSegDone = sbcService.isSegmentCompleted(
                  segment.id,
                  completedSbcs,
                  selectedGroup.id
                );
                return (
                  <SbcSegmentCard
                    key={segment.id || idx}
                    segment={segment}
                    index={idx}
                    isCompleted={isSegDone}
                    onBuildSquad={(seg) => setActiveSegment(seg)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Card Detail Modal */}
        <CardDetailModal
          card={inspectCard}
          onClose={() => setInspectCard(null)}
        />

        {/* Grand Reward Modal if user triggers it */}
        <GrandRewardModal
          isOpen={grandRewardModalOpen}
          rewardCard={unlockedMasterCard}
          group={selectedGroup}
          onClose={() => setGrandRewardModalOpen(false)}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW LEVEL 1: SBC MAIN HUB (Overview, Categories, Search, Grid)
  // =========================================================================
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-5">
        {/* Minimalist Top Control Bar: Category Filter Tabs & Search */}
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center justify-between">
          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All SBCs', icon: '🎯' },
              ...(isScreamActive ? [{ id: 'scream', label: 'Scream Edition', icon: '🎃' }] : []),
              { id: 'dynasty', label: 'Dynasty Special', icon: '👑' },
              { id: 'hof_legends', label: 'HOF Legends', icon: '⭐' },
              { id: 'franchise_icons', label: 'Franchise Icons', icon: '🏆' },
              { id: 'fan_favourites', label: 'Fan Favourites', icon: '🔥' },
              { id: 'rookie_series', label: 'Rookie Series', icon: '🌟' },
              { id: 'clutch_moments', label: 'Clutch Moments', icon: '⚡' },
              { id: 'completed', label: 'Completed', icon: '✓' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id as CategoryFilter)}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  categoryFilter === tab.id
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-white/5'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search challenge or player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-amber-400 transition-colors"
            />
          </div>
        </div>

        {/* SBC Sets Grid */}
        {filteredGroups.length === 0 ? (
          <div className="py-16 sm:py-20 text-center bg-zinc-900/50 rounded-3xl border border-white/5">
            <Puzzle className="w-10 h-10 sm:w-12 sm:h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm sm:text-base font-bold text-zinc-400">No SBC Challenges Found</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Try adjusting your search query or category filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
            {filteredGroups.map(group => (
              <SbcGroupCard
                key={group.id}
                group={group}
                completedSbcs={completedSbcs || []}
                allCardsPool={allAvailableCards}
                onSelect={(g) => setSelectedGroup(g)}
                onInspectCard={(c) => setInspectCard(c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Detail Modal */}
      <CardDetailModal
        card={inspectCard}
        onClose={() => setInspectCard(null)}
      />
    </div>
  );
};

export default SbcView;

