import { MatchFixture, MatchEvent, MatchStats, TeamTactics, Player, Club, PlayerCondition } from '../types/game';
import { addDays } from './dateEngine';

// Condition multiplier for calculations
export const CONDITION_MULTIPLIER: Record<PlayerCondition, number> = {
  pink: 1.08,    // 絶好調 (+8%)
  red: 1.04,     // 好調 (+4%)
  yellow: 1.00,  // 普通 (0%)
  cyan: 0.96,    // 不調 (-4%)
  purple: 0.92   // 絶不調 (-8%)
};

// -------------------------------------------------------------
// 【1. FINAL_MATCH_ELIGIBILITY_CHECK (試合直前・出場資格チェック)】
// -------------------------------------------------------------
export interface MatchEligibilityCheckResult {
  isEligible: boolean;
  errors: string[];
  ineligibleStarters: { player: Player; reason: string; badge: string }[];
  ineligibleBench: { player: Player; reason: string; badge: string }[];
  ineligibleAll: { player: Player; reason: string; badge: string; role: 'STARTER' | 'BENCH' }[];
  ineligiblePlayerIds: string[];
}

export function finalMatchEligibilityCheck(
  starters: string[],
  bench: string[],
  clubId: string,
  players: Record<string, Player>,
  currentDate?: string
): MatchEligibilityCheckResult {
  const errors: string[] = [];
  const ineligibleStarters: { player: Player; reason: string; badge: string }[] = [];
  const ineligibleBench: { player: Player; reason: string; badge: string }[] = [];
  const ineligibleAll: { player: Player; reason: string; badge: string; role: 'STARTER' | 'BENCH' }[] = [];
  const ineligiblePlayerIds: string[] = [];

  // Check Starters
  starters.forEach(pId => {
    const p = players[pId];
    if (!p) {
      errors.push(`未登録の選手ID (${pId}) がスタメンに含まれています。`);
      ineligiblePlayerIds.push(pId);
      return;
    }

    if (p.clubId !== clubId) {
      const reason = `他クラブ所属 (${p.clubId})`;
      const badge = '【所属外】';
      errors.push(`【所属不一致】${p.name}選手は他クラブ所属のため出場できません。`);
      ineligibleStarters.push({ player: p, reason, badge });
      ineligibleAll.push({ player: p, reason, badge, role: 'STARTER' });
      ineligiblePlayerIds.push(pId);
      return;
    }

    const isInjured = p.injuryStatus === 'INJURED' || p.injury?.isInjured;
    const isBeforeReturnDate = currentDate && p.injuryReturnDate && p.injuryReturnDate > currentDate;

    if (isInjured || isBeforeReturnDate) {
      const returnDateStr = p.injuryReturnDate || p.injury?.returnDate || '診断中';
      const reason = `負傷中 (${p.injuryType || p.injury?.type || '負傷'} / 復帰予定: ${returnDateStr})`;
      const badge = '【負傷】';
      errors.push(`【負傷離脱中】${p.name}選手は現在負傷中のため、この試合には出場できません。(復帰予定: ${returnDateStr})`);
      ineligibleStarters.push({ player: p, reason, badge });
      ineligibleAll.push({ player: p, reason, badge, role: 'STARTER' });
      ineligiblePlayerIds.push(pId);
      return;
    }

    if (p.suspension?.isSuspended || (p.suspension?.matchesRemaining || 0) > 0) {
      const reason = `出場停止処分中 (残${p.suspension.matchesRemaining}試合)`;
      const badge = '【出場停止】';
      errors.push(`【出場停止中】${p.name}選手は出場停止処分中のため出場できません。`);
      ineligibleStarters.push({ player: p, reason, badge });
      ineligibleAll.push({ player: p, reason, badge, role: 'STARTER' });
      ineligiblePlayerIds.push(pId);
      return;
    }

    if (p.squadStatus === 'OUT_OF_SQUAD') {
      const reason = 'ベンチ外登録';
      const badge = '【登録外】';
      errors.push(`【ベンチ外登録】${p.name}選手はベンチ外に設定されているため出場できません。`);
      ineligibleStarters.push({ player: p, reason, badge });
      ineligibleAll.push({ player: p, reason, badge, role: 'STARTER' });
      ineligiblePlayerIds.push(pId);
    }
  });

  // Check Bench (max 9 limit & healthy check)
  if (bench.length > 9) {
    errors.push(`ベンチ登録人数が上限（最大9名）を超えています（現在${bench.length}名）。`);
  }

  bench.forEach(pId => {
    const p = players[pId];
    if (!p) return;

    if (p.clubId !== clubId) {
      const reason = `他クラブ所属 (${p.clubId})`;
      const badge = '【所属外】';
      errors.push(`【所属不一致】ベンチの${p.name}選手は他クラブ所属のため登録できません。`);
      ineligibleBench.push({ player: p, reason, badge });
      ineligibleAll.push({ player: p, reason, badge, role: 'BENCH' });
      ineligiblePlayerIds.push(pId);
      return;
    }

    const isInjured = p.injuryStatus === 'INJURED' || p.injury?.isInjured;
    const isBeforeReturnDate = currentDate && p.injuryReturnDate && p.injuryReturnDate > currentDate;

    if (isInjured || isBeforeReturnDate) {
      const returnDateStr = p.injuryReturnDate || p.injury?.returnDate || '診断中';
      const reason = `負傷中 (${p.injuryType || p.injury?.type || '負傷'} / 復帰予定: ${returnDateStr})`;
      const badge = '【負傷】';
      errors.push(`【ベンチ負傷警告】${p.name}選手は負傷中のためベンチ登録できません。(復帰予定: ${returnDateStr})`);
      ineligibleBench.push({ player: p, reason, badge });
      ineligibleAll.push({ player: p, reason, badge, role: 'BENCH' });
      ineligiblePlayerIds.push(pId);
      return;
    }

    if (p.suspension?.isSuspended || (p.suspension?.matchesRemaining || 0) > 0) {
      const reason = `出場停止中 (残${p.suspension.matchesRemaining}試合)`;
      const badge = '【出場停止】';
      errors.push(`【ベンチ停止警告】${p.name}選手は出場停止処分中のためベンチ登録できません。`);
      ineligibleBench.push({ player: p, reason, badge });
      ineligibleAll.push({ player: p, reason, badge, role: 'BENCH' });
      ineligiblePlayerIds.push(pId);
    }
  });

  return {
    isEligible: errors.length === 0,
    errors,
    ineligibleStarters,
    ineligibleBench,
    ineligibleAll,
    ineligiblePlayerIds
  };
}

