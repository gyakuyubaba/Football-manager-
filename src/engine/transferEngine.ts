import { Player, Club, TransferNegotiation, NewsItem, GameWorldState } from '../types/game';

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
  nantes: ['rennes'],

  // J1 League
  vissel_kobe: ['gamba_osaka', 'cerezo_osaka'],
  gamba_osaka: ['cerezo_osaka', 'vissel_kobe'],
  cerezo_osaka: ['gamba_osaka', 'vissel_kobe'],
  urawa_reds: ['kashima', 'fc_tokyo', 'gamba_osaka', 'kawasaki_f'],
  kashima: ['urawa_reds', 'kashiwa_reysol', 'jubilo_iwata'],
  fc_tokyo: ['tokyo_verdy', 'kawasaki_f', 'urawa_reds'],
  tokyo_verdy: ['fc_tokyo', 'machida'],
  machida: ['tokyo_verdy', 'fc_tokyo'],
  kawasaki_f: ['yokohama_fm', 'fc_tokyo', 'urawa_reds'],
  yokohama_fm: ['kawasaki_f'],
  sanfrecce: ['vissel_kobe', 'avispa_fukuoka'],
  nagoya: ['gamba_osaka'],
  shonan_bellmare: ['yokohama_fm', 'kawasaki_f'],
  kyoto_sanga: ['gamba_osaka', 'cerezo_osaka'],
  kashiwa_reysol: ['urawa_reds'],
  jubilo_iwata: ['kashima'],
  sapporo: ['urawa_reds'],
  avispa_fukuoka: ['sagan_tosu'],
  sagan_tosu: ['avispa_fukuoka']
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
  player: Player
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
      const msg = isRival
        ? `「宿敵クラブからのこのような不敬な低額オファーは断じて受け入れられない。交渉を即時打ち切る！」(${sellerClub.name}は交渉から完全に撤退しました)`
        : `「これ以上、非現実的なオファーが続く場合、交渉を打ち切りますとお伝えしました。今回の交渉は完全に終了します。」(${sellerClub.name}は交渉から撤退しました)`;
      
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
  buyerClub: Club
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
    const msg = isRival
      ? `「宿敵クラブへの移籍というリスクを冒すには、提示された条件はあまりにも不十分です。この話は白紙に戻させていただきます。」(選手代理人が交渉を打ち切りました)`
      : `「提示された年俸および待遇は、当選手の市場価値と自負を満たしていません。交渉を終了させていただきます。」(選手代理人が交渉を打ち切りました)`;

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

// Complete transfer execution
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

  // 1. Move money
  buyerClub.transferBudget -= transferFee;
  sellerClub.transferBudget += Math.round(transferFee * 0.9); // 10% levy / tax
  buyerClub.currentWageSpend += weeklyWage;
  sellerClub.currentWageSpend = Math.max(0, sellerClub.currentWageSpend - player.wage);

  // 2. Transfer player registration
  const oldClubPlayerIds = sellerClub.playerIds.filter(id => id !== player.id);
  const newClubPlayerIds = [...buyerClub.playerIds, player.id];
  sellerClub.playerIds = oldClubPlayerIds;
  buyerClub.playerIds = newClubPlayerIds;

  // 3. Update player data
  const updatedPlayer: Player = {
    ...player,
    clubId: buyerClub.id,
    wage: weeklyWage,
    contractYears: negotiation.contractYearsOffered,
    squadRole: negotiation.squadRoleOffered,
    managerTrust: 90
  };

  // 4. Generate breaking news
  const newsTitle = isRival
    ? `【禁断のライバル移籍】${player.name}が宿敵${buyerClub.name}へ電撃加入！移籍金€${(transferFee / 1000000).toFixed(1)}Mの衝撃`
    : `【大型移籍決定】${player.name}が${buyerClub.name}へ完全移籍！移籍金€${(transferFee / 1000000).toFixed(1)}Mでサイン`;

  const newsBody = isRival
    ? `サッカー界に激震。${sellerClub.name}の主力である${player.name}が、長年の宿敵である${buyerClub.name}への完全移籍を正式発表しました。サポーターの間では激しい議論が巻き起こる一方、${buyerClub.name}の指揮官は「クラブの勝利のために最高のピースを獲得できた」と胸を張っています。`
    : `移籍市場にビッグニュース。${player.name}が${sellerClub.name}から${buyerClub.name}への移籍を完了しました。新天地での背番号やデビュー戦に早くも大きな注目が集まっています。`;

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
    clubs: {
      ...state.clubs,
      [buyerClub.id]: buyerClub,
      [sellerClub.id]: sellerClub
    },
    players: {
      ...state.players,
      [player.id]: updatedPlayer
    },
    news: [transferNews, ...state.news]
  };
}

// AI clubs autonomous transfer simulation during window
export function simulateAITransfers(state: GameWorldState): GameWorldState {
  if (!state.isTransferWindowOpen) return state;

  // 8% chance per day that an AI club completes a transfer
  if (Math.random() > 0.08) return state;

  const allClubs = Object.values(state.clubs).filter(c => c.id !== state.userClubId && c.transferBudget > 20000000);
  if (allClubs.length < 2) return state;

  const buyerClub = allClubs[Math.floor(Math.random() * allClubs.length)];
  const sellerClubCandidates = allClubs.filter(c => c.id !== buyerClub.id);
  const sellerClub = sellerClubCandidates[Math.floor(Math.random() * sellerClubCandidates.length)];

  // Find sellable player
  const candidatePlayers = sellerClub.playerIds
    .map(id => state.players[id])
    .filter(p => p && p.squadRole !== '絶対的主力' && p.marketValue < buyerClub.transferBudget * 0.7);

  if (candidatePlayers.length === 0) return state;
  const targetPlayer = candidatePlayers[Math.floor(Math.random() * candidatePlayers.length)];

  const mockNegotiation: TransferNegotiation = {
    id: `ai_neg_${Date.now()}`,
    playerId: targetPlayer.id,
    sellerClubId: sellerClub.id,
    buyerClubId: buyerClub.id,
    status: 'completed',
    isLoan: false,
    initialAskingPrice: targetPlayer.marketValue,
    currentBidFee: Math.round(targetPlayer.marketValue * 1.1),
    clubPatience: 3,
    clubMessages: [],
    wageOffered: Math.round(targetPlayer.wage * 1.2),
    wageDemanded: Math.round(targetPlayer.wage * 1.2),
    contractYearsOffered: 4,
    squadRoleOffered: '重要選手',
    signingBonusOffered: 1000000,
    playerPatience: 3,
    playerMessages: []
  };

  return executeTransferCompletion(state, mockNegotiation);
}
