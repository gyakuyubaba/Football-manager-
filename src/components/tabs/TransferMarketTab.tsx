import React, { useState } from 'react';
import { GameWorldState, Player, Position, TransferNegotiation } from '../../types/game';
import { 
  handleClubNegotiationStep, 
  handlePlayerNegotiationStep, 
  executeTransferCompletion 
} from '../../engine/transferEngine';
import { 
  Search, 
  Filter, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  Building,
  UserCheck
} from 'lucide-react';

interface Props {
  state: GameWorldState;
  onUpdateState: (newState: GameWorldState) => void;
  onSelectPlayer: (player: Player) => void;
}

export const TransferMarketTab: React.FC<Props> = ({ state, onUpdateState, onSelectPlayer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [activeNegotiation, setActiveNegotiation] = useState<TransferNegotiation | null>(null);

  // Negotiation input states
  const [bidFee, setBidFee] = useState<number>(0);
  const [isLoanBid, setIsLoanBid] = useState<boolean>(false);
  const [wageOffer, setWageOffer] = useState<number>(0);
  const [contractYears, setContractYears] = useState<number>(3);
  const [squadRole, setSquadRole] = useState<Player['squadRole']>('重要選手');
  const [signingBonus, setSigningBonus] = useState<number>(500000);

  const userClub = state.userClubId ? state.clubs[state.userClubId] : null;

  // Filter players not already in user's club
  const allTargetPlayers = Object.values(state.players).filter(p => {
    if (p.clubId === state.userClubId) return false;
    if (positionFilter !== 'ALL' && p.position !== positionFilter) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Sort by OVR descending
  allTargetPlayers.sort((a, b) => b.ovr - a.ovr);

  const startNegotiation = (targetPlayer: Player) => {
    const sellerClub = state.clubs[targetPlayer.clubId];
    if (!sellerClub || !userClub) return;

    const initialBid = targetPlayer.marketValue;
    const initialNegotiation: TransferNegotiation = {
      id: `neg_${Date.now()}`,
      playerId: targetPlayer.id,
      sellerClubId: sellerClub.id,
      buyerClubId: userClub.id,
      status: 'club_negotiating',
      isLoan: false,
      initialAskingPrice: Math.round(targetPlayer.marketValue * 1.15),
      currentBidFee: initialBid,
      clubPatience: 3,
      clubMessages: [
        {
          sender: 'ai',
          text: `「${sellerClub.name}の担当者です。${targetPlayer.name}（市場価値 €${(targetPlayer.marketValue / 1000000).toFixed(1)}M）の獲得オファーを受領しました。提示条件をご提示ください。」`,
          date: '今日'
        }
      ],
      wageOffered: Math.round(targetPlayer.wage * 1.2),
      wageDemanded: Math.round(targetPlayer.wage * 1.2),
      contractYearsOffered: 3,
      squadRoleOffered: targetPlayer.ovr >= 85 ? '絶対的主力' : '重要選手',
      signingBonusOffered: 500000,
      playerPatience: 3,
      playerMessages: []
    };

    setBidFee(initialBid);
    setWageOffer(Math.round(targetPlayer.wage * 1.2));
    setActiveNegotiation(initialNegotiation);
  };

  const submitClubBid = () => {
    if (!activeNegotiation || !userClub) return;
    const targetPlayer = state.players[activeNegotiation.playerId];
    const sellerClub = state.clubs[activeNegotiation.sellerClubId];
    if (!targetPlayer || !sellerClub) return;

    const res = handleClubNegotiationStep(activeNegotiation, bidFee, sellerClub, targetPlayer);
    setActiveNegotiation(res.updatedNegotiation);

    if (res.isAgreed) {
      // Initialize player stage
      const updatedWithPlayerStage: TransferNegotiation = {
        ...res.updatedNegotiation,
        status: 'player_negotiating',
        playerMessages: [
          {
            sender: 'agent',
            text: `「${targetPlayer.name}の公認代理人です。クラブ間合意の報告を受けました。本人の希望条件は週給€${Math.round(targetPlayer.wage * 1.2).toLocaleString()}、複数年契約、および明確なチーム内役割です。」`,
            date: '今日'
          }
        ]
      };
      setActiveNegotiation(updatedWithPlayerStage);
    }
  };

  const submitPlayerContractBid = () => {
    if (!activeNegotiation || !userClub) return;
    const targetPlayer = state.players[activeNegotiation.playerId];
    if (!targetPlayer) return;

    const res = handlePlayerNegotiationStep(
      activeNegotiation,
      wageOffer,
      contractYears,
      squadRole,
      signingBonus,
      targetPlayer,
      userClub
    );

    setActiveNegotiation(res.updatedNegotiation);

    if (res.isCompleted) {
      // Finalize transfer atomically
      const updatedState = executeTransferCompletion(state, res.updatedNegotiation);
      onUpdateState(updatedState);
    }
  };

  const targetPlayerInNeg = activeNegotiation ? state.players[activeNegotiation.playerId] : null;
  const sellerClubInNeg = activeNegotiation ? state.clubs[activeNegotiation.sellerClubId] : null;

  return (
    <div className="space-y-5 pb-20">
      
      {/* Header & Market Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white font-display">移籍市場 & スカウティング</h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              {state.isTransferWindowOpen ? `開口中 (残${state.transferWindowClosingDays}日)` : '閉塞中'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            世界各国の実在トップ選手を検索し、クラブ間交渉および本人・代理人との契約合意を経て獲得します。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-2xl text-right">
            <div className="text-[11px] text-slate-400">使用可能 移籍予算</div>
            <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
              €{((userClub?.transferBudget || 0) / 1000000).toFixed(1)}M
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="選手名で検索 (例: 久保, Saka, Haaland, 三笘...)"
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'ST', 'CF', 'RW', 'LW', 'CAM', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK'].map(pos => (
            <button
              key={pos}
              type="button"
              onClick={() => setPositionFilter(pos)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 font-mono ${
                positionFilter === pos
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* Players List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl">
        <div className="text-xs text-slate-400 mb-3 flex items-center justify-between">
          <span>検索結果: {allTargetPlayers.length} 名</span>
          <span>市場価値は推定評価額です。獲得交渉額とは異なります。</span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {allTargetPlayers.map(p => {
            const club = state.clubs[p.clubId];
            return (
              <div 
                key={p.id} 
                className="py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
              >
                {/* Left: Player identity */}
                <div 
                  onClick={() => onSelectPlayer(p)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs shrink-0 font-mono">
                    {p.ovr}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white hover:text-emerald-300 transition-colors">
                        {p.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 font-mono text-[10px] font-bold border border-blue-800/60">
                        {p.position}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {p.age}歳 · {p.nationality} · 所属: <strong className="text-slate-300">{club?.name || 'フリー'}</strong>
                    </div>
                  </div>
                </div>

                {/* Center: Attributes snapshot */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-center text-[10px] font-mono">
                  <div className="bg-slate-950 px-2 py-1 rounded-lg">
                    <span className="text-slate-500 block">PAC</span>
                    <span className="font-bold text-white">{p.pace}</span>
                  </div>
                  <div className="bg-slate-950 px-2 py-1 rounded-lg">
                    <span className="text-slate-500 block">SHO</span>
                    <span className="font-bold text-white">{p.shooting}</span>
                  </div>
                  <div className="bg-slate-950 px-2 py-1 rounded-lg">
                    <span className="text-slate-500 block">PAS</span>
                    <span className="font-bold text-white">{p.passing}</span>
                  </div>
                  <div className="bg-slate-950 px-2 py-1 rounded-lg">
                    <span className="text-slate-500 block">DRI</span>
                    <span className="font-bold text-white">{p.dribbling}</span>
                  </div>
                  <div className="hidden sm:block bg-slate-950 px-2 py-1 rounded-lg">
                    <span className="text-slate-500 block">DEF</span>
                    <span className="font-bold text-white">{p.defending}</span>
                  </div>
                  <div className="hidden sm:block bg-slate-950 px-2 py-1 rounded-lg">
                    <span className="text-slate-500 block">PHY</span>
                    <span className="font-bold text-white">{p.physical}</span>
                  </div>
                </div>

                {/* Right: Valuation & Make Bid Button */}
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400 font-mono">
                      €{(p.marketValue / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-[10px] text-slate-500">週給 €{(p.wage / 1000).toFixed(0)}k · 契{p.contractYears}年</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => startNegotiation(p)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                  >
                    獲得交渉を開始
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-STAGE TRANSFER NEGOTIATION MODAL */}
      {activeNegotiation && targetPlayerInNeg && sellerClubInNeg && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md">
          <div className="flex min-h-full items-start justify-center p-3 sm:p-6">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl my-4 sm:my-8 text-left pb-10">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <span className="text-xs text-emerald-400 uppercase tracking-wider font-semibold font-mono">
                  {activeNegotiation.status === 'club_negotiating' ? 'STAGE 1: クラブ間移籍金交渉' : activeNegotiation.status === 'player_negotiating' ? 'STAGE 2: 選手・代理人契約交渉' : 'TRANSFER NEGOTIATION'}
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  {targetPlayerInNeg.name} ({targetPlayerInNeg.position}, {targetPlayerInNeg.age}歳)
                </h3>
                <div className="text-xs text-slate-400">
                  現所属: {sellerClubInNeg.name} · 市場評価額: €{(targetPlayerInNeg.marketValue / 1000000).toFixed(1)}M
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveNegotiation(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* STAGE 1: CLUB NEGOTIATION */}
            {activeNegotiation.status === 'club_negotiating' && (
              <div className="space-y-4">
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 max-h-52 overflow-y-auto space-y-2.5">
                  {activeNegotiation.clubMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`p-3 rounded-xl text-xs leading-relaxed ${
                        msg.sender === 'ai' 
                          ? 'bg-slate-900 border border-slate-800 text-slate-200' 
                          : 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-200 text-right'
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>

                <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/80">
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                    <span>提示移籍金 (オファー額)</span>
                    <span className="font-mono text-emerald-400 font-bold text-base">
                      €{(bidFee / 1000000).toFixed(1)}M
                    </span>
                  </div>

                  <input
                    type="range"
                    min={Math.round(targetPlayerInNeg.marketValue * 0.4)}
                    max={Math.round(targetPlayerInNeg.marketValue * 2.0)}
                    step={1000000}
                    value={bidFee}
                    onChange={e => setBidFee(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span>最低下限: €{(targetPlayerInNeg.marketValue * 0.4 / 1000000).toFixed(1)}M</span>
                    <span>相手クラブ残忍耐度: <strong className="text-amber-400">{activeNegotiation.clubPatience}回</strong></span>
                    <span>上限: €{(targetPlayerInNeg.marketValue * 2 / 1000000).toFixed(1)}M</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveNegotiation(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    交渉を保留して戻る
                  </button>

                  <button
                    type="button"
                    onClick={submitClubBid}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    €{(bidFee / 1000000).toFixed(1)}M の正式オファーを提示
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2: PLAYER CONTRACT NEGOTIATION */}
            {activeNegotiation.status === 'player_negotiating' && (
              <div className="space-y-4">
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-3 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>クラブ間移籍金合意完了！次に選手本人および公認代理人と個人条件を交渉します。</span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 max-h-48 overflow-y-auto space-y-2">
                  {activeNegotiation.playerMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`p-3 rounded-xl text-xs leading-relaxed ${
                        msg.sender === 'agent' 
                          ? 'bg-slate-900 border border-slate-800 text-slate-200' 
                          : 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-200 text-right'
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>

                {/* Contract Options Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-800/60 rounded-2xl p-4 border border-slate-700/80">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">提示週給 (Weekly Wage)</label>
                    <input
                      type="number"
                      step={5000}
                      value={wageOffer}
                      onChange={e => setWageOffer(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white"
                    />
                    <span className="text-[10px] text-slate-500">現在給与: €{targetPlayerInNeg.wage.toLocaleString()} /週</span>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">契約期間</label>
                    <select
                      value={contractYears}
                      onChange={e => setContractYears(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value={1}>1年間</option>
                      <option value={2}>2年間</option>
                      <option value={3}>3年間 (標準)</option>
                      <option value={4}>4年間</option>
                      <option value={5}>5年間 (長期大型契約)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">チーム内での役割 (Squad Role)</label>
                    <select
                      value={squadRole}
                      onChange={e => setSquadRole(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="絶対的主力">絶対的主力 (Key Player)</option>
                      <option value="重要選手">重要選手 (Important)</option>
                      <option value="ローテーション">ローテーション (Rotation)</option>
                      <option value="控え・バックアップ">控え・バックアップ (Backup)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">契約ボーナス (Signing Bonus)</label>
                    <input
                      type="number"
                      step={100000}
                      value={signingBonus}
                      onChange={e => setSigningBonus(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-slate-500">代理人残忍耐度: {activeNegotiation.playerPatience}回</span>

                  <button
                    type="button"
                    onClick={submitPlayerContractBid}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    個人合意の提示・契約書送付
                  </button>
                </div>
              </div>
            )}

            {/* COMPLETED SUCCESS */}
            {activeNegotiation.status === 'completed' && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white font-display">
                  TRANSFER COMPLETED!
                </h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  {targetPlayerInNeg.name} が正式に {userClub?.name} の一員となりました！
                  背番号やスタメン起用は「戦術・編成」タブにて設定可能です。
                </p>
                <button
                  type="button"
                  onClick={() => setActiveNegotiation(null)}
                  className="px-8 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20"
                >
                  完了してスカッドを確認する
                </button>
              </div>
            )}

            {/* COLLAPSED FAILURE */}
            {activeNegotiation.status === 'collapsed' && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto text-red-400">
                  <XCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white font-display">
                  交渉破談 (NEGOTIATION FAILED)
                </h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  提示条件が相手側の許容水準を満たさず、交渉は永久に打ち切られました。
                  他のターゲットに切り替えて補強活動を進めてください。
                </p>
                <button
                  type="button"
                  onClick={() => setActiveNegotiation(null)}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                >
                  閉じる
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
      )}

    </div>
  );
};