// Effective player power calculation
export function calculateEffectivePlayerPower(player: Player): number {
  if (player.injuryStatus === 'INJURED' || player.injury?.isInjured || player.suspension?.isSuspended) {
    return 0;
  }
  const condMult = CONDITION_MULTIPLIER[player.condition] || 1.0;
  const fatiguePenalty = Math.max(0.72, 1 - (player.fatigue / 250));
  return player.ovr * condMult * fatiguePenalty;
}

// -------------------------------------------------------------
// 【2. 疲労に応じた怪我リスク計算 (FATIGUE INJURY RISK SYSTEM)】
// -------------------------------------------------------------
export function calculatePlayerInjuryRisk(
  player: Player,
  minute: number,
  pressIntensity: string,
  isCongestedSchedule: boolean = false
): number {
  // If already injured or suspended, skip
  if (player.injuryStatus === 'INJURED' || player.injury?.isInjured) return 0;

  // Base risk tier by fatigue (Requirement 2)
  let baseRisk = 0.0006;
  if (player.fatigue <= 30) {
    baseRisk = 0.0006; // 通常 (0~30)
  } else if (player.fatigue <= 50) {
    baseRisk = 0.0014; // 少し上昇 (31~50)
  } else if (player.fatigue <= 70) {
    baseRisk = 0.0032; // 明確に上昇 (51~70)
  } else if (player.fatigue <= 85) {
    baseRisk = 0.0068; // 高い (71~85)
  } else {
    baseRisk = 0.0135; // 非常に高い (86~100)
  }

  let multiplier = 1.0;

  // Age factor (>31 elevated, >34 significantly elevated)
  if (player.age >= 34) {
    multiplier *= 1.35;
  } else if (player.age >= 31) {
    multiplier *= 1.20;
  }

  // Tactical press factor
  if (pressIntensity === '非常に激しい' || pressIntensity === 'ゲーゲンプレス') {
    multiplier *= 1.30;
  }

  // Match minute factor (muscular fatigue ramps after 70')
  if (minute >= 75) {
    multiplier *= 1.35;
  } else if (minute >= 60) {
    multiplier *= 1.15;
  }

  // Congested schedule factor
  if (isCongestedSchedule) {
    multiplier *= 1.25;
  }

  // Sane ceiling to prevent ridiculous mass injuries
  return Math.min(0.025, baseRisk * multiplier);
}

