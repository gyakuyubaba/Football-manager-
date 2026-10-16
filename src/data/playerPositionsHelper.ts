import { Position, Player, PlayStyle } from '../types/game';

// Known real-world versatility registry for famous players
const FAMOUS_PLAYERS_VERSATILITY: Record<string, Position[]> = {
  // --- Japanese Stars ---
  '久保 建英': ['LW', 'CAM', 'CF', 'RM'],
  '三笘 薫': ['LM', 'RW', 'CAM'],
  '遠藤 航': ['CM', 'CB'],
  '佐野 海舟': ['CM', 'CB', 'RB'],
  '大迫 勇也': ['CF', 'CAM'],
  '武藤 嘉紀': ['ST', 'LW', 'RM', 'CF'],
  '酒井 高徳': ['LB', 'RWB', 'LWB', 'CDM'],
  '初瀬 亮': ['LWB', 'LM', 'RB'],
  '伊藤 洋輝': ['LB', 'LWB'],
  '冨安 健洋': ['RB', 'LB', 'CB'],
  '前田 大然': ['ST', 'CF', 'RW'],
  '伊東 純也': ['RM', 'LW', 'RWB'],
  '堂安 律': ['CAM', 'RM', 'LW'],
  '南野 拓実': ['LW', 'ST', 'CF', 'RW'],
  '鎌田 大地': ['CM', 'CF', 'LW'],
  '守田 英正': ['CDM', 'CAM'],
  '田中 碧': ['CDM', 'CAM'],
  '旗手 怜央': ['CAM', 'LB', 'LW'],
  '中村 敬斗': ['LM', 'ST', 'RW'],
  '小川 航基': ['CF'],
  '上田 綺世': ['CF'],
  '相馬 勇紀': ['RW', 'LM', 'LWB'],
  '細谷 真大': ['CF', 'RW'],
  '渡辺 皓太': ['CDM', 'CAM'],
  '喜田 拓也': ['CM'],
  'アンデルソン・ロペス': ['CF', 'RW'],
  'エウベル': ['RW', 'LM', 'CF'],
  'ヤン・マテウス': ['LW', 'RM'],
  'エドゥアルド': ['LB'],
  '畠中 槙之輔': ['CDM'],
  '谷口 彰悟': ['CDM'],
  '中山 雄太': ['CB', 'LWB'],
  '町田 浩樹': ['LB'],
  '渡辺 剛': ['RB'],
  '毎熊 晟矢': ['RWB', 'RM', 'RW'],
  '菅原 由勢': ['RWB', 'RM', 'RW'],
  '佐々木 大樹': ['CAM', 'CM', 'CF', 'LW'],
  '井手口 陽介': ['CDM', 'CAM'],
  '扇原 貴宏': ['CB', 'CM'],
  '宮代 大聖': ['CF', 'LW', 'RW', 'CAM'],
  '家長 昭博': ['RW', 'CAM', 'RM'],
  '脇坂 泰斗': ['CAM', 'CM', 'LW'],
  'マテウス・サヴィオ': ['CAM', 'LW', 'RW', 'CM'],

  // --- European Elite Stars ---
  'Bukayo Saka': ['RM', 'LW', 'RWB'],
  'Martin Ødegaard': ['CM', 'RW'],
  'Martin Odegaard': ['CM', 'RW'],
  'Declan Rice': ['CM', 'CB'],
  'William Saliba': ['RB'],
  'Gabriel Magalhães': ['LB'],
  'Kai Havertz': ['CF', 'CAM', 'RW'],
  'Leandro Trossard': ['CF', 'ST', 'CAM', 'RW'],
  'Gabriel Martinelli': ['ST', 'RW'],
  'Rodri': ['CM', 'CB'],
  'Kevin De Bruyne': ['CM', 'RW', 'CAM'],
  'Erling Haaland': ['CF'],
  'Phil Foden': ['RW', 'LW', 'CM', 'CAM'],
  'Bernardo Silva': ['RW', 'CAM', 'RM', 'CM'],
  'Mohamed Salah': ['ST', 'CF', 'RM'],
  'Trent Alexander-Arnold': ['RWB', 'CM', 'CDM'],
  'Jude Bellingham': ['CM', 'CF', 'ST'],
  'Vinícius Júnior': ['ST', 'CF', 'RW'],
  'Vinicius Junior': ['ST', 'CF', 'RW'],
  'Kylian Mbappé': ['LW', 'CF'],
  'Kylian Mbappe': ['LW', 'CF'],
  'Federico Valverde': ['RW', 'RM', 'RB'],
  'Eduardo Camavinga': ['CM', 'LB', 'LWB'],
  'Aurélien Tchouaméni': ['CM', 'CB'],
  'Aurelien Tchouameni': ['CM', 'CB'],
  'Dani Carvajal': ['RWB', 'CB'],
  'Lamine Yamal': ['RM', 'LW', 'CAM'],
  'Pedri': ['CAM', 'LW'],
  'Gavi': ['CAM', 'LW', 'CDM'],
  'Robert Lewandowski': ['CF'],
  'Raphinha': ['RW', 'CAM', 'LM'],
  'Jules Koundé': ['CB', 'RWB'],
  'Jules Kounde': ['CB', 'RWB'],
  'Alejandro Balde': ['LWB', 'LM'],
  'Jamal Musiala': ['LW', 'CM', 'RW'],
  'Florian Wirtz': ['LW', 'RW', 'CM'],
  'Harry Kane': ['CF', 'CAM'],
  'Joshua Kimmich': ['RB', 'CM', 'RWB'],
  'Alphonso Davies': ['LWB', 'LM', 'LW'],
  'Son Heung-min': ['CF', 'LW', 'RW', 'ST'],
  'Cole Palmer': ['CAM', 'RW', 'RM', 'CF']
};

