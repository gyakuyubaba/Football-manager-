import React, { useState, useEffect } from 'react';
import { 
  GameWorldState, 
  ManagerProfile, 
  MatchFixture, 
  Player, 
  TeamTactics, 
  NewsItem, 
  YouthProspect 
} from './types/game';
import { 
  createNewGameWorld, 
  getInitialClubOffers, 
  appointUserToClub, 
  loadGameState, 
  saveGameState, 
  clearGameState,
  resetGameWorldToInitial
} from './engine/gameState';
import { advanceOneDay, fastForwardUntil } from './engine/dateEngine';
import { HeaderNav } from './components/HeaderNav';
import { BottomTabBar, MainTab } from './components/BottomTabBar';
import { ManagerCreationModal } from './components/ManagerCreationModal';
import { ClubOfferModal } from './components/ClubOfferModal';
import { ResetConfirmationModal } from './components/ResetConfirmationModal';
import { HomeDashboardTab } from './components/tabs/HomeDashboardTab';
import { TacticsSquadTab } from './components/tabs/TacticsSquadTab';
import { TransferMarketTab } from './components/tabs/TransferMarketTab';
import { CompetitionsTab } from './components/tabs/CompetitionsTab';
import { ManagerCareerTab } from './components/tabs/ManagerCareerTab';
import { MatchSimulationView } from './components/tabs/MatchSimulationView';
import { PressConferenceModal } from './components/tabs/PressConferenceModal';
import { PlayerDetailModal } from './components/PlayerDetailModal';
import { Bell, AlertCircle, CheckCircle } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameWorldState | null>(null);
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Modal overlays
  const [activeMatchFixture, setActiveMatchFixture] = useState<MatchFixture | null>(null);
  const [activePressFixture, setActivePressFixture] = useState<MatchFixture | null>(null);
  const [inspectingPlayer, setInspectingPlayer] = useState<Player | null>(null);
  const [dayAlertMessage, setDayAlertMessage] = useState<string | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);

  // Initialize or load existing career
  useEffect(() => {
    const saved = loadGameState();
    if (saved) {
      setGameState(saved);
    }
  }, []);

  // Save game state whenever it changes
  useEffect(() => {
    if (gameState) {
      saveGameState(gameState);
    }
  }, [gameState]);

  // Step 1: Manager Creation
  const handleManagerCreated = (profile: ManagerProfile) => {
    const newWorld = createNewGameWorld(profile);
    setGameState(newWorld);
  };

  // Step 2: Club Selection from 5 offers
  const handleClubSelected = (clubId: string) => {
    if (!gameState) return;
    const updated = appointUserToClub(gameState, clubId);
    setGameState(updated);
    setActiveTab('home');
  };

  // Date advance 1 day
  const handleAdvanceDay = () => {
    if (!gameState || isSimulating) return;

    setIsSimulating(true);
    const result = advanceOneDay(gameState);
    setGameState(result.updatedState);
    setIsSimulating(false);

    if (result.hasUserMatchToday && result.userMatchFixture) {
      setActiveMatchFixture(result.userMatchFixture);
    } else if (result.stoppedReason) {
      setDayAlertMessage(result.stoppedReason);
    }
  };

  // Smart Fast Forward
  const handleFastForward = (type: 'next_match' | 'transfer_deadline' | 'days_7' | 'end_of_month') => {
    if (!gameState || isSimulating) return;

    setIsSimulating(true);
    const result = fastForwardUntil(gameState, type);
    setGameState(result.updatedState);
    setIsSimulating(false);

    if (result.hasUserMatchToday && result.userMatchFixture) {
      setActiveMatchFixture(result.userMatchFixture);
    } else if (result.stoppedReason) {
      setDayAlertMessage(result.stoppedReason);
    }
  };

  // Update Tactics
  const handleUpdateTactics = (tactics: TeamTactics) => {
    if (!gameState) return;
    setGameState({
      ...gameState,
      tactics
    });
  };

  // Pre-season registration
  const handleSelectPreSeason = (tournamentId: string) => {
    if (!gameState || !gameState.userClubId) return;
    const userClub = gameState.clubs[gameState.userClubId];
    userClub.transferBudget += 2000000; // Registration prep bonus

    const regNews: NewsItem = {
      id: `news_ps_reg_${Date.now()}`,
      date: gameState.currentDate,
      headline: `【プレシーズン参加決定】${userClub.name}、国際サマーツアーへの参戦を正式発表！`,
      body: `新シーズンへの調整と世界的なクラブブランド拡大を目指し、${userClub.name}がサマーツアーへの参加登録を完了しました。主力選手の連携向上とともに、新加入選手の適応に期待が集まります。`,
      category: 'tournament',
      relatedClubId: userClub.id,
      importance: 'high'
    };

    setGameState({
      ...gameState,
      selectedPreSeason: tournamentId,
      news: [regNews, ...gameState.news]
    });

    setDayAlertMessage('プレシーズン大会への参加登録が完了しました！賞金および調整試合が追加されます。');
  };

  // Post match completion
  const handleFinishMatch = (updatedFixture: MatchFixture, updatedPlayers: Record<string, Player>) => {
    if (!gameState) return;

    const fixtureIdx = gameState.fixtures.findIndex(f => f.id === updatedFixture.id);
    const updatedFixtures = [...gameState.fixtures];
    if (fixtureIdx !== -1) {
      updatedFixtures[fixtureIdx] = updatedFixture;
    }

    // Check consecutive losses & manager record
    const isUserHome = updatedFixture.homeClubId === gameState.userClubId;
    const userScore = isUserHome ? (updatedFixture.homeScore ?? 0) : (updatedFixture.awayScore ?? 0);
    const oppScore = isUserHome ? (updatedFixture.awayScore ?? 0) : (updatedFixture.homeScore ?? 0);

    let wins = gameState.manager.wins;
    let draws = gameState.manager.draws;
    let losses = gameState.manager.losses;
    let consecutiveLosses = gameState.consecutiveLosses;
    let boardConfidence = gameState.boardConfidence;

    if (userScore > oppScore) {
      wins++;
      consecutiveLosses = 0;
      boardConfidence = Math.min(100, boardConfidence + 3);
    } else if (userScore === oppScore) {
      draws++;
      consecutiveLosses = 0;
    } else {
      losses++;
      consecutiveLosses++;
      boardConfidence = Math.max(10, boardConfidence - 4);
    }

    const updatedManager: ManagerProfile = {
      ...gameState.manager,
      matchesManaged: gameState.manager.matchesManaged + 1,
      wins,
      draws,
      losses,
      reputation: Math.min(99, gameState.manager.reputation + (userScore > oppScore ? 1 : 0))
    };

    const nextState: GameWorldState = {
      ...gameState,
      fixtures: updatedFixtures,
      players: updatedPlayers,
      manager: updatedManager,
      consecutiveLosses,
      boardConfidence
    };

    setGameState(nextState);
  };

  // Press conference completion
  const handlePressComplete = (news: NewsItem, trustDelta: number, boardDelta: number) => {
    if (!gameState) return;

    setGameState({
      ...gameState,
      boardConfidence: Math.min(100, Math.max(10, gameState.boardConfidence + boardDelta)),
      news: [news, ...gameState.news]
    });

    setActivePressFixture(null);
    setActiveMatchFixture(null);
  };

  // Promote youth player to first team
  const handlePromoteYouth = (prospect: YouthProspect) => {
    if (!gameState || !gameState.userClubId) return;

    const newPlayerId = `promoted_${prospect.id}_${Date.now()}`;
    const newPlayer: Player = {
      id: newPlayerId,
      name: prospect.name,
      age: prospect.age,
      birthDate: `${2026 - prospect.age}-08-10`,
      nationality: prospect.nationality,
      position: prospect.position,
      altPositions: [],
      preferredFoot: '右',
      ovr: prospect.ovr,
      potential: prospect.potential,
      pace: 76,
      shooting: 68,
      passing: 72,
      dribbling: 74,
      defending: 50,
      physical: 65,
      gk: 10,
      marketValue: 2500000,
      wage: 8000,
      contractYears: 3,
      clubId: gameState.userClubId,
      squadRole: '若手・育成枠',
      isLoaned: false,
      playstyle: prospect.playstyle,
      personality: prospect.personality,
      managerTrust: 85,
      relationships: [],
      condition: 'pink',
      fatigue: 0,
      injury: { isInjured: false },
      suspension: { isSuspended: false, matchesRemaining: 0 },
      stats: { appearances: 0, starts: 0, minutes: 0, goals: 0, assists: 0, cleanSheets: 0, yellowCards: 0, redCards: 0, avgRating: 0 },
      shirtNumber: 38
    };

    const updatedPlayers = { ...gameState.players, [newPlayerId]: newPlayer };
    const userClub = gameState.clubs[gameState.userClubId];
    userClub.playerIds.push(newPlayerId);

    const updatedYouth = gameState.youthAcademy.map(y => y.id === prospect.id ? { ...y, promoted: true } : y);

    const promoteNews: NewsItem = {
      id: `news_prom_${Date.now()}`,
      date: gameState.currentDate,
      headline: `【アカデミー昇格】${userClub.name}、期待の新星${prospect.name}のトップ昇格を発表！`,
      body: `下部組織から逸材がトップチーム入り。${prospect.position}の${prospect.name}（${prospect.age}歳）がプロ契約を締結しました。指揮官は「将来を担う偉大なタレント」と太鼓判を押しています。`,
      category: 'youth',
      relatedClubId: userClub.id,
      relatedPlayerId: newPlayerId,
      importance: 'medium'
    };

    setGameState({
      ...gameState,
      players: updatedPlayers,
      youthAcademy: updatedYouth,
      news: [promoteNews, ...gameState.news]
    });

    setDayAlertMessage(`【昇格完了】${prospect.name} がトップチームに登録されました！`);
  };

  // Complete Career Reset with Automated Verification (Requirements 9-13)
  const handleExecuteResetCareer = (): { success: boolean; error?: string } => {
    // 1. Run automated verification & reset
    const result = resetGameWorldToInitial();
    if (!result.success) {
      console.error('Reset verification failed:', result.error);
      return { success: false, error: result.error || '初期化データ検証に失敗しました。' };
    }

    // 2. Clear all active modals and alerts
    setActiveMatchFixture(null);
    setActivePressFixture(null);
    setInspectingPlayer(null);
    setDayAlertMessage(null);
    setActiveTab('home');

    // 3. Clear memory state so App transitions back to ManagerCreationModal
    clearGameState();
    setGameState(null);

    return { success: true };
  };

  // Direct trigger
  const handleOpenResetModal = () => {
    setShowResetConfirmModal(true);
  };

  // PHASE 1: NO GAME STATE YET -> CREATE MANAGER
  if (!gameState) {
    return <ManagerCreationModal onComplete={handleManagerCreated} />;
  }

  // PHASE 2: MANAGER CREATED, BUT NO CLUB SELECTED -> SHOW 5 OFFERS
  if (!gameState.userClubId) {
    const offers = getInitialClubOffers(gameState.clubs);
    return (
      <ClubOfferModal 
        manager={gameState.manager} 
        offers={offers} 
        onSelectClub={handleClubSelected} 
      />
    );
  }

  // PHASE 3: MAIN FOOTBALL MANAGER INTERFACE
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Top Bar Navigation */}
      <HeaderNav
        state={gameState}
        onAdvanceDay={handleAdvanceDay}
        onFastForward={handleFastForward}
        onRequestReset={handleOpenResetModal}
        onResetCareer={handleOpenResetModal}
        isSimulating={isSimulating}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3.5 sm:px-6 pt-4 pb-20">
        {activeTab === 'home' && (
          <HomeDashboardTab
            state={gameState}
            onOpenMatch={(f) => setActiveMatchFixture(f)}
            onSelectPreSeason={handleSelectPreSeason}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'tactics' && (
          <TacticsSquadTab
            state={gameState}
            onUpdateTactics={handleUpdateTactics}
            onSelectPlayer={(p) => setInspectingPlayer(p)}
          />
        )}

        {activeTab === 'transfers' && (
          <TransferMarketTab
            state={gameState}
            onUpdateState={(ns) => setGameState(ns)}
            onSelectPlayer={(p) => setInspectingPlayer(p)}
          />
        )}

        {activeTab === 'fixtures' && (
          <CompetitionsTab
            state={gameState}
            onOpenMatch={(f) => setActiveMatchFixture(f)}
          />
        )}

        {activeTab === 'club' && (
          <ManagerCareerTab
            state={gameState}
            onUpdateState={(ns) => setGameState(ns)}
            onPromoteYouth={handlePromoteYouth}
            onRequestReset={handleOpenResetModal}
            onResetCareer={handleOpenResetModal}
          />
        )}
      </main>

      {/* Ergonomic Bottom Thumb Bar */}
      <BottomTabBar
        activeTab={activeTab}
        onChangeTab={(t) => setActiveTab(t)}
        unreadNewsCount={gameState.news.length}
        hasMatchToday={gameState.fixtures.some(f => f.date === gameState.currentDate && (f.homeClubId === gameState.userClubId || f.awayClubId === gameState.userClubId) && f.status === 'upcoming')}
      />

      {/* MATCH SIMULATION MODAL */}
      {activeMatchFixture && (
        <MatchSimulationView
          fixture={activeMatchFixture}
          state={gameState}
          onFinishMatch={handleFinishMatch}
          onOpenPressConference={(f) => {
            setActivePressFixture(f);
            setActiveMatchFixture(null);
          }}
          onClose={() => setActiveMatchFixture(null)}
        />
      )}

      {/* POST-MATCH PRESS CONFERENCE MODAL */}
      {activePressFixture && (
        <PressConferenceModal
          fixture={activePressFixture}
          state={gameState}
          onComplete={handlePressComplete}
          onClose={() => setActivePressFixture(null)}
        />
      )}

      {/* PLAYER DETAILS INSPECTOR MODAL */}
      {inspectingPlayer && (
        <PlayerDetailModal
          player={inspectingPlayer}
          club={stateClubForPlayer(gameState, inspectingPlayer.clubId)}
          onClose={() => setInspectingPlayer(null)}
        />
      )}

      {/* DAY PROGRESSION ALERT POPUP */}
      {dayAlertMessage && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <Bell className="w-5 h-5 text-emerald-400" />
                <h4 className="text-base font-bold text-white">日程進行 注目イベント通知</h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {dayAlertMessage}
              </p>
              <div className="text-right pt-2">
                <button
                  type="button"
                  onClick={() => setDayAlertMessage(null)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  確認して再開
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL RESET CONFIRMATION MODAL (Root Level to prevent clipping & z-index issues) */}
      <ResetConfirmationModal
        isOpen={showResetConfirmModal}
        onClose={() => setShowResetConfirmModal(false)}
        onConfirm={handleExecuteResetCareer}
      />

    </div>
  );
}

function stateClubForPlayer(state: GameWorldState, clubId: string) {
  return state.clubs[clubId] || null;
}
