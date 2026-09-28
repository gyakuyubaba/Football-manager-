import { MatchFixture, MatchEvent, MatchStats, TeamTactics, Player, Club, PlayerCondition } from '../types/game';

// Condition multiplier for calculations
export const CONDITION_MULTIPLIER: Record<PlayerCondition, number> = {
  pink: 1.08,    // 絶好調
  red: 1.04,     // 好調
  yellow: 1.00,  // 普通
  cyan: 0.96,    // 不調
  purple: 0.92   // 絶不調
};

export function calculateEffectivePlayerPower(player: Player): number {
  if (player.injury.isInjured || player.suspension.isSuspended) {
    return 0;
  }
  const condMult = CONDITION_MULTIPLIER[player.condition] || 1.0;
  const fatiguePenalty = Math.max(0.7, 1 - (player.fatigue / 200)); // up to 15-30% loss if exhausted
  return player.ovr * condMult * fatiguePenalty;
}

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

  // Calculate team powers
  const homeStarters = homeTactics.lineup.starters.map(s => updatedPlayers[s.playerId]).filter(Boolean);
  const awayStarters = awayTactics.lineup.starters.map(s => updatedPlayers[s.playerId]).filter(Boolean);

  const homeBasePower = homeStarters.reduce((acc, p) => acc + calculateEffectivePlayerPower(p), 0) / (homeStarters.length || 1);
  const awayBasePower = awayStarters.reduce((acc, p) => acc + calculateEffectivePlayerPower(p), 0) / (awayStarters.length || 1);

  // Home advantage (+3.5%)
  const homeAdvantage = 1.035;
  const homePower = homeBasePower * homeAdvantage;
  const awayPower = awayBasePower;

  // Expected goals base calculation
  const totalPower = homePower + awayPower;
  const homeShare = homePower / (totalPower || 1);
  const awayShare = awayPower / (totalPower || 1);

  // Tactics modifiers
  let homeTempoBonus = homeTactics.instructions.attackingStyle === 'ダイレクト・カウンター' ? 1.05 : 1.0;
  let awayTempoBonus = awayTactics.instructions.attackingStyle === 'ダイレクト・カウンター' ? 1.05 : 1.0;

  // Simulate discrete match intervals (15 min blocks: 1-15, 16-30, 31-45, 46-60, 61-75, 76-90)
  let homeScore = 0;
  let awayScore = 0;
  let homeShots = 0;
  let awayShots = 0;
  let homeShotsOnTarget = 0;
  let awayShotsOnTarget = 0;
  let homeCorners = Math.floor(Math.random() * 6) + 2;
  let awayCorners = Math.floor(Math.random() * 5) + 2;
  let homeFouls = Math.floor(Math.random() * 8) + 6;
  let awayFouls = Math.floor(Math.random() * 8) + 6;

  const playerRatings: Record<string, number> = {};
  [...homeStarters, ...awayStarters].forEach(p => {
    playerRatings[p.id] = 6.0 + Math.random() * 0.8;
  });

  // Goal checks across 6 phases
  for (let min = 5; min <= 90; min += 7) {
    const jitter = Math.floor(Math.random() * 5);
    const eventMin = Math.min(90, min + jitter);

    // Home chance
    const homeChance = Math.random() * 100 < (homeShare * 38 * homeTempoBonus);
    if (homeChance) {
      homeShots++;
      const onTarget = Math.random() < 0.45;
      if (onTarget) {
        homeShotsOnTarget++;
        const isGoal = Math.random() < 0.28;
        if (isGoal) {
          homeScore++;
          // Pick scorer from attackers/midfielders
          const attackers = homeStarters.filter(p => ['ST', 'CF', 'RW', 'LW', 'CAM'].includes(p.position));
          const scorer = attackers.length > 0 ? attackers[Math.floor(Math.random() * attackers.length)] : homeStarters[0];
          const assister = homeStarters.filter(p => p.id !== scorer?.id)[Math.floor(Math.random() * (homeStarters.length - 1))];

          events.push({
            minute: eventMin,
            type: 'goal',
            clubId: homeClub.id,
            playerId: scorer.id,
            playerName: scorer.name,
            assistPlayerId: assister?.id,
            assistPlayerName: assister?.name,
            description: `【GOAL!!】${scorer.name}が鮮やかなシュートをネットに突き刺して先制！ (${assister ? assister.name + 'のアシスト' : '個人技'})`
          });

          playerRatings[scorer.id] = Math.min(9.9, (playerRatings[scorer.id] || 6.0) + 1.2);
          if (assister) playerRatings[assister.id] = Math.min(9.5, (playerRatings[assister.id] || 6.0) + 0.6);
        } else {
          events.push({
            minute: eventMin,
            type: 'save',
            clubId: awayClub.id,
            playerId: awayStarters.find(p => p.position === 'GK')?.id || awayStarters[0].id,
            playerName: awayStarters.find(p => p.position === 'GK')?.name || 'GK',
            description: `決定機！${homeClub.shortName}の決定的なシュートを相手GKが見事なセービングで防ぐ！`
          });
        }
      }
    }

    // Away chance
    const awayChance = Math.random() * 100 < (awayShare * 36 * awayTempoBonus);
    if (awayChance) {
      awayShots++;
      const onTarget = Math.random() < 0.45;
      if (onTarget) {
        awayShotsOnTarget++;
        const isGoal = Math.random() < 0.26;
        if (isGoal) {
          awayScore++;
          const attackers = awayStarters.filter(p => ['ST', 'CF', 'RW', 'LW', 'CAM'].includes(p.position));
          const scorer = attackers.length > 0 ? attackers[Math.floor(Math.random() * attackers.length)] : awayStarters[0];
          const assister = awayStarters.filter(p => p.id !== scorer?.id)[Math.floor(Math.random() * (awayStarters.length - 1))];

          events.push({
            minute: eventMin,
            type: 'goal',
            clubId: awayClub.id,
            playerId: scorer.id,
            playerName: scorer.name,
            assistPlayerId: assister?.id,
            assistPlayerName: assister?.name,
            description: `【GOAL!!】${awayClub.shortName}の${scorer.name}が電光石火のフィニッシュでゴール！`
          });

          playerRatings[scorer.id] = Math.min(9.9, (playerRatings[scorer.id] || 6.0) + 1.2);
          if (assister) playerRatings[assister.id] = Math.min(9.5, (playerRatings[assister.id] || 6.0) + 0.6);
        }
      }
    }

    // Occasional card or red card
    if (Math.random() < 0.09) {
      const isHomeCard = Math.random() < 0.5;
      const targetList = isHomeCard ? homeStarters : awayStarters;
      const defender = targetList.filter(p => ['CB', 'LB', 'RB', 'CDM'].includes(p.position))[0] || targetList[0];
      if (defender) {
        const isRed = Math.random() < 0.08;
        if (isRed) {
          events.push({
            minute: eventMin,
            type: 'red_card',
            clubId: isHomeCard ? homeClub.id : awayClub.id,
            playerId: defender.id,
            playerName: defender.name,
            description: `【一発退場！】${defender.name}が決定的得点機会阻止でレッドカード！一発退場処分となります！`
          });
          playerRatings[defender.id] = Math.max(3.5, (playerRatings[defender.id] || 6.0) - 2.0);
        } else {
          events.push({
            minute: eventMin,
            type: 'yellow_card',
            clubId: isHomeCard ? homeClub.id : awayClub.id,
            playerId: defender.id,
            playerName: defender.name,
            description: `イエローカード提示。${defender.name}が激しいチャージで主審から警告を受ける。`
          });
          playerRatings[defender.id] = Math.max(4.5, (playerRatings[defender.id] || 6.0) - 0.4);
        }
      }
    }

    // Occasional VAR / Penalty check
    if (Math.random() < 0.035) {
      const isHomePK = Math.random() < 0.5;
      const attackingClub = isHomePK ? homeClub : awayClub;
      const defendingClub = isHomePK ? awayClub : homeClub;
      const attackers = isHomePK ? homeStarters : awayStarters;
      const pkTaker = attackers.find(p => ['ST', 'CF', 'RW', 'LW', 'CAM'].includes(p.position)) || attackers[0];

      events.push({
        minute: Math.max(1, eventMin - 1),
        type: 'var',
        clubId: attackingClub.id,
        playerId: pkTaker.id,
        playerName: pkTaker.name,
        description: `【VARチェック中】ペナルティエリア内のハンド/接触についてVARオンフィールドレビューが行われています...`
      });

      const pkConverted = Math.random() < 0.78;
      if (pkConverted) {
        if (isHomePK) {
          homeScore++;
          homeShots++;
          homeShotsOnTarget++;
        } else {
          awayScore++;
          awayShots++;
          awayShotsOnTarget++;
        }

        events.push({
          minute: eventMin,
          type: 'goal',
          clubId: attackingClub.id,
          playerId: pkTaker.id,
          playerName: pkTaker.name,
          description: `【PK成功・GOAL!!】${attackingClub.shortName}の${pkTaker.name}がPKをゴール右隅へ沈めて得点！`
        });
        playerRatings[pkTaker.id] = Math.min(9.9, (playerRatings[pkTaker.id] || 6.0) + 1.1);
      } else {
        events.push({
          minute: eventMin,
          type: 'save',
          clubId: defendingClub.id,
          playerId: pkTaker.id,
          playerName: pkTaker.name,
          description: `【PK失敗！】${attackingClub.shortName}の${pkTaker.name}が放ったPKを相手GKが完全に読み切ってファインセーブ！`
        });
      }
    }

    // Rare minor injury
    if (Math.random() < 0.02) {
      const isHomeInj = Math.random() < 0.5;
      const targetList = isHomeInj ? homeStarters : awayStarters;
      const injuredPlayer = targetList[Math.floor(Math.random() * targetList.length)];
      if (injuredPlayer) {
        events.push({
          minute: eventMin,
          type: 'injury',
          clubId: isHomeInj ? homeClub.id : awayClub.id,
          playerId: injuredPlayer.id,
          playerName: injuredPlayer.name,
          description: `【負傷発生】${injuredPlayer.name}が激しい接触で足を痛めピッチに倒れ込む。メディカルスタッフが入ります。`
        });
      }
    }
  }

  // Sort events by minute
  events.sort((a, b) => a.minute - b.minute);

  // Compute calculated possession
  const homePossession = Math.min(75, Math.max(25, Math.round(homeShare * 100)));
  const homeXG = +(homeShotsOnTarget * 0.32 + (homeShots - homeShotsOnTarget) * 0.05).toFixed(2);
  const awayXG = +(awayShotsOnTarget * 0.32 + (awayShots - awayShotsOnTarget) * 0.05).toFixed(2);

  // Determine MOTM (Highest rating)
  let bestRating = 0;
  let motmId = homeStarters[0]?.id;
  Object.entries(playerRatings).forEach(([pId, rating]) => {
    if (rating > bestRating) {
      bestRating = rating;
      motmId = pId;
    }
  });

  // Apply match fatigue and player stats update
  [...homeStarters, ...awayStarters].forEach(p => {
    const updated = updatedPlayers[p.id];
    if (updated) {
      updated.fatigue = Math.min(100, updated.fatigue + 18);
      updated.stats.appearances += 1;
      updated.stats.starts += 1;
      updated.stats.minutes += 90;
      
      // Goals and assists in this match
      const scored = events.filter(e => e.type === 'goal' && e.playerId === p.id).length;
      const assisted = events.filter(e => e.type === 'goal' && e.assistPlayerId === p.id).length;
      updated.stats.goals += scored;
      updated.stats.assists += assisted;

      // Update avg rating
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
    corners: [homeCorners, awayCorners],
    fouls: [homeFouls, awayFouls],
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