// Authentic injury types and recovery ranges
export const INJURY_VARIETIES = [
  { name: '右足首捻挫', days: 12 },
  { name: '左足首捻挫', days: 14 },
  { name: 'ハムストリング肉離れ (軽度)', days: 18 },
  { name: 'ハムストリング肉離れ (中度)', days: 28 },
  { name: 'ふくらはぎ筋膜炎', days: 10 },
  { name: '大腿四頭筋肉離れ', days: 21 },
  { name: '内転筋損傷', days: 16 },
  { name: '膝内側側副靭帯損傷', days: 35 },
  { name: '右足甲打撲', days: 7 },
  { name: '肩鎖関節脱臼', days: 24 }
];

// Commentary pools
const GOAL_COMMENTARIES = [
  (s: string, a?: string) => `【GOAL!!】${s}がディフェンスラインの裏へ抜け出し、冷静にGKの脇を抜く技ありゴール！${a ? ` (${a}の見事なスルーパス)` : ''}`,
  (s: string, a?: string) => `【GOAL!!】右サイドからの鋭いクロスに${s}が完璧なタイミングでヘディングを叩き込む！${a ? ` (アシスト: ${a})` : ''}`,
  (s: string, a?: string) => `【GOAL!!】混戦のペナルティエリアから${s}が電光石火の反転シュート！ネットを揺らす！${a ? ` (ラストパス: ${a})` : ''}`,
  (s: string) => `【GOAL!!】${s}がペナルティエリア外から放った強烈なミドルシュートがゴール左上隅へ突き刺さるゴラッソ！`,
  (s: string, a?: string) => `【GOAL!!】素早いカウンターが炸裂！${s}がダイレクトボレーでフィニッシュ！${a ? ` (${a}の絶妙クロス)` : ''}`,
  (s: string, a?: string) => `【GOAL!!】CKから${s}がマークを外して打点の高いヘディングシュート！ゴールネットを揺らす！${a ? ` (キッカー: ${a})` : ''}`
];

const WOODWORK_COMMENTARIES = [
  (p: string) => `【決定機逸】${p}がペナルティエリア中央から強烈なシュートを放つも、惜しくもクロスバー直撃！`,
  (p: string) => `【ポスト直撃！】${p}が左足を振り抜くが、ボールは左ポストを叩いて跳ね返る！スタジアムがどよめく！`,
  (p: string) => `【惜しいシュート】${p}のミドルシュートが右ポストをかすめて枠外へ。決定的なチャンスでした。`
];

const SAVE_COMMENTARIES = [
  (gk: string, shooter: string) => `【ファインセーブ！】${shooter}の決定的なシュートを相手守護神${gk}が驚異的な反応で横っ飛びセーブ！`,
  (gk: string, shooter: string) => `【ビッグセーブ！】1対1の絶体絶命のピンチを${gk}が足一本で防ぎ切る！`,
  (gk: string, shooter: string) => `【スーパーセーブ】至近距離からの${shooter}のヘディングシュートを${gk}が右手一本でバーの上へ弾き出す！`
];

