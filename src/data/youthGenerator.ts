import { YouthProspect, Position, PlayStyle, PlayerPersonality } from '../types/game';

// =========================================================================
// 日本人選手：姓・名の膨大な実在プール（100+通り × 100+通り = 10,000通り以上）
// =========================================================================
const JA_LAST_NAMES = [
  '佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤',
  '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水',
  '山崎', '森', '池田', '橋本', '阿部', '石川', '山内', '小川', '前田', '岡田',
  '長谷川', '藤田', '近藤', '後藤', '遠藤', '村上', '村田', '新井', '平野', '大塚',
  '千葉', '菅原', '荒木', '福田', '西村', '三浦', '藤井', '岡本', '松田', '中島',
  '原', '中川', '宮崎', '杉山', '上田', '内田', '森本', '竹内', '酒井', '工藤',
  '横山', '宮本', '福島', '大野', '神谷', '浅野', '矢野', '秋元', '吉岡', '堀'
];

const JA_FIRST_NAMES = [
  { kanji: '蓮', romaji: 'Ren' },
  { kanji: '颯太', romaji: 'Sota' },
  { kanji: '悠真', romaji: 'Yuma' },
  { kanji: '蒼', romaji: 'Aoi' },
  { kanji: '湊', romaji: 'Minato' },
  { kanji: '大翔', romaji: 'Hiroto' },
  { kanji: '樹', romaji: 'Itsuki' },
  { kanji: '陽翔', romaji: 'Haruto' },
  { kanji: '陸', romaji: 'Riku' },
  { kanji: '晴', romaji: 'Haru' },
  { kanji: '律', romaji: 'Ritsu' },
  { kanji: '琉生', romaji: 'Rui' },
  { kanji: '翼', romaji: 'Tsubasa' },
  { kanji: '凱', romaji: 'Gai' },
  { kanji: '楓', romaji: 'Kaede' },
  { kanji: '翔', romaji: 'Sho' },
  { kanji: '陽向', romaji: 'Hinata' },
  { kanji: '駿', romaji: 'Shun' },
  { kanji: '颯', romaji: 'Hayate' },
  { kanji: '柊', romaji: 'Shu' },
  { kanji: '碧', romaji: 'Ao' },
  { kanji: '航平', romaji: 'Kohei' },
  { kanji: '拓真', romaji: 'Takuma' },
  { kanji: '健人', romaji: 'Kento' },
  { kanji: '翔太', romaji: 'Shota' },
  { kanji: '龍之介', romaji: 'Ryunosuke' },
  { kanji: '洸太', romaji: 'Kota' },
  { kanji: '怜央', romaji: 'Reo' },
  { kanji: '壮真', romaji: 'Soma' },
  { kanji: '快斗', romaji: 'Kaito' },
  { kanji: '誠也', romaji: 'Seiya' },
  { kanji: '圭佑', romaji: 'Keisuke' },
  { kanji: '悠斗', romaji: 'Yuto' },
  { kanji: '光輝', romaji: 'Koki' },
  { kanji: '海斗', romaji: 'Kaito' },
  { kanji: '涼介', romaji: 'Ryosuke' }
];

// =========================================================================
// 海外選手：国別リアル名プール
// =========================================================================
const GLOBAL_NAME_POOLS: Record<string, { firstNames: string[]; lastNames: string[] }> = {
  'イングランド': {
    firstNames: ['Oliver', 'George', 'Harry', 'Jack', 'Leo', 'Charlie', 'Archie', 'Ethan', 'Liam', 'Jude', 'Cole', 'Kobbie', 'Harvey', 'Reece', 'Mason'],
    lastNames: ['Smith', 'Jones', 'Taylor', 'Brown', 'Davies', 'Wilson', 'Evans', 'Walker', 'Palmer', 'Mainoo', 'Bellingham', 'Rice', 'Gallagher', 'Gray']
  },
  'スペイン': {
    firstNames: ['Mateo', 'Hugo', 'Lucas', 'Martín', 'Daniel', 'Pablo', 'Alejandro', 'Pau', 'Marc', 'Lamine', 'Gavi', 'Fermín', 'Nico', 'Brahim'],
    lastNames: ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Cubarsí', 'Yamal', 'Navarro', 'Romero']
  },
  'ドイツ': {
    firstNames: ['Noah', 'Luca', 'Leon', 'Felix', 'Jonas', 'Florian', 'Lennart', 'Maximilian', 'Paul', 'Aleksandar', 'Jan', 'Moritz', 'Elias'],
    lastNames: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Wirtz', 'Pavlović', 'Schulz', 'Koch', 'Bauer']
  },
  'フランス': {
    firstNames: ['Gabriel', 'Léo', 'Arthur', 'Louis', 'Jules', 'Maël', 'Warren', 'Désiré', 'Bradley', 'Mathys', 'Kylian', 'Rayan', 'Leny'],
    lastNames: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit', 'Zaïre-Emery', 'Doué', 'Barcola', 'Tel', 'Yoro', 'Cherki', 'Camavinga']
  },
  'イタリア': {
    firstNames: ['Leonardo', 'Francesco', 'Alessandro', 'Lorenzo', 'Mattia', 'Riccardo', 'Tommaso', 'Federico', 'Simone', 'Giorgio', 'Niccolò'],
    lastNames: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Scalvini', 'Pafundi', 'Baldanzi', 'Miretti']
  },
  'ブラジル': {
    firstNames: ['Gabriel', 'Arthur', 'Bernardo', 'Heitor', 'Davi', 'Pedro', 'Lucas', 'Matheus', 'Endrick', 'Estêvão', 'Vitor', 'Luiz', 'Kaiky'],
    lastNames: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Roque', 'Willian', 'Carvalho']
  }
};

