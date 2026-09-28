import { LeagueKey } from '../../types/game';

export interface LeagueMaster {
  id: LeagueKey;
  name: string;
  shortName: string;
  country: string;
  totalClubs: number;
  tier: number;
  description: string;
}

export const MASTER_LEAGUES: Record<LeagueKey, LeagueMaster> = {
  'premier-league': {
    id: 'premier-league',
    name: 'Premier League',
    shortName: 'PL',
    country: 'イングランド',
    totalClubs: 20,
    tier: 1,
    description: '世界最高峰の商業規模と競技レベルを誇るイングランド1部リーグ'
  },
  'laliga': {
    id: 'laliga',
    name: 'LaLiga EA SPORTS',
    shortName: 'LAL',
    country: 'スペイン',
    totalClubs: 20,
    tier: 1,
    description: 'テクニカルなパスワークと世界屈指のメガクラブが競い合うスペイン1部リーグ'
  },
  'bundesliga': {
    id: 'bundesliga',
    name: 'Bundesliga',
    shortName: 'BUN',
    country: 'ドイツ',
    totalClubs: 18,
    tier: 1,
    description: '超満員の熱狂的スタジアムと素早い攻守のインテンシティが魅力のドイツ1部リーグ'
  },
  'serie-a': {
    id: 'serie-a',
    name: 'Serie A Enilive',
    shortName: 'SEA',
    country: 'イタリア',
    totalClubs: 20,
    tier: 1,
    description: '洗練された守備戦術と歴史と伝統を誇るカルチョの最高峰イタリア1部リーグ'
  },
  'ligue-1': {
    id: 'ligue-1',
    name: 'Ligue 1 McDonald’s',
    shortName: 'L1',
    country: 'フランス',
    totalClubs: 18,
    tier: 1,
    description: '若手タレントの宝庫であり、フィジカルとスピードが融合するフランス1部リーグ'
  },
  'j1-league': {
    id: 'j1-league',
    name: '明治安田J1リーグ',
    shortName: 'J1',
    country: '日本',
    totalClubs: 20,
    tier: 1,
    description: '拮抗した実力と緻密な組織力でアジア最高峰のフットボールを展開する日本1部リーグ'
  }
};
