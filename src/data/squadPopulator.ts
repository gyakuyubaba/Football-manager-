import { Player, Position, Club, TeamTactics } from '../types/game';
import { ALL_116_CLUBS } from './clubsData';
import { CURATED_REAL_SQUADS } from './squadsCatalog';
import { ADDITIONAL_CLUB_SEEDS, REAL_FOOTBALL_NAMES_DATABASE } from './allClubsSquads';
import { makeRealPlayer } from './realPlayersDatabase';

// Standard 18 squad positions template
const SQUAD_POSITIONS_TEMPLATE: Position[] = [
  'GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST',
  'GK', 'CB', 'CM', 'RM', 'LM', 'ST', 'CF'
];

export function buildCompletePlayersRegistry(): Record<string, Player> {
  const registry: Record<string, Player> = {};

  // 1. Curated real squads
  Object.values(CURATED_REAL_SQUADS).forEach(squad => {
    squad.forEach(p => {
      registry[p.id] = { ...p };
    });
  });

  // 2. Additional seeded clubs
  Object.entries(ADDITIONAL_CLUB_SEEDS).forEach(([clubId, seeds]) => {
    seeds.forEach((seed, idx) => {
      const pId = `${clubId}_${idx + 1}_${seed.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}`;
      if (!registry[pId]) {
        const tierMultiplier = seed.ovr >= 85 ? 65000000 : seed.ovr >= 80 ? 30000000 : seed.ovr >= 75 ? 12000000 : 2500000;
        const wageMultiplier = seed.ovr >= 85 ? 200000 : seed.ovr >= 80 ? 100000 : seed.ovr >= 75 ? 40000 : 12000;
        
        registry[pId] = makeRealPlayer(
          pId,
          seed.name,
          clubId,
          seed.position,
          seed.age,
          seed.nationality,
          seed.ovr,
          seed.ovr + (seed.age <= 22 ? 6 : seed.age <= 26 ? 3 : 0),
          tierMultiplier,
          wageMultiplier,
          seed.shirtNumber,
          seed.preferredFoot || '右',
          seed.playstyle || (seed.position === 'GK' ? 'ショットストッパー' : 'チャンスメイカー')
        );
      }
    });
  });

  // 3. Ensure every one of the 116 clubs has at least 18 fully named REAL players
  let nameIndex = 0;
  ALL_116_CLUBS.forEach(club => {
    // Find players already registered for this club
    const existing = Object.values(registry).filter(p => p.clubId === club.id);
    const needed = Math.max(0, 18 - existing.length);

    if (needed > 0) {
      const countryData = REAL_FOOTBALL_NAMES_DATABASE[club.country] || REAL_FOOTBALL_NAMES_DATABASE['イングランド'];
      const tierBaseOvr = club.tier === 'Elite' ? 83 : club.tier === 'Upper' ? 78 : club.tier === 'Mid' ? 74 : 70;

      for (let i = 0; i < needed; i++) {
        const pos = SQUAD_POSITIONS_TEMPLATE[(existing.length + i) % SQUAD_POSITIONS_TEMPLATE.length];
        const rawName = countryData.names[(nameIndex++) % countryData.names.length];
        const pId = `${club.id}_r_${i + 1}_${rawName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}`;
        
        if (!registry[pId]) {
          const ovr = Math.max(66, Math.min(88, tierBaseOvr + (i % 4) - 2));
          const age = 21 + ((i * 3 + club.id.length) % 13);
          const isJp = club.country === '日本';

          registry[pId] = makeRealPlayer(
            pId,
            rawName,
            club.id,
            pos,
            age,
            isJp ? '日本' : countryData.nationalities[i % countryData.nationalities.length],
            ovr,
            ovr + (age <= 23 ? 5 : age <= 26 ? 2 : 0),
            isJp ? (ovr >= 75 ? 2000000 : 900000) : (club.tier === 'Elite' ? 25000000 : club.tier === 'Upper' ? 12000000 : 3500000),
            isJp ? (ovr >= 75 ? 35000 : 18000) : (club.tier === 'Elite' ? 90000 : club.tier === 'Upper' ? 45000 : 15000),
            10 + ((i + 1) * 2) % 80,
            i % 3 === 0 ? '左' : '右',
            pos === 'GK' ? 'ショットストッパー' : pos === 'CB' ? 'ボール運べるCB' : 'チャンスメイカー'
          );
        }
      }
    }
  });

  return registry;
}

export function populateClubsWithDefaultSquads(
  clubs: Record<string, Club>, 
  playersRegistry: Record<string, Player>
): { clubs: Record<string, Club>; players: Record<string, Player> } {
  const updatedClubs = { ...clubs };
  const updatedPlayers = { ...playersRegistry };

  // Reset playerIds in clubs to avoid duplicates
  Object.values(updatedClubs).forEach(club => {
    club.playerIds = [];
  });

  // Assign existing registered players to their clubs
  Object.values(updatedPlayers).forEach(p => {
    if (updatedClubs[p.clubId]) {
      if (!updatedClubs[p.clubId].playerIds.includes(p.id)) {
        updatedClubs[p.clubId].playerIds.push(p.id);
      }
    }
  });

  return { clubs: updatedClubs, players: updatedPlayers };
}

