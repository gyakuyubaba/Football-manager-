import { Player, Position, Club, TeamTactics } from '../types/game';
import { ALL_116_CLUBS } from './clubsData';
import { CURATED_REAL_SQUADS } from './squadsCatalog';
import { ADDITIONAL_CLUB_SEEDS } from './allClubsSquads';
import { makeRealPlayer } from './realPlayersDatabase';
import { checkPlayerDataIntegrity } from '../engine/dataValidator';
import { generateFullJLeaguePlayers } from './jLeagueData';

// Standard 18 squad positions template
const SQUAD_POSITIONS_TEMPLATE: Position[] = [
  'GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST',
  'GK', 'CB', 'CM', 'RM', 'LM', 'ST', 'CF'
];

// Authentic European First Names & Surnames for Non-Colliding Depth Squad Players
const DEPTH_NAMES_BY_COUNTRY: Record<string, { firstNames: string[]; lastNames: string[] }> = {
  'イングランド': {
    firstNames: ['George', 'Liam', 'Harry', 'Jack', 'Callum', 'Oliver', 'Noah', 'Leo', 'Arthur', 'Oscar', 'Freddie', 'Alfie', 'Finley', 'Archie', 'Charlie', 'Harvey'],
    lastNames: ['Pemberton', 'Ellington', 'Holliday', 'Barkworth', 'Cranston', 'Blackwood', 'Whitmore', 'Fairclough', 'Thorold', 'Ainsworth', 'Brabazon', 'Nethercott', 'Colquhoun', 'Stanhope', 'Harpur', 'Goxhill']
  },
  'スペイン': {
    firstNames: ['Hugo', 'Mateo', 'Lucas', 'Martín', 'Daniel', 'Pablo', 'Alejandro', 'Manuel', 'Álvaro', 'Adrián', 'David', 'Mario', 'Diego', 'Marcos', 'Javier'],
    lastNames: ['Carballeira', 'Villacastín', 'Monasterio', 'Zubeldia', 'Basterretxea', 'Aranguren', 'Bustamante', 'Campomanes', 'Fontcuberta', 'Urrutikoetxea', 'Garmendia', 'Madariaga', 'Santisteban', 'Barrenetxea']
  },
  'ドイツ': {
    firstNames: ['Lukas', 'Finn', 'Jonas', 'Paul', 'Niklas', 'Tim', 'Jan', 'Leon', 'Felix', 'Maximilian', 'Julian', 'Moritz', 'Elias', 'Hannes', 'Tobias'],
    lastNames: ['Holzbrinck', 'Breitenstein', 'Westermann', 'Lindemann', 'Kaufbeuren', 'Schneidewind', 'Rosenkranz', 'Bärenfänger', 'Tannhäuser', 'Winterfeld', 'Diefenbach', 'Stauffenberg', 'Klingenberg', 'Sonnenschein']
  },
  'イタリア': {
    firstNames: ['Lorenzo', 'Mattia', 'Tommaso', 'Gabriele', 'Edoardo', 'Federico', 'Riccardo', 'Davide', 'Samuele', 'Simone', 'Michele', 'Pietro', 'Filippo'],
    lastNames: ['Tagliaferri', 'Castelvecchio', 'Montesquieu', 'Barcellona', 'Campanella', 'Bentivoglio', 'Pietralunga', 'Valvassori', 'Bongiovanni', 'Scaramuccia', 'Passalacqua', 'Mazzagatti', 'Quattrocchi']
  },
  'フランス': {
    firstNames: ['Gabriel', 'Raphaël', 'Jules', 'Arthur', 'Louis', 'Maël', 'Lucas', 'Adam', 'Hugo', 'Sacha', 'Gaspard', 'Mathis', 'Nathan', 'Clément'],
    lastNames: ['Chanteloube', 'Villedieu', 'Rochechouart', 'Montauban', 'Beauchamp', 'Fontenelle', 'Castelbajac', 'Dambreuse', 'Chateaubriand', 'Lescure', 'Grandchamp', 'Puydebat', 'Hautefort', 'Bellerive']
  }
};

