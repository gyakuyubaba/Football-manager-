import { 
  GameWorldState, 
  ManagerProfile, 
  Club, 
  LeagueKey, 
  StandingsRow, 
  MatchFixture, 
  TeamTactics, 
  NewsItem 
} from '../types/game';
import { ALL_116_CLUBS } from '../data/clubsData';
import { INITIAL_YOUTH_ACADEMY } from '../data/initialData';
import { buildCompletePlayersRegistry, populateClubsWithDefaultSquads, getDefaultTacticsForClub } from '../data/squadPopulator';
import { getDaysUntilDeadline } from './dateEngine';

export const SAVE_KEY = 'fm26_career_save_v2_real';

export function createInitialStandings(clubs: Record<string, Club>): Record<LeagueKey, StandingsRow[]> {
  const standings: Record<LeagueKey, StandingsRow[]> = {
    'premier-league': [],
    'laliga': [],
    'bundesliga': [],
    'serie-a': [],
    'ligue-1': [],
    'j1-league': []
  };

  Object.values(clubs).forEach(club => {
    if (standings[club.league]) {
      standings[club.league].push({
        clubId: club.id,
        clubName: club.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
        form: []
      });
    }
  });

  return standings;
}

export function generateSeasonFixtures(clubs: Record<string, Club>, userClubId: string | null): MatchFixture[] {
  const fixtures: MatchFixture[] = [];

  // Group clubs by league
  const leagues: Record<string, Club[]> = {};
  Object.values(clubs).forEach(c => {
    if (!leagues[c.league]) leagues[c.league] = [];
    leagues[c.league].push(c);
  });

  // Pre-season friendly on July 10, 20, 30
  if (userClubId && clubs[userClubId]) {
    const opponents = Object.values(clubs).filter(c => c.id !== userClubId);
    
    fixtures.push({
      id: 'fix_ps_1',
      date: '2026-07-10',
      competition: 'pre-season',
      competitionName: 'プレシーズン・親善マッチ第1戦',
      homeClubId: userClubId,
      awayClubId: opponents[0]?.id || 'brighton',
      status: 'upcoming',
      isUserMatch: true
    });

    fixtures.push({
      id: 'fix_ps_2',
      date: '2026-07-20',
      competition: 'pre-season',
      competitionName: 'プレシーズン・親善マッチ第2戦',
      homeClubId: opponents[1]?.id || 'sanfrecce',
      awayClubId: userClubId,
      status: 'upcoming',
      isUserMatch: true
    });

    fixtures.push({
      id: 'fix_ps_3',
      date: '2026-07-30',
      competition: 'pre-season',
      competitionName: 'サマー・トロフィー決定戦',
      homeClubId: userClubId,
      awayClubId: opponents[2]?.id || 'frankfurt',
      status: 'upcoming',
      isUserMatch: true
    });
  }

  // League matchdays throughout the season
  const matchDates = [
    '2026-08-08', '2026-08-15', '2026-08-22', '2026-08-29',
    '2026-09-12', '2026-09-19', '2026-09-26', '2026-10-03',
    '2026-10-17', '2026-10-24', '2026-10-31', '2026-11-07',
    '2026-11-21', '2026-11-28', '2026-12-05', '2026-12-12',
    '2026-12-19', '2026-12-26', '2027-01-09', '2027-01-16',
    '2027-01-23', '2027-01-30', '2027-02-06', '2027-02-13',
    '2027-02-20', '2027-02-27', '2027-03-06', '2027-03-13',
    '2027-04-03', '2027-04-10', '2027-04-17', '2027-04-24',
    '2027-05-01', '2027-05-08', '2027-05-15', '2027-05-22'
  ];

  Object.entries(leagues).forEach(([leagueKey, leagueClubs]) => {
    const n = leagueClubs.length;
    if (n < 2) return;

    for (let r = 0; r < matchDates.length; r++) {
      const date = matchDates[r];
      // Generate pairs
      for (let i = 0; i < Math.floor(n / 2); i++) {
        const homeIdx = (r + i) % (n - 1);
        let awayIdx = (n - 1 - i + r) % (n - 1);
        if (i === 0) {
          awayIdx = n - 1;
        }

        const home = r % 2 === 0 ? leagueClubs[homeIdx] : leagueClubs[awayIdx];
        const away = r % 2 === 0 ? leagueClubs[awayIdx] : leagueClubs[homeIdx];

        if (home && away) {
          const isUserMatch = home.id === userClubId || away.id === userClubId;
          fixtures.push({
            id: `fix_${leagueKey}_r${r}_m${i}`,
            date,
            competition: leagueKey as LeagueKey,
            competitionName: `${home.league.toUpperCase().replace('-', ' ')} 第${r + 1}節`,
            homeClubId: home.id,
            awayClubId: away.id,
            status: 'upcoming',
            isUserMatch
          });
        }
      }
    }
  });

  // Sort fixtures chronologically
  fixtures.sort((a, b) => a.date.localeCompare(b.date));

  return fixtures;
}

