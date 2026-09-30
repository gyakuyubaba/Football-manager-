import { Player, Club, TransferNegotiation, NewsItem, GameWorldState, IncomingAIOffer } from '../types/game';
import { addDays } from './dateEngine';

// Realistic Derby & Direct Rivalry Mapping across all 6 leagues
export const CLUB_RIVALRIES: Record<string, string[]> = {
  // Premier League
  arsenal: ['tottenham', 'chelsea', 'man_united'],
  tottenham: ['arsenal', 'chelsea', 'west_ham'],
  chelsea: ['arsenal', 'tottenham', 'fulham'],
  liverpool: ['man_united', 'everton', 'man_city'],
  man_united: ['liverpool', 'man_city', 'arsenal'],
  man_city: ['man_united', 'liverpool'],
  aston_villa: ['wolves', 'birmingham'],
  wolves: ['aston_villa'],
  crystal_palace: ['brighton'],
  brighton: ['crystal_palace'],
  newcastle: ['sunderland'],
  southampton: ['portsmouth', 'bournemouth'],
  bournemouth: ['southampton'],
  everton: ['liverpool'],
  fulham: ['chelsea', 'brentford'],
  brentford: ['fulham'],
  nottingham_forest: ['leicester', 'derby'],
  leicester: ['nottingham_forest'],
  ipswich: ['norwich'],

  // LaLiga
  real_madrid: ['barcelona', 'atletico_madrid'],
  barcelona: ['real_madrid', 'espanyol', 'atletico_madrid'],
  atletico_madrid: ['real_madrid', 'barcelona'],
  athletic_club: ['real_sociedad'],
  real_sociedad: ['athletic_club'],
  real_betis: ['sevilla'],
  sevilla: ['real_betis'],
  valencia: ['villarreal', 'levante'],
  villarreal: ['valencia'],
  celta_vigo: ['deportivo'],
  girona: ['espanyol', 'barcelona'],
  espanyol: ['barcelona', 'girona'],
  rayo_vallecano: ['getafe', 'leganes', 'real_madrid'],
  getafe: ['leganes', 'rayo_vallecano'],
  leganes: ['getafe', 'rayo_vallecano'],

  // Bundesliga
  bayern: ['dortmund', 'mgladbach', 'leverkusen'],
  dortmund: ['schalke', 'bayern', 'bochum'],
  leverkusen: ['koln', 'mgladbach', 'bayern'],
  stuttgart: ['karlsruhe', 'freiburg'],
  freiburg: ['stuttgart'],
  frankfurt: ['mainz', 'darmstadt'],
  mainz: ['frankfurt'],
  werder_bremen: ['wolfsburg', 'hsv'],
  wolfsburg: ['werder_bremen'],
  st_pauli: ['hsv', 'holstein_kiel'],
  holstein_kiel: ['st_pauli'],
  bochum: ['dortmund'],
  union_berlin: ['hertha'],

  // Serie A
  inter: ['milan', 'juventus', 'roma'],
  milan: ['inter', 'juventus'],
  juventus: ['inter', 'milan', 'torino', 'fiorentina', 'napoli'],
  torino: ['juventus'],
  roma: ['lazio', 'napoli', 'juventus'],
  lazio: ['roma', 'napoli'],
  napoli: ['juventus', 'roma', 'lazio'],
  fiorentina: ['juventus'],
  genoa: ['sampdoria'],
  verona: ['venezia', 'vicenza'],
  venezia: ['verona'],
  parma: ['reggiana', 'bologna'],
  bologna: ['parma', 'fiorentina'],

  // Ligue 1
  psg: ['marseille', 'lyon'],
  marseille: ['psg', 'lyon', 'nice'],
  lyon: ['saint_etienne', 'marseille', 'psg'],
  saint_etienne: ['lyon'],
  nice: ['monaco', 'marseille'],
  monaco: ['nice'],
  lens: ['lille'],
  lille: ['lens'],
  rennes: ['nantes'],
  nantes: ['rennes']
};