/**
 * Procedurally derive realistic alternative positions based on player attributes, position, foot, and playstyle
 */
export function deriveRealisticAltPositions(
  position: Position,
  preferredFoot: '右' | '左' | '両足' = '右',
  playstyle?: PlayStyle,
  playerName?: string
): Position[] {
  // 1. Check known stars dictionary first
  if (playerName) {
    for (const [key, alts] of Object.entries(FAMOUS_PLAYERS_VERSATILITY)) {
      if (playerName.includes(key) || key.includes(playerName)) {
        return alts.filter(p => p !== position);
      }
    }
  }

  // 2. Procedural realistic positions based on tactical archetype
  const alts: Position[] = [];

  switch (position) {
    case 'GK':
      return []; // Goalkeepers only play GK

    case 'CB':
      // Center backs frequently cover full-back or defensive midfield
      if (preferredFoot === '左') {
        alts.push('LB');
        if (playstyle === 'ボール運べるCB' || playstyle === 'アンカー') {
          alts.push('CDM');
        }
      } else {
        if (playstyle === 'ボール運べるCB' || playstyle === 'アンカー') {
          alts.push('CDM', 'RB');
        } else {
          alts.push('RB', 'CDM');
        }
      }
      break;

    case 'LB':
      // Left backs naturally play Left Wing Back and Left Midfield
      alts.push('LWB');
      if (playstyle === '守備的SB' || playstyle === 'ボール運べるCB') {
        alts.push('CB');
      } else {
        alts.push('LM');
        if (preferredFoot === '右' || preferredFoot === '両足') {
          alts.push('RB');
        }
      }
      break;

    case 'RB':
      // Right backs naturally play Right Wing Back and Right Midfield
      alts.push('RWB');
      if (playstyle === '守備的SB' || playstyle === 'ボール運べるCB') {
        alts.push('CB');
      } else {
        alts.push('RM');
        if (preferredFoot === '左' || preferredFoot === '両足') {
          alts.push('LB');
        }
      }
      break;

    case 'LWB':
      alts.push('LB', 'LM', 'LW');
      break;

    case 'RWB':
      alts.push('RB', 'RM', 'RW');
      break;

    case 'CDM':
      alts.push('CM');
      if (playstyle === 'アンカー' || playstyle === 'ボール運べるCB') {
        alts.push('CB');
      } else {
        alts.push('CAM');
      }
      break;

    case 'CM':
      alts.push('CDM', 'CAM');
      if (playstyle === 'ボックストゥボックス') {
        alts.push('LM', 'RM');
      }
      break;

    case 'CAM':
      alts.push('CM', 'CF');
      if (playstyle === 'チャンスメイカー') {
        alts.push('LW', 'RW');
      } else if (playstyle === 'ゴールゲッター' || playstyle === 'シャドーストライカー') {
        alts.push('ST');
      }
      break;

    case 'LM':
      alts.push('LW', 'LWB', 'CM');
      if (preferredFoot === '右' || preferredFoot === '両足') {
        alts.push('RM');
      }
      break;

    case 'RM':
      alts.push('RW', 'RWB', 'CM');
      if (preferredFoot === '左' || preferredFoot === '両足') {
        alts.push('LM');
      }
      break;

    case 'LW':
      // Modern wingers are highly versatile across flanks and attack
      alts.push('RW', 'LM', 'CF');
      if (playstyle === 'ゴールゲッター' || playstyle === 'ラインブレイカー') {
        alts.push('ST');
      } else {
        alts.push('CAM');
      }
      break;

    case 'RW':
      alts.push('LW', 'RM', 'CAM');
      if (playstyle === 'ゴールゲッター' || playstyle === 'ラインブレイカー') {
        alts.push('ST');
      } else {
        alts.push('CF');
      }
      break;

    case 'CF':
      alts.push('ST', 'CAM', 'LW', 'RW');
      break;

    case 'ST':
      alts.push('CF');
      if (playstyle === '俊足ドリブラー' || playstyle === 'スピードスター' || playstyle === 'ラインブレイカー') {
        alts.push('LW', 'RW');
      } else if (playstyle === 'チャンスメイカー' || playstyle === 'シャドーストライカー') {
        alts.push('CAM');
      }
      break;
  }

  // Remove own position and duplicates
  return Array.from(new Set(alts)).filter(p => p !== position);
}