export function createNewGameWorld(manager: ManagerProfile): GameWorldState {
  const initialClubsMap: Record<string, Club> = {};
  ALL_116_CLUBS.forEach(c => {
    initialClubsMap[c.id] = { ...c, playerIds: [] };
  });

  const playersRegistry = buildCompletePlayersRegistry();
  const { clubs, players } = populateClubsWithDefaultSquads(initialClubsMap, playersRegistry);

  const initialTactics: TeamTactics = {
    formation: '4-3-3',
    lineup: { starters: [], bench: [], reserves: [] },
    instructions: {
      attackingStyle: 'ポゼッション・パス',
      defensiveStyle: 'ハイプレス',
      pressIntensity: '標準的',
      defensiveLine: 'ハイライン',
      tempo: '高速テンポ',
      counterUrgency: 'ボール奪取時即カウンター'
    },
    roles: {}
  };

  const initialDate = '2026-07-01';

  const welcomeNews: NewsItem = {
    id: 'news_welcome_1',
    date: initialDate,
    headline: `【2026/27シーズン開幕】世界6大リーグ（全116クラブ）と移籍市場が始動！`,
    body: `新シーズンが本格的にスタート。J1リーグ、プレミアリーグ、ラ・リーガ、ブンデスリーガ、セリエA、リーグ・アンの全116クラブが実名選手とともに登録完了。夏の移籍ウィンドウが解禁され、国内外の移籍交渉が本格化しています。`,
    category: 'tournament',
    importance: 'high'
  };

  const standings = createInitialStandings(clubs);

  return {
    currentDate: initialDate,
    season: '2026/27',
    isTransferWindowOpen: true,
    transferWindowClosingDays: getDaysUntilDeadline(initialDate),
    manager,
    userClubId: null,
    boardConfidence: 80,
    fanApproval: 75,
    consecutiveLosses: 0,
    isSacked: false,
    clubs,
    players,
    tactics: initialTactics,
    fixtures: [],
    standings,
    negotiations: {},
    news: [welcomeNews],
    youthAcademy: [...INITIAL_YOUTH_ACADEMY],
    careerHistory: [],
    trainingFocus: 'バランス総合'
  };
}

// -------------------------------------------------------------
// 【1. 最初の5クラブからのオファーを完全ランダム化】
// Dynamically randomized 5 initial offers with balanced distribution:
// - 1 J1 League club
// - 1 Lower Tier club (relegation fight / survival)
// - 2 Mid Tier clubs (different leagues)
// - 1 Upper / Elite Tier club (reputable ambition)
// -------------------------------------------------------------
export function getInitialClubOffers(allClubs: Record<string, Club>, manager?: ManagerProfile): Club[] {
  const clubList = Object.values(allClubs);
  if (clubList.length === 0) return [];

  // Helper to shuffle an array randomly
  const shuffle = <T>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // 1. J1 League clubs
  const j1Clubs = shuffle(clubList.filter(c => c.league === 'j1-league'));
  // 2. Lower Tier clubs (survival battles)
  const lowerClubs = shuffle(clubList.filter(c => c.tier === 'Lower' && c.league !== 'j1-league'));
  // 3. Mid Tier clubs (ambitious mid-table)
  const midClubs = shuffle(clubList.filter(c => c.tier === 'Mid' && c.league !== 'j1-league'));
  // 4. Upper / Elite Tier clubs (title & continental contention)
  const upperClubs = shuffle(clubList.filter(c => (c.tier === 'Upper' || c.tier === 'Elite') && c.league !== 'j1-league'));

  const picked: Club[] = [];
  const pickedIds = new Set<string>();

  const tryAdd = (club?: Club) => {
    if (club && !pickedIds.has(club.id) && picked.length < 5) {
      picked.push(club);
      pickedIds.add(club.id);
      return true;
    }
    return false;
  };

  // Add 1 J1 Club
  tryAdd(j1Clubs[0]);

  // Add 1 Lower Tier Club
  tryAdd(lowerClubs[0]);

  // Add 2 Mid Tier Clubs from different leagues if possible
  for (const mc of midClubs) {
    if (picked.length >= 4) break;
    // Prefer diverse leagues
    const existingLeagues = picked.map(p => p.league);
    if (!existingLeagues.includes(mc.league) || midClubs.length <= 2) {
      tryAdd(mc);
    }
  }
  // Fill mid if still needed
  for (const mc of midClubs) {
    if (picked.length >= 4) break;
    tryAdd(mc);
  }

  // Add 1 Upper/Elite Club
  tryAdd(upperClubs[0]);

  // Fallback if somehow still under 5: fill from any remaining shuffled clubs
  if (picked.length < 5) {
    const remaining = shuffle(clubList.filter(c => !pickedIds.has(c.id)));
    for (const c of remaining) {
      if (picked.length >= 5) break;
      tryAdd(c);
    }
  }

  return picked;
}

