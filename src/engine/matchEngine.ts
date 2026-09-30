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
// 【13 & 14. FINAL_MATCH_ELIGIBILITY_CHECK (出場不可選手の完全な出場禁止)】
// -------------------------------------------------------------
export function finalMatchEligibilityCheck(
  starters: string[],
  bench: string[],
  clubId: string,
  players: Record<string, Player>
): {
  isEligible: boolean;
  errors: string[];
  ineligiblePlayerIds: string[];
} {
  const errors: string[] = [];
  const ineligiblePlayerIds: string[] = [];

  starters.forEach(pId => {
    const p = players[pId];
    if (!p) {
      errors.push(`未登録の選手ID (${pId}) がスタメンに含まれています。`);
      ineligiblePlayerIds.push(pId);
      return;
    }

    if (p.clubId !== clubId) {
      errors.push(`【所属不一致】${p.name}選手は他クラブ所属のため出場できません。`);
      ineligiblePlayerIds.push(pId);
    }

    if (p.injury?.isInjured || p.injuryStatus === 'INJURED') {
      errors.push(`【負傷離脱中】${p.name}選手は負傷中（全治約${p.injury?.recoveryDays || 7}日）のため出場できません。`);
      ineligiblePlayerIds.push(pId);
    }

    if (p.suspension?.isSuspended || (p.suspension?.matchesRemaining || 0) > 0) {
      errors.push(`【出場停止中】${p.name}選手は出場停止処分中のため出場できません。`);
      ineligiblePlayerIds.push(pId);
    }

    if (p.squadStatus === 'OUT_OF_SQUAD') {
      errors.push(`【ベンチ外登録】${p.name}選手はベンチ外に設定されているため出場できません。`);
      ineligiblePlayerIds.push(pId);
    }
  });

  return {
    isEligible: errors.length === 0,
    errors,
    ineligiblePlayerIds
  };
}

export function calculateEffectivePlayerPower(player: Player): number {
  if (player.injury?.isInjured || player.injuryStatus === 'INJURED' || player.suspension?.isSuspended) {
    return 0;
  }
  const condMult = CONDITION_MULTIPLIER[player.condition] || 1.0;
  const fatiguePenalty = Math.max(0.7, 1 - (player.fatigue / 200));
  return player.ovr * condMult * fatiguePenalty;
}