export interface PlayablePositionGrade {
  position: Position;
  grade: 'S' | 'A' | 'B';
  symbol: '◎' | '○' | '△';
  label: string;
  category: '本職' | 'サブ適性' | '類似・起用可能';
}

/**
 * Returns all playable positions for a player with football-realistic grades
 */
export function getPlayablePositionsWithGrades(player: Player): PlayablePositionGrade[] {
  const result: PlayablePositionGrade[] = [];

  // 1. Primary position (◎ 本職 - Grade S)
  result.push({
    position: player.position,
    grade: 'S',
    symbol: '◎',
    label: '本職・最高適性 (100%)',
    category: '本職'
  });

  // 2. Alternative positions (○ サブ適性 - Grade A)
  const alts = (player.altPositions && player.altPositions.length > 0)
    ? player.altPositions
    : deriveRealisticAltPositions(player.position, player.preferredFoot, player.playstyle, player.name);

  alts.forEach(pos => {
    if (pos !== player.position && !result.some(r => r.position === pos)) {
      result.push({
        position: pos,
        grade: 'A',
        symbol: '○',
        label: 'サブ適性・高い適応力 (96~98%)',
        category: 'サブ適性'
      });
    }
  });

  // 3. Closely related compatible roles (△ 類似・起用可能 - Grade B)
  const relatedRoles: Record<Position, Position[]> = {
    GK: [],
    CB: ['LB', 'RB', 'CDM'],
    LB: ['LWB', 'LM', 'CB'],
    RB: ['RWB', 'RM', 'CB'],
    LWB: ['LB', 'LM', 'LW'],
    RWB: ['RB', 'RM', 'RW'],
    CDM: ['CM', 'CB'],
    CM: ['CDM', 'CAM', 'LM', 'RM'],
    CAM: ['CM', 'ST', 'CF', 'LW', 'RW'],
    LM: ['LW', 'LWB', 'CM'],
    RM: ['RW', 'RWB', 'CM'],
    LW: ['LM', 'RW', 'ST', 'CAM'],
    RW: ['RM', 'LW', 'ST', 'CAM'],
    CF: ['ST', 'CAM', 'LW', 'RW'],
    ST: ['CF', 'CAM', 'LW', 'RW']
  };

  const compatibles = relatedRoles[player.position] || [];
  compatibles.forEach(pos => {
    if (!result.some(r => r.position === pos)) {
      result.push({
        position: pos,
        grade: 'B',
        symbol: '△',
        label: '類似ポジション・戦術的起用可 (90~94%)',
        category: '類似・起用可能'
      });
    }
  });

  return result;
}

/**
 * Ensures player object has realistic altPositions array
 */
export function ensurePlayerRealisticAltPositions(player: Player): Player {
  if (player.altPositions && player.altPositions.length > 0) {
    return player;
  }
  const derived = deriveRealisticAltPositions(player.position, player.preferredFoot, player.playstyle, player.name);
  return {
    ...player,
    altPositions: derived
  };
}