// Player accepts one of the club offers
export function appointUserToClub(state: GameWorldState, chosenClubId: string): GameWorldState {
  const updatedClubs = { ...state.clubs };
  Object.values(updatedClubs).forEach(c => {
    c.isUserClub = c.id === chosenClubId;
  });

  const chosenClub = updatedClubs[chosenClubId];
  const userTactics = getDefaultTacticsForClub(chosenClub, state.players);
  const fixtures = generateSeasonFixtures(updatedClubs, chosenClubId);

  const appointNews: NewsItem = {
    id: `news_appoint_${Date.now()}`,
    date: state.currentDate,
    headline: `【新体制発足】${chosenClub.name}、新指揮官に${state.manager.name}氏の就任を発表！`,
    body: `${chosenClub.name}は本日、チームの新たな舵取り役として${state.manager.name}監督（${state.manager.age}歳、${state.manager.nationality}）の招聘を正式に発表しました。会見でフロント陣は「${state.manager.name}監督の卓越した${state.manager.specialty}と${state.manager.style}の手腕がクラブを次なる高みへ導いてくれると確信している」とコメント。ファンからも新時代の幕開けに大きな期待が寄せられています。`,
    category: 'press',
    relatedClubId: chosenClub.id,
    importance: 'high'
  };

  const nextState: GameWorldState = {
    ...state,
    userClubId: chosenClubId,
    clubs: updatedClubs,
    tactics: userTactics,
    fixtures,
    news: [appointNews, ...state.news],
    boardConfidence: 85,
    fanApproval: 80
  };

  saveGameState(nextState);
  return nextState;
}

// -------------------------------------------------------------
// 【9-14. 初期化機能の完全再構築・データ分離・安全検証】
// -------------------------------------------------------------

export function validateInitialWorldState(state: GameWorldState): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const clubCount = Object.keys(state.clubs || {}).length;
  if (clubCount < 116) {
    errors.push(`クラブ数が不足しています (現在: ${clubCount}/116)`);
  }

  const playerCount = Object.keys(state.players || {}).length;
  if (playerCount < 1000) {
    errors.push(`選手データ数が不足しています (現在: ${playerCount})`);
  }

  if (state.currentDate !== '2026-07-01') {
    errors.push(`開始日付が正しくありません (現在: ${state.currentDate})`);
  }

  const leagues: LeagueKey[] = ['premier-league', 'laliga', 'bundesliga', 'serie-a', 'ligue-1', 'j1-league'];
  leagues.forEach(l => {
    if (!state.standings[l] || state.standings[l].length === 0) {
      errors.push(`リーグ順位表が存在しません (${l})`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

export function resetGameWorldToInitial(): {
  success: boolean;
  newState: GameWorldState | null;
  error?: string;
} {
  try {
    // 1. Completely delete mutable SAVE_DATA
    clearGameState();

    // 2. Reconstruct fresh GAME_WORLD_STATE from immutable BASE_DATA
    const dummyManager: ManagerProfile = {
      name: '',
      nationality: '日本',
      age: 42,
      avatar: '👔',
      style: '戦術至上主義',
      tacticalType: 'ゲーゲンプレス',
      specialty: '攻撃戦術',
      reputation: 75,
      careerTrophies: 0,
      matchesManaged: 0,
      wins: 0,
      draws: 0,
      losses: 0
    };

    const freshWorld = createNewGameWorld(dummyManager);

    // 3. Automated Data Validation
    const validation = validateInitialWorldState(freshWorld);
    if (!validation.valid) {
      console.error('Validation failed after reset:', validation.errors);
      return {
        success: false,
        newState: null,
        error: `データ検証エラー: ${validation.errors.join(', ')}`
      };
    }

    return {
      success: true,
      newState: freshWorld
    };
  } catch (err: any) {
    console.error('Failed to reset game world:', err);
    return {
      success: false,
      newState: null,
      error: err?.message || '初期化処理中にエラーが発生しました'
    };
  }
}

export function saveGameState(state: GameWorldState): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to save game state to LocalStorage:', err);
    return false;
  }
}

export function loadGameState(): GameWorldState | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    // Check v2 save first
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) {
      window.localStorage.removeItem('fm26_career_save_v1');
      return null;
    }
    const state: GameWorldState = JSON.parse(raw);
    
    // Auto-migrate check: if less than 116 clubs or missing manager, clear
    if (!state.clubs || Object.keys(state.clubs).length < 116) {
      console.warn('Legacy incomplete save detected. Resetting to full 116 clubs real database.');
      window.localStorage.removeItem(SAVE_KEY);
      return null;
    }
    return state;
  } catch (err) {
    console.error('Failed to load game state from LocalStorage:', err);
    return null;
  }
}

export function clearGameState(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(SAVE_KEY);
      window.localStorage.removeItem('fm26_career_save_v1');
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && (k.startsWith('fm26_') || k.includes('career'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => window.localStorage.removeItem(k));
    }
  } catch (err) {
    console.error('Failed to clear game state:', err);
  }
}