export function isRivalClub(clubAId: string, clubBId: string): boolean {
  if (clubAId === clubBId) return false;
  const rivalsA = CLUB_RIVALRIES[clubAId] || [];
  const rivalsB = CLUB_RIVALRIES[clubBId] || [];
  return rivalsA.includes(clubBId) || rivalsB.includes(clubAId);
}

// Realistic transfer valuation calculation
export function calculatePlayerValuation(player: Player, club: Club, buyerClubId?: string): number {
  const baseValue = player.marketValue;
  let multiplier = 1.0;
  
  // Contract remaining multiplier
  if (player.contractYears <= 1) {
    multiplier *= 0.75; // Bargain territory
  } else if (player.contractYears >= 4) {
    multiplier *= 1.25; // Long term security premium
  }

  // Potential and age
  if (player.age <= 21 && player.potential >= 85) {
    multiplier *= 1.35; // Wonderkid tax
  } else if (player.age >= 33) {
    multiplier *= 0.65; // Veteran discount
  }

  // Club reputation & financial status
  if (club.tier === 'Elite') {
    multiplier *= 1.15; // Elite club surcharge
  }

  // RIVALRY PENALTY: Asking price is +45% higher if negotiating with a rival!
  if (buyerClubId && isRivalClub(club.id, buyerClubId)) {
    multiplier *= 1.45;
  }

  return Math.round(baseValue * multiplier);
}

export function handleClubNegotiationStep(
  negotiation: TransferNegotiation,
  userOfferedFee: number,
  sellerClub: Club,
  player: Player,
  currentDate?: string
): {
  updatedNegotiation: TransferNegotiation;
  responseMessage: string;
  isAgreed: boolean;
  isCollapsed: boolean;
} {
  const isRival = isRivalClub(sellerClub.id, negotiation.buyerClubId);
  const valuation = calculatePlayerValuation(player, sellerClub, negotiation.buyerClubId);
  
  // Acceptable fee threshold
  const minAcceptableFee = Math.round(valuation * (isRival ? 0.98 : 0.92));
  const askingPrice = Math.round(valuation * (isRival ? 1.20 : 1.12));

  const updated = { ...negotiation, currentBidFee: userOfferedFee };

  // Check if offer is high enough
  if (userOfferedFee >= minAcceptableFee) {
    updated.status = 'club_agreed';
    const msg = isRival 
      ? `【ライバル間合意！】${sellerClub.name}は猛反発を覚悟の上で、提示された巨額の移籍金 €${(userOfferedFee / 1000000).toFixed(1)}M を受け入れました。選手本人との個人条件交渉に進んでください。`
      : `【合意】${sellerClub.name}の提示条件を満たしました。移籍金 €${(userOfferedFee / 1000000).toFixed(1)}M でクラブ間合意に達しました。選手本人・代理人との契約交渉に進んでください。`;
    
    updated.clubMessages.push({ sender: 'ai', text: msg, date: '今日' });
    return {
      updatedNegotiation: updated,
      responseMessage: msg,
      isAgreed: true,
      isCollapsed: false
    };
  }

  // If offer is insulting (< 65% of valuation, or < 75% for rivals)
  const insultThreshold = isRival ? valuation * 0.75 : valuation * 0.65;
  const isInsulting = userOfferedFee < insultThreshold;

  if (isInsulting) {
    // Rivals lose patience faster!
    updated.clubPatience -= isRival ? 2 : 1;
    if (updated.clubPatience <= 0) {
      updated.status = 'collapsed';
      // 10-day renegotiation ban (Requirement 4)
      updated.cooldownUntil = addDays(currentDate || '2026-07-01', 10);
      const msg = isRival
        ? `「宿敵クラブからのこのような不敬な低額オファーは断じて受け入れられない。交渉を即時打ち切る！」(${sellerClub.name}との交渉は10日間凍結されます)`
        : `「これ以上、非現実的なオファーが続く場合、交渉を打ち切りますとお伝えしました。今回の交渉は完全に終了します。」(${sellerClub.name}との交渉は10日間凍結されます)`;
      
      updated.clubMessages.push({ sender: 'ai', text: msg, date: '今日' });
      return { updatedNegotiation: updated, responseMessage: msg, isAgreed: false, isCollapsed: true };
    } else {
      const msg = isRival
        ? `「我々はライバル関係にあるクラブです。サポーターの反発を押し切って売却するには、通常を遥かに上回る提示が必要です。(残忍耐度: ${updated.clubPatience})」`
        : `「このオファーでは交渉を進めることはできません。依然として評価額を大きく下回っています。これ以上、敬意を欠く低額オファーが続く場合、交渉を打ち切ります。(残忍耐度: ${updated.clubPatience})」`;
      
      updated.clubMessages.push({ sender: 'ai', text: msg, date: '今日' });
      return { updatedNegotiation: updated, responseMessage: msg, isAgreed: false, isCollapsed: false };
    }
  }

  // Counter offer scenario
  const counterFee = Math.round(askingPrice - (userOfferedFee * 0.15));
  const msg = isRival
    ? `「宿敵への移籍にはサポーターへの説明責任が生じる。妥協はできない。€${(counterFee / 1000000).toFixed(1)}M であれば売却を正式承認する。」`
    : `「提示額は考慮に値しますが、${player.name}のクラブにおける価値を考慮すると不十分です。€${(counterFee / 1000000).toFixed(1)}M であれば即座に合意します。」`;
  
  updated.clubMessages.push({ sender: 'ai', text: msg, date: '今日' });
  return { updatedNegotiation: updated, responseMessage: msg, isAgreed: false, isCollapsed: false };
}

