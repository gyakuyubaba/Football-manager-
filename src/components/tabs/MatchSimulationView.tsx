import React, { useState, useEffect, useRef } from 'react';
import { MatchFixture, GameWorldState, TeamTactics, MatchEvent, Player } from '../../types/game';
import { simulateFullMatch, generateAssistantCoachAdvice } from '../../engine/matchEngine';
import { getDefaultTacticsForClub } from '../../data/squadPopulator';
import { FatigueGauge, ConditionDot } from '../common/FatigueGauge';
import { useI18n } from '../../i18n/LanguageContext';
import { 
  Play, 
  Pause, 
  FastForward,
  RotateCcw, 
  Activity, 
  Shield, 
  ArrowRight, 
  MessageSquare, 
  Award, 
  Check,
  Zap,
  Clock,
  Flame,
  AlertCircle
} from 'lucide-react';

interface Props {
  fixture: MatchFixture;
  state: GameWorldState;
  onFinishMatch: (updatedFixture: MatchFixture, updatedPlayers: Record<string, Player>) => void;
  onOpenPressConference: (fixture: MatchFixture) => void;
  onClose: () => void;
}

export const MatchSimulationView: React.FC<Props> = ({ 
  fixture, 
  state, 
  onFinishMatch, 
  onOpenPressConference,
  onClose 
}) => {
  const { t } = useI18n();

  const homeClub = state.clubs[fixture.homeClubId];
  const awayClub = state.clubs[fixture.awayClubId];
  const isUserHome = fixture.homeClubId === state.userClubId;

  // Match progression states
  const [matchPhase, setMatchPhase] = useState<'pre' | 'first_half' | 'halftime' | 'second_half' | 'finished'>('pre');
  const [minute, setMinute] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1); // 1x, 2x, 4x, or instant
  
  // Highlight overlay for dramatic events (Goal, Red Card, Penalty)
  const [activeHighlightEvent, setActiveHighlightEvent] = useState<MatchEvent | null>(null);

  // Active view tab in match view
  const [activeTab, setActiveTab] = useState<'pitch' | 'events' | 'stats' | 'subs'>('pitch');

  // In-match user tactical instructions
  const [tactics, setTactics] = useState<TeamTactics>(state.tactics);
  const [inMatchMentality, setInMatchMentality] = useState<'攻撃的' | 'バランス' | '守備的' | 'ゲーゲンプレス' | 'カウンター'>('バランス');

  // Pre-simulated full events & stats pool
  const [simulatedResult, setSimulatedResult] = useState<any>(null);
  const [currentScore, setCurrentScore] = useState<[number, number]>([0, 0]);
  const [revealedEvents, setRevealedEvents] = useState<MatchEvent[]>([]);
  const [subCount, setSubCount] = useState<number>(0);

  // Halftime modal toggle
  const [showHalftimeModal, setShowHalftimeModal] = useState<boolean>(false);

  // In-match substitution selector
  const [subPlayerOffId, setSubPlayerOffId] = useState<string | null>(null);
  const [subPlayerOnId, setSubPlayerOnId] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Initialize simulation pool on mount
  useEffect(() => {
    if (!homeClub || !awayClub) return;
    const homeTac = isUserHome ? state.tactics : getDefaultTacticsForClub(homeClub, state.players);
    const awayTac = !isUserHome ? state.tactics : getDefaultTacticsForClub(awayClub, state.players);

    const result = simulateFullMatch(fixture, homeClub, awayClub, homeTac, awayTac, state.players);
    setSimulatedResult(result);
  }, []);

  const isHighlightPausedRef = useRef<boolean>(false);

  // Timer loop for paced live match simulation
  useEffect(() => {
    if (!isPlaying) return;

    // Deliberate, suspenseful simulation interval (Requirement 3: "試合シミュレーション速度を遅くする"):
    // 1x = 1200ms per match minute (allows taking in match flow and commentary)
    // 2x = 500ms per match minute
    // 4x = 180ms per match minute
    const intervalTime = simSpeed === 4 ? 180 : simSpeed === 2 ? 500 : 1200;

    const interval = setInterval(() => {
      // If a dramatic event (goal, red card, penalty, VAR) is currently being highlighted, hold the clock
      if (isHighlightPausedRef.current) return;

      setMinute(prev => {
        const nextMin = prev + 1;

        // Check for events in this minute
        if (simulatedResult?.fixture?.events) {
          const newEvents = simulatedResult.fixture.events.filter((e: MatchEvent) => e.minute === nextMin);
          if (newEvents.length > 0) {
            setRevealedEvents(old => [...old, ...newEvents]);
            newEvents.forEach((e: MatchEvent) => {
              if (e.type === 'goal') {
                if (e.clubId === homeClub.id) {
                  setCurrentScore(sc => [sc[0] + 1, sc[1]]);
                } else {
                  setCurrentScore(sc => [sc[0], sc[1] + 1]);
                }

                // Pause timer and show dramatic goal celebration highlight banner (Requirements 3 & 4)
                isHighlightPausedRef.current = true;
                setActiveHighlightEvent(e);
                const pauseDuration = simSpeed === 4 ? 1800 : simSpeed === 2 ? 2600 : 3600;
                setTimeout(() => {
                  setActiveHighlightEvent(null);
                  isHighlightPausedRef.current = false;
                }, pauseDuration);
              } else if (e.type === 'red_card' || e.type === 'injury' || e.type === 'var' || e.type === 'save') {
                // Pause timer briefly for VAR, red cards, injuries, and big saves
                isHighlightPausedRef.current = true;
                setActiveHighlightEvent(e);
                const pauseDuration = simSpeed === 4 ? 1200 : simSpeed === 2 ? 1800 : 2500;
                setTimeout(() => {
                  setActiveHighlightEvent(null);
                  isHighlightPausedRef.current = false;
                }, pauseDuration);
              }
            });
          }
        }

        // Halftime at 45'
        if (nextMin === 45) {
          setIsPlaying(false);
          setMatchPhase('halftime');
          setShowHalftimeModal(true);
          return 45;
        }

        // Full time at 90'
        if (nextMin >= 90) {
          setIsPlaying(false);
          setMatchPhase('finished');
          if (simulatedResult) {
            onFinishMatch(simulatedResult.fixture, simulatedResult.updatedPlayers);
          }
          return 90;
        }

        return nextMin;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isPlaying, simSpeed, simulatedResult]);

  // Auto scroll commentary
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [revealedEvents]);

  const handleStartKickoff = () => {
    setMatchPhase('first_half');
    setIsPlaying(true);
  };

  const handleResumeSecondHalf = () => {
    setShowHalftimeModal(false);
    setMatchPhase('second_half');
    setIsPlaying(true);
  };

  // Skip simulation to end of current half or full time
  const handleInstantSkip = () => {
    if (!simulatedResult) return;
    if (minute < 45) {
      // Fast forward to half time
      const firstHalfEvents = simulatedResult.fixture.events.filter((e: MatchEvent) => e.minute <= 45);
      setRevealedEvents(firstHalfEvents);
      let hScore = 0;
      let aScore = 0;
      firstHalfEvents.forEach((e: MatchEvent) => {
        if (e.type === 'goal') {
          if (e.clubId === homeClub.id) hScore++;
          else aScore++;
        }
      });
      setCurrentScore([hScore, aScore]);
      setMinute(45);
      setIsPlaying(false);
      setMatchPhase('halftime');
      setShowHalftimeModal(true);
    } else {
      // Fast forward to full time
      const allEvents = simulatedResult.fixture.events;
      setRevealedEvents(allEvents);
      setCurrentScore([simulatedResult.fixture.homeScore ?? 0, simulatedResult.fixture.awayScore ?? 0]);
      setMinute(90);
      setIsPlaying(false);
      setMatchPhase('finished');
      onFinishMatch(simulatedResult.fixture, simulatedResult.updatedPlayers);
    }
  };

  // Perform substitution
  const handleExecuteSub = () => {
    if (!subPlayerOffId || !subPlayerOnId || subCount >= 5) return;

    const offPlayer = state.players[subPlayerOffId];
    const onPlayer = state.players[subPlayerOnId];

    // Add sub event
    const subEvent: MatchEvent = {
      minute,
      type: 'sub',
      clubId: state.userClubId || '',
      playerId: offPlayer?.id || '',
      playerName: offPlayer?.name || '',
      subInPlayerId: onPlayer?.id,
      subInPlayerName: onPlayer?.name,
      description: `🔄 選手交代: OUT: ${offPlayer?.name} (${offPlayer?.position}) ➔ IN: ${onPlayer?.name} (${onPlayer?.position})`
    };

    setRevealedEvents(prev => [...prev, subEvent]);
    setSubCount(c => c + 1);

    // Swap in active tactics
    const newStarters = tactics.lineup.starters.map(s => {
      if (s.playerId === subPlayerOffId) {
        return { ...s, playerId: subPlayerOnId };
      }
      return s;
    });
    const newBench = tactics.lineup.bench.map(id => id === subPlayerOnId ? subPlayerOffId : id);

    setTactics({
      ...tactics,
      lineup: {
        ...tactics.lineup,
        starters: newStarters,
        bench: newBench
      }
    });

    setSubPlayerOffId(null);
    setSubPlayerOnId(null);
  };

  // Extract all goals scored so far for header display
  const homeGoals = revealedEvents.filter(e => e.type === 'goal' && e.clubId === homeClub.id);
  const awayGoals = revealedEvents.filter(e => e.type === 'goal' && e.clubId === awayClub.id);

  // User club and opponent starters for lineup and fatigue view
  const userStarters = tactics.lineup.starters.map(s => state.players[s.playerId]).filter(Boolean);
  const userBench = tactics.lineup.bench.map(id => state.players[id]).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex flex-col text-slate-100">
      
      {/* MATCH HEADER SCOREBOARD */}
      <div className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 shadow-2xl backdrop-blur-md px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-6">
          
          {/* Home Club */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end text-right min-w-0">
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-1.5 justify-end">
                <span>{homeClub?.name}</span>
                {isUserHome && <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1 rounded">YOU</span>}
              </div>
              {/* Home Goalscorers */}
              <div className="text-[10px] text-emerald-400 font-mono truncate">
                {homeGoals.map(g => `${g.playerName} ${g.minute}'`).join(', ')}
              </div>
            </div>
            <div 
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0 border border-white/20 shadow-md"
              style={{ backgroundColor: homeClub?.primaryColor }}
            >
              {homeClub?.shortName}
            </div>
          </div>

          {/* Score & Match Clock Centerpiece (00:00, 05:00... time display) */}
          <div className="flex flex-col items-center justify-center px-3 py-1.5 rounded-2xl bg-slate-950 border border-slate-800 shrink-0 min-w-[130px] sm:min-w-[150px]">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white flex items-center gap-2">
              <span className={currentScore[0] > currentScore[1] ? 'text-emerald-400' : 'text-white'}>{currentScore[0]}</span>
              <span className="text-slate-500 text-lg">-</span>
              <span className={currentScore[1] > currentScore[0] ? 'text-emerald-400' : 'text-white'}>{currentScore[1]}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono mt-0.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-extrabold text-emerald-400 tracking-wider">
                {String(minute).padStart(2, '0')}:00
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 font-semibold text-[10px] uppercase">
                {matchPhase === 'pre' ? t.matchDay : 
                 matchPhase === 'halftime' ? t.halftime : 
                 matchPhase === 'finished' ? t.matchFinished : 
                 minute <= 45 ? '1st Half' : '2nd Half'}
              </span>
            </div>
          </div>

          {/* Away Club */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-start text-left min-w-0">
            <div 
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0 border border-white/20 shadow-md"
              style={{ backgroundColor: awayClub?.primaryColor }}
            >
              {awayClub?.shortName}
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-1.5">
                <span>{awayClub?.name}</span>
                {!isUserHome && <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1 rounded">YOU</span>}
              </div>
              {/* Away Goalscorers */}
              <div className="text-[10px] text-emerald-400 font-mono truncate">
                {awayGoals.map(g => `${g.playerName} ${g.minute}'`).join(', ')}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* DRAMATIC GOAL & EVENT HIGHLIGHT BANNER POPUP (Requirements 3 & 4) */}
      {activeHighlightEvent && (
        <div className={`py-3.5 px-4 shadow-2xl animate-in slide-in-from-top duration-300 z-30 flex items-center justify-center gap-3 ${
          activeHighlightEvent.type === 'goal'
            ? 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 text-slate-950 font-display'
            : activeHighlightEvent.type === 'red_card'
            ? 'bg-gradient-to-r from-red-600 via-rose-500 to-red-600 text-white'
            : activeHighlightEvent.type === 'var'
            ? 'bg-gradient-to-r from-indigo-700 via-purple-600 to-indigo-700 text-white'
            : activeHighlightEvent.type === 'save'
            ? 'bg-gradient-to-r from-blue-700 via-sky-600 to-blue-700 text-white'
            : 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950'
        }`}>
          {activeHighlightEvent.type === 'goal' ? (
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <span className="text-4xl animate-bounce">⚽</span>
              <div>
                <div className="text-xs sm:text-sm font-black tracking-widest uppercase opacity-90">
                  【GOAL!! GOAL!! GOAL!!】 {activeHighlightEvent.minute}&apos; ({String(activeHighlightEvent.minute).padStart(2, '0')}:00)
                </div>
                <div className="text-lg sm:text-2xl font-black">
                  得点者: {activeHighlightEvent.playerName}
                </div>
                {activeHighlightEvent.assistPlayerName && (
                  <div className="text-xs sm:text-sm font-bold opacity-90 mt-0.5">
                    アシスト: {activeHighlightEvent.assistPlayerName}
                  </div>
                )}
              </div>
            </div>
          ) : activeHighlightEvent.type === 'red_card' ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl">🟥</span>
              <div>
                <div className="text-xs uppercase font-extrabold tracking-wider">
                  一発退場！ RED CARD ({activeHighlightEvent.minute}&apos;)
                </div>
                <div className="font-black text-base sm:text-lg">
                  {activeHighlightEvent.playerName} にレッドカード提示
                </div>
              </div>
            </div>
          ) : activeHighlightEvent.type === 'var' ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl">📺</span>
              <div>
                <div className="text-xs uppercase font-extrabold tracking-wider text-purple-200">
                  VAR REVIEW ({activeHighlightEvent.minute}&apos;)
                </div>
                <div className="font-black text-sm sm:text-base">
                  {activeHighlightEvent.description}
                </div>
              </div>
            </div>
          ) : activeHighlightEvent.type === 'save' ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl">🧤</span>
              <div>
                <div className="text-xs uppercase font-extrabold tracking-wider text-sky-200">
                  決定機阻止 / BIG CHANCE ({activeHighlightEvent.minute}&apos;)
                </div>
                <div className="font-black text-sm sm:text-base">
                  {activeHighlightEvent.description}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚑</span>
              <div className="font-bold text-sm sm:text-base">
                {activeHighlightEvent.minute}&apos; {t.injury}: {activeHighlightEvent.playerName}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MAIN SIMULATION WORKSPACE */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-3.5 sm:px-6 py-4 space-y-4">
        
        {/* Speed & Timeline Playback Controls (Requirement 3) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md">
          {/* Play / Pause / Kickoff Button */}
          <div className="flex items-center gap-2">
            {matchPhase === 'pre' && (
              <button
                type="button"
                onClick={handleStartKickoff}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{t.kickoff}</span>
              </button>
            )}

            {(matchPhase === 'first_half' || matchPhase === 'second_half') && (
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  isPlaying 
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                    : 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlaying ? '一時停止 (Pause)' : '再開 (Resume)'}</span>
              </button>
            )}

            {matchPhase === 'halftime' && (
              <button
                type="button"
                onClick={handleResumeSecondHalf}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{t.secondHalf}</span>
              </button>
            )}

            {/* Instant Skip Button */}
            {matchPhase !== 'finished' && (
              <button
                type="button"
                onClick={handleInstantSkip}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer border border-slate-700 flex items-center gap-1.5"
                title="即時シミュレーション"
              >
                <FastForward className="w-3.5 h-3.5 text-blue-400" />
                <span>{t.speedInstant}</span>
              </button>
            )}
          </div>

          {/* Simulation Speed Toggles: 1x (Normal), 2x (Fast), 4x (Very Fast) */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-semibold px-2">{t.speed}:</span>
            {[
              { val: 1, label: t.speedNormal },
              { val: 2, label: t.speedFast },
              { val: 4, label: t.speedVeryFast }
            ].map(s => (
              <button
                key={s.val}
                type="button"
                onClick={() => setSimSpeed(s.val)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  simSpeed === s.val
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Switcher Tabs: Pitch Lineup / Events Log / Live Stats / Substitutions */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pitch')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'pitch'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            📋 選手・疲労一覧
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer relative ${
              activeTab === 'events'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            ⏱️ {t.matchEvents} ({revealedEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            📊 試合スタッツ
          </button>
          {matchPhase !== 'finished' && (
            <button
              type="button"
              onClick={() => setActiveTab('subs')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'subs'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              🔄 選手交代 ({subCount}/5)
            </button>
          )}
        </div>

        {/* TAB 1: PITCH & SQUAD FATIGUE GAUGES (Requirements 6 & 7) */}
        {activeTab === 'pitch' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">出場選手の疲労ゲージ＆コンディション一覧</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ※疲労が高まると後半の決定力・反応速度が低下し、負傷リスクが上昇します。
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">11 Players</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {userStarters.map(p => {
                // Dynamic in-match fatigue: increases as match minutes advance
                const dynamicFatigue = Math.min(100, Math.round(p.fatigue + (minute * 0.25)));

                return (
                  <div key={p.id} className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-mono">#{p.shirtNumber}</span>
                        <span className="text-xs font-bold text-blue-400 font-mono w-7">{p.position}</span>
                        <span className="text-xs font-bold text-white">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ConditionDot condition={p.condition} showLabel />
                        <span className="text-xs font-mono font-bold text-slate-300">OVR {p.ovr}</span>
                      </div>
                    </div>

                    {/* Fatigue Gauge Component */}
                    <FatigueGauge 
                      fatigue={dynamicFatigue}
                      size="sm"
                      showFraction
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: DETAILED MATCH EVENT TIMELINE & LOGS (Requirements 4 & 5) */}
        {activeTab === 'events' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>⏱️ {t.liveTimeline}</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">{revealedEvents.length} Events</span>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-2">
              {revealedEvents.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  キックオフ後に試合イベントが順次記録されます...
                </div>
              ) : (
                revealedEvents.map((e, idx) => {
                  const isHome = e.clubId === homeClub.id;
                  const club = isHome ? homeClub : awayClub;

                  return (
                    <div 
                      key={idx}
                      className={`p-3 rounded-2xl border transition-all text-xs flex items-start gap-3 ${
                        e.type === 'goal'
                          ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md shadow-emerald-500/10'
                          : e.type === 'red_card'
                          ? 'bg-red-950/40 border-red-500/60'
                          : e.type === 'yellow_card'
                          ? 'bg-amber-950/30 border-amber-500/40'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      {/* Minute badge */}
                      <span className="font-mono font-extrabold text-xs text-emerald-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 shrink-0">
                        {e.minute}&apos;
                      </span>

                      {/* Event icon & description */}
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <span className="text-sm">
                            {e.type === 'goal' ? '⚽ GOAL!' :
                             e.type === 'yellow_card' ? '🟨 YELLOW' :
                             e.type === 'red_card' ? '🟥 RED' :
                             e.type === 'injury' ? '🚑 INJURY' :
                             e.type === 'sub' ? '🔄 SUB' : '⚠️ CHANCE'}
                          </span>
                          <span>·</span>
                          <span className="text-slate-300">{club?.name}</span>
                        </div>

                        {/* Player & Scorer info */}
                        <div className="mt-1 font-semibold text-slate-200">
                          {e.type === 'goal' ? (
                            <div>
                              <span className="text-emerald-300 font-bold text-sm">{e.playerName}</span>
                              {e.assistPlayerName ? (
                                <span className="text-slate-400 text-[11px] ml-2 font-normal">
                                  ({t.assist}: {e.assistPlayerName})
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px] ml-2 font-normal">
                                  (個人技 / PK)
                                </span>
                              )}
                            </div>
                          ) : (
                            <div>{e.description}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* TAB 3: LIVE MATCH STATS */}
        {activeTab === 'stats' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800">
              📊 試合統計 (Match Statistics)
            </h3>

            <div className="space-y-4 max-w-lg mx-auto py-2 text-xs">
              {/* Possession */}
              <div>
                <div className="flex justify-between font-mono font-bold mb-1">
                  <span>{homeClub?.shortName} 52%</span>
                  <span className="text-slate-400 font-sans">{t.possession}</span>
                  <span>48% {awayClub?.shortName}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 flex overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '52%' }} />
                  <div className="h-full bg-red-500" style={{ width: '48%' }} />
                </div>
              </div>

              {/* Shots on Target */}
              <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
                <span className="font-mono font-bold text-white text-sm">{currentScore[0] * 3 + 2}</span>
                <span className="text-slate-400">{t.shotsOnTarget}</span>
                <span className="font-mono font-bold text-white text-sm">{currentScore[1] * 3 + 1}</span>
              </div>

              {/* Total Shots */}
              <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
                <span className="font-mono font-bold text-white text-sm">{currentScore[0] * 4 + 5}</span>
                <span className="text-slate-400">{t.shots}</span>
                <span className="font-mono font-bold text-white text-sm">{currentScore[1] * 4 + 4}</span>
              </div>

              {/* Expected Goals (xG) */}
              <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
                <span className="font-mono font-bold text-emerald-400 text-sm">{(currentScore[0] * 0.65 + 0.4).toFixed(2)}</span>
                <span className="text-slate-400">{t.expectedGoals}</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{(currentScore[1] * 0.65 + 0.3).toFixed(2)}</span>
              </div>

              {/* Corners */}
              <div className="flex justify-between items-center py-2">
                <span className="font-mono font-bold text-white text-sm">5</span>
                <span className="text-slate-400">{t.corners}</span>
                <span className="font-mono font-bold text-white text-sm">4</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: IN-MATCH SUBSTITUTIONS */}
        {activeTab === 'subs' && matchPhase !== 'finished' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">戦術介入・選手交代 (Substitutions)</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  交代枠: 残り {5 - subCount}名 / OUT選手とIN選手を選択して交代を実行します。
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-400">{subCount} / 5 完了</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Select Player to Sub OFF (from Starters) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-red-400">OUT (ベンチへ下げる選手)</label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {userStarters.map(p => {
                    const isSelected = subPlayerOffId === p.id;
                    const dynamicFatigue = Math.min(100, Math.round(p.fatigue + (minute * 0.25)));

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSubPlayerOffId(p.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-red-950/60 border-red-500 ring-1 ring-red-500/40'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-400 font-mono w-7">{p.position}</span>
                            <span className="text-xs font-bold text-white">{p.name}</span>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-slate-300">OVR {p.ovr}</span>
                        </div>
                        <FatigueGauge fatigue={dynamicFatigue} size="xs" showFraction />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Select Player to Sub ON (from Bench) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-emerald-400">IN (ピッチへ投入する選手)</label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {userBench.map(p => {
                    const isSelected = subPlayerOnId === p.id;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSubPlayerOnId(p.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-500/40'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-400 font-mono w-7">{p.position}</span>
                            <span className="text-xs font-bold text-white">{p.name}</span>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-slate-300">OVR {p.ovr}</span>
                        </div>
                        <FatigueGauge fatigue={p.fatigue} size="xs" showFraction />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Execute Sub Button */}
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={handleExecuteSub}
                disabled={!subPlayerOffId || !subPlayerOnId || subCount >= 5}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs sm:text-sm cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                交代を実行する (Confirm Substitution)
              </button>
            </div>
          </div>
        )}

        {/* FINISHED STATE OVERVIEW (Post-match summary, MOTM, Proceed to Press Conference) */}
        {matchPhase === 'finished' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
            <div className="text-center pb-4 border-b border-slate-800">
              <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">
                FULL TIME RESULT
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-mono">
                {homeClub?.name} {currentScore[0]} - {currentScore[1]} {awayClub?.name}
              </h2>
            </div>

            {/* Scorer Summary (Requirement 4) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
              <div>
                <div className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                  <span>⚽ {homeClub?.name} 得点者</span>
                </div>
                {homeGoals.length === 0 ? (
                  <div className="text-slate-500">得点なし</div>
                ) : (
                  homeGoals.map((g, i) => (
                    <div key={i} className="text-slate-300 font-mono py-0.5">
                      <span className="font-bold text-emerald-400">{g.playerName}</span> ({g.minute}&apos;)
                      {g.assistPlayerName && <span className="text-slate-500 text-[11px] ml-1.5">アシスト: {g.assistPlayerName}</span>}
                    </div>
                  ))
                )}
              </div>

              <div>
                <div className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                  <span>⚽ {awayClub?.name} 得点者</span>
                </div>
                {awayGoals.length === 0 ? (
                  <div className="text-slate-500">得点なし</div>
                ) : (
                  awayGoals.map((g, i) => (
                    <div key={i} className="text-slate-300 font-mono py-0.5">
                      <span className="font-bold text-emerald-400">{g.playerName}</span> ({g.minute}&apos;)
                      {g.assistPlayerName && <span className="text-slate-500 text-[11px] ml-1.5">アシスト: {g.assistPlayerName}</span>}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Proceed Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold cursor-pointer"
              >
                ホーム画面へ戻る
              </button>

              <button
                type="button"
                onClick={() => onOpenPressConference(fixture)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 cursor-pointer"
              >
                <span>{t.proceedToPress}</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
