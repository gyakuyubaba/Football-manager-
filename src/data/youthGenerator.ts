import { YouthProspect, Position, PlayStyle, PlayerPersonality } from '../types/game';

// =========================================================================
// 日本人選手：姓・名の膨大な実在プール（120+ × 80+ = 10,000通り以上の完全ランダム生成）
// =========================================================================
const JA_LAST_NAMES = [
  '佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤',
  '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水',
  '山崎', '森', '池田', '橋本', '阿部', '石川', '山内', '小川', '前田', '岡田',
  '長谷川', '藤田', '近藤', '後藤', '遠藤', '村上', '村田', '新井', '平野', '大塚',
  '千葉', '菅原', '荒木', '福田', '西村', '三浦', '藤井', '岡本', '松田', '中島',
  '原', '中川', '宮崎', '杉山', '上田', '内田', '森本', '竹内', '酒井', '工藤',
  '横山', '宮本', '福島', '大野', '神谷', '浅野', '矢野', '秋元', '吉岡', '堀',
  '小野', '小泉', '金子', '和田', '中山', '石田', '上野', '柴田', '原田', '田村',
  '岩崎', '菊地', '野口', '高木', '安藤', '大西', '小池', '服部', '川口', '飯田',
  '星野', '川崎', '本田', '久保', '武藤', '大迫', '三笘', '堂安', '南野', '板倉',
  '鎌田', '守田', '旗手', '相馬', '細谷', '町田', '毎熊', '望月', '関根', '高井'
];

const JA_FIRST_NAMES = [
  '蓮', '颯太', '悠真', '蒼', '湊', '大翔', '樹', '陽翔', '陸', '晴',
  '律', '琉生', '翼', '凱', '楓', '翔', '陽向', '駿', '颯', '柊',
  '碧', '航平', '拓真', '健人', '翔太', '龍之介', '洸太', '怜央', '壮真', '快斗',
  '誠也', '圭佑', '悠斗', '光輝', '海斗', '涼介', '大和', '悠生', '朝陽', '優真',
  '結斗', '陽太', '仁', '晴登', '湊斗', '奏太', '颯真', '晴翔', '大樹', '賢人',
  '瑛太', '雄大', '翔大', '琉偉', '陸斗', '陽大', '康平', '拓海', '凌平', '隼人',
  '航大', '遼', '祐樹', '啓太', '真尋', '太一', '直樹', '友也', '大輝', '雅也',
  '一樹', '将大', '慎太郎', '宗介', '瑛斗', '陽仁', '創太', '暖', '歩夢', '琉希'
];

// =========================================================================
// 海外選手：国別リアル名プール
// =========================================================================
const GLOBAL_NAME_POOLS: Record<string, { firstNames: string[]; lastNames: string[] }> = {
  'イングランド': {
    firstNames: ['Oliver', 'George', 'Harry', 'Jack', 'Leo', 'Charlie', 'Archie', 'Ethan', 'Liam', 'Jude', 'Cole', 'Kobbie', 'Harvey', 'Reece', 'Mason', 'Declan', 'Bukayo', 'Phil', 'Lewis', 'Elliot'],
    lastNames: ['Smith', 'Jones', 'Taylor', 'Brown', 'Davies', 'Wilson', 'Evans', 'Walker', 'Palmer', 'Mainoo', 'Bellingham', 'Rice', 'Gallagher', 'Gray', 'White', 'Lewis', 'Hall', 'Moore', 'Colwill']
  },
  'スペイン': {
    firstNames: ['Mateo', 'Hugo', 'Lucas', 'Martín', 'Daniel', 'Pablo', 'Alejandro', 'Pau', 'Marc', 'Lamine', 'Gavi', 'Fermín', 'Nico', 'Brahim', 'Pedri', 'Álex', 'Ferran', 'Yeremy', 'Samu'],
    lastNames: ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Cubarsí', 'Yamal', 'Navarro', 'Romero', 'Williams', 'Torres', 'Baena', 'Barrios']
  },
  'ドイツ': {
    firstNames: ['Noah', 'Luca', 'Leon', 'Felix', 'Jonas', 'Florian', 'Lennart', 'Maximilian', 'Paul', 'Aleksandar', 'Jan', 'Moritz', 'Elias', 'Karim', 'Brajan', 'Assan', 'Rocco'],
    lastNames: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Wirtz', 'Pavlović', 'Schulz', 'Koch', 'Bauer', 'Adeyemi', 'Gruda', 'Ouédraogo', 'Reitz']
  },
  'フランス': {
    firstNames: ['Gabriel', 'Léo', 'Arthur', 'Louis', 'Jules', 'Maël', 'Warren', 'Désiré', 'Bradley', 'Mathys', 'Kylian', 'Rayan', 'Leny', 'Malo', 'Eli', 'Ayyoub', 'Guillaume'],
    lastNames: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit', 'Zaïre-Emery', 'Doué', 'Barcola', 'Tel', 'Yoro', 'Cherki', 'Camavinga', 'Gusto', 'Kroupi', 'Bouaddi', 'Akliouche']
  },
  'イタリア': {
    firstNames: ['Leonardo', 'Francesco', 'Alessandro', 'Lorenzo', 'Mattia', 'Riccardo', 'Tommaso', 'Federico', 'Simone', 'Giorgio', 'Niccolò', 'Cesare', 'Francesco', 'Samuele'],
    lastNames: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Scalvini', 'Pafundi', 'Baldanzi', 'Miretti', 'Casadei', 'Camarda', 'Pisilli']
  },
  'ブラジル': {
    firstNames: ['Gabriel', 'Arthur', 'Bernardo', 'Heitor', 'Davi', 'Pedro', 'Lucas', 'Matheus', 'Endrick', 'Estêvão', 'Vitor', 'Luiz', 'Kaiky', 'Lorran', 'Rayan', 'Kauã'],
    lastNames: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Roque', 'Willian', 'Carvalho', 'Nascimento', 'Gomes', 'Ribeiro']
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
  // Determine nationality: 80% local country, 20% foreign talent
  const isJapanClub = clubCountry === '日本';
  const pickLocal = Math.random() < 0.80;

  let nationality = clubCountry;
  let name = '';

  if (isJapanClub) {
    if (pickLocal) {
      nationality = '日本';
      const last = JA_LAST_NAMES[Math.floor(Math.random() * JA_LAST_NAMES.length)];
      const first = JA_FIRST_NAMES[Math.floor(Math.random() * JA_FIRST_NAMES.length)];
      name = `${last} ${first}`;
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