export function handlePlayerNegotiationStep(
  negotiation: TransferNegotiation,
  wageOffered: number,
  contractYears: number,
  role: Player['squadRole'],
  bonus: number,
  player: Player,
  buyerClub: Club,
  currentDate?: string
): {
  updatedNegotiation: TransferNegotiation;
  responseMessage: string;
  isCompleted: boolean;
  isCollapsed: boolean;
} {
  const isRival = isRivalClub(player.clubId, buyerClub.id);
  const updated = {
    ...negotiation,
    wageOffered,
    contractYearsOffered: contractYears,
    squadRoleOffered: role,
    signingBonusOffered: bonus
  };

  // Base wage demand
  let wageDemand = Math.round(player.wage * 1.15);
  if (role === '絶対的主力') wageDemand = Math.round(wageDemand * 1.1);

  // Rival club hesitation: Player demands 25% higher wage unless expiring contract or ambitious
  if (isRival) {
    if (player.contractYears > 1 && player.personality !== '野心的') {
      wageDemand = Math.round(wageDemand * 1.25);
    }
  }

  // Check acceptance
  const isWageOk = wageOffered >= wageDemand * 0.95;
  const isRoleOk = role === '絶対的主力' || role === '重要選手' || (player.age >= 33 && role === 'ローテーション');
  const isBonusOk = isRival ? bonus >= player.marketValue * 0.05 : bonus >= 0;

  if (isWageOk && isRoleOk && isBonusOk) {
    updated.status = 'completed';
    const msg = isRival
      ? `【ライバル移籍成立！】「ライバルクラブへの移籍には大きな覚悟が必要でしたが、監督の熱烈な信頼と素晴らしい提示条件に心を打たれました。新天地で全力を尽くします！」`
      : `【合意・契約締結】「条件に満足しています。この偉大なクラブの一員になれることを光栄に思います。早くピッチでファンに勝利を届けたいです！」`;

    updated.playerMessages.push({ sender: 'agent', text: msg, date: '今日' });
    return {
      updatedNegotiation: updated,
      responseMessage: msg,
      isCompleted: true,
      isCollapsed: false
    };
  }

  // Not satisfied
  updated.playerPatience -= isRival ? 2 : 1;
  if (updated.playerPatience <= 0) {
    updated.status = 'collapsed';
    // 10-day renegotiation ban (Requirement 4)
    updated.cooldownUntil = addDays(currentDate || '2026-07-01', 10);
    const msg = isRival
      ? `「宿敵クラブへの移籍というリスクを冒すには、提示された条件はあまりにも不十分です。この話は白紙に戻させていただきます。」(選手代理人が交渉を打ち切りました。10日間再交渉不可)`
      : `「提示された年俸および待遇は、当選手の市場価値と自負を満たしていません。交渉を終了させていただきます。」(選手代理人が交渉を打ち切りました。10日間再交渉不可)`;

    updated.playerMessages.push({ sender: 'agent', text: msg, date: '今日' });
    return { updatedNegotiation: updated, responseMessage: msg, isCompleted: false, isCollapsed: true };
  }

  const counterWage = Math.round(wageDemand * 1.05);
  const msg = isRival
    ? `「ライバルクラブへの移籍には相当な覚悟が要ります。週給 €${(counterWage / 1000).toFixed(0)}k および十分な契約金を用意していただけない限り、首を縦に振ることはできません。(残忍耐度: ${updated.playerPatience})」`
    : `「提示額はまだ希望に届いていません。週給 €${(counterWage / 1000).toFixed(0)}k 程度を想定しています。再考をお願いします。(残忍耐度: ${updated.playerPatience})」`;

  updated.playerMessages.push({ sender: 'agent', text: msg, date: '今日' });
  return { updatedNegotiation: updated, responseMessage: msg, isCompleted: false, isCollapsed: false };
}

