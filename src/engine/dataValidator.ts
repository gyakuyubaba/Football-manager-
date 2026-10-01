import { Player, Club, GameWorldState, StandingsRow, MatchFixture, TeamTactics } from '../types/game';

export interface IntegrityCheckResult {
  isValid: boolean;
  duplicateIds: string[];
  duplicateNames: string[];
  clubMismatches: string[];
  repairedCount: number;
  logs: string[];
}

/**
 * 【11.1 PLAYER_DUPLICATE_CHECK (選手ID重複チェック)】
 * Checks that every playerId is 100% globally unique and no player is cloned.
 */
export function PLAYER_DUPLICATE_CHECK(
  players: Record<string, Player>
): { valid: boolean; duplicates: string[]; logs: string[] } {
  const seenIds = new Set<string>();
  const seenNames = new Map<string, string>();
  const duplicates: string[] = [];
  const logs: string[] = [];

  for (const [id, player] of Object.entries(players)) {
    if (seenIds.has(id)) {
      duplicates.push(id);
      logs.push(`[DUPLICATE_ID] 選手ID "${id}" (${player.name}) が重複して存在します。`);
    }
    seenIds.add(id);

    const norm = player.name.trim().toLowerCase().replace(/[^a-z0-9ぁ-んァ-ヶ一-龥]/g, '');
    if (seenNames.has(norm)) {
      duplicates.push(id);
      logs.push(`[DUPLICATE_NAME] 同一選手 "${player.name}" が別ID (${seenNames.get(norm)} と ${id}) で重複登録されています。`);
    } else {
      seenNames.set(norm, id);
    }
  }

  return {
    valid: duplicates.length === 0,
    duplicates,
    logs
  };
}

/**
 * 【11.2 CLUB_MEMBERSHIP_CHECK (クラブ所属一元管理チェック)】
 * Ensures 1 player belongs to exactly 1 club and club.playerIds matches player.currentClubId.
 */
export function CLUB_MEMBERSHIP_CHECK(
  players: Record<string, Player>,
  clubs: Record<string, Club>
): { valid: boolean; mismatches: string[]; logs: string[] } {
  const mismatches: string[] = [];
  const logs: string[] = [];
  const playerClubOwnership = new Map<string, string>();

  // Check clubs' playerIds lists
  for (const [cId, club] of Object.entries(clubs)) {
    club.playerIds.forEach(pId => {
      if (playerClubOwnership.has(pId)) {
        mismatches.push(pId);
        logs.push(`[MULTI_CLUB_MEMBERSHIP] 選手ID "${pId}" がクラブ "${playerClubOwnership.get(pId)}" と "${cId}" の両方に二重所属しています。`);
      } else {
        playerClubOwnership.set(pId, cId);
      }
    });
  }

  // Check players' clubId vs club.playerIds
  for (const [pId, p] of Object.entries(players)) {
    if (!clubs[p.clubId]) {
      mismatches.push(pId);
      logs.push(`[INVALID_CLUB] 選手 "${p.name}" (${pId}) が存在しないクラブ "${p.clubId}" に所属しています。`);
    } else {
      const club = clubs[p.clubId];
      if (!club.playerIds.includes(pId)) {
        mismatches.push(pId);
        logs.push(`[ROSTER_MISSING] 選手 "${p.name}" (${pId}) が所属クラブ "${club.name}" の名簿に登録されていません。`);
      }
    }
  }

  return {
    valid: mismatches.length === 0,
    mismatches,
    logs
  };
}

/**
 * 【11.3 INJURY_ELIGIBILITY_CHECK (怪我選手・出場資格チェック)】
 * Checks that no injured player is in starters or bench.
 */
export function INJURY_ELIGIBILITY_CHECK(
  tactics: TeamTactics,
  players: Record<string, Player>,
  currentDate?: string
): { valid: boolean; violations: string[]; logs: string[] } {
  const violations: string[] = [];
  const logs: string[] = [];

  const starterIds = tactics.lineup.starters.map(s => s.playerId);
  const benchIds = tactics.lineup.bench;

  starterIds.forEach(id => {
    const p = players[id];
    if (p) {
      const isInjured = p.injuryStatus === 'INJURED' || p.injury?.isInjured;
      const isBeforeReturn = currentDate && p.injuryReturnDate && p.injuryReturnDate > currentDate;
      if (isInjured || isBeforeReturn) {
        violations.push(id);
        logs.push(`[INJURY_VIOLATION_STARTER] 負傷中の選手 "${p.name}" (${id}) がスタメンに登録されています。`);
      }
      if (p.suspension?.isSuspended) {
        violations.push(id);
        logs.push(`[SUSPENSION_VIOLATION] 出場停止中の選手 "${p.name}" (${id}) がスタメンに登録されています。`);
      }
    }
  });

  benchIds.forEach(id => {
    const p = players[id];
    if (p) {
      const isInjured = p.injuryStatus === 'INJURED' || p.injury?.isInjured;
      const isBeforeReturn = currentDate && p.injuryReturnDate && p.injuryReturnDate > currentDate;
      if (isInjured || isBeforeReturn) {
        violations.push(id);
        logs.push(`[INJURY_VIOLATION_BENCH] 負傷中の選手 "${p.name}" (${id}) がベンチに登録されています。`);
      }
    }
  });

  return {
    valid: violations.length === 0,
    violations,
    logs
  };
}

