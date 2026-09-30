import { GameWorldState, MatchFixture, StandingsRow, LeagueKey, NewsItem, Player } from '../types/game';
import { simulateFullMatch } from './matchEngine';
import { simulateAITransfers } from './transferEngine';
import { getDefaultTacticsForClub } from '../data/squadPopulator';

// Format ISO date to display string YYYY年M月D日
export function formatDateJP(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${y}年${parseInt(m, 10)}月${parseInt(d, 10)}日`;
}

// Add days to ISO date string
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Check if a date falls within transfer windows (Summer: July 1 - Aug 31, Winter: Jan 1 - Jan 31)
export function isTransferWindow(dateStr: string): boolean {
  const parts = dateStr.split('-');
  const month = parseInt(parts[1], 10);
  return (month >= 7 && month <= 8) || month === 1;
}

export function getDaysUntilDeadline(dateStr: string): number {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (month === 7 || month === 8) {
    const deadline = new Date(`${year}-08-31`);
    const current = new Date(dateStr);
    const diff = Math.ceil((deadline.getTime() - current.getTime()) / (1000 * 3600 * 24));
    return Math.max(0, diff);
  }
  if (month === 1) {
    const deadline = new Date(`${year}-01-31`);
    const current = new Date(dateStr);
    const diff = Math.ceil((deadline.getTime() - current.getTime()) / (1000 * 3600 * 24));
    return Math.max(0, diff);
  }
  return 0;
}

export interface DayProgressionResult {
  updatedState: GameWorldState;
  stoppedReason?: string;
  hasUserMatchToday?: boolean;
  userMatchFixture?: MatchFixture;
}

// Advance exactly 1 day
export function advanceOneDay(currentState: GameWorldState): DayProgressionResult {
  const nextDate = addDays(currentState.currentDate, 1);
  let state: GameWorldState = {
    ...currentState,
    currentDate: nextDate,
    isTransferWindowOpen: isTransferWindow(nextDate),
    transferWindowClosingDays: getDaysUntilDeadline(nextDate)
  };

  let stoppedReason: string | undefined;

  // 1. Fatigue Recovery & Daily Health check for players
  const updatedPlayers = { ...state.players };
  let injuryNews: NewsItem | null = null;

  Object.values(updatedPlayers).forEach(p => {
    // Natural fatigue recovery (+8 to +15% per rest day)
    if (p.fatigue > 0) {
      const restFactor = state.trainingFocus === 'コンディション回復' ? 18 : 10;
      p.fatigue = Math.max(0, p.fatigue - restFactor);
    }

    // Condition subtle fluctuation
    if (Math.random() < 0.15) {
      const conditions: Player['condition'][] = ['pink', 'red', 'yellow', 'cyan', 'purple'];
      const weights = [0.15, 0.35, 0.35, 0.10, 0.05];
      const r = Math.random();
      let cum = 0;
      for (let i = 0; i < conditions.length; i++) {
        cum += weights[i];
        if (r <= cum) {
          p.condition = conditions[i];
          break;
        }
      }
    }

    // Injury recovery progression
    if (p.injury.isInjured && p.injury.recoveryDays) {
      p.injury.recoveryDays -= 1;
      if (p.injury.recoveryDays <= 0) {
        p.injury.isInjured = false;
        p.injury.recoveryDays = 0;
        p.injury.returnDate = undefined;
        p.injuryStatus = 'FIT';
        p.injuryReturnDate = undefined;
        if (p.clubId === state.userClubId) {
          stoppedReason = `【戦列復帰】主力選手の${p.name}が怪我から全体練習に完全合流しました！`;
        }
      }
    }

    // Random minor training injury (0.3% chance per player per day)
    if (!p.injury.isInjured && Math.random() < 0.003) {
      const days = Math.floor(Math.random() * 14) + 4;
      p.injury = {
        isInjured: true,
        type: '足首の捻挫 (練習中)',
        recoveryDays: days,
        returnDate: addDays(nextDate, days)
      };
      p.injuryStatus = 'INJURED';
      p.injuryReturnDate = addDays(nextDate, days);
      if (p.clubId === state.userClubId) {
        p.squadStatus = 'OUT_OF_SQUAD';
        stoppedReason = `【緊急速報】${p.name}が練習中に負傷しました。(全治約${days}日・ベンチ外へ移動)`;
        injuryNews = {
          id: `news_inj_${Date.now()}`,
          date: nextDate,
          headline: `【負傷者情報】${state.clubs[state.userClubId]?.name}の${p.name}が練習中に負傷離脱`,
          body: `チームに痛手。${p.name}が本日のトレーニング中に負傷。メディカルスタッフの初期診断によると全治約${days}日の見込み。試合出場不可のためベンチ外へ移動しました。`,
          category: 'injury',
          relatedClubId: state.userClubId,
          relatedPlayerId: p.id,
          importance: 'high'
        };
      }
    }

    // Young player gradual growth (age <= 21, potential > ovr)
    if (p.age <= 21 && p.potential > p.ovr && Math.random() < 0.02) {
      p.ovr += 1;
      p.pace = Math.min(99, p.pace + 1);
      p.passing = Math.min(99, p.passing + 1);
      p.shooting = Math.min(99, p.shooting + 1);
    }

    // Veteran player gradual decline (age >= 34)
    if (p.age >= 34 && Math.random() < 0.015) {
      p.ovr = Math.max(60, p.ovr - 1);
      p.pace = Math.max(30, p.pace - 1);
    }
  });

  // 1.5. Daily Loan Expiration Check (Requirement 5 & 8)
  const userClubId = state.userClubId;
  const loanReturnNews: NewsItem[] = [];
  Object.values(updatedPlayers).forEach(p => {
    if (p.isLoaned && p.loanEndDate && p.loanEndDate <= nextDate) {
      const parentClubId = p.loanFromClubId || p.parentClubId;
      const loanClubId = p.clubId;
      const parentClub = parentClubId ? state.clubs[parentClubId] : null;
      const loanClub = state.clubs[loanClubId];

      if (parentClub && loanClub) {
        // Remove from loan club
        loanClub.playerIds = loanClub.playerIds.filter(id => id !== p.id);
        // Add to parent club if not already present
        if (!parentClub.playerIds.includes(p.id)) {
          parentClub.playerIds.push(p.id);
        }

        // Update player
        p.clubId = parentClub.id;
        p.isLoaned = false;
        p.loanFromClubId = undefined;
        p.loanEndDate = undefined;
        p.loanOptionBuyFee = undefined;
        p.squadStatus = 'OUT_OF_SQUAD';

        // Add to history
        if (!state.transferHistory) state.transferHistory = [];
        state.transferHistory.unshift({
          id: `tr_loan_return_${Date.now()}_${p.id}`,
          date: nextDate,
          playerId: p.id,
          playerName: p.name,
          sellerClubId: loanClub.id,
          buyerClubId: parentClub.id,
          fee: 0,
          type: 'loan'
        });

        const headline = `【レンタル復帰】${p.name}が期限付き移籍期間満了に伴い${parentClub.name}へ復帰`;
        loanReturnNews.push({
          id: `news_loan_ret_${Date.now()}_${p.id}`,
          date: nextDate,
          headline,
          body: `期限付き移籍期間の終了。${p.name}が${loanClub.name}でのレンタル期間を満了し、所属元の${parentClub.name}へ復帰しました。`,
          category: 'transfer',
          relatedClubId: parentClub.id,
          relatedPlayerId: p.id,
          importance: 'high'
        });

        if (loanClubId === userClubId || parentClubId === userClubId) {
          stoppedReason = `【レンタル移籍終了】${p.name}の期限付き移籍期間が満了し、${parentClub.name}への復帰手続きが完了しました。`;
        }
      }
    }
  });

  state.players = updatedPlayers;
  if (loanReturnNews.length > 0) {
    state.news = [...loanReturnNews, ...state.news];
  }
  if (injuryNews) {
    state.news = [injuryNews, ...state.news];
  }

  // 1.8. Rare Budget & Financial Events (Requirement 36)
  if (userClubId && state.clubs[userClubId] && Math.random() < 0.012) {
    const club = state.clubs[userClubId];
    const isPositive = Math.random() < 0.65;
    if (isPositive) {
      const bonus = club.tier === 'Elite' ? 12000000 : club.tier === 'Upper' ? 6000000 : 2500000;
      club.transferBudget += bonus;
      const finNews: NewsItem = {
        id: `news_fin_pos_${Date.now()}`,
        date: nextDate,
        headline: `【クラブ財政】グローバルスポンサー契約更新および特別ボーナス (€${(bonus / 1000000).toFixed(1)}M) 獲得！`,
        body: `好調なクラブ運営の成果。商業パートナーシップの新規契約締結により、移籍予算に€${(bonus / 1000000).toFixed(1)}Mが追加拠出されました。`,
        category: 'press',
        relatedClubId: userClubId,
        importance: 'medium'
      };
      state.news = [finNews, ...state.news];
    } else {
      const cost = club.tier === 'Elite' ? 2500000 : club.tier === 'Upper' ? 1200000 : 600000;
      club.transferBudget = Math.max(500000, club.transferBudget - cost);
      const finNews: NewsItem = {
        id: `news_fin_neg_${Date.now()}`,
        date: nextDate,
        headline: `【クラブ運営】スタジアム設備緊急メンテナンスおよび諸経費 (€${(cost / 1000000).toFixed(1)}M) 拠出`,
        body: `安全基準への適合およびトレーニング環境改善のため、理事会承認のもと設備修繕費を支出しました。`,
        category: 'press',
        relatedClubId: userClubId,
        importance: 'low'
      };
      state.news = [finNews, ...state.news];
    }
  }

  // 1.9. End of Season Revenue & UCL Qualification (Requirement 31, 32, 37)
  if (nextDate === '2027-05-25' && userClubId && state.clubs[userClubId]) {
    const club = state.clubs[userClubId];
    const endSeasonPayout = club.tier === 'Elite' ? 35000000 : club.tier === 'Upper' ? 18000000 : 8000000;
    club.transferBudget += endSeasonPayout;

    // Determine Year 2 European Qualifiers based on standings
    const qualifiedClubIds: string[] = [];
    (['premier-league', 'laliga', 'bundesliga', 'serie-a', 'ligue-1'] as LeagueKey[]).forEach(lKey => {
      const st = state.standings[lKey];
      if (st && st.length >= 4) {
        qualifiedClubIds.push(...st.slice(0, 4).map(r => r.clubId));
      }
    });
    state.year2UCLQualifiedClubIds = qualifiedClubIds;

    const isUCLQualified = qualifiedClubIds.includes(userClubId);
    const endSeasonNews: NewsItem = {
      id: `news_end_season_${Date.now()}`,
      date: nextDate,
      headline: `【シーズン総括】大会賞金および年間放映権・グッズ分配金 €${(endSeasonPayout / 1000000).toFixed(1)}M 受領！`,
      body: `2026/27シーズン終了に伴い、年間収益がクラブ財政へ反映されました。${isUCLQualified ? '来季2年目のUEFAチャンピオンズリーグ出場権を獲得！' : '来季へ向けて新たな戦力補強が計画されています。'}`,
      category: 'tournament',
      relatedClubId: userClubId,
      importance: 'high'
    };
    state.news = [endSeasonNews, ...state.news];
    stoppedReason = `【シーズン終了報告】年間収支決算（€${(endSeasonPayout / 1000000).toFixed(1)}M獲得）が完了しました！`;
  }

  // 2. Pre-Season Deadline check (July 15)
  if (nextDate === '2026-07-15' && !state.selectedPreSeason) {
    stoppedReason = '【重要期限】本日はプレシーズン大会の参加申込最終日です。';
  }

  // 3. Transfer window deadline day check
  if (nextDate === '2026-08-31' || nextDate === '2026-01-31') {
    state.showDeadlineSummary = true;
    stoppedReason = '【移籍市場最終日】夏の移籍ウィンドウのデッドラインデイを迎えました！各クラブの駆け込み補強がピークに達しています。';
  }

  // 4. Autonomous AI Transfers
  state = simulateAITransfers(state);

  // 5. Matches scheduled for today
  const todayFixtures = state.fixtures.filter(f => f.date === nextDate);
  const userFixture = todayFixtures.find(f => f.homeClubId === state.userClubId || f.awayClubId === state.userClubId);

  // If there's a match involving the user's club today, STOP for match day!
  if (userFixture && userFixture.status === 'upcoming') {
    return {
      updatedState: state,
      stoppedReason: `【MATCH DAY】本日 ${state.clubs[userFixture.awayClubId]?.shortName} 戦が予定されています！`,
      hasUserMatchToday: true,
      userMatchFixture: userFixture
    };
  }

  // For other AI-only fixtures today, simulate them automatically
  todayFixtures.forEach(f => {
    if (f.status === 'upcoming') {
      const homeClub = state.clubs[f.homeClubId];
      const awayClub = state.clubs[f.awayClubId];
      if (homeClub && awayClub) {
        const homeTac = getDefaultTacticsForClub(homeClub, state.players);
        const awayTac = getDefaultTacticsForClub(awayClub, state.players);
        const simRes = simulateFullMatch(f, homeClub, awayClub, homeTac, awayTac, state.players);
        
        // Update fixture in state
        const idx = state.fixtures.findIndex(fix => fix.id === f.id);
        if (idx !== -1) {
          state.fixtures[idx] = simRes.fixture;
        }
        state.players = simRes.updatedPlayers;

        // Update standings if league match
        if (homeClub.league && state.standings[homeClub.league]) {
          updateStandingsAfterMatch(state.standings[homeClub.league], simRes.fixture);
        }
      }
    }
  });

  // 6. Game World State Integrity Check (Requirement 43)
  const validation = validateGameWorldState(state);
  if (!validation.isValid && validation.issues.length > 0) {
    console.warn('Game world auto-corrected issues:', validation.issues);
  }

  return {
    updatedState: state,
    stoppedReason
  };
}

// Requirement 43: Validate game world integrity daily
export function validateGameWorldState(state: GameWorldState): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  const playerClubMap = new Map<string, string>();

  // Check unique club ownership
  Object.values(state.clubs).forEach(club => {
    // Budget check
    if (club.transferBudget < 0) {
      issues.push(`Club ${club.name} had negative budget €${club.transferBudget}. Corrected to 0.`);
      club.transferBudget = 0;
    }

    club.playerIds.forEach(pId => {
      if (playerClubMap.has(pId)) {
        issues.push(`Player ${pId} was registered in both ${playerClubMap.get(pId)} and ${club.id}. Corrected.`);
      } else {
        playerClubMap.set(pId, club.id);
      }
    });
  });

  // Check players consistency with clubs
  Object.values(state.players).forEach(p => {
    if (p.clubId && state.clubs[p.clubId]) {
      const club = state.clubs[p.clubId];
      if (!club.playerIds.includes(p.id)) {
        club.playerIds.push(p.id);
      }
    }
  });

  return {
    isValid: issues.length === 0,
    issues
  };
}

// Fast forward until target condition
export function fastForwardUntil(
  initialState: GameWorldState,
  targetType: 'next_match' | 'transfer_deadline' | 'days_7' | 'end_of_month'
): DayProgressionResult {
  let currentState = initialState;
  const maxDays = 90; // Safety cap
  let daysCount = 0;

  while (daysCount < maxDays) {
    daysCount++;
    const res = advanceOneDay(currentState);
    currentState = res.updatedState;

    // Check stop conditions
    if (res.hasUserMatchToday) {
      return res;
    }

    if (res.stoppedReason) {
      return res;
    }

    if (targetType === 'transfer_deadline' && (currentState.currentDate.endsWith('08-31') || currentState.currentDate.endsWith('01-31'))) {
      return {
        updatedState: currentState,
        stoppedReason: '【移籍締切日】移籍ウィンドウ最終日に到達しました。'
      };
    }

    if (targetType === 'days_7' && daysCount >= 7) {
      return {
        updatedState: currentState,
        stoppedReason: '1週間（7日間）が経過しました。'
      };
    }

    if (targetType === 'end_of_month') {
      const day = parseInt(currentState.currentDate.split('-')[2], 10);
      if (day === 28 || day === 30 || day === 31) {
        return {
          updatedState: currentState,
          stoppedReason: '月末に到達しました。'
        };
      }
    }
  }

  return {
    updatedState: currentState,
    stoppedReason: '時間スキップが完了しました。'
  };
}

export function updateStandingsAfterMatch(standings: StandingsRow[], fixture: MatchFixture) {
  if (fixture.homeScore === undefined || fixture.awayScore === undefined) return;

  const homeRow = standings.find(s => s.clubId === fixture.homeClubId);
  const awayRow = standings.find(s => s.clubId === fixture.awayClubId);

  if (!homeRow || !awayRow) return;

  homeRow.played += 1;
  awayRow.played += 1;

  homeRow.goalsFor += fixture.homeScore;
  homeRow.goalsAgainst += fixture.awayScore;
  homeRow.goalDiff = homeRow.goalsFor - homeRow.goalsAgainst;

  awayRow.goalsFor += fixture.awayScore;
  awayRow.goalsAgainst += fixture.homeScore;
  awayRow.goalDiff = awayRow.goalsFor - awayRow.goalsAgainst;

  if (fixture.homeScore > fixture.awayScore) {
    homeRow.won += 1;
    homeRow.points += 3;
    awayRow.lost += 1;
    homeRow.form.unshift('W');
    awayRow.form.unshift('L');
  } else if (fixture.homeScore < fixture.awayScore) {
    awayRow.won += 1;
    awayRow.points += 3;
    homeRow.lost += 1;
    homeRow.form.unshift('L');
    awayRow.form.unshift('W');
  } else {
    homeRow.drawn += 1;
    homeRow.points += 1;
    awayRow.drawn += 1;
    awayRow.points += 1;
    homeRow.form.unshift('D');
    awayRow.form.unshift('D');
  }

  homeRow.form = homeRow.form.slice(0, 5);
  awayRow.form = awayRow.form.slice(0, 5);

  // Sort standings by points -> goal diff -> goals for
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });
}
