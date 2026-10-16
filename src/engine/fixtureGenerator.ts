import { MatchFixture, Club, LeagueKey } from '../types/game';

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
      homeClubId: opponents[1]?.id || 'leverkusen',
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