/**
 * 【11.4 MATCH_RESULT_CHECK (試合結果反映チェック)】
 * Verifies that all finished matches are properly applied to the world.
 */
export function MATCH_RESULT_CHECK(
  fixtures: MatchFixture[]
): { valid: boolean; unreflectedCount: number; logs: string[] } {
  const logs: string[] = [];
  let unreflectedCount = 0;

  fixtures.forEach(f => {
    if (f.status === 'finished') {
      if (f.homeScore === undefined || f.awayScore === undefined) {
        unreflectedCount++;
        logs.push(`[RESULT_MISSING] 終了済み試合 "${f.id}" にスコアが記録されていません。`);
      }
    }
  });

  return {
    valid: unreflectedCount === 0,
    unreflectedCount,
    logs
  };
}

/**
 * 【11.5 STANDINGS_CHECK (順位表整合性チェック)】
 * Ensures points = won*3 + drawn and goalDiff = GF - GA.
 */
export function STANDINGS_CHECK(
  standings: Record<string, StandingsRow[]>
): { valid: boolean; discrepancies: string[]; logs: string[] } {
  const discrepancies: string[] = [];
  const logs: string[] = [];

  for (const [leagueKey, rows] of Object.entries(standings)) {
    rows.forEach(r => {
      const calcPoints = (r.won * 3) + r.drawn;
      if (r.points !== calcPoints) {
        discrepancies.push(r.clubId);
        logs.push(`[STANDINGS_MATH_ERROR] ${leagueKey}の${r.clubName}: 勝ち点記録値(${r.points})と計算値(${calcPoints})が一致しません。`);
      }
      if (r.goalsFor - r.goalsAgainst !== r.goalDiff) {
        discrepancies.push(r.clubId);
        logs.push(`[STANDINGS_GD_ERROR] ${r.clubName}: 得失点差記録値(${r.goalDiff})と計算値(${r.goalsFor - r.goalsAgainst})が一致しません。`);
      }
      if (r.played !== (r.won + r.drawn + r.lost)) {
        discrepancies.push(r.clubId);
        logs.push(`[STANDINGS_GAMES_ERROR] ${r.clubName}: 試合数(${r.played})と勝敗合計(${r.won + r.drawn + r.lost})が一致しません。`);
      }
    });
  }

  return {
    valid: discrepancies.length === 0,
    discrepancies,
    logs
  };
}

/**
 * Full master check & auto-repair system (PLAYER_DATA_INTEGRITY_CHECK)
 */
