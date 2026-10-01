import { GameWorldState, MatchFixture, StandingsRow, LeagueKey, NewsItem, Player } from '../types/game';
import { simulateFullMatch, calculatePlayerInjuryRisk, INJURY_VARIETIES } from './matchEngine';
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

// -------------------------------------------------------------
// 【9. MATCH_RESULT 大会・順位表・選手個人成績への確実な反映】
// -------------------------------------------------------------
export function applyMatchResultToWorld(
  state: GameWorldState,
  fixture: MatchFixture,
  updatedPlayers?: Record<string, Player>
): GameWorldState {
  if (fixture.isResultApplied) {
    return state; // Duplicate reflection prevention (Requirement 9)
  }

  // 1. Update fixture record
  const fixtures = [...state.fixtures];
  const idx = fixtures.findIndex(f => f.id === fixture.id);
  const finalFixture: MatchFixture = {
    ...fixture,
    status: 'finished',
    isResultApplied: true
  };
  if (idx !== -1) {
    fixtures[idx] = finalFixture;
  }

  // 2. Update standings if this is a league fixture
  const standings = { ...state.standings };
  const leagueKey = finalFixture.competition as LeagueKey;
  if (standings[leagueKey]) {
    updateStandingsAfterMatch(standings[leagueKey], finalFixture);
  }

  // 3. Update player season stats from events
  const players = { ...(updatedPlayers || state.players) };
  if (finalFixture.events) {
    finalFixture.events.forEach(e => {
      if (e.playerId && players[e.playerId]) {
        if (e.type === 'yellow_card') {
          players[e.playerId].stats.yellowCards += 1;
        } else if (e.type === 'red_card' || e.type === 'second_yellow') {
          players[e.playerId].stats.redCards += 1;
        }
      }
    });
  }

  return {
    ...state,
    fixtures,
    standings,
    players
  };
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

  // 1. Fatigue Recovery & Daily Health check for players (Requirement 1 & 2)
  const updatedPlayers = { ...state.players };
  let injuryNews: NewsItem | null = null;

  Object.values(updatedPlayers).forEach(p => {
    // Natural fatigue recovery (+8 to +16% per rest day)
    if (p.fatigue > 0) {
      const restFactor = state.trainingFocus === 'コンディション回復' ? 18 : 11;
      p.fatigue = Math.max(0, p.fatigue - restFactor);
    }

    // Condition subtle daily fluctuation
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

    // --- Injury state maintenance & recovery check (Requirement 1: 日付を進めても怪我状態を維持) ---
    const isInjured = p.injuryStatus === 'INJURED' || p.injury?.isInjured;
    if (isInjured) {
      if (p.injuryDaysRemaining !== undefined && p.injuryDaysRemaining > 0) {
        p.injuryDaysRemaining -= 1;
      }
      if (p.injury?.recoveryDays !== undefined && p.injury.recoveryDays > 0) {
        p.injury.recoveryDays -= 1;
      }

      // Check if return date reached or recovery days completed
      const reachedReturnDate = p.injuryReturnDate && nextDate >= p.injuryReturnDate;
      const zeroDaysLeft = p.injuryDaysRemaining === 0 || (p.injury?.recoveryDays === 0 && !p.injuryReturnDate);

      if (reachedReturnDate || zeroDaysLeft) {
        p.injuryStatus = 'HEALTHY';
        p.injury.isInjured = false;
        p.injury.recoveryDays = 0;
        p.injury.returnDate = undefined;
        p.injuryReturnDate = undefined;
        p.injuryStartDate = undefined;
        p.injuryType = undefined;
        p.injuryDaysRemaining = 0;

        if (p.clubId === state.userClubId) {
          stoppedReason = `【戦列復帰】主力選手の${p.name}が怪我から全体練習に完全合流しました！`;
        }
      } else {
        // Strictly maintain INJURED state and prevent participation
        p.injuryStatus = 'INJURED';
        p.injury.isInjured = true;
        if (p.squadStatus === 'STARTING' || p.squadStatus === 'BENCH') {
          p.squadStatus = 'OUT_OF_SQUAD';
        }
      }
    } else {
      // Training injury risk with fatigue scaling (Requirement 2)
      const trainingRisk = calculatePlayerInjuryRisk(p, 30, '標準的') * 0.25;
      if (Math.random() < trainingRisk) {
        const chosenInj = INJURY_VARIETIES[Math.floor(Math.random() * INJURY_VARIETIES.length)];
        const returnDate = addDays(nextDate, chosenInj.days);
        p.injury = {
          isInjured: true,
          type: `${chosenInj.name} (練習中)`,
          recoveryDays: chosenInj.days,
          returnDate
        };
        p.injuryStatus = 'INJURED';
        p.injuryStartDate = nextDate;
        p.injuryReturnDate = returnDate;
        p.injuryType = `${chosenInj.name} (練習中)`;
        p.injuryDaysRemaining = chosenInj.days;
        p.squadStatus = 'OUT_OF_SQUAD';

        if (p.clubId === state.userClubId) {
          stoppedReason = `【緊急速報】${p.name}が練習中に負傷しました。(全治約${chosenInj.days}日・復帰予定: ${returnDate})`;
          injuryNews = {
            id: `news_inj_${Date.now()}`,
            date: nextDate,
            headline: `【負傷者情報】${state.clubs[state.userClubId]?.name}の${p.name}が練習中に負傷離脱`,
            body: `チームに痛手。${p.name}が本日のトレーニング中に負傷。メディカルスタッフの初期診断によると全治約${chosenInj.days}日（復帰予定: ${returnDate}）の見込み。試合出場不可のためベンチ外へ移動しました。`,
            category: 'injury',
            relatedClubId: state.userClubId,
            relatedPlayerId: p.id,
            importance: 'high'
          };
        }
      }
    }

    // Young player gradual growth (age <= 21, potential > ovr)
    if (p.age <= 21 && p.potential > p.ovr && Math.random() < 0.02) {
      p.ovr += 1;
      p.pace = Math.min(99, p.pace + 1);
      p.passing = Math.min(99, p.passing + 1);
      p.shooting = Math.min(99, p.shooting + 1);
    }
  });

  // Daily Loan Expiration Check
  const userClubId = state.userClubId;
  const loanReturnNews: NewsItem[] = [];
  Object.values(updatedPlayers).forEach(p => {
    if (p.isLoaned && p.loanEndDate && p.loanEndDate <= nextDate) {
      const parentClubId = p.loanFromClubId || p.parentClubId;
      const loanClubId = p.clubId;
      const parentClub = parentClubId ? state.clubs[parentClubId] : null;
      const loanClub = state.clubs[loanClubId];

      if (parentClub && loanClub) {
        loanClub.playerIds = loanClub.playerIds.filter(id => id !== p.id);
        if (!parentClub.playerIds.includes(p.id)) {
          parentClub.playerIds.push(p.id);
        }

        p.clubId = parentClub.id;
        p.currentClubId = parentClub.id;
        p.isLoaned = false;
        p.loanFromClubId = undefined;
        p.loanEndDate = undefined;
        p.loanOptionBuyFee = undefined;
        p.squadStatus = 'OUT_OF_SQUAD';

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

  // Autonomous AI Transfers
  state = simulateAITransfers(state);

  // -------------------------------------------------------------
  // 【10. 全試合消化 (AIクラブもスケジュール通りに全試合を進行)】
  // -------------------------------------------------------------
  const todayFixtures = state.fixtures.filter(f => f.date === nextDate);
  const userFixture = todayFixtures.find(f => f.homeClubId === state.userClubId || f.awayClubId === state.userClubId);

  // If there's a match involving the user's club today, STOP for match day!
  if (userFixture && userFixture.status === 'upcoming') {
    return {
      updatedState: state,
      stoppedReason: `【MATCH DAY】本日 ${state.clubs[userFixture.awayClubId]?.shortName || '対戦相手'} 戦が予定されています！`,
      hasUserMatchToday: true,
      userMatchFixture: userFixture
    };
  }

  // Simulate all AI fixtures scheduled for today across all competitions
  todayFixtures.forEach(f => {
    if (f.status === 'upcoming') {
      const homeClub = state.clubs[f.homeClubId];
      const awayClub = state.clubs[f.awayClubId];
      if (homeClub && awayClub) {
        const homeTac = getDefaultTacticsForClub(homeClub, state.players);
        const awayTac = getDefaultTacticsForClub(awayClub, state.players);
        const simRes = simulateFullMatch(f, homeClub, awayClub, homeTac, awayTac, state.players);
        state = applyMatchResultToWorld(state, simRes.fixture, simRes.updatedPlayers);
      }
    }
  });

  // End of Season Revenue & Promotions / Relegations check (May 25)
  if (nextDate === '2027-05-25') {
    const promRel = processSeasonEndPromotionsAndRelegations(state);
    state = promRel.state;
    state.news = [promRel.news, ...state.news];
    stoppedReason = '【シーズン全日程終了】J1/J2/J3の昇格・降格クラブおよび欧州カップ戦出場クラブが決定しました！';
  }

  // Transfer window deadline day check
  if (nextDate === '2026-08-31' || nextDate === '2026-01-31') {
    state.showDeadlineSummary = true;
    stoppedReason = '【移籍市場最終日】夏の移籍ウィンドウのデッドラインデイを迎えました！';
  }

  return {
    updatedState: state,
    stoppedReason
  };
}

// -------------------------------------------------------------
// 【7. Jリーグ昇降格システム (SEASON END PROMOTION & RELEGATION)】
// -------------------------------------------------------------
export function processSeasonEndPromotionsAndRelegations(state: GameWorldState): { state: GameWorldState; news: NewsItem } {
  const clubs = { ...state.clubs };
  const j1Rows = state.standings['j1-league'] || [];
  const j2Rows = state.standings['j2-league'] || [];
  const j3Rows = state.standings['j3-league'] || [];

  // J1 bottom 3 relegated to J2
  const j1Relegated = j1Rows.length >= 20 ? j1Rows.slice(-3).map(r => r.clubId) : [];
  // J2 top 3 promoted to J1
  const j2Promoted = j2Rows.length >= 20 ? j2Rows.slice(0, 3).map(r => r.clubId) : [];

  // J2 bottom 3 relegated to J3
  const j2Relegated = j2Rows.length >= 20 ? j2Rows.slice(-3).map(r => r.clubId) : [];
  // J3 top 3 promoted to J2
  const j3Promoted = j3Rows.length >= 20 ? j3Rows.slice(0, 3).map(r => r.clubId) : [];

  j1Relegated.forEach(id => {
    if (clubs[id]) clubs[id].league = 'j2-league';
  });
  j2Promoted.forEach(id => {
    if (clubs[id]) clubs[id].league = 'j1-league';
  });
  j2Relegated.forEach(id => {
    if (clubs[id]) clubs[id].league = 'j3-league';
  });
  j3Promoted.forEach(id => {
    if (clubs[id]) clubs[id].league = 'j2-league';
  });

  const news: NewsItem = {
    id: `news_j_prom_rel_${Date.now()}`,
    date: state.currentDate,
    headline: '【Jリーグ昇降格決定】シーズン終了に伴うJ1⇄J2、J2⇄J3の入れ替えが決定！',
    body: `シーズン終了に伴い昇格・降格クラブが確定しました。\n・J1昇格: ${j2Promoted.map(id => clubs[id]?.name).join('、') || '該当クラブ'}\n・J2降格: ${j1Relegated.map(id => clubs[id]?.name).join('、') || '該当クラブ'}\n・J2昇格: ${j3Promoted.map(id => clubs[id]?.name).join('、') || '該当クラブ'}\n・J3降格: ${j2Relegated.map(id => clubs[id]?.name).join('、') || '該当クラブ'}`,
    category: 'tournament',
    importance: 'high'
  };

  return {
    state: {
      ...state,
      clubs
    },
    news
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