// Complete transfer execution (Requirement 2 & 4: Atomic Squad and Transaction Updates)
export function executeTransferCompletion(
  state: GameWorldState,
  negotiation: TransferNegotiation
): GameWorldState {
  const player = state.players[negotiation.playerId];
  const buyerClub = state.clubs[negotiation.buyerClubId];
  const sellerClub = state.clubs[negotiation.sellerClubId];
  if (!player || !buyerClub || !sellerClub) return state;

  const isRival = isRivalClub(sellerClub.id, buyerClub.id);
  const transferFee = negotiation.currentBidFee;
  const weeklyWage = negotiation.wageOffered;
  const isLoan = !!negotiation.isLoan;

  // 1. Financial Movement
  buyerClub.transferBudget -= transferFee;
  sellerClub.transferBudget += Math.round(transferFee * 0.95);
  buyerClub.currentWageSpend += weeklyWage;
  sellerClub.currentWageSpend = Math.max(0, sellerClub.currentWageSpend - player.wage);

  // 2. Transfer Squad registration atomically
  const oldClubPlayerIds = sellerClub.playerIds.filter(id => id !== player.id);
  const newClubPlayerIds = buyerClub.playerIds.includes(player.id) ? buyerClub.playerIds : [...buyerClub.playerIds, player.id];
  sellerClub.playerIds = oldClubPlayerIds;
  buyerClub.playerIds = newClubPlayerIds;

  // 3. Update player data
  const updatedPlayer: Player = {
    ...player,
    clubId: buyerClub.id,
    wage: weeklyWage,
    contractYears: negotiation.contractYearsOffered,
    squadRole: negotiation.squadRoleOffered,
    managerTrust: 90,
    squadStatus: 'OUT_OF_SQUAD',
    isLoaned: isLoan,
    loanFromClubId: isLoan ? sellerClub.id : undefined,
    parentClubId: isLoan ? sellerClub.id : undefined,
    loanClubId: isLoan ? buyerClub.id : undefined,
    loanStartDate: isLoan ? state.currentDate : undefined,
    loanEndDate: isLoan ? addDays(state.currentDate, 365) : undefined,
    loanType: negotiation.negotiationType,
    buyOptionFee: negotiation.buyOptionFee,
    loanOptionBuyFee: negotiation.buyOptionFee,
    developmentLoan: negotiation.negotiationType === 'dev_loan'
  };

  // 4. Update user tactics lineup if user's club is involved
  let updatedTactics = { ...state.tactics };
  if (state.userClubId === buyerClub.id) {
    if (!updatedTactics.lineup.reserves.includes(player.id)) {
      updatedTactics.lineup.reserves.push(player.id);
    }
  }
  if (state.userClubId === sellerClub.id) {
    updatedTactics.lineup.starters = updatedTactics.lineup.starters.filter(s => s.playerId !== player.id);
    updatedTactics.lineup.bench = updatedTactics.lineup.bench.filter(id => id !== player.id);
    updatedTactics.lineup.reserves = updatedTactics.lineup.reserves.filter(id => id !== player.id);
  }

  // 5. Add to transfer history
  const transferType = negotiation.negotiationType || (isLoan ? 'loan' : 'permanent');
  const historyList = [...(state.transferHistory || [])];
  historyList.unshift({
    id: `tr_${Date.now()}_${player.id}`,
    date: state.currentDate,
    playerId: player.id,
    playerName: player.name,
    sellerClubId: sellerClub.id,
    buyerClubId: buyerClub.id,
    fee: transferFee,
    type: transferType
  });

  // 6. Generate breaking news
  let newsTitle = '';
  let newsBody = '';

  if (negotiation.negotiationType === 'dev_loan') {
    newsTitle = `【育成型レンタル】若手有望株${player.name}が${buyerClub.name}へ期限付き移籍加入！`;
    newsBody = `出場機会の確保と急成長を目指し、${sellerClub.name}所属の${player.name}が${buyerClub.name}への育成型期限付き移籍で合意しました。`;
  } else if (isLoan) {
    newsTitle = negotiation.buyOptionFee 
      ? `【買取OP付きレンタル】${player.name}が${buyerClub.name}へ加入！買取OP €${(negotiation.buyOptionFee / 1000000).toFixed(1)}M`
      : `【期限付き移籍】${player.name}が${buyerClub.name}へ1年間のレンタル移籍で合意`;
    newsBody = `${sellerClub.name}から${buyerClub.name}へ、${player.name}の期限付き移籍が正式成立。即戦力としての活躍が期待されます。`;
  } else if (isRival) {
    newsTitle = `【禁断のライバル移籍】${player.name}が宿敵${buyerClub.name}へ電撃加入！移籍金€${(transferFee / 1000000).toFixed(1)}Mの衝撃`;
    newsBody = `サッカー界に激震。${sellerClub.name}の主力である${player.name}が長年の宿敵${buyerClub.name}への完全移籍を正式発表しました。`;
  } else {
    newsTitle = `【大型移籍決定】${player.name}が${buyerClub.name}へ完全移籍！移籍金€${(transferFee / 1000000).toFixed(1)}Mでサイン`;
    newsBody = `移籍市場にビッグニュース。${player.name}が${sellerClub.name}から${buyerClub.name}への移籍を完了しました。新天地での背番号やデビュー戦に早くも大きな注目が集まっています。`;
  }

  const transferNews: NewsItem = {
    id: `news_tr_${Date.now()}`,
    date: state.currentDate,
    headline: newsTitle,
    body: newsBody,
    category: 'transfer',
    relatedClubId: buyerClub.id,
    relatedPlayerId: player.id,
    importance: 'high'
  };

  return {
    ...state,
    tactics: updatedTactics,
    clubs: {
      ...state.clubs,
      [buyerClub.id]: buyerClub,
      [sellerClub.id]: sellerClub
    },
    players: {
      ...state.players,
      [player.id]: updatedPlayer
    },
    news: [transferNews, ...state.news],
    transferHistory: historyList
  };
}

