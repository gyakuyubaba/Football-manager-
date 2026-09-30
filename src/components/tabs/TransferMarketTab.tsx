import React, { useState } from 'react';
import { GameWorldState, Player, Position, TransferNegotiation, IncomingAIOffer } from '../../types/game';
import { 
  handleClubNegotiationStep, 
  handlePlayerNegotiationStep, 
  executeTransferCompletion,
  evaluateAICounterProposal
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
  const [negotiationType, setNegotiationType] = useState<'permanent' | 'loan' | 'buy_option' | 'dev_loan'>('permanent');
  const [buyOptionFee, setBuyOptionFee] = useState<number>(0);
  const [bidFee, setBidFee] = useState<number>(0);
  const [wageOffer, setWageOffer] = useState<number>(0);
  const [contractYears, setContractYears] = useState<number>(3);
  const [squadRole, setSquadRole] = useState<Player['squadRole']>('重要選手');
  const [signingBonus, setSigningBonus] = useState<number>(500000);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);

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

  const getCooldownDays = (playerId: string): number => {
    const neg = state.negotiations[playerId];
    if (!neg || !neg.cooldownUntil) return 0;
    const diff = Math.ceil((new Date(neg.cooldownUntil).getTime() - new Date(state.currentDate).getTime()) / (1000 * 3600 * 24));
    return Math.max(0, diff);
  };

  const startNegotiation = (targetPlayer: Player) => {
    const cooldown = getCooldownDays(targetPlayer.id);
    if (cooldown > 0) {
      alert(`この選手との交渉は、あと ${cooldown} 日間できません。`);
      return;
    }

    const sellerClub = state.clubs[targetPlayer.clubId];
    if (!sellerClub || !userClub) return;

    setNegotiationType('permanent');
    setBuyOptionFee(Math.round(targetPlayer.marketValue * 1.3));
    setBudgetError(null);

    const initialBid = targetPlayer.marketValue;
    const initialNegotiation: TransferNegotiation = {
      id: `neg_${Date.now()}`,
      playerId: targetPlayer.id,
      sellerClubId: sellerClub.id,
      buyerClubId: userClub.id,
      status: 'club_negotiating',
      isLoan: false,
      negotiationType: 'permanent',
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

    // Budget check (Requirement 3)
    if (bidFee > userClub.transferBudget) {
      setBudgetError(`移籍予算が不足しています (所持予算: €${(userClub.transferBudget / 1000000).toFixed(1)}M / 提示額: €${(bidFee / 1000000).toFixed(1)}M)`);
      return;
    }
    setBudgetError(null);

    const updatedWithMode: TransferNegotiation = {
      ...activeNegotiation,
      isLoan: negotiationType !== 'permanent',
      negotiationType,
      buyOptionFee: negotiationType === 'buy_option' ? buyOptionFee : undefined
    };

    const res = handleClubNegotiationStep(updatedWithMode, bidFee, sellerClub, targetPlayer, state.currentDate);
    setActiveNegotiation(res.updatedNegotiation);

    // Save cooldown in state if collapsed
    if (res.isCollapsed && res.updatedNegotiation.cooldownUntil) {
      onUpdateState({
        ...state,
        negotiations: {
          ...state.negotiations,
          [targetPlayer.id]: res.updatedNegotiation
        }
      });
    }

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

    // Wage budget check (Requirement 3)
    const availableWage = userClub.wageBudget - userClub.currentWageSpend;
    if (wageOffer > availableWage) {
      setBudgetError(`週給予算が不足しています (空き週給枠: €${(availableWage / 1000).toFixed(0)}k / 提示週給: €${(wageOffer / 1000).toFixed(0)}k)`);
      return;
    }
    setBudgetError(null);

    const res = handlePlayerNegotiationStep(
      activeNegotiation,
      wageOffer,
      contractYears,
      squadRole,
      signingBonus,
      targetPlayer,
      userClub,
      state.currentDate
    );

    setActiveNegotiation(res.updatedNegotiation);

    if (res.isCollapsed && res.updatedNegotiation.cooldownUntil) {
      onUpdateState({
        ...state,
        negotiations: {
          ...state.negotiations,
          [targetPlayer.id]: res.updatedNegotiation
        }
      });
    }

    if (res.isCompleted) {
      // Finalize transfer atomically
      const updatedState = executeTransferCompletion(state, res.updatedNegotiation);
      onUpdateState(updatedState);
    }
  };

  // Handle incoming AI offer action (Accept / Reject)
  const handleIncomingOfferAction = (offerId: string, action: 'accept' | 'reject') => {
    const offer = state.incomingOffers?.find(o => o.id === offerId);
    if (!offer || !userClub) return;

    if (action === 'reject') {
      const updatedOffers = state.incomingOffers?.map(o => o.id === offerId ? { ...o, status: 'rejected' as const } : o);
      onUpdateState({ ...state, incomingOffers: updatedOffers });
      return;
    }

    // Accept transfer / loan
    const targetPlayer = state.players[offer.playerId];
    const buyerClub = state.clubs[offer.buyerClubId];
    if (!targetPlayer || !buyerClub) return;

    const mockNeg: TransferNegotiation = {
      id: `in_neg_${Date.now()}`,
      playerId: targetPlayer.id,
      sellerClubId: userClub.id,
      buyerClubId: buyerClub.id,
      status: 'completed',
      isLoan: offer.type !== 'permanent',
      negotiationType: offer.type,
      buyOptionFee: offer.buyOptionFee,
      initialAskingPrice: offer.fee,
      currentBidFee: offer.fee,
      clubPatience: 3,
      clubMessages: [],
      wageOffered: targetPlayer.wage,
      wageDemanded: targetPlayer.wage,
      contractYearsOffered: 3,
      squadRoleOffered: '重要選手',
      signingBonusOffered: 0,
      playerPatience: 3,
      playerMessages: []
    };

    const nextState = executeTransferCompletion(state, mockNeg);
    const updatedOffers = nextState.incomingOffers?.map(o => o.id === offerId ? { ...o, status: 'accepted' as const } : o);
    onUpdateState({ ...nextState, incomingOffers: updatedOffers });
    setDirectNegotiatingOfferId(null);
  };

  // Direct Negotiation for incoming offers (Requirements 5, 6, 7)
  const [directNegotiatingOfferId, setDirectNegotiatingOfferId] = useState<string | null>(null);
  const [proposedFee, setProposedFee] = useState<number>(0);
  const [proposedBonus, setProposedBonus] = useState<number>(0);
  const [installments, setInstallments] = useState<number>(1);
  const [sellOnPercentage, setSellOnPercentage] = useState<number>(0);
  const [buybackClause, setBuybackClause] = useState<boolean>(false);
  const [negotiationAgreed, setNegotiationAgreed] = useState<boolean>(false);

  const startDirectNegotiation = (offer: IncomingAIOffer) => {
    setDirectNegotiatingOfferId(offer.id);
    setProposedFee(offer.fee);
    setProposedBonus(offer.bonusFee || 0);
    setInstallments(offer.installments || 1);
    setSellOnPercentage(offer.sellOnPercentage || 0);
    setBuybackClause(offer.buybackClause || false);
    setNegotiationAgreed(false);
  };

  const handleSendCounterProposal = (offer: IncomingAIOffer) => {
    const targetPlayer = state.players[offer.playerId];
    const buyerClub = state.clubs[offer.buyerClubId];
    if (!targetPlayer || !buyerClub) return;

    const result = evaluateAICounterProposal(
      offer,
      targetPlayer,
      buyerClub,
      proposedFee,
      proposedBonus,
      installments,
      sellOnPercentage,
      buybackClause
    );

    const updatedDialogue = [
      ...(offer.dialogueHistory || []),
      {
        speaker: 'user' as const,
        message: `監督/クラブ提示: 「移籍金 €${(proposedFee / 1000000).toFixed(1)}M${proposedBonus > 0 ? ` ＋ 活躍ボーナス €${(proposedBonus / 1000000).toFixed(1)}M` : ''}${installments > 1 ? ` (${installments}回分割)` : ''}${sellOnPercentage > 0 ? ` (次回売却益${sellOnPercentage}%)` : ''}${buybackClause ? ` (買戻し特約)` : ''} を提案する。」`,
        termsSummary: `移籍金: €${(proposedFee / 1000000).toFixed(1)}M`
      },
      {
        speaker: 'ai' as const,
        message: `${buyerClub.name}: ${result.aiMessage}`,
        termsSummary: result.decision === 'counter' ? `再提示: €${((result.counterFee || proposedFee) / 1000000).toFixed(1)}M` : undefined
      }
    ];

    if (result.decision === 'accept') {
      setNegotiationAgreed(true);
      const updatedOffer: IncomingAIOffer = {
        ...offer,
        fee: proposedFee,
        bonusFee: proposedBonus,
        installments,
        sellOnPercentage,
        buybackClause,
        aiPatience: result.newPatience,
        dialogueHistory: updatedDialogue
      };
      const updatedOffers = state.incomingOffers?.map(o => o.id === offer.id ? updatedOffer : o);
      onUpdateState({ ...state, incomingOffers: updatedOffers });
    } else if (result.decision === 'reject') {
      const updatedOffer: IncomingAIOffer = {
        ...offer,
        status: 'rejected',
        aiPatience: 0,
        dialogueHistory: updatedDialogue
      };
      const updatedOffers = state.incomingOffers?.map(o => o.id === offer.id ? updatedOffer : o);
      onUpdateState({ ...state, incomingOffers: updatedOffers });
    } else {
      // Counter offer from AI
      if (result.counterFee) setProposedFee(result.counterFee);
      if (result.counterBonus !== undefined) setProposedBonus(result.counterBonus);
      const updatedOffer: IncomingAIOffer = {
        ...offer,
        fee: result.counterFee || offer.fee,
        bonusFee: result.counterBonus || offer.bonusFee,
        aiPatience: result.newPatience,
        negotiationRounds: (offer.negotiationRounds || 0) + 1,
        dialogueHistory: updatedDialogue
      };
      const updatedOffers = state.incomingOffers?.map(o => o.id === offer.id ? updatedOffer : o);
      onUpdateState({ ...state, incomingOffers: updatedOffers });
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
          <button
            type="button"
            onClick={() => setShowSummaryModal(true)}
            className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors"
          >
            📋 移籍市場まとめ
          </button>
          <div className="bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-2xl text-right">
            <div className="text-[11px] text-slate-400">使用可能 移籍予算</div>
            <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
              €{((userClub?.transferBudget || 0) / 1000000).toFixed(1)}M
            </div>
          </div>
        </div>
      </div>

      {/* INCOMING AI OFFERS SECTION (Requirement 7) */}
      {state.incomingOffers && state.incomingOffers.filter(o => o.status === 'pending').length > 0 && (
        <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-3xl p-4 sm:p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-sm font-bold text-emerald-300">
                他クラブから届いている移籍オファー ({state.incomingOffers.filter(o => o.status === 'pending').length}件)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">受諾すると移籍金がクラブ資金へ即時反映されます</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {state.incomingOffers.filter(o => o.status === 'pending').map(offer => {
              const targetPlayer = state.players[offer.playerId];
              const buyer = state.clubs[offer.buyerClubId];
              if (!targetPlayer || !buyer) return null;

              const isLoan = offer.type !== 'permanent';
              return (
                <div key={offer.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-white">{targetPlayer.name} ({targetPlayer.position})</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono font-bold">
                        {offer.type === 'dev_loan' ? '育成レンタル' : isLoan ? 'レンタル' : '完全移籍'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300">
                      買い手: <strong className="text-emerald-400">{buyer.name}</strong>
                    </div>
                    <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
                      提示額: €{(offer.fee / 1000000).toFixed(1)}M {offer.buyOptionFee ? `(買取OP €${(offer.buyOptionFee / 1000000).toFixed(1)}M)` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleIncomingOfferAction(offer.id, 'accept')}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      受諾
                    </button>
                    <button
                      type="button"
                      onClick={() => startDirectNegotiation(offer)}
                      className="flex-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      直接交渉
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIncomingOfferAction(offer.id, 'reject')}
                      className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                    >
                      拒否
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DIRECT NEGOTIATION MODAL (Requirements 5, 6, 7 & 28) */}
      {directNegotiatingOfferId && (() => {
        const offer = state.incomingOffers?.find(o => o.id === directNegotiatingOfferId);
        if (!offer) return null;
        const targetPlayer = state.players[offer.playerId];
        const buyerClub = state.clubs[offer.buyerClubId];
        if (!targetPlayer || !buyerClub) return null;

        const isRejected = offer.status === 'rejected';

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold">
                      直接交渉ルーム
                    </span>
                    <span className="text-xs text-slate-400">
                      相手クラブ忍耐度: {'★'.repeat(offer.aiPatience ?? 3)}{'☆'.repeat(Math.max(0, 3 - (offer.aiPatience ?? 3)))}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {buyerClub.name} との移籍条件交渉
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDirectNegotiatingOfferId(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Player Profile Summary */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">対象選手</span>
                  <span className="text-sm font-bold text-white">{targetPlayer.name} ({targetPlayer.position}, {targetPlayer.age}歳)</span>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    能力値: <strong className="text-emerald-400">OVR {targetPlayer.ovr}</strong> · 市場価値: <strong className="text-white font-mono">€{(targetPlayer.marketValue / 1000000).toFixed(1)}M</strong>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">買い手クラブ予算</span>
                  <span className="text-sm font-mono font-bold text-blue-400">€{(buyerClub.transferBudget / 1000000).toFixed(1)}M</span>
                  <span className="text-[10px] text-slate-500 block">格: {buyerClub.tier}</span>
                </div>
              </div>

              {/* Dialogue History */}
              <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-slate-950/90 border border-slate-800/80 rounded-2xl text-xs">
                {(offer.dialogueHistory || []).map((diag, idx) => (
                  <div key={idx} className={`p-2.5 rounded-xl ${diag.speaker === 'user' ? 'bg-blue-950/40 text-blue-200 border border-blue-900/50 ml-6' : 'bg-slate-900 text-slate-200 border border-slate-800 mr-6'}`}>
                    <div className="font-semibold">{diag.message}</div>
                    {diag.termsSummary && (
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">{diag.termsSummary}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Negotiation Terms Input Form (if not rejected) */}
              {!isRejected ? (
                <div className="space-y-3.5 bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4">
                  {/* Fee proposal */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-300">① 基本移籍金（固定支払額）</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">€{(proposedFee / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[-5000000, -2000000, 2000000, 5000000, 10000000].map(delta => (
                        <button
                          key={delta}
                          type="button"
                          onClick={() => setProposedFee(prev => Math.max(1000000, prev + delta))}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                        >
                          {delta > 0 ? `+€${delta / 1000000}M` : `-€${Math.abs(delta) / 1000000}M`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bonus conditions */}
                  <div>
                    <span className="text-xs font-bold text-slate-300 block mb-1">② 成果インセンティブ・ボーナス</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                      {[
                        { label: 'ボーナスなし', fee: 0 },
                        { label: '欧州圏進出時 (+€3M)', fee: 3000000 },
                        { label: '公式戦20試合 (+€5M)', fee: 5000000 },
                        { label: 'リーグ優勝時 (+€8M)', fee: 8000000 }
                      ].map(b => (
                        <button
                          key={b.fee}
                          type="button"
                          onClick={() => setProposedBonus(b.fee)}
                          className={`p-2 rounded-xl border text-left transition-all ${
                            proposedBonus === b.fee
                              ? 'bg-blue-600/30 border-blue-500 text-white font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Installments & Clauses */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {/* Installments */}
                    <div>
                      <span className="text-slate-400 block mb-1">③ 支払分割</span>
                      <select
                        value={installments}
                        onChange={e => setInstallments(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                      >
                        <option value={1}>一括払い (即時受取)</option>
                        <option value={2}>2回分割払い (翌季受取)</option>
                        <option value={3}>3回分割払い</option>
                      </select>
                    </div>

                    {/* Sell on */}
                    <div>
                      <span className="text-slate-400 block mb-1">④ 次回売却時パーセンテージ</span>
                      <select
                        value={sellOnPercentage}
                        onChange={e => setSellOnPercentage(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                      >
                        <option value={0}>条項なし (0%)</option>
                        <option value={10}>売却益 10% 還元</option>
                        <option value={15}>売却益 15% 還元</option>
                        <option value={20}>売却益 20% 還元</option>
                      </select>
                    </div>

                    {/* Buyback */}
                    <div>
                      <span className="text-slate-400 block mb-1">⑤ 買戻し条項</span>
                      <select
                        value={buybackClause ? 'yes' : 'no'}
                        onChange={e => setBuybackClause(e.target.value === 'yes')}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                      >
                        <option value="no">付帯しない</option>
                        <option value="yes">2年以内 €{(targetPlayer.marketValue * 1.5 / 1000000).toFixed(1)}M 買戻し権</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-950/50 border border-red-800 rounded-2xl p-4 text-center text-red-300 text-xs">
                  <strong>交渉は決裂しました。</strong>
                  <p className="mt-1 text-slate-400">相手クラブは提示条件に反発し、オファーを取り下げました。</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                {!isRejected ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleIncomingOfferAction(offer.id, 'reject')}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      交渉打ち切り・拒否
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendCounterProposal(offer)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                      >
                        相手クラブへ再提案を送信
                      </button>

                      <button
                        type="button"
                        onClick={() => handleIncomingOfferAction(offer.id, 'accept')}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 cursor-pointer"
                      >
                        {negotiationAgreed ? '★ 合意内容で移籍成立！' : '提示条件で受諾'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full text-right">
                    <button
                      type="button"
                      onClick={() => setDirectNegotiatingOfferId(null)}
                      className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                    >
                      閉じる
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })()}

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

                  {getCooldownDays(p.id) > 0 ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 font-mono">
                        再交渉可能まであと {getCooldownDays(p.id)} 日
                      </span>
                      <button
                        type="button"
                        disabled
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-500 text-xs font-bold cursor-not-allowed opacity-60"
                      >
                        交渉凍結中 (10日ルール)
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startNegotiation(p)}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                    >
                      獲得交渉を開始
                    </button>
                  )}
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
                  {activeNegotiation.status === 'club_negotiating' ? 'STAGE 1: クラブ間移籍金・契約形態交渉' : activeNegotiation.status === 'player_negotiating' ? 'STAGE 2: 選手・代理人契約交渉' : 'TRANSFER NEGOTIATION'}
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

            {/* Current Transfer Budget Bar */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 mb-4 flex items-center justify-between text-xs">
              <span className="text-slate-400">貴クラブの利用可能 移籍予算:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                €{((userClub?.transferBudget || 0) / 1000000).toFixed(1)}M
              </span>
            </div>

            {/* Budget Error Banner */}
            {budgetError && (
              <div className="bg-red-950/40 border border-red-500/50 rounded-2xl p-3 mb-4 text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{budgetError}</span>
              </div>
            )}

            {/* STAGE 1: CLUB NEGOTIATION */}
            {activeNegotiation.status === 'club_negotiating' && (
              <div className="space-y-4">
                {/* Contract Type Selector (Requirement 4, 6, 7) */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-semibold block">移籍・レンタル契約形式</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => { setNegotiationType('permanent'); setBidFee(targetPlayerInNeg.marketValue); }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
                        negotiationType === 'permanent' ? 'bg-emerald-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      完全移籍
                    </button>
                    <button
                      type="button"
                      onClick={() => { setNegotiationType('loan'); setBidFee(Math.round(targetPlayerInNeg.marketValue * 0.12)); }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
                        negotiationType === 'loan' ? 'bg-emerald-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      期限付き移籍
                    </button>
                    <button
                      type="button"
                      onClick={() => { setNegotiationType('buy_option'); setBidFee(Math.round(targetPlayerInNeg.marketValue * 0.15)); }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
                        negotiationType === 'buy_option' ? 'bg-emerald-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      買取OP付き
                    </button>
                    <button
                      type="button"
                      disabled={targetPlayerInNeg.age > 22}
                      onClick={() => { setNegotiationType('dev_loan'); setBidFee(Math.round(targetPlayerInNeg.marketValue * 0.08)); }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
                        negotiationType === 'dev_loan' 
                          ? 'bg-emerald-500 text-slate-950 shadow' 
                          : targetPlayerInNeg.age > 22 
                          ? 'bg-slate-900/40 text-slate-600 border border-slate-800 cursor-not-allowed'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      育成型レンタル
                    </button>
                  </div>
                </div>

                {negotiationType === 'buy_option' && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <label className="text-xs text-slate-300 block">付帯 買取オプション設定額 (€)</label>
                    <input
                      type="number"
                      step={1000000}
                      value={buyOptionFee}
                      onChange={e => setBuyOptionFee(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-white"
                    />
                  </div>
                )}

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 max-h-48 overflow-y-auto space-y-2.5">
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
                    disabled={bidFee > (userClub?.transferBudget || 0)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                      bidFee > (userClub?.transferBudget || 0)
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 cursor-pointer'
                    }`}
                  >
                    {bidFee > (userClub?.transferBudget || 0) ? '移籍予算不足' : `€${(bidFee / 1000000).toFixed(1)}M の正式オファーを提示`}
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
                    disabled={wageOffer > ((userClub?.wageBudget || 0) - (userClub?.currentWageSpend || 0))}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                      wageOffer > ((userClub?.wageBudget || 0) - (userClub?.currentWageSpend || 0))
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 cursor-pointer'
                    }`}
                  >
                    {wageOffer > ((userClub?.wageBudget || 0) - (userClub?.currentWageSpend || 0)) ? '給与予算超過' : '個人合意の提示・契約書送付'}
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
                  提示条件が相手側の許容水準を満たさず、交渉は打ち切られました。
                  10日間ルールにより、この選手・クラブとの再交渉は10日間凍結されます。
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

      {/* TRANSFER DEADLINE SUMMARY MODAL (Requirement 29) */}
      {(showSummaryModal || state.showDeadlineSummary) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md">
          <div className="flex min-h-full items-start justify-center p-3 sm:p-6">
            <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl my-4 sm:my-8 text-left pb-10">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div>
                  <span className="text-xs text-emerald-400 uppercase tracking-wider font-semibold font-mono">
                    OFFICIAL TRANSFER RECAP
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                    移籍市場まとめ (全クラブ移籍・レンタル一覧)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    自クラブおよび世界AIクラブ間で成立した全公式移籍ディールの一覧です。
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowSummaryModal(false);
                    if (state.showDeadlineSummary) {
                      onUpdateState({ ...state, showDeadlineSummary: false });
                    }
                  }}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {(!state.transferHistory || state.transferHistory.length === 0) ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  成立した移籍・レンタル取引はまだありません。
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[60vh]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-mono sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">選手</th>
                        <th className="py-2.5 px-3">移籍元</th>
                        <th className="py-2.5 px-3">移籍先</th>
                        <th className="py-2.5 px-3 text-right">移籍金</th>
                        <th className="py-2.5 px-3 text-center">形式</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {state.transferHistory.map(tr => {
                        const seller = state.clubs[tr.sellerClubId];
                        const buyer = state.clubs[tr.buyerClubId];
                        return (
                          <tr key={tr.id} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-bold text-white">{tr.playerName}</td>
                            <td className="py-2.5 px-3 text-slate-300">{seller?.shortName || tr.sellerClubId}</td>
                            <td className="py-2.5 px-3 text-emerald-400 font-semibold">{buyer?.shortName || tr.buyerClubId}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                              {tr.fee > 0 ? `€${(tr.fee / 1000000).toFixed(1)}M` : '€0 (復帰/フリー)'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                tr.type === 'dev_loan'
                                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                  : tr.type === 'loan'
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}>
                                {tr.type === 'dev_loan' ? '育成レンタル' : tr.type === 'loan' ? 'レンタル' : '完全移籍'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="text-right pt-4 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSummaryModal(false);
                    if (state.showDeadlineSummary) {
                      onUpdateState({ ...state, showDeadlineSummary: false });
                    }
                  }}
                  className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                >
                  閉じる
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