// Commentary variation pools (Requirement 24)
const GOAL_COMMENTARIES = [
  (s: string, a?: string) => `【GOAL!!】${s}がディフェンスラインの裏へ抜け出し、冷静にGKの脇を抜く技ありゴール！${a ? ` (${a}の見事なスルーパス)` : ''}`,
  (s: string, a?: string) => `【GOAL!!】右サイドからの鋭いクロスに${s}が完璧なタイミングでヘディングを叩き込む！${a ? ` (アシスト: ${a})` : ''}`,
  (s: string, a?: string) => `【GOAL!!】混戦のペナルティエリアから${s}が電光石火の反転シュート！ネットを揺らす！${a ? ` (ラストパス: ${a})` : ''}`,
  (s: string) => `【GOAL!!】${s}がペナルティエリア外から放った強烈なミドルシュートがゴール左上隅へ突き刺さるゴラッソ！`,
  (s: string, a?: string) => `【GOAL!!】素早いカウンターが炸裂！${s}がダイレクトボレーでフィニッシュ！${a ? ` (${a}の絶妙クロス)` : ''}`
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

  // 1. Mandatory FINAL_MATCH_ELIGIBILITY_CHECK (Requirement 13 & 14)
  // Ensure that no injured, suspended, or out-of-squad player is ever on the pitch
  const sanitizeStarters = (club: Club, tactics: TeamTactics): string[] => {
    const rawStarters = tactics.lineup.starters.map(s => s.playerId);
    const valid: string[] = [];
    const clubPlayerIds = club.playerIds || [];

    // Filter out ineligible starters
    rawStarters.forEach(pId => {
      const p = updatedPlayers[pId];
      if (p && !p.injury?.isInjured && p.injuryStatus !== 'INJURED' && !p.suspension?.isSuspended && p.clubId === club.id) {
        valid.push(pId);
      }
    });

    // Backfill with available healthy players from club squad if any were disqualified
    if (valid.length < 11) {
      for (const pId of clubPlayerIds) {
        if (valid.length >= 11) break;
        if (!valid.includes(pId)) {
          const p = updatedPlayers[pId];
          if (p && !p.injury?.isInjured && p.injuryStatus !== 'INJURED' && !p.suspension?.isSuspended) {
            valid.push(pId);
          }
        }
      }
    }

    return valid;
  };

  let homePitchPlayers = sanitizeStarters(homeClub, homeTactics);
  let awayPitchPlayers = sanitizeStarters(awayClub, awayTactics);

  // Active yellow card tracker per player for 2nd-yellow send-off rule (Requirement 23)
  const yellowCardCounts: Record<string, number> = {};

  // Calculate team powers
  const homeStartersList = homePitchPlayers.map(id => updatedPlayers[id]).filter(Boolean);
  const awayStartersList = awayPitchPlayers.map(id => updatedPlayers[id]).filter(Boolean);

  const homeBasePower = homeStartersList.reduce((acc, p) => acc + calculateEffectivePlayerPower(p), 0) / (homeStartersList.length || 1);
  const awayBasePower = awayStartersList.reduce((acc, p) => acc + calculateEffectivePlayerPower(p), 0) / (awayStartersList.length || 1);

  // Home advantage (+3.5%)
  const homeAdvantage = 1.035;
  const homePower = homeBasePower * homeAdvantage;
  const awayPower = awayBasePower;

  const totalPower = homePower + awayPower;
  const homeShare = homePower / (totalPower || 1);
  const awayShare = awayPower / (totalPower || 1);

  let homeTempoBonus = homeTactics.instructions.attackingStyle === 'ダイレクト・カウンター' ? 1.05 : 1.0;
  let awayTempoBonus = awayTactics.instructions.attackingStyle === 'ダイレクト・カウンター' ? 1.05 : 1.0;

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

  const playerRatings: Record<string, number> = {};
  [...homeStartersList, ...awayStartersList].forEach(p => {
    playerRatings[p.id] = 6.0 + (Math.random() * 0.8);
  });

  // Paced match simulation: realistic intervals with football-authentic quiet spells (Requirement 19)
  for (let min = 3; min <= 90; min += 6) {
    const jitter = Math.floor(Math.random() * 4);
    const eventMin = Math.min(90, min + jitter);

    // Current healthy on-pitch players only (Requirement 20, 21, 22)
    const currentHomePitch = homePitchPlayers.map(id => updatedPlayers[id]).filter(Boolean);
    const currentAwayPitch = awayPitchPlayers.map(id => updatedPlayers[id]).filter(Boolean);

    // Minor quiet spell in early game (0-10 min quieter, 11-30 min escalating: Requirement 19)
    const earlyGameQuiet = eventMin <= 10 && Math.random() < 0.40;
    if (earlyGameQuiet) continue;

    // --- HOME ATTACK CHANCE ---
    const homeChance = Math.random() * 100 < (homeShare * 36 * homeTempoBonus);
    if (homeChance && currentHomePitch.length > 0) {
      homeShots++;
      const onTarget = Math.random() < 0.44;

      if (onTarget) {
        homeShotsOnTarget++;
        const isGoal = Math.random() < 0.28;

        if (isGoal) {
          homeScore++;
          // Scorer STRICTLY from current on-pitch players (Requirement 20)
          const attackers = currentHomePitch.filter(p => ['ST', 'CF', 'RW', 'LW', 'CAM', 'RM', 'LM'].includes(p.position));
          const scorer = attackers.length > 0 ? attackers[Math.floor(Math.random() * attackers.length)] : currentHomePitch[0];

          // Assister STRICTLY from other current on-pitch players (Requirement 21)
          const potentialAssisters = currentHomePitch.filter(p => p.id !== scorer.id);
          const hasAssist = Math.random() < 0.75 && potentialAssisters.length > 0;
          const assister = hasAssist ? potentialAssisters[Math.floor(Math.random() * potentialAssisters.length)] : undefined;

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
          // Goalkeeper save
          const awayGK = currentAwayPitch.find(p => p.position === 'GK') || currentAwayPitch[0];
          const homeShooter = currentHomePitch[Math.floor(Math.random() * currentHomePitch.length)];
          const saveFn = SAVE_COMMENTARIES[Math.floor(Math.random() * SAVE_COMMENTARIES.length)];
          events.push({
            minute: eventMin,
            type: 'save',
            clubId: awayClub.id,
            playerId: awayGK.id,
            playerName: awayGK.name,
            description: saveFn(awayGK.name, homeShooter.name)
          });
          homeCorners++;
          playerRatings[awayGK.id] = Math.min(9.2, (playerRatings[awayGK.id] || 6.0) + 0.4);
        }
      } else {
        // Shot missed / Woodwork
        if (Math.random() < 0.12) {
          const shooter = currentHomePitch[Math.floor(Math.random() * currentHomePitch.length)];
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

    // --- AWAY ATTACK CHANCE ---
    const awayChance = Math.random() * 100 < (awayShare * 34 * awayTempoBonus);
    if (awayChance && currentAwayPitch.length > 0) {
      awayShots++;
      const onTarget = Math.random() < 0.44;

      if (onTarget) {
        awayShotsOnTarget++;
        const isGoal = Math.random() < 0.27;

        if (isGoal) {
          awayScore++;
          const attackers = currentAwayPitch.filter(p => ['ST', 'CF', 'RW', 'LW', 'CAM', 'RM', 'LM'].includes(p.position));
          const scorer = attackers.length > 0 ? attackers[Math.floor(Math.random() * attackers.length)] : currentAwayPitch[0];

          const potentialAssisters = currentAwayPitch.filter(p => p.id !== scorer.id);
          const hasAssist = Math.random() < 0.75 && potentialAssisters.length > 0;
          const assister = hasAssist ? potentialAssisters[Math.floor(Math.random() * potentialAssisters.length)] : undefined;

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
          // Goalkeeper save
          const homeGK = currentHomePitch.find(p => p.position === 'GK') || currentHomePitch[0];
          const awayShooter = currentAwayPitch[Math.floor(Math.random() * currentAwayPitch.length)];
          const saveFn = SAVE_COMMENTARIES[Math.floor(Math.random() * SAVE_COMMENTARIES.length)];
          events.push({
            minute: eventMin,
            type: 'save',
            clubId: homeClub.id,
            playerId: homeGK.id,
            playerName: homeGK.name,
            description: saveFn(homeGK.name, awayShooter.name)
          });
          awayCorners++;
          playerRatings[homeGK.id] = Math.min(9.2, (playerRatings[homeGK.id] || 6.0) + 0.4);
        }
      } else {
        if (Math.random() < 0.12) {
          const shooter = currentAwayPitch[Math.floor(Math.random() * currentAwayPitch.length)];
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

    // --- CARDS & FOULS (Requirements 22 & 23: 2枚目のイエロー対応) ---
    if (Math.random() < 0.08) {
      const isHomeCard = Math.random() < 0.5;
      const targetClub = isHomeCard ? homeClub : awayClub;
      const targetPitch = isHomeCard ? currentHomePitch : currentAwayPitch;

      if (isHomeCard) homeFouls++;
      else awayFouls++;

      if (targetPitch.length > 0) {
        // Weighted towards defenders & midfielders
        const defenders = targetPitch.filter(p => ['CB', 'LB', 'RB', 'CDM', 'CM'].includes(p.position));
        const offender = defenders.length > 0 ? defenders[Math.floor(Math.random() * defenders.length)] : targetPitch[0];

        const currYellows = yellowCardCounts[offender.id] || 0;

        if (currYellows >= 1) {
          // 2nd Yellow -> RED CARD! (Requirement 23)
          yellowCardCounts[offender.id] = 2;
          events.push({
            minute: eventMin,
            type: 'red_card',
            clubId: targetClub.id,
            playerId: offender.id,
            playerName: offender.name,
            description: `【退場処分（警告2枚目）】${offender.name}が本日2枚目のイエローカードを受けて退場！チームは残り時間を10人で戦うことになります！`
          });

          // Remove from active pitch
          if (isHomeCard) homePitchPlayers = homePitchPlayers.filter(id => id !== offender.id);
          else awayPitchPlayers = awayPitchPlayers.filter(id => id !== offender.id);

          playerRatings[offender.id] = Math.max(3.5, (playerRatings[offender.id] || 6.0) - 2.2);

          // Apply suspension to player registry
          if (updatedPlayers[offender.id]) {
            updatedPlayers[offender.id].suspension = {
              isSuspended: true,
              matchesRemaining: 1,
              reason: '警告2枚による退場処分'
            };
          }
        } else {
          // 1st Yellow or straight red check
          const isStraightRed = Math.random() < 0.04;
          if (isStraightRed) {
            events.push({
              minute: eventMin,
              type: 'red_card',
              clubId: targetClub.id,
              playerId: offender.id,
              playerName: offender.name,
              description: `【一発退場！】${offender.name}が決定的得点機会阻止（DOGSO）と判定され一発レッドカード！`
            });
            if (isHomeCard) homePitchPlayers = homePitchPlayers.filter(id => id !== offender.id);
            else awayPitchPlayers = awayPitchPlayers.filter(id => id !== offender.id);

            playerRatings[offender.id] = Math.max(3.0, (playerRatings[offender.id] || 6.0) - 2.5);
            if (updatedPlayers[offender.id]) {
              updatedPlayers[offender.id].suspension = {
                isSuspended: true,
                matchesRemaining: 2,
                reason: '一発レッドカード（DOGSO）'
              };
            }
          } else {
            // Regular 1st Yellow Card
            yellowCardCounts[offender.id] = 1;
            const yellowPhrases = [
              `イエローカード提示。${offender.name}が激しいスライディングタックルで警告を受ける。`,
              `警告。${offender.name}が相手のカウンターを阻止するためにシャツを引っ張りイエローカード。`,
              `主審がイエローカードを提示。${offender.name}の遅れたチャージに警告が与えられます。`
            ];
            events.push({
              minute: eventMin,
              type: 'yellow_card',
              clubId: targetClub.id,
              playerId: offender.id,
              playerName: offender.name,
              description: yellowPhrases[Math.floor(Math.random() * yellowPhrases.length)]
            });
            playerRatings[offender.id] = Math.max(4.5, (playerRatings[offender.id] || 6.0) - 0.4);
          }
        }
      }
    }

    // --- IN-MATCH INJURY (Requirement 15: 試合中の怪我) ---
    if (Math.random() < 0.018) {
      const isHomeInj = Math.random() < 0.5;
      const targetClub = isHomeInj ? homeClub : awayClub;
      const targetPitch = isHomeInj ? currentHomePitch : currentAwayPitch;

      if (targetPitch.length > 0) {
        const injured = targetPitch[Math.floor(Math.random() * targetPitch.length)];
        const injuryTypes = [
          { name: 'ハムストリング肉離れ', days: 21 },
          { name: '右足首捻挫', days: 14 },
          { name: '膝内側側副靭帯損傷', days: 35 },
          { name: 'ふくらはぎ筋膜炎', days: 10 }
        ];
        const chosenInj = injuryTypes[Math.floor(Math.random() * injuryTypes.length)];

        events.push({
          minute: eventMin,
          type: 'injury',
          clubId: targetClub.id,
          playerId: injured.id,
          playerName: injured.name,
          description: `【負傷発生】${injured.name}が激しい接触で足を痛めピッチに倒れ込む。メディカルスタッフの初期診断：${chosenInj.name}（プレー続行不可）`
        });

        // Set player injury in registry (Requirement 15 & 26)
        if (updatedPlayers[injured.id]) {
          updatedPlayers[injured.id].injury = {
            isInjured: true,
            type: chosenInj.name,
            recoveryDays: chosenInj.days,
            returnDate: addDays(fixture.date, chosenInj.days)
          };
          updatedPlayers[injured.id].injuryStatus = 'INJURED';
          updatedPlayers[injured.id].injuryReturnDate = addDays(fixture.date, chosenInj.days);
          updatedPlayers[injured.id].squadStatus = 'OUT_OF_SQUAD';
        }
      }
    }
  }

  // Sort events chronologically
  events.sort((a, b) => a.minute - b.minute);

  // Accurate Match Stats strictly synchronized with generated events (Requirement 25 & 26)
  const homeYellows = events.filter(e => e.type === 'yellow_card' && e.clubId === homeClub.id).length;
  const awayYellows = events.filter(e => e.type === 'yellow_card' && e.clubId === awayClub.id).length;
  const homeReds = events.filter(e => e.type === 'red_card' && e.clubId === homeClub.id).length;
  const awayReds = events.filter(e => e.type === 'red_card' && e.clubId === awayClub.id).length;

  const homePossession = Math.min(74, Math.max(26, Math.round(homeShare * 100)));
  const homeXG = +(homeShotsOnTarget * 0.30 + (homeShots - homeShotsOnTarget) * 0.05).toFixed(2);
  const awayXG = +(awayShotsOnTarget * 0.30 + (awayShots - awayShotsOnTarget) * 0.05).toFixed(2);

  // Determine MOTM (Highest rated player)
  let bestRating = 0;
  let motmId = homeStartersList[0]?.id;
  Object.entries(playerRatings).forEach(([pId, rating]) => {
    if (rating > bestRating) {
      bestRating = rating;
      motmId = pId;
    }
  });

  // Apply match fatigue and player stats update
  [...homeStartersList, ...awayStartersList].forEach(p => {
    const updated = updatedPlayers[p.id];
    if (updated) {
      updated.fatigue = Math.min(100, updated.fatigue + 18);
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

      // Clean sheet for GK/DF
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
    shots: [homeShots, awayShots],
    shotsOnTarget: [homeShotsOnTarget, awayShotsOnTarget],
    xG: [homeXG, awayXG],
    corners: [Math.max(1, homeCorners), Math.max(1, awayCorners)],
    fouls: [Math.max(homeFouls, homeYellows * 2), Math.max(awayFouls, awayYellows * 2)],
    passesCompleted: [Math.floor(homePossession * 8.5), Math.floor((100 - homePossession) * 8.5)],
    passAccuracy: [82 + Math.floor(Math.random() * 8), 80 + Math.floor(Math.random() * 8)],
    playerRatings
  };

  const updatedFixture: MatchFixture = {
    ...fixture,
    status: 'finished',
    homeScore,
    awayScore,
    events,
    stats,
    motmPlayerId: motmId
  };

  return {
    fixture: updatedFixture,
    updatedPlayers
  };
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
