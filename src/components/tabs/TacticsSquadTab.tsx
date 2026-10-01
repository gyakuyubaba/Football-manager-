import React, { useState } from 'react';
import { GameWorldState, TeamTactics, FormationName, Player, Position, NewsItem } from '../../types/game';
import { Shield, Users, Activity, Shuffle, Sliders, AlertCircle, AlertTriangle } from 'lucide-react';

interface Props {
  state: GameWorldState;
  onUpdateTactics: (tactics: TeamTactics) => void;
  onSelectPlayer: (player: Player) => void;
  onUpdateState?: (newState: GameWorldState) => void;
}

const FORMATIONS: FormationName[] = [
  '4-3-3',
  '4-2-3-1',
  '4-4-2',
  '4-1-4-1',
  '3-5-2',
  '3-4-3',
  '3-4-2-1',
  '5-3-2',
  '5-4-1',
  '4-3-1-2'
];

export const TacticsSquadTab: React.FC<Props> = ({ state, onUpdateTactics, onSelectPlayer, onUpdateState }) => {
  const [selectedStarterId, setSelectedStarterId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'lineup' | 'instructions' | 'roles'>('lineup');
  const [benchLimitError, setBenchLimitError] = useState<string | null>(null);

  const userClub = state.userClubId ? state.clubs[state.userClubId] : null;
  const tactics = state.tactics;

  // Media reaction when a key/star player is unexpectedly excluded to OUT_OF_SQUAD (Requirement 10)
  const triggerStarPlayerBenchOutSpeculation = (p: Player) => {
    if (!p || p.ovr < 80 || p.injury?.isInjured || p.injuryStatus === 'INJURED' || p.suspension?.isSuspended) {
      return;
    }
    const headlines = [
      `【現地報道】${p.name}、まさかのベンチ外。移籍を希望しているのではないかとの憶測も`,
      `【戦術の波紋】主力${p.name}がメンバー外。監督との関係に注目集まる`
    ];
    const bodies = [
      `本日のチーム発表で主力選手である${p.name}がベンチ外となったことが判明。負傷や累積警告などの公式発表がない中でのメンバー外宣告に対し、現地メディアやファンコミュニティでは「今夏の移籍を希望しているのではないか」「監督との関係悪化の可能性も」など様々な憶測が飛び交っています。`,
      `看板選手の${p.name}が登録外に。現地記者は「首脳陣との戦術的対立や関係悪化によるものの可能性がある。今後の起用法次第では退団報道が過熱するだろう」と報じています。`
    ];
    const chosenIdx = Math.floor(Math.random() * headlines.length);
    const speculationNews: NewsItem = {
      id: `news_speculation_${Date.now()}_${p.id}`,
      date: state.currentDate,
      headline: headlines[chosenIdx],
      body: bodies[chosenIdx],
      category: 'press',
      relatedClubId: state.userClubId || undefined,
      relatedPlayerId: p.id,
      importance: 'high'
    };
    if (onUpdateState) {
      onUpdateState({
        ...state,
        news: [speculationNews, ...state.news]
      });
    }
  };

  // Swap starter with bench or out-of-squad player
  const handleSwap = (targetPlayerId: string) => {
    if (!selectedStarterId) return;
    setBenchLimitError(null);

    const targetPlayer = state.players[targetPlayerId];
    if (targetPlayer?.injury?.isInjured || targetPlayer?.injuryStatus === 'INJURED' || (state.currentDate && targetPlayer?.injuryReturnDate && targetPlayer.injuryReturnDate > state.currentDate)) {
      setBenchLimitError(`【負傷警告】${targetPlayer.name}選手は負傷中のため、スタメンに出場・登録できません。(復帰予定: ${targetPlayer.injuryReturnDate || '未定'})`);
      return;
    }

    const newStarters = tactics.lineup.starters.map(s => {
      if (s.playerId === selectedStarterId) {
        return { ...s, playerId: targetPlayerId };
      }
      return s;
    });

    let newBench = tactics.lineup.bench.map(id => {
      if (id === targetPlayerId) return selectedStarterId;
      return id;
    });

    // If target was in reserves (out of squad), add previous starter to bench or out of squad
    if (!tactics.lineup.bench.includes(targetPlayerId)) {
      if (newBench.length < 9) {
        newBench.push(selectedStarterId);
      }
    }

    // Update squadStatus on players
    const updatedPlayers = { ...state.players };
    if (updatedPlayers[targetPlayerId]) updatedPlayers[targetPlayerId].squadStatus = 'STARTING';
    if (updatedPlayers[selectedStarterId]) {
      const willBeOutOfSquad = !newBench.includes(selectedStarterId);
      updatedPlayers[selectedStarterId].squadStatus = willBeOutOfSquad ? 'OUT_OF_SQUAD' : 'BENCH';
      if (willBeOutOfSquad) {
        triggerStarPlayerBenchOutSpeculation(updatedPlayers[selectedStarterId]);
      }
    }

    onUpdateTactics({
      ...tactics,
      lineup: {
        ...tactics.lineup,
        starters: newStarters,
        bench: newBench
      }
    });

    setSelectedStarterId(null);
  };

  // Move player from out-of-squad to bench (Strict 9-player maximum check: Requirement 11)
  const handlePromoteToBench = (playerId: string) => {
    const p = state.players[playerId];
    if (p?.injury?.isInjured || p?.injuryStatus === 'INJURED' || (state.currentDate && p?.injuryReturnDate && p.injuryReturnDate > state.currentDate)) {
      setBenchLimitError(`【負傷警告】${p?.name || 'この'}選手は負傷中のため、ベンチに登録できません。(復帰予定: ${p?.injuryReturnDate || '未定'})`);
      return;
    }

    let newBench = [...tactics.lineup.bench];
    if (newBench.length >= 9) {
      setBenchLimitError('ベンチには最大9人まで登録できます。');
      return;
    }
    setBenchLimitError(null);
    newBench.push(playerId);
    if (state.players[playerId]) {
      state.players[playerId].squadStatus = 'BENCH';
    }

    onUpdateTactics({
      ...tactics,
      lineup: {
        ...tactics.lineup,
        bench: newBench
      }
    });
  };

  // Demote player from bench to out-of-squad (Requirement 10 & 12)
  const handleDemoteToOutOfSquad = (playerId: string) => {
    setBenchLimitError(null);
    const newBench = tactics.lineup.bench.filter(id => id !== playerId);
    const demoted = state.players[playerId];
    if (demoted) {
      demoted.squadStatus = 'OUT_OF_SQUAD';
      triggerStarPlayerBenchOutSpeculation(demoted);
    }

    onUpdateTactics({
      ...tactics,
      lineup: {
        ...tactics.lineup,
        bench: newBench
      }
    });
  };

  const handleFormationChange = (formation: FormationName) => {
    onUpdateTactics({
      ...tactics,
      formation
    });
  };

  const renderConditionDot = (condition: Player['condition']) => {
    switch (condition) {
      case 'pink':
        return <span className="inline-block w-2.5 h-2.5 rounded-full bg-pink-500 shadow-sm shadow-pink-500/50" title="絶好調 (+8%)" />;
      case 'red':
        return <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" title="好調 (+4%)" />;
      case 'yellow':
        return <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400" title="普通 (0%)" />;
      case 'cyan':
        return <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400" title="不調 (-4%)" />;
      case 'purple':
        return <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500" title="絶不調 (-8%)" />;
      default:
        return <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-400" />;
    }
  };

  const starters = tactics.lineup.starters.map(s => {
    const player = state.players[s.playerId];
    return { ...s, player };
  });

  const benchPlayers = tactics.lineup.bench.map(id => state.players[id]).filter(Boolean);
  const reservePlayers = (userClub?.playerIds || [])
    .filter(id => !tactics.lineup.starters.some(s => s.playerId === id) && !tactics.lineup.bench.includes(id))
    .map(id => state.players[id])
    .filter(Boolean);

  return (
    <div className="space-y-5 pb-20">
      
      {/* Header with Sub-tabs & Formation Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white font-display">チーム編成・戦術司令塔</h2>
          <div className="text-xs text-slate-400 mt-0.5">
            所属選手: {userClub?.playerIds.length || 0}名 · スカッド登録完了
          </div>
        </div>

        {/* Formation dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">フォーメーション:</span>
          <select
            value={tactics.formation}
            onChange={e => handleFormationChange(e.target.value as FormationName)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors"
          >
            {FORMATIONS.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('lineup')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'lineup'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          メンバー選定（スタメン・ベンチ）
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('instructions')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'instructions'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          戦術指示（スタイル・プレス・ライン）
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('roles')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'roles'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          役割・キッカー指定
        </button>
      </div>

      {/* TAB 1: LINEUP & TACTICAL BOARD */}
      {activeSubTab === 'lineup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Tactical Pitch Board (5 cols on lg) */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
              <span className="font-semibold text-emerald-400 uppercase tracking-wider font-mono">
                TACTICAL BOARD ({tactics.formation})
              </span>
              <span className="text-[11px] text-slate-500">
                {selectedStarterId ? '入れ替えるベンチ選手を選択' : 'タップで交代選択'}
              </span>
            </div>

            {/* Pitch Container with Grass Pattern */}
            <div className="relative w-full aspect-[3/4] pitch-pattern rounded-2xl border-2 border-emerald-600/40 p-3 overflow-hidden shadow-inner flex flex-col justify-between">
              
              {/* Pitch Markings SVG Overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-40">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  {/* Outer border */}
                  <rect x="5%" y="4%" width="90%" height="92%" fill="none" stroke="#fff" strokeWidth="2" />
                  {/* Halfway line */}
                  <line x1="5%" y1="50%" x2="95%" y2="50%" stroke="#fff" strokeWidth="2" />
                  {/* Center circle */}
                  <circle cx="50%" cy="50%" r="14%" fill="none" stroke="#fff" strokeWidth="2" />
                  <circle cx="50%" cy="50%" r="1.5%" fill="#fff" />
                  {/* Penalty box top */}
                  <rect x="25%" y="4%" width="50%" height="16%" fill="none" stroke="#fff" strokeWidth="2" />
                  <rect x="37%" y="4%" width="26%" height="6%" fill="none" stroke="#fff" strokeWidth="2" />
                  {/* Penalty box bottom */}
                  <rect x="25%" y="80%" width="50%" height="16%" fill="none" stroke="#fff" strokeWidth="2" />
                  <rect x="37%" y="90%" width="26%" height="6%" fill="none" stroke="#fff" strokeWidth="2" />
                </svg>
              </div>

              {/* Starter Player Pins */}
              {starters.map((item, idx) => {
                const p = item.player;
                if (!p) return null;
                const isSelected = selectedStarterId === p.id;
                const isUnavailable = p.injury.isInjured || p.suspension.isSuspended;

                return (
                  <button
                    key={p.id + idx}
                    type="button"
                    onClick={() => setSelectedStarterId(isSelected ? null : p.id)}
                    style={{
                      position: 'absolute',
                      left: `${item.pitchX}%`,
                      top: `${item.pitchY}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    className={`group z-10 flex flex-col items-center cursor-pointer transition-transform ${
                      isSelected ? 'scale-110' : 'hover:scale-105'
                    }`}
                  >
                    {/* Circle Avatar / Number */}
                    <div 
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-lg border-2 transition-all ${
                        isSelected 
                          ? 'border-yellow-400 bg-yellow-400 text-slate-950 ring-4 ring-yellow-400/30' 
                          : isUnavailable 
                            ? 'border-red-500 bg-red-950/80 text-red-200' 
                            : 'border-white bg-slate-950 text-white group-hover:border-emerald-400'
                      }`}
                    >
                      {p.shirtNumber}
                    </div>

                    {/* Name Badge */}
                    <div className="bg-slate-950/90 border border-slate-700/80 px-2 py-0.5 rounded-md mt-1 text-[10px] text-white flex items-center gap-1 shadow-md whitespace-nowrap">
                      {renderConditionDot(p.condition)}
                      <span className="font-bold">{p.name.split(' ')[0]}</span>
                      <span className="text-emerald-400 font-mono">{p.ovr}</span>
                    </div>

                    {isUnavailable && (
                      <span className="text-[9px] bg-red-600 text-white font-bold px-1 rounded mt-0.5">
                        出場不可
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lineup Tables (7 cols on lg) */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Starters Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  先発メンバー (Starting XI)
                </span>
                <span className="text-xs text-slate-400 font-mono">11名</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800 pb-1">
                      <th className="py-1.5 px-2">背番号</th>
                      <th className="py-1.5 px-2">位置</th>
                      <th className="py-1.5 px-2">選手名</th>
                      <th className="py-1.5 px-1 text-center">調子</th>
                      <th className="py-1.5 px-2 text-right">OVR</th>
                      <th className="py-1.5 px-2 text-right">疲労</th>
                      <th className="py-1.5 px-2 text-center">状態</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {starters.map(({ player: p }) => {
                      if (!p) return null;
                      const isSelected = selectedStarterId === p.id;
                      const isInjured = p.injury.isInjured;
                      const isSuspended = p.suspension.isSuspended;

                      return (
                        <tr 
                          key={p.id}
                          onClick={() => setSelectedStarterId(isSelected ? null : p.id)}
                          className={`hover:bg-slate-800/60 transition-colors cursor-pointer ${
                            isSelected ? 'bg-emerald-950/40 text-emerald-200' : 'text-slate-200'
                          }`}
                        >
                          <td className="py-2 px-2 font-mono text-slate-400">#{p.shirtNumber}</td>
                          <td className="py-2 px-2">
                            <span className="font-bold text-emerald-400 font-mono">{p.position}</span>
                          </td>
                          <td className="py-2 px-2">
                            <div 
                              onClick={(e) => { e.stopPropagation(); onSelectPlayer(p); }}
                              className="font-bold hover:underline"
                            >
                              {p.name}
                            </div>
                            <div className="text-[10px] text-slate-500">{p.playstyle}</div>
                          </td>
                          <td className="py-2 px-1 text-center">
                            {renderConditionDot(p.condition)}
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-bold text-white">
                            {p.ovr}
                          </td>
                          <td className="py-2 px-2 text-right font-mono">
                            <span className={p.fatigue > 40 ? 'text-red-400' : 'text-slate-400'}>
                              {p.fatigue}%
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center">
                            {isInjured ? (
                              <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 text-[10px] font-bold border border-red-800">
                                負傷
                              </span>
                            ) : isSuspended ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 text-[10px] font-bold border border-amber-800">
                                停止
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-400">良好</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bench Table (Strict 9-player maximum: Requirement 11) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl">
              {benchLimitError && (
                <div className="mb-3 p-3 bg-red-950/80 border border-red-500 rounded-2xl flex items-center justify-between text-xs text-red-200 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="font-bold">{benchLimitError}</span>
                  </div>
                  <button type="button" onClick={() => setBenchLimitError(null)} className="text-red-400 hover:text-white text-xs font-bold cursor-pointer">
                    ✕
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    ベンチメンバー (最大9人 / 現在 {benchPlayers.length}名)
                  </span>
                  {selectedStarterId && (
                    <span className="ml-2 text-[11px] text-yellow-400 font-semibold">
                      ← 交代させたい選手をタップしてください
                    </span>
                  )}
                </div>
                <span className={`text-xs font-mono font-bold ${benchPlayers.length >= 9 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {benchPlayers.length}/9名
                </span>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {benchPlayers.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (selectedStarterId) {
                        handleSwap(p.id);
                      } else {
                        onSelectPlayer(p);
                      }
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      selectedStarterId 
                        ? 'border-emerald-500/50 hover:bg-emerald-950/30' 
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-slate-500 font-mono text-[11px]">#{p.shirtNumber}</span>
                      <span className="w-8 font-bold text-blue-400 font-mono text-xs">{p.position}</span>
                      <div>
                        <div className="text-xs font-bold text-white">{p.name}</div>
                        <div className="text-[10px] text-slate-500">{p.age}歳 · {p.playstyle}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {renderConditionDot(p.condition)}
                      <span className="text-xs font-mono font-bold text-white">{p.ovr}</span>
                      {selectedStarterId ? (
                        <button
                          type="button"
                          className="px-2 py-1 rounded bg-emerald-500 text-slate-950 text-[10px] font-bold"
                        >
                          交代
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDemoteToOutOfSquad(p.id); }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-300 text-[10px] border border-slate-700"
                          title="ベンチ外へ移動"
                        >
                          外す
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bench-Out (OUT_OF_SQUAD / 登録外・リザーブ) (Requirements 6, 7, 8) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    ベンチ外メンバー (Out of Squad / Reserves)
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    ※移籍加入選手・負傷者・疲労休養・若手育成枠。試合には直接出場できません。
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-mono">{reservePlayers.length}名</span>
              </div>

              {reservePlayers.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500">
                  現在ベンチ外の選手はいません。全選手がスタメンまたはベンチに登録されています。
                </div>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {reservePlayers.map(p => {
                    const isInjured = p.injury?.isInjured || p.injuryStatus === 'INJURED';
                    const isFatigued = p.fatigue > 45;
                    const isSuspended = p.suspension?.isSuspended;

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (selectedStarterId && !isInjured && !isSuspended) {
                            handleSwap(p.id);
                          } else {
                            onSelectPlayer(p);
                          }
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                          selectedStarterId && !isInjured && !isSuspended
                            ? 'border-yellow-500/50 hover:bg-yellow-950/20'
                            : 'border-slate-800/80 bg-slate-950/40 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 text-slate-600 font-mono text-[11px]">#{p.shirtNumber}</span>
                          <span className="w-8 font-semibold text-slate-400 font-mono text-xs">{p.position}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-200 truncate">{p.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {isInjured && (
                                <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-400 text-[9px] font-bold border border-red-800">
                                  負傷 (全治{p.injury?.recoveryDays || 7}日)
                                </span>
                              )}
                              {isFatigued && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 text-[9px] font-bold border border-amber-800">
                                  疲労高 ({p.fatigue}%)
                                </span>
                              )}
                              {isSuspended && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-400 text-[9px] font-bold border border-purple-800">
                                  出場停止
                                </span>
                              )}
                              {!isInjured && !isFatigued && !isSuspended && (
                                <span className="text-[10px] text-slate-500">
                                  {p.age <= 21 ? '若手育成' : '戦術待機'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {renderConditionDot(p.condition)}
                          <span className="text-xs font-mono font-bold text-slate-300">{p.ovr}</span>
                          
                          {selectedStarterId ? (
                            <button
                              type="button"
                              disabled={isInjured || isSuspended}
                              className={`px-2 py-1 rounded text-[10px] font-bold ${
                                isInjured || isSuspended 
                                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                                  : 'bg-emerald-500 text-slate-950'
                              }`}
                            >
                              スタメンへ
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isInjured || isSuspended}
                              onClick={(e) => { e.stopPropagation(); handlePromoteToBench(p.id); }}
                              className={`px-2 py-1 rounded text-[10px] border font-semibold ${
                                isInjured || isSuspended
                                  ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 border-slate-700'
                              }`}
                            >
                              {isInjured ? '負傷中' : isSuspended ? '出場停止' : 'ベンチへ'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: TACTICAL INSTRUCTIONS */}
      {activeSubTab === 'instructions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white">詳細戦術パラメータ設定</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              プレースタイルや相手クラブの相性に合わせて、攻撃・守備の原則を設定します。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Attacking Style */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">攻撃スタイル (Build-up)</label>
              <select
                value={tactics.instructions.attackingStyle}
                onChange={e => onUpdateTactics({
                  ...tactics,
                  instructions: { ...tactics.instructions, attackingStyle: e.target.value as any }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ポゼッション・パス">ポゼッション・パス（ショートパスでじっくり崩す）</option>
                <option value="ダイレクト・カウンター">ダイレクト・カウンター（ボール奪取時即座に縦へ）</option>
                <option value="サイド攻撃・クロス">サイド攻撃・クロス（ウイング突破から中央へ放り込む）</option>
                <option value="中央突破">中央突破（バイタルエリアでワンツー連携）</option>
              </select>
            </div>

            {/* Defensive Style */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">守備スタイル (Pressing)</label>
              <select
                value={tactics.instructions.defensiveStyle}
                onChange={e => onUpdateTactics({
                  ...tactics,
                  instructions: { ...tactics.instructions, defensiveStyle: e.target.value as any }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ハイプレス">ハイプレス（敵陣深くからボール狩り）</option>
                <option value="ミドルブロック">ミドルブロック（中盤で網を張りパスカット）</option>
                <option value="ローブロック・堅守">ローブロック・堅守（自陣ペナルティエリア前を固める）</option>
                <option value="ゲーゲンプレス">ゲーゲンプレス（奪われた瞬間5秒以内の全力即時奪還）</option>
              </select>
            </div>

            {/* Defensive Line */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">ディフェンスラインの高さ</label>
              <select
                value={tactics.instructions.defensiveLine}
                onChange={e => onUpdateTactics({
                  ...tactics,
                  instructions: { ...tactics.instructions, defensiveLine: e.target.value as any }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ハイライン">ハイライン（オフサイドトラップ、コンパクト陣形）</option>
                <option value="標準">標準（バランスの取れた位置取り）</option>
                <option value="ディープライン">ディープライン（裏のスペースを警戒し深めに配置）</option>
              </select>
            </div>

            {/* Tempo */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">試合のテンポ・ペース配分</label>
              <select
                value={tactics.instructions.tempo}
                onChange={e => onUpdateTactics({
                  ...tactics,
                  instructions: { ...tactics.instructions, tempo: e.target.value as any }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="高速テンポ">高速テンポ（素早いパス回し、攻守の切り替え最優先）</option>
                <option value="標準">標準テンポ</option>
                <option value="じっくりビルドアップ">じっくりビルドアップ（安全第一、無理な勝負は避ける）</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ROLES & SET PIECES */}
      {activeSubTab === 'roles' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white">キャプテン & セットプレーキッカー指名</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              リーダーシップやキック精度に応じた役割分担を決定します。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">キャプテン (主将)</label>
              <select
                value={tactics.roles.captainId || ''}
                onChange={e => onUpdateTactics({
                  ...tactics,
                  roles: { ...tactics.roles, captainId: e.target.value }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              >
                {starters.map(({ player: p }) => p && (
                  <option key={p.id} value={p.id}>{p.name} ({p.position}, OVR {p.ovr})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">PKキッカー</label>
              <select
                value={tactics.roles.penaltyTakerId || ''}
                onChange={e => onUpdateTactics({
                  ...tactics,
                  roles: { ...tactics.roles, penaltyTakerId: e.target.value }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              >
                {starters.map(({ player: p }) => p && (
                  <option key={p.id} value={p.id}>{p.name} (決定力 {p.shooting})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">FKキッカー (直接・間接)</label>
              <select
                value={tactics.roles.freeKickTakerId || ''}
                onChange={e => onUpdateTactics({
                  ...tactics,
                  roles: { ...tactics.roles, freeKickTakerId: e.target.value }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              >
                {starters.map(({ player: p }) => p && (
                  <option key={p.id} value={p.id}>{p.name} (パス {p.passing})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">CKキッカー (コーナーキック)</label>
              <select
                value={tactics.roles.cornerTakerId || ''}
                onChange={e => onUpdateTactics({
                  ...tactics,
                  roles: { ...tactics.roles, cornerTakerId: e.target.value }
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              >
                {starters.map(({ player: p }) => p && (
                  <option key={p.id} value={p.id}>{p.name} (パス {p.passing})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