const POSITIONS: Position[] = [
  'GK', 'CB', 'LB', 'RB', 'LWB', 'RWB',
  'CDM', 'CM', 'CAM', 'LM', 'RM',
  'LW', 'RW', 'CF', 'ST'
];

const PLAYSTYLES: PlayStyle[] = [
  'チャンスメイカー',
  '俊足ドリブラー',
  'スピードスター',
  'ゴールゲッター',
  'シャドーストライカー',
  'ラインブレイカー',
  'ボックストゥボックス',
  'アンカー',
  'ボール運べるCB',
  'ショットストッパー',
  'ビルドアップ型GK'
];

const PERSONALITIES: PlayerPersonality[] = [
  'プロフェッショナル',
  '野心的',
  '冷静沈着',
  '努力家',
  'リーダー気質'
];

/**
 * Generate a single unique randomized youth prospect
 */
export function generateSingleRandomYouthProspect(
  idSuffix: string | number,
  clubCountry: string = '日本'
): YouthProspect {
  // Determine nationality: 75% local country, 25% foreign talent
  const isJapanClub = clubCountry === '日本';
  const pickLocal = Math.random() < 0.75;

  let nationality = clubCountry;
  let name = '';

  if (isJapanClub) {
    if (pickLocal) {
      nationality = '日本';
      const last = JA_LAST_NAMES[Math.floor(Math.random() * JA_LAST_NAMES.length)];
      const first = JA_FIRST_NAMES[Math.floor(Math.random() * JA_FIRST_NAMES.length)];
      name = `${last} ${first.kanji} (${first.romaji} ${last})`;
    } else {
      // Foreign prospect in Japanese academy
      const nations = ['ブラジル', 'スペイン', 'ドイツ', 'フランス'];
      nationality = nations[Math.floor(Math.random() * nations.length)];
      const pool = GLOBAL_NAME_POOLS[nationality] || GLOBAL_NAME_POOLS['ブラジル'];
      const first = pool.firstNames[Math.floor(Math.random() * pool.firstNames.length)];
      const last = pool.lastNames[Math.floor(Math.random() * pool.lastNames.length)];
      name = `${first} ${last}`;
    }
  } else {
    // European club
    if (pickLocal && GLOBAL_NAME_POOLS[clubCountry]) {
      nationality = clubCountry;
      const pool = GLOBAL_NAME_POOLS[clubCountry];
      const first = pool.firstNames[Math.floor(Math.random() * pool.firstNames.length)];
      const last = pool.lastNames[Math.floor(Math.random() * pool.lastNames.length)];
      name = `${first} ${last}`;
    } else {
      const allCountries = Object.keys(GLOBAL_NAME_POOLS);
      nationality = allCountries[Math.floor(Math.random() * allCountries.length)];
      const pool = GLOBAL_NAME_POOLS[nationality];
      const first = pool.firstNames[Math.floor(Math.random() * pool.firstNames.length)];
      const last = pool.lastNames[Math.floor(Math.random() * pool.lastNames.length)];
      name = `${first} ${last}`;
    }
  }

  const position = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
  const age = 15 + Math.floor(Math.random() * 4); // 15 - 18歳

  // OVR & Potential: ~6% chance of generational super wonderkid
  const isWonderkid = Math.random() < 0.06;
  const ovr = isWonderkid
    ? 78 + Math.floor(Math.random() * 4) // 78 - 81
    : 63 + Math.floor(Math.random() * 11); // 63 - 73

  const potential = isWonderkid
    ? Math.min(95, ovr + 10 + Math.floor(Math.random() * 5))
    : Math.min(92, ovr + 10 + Math.floor(Math.random() * 12));

  // Playstyle appropriate for position
  let playstyle: PlayStyle;
  if (position === 'GK') {
    playstyle = Math.random() < 0.5 ? 'ショットストッパー' : 'ビルドアップ型GK';
  } else if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(position)) {
    playstyle = ['ボール運べるCB', '攻撃的SB', '守備的SB', 'アンカー'][Math.floor(Math.random() * 4)] as PlayStyle;
  } else if (['CDM', 'CM'].includes(position)) {
    playstyle = ['アンカー', 'ボックストゥボックス', 'チャンスメイカー'][Math.floor(Math.random() * 3)] as PlayStyle;
  } else {
    playstyle = ['チャンスメイカー', '俊足ドリブラー', 'スピードスター', 'ゴールゲッター', 'シャドーストライカー', 'ラインブレイカー'][Math.floor(Math.random() * 6)] as PlayStyle;
  }

  const personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];

  const scoutReport = isWonderkid
    ? `【世代屈指の特級神童】${age}歳にしてすでに完成された戦術眼と爆発的な個の打開力を誇る。トップチーム即戦力級の逸材。`
    : `優れたアジリティとボールコントロールを持つ${position}の有望株。的確な試合経験を積めば将来の主軸候補。`;

  return {
    id: `youth_${Date.now()}_${idSuffix}_${Math.floor(Math.random() * 10000)}`,
    name,
    age,
    nationality,
    position,
    ovr,
    potential,
    playstyle,
    personality,
    scoutReport,
    promoted: false
  };
}

/**
 * Generate a complete initial batch of randomized youth prospects for a new career
 */
export function generateRandomYouthAcademy(clubCountry: string = '日本', count: number = 6): YouthProspect[] {
  const list: YouthProspect[] = [];
  for (let i = 0; i < count; i++) {
    list.push(generateSingleRandomYouthProspect(i + 1, clubCountry));
  }
  return list;
}