export function getDefaultTacticsForClub(club: Club, players: Record<string, Player>): TeamTactics {
  const clubPlayers = club.playerIds.map(id => players[id]).filter(Boolean);
  
  // Sort players by OVR descending
  const sorted = [...clubPlayers].sort((a, b) => b.ovr - a.ovr);
  
  // Pick GK
  const gk = sorted.find(p => p.position === 'GK') || sorted[0];
  const outfield = sorted.filter(p => p.id !== gk?.id);

  // Position slots
  const defs = outfield.filter(p => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position));
  const mids = outfield.filter(p => ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(p.position));
  const fwds = outfield.filter(p => ['ST', 'CF', 'LW', 'RW'].includes(p.position));

  // Pick starters with preferred positions
  const rb = defs.find(p => p.position === 'RB' || p.position === 'RWB') || defs[0] || outfield[0];
  const cb1 = defs.find(p => p.position === 'CB' && p.id !== rb?.id) || defs[1] || outfield[1];
  const cb2 = defs.find(p => p.position === 'CB' && p.id !== rb?.id && p.id !== cb1?.id) || defs[2] || outfield[2];
  const lb = defs.find(p => (p.position === 'LB' || p.position === 'LWB') && p.id !== rb?.id && p.id !== cb1?.id && p.id !== cb2?.id) || defs[3] || outfield[3];

  const cdm = mids.find(p => p.position === 'CDM') || mids[0] || outfield[4];
  const cm1 = mids.find(p => (p.position === 'CM' || p.position === 'CAM') && p.id !== cdm?.id) || mids[1] || outfield[5];
  const cm2 = mids.find(p => p.id !== cdm?.id && p.id !== cm1?.id) || mids[2] || outfield[6];

  const rw = fwds.find(p => p.position === 'RW' || p.position === 'RM') || fwds[0] || outfield[7];
  const st = fwds.find(p => (p.position === 'ST' || p.position === 'CF') && p.id !== rw?.id) || fwds[1] || outfield[8];
  const lw = fwds.find(p => (p.position === 'LW' || p.position === 'LM') && p.id !== rw?.id && p.id !== st?.id) || fwds[2] || outfield[9];

  const starterCandidates = [
    { p: gk, pos: 'GK' as Position, x: 50, y: 90 },
    { p: rb, pos: 'RB' as Position, x: 85, y: 72 },
    { p: cb1, pos: 'CB' as Position, x: 63, y: 75 },
    { p: cb2, pos: 'CB' as Position, x: 37, y: 75 },
    { p: lb, pos: 'LB' as Position, x: 15, y: 72 },
    { p: cdm, pos: 'CDM' as Position, x: 50, y: 55 },
    { p: cm1, pos: 'CM' as Position, x: 70, y: 45 },
    { p: cm2, pos: 'CM' as Position, x: 30, y: 45 },
    { p: rw, pos: 'RW' as Position, x: 82, y: 25 },
    { p: st, pos: 'ST' as Position, x: 50, y: 20 },
    { p: lw, pos: 'LW' as Position, x: 18, y: 25 },
  ];

  const pickedIds = new Set<string>();
  const starters = starterCandidates.map((slot, idx) => {
    let chosen = slot.p;
    if (!chosen || pickedIds.has(chosen.id)) {
      chosen = outfield.find(p => !pickedIds.has(p.id)) || sorted[idx % sorted.length];
    }
    if (chosen) pickedIds.add(chosen.id);
    return {
      playerId: chosen?.id || '',
      position: slot.pos,
      pitchX: slot.x,
      pitchY: slot.y
    };
  });

  const remaining = clubPlayers.filter(p => !pickedIds.has(p.id));
  const bench = remaining.slice(0, 7).map(p => p.id);
  const reserves = remaining.slice(7).map(p => p.id);

  return {
    formation: club.currentFormation || '4-3-3',
    lineup: {
      starters,
      bench,
      reserves
    },
    instructions: {
      attackingStyle: 'ポゼッション・パス',
      defensiveStyle: 'ハイプレス',
      pressIntensity: '標準的',
      defensiveLine: 'ハイライン',
      tempo: '高速テンポ',
      counterUrgency: 'ボール奪取時即カウンター'
    },
    roles: {
      captainId: starters[2]?.playerId || starters[0]?.playerId,
      penaltyTakerId: starters[9]?.playerId || starters[8]?.playerId,
      freeKickTakerId: starters[6]?.playerId,
      cornerTakerId: starters[8]?.playerId
    }
  };
}