export function buildCompletePlayersRegistry(): Record<string, Player> {
  const registry: Record<string, Player> = {};
  const registeredPlayerIds = new Set<string>();
  const registeredNormalizedNames = new Set<string>();

  // Helper to add player with strict uniqueness guarantee
  const addPlayerIfUnique = (p: Player): boolean => {
    if (!p || !p.id || !p.name) return false;

    // Strict Diogo Jota filter
    if (p.name.toLowerCase().includes('diogo jota') || p.id.includes('jota')) {
      return false;
    }

    const norm = p.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (registeredNormalizedNames.has(norm)) {
      // Duplicate person detected, skip secondary clone
      return false;
    }

    let finalId = p.id;
    if (registeredPlayerIds.has(finalId)) {
      finalId = `${p.id}_${Math.floor(Math.random() * 1000)}`;
    }

    const cleanPlayer: Player = {
      ...p,
      id: finalId,
      currentClubId: p.clubId,
      squadStatus: p.squadStatus || 'OUT_OF_SQUAD',
      injuryStatus: p.injuryStatus || (p.injury?.isInjured ? 'INJURED' : 'FIT'),
      injury: p.injury || { isInjured: false },
      suspension: p.suspension || { isSuspended: false, matchesRemaining: 0 }
    };

    registry[finalId] = cleanPlayer;
    registeredPlayerIds.add(finalId);
    registeredNormalizedNames.add(norm);
    return true;
  };

  // 1. Register Curated authentic squads first (highest priority)
  Object.values(CURATED_REAL_SQUADS).forEach(squad => {
    squad.forEach(p => {
      addPlayerIfUnique(p);
    });
  });

  // 2. Register additional authentic club seeds
  Object.entries(ADDITIONAL_CLUB_SEEDS).forEach(([clubId, seeds]) => {
    seeds.forEach((seed, idx) => {
      const pId = `${clubId}_${idx + 1}_${seed.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}`;
      const tierMultiplier = seed.ovr >= 85 ? 65000000 : seed.ovr >= 80 ? 30000000 : seed.ovr >= 75 ? 12000000 : 2500000;
      const wageMultiplier = seed.ovr >= 85 ? 200000 : seed.ovr >= 80 ? 100000 : seed.ovr >= 75 ? 40000 : 12000;

      const player = makeRealPlayer(
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

      addPlayerIfUnique(player);
    });
  });

  // 3. Ensure all 96 European clubs have at least 18 fully structured players without reusing real star names
  ALL_116_CLUBS.forEach((club, clubIdx) => {
    const existing = Object.values(registry).filter(p => p.clubId === club.id);
    const needed = Math.max(0, 18 - existing.length);

    if (needed > 0) {
      const depthData = DEPTH_NAMES_BY_COUNTRY[club.country] || DEPTH_NAMES_BY_COUNTRY['イングランド'];
      const tierBaseOvr = club.tier === 'Elite' ? 82 : club.tier === 'Upper' ? 77 : club.tier === 'Mid' ? 73 : 69;

      for (let i = 0; i < needed; i++) {
        const pos = SQUAD_POSITIONS_TEMPLATE[(existing.length + i) % SQUAD_POSITIONS_TEMPLATE.length];
        
        // Generate non-colliding unique name from dedicated pool
        const fName = depthData.firstNames[(clubIdx * 7 + i) % depthData.firstNames.length];
        const lName = depthData.lastNames[(clubIdx * 11 + i) % depthData.lastNames.length];
        const uniqueFullName = `${fName} ${lName}`;
        const pId = `p_${club.id}_depth_${i + 1}`;

        const ovr = Math.max(65, Math.min(84, tierBaseOvr + (i % 3) - 1));
        const age = 20 + ((clubIdx * 5 + i * 3) % 12);

        const player = makeRealPlayer(
          pId,
          uniqueFullName,
          club.id,
          pos,
          age,
          club.country,
          ovr,
          ovr + (age <= 22 ? 6 : age <= 25 ? 3 : 0),
          club.tier === 'Elite' ? 18000000 : club.tier === 'Upper' ? 9000000 : 3000000,
          club.tier === 'Elite' ? 65000 : club.tier === 'Upper' ? 35000 : 14000,
          26 + ((i * 3) % 60),
          i % 3 === 0 ? '左' : '右',
          pos === 'GK' ? 'ショットストッパー' : pos === 'CB' ? 'ボール運べるCB' : 'チャンスメイカー'
        );

        addPlayerIfUnique(player);
      }
    }
  });

  const completeRegistry = generateFullJLeaguePlayers(registry);
  return completeRegistry;
}

export function populateClubsWithDefaultSquads(
  clubs: Record<string, Club>, 
  playersRegistry: Record<string, Player>
): { clubs: Record<string, Club>; players: Record<string, Player> } {
  // First run automated data integrity check
  const { players: cleanPlayers, clubs: cleanClubs } = checkPlayerDataIntegrity(playersRegistry, clubs);

  // Update squad status defaults for each club
  Object.values(cleanClubs).forEach(club => {
    const clubPlayers = club.playerIds.map(id => cleanPlayers[id]).filter(Boolean);
    clubPlayers.sort((a, b) => b.ovr - a.ovr);

    clubPlayers.forEach((p, idx) => {
      if (idx < 11) {
        p.squadStatus = 'STARTING';
      } else if (idx < 20) {
        // Up to 9 bench players
        p.squadStatus = 'BENCH';
      } else {
        p.squadStatus = 'OUT_OF_SQUAD';
      }
    });
  });

  return { clubs: cleanClubs, players: cleanPlayers };
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
  const bench = remaining.slice(0, 9).map(p => p.id); // Strict 9 max bench players
  const reserves = remaining.slice(9).map(p => p.id);

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