// -------------------------------------------------------------
// 【3 & 4. 試合シミュレーションエンジン (0-0過多解消 & 時間帯展開)】
// -------------------------------------------------------------
export function simulateFullMatch(
  fixture: MatchFixture,
  homeClub: Club,
  awayClub: Club,
  homeTactics: TeamTactics,
  awayTactics: TeamTactics,
  playersRegistry: Record<string, Player>
): {
  fixture: MatchFixture;
  updatedPlayers: Record<string, Player>;
} {
  const events: MatchEvent[] = [];
  const updatedPlayers = { ...playersRegistry };

  // Sanitize on-pitch starters (filter out any injured, suspended, or invalid club membership)
  const sanitizeStarters = (club: Club, tactics: TeamTactics): string[] => {
    const rawStarters = tactics.lineup.starters.map(s => s.playerId);
    const valid: string[] = [];
    const clubPlayerIds = club.playerIds || [];

    rawStarters.forEach(pId => {
      const p = updatedPlayers[pId];
      if (p && p.injuryStatus !== 'INJURED' && !p.injury?.isInjured && !p.suspension?.isSuspended && p.clubId === club.id) {
        valid.push(pId);
      }
    });

    if (valid.length < 11) {
      for (const pId of clubPlayerIds) {
        if (valid.length >= 11) break;
        if (!valid.includes(pId)) {
          const p = updatedPlayers[pId];
          if (p && p.injuryStatus !== 'INJURED' && !p.injury?.isInjured && !p.suspension?.isSuspended) {
            valid.push(pId);
          }
        }
      }
    }

    return valid;
  };

  let homePitchPlayers = sanitizeStarters(homeClub, homeTactics);
  let awayPitchPlayers = sanitizeStarters(awayClub, awayTactics);

  const homeStartersList = homePitchPlayers.map(id => updatedPlayers[id]).filter(Boolean);
  const awayStartersList = awayPitchPlayers.map(id => updatedPlayers[id]).filter(Boolean);

  // Compute attack and defense ratings
  const getSubRating = (list: Player[], positions: string[], fallback: number): number => {
    const filtered = list.filter(p => positions.includes(p.position));
    if (filtered.length === 0) return fallback;
    return filtered.reduce((acc, p) => acc + calculateEffectivePlayerPower(p), 0) / filtered.length;
  };

  const homeFWPower = getSubRating(homeStartersList, ['ST', 'CF', 'RW', 'LW'], 72);
  const homeMFPower = getSubRating(homeStartersList, ['CAM', 'CM', 'CDM', 'RM', 'LM'], 72);
  const homeDFPower = getSubRating(homeStartersList, ['CB', 'RB', 'LB'], 72);
  const homeGKPower = homeStartersList.find(p => p.position === 'GK')?.ovr || 72;

  const awayFWPower = getSubRating(awayStartersList, ['ST', 'CF', 'RW', 'LW'], 72);
  const awayMFPower = getSubRating(awayStartersList, ['CAM', 'CM', 'CDM', 'RM', 'LM'], 72);
  const awayDFPower = getSubRating(awayStartersList, ['CB', 'RB', 'LB'], 72);
  const awayGKPower = awayStartersList.find(p => p.position === 'GK')?.ovr || 72;

  // Home advantage (+8% home power)
  const homeAttack = (homeFWPower * 0.55 + homeMFPower * 0.45) * 1.08;
  const awayDefense = awayDFPower * 0.65 + awayGKPower * 0.35;

  const awayAttack = awayFWPower * 0.55 + awayMFPower * 0.45;
  const homeDefense = (homeDFPower * 0.65 + homeGKPower * 0.35) * 1.04;

  let homeScore = 0;
  let awayScore = 0;
  let homeShots = 0;
  let awayShots = 0;
  let homeShotsOnTarget = 0;
  let awayShotsOnTarget = 0;
  let homeCorners = 0;
  let awayCorners = 0;
  let homeFouls = 0;
  let awayFouls = 0;

  const yellowCardCounts: Record<string, number> = {};
  const playerRatings: Record<string, number> = {};
  [...homeStartersList, ...awayStartersList].forEach(p => {
    playerRatings[p.id] = 6.0 + (Math.random() * 0.6);
  });

  // -------------------------------------------------------------
  // Dynamic Simulation across 22 paced match phases (every 4-5 mins)
  // -------------------------------------------------------------
  const timePhases = [
    { min: 4, phase: 'probing' },
    { min: 8, phase: 'probing' },
    { min: 14, phase: 'probing' },
    { min: 19, phase: 'ramp_up' },
    { min: 24, phase: 'ramp_up' },
    { min: 29, phase: 'ramp_up' },
    { min: 34, phase: 'late_first' },
    { min: 39, phase: 'late_first' },
    { min: 44, phase: 'late_first' },
    { min: 49, phase: 'restart' },
    { min: 54, phase: 'restart' },
    { min: 59, phase: 'restart' },
    { min: 64, phase: 'subs_impact' },
    { min: 69, phase: 'subs_impact' },
    { min: 74, phase: 'subs_impact' },
    { min: 78, phase: 'high_risk' },
    { min: 82, phase: 'high_risk' },
    { min: 86, phase: 'high_risk' },
    { min: 89, phase: 'high_risk' },
    { min: 92, phase: 'stoppage' }
  ];

  timePhases.forEach(({ min, phase }) => {
    const jitter = Math.floor(Math.random() * 3) - 1;
    const eventMin = Math.max(1, Math.min(94, min + jitter));

    const currentHomePitch = homePitchPlayers.map(id => updatedPlayers[id]).filter(Boolean);
    const currentAwayPitch = awayPitchPlayers.map(id => updatedPlayers[id]).filter(Boolean);

    // Phase modifiers (Requirement 4)
    let phaseChanceMultiplier = 1.0;
    if (phase === 'probing') {
      phaseChanceMultiplier = 0.65; // 0-15m 様子見
    } else if (phase === 'ramp_up') {
      phaseChanceMultiplier = 0.95; // 15-30m チャンス増加
    } else if (phase === 'late_first') {
      phaseChanceMultiplier = 1.15; // 30-45m 疲労・前半終了間際
    } else if (phase === 'restart') {
      phaseChanceMultiplier = 0.85; // 45-60m ハーフタイム後立て直し
    } else if (phase === 'subs_impact') {
      phaseChanceMultiplier = 1.10; // 60-75m 交代による活性化
    } else if (phase === 'high_risk' || phase === 'stoppage') {
      phaseChanceMultiplier = 1.35; // 75-90m+ 疲労蓄積・リスク冒して前がかり
    }

    // Trailing team tactical desperation (behind teams push forward)
    let homeTrailingBonus = 1.0;
    let awayTrailingBonus = 1.0;
    if (eventMin >= 60) {
      if (homeScore < awayScore) homeTrailingBonus = 1.25;
      if (awayScore < homeScore) awayTrailingBonus = 1.25;
    }

    // --- HOME ATTACK ATTEMPT ---
    const homeAttackRatio = Math.max(0.70, Math.min(1.4, homeAttack / Math.max(40, awayDefense)));
    const homeChanceThreshold = 0.42 * homeAttackRatio * phaseChanceMultiplier * homeTrailingBonus;

    if (Math.random() < homeChanceThreshold && currentHomePitch.length > 0) {
      homeShots++;
      const onTargetChance = 0.48 + (homeFWPower - awayGKPower) * 0.005;
      const onTarget = Math.random() < Math.max(0.32, Math.min(0.68, onTargetChance));

      if (onTarget) {
        homeShotsOnTarget++;
        // Goal conversion probability (Requirement 3: realistic goal distribution)
        const conversionChance = 0.38 + (homeFWPower - awayGKPower) * 0.006;
        const isGoal = Math.random() < Math.max(0.24, Math.min(0.55, conversionChance));

        if (isGoal) {
          homeScore++;

          // Weighted Scorer Selection (Requirement 5: ST/Winger/MF/CB variety)
          const scorer = selectScorer(currentHomePitch.length > 0 ? currentHomePitch : homeStartersList, homeTactics);
          const assister = selectAssister(currentHomePitch.length > 0 ? currentHomePitch : homeStartersList, scorer.id);

          const commentaryFn = GOAL_COMMENTARIES[Math.floor(Math.random() * GOAL_COMMENTARIES.length)];
          events.push({
            minute: eventMin,
            type: 'goal',
            clubId: homeClub.id,
            playerId: scorer.id,
            playerName: scorer.name,
            assistPlayerId: assister?.id,
            assistPlayerName: assister?.name,
            description: commentaryFn(scorer.name, assister?.name)
          });

          playerRatings[scorer.id] = Math.min(9.9, (playerRatings[scorer.id] || 6.0) + 1.2);
          if (assister) playerRatings[assister.id] = Math.min(9.5, (playerRatings[assister.id] || 6.0) + 0.6);
        } else {
          // Goalkeeper Save
          const awayGK = currentAwayPitch.find(p => p.position === 'GK') || currentAwayPitch[0] || awayStartersList[0];
          const shooter = currentHomePitch[Math.floor(Math.random() * currentHomePitch.length)] || homeStartersList[0];
          if (awayGK && shooter) {
            const saveFn = SAVE_COMMENTARIES[Math.floor(Math.random() * SAVE_COMMENTARIES.length)];
            events.push({
              minute: eventMin,
              type: 'save',
              clubId: awayClub.id,
              playerId: awayGK.id,
              playerName: awayGK.name,
              description: saveFn(awayGK.name, shooter.name)
            });
            homeCorners++;
            playerRatings[awayGK.id] = Math.min(9.2, (playerRatings[awayGK.id] || 6.0) + 0.4);
          }
        }
      } else {
        if (Math.random() < 0.12) {
          const shooter = currentHomePitch[Math.floor(Math.random() * currentHomePitch.length)] || homeStartersList[0];
          if (shooter) {
            const woodFn = WOODWORK_COMMENTARIES[Math.floor(Math.random() * WOODWORK_COMMENTARIES.length)];
            events.push({
              minute: eventMin,
              type: 'woodwork',
              clubId: homeClub.id,
              playerId: shooter.id,
              playerName: shooter.name,
              description: woodFn(shooter.name)
            });
          }
        }
      }
    }

    // --- AWAY ATTACK ATTEMPT ---
    const awayAttackRatio = Math.max(0.70, Math.min(1.4, awayAttack / Math.max(40, homeDefense)));
    const awayChanceThreshold = 0.38 * awayAttackRatio * phaseChanceMultiplier * awayTrailingBonus;

    if (Math.random() < awayChanceThreshold && currentAwayPitch.length > 0) {
      awayShots++;
      const onTargetChance = 0.48 + (awayFWPower - homeGKPower) * 0.005;
      const onTarget = Math.random() < Math.max(0.32, Math.min(0.68, onTargetChance));

      if (onTarget) {
        awayShotsOnTarget++;
        const conversionChance = 0.36 + (awayFWPower - homeGKPower) * 0.006;
        const isGoal = Math.random() < Math.max(0.22, Math.min(0.52, conversionChance));

        if (isGoal) {
          awayScore++;

          const scorer = selectScorer(currentAwayPitch.length > 0 ? currentAwayPitch : awayStartersList, awayTactics);
          const assister = selectAssister(currentAwayPitch.length > 0 ? currentAwayPitch : awayStartersList, scorer.id);

          const commentaryFn = GOAL_COMMENTARIES[Math.floor(Math.random() * GOAL_COMMENTARIES.length)];
          events.push({
            minute: eventMin,
            type: 'goal',
            clubId: awayClub.id,
            playerId: scorer.id,
            playerName: scorer.name,
            assistPlayerId: assister?.id,
            assistPlayerName: assister?.name,
            description: commentaryFn(scorer.name, assister?.name)
          });

          playerRatings[scorer.id] = Math.min(9.9, (playerRatings[scorer.id] || 6.0) + 1.2);
          if (assister) playerRatings[assister.id] = Math.min(9.5, (playerRatings[assister.id] || 6.0) + 0.6);
        } else {
          // Goalkeeper Save
          const homeGK = currentHomePitch.find(p => p.position === 'GK') || currentHomePitch[0] || homeStartersList[0];
          const shooter = currentAwayPitch[Math.floor(Math.random() * currentAwayPitch.length)] || awayStartersList[0];
          if (homeGK && shooter) {
            const saveFn = SAVE_COMMENTARIES[Math.floor(Math.random() * SAVE_COMMENTARIES.length)];
            events.push({
              minute: eventMin,
              type: 'save',
              clubId: homeClub.id,
              playerId: homeGK.id,
              playerName: homeGK.name,
              description: saveFn(homeGK.name, shooter.name)
            });
            awayCorners++;
            playerRatings[homeGK.id] = Math.min(9.2, (playerRatings[homeGK.id] || 6.0) + 0.4);
          }
        }
      } else {
        if (Math.random() < 0.12) {
          const shooter = currentAwayPitch[Math.floor(Math.random() * currentAwayPitch.length)] || awayStartersList[0];
          if (shooter) {
            const woodFn = WOODWORK_COMMENTARIES[Math.floor(Math.random() * WOODWORK_COMMENTARIES.length)];
            events.push({
              minute: eventMin,
              type: 'woodwork',
              clubId: awayClub.id,
              playerId: shooter.id,
              playerName: shooter.name,
              description: woodFn(shooter.name)
            });
          }
        }
      }
    }

    // --- CARDS & FOULS (with second-yellow send off rule) ---
    if (Math.random() < 0.08) {
      const isHomeFoul = Math.random() < 0.5;
      const targetClub = isHomeFoul ? homeClub : awayClub;
      const targetPitch = isHomeFoul ? currentHomePitch : currentAwayPitch;

      if (isHomeFoul) homeFouls++; else awayFouls++;

      if (targetPitch.length > 0) {
        const offender = targetPitch[Math.floor(Math.random() * targetPitch.length)];
        const priorYellows = yellowCardCounts[offender.id] || 0;

        if (priorYellows === 1) {
          // 2nd Yellow -> Red Card
          yellowCardCounts[offender.id] = 2;
          events.push({
            minute: eventMin,
            type: 'second_yellow',
            clubId: targetClub.id,
            playerId: offender.id,
            playerName: offender.name,
            description: `【警告退場】${offender.name}が2枚目のイエローカードを受けて退場処分！チームは残り時間を10名で戦うことになります。`
          });

          if (isHomeFoul) {
            homePitchPlayers = homePitchPlayers.filter(id => id !== offender.id);
          } else {
            awayPitchPlayers = awayPitchPlayers.filter(id => id !== offender.id);
          }

          if (updatedPlayers[offender.id]) {
            updatedPlayers[offender.id].suspension = {
              isSuspended: true,
              matchesRemaining: 1,
              reason: '累積警告による退場'
            };
            updatedPlayers[offender.id].squadStatus = 'OUT_OF_SQUAD';
          }
        } else if (priorYellows === 0) {
          yellowCardCounts[offender.id] = 1;
          events.push({
            minute: eventMin,
            type: 'yellow_card',
            clubId: targetClub.id,
            playerId: offender.id,
            playerName: offender.name,
            description: `【警告】${offender.name}が無謀なタックルにより主審からイエローカードを提示されました。`
          });
        }
      }
    }

    // --- IN-MATCH INJURY RISK SYSTEM (Requirement 2 & 1) ---
    const allOnPitch = [...currentHomePitch, ...currentAwayPitch];
    for (const player of allOnPitch) {
      const isHome = currentHomePitch.some(p => p.id === player.id);
      const pressStyle = isHome ? homeTactics.instructions.pressIntensity : awayTactics.instructions.pressIntensity;
      const risk = calculatePlayerInjuryRisk(player, eventMin, pressStyle);

      if (Math.random() < risk) {
        const chosenInj = INJURY_VARIETIES[Math.floor(Math.random() * INJURY_VARIETIES.length)];
        const targetClub = isHome ? homeClub : awayClub;

        events.push({
          minute: eventMin,
          type: 'injury',
          clubId: targetClub.id,
          playerId: player.id,
          playerName: player.name,
          description: `【負傷発生】${player.name}がピッチ上で足を痛め倒れ込む。メディカルスタッフの初期診断：${chosenInj.name}（全治約${chosenInj.days}日・プレー続行不可）`
        });

        // Update player record immediately
        if (updatedPlayers[player.id]) {
          const returnDate = addDays(fixture.date, chosenInj.days);
          updatedPlayers[player.id].injuryStatus = 'INJURED';
          updatedPlayers[player.id].injuryStartDate = fixture.date;
          updatedPlayers[player.id].injuryReturnDate = returnDate;
          updatedPlayers[player.id].injuryType = chosenInj.name;
          updatedPlayers[player.id].injuryDaysRemaining = chosenInj.days;
          updatedPlayers[player.id].injury = {
            isInjured: true,
            type: chosenInj.name,
            recoveryDays: chosenInj.days,
            returnDate
          };
          updatedPlayers[player.id].squadStatus = 'OUT_OF_SQUAD';
        }

        // Sub player off the active pitch list
        if (isHome) {
          homePitchPlayers = homePitchPlayers.filter(id => id !== player.id);
        } else {
          awayPitchPlayers = awayPitchPlayers.filter(id => id !== player.id);
        }

        // Break to avoid multiple injuries in the same minute
        break;
      }
    }
  });

  // Sort events chronologically
  events.sort((a, b) => a.minute - b.minute);

  const homePossession = Math.min(72, Math.max(28, Math.round((homeAttack / (homeAttack + awayAttack)) * 100)));
  const homeXG = +(homeShotsOnTarget * 0.32 + (homeShots - homeShotsOnTarget) * 0.06).toFixed(2);
  const awayXG = +(awayShotsOnTarget * 0.30 + (awayShots - awayShotsOnTarget) * 0.06).toFixed(2);

  let bestRating = 0;
  let motmId = homeStartersList[0]?.id;
  Object.entries(playerRatings).forEach(([pId, rating]) => {
    if (rating > bestRating) {
      bestRating = rating;
      motmId = pId;
    }
  });

  // Fatigue accumulation & match stats updates for starters
  [...homeStartersList, ...awayStartersList].forEach(p => {
    const updated = updatedPlayers[p.id];
    if (updated) {
      // Natural fatigue accumulation (+14 to +20 depending on playing tempo)
      updated.fatigue = Math.min(100, updated.fatigue + 16);
      updated.stats.appearances += 1;
      updated.stats.starts += 1;
      updated.stats.minutes += 90;

      const scored = events.filter(e => e.type === 'goal' && e.playerId === p.id).length;
      const assisted = events.filter(e => e.type === 'goal' && e.assistPlayerId === p.id).length;
      updated.stats.goals += scored;
      updated.stats.assists += assisted;

      const currAvg = updated.stats.avgRating || 6.5;
      const currApps = updated.stats.appearances;
      const matchRating = playerRatings[p.id] || 6.5;
      updated.stats.avgRating = +( (currAvg * (currApps - 1) + matchRating) / currApps ).toFixed(2);

      if (p.position === 'GK' || ['CB', 'LB', 'RB'].includes(p.position)) {
        if (p.clubId === homeClub.id && awayScore === 0) updated.stats.cleanSheets += 1;
        if (p.clubId === awayClub.id && homeScore === 0) updated.stats.cleanSheets += 1;
      }
    }
  });

  const stats: MatchStats = {
    homeScore,
    awayScore,
    possession: homePossession,
    shots: [Math.max(homeScore, homeShots), Math.max(awayScore, awayShots)],
    shotsOnTarget: [Math.max(homeScore, homeShotsOnTarget), Math.max(awayScore, awayShotsOnTarget)],
    xG: [homeXG, awayXG],
    corners: [Math.max(1, homeCorners), Math.max(1, awayCorners)],
    fouls: [Math.max(homeFouls, 4), Math.max(awayFouls, 4)],
    passesCompleted: [Math.floor(homePossession * 8.5), Math.floor((100 - homePossession) * 8.5)],
    passAccuracy: [83 + Math.floor(Math.random() * 7), 81 + Math.floor(Math.random() * 7)],
    playerRatings
  };

  const updatedFixture: MatchFixture = {
    ...fixture,
    status: 'finished',
    homeScore,
    awayScore,
    events,
    stats,
    motmPlayerId: motmId,
    isResultApplied: false
  };

  return {
    fixture: updatedFixture,
    updatedPlayers
  };
}