export function checkPlayerDataIntegrity(
  players: Record<string, Player>,
  clubs: Record<string, Club>
): { players: Record<string, Player>; clubs: Record<string, Club>; result: IntegrityCheckResult } {
  const result: IntegrityCheckResult = {
    isValid: true,
    duplicateIds: [],
    duplicateNames: [],
    clubMismatches: [],
    repairedCount: 0,
    logs: []
  };

  const cleanPlayers: Record<string, Player> = {};
  const seenCanonical = new Map<string, string>();

  for (const [pId, player] of Object.entries(players)) {
    if (!player || !player.id || !player.name) continue;

    // Strict Diogo Jota filter
    if (player.name.toLowerCase().includes('diogo jota') || player.id.includes('jota')) {
      result.logs.push(`[INTEGRITY] Removed excluded player: ${player.name} (${player.id})`);
      result.repairedCount++;
      continue;
    }

    const canonicalName = player.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    if (seenCanonical.has(canonicalName)) {
      const existingId = seenCanonical.get(canonicalName)!;
      result.duplicateNames.push(player.name);
      result.logs.push(`[DUPLICATE DETECTED] Duplicate player found: "${player.name}" (${existingId} vs ${player.id}). Eliminating duplicate clone.`);
      result.repairedCount++;
      continue;
    }

    let assignedId = player.id;
    if (cleanPlayers[assignedId]) {
      result.duplicateIds.push(assignedId);
      assignedId = `${assignedId}_fixed_${Date.now()}`;
      result.repairedCount++;
    }

    const targetClubId = player.clubId || 'arsenal';
    const validClubId = clubs[targetClubId] ? targetClubId : 'arsenal';

    const normalizedPlayer: Player = {
      ...player,
      id: assignedId,
      clubId: validClubId,
      currentClubId: validClubId,
      squadStatus: player.squadStatus || 'OUT_OF_SQUAD',
      injuryStatus: (player.injury?.isInjured || player.injuryStatus === 'INJURED') ? 'INJURED' : 'HEALTHY'
    };

    cleanPlayers[assignedId] = normalizedPlayer;
    seenCanonical.set(canonicalName, assignedId);
  }

  const cleanClubs: Record<string, Club> = {};
  for (const [cId, club] of Object.entries(clubs)) {
    cleanClubs[cId] = {
      ...club,
      playerIds: []
    };
  }

  for (const p of Object.values(cleanPlayers)) {
    if (cleanClubs[p.clubId]) {
      if (!cleanClubs[p.clubId].playerIds.includes(p.id)) {
        cleanClubs[p.clubId].playerIds.push(p.id);
      }
    }
  }

  result.isValid = result.duplicateIds.length === 0 && result.duplicateNames.length === 0;

  return {
    players: cleanPlayers,
    clubs: cleanClubs,
    result
  };
}

/**
 * Auto replace ineligible starters and bench players with highest OVR healthy players
 */
export function autoReplaceIneligiblePlayers(
  starters: string[],
  bench: string[],
  clubId: string,
  players: Record<string, Player>,
  currentDate?: string
): { starters: string[]; bench: string[]; replacedCount: number } {
  const currentStarterIds = [...starters];
  let currentBenchIds = [...bench];
  let replacedCount = 0;

  const clubPlayers = Object.values(players).filter(p => p.clubId === clubId);

  const isHealthy = (p: Player): boolean => {
    if (p.injury?.isInjured || p.injuryStatus === 'INJURED') return false;
    if (currentDate && p.injuryReturnDate && p.injuryReturnDate > currentDate) return false;
    if (p.suspension?.isSuspended || (p.suspension?.matchesRemaining || 0) > 0) return false;
    return true;
  };

  const healthyBench = currentBenchIds.map(id => players[id]).filter(p => p && isHealthy(p));
  const healthyReserves = clubPlayers
    .filter(p => !currentStarterIds.includes(p.id) && !currentBenchIds.includes(p.id) && isHealthy(p))
    .sort((a, b) => b.ovr - a.ovr);

  // 1. Replace ineligible starters
  currentStarterIds.forEach((pId, idx) => {
    const p = players[pId];
    if (!p || !isHealthy(p) || p.squadStatus === 'OUT_OF_SQUAD') {
      let candidate: Player | undefined;
      const benchCandidateIdx = healthyBench.findIndex(bp => bp.position === (p?.position || 'CM'));
      if (benchCandidateIdx !== -1) {
        candidate = healthyBench.splice(benchCandidateIdx, 1)[0];
        currentBenchIds = currentBenchIds.filter(id => id !== candidate!.id);
      } else if (healthyBench.length > 0) {
        candidate = healthyBench.shift();
        currentBenchIds = currentBenchIds.filter(id => id !== candidate!.id);
      } else if (healthyReserves.length > 0) {
        candidate = healthyReserves.shift();
      }

      if (candidate) {
        currentStarterIds[idx] = candidate.id;
        candidate.squadStatus = 'STARTING';
        if (p) p.squadStatus = 'OUT_OF_SQUAD';
        replacedCount++;
      }
    }
  });

  // 2. Remove / replace ineligible bench players
  const cleanBench: string[] = [];
  currentBenchIds.forEach(pId => {
    const p = players[pId];
    if (p && isHealthy(p)) {
      cleanBench.push(pId);
    } else {
      if (p) p.squadStatus = 'OUT_OF_SQUAD';
      replacedCount++;
      if (healthyReserves.length > 0) {
        const replacement = healthyReserves.shift()!;
        replacement.squadStatus = 'BENCH';
        cleanBench.push(replacement.id);
      }
    }
  });

  return {
    starters: currentStarterIds,
    bench: cleanBench.slice(0, 9),
    replacedCount
  };
}