// Exercise Loan Buy Option (Requirement 6)
export function exerciseLoanBuyOption(
  state: GameWorldState,
  playerId: string
): { success: boolean; message: string; updatedState: GameWorldState } {
  const player = state.players[playerId];
  if (!player || !player.isLoaned || !player.loanOptionBuyFee || !player.loanFromClubId) {
    return { success: false, message: 'この選手には買取オプションが設定されていません。', updatedState: state };
  }

  const buyerClub = state.clubs[player.clubId];
  const sellerClub = state.clubs[player.loanFromClubId];
  if (!buyerClub || !sellerClub) {
    return { success: false, message: 'クラブ情報が見つかりません。', updatedState: state };
  }

  const buyFee = player.loanOptionBuyFee;
  if (buyerClub.transferBudget < buyFee) {
    return { 
      success: false, 
      message: `移籍予算が不足しています (必要額: €${(buyFee / 1000000).toFixed(1)}M / 現在予算: €${(buyerClub.transferBudget / 1000000).toFixed(1)}M)`, 
      updatedState: state 
    };
  }

  // Execute buy option
  buyerClub.transferBudget -= buyFee;
  sellerClub.transferBudget += Math.round(buyFee * 0.95);

  const updatedPlayer: Player = {
    ...player,
    isLoaned: false,
    loanFromClubId: undefined,
    parentClubId: undefined,
    loanOptionBuyFee: undefined,
    buyOptionFee: undefined,
    loanStartDate: undefined,
    loanEndDate: undefined,
    contractYears: 3,
    managerTrust: 95
  };

  const buyNews: NewsItem = {
    id: `news_buy_op_${Date.now()}`,
    date: state.currentDate,
    headline: `【買取OP行使】${buyerClub.name}、${player.name}の保有権を完全獲得！(移籍金€${(buyFee / 1000000).toFixed(1)}M)`,
    body: `期限付き移籍中だった${player.name}について、${buyerClub.name}が契約条項の買取オプションを正式行使。保有元${sellerClub.name}から完全移籍で獲得しました。`,
    category: 'transfer',
    relatedClubId: buyerClub.id,
    relatedPlayerId: player.id,
    importance: 'high'
  };

  const historyList = [...(state.transferHistory || [])];
  historyList.unshift({
    id: `tr_buy_op_${Date.now()}_${player.id}`,
    date: state.currentDate,
    playerId: player.id,
    playerName: player.name,
    sellerClubId: sellerClub.id,
    buyerClubId: buyerClub.id,
    fee: buyFee,
    type: 'permanent'
  });

  return {
    success: true,
    message: `${player.name}の買取オプションを行使し、完全移籍が完了しました！`,
    updatedState: {
      ...state,
      clubs: {
        ...state.clubs,
        [buyerClub.id]: buyerClub,
        [sellerClub.id]: sellerClub
      },
      players: {
        ...state.players,
        [player.id]: updatedPlayer
      },
      news: [buyNews, ...state.news],
      transferHistory: historyList
    }
  };
}