// Helper: Realistic Scorer Selection based on position and attributes
function selectScorer(pitchPlayers: Player[], tactics?: TeamTactics): Player {
  const weights = pitchPlayers.map(p => {
    let w = 1.0;
    if (['ST', 'CF'].includes(p.position)) {
      w = 48.0;
    } else if (['RW', 'LW'].includes(p.position)) {
      w = 26.0;
    } else if (['CAM', 'RM', 'LM'].includes(p.position)) {
      w = 18.0;
    } else if (['CM', 'CDM'].includes(p.position)) {
      w = 9.0;
    } else if (['CB', 'RB', 'LB'].includes(p.position)) {
      w = 4.5; // CB header on corners / overlapping FB
    } else if (p.position === 'GK') {
      w = 0.05;
    }

    // Boost by shooting attribute
    w *= (p.shooting / 70);

    // Boost if assigned penalty taker
    if (tactics?.roles?.penaltyTakerId === p.id) {
      w *= 1.15;
    }

    return Math.max(0.1, w);
  });

  const totalWeight = weights.reduce((acc, v) => acc + v, 0);
  let r = Math.random() * totalWeight;

  for (let i = 0; i < pitchPlayers.length; i++) {
    r -= weights[i];
    if (r <= 0) return pitchPlayers[i];
  }

  return pitchPlayers[0];
}

