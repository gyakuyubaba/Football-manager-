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
      if (p.clubId === state.userClubId) {
        stoppedReason = `【緊急速報】${p.name}が練習中に負傷しました。(全治約${days}日)`;
        injuryNews = {
          id: `news_inj_${Date.now()}`,
          date: nextDate,
          headline: `【負傷者情報】${state.clubs[state.userClubId]?.name}の${p.name}が練習中に負傷離脱`,
          body: `チームに痛手。${p.name}が本日のトレーニング中に負傷。メディカルスタッフの初期診断によると全治約${days}日の見込み。`,
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

  state.players = updatedPlayers;
  if (injuryNews) {
    state.news = [injuryNews, ...state.news];
  }

  // 2. Pre-Season Deadline check (July 15)
  if (nextDate === '2026-07-15' && !state.selectedPreSeason) {
    stoppedReason = '【重要期限】本日はプレシーズン大会の参加申込最終日です。';
  }

  // 3. Transfer window deadline day check
  if (nextDate === '2026-08-31' || nextDate === '2026-01-31') {
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

  return {
    updatedState: state,
    stoppedReason
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