// Direct Negotiation Evaluation Engine (Requirements 5, 6, 7 & 28)
export function evaluateAICounterProposal(
  offer: IncomingAIOffer,
  targetPlayer: Player,
  buyerClub: Club,
  proposedFee: number,
  proposedBonus: number,
  installments: number,
  sellOnPercentage: number,
  buybackClause: boolean
): {
  decision: 'accept' | 'counter' | 'reject';
  aiMessage: string;
  counterFee?: number;
  counterBonus?: number;
  newPatience: number;
} {
  const currentPatience = offer.aiPatience ?? 3;
  const maxAffordable = buyerClub.transferBudget * 0.95;
  const fairMarketValue = targetPlayer.marketValue;
  const isRival = isRivalClub(buyerClub.id, targetPlayer.clubId);

  // Installment & clause penalties / incentives
  let effectiveProposed = proposedFee + proposedBonus * 0.5;
  if (installments > 1) effectiveProposed *= (1 - (installments - 1) * 0.03); // installments are slightly cheaper present value for buyer
  if (sellOnPercentage > 0) effectiveProposed += (fairMarketValue * (sellOnPercentage / 100) * 0.3);
  if (buybackClause) effectiveProposed += fairMarketValue * 0.15; // buyer dislikes buyback clauses

  const upperLimit = Math.min(maxAffordable, Math.round(fairMarketValue * (isRival ? 1.4 : 1.25)));

  // If proposed exceeds affordable budget or greed threshold (>135% of upper limit)
  if (effectiveProposed > upperLimit * 1.35 || proposedFee > maxAffordable || currentPatience <= 1) {
    return {
      decision: 'reject',
      aiMessage: `「当クラブの予算と選手査定から著しく乖離しており、これ以上交渉を続ける価値がないと判断いたしました。オファーを正式に取り下げます。」`,
      newPatience: 0
    };
  }

  // If proposed is reasonable (within upper limit)
  if (effectiveProposed <= upperLimit * 1.05) {
    return {
      decision: 'accept',
      aiMessage: `「提示いただいた条件（移籍金 €${(proposedFee / 1000000).toFixed(1)}M${proposedBonus > 0 ? ` ＋ ボーナス €${(proposedBonus / 1000000).toFixed(1)}M` : ''}${installments > 1 ? ` / ${installments}回分割` : ''}）に合意いたします。移籍手続きを完了させましょう。」`,
      counterFee: proposedFee,
      counterBonus: proposedBonus,
      newPatience: currentPatience
    };
  }

  // Counter proposal from AI
  const compromiseFee = Math.round((offer.fee + proposedFee) / 2 / 500000) * 500000;
  const compromiseBonus = proposedBonus > 0 ? Math.round(proposedBonus * 0.8 / 500000) * 500000 : Math.round(fairMarketValue * 0.08 / 500000) * 500000;

  return {
    decision: 'counter',
    aiMessage: `「€${(proposedFee / 1000000).toFixed(1)}Mは要求が高すぎます。移籍金 €${(compromiseFee / 1000000).toFixed(1)}M ＋ 活躍ボーナス €${(compromiseBonus / 1000000).toFixed(1)}M なら合意可能です。これが当クラブからの再提案です。」`,
    counterFee: compromiseFee,
    counterBonus: compromiseBonus,
    newPatience: currentPatience - 1
  };
}