// Helper: Realistic Assister Selection
function selectAssister(pitchPlayers: Player[], scorerId: string): Player | undefined {
  const eligible = pitchPlayers.filter(p => p.id !== scorerId);
  if (eligible.length === 0) return undefined;

  // 78% of goals have an assist
  if (Math.random() > 0.78) return undefined;

  const weights = eligible.map(p => {
    let w = 1.0;
    if (['CAM', 'CM'].includes(p.position)) {
      w = 38.0; // Playmakers
    } else if (['LW', 'RW', 'LM', 'RM'].includes(p.position)) {
      w = 34.0; // Crossers / wingers
    } else if (['LB', 'RB'].includes(p.position)) {
      w = 16.0; // Overlapping fullbacks
    } else if (['ST', 'CF'].includes(p.position)) {
      w = 14.0; // Strike partners
    } else if (['CDM', 'CB'].includes(p.position)) {
      w = 6.0;  // Long balls
    } else if (p.position === 'GK') {
      w = 0.2;  // Long goal kick assist
    }

    w *= (p.passing / 70);
    return Math.max(0.1, w);
  });

  const totalWeight = weights.reduce((acc, v) => acc + v, 0);
  let r = Math.random() * totalWeight;

  for (let i = 0; i < eligible.length; i++) {
    r -= weights[i];
    if (r <= 0) return eligible[i];
  }

  return eligible[0];
}

export function generateAssistantCoachAdvice(
  homeScore: number,
  awayScore: number,
  isUserHome: boolean,
  stats: Partial<MatchStats>,
  tactics: TeamTactics
): string {
  const userScore = isUserHome ? homeScore : awayScore;
  const oppScore = isUserHome ? awayScore : homeScore;

  if (userScore > oppScore) {
    return '「前半はプラン通り優勢に進んでいます。相手は後半、より攻撃的に前がかりに出てくるはずです。中盤のスペースを消しつつ、隙を見て鋭いカウンターで追加点を狙いましょう。」';
  } else if (userScore === oppScore) {
    return '「拮抗した展開です。ボール保持率は悪くありませんが、バイタルエリアでのラストパスの精度をもう少し高めたいところです。ウイングの突破からクロスを増やすか、テンポを一段階上げて揺さぶりをかけましょう。」';
  } else {
    return '「ビハインドを背負っています。相手の素早い攻守の切り替えに後手を踏んでいます。プレスの強度を一段階引き上げ、前線からアグレッシブにボールを奪いに行く修正をお勧めします。疲労の見える選手は早めの交代を検討してください。」';
  }
}