// AI clubs autonomous transfer simulation during window
export function simulateAITransfers(state: GameWorldState): GameWorldState {
  if (!state.isTransferWindowOpen) return state;

  let updatedState = { ...state };

  // 1. Generate incoming AI offers to User's club (Requirements 16 & 17)
  if (updatedState.userClubId && Math.random() < 0.35) {
    const userClub = updatedState.clubs[updatedState.userClubId];
    if (userClub && userClub.playerIds.length > 15) {
      const userPlayers = userClub.playerIds.map(id => updatedState.players[id]).filter(Boolean);
      // Prioritize listed players, but unlisted players also get realistic offers!
      const listed = userPlayers.filter(p => p.isTransferListed || p.isLoanListed);
      let targetPlayer: Player | null = null;
      if (listed.length > 0 && Math.random() < 0.60) {
        targetPlayer = listed[Math.floor(Math.random() * listed.length)];
      } else {
        const attractiveUnlisted = userPlayers.filter(p => p.ovr >= 74 || p.potential >= 82);
        if (attractiveUnlisted.length > 0 && Math.random() < 0.45) {
          targetPlayer = attractiveUnlisted[Math.floor(Math.random() * attractiveUnlisted.length)];
        }
      }

      if (targetPlayer) {
        const aiBuyers = Object.values(updatedState.clubs).filter(c => c.id !== userClub.id && c.transferBudget > targetPlayer.marketValue * 0.85);
        if (aiBuyers.length > 0) {
          const buyer = aiBuyers[Math.floor(Math.random() * aiBuyers.length)];
          const isLoanOffer = targetPlayer.isLoanListed || (!targetPlayer.isTransferListed && targetPlayer.age <= 22 && Math.random() < 0.40);
          
          // Realistic valuation check (Requirement 17)
          const contractFactor = targetPlayer.contractYears <= 1 ? 0.85 : 1.10;
          const feeMultiplier = (0.95 + Math.random() * 0.25) * contractFactor;
          const fee = isLoanOffer ? Math.round(targetPlayer.marketValue * 0.12) : Math.round(targetPlayer.marketValue * feeMultiplier);
          const bonusFee = isLoanOffer ? 0 : Math.round(targetPlayer.marketValue * 0.10);
          
          const newOffer: IncomingAIOffer = {
            id: `in_offer_${Date.now()}_${targetPlayer.id}`,
            date: updatedState.currentDate,
            buyerClubId: buyer.id,
            playerId: targetPlayer.id,
            type: isLoanOffer ? (targetPlayer.age <= 21 ? 'dev_loan' : 'loan') : 'permanent',
            fee,
            bonusFee,
            bonusCondition: isLoanOffer ? undefined : '公式戦20試合出場時',
            installments: 1,
            sellOnPercentage: 0,
            buybackClause: false,
            wageContribution: Math.round(targetPlayer.wage * 0.9),
            buyOptionFee: isLoanOffer ? Math.round(targetPlayer.marketValue * 1.3) : undefined,
            status: 'pending',
            negotiationRounds: 0,
            aiPatience: 3,
            dialogueHistory: [
              {
                speaker: 'ai',
                message: `${buyer.name}: 「${targetPlayer.name}の獲得に向けて、基本移籍金 €${(fee / 1000000).toFixed(1)}M${bonusFee > 0 ? ` ＋ 活躍ボーナス €${(bonusFee / 1000000).toFixed(1)}M` : ''} を提示いたします。」`,
                termsSummary: `移籍金: €${(fee / 1000000).toFixed(1)}M${bonusFee > 0 ? ` + ボーナス€${(bonusFee / 1000000).toFixed(1)}M` : ''}`
              }
            ]
          };

          const offerNews: NewsItem = {
            id: `news_in_offer_${Date.now()}`,
            date: updatedState.currentDate,
            headline: `【移籍オファー着信】${buyer.name}から${targetPlayer.name}への獲得打診が到着！`,
            body: `${buyer.name}が当クラブ所属の${targetPlayer.name}に対し、${isLoanOffer ? '期限付き移籍（レンタル料€' + (fee/1000).toLocaleString() + 'k）' : '完全移籍（基本額€' + (fee/1000000).toFixed(1) + 'M＋ボーナス）'}オファーを正式提示しました。「移籍市場」タブで受諾・拒否・直接交渉が可能です。`,
            category: 'transfer',
            relatedClubId: userClub.id,
            relatedPlayerId: targetPlayer.id,
            importance: 'high'
          };

          updatedState = {
            ...updatedState,
            incomingOffers: [...(updatedState.incomingOffers || []), newOffer],
            news: [offerNews, ...updatedState.news]
          };
        }
      }
    }
  }

  // 2. AI to AI clubs autonomous transfer market (Requirements 8 & 27: 25% chance per day during transfer window)
  if (Math.random() < 0.25) {
    const allClubs = Object.values(updatedState.clubs).filter(c => c.id !== updatedState.userClubId && c.transferBudget > 15000000);
    if (allClubs.length >= 2) {
      const buyerClub = allClubs[Math.floor(Math.random() * allClubs.length)];
      const sellerClubCandidates = allClubs.filter(c => c.id !== buyerClub.id && !isRivalClub(buyerClub.id, c.id));
      if (sellerClubCandidates.length > 0) {
        const sellerClub = sellerClubCandidates[Math.floor(Math.random() * sellerClubCandidates.length)];

        // AI identifies position need & target
        const candidatePlayers = sellerClub.playerIds
          .map(id => updatedState.players[id])
          .filter(p => p && p.squadRole !== '絶対的主力' && p.marketValue < buyerClub.transferBudget * 0.65 && p.ovr >= 75);

        if (candidatePlayers.length > 0) {
          const targetPlayer = candidatePlayers[Math.floor(Math.random() * candidatePlayers.length)];
          const agreedFee = Math.round(targetPlayer.marketValue * (1.05 + Math.random() * 0.20));

          const mockNegotiation: TransferNegotiation = {
            id: `ai_neg_${Date.now()}`,
            playerId: targetPlayer.id,
            sellerClubId: sellerClub.id,
            buyerClubId: buyerClub.id,
            status: 'completed',
            isLoan: false,
            initialAskingPrice: targetPlayer.marketValue,
            currentBidFee: agreedFee,
            clubPatience: 3,
            clubMessages: [],
            wageOffered: Math.round(targetPlayer.wage * 1.15),
            wageDemanded: Math.round(targetPlayer.wage * 1.15),
            contractYearsOffered: 4,
            squadRoleOffered: '重要選手',
            signingBonusOffered: 1000000,
            playerPatience: 3,
            playerMessages: []
          };

          updatedState = executeTransferCompletion(updatedState, mockNegotiation);
        }
      }
    }
  }

  return updatedState;
}
