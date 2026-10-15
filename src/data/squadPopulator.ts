import { Player, Position, Club, TeamTactics } from '../types/game';
import { ALL_CLUBS, ALL_116_CLUBS, ENABLE_J_LEAGUE } from './clubsData';
import { CURATED_REAL_SQUADS } from './squadsCatalog';
import { ADDITIONAL_CLUB_SEEDS } from './allClubsSquads';
import { makeRealPlayer } from './realPlayersDatabase';
import { checkPlayerDataIntegrity } from '../engine/dataValidator';
import { generateFullJLeaguePlayers, J2_20_CLUBS } from './jLeagueData';

// Standard 25 squad positions template (3 GKs, 4 CBs, 2 LBs, 2 RBs, 2 CDMs, 2 CMs, 2 CAMs, 1 LM, 1 RM, 1 LW, 1 RW, 3 STs, 1 CF)
const SQUAD_POSITIONS_TEMPLATE: Position[] = [
  'GK', 'GK', 'GK',
  'CB', 'CB', 'CB', 'CB',
  'LB', 'LB', 'RB', 'RB',
  'CDM', 'CDM', 'CM', 'CM', 'CAM',
  'LM', 'RM', 'LW', 'RW',
  'ST', 'ST', 'CF', 'ST', 'CAM'
];

// Age brackets strictly matching User Specification:
// 16-19: 若手有望株, 20-23: 若手・成長期, 24-28: 全盛期, 29-32: ベテラン化開始, 33-36: 経験豊富なベテラン, 37+: 現役ベテラン
const SPEC_AGE_DISTRIBUTION = [
  17, 18, 19, // 若手有望株
  20, 21, 22, 23, // 若手・成長期
  24, 25, 26, 27, 28, // 全盛期
  29, 30, 31, 32, // ベテラン化開始
  33, 34, 35, 36, // 経験豊富なベテラン
  37, 38 // 現役ベテラン
];

// Authentic European First Names & Surnames for Non-Colliding Depth Squad Players
const DEPTH_NAMES_BY_COUNTRY: Record<string, { firstNames: string[]; lastNames: string[] }> = {
  'イングランド': {
    firstNames: [
      'George', 'Liam', 'Harry', 'Jack', 'Callum', 'Oliver', 'Noah', 'Leo', 'Arthur', 'Oscar',
      'Freddie', 'Alfie', 'Finley', 'Archie', 'Charlie', 'Harvey', 'Mason', 'Ethan', 'Jacob', 'Logan',
      'Lucas', 'Harrison', 'Daniel', 'Theo', 'Isaac', 'Edward', 'James', 'Joshua', 'Henry', 'Max',
      'Samuel', 'William', 'Benjamin', 'Sebastian', 'Joseph', 'Alexander', 'Teddy', 'Elijah', 'Reuben', 'Jaxon'
    ],
    lastNames: [
      'Pemberton', 'Ellington', 'Holliday', 'Barkworth', 'Cranston', 'Blackwood', 'Whitmore', 'Fairclough', 'Thorold', 'Ainsworth',
      'Brabazon', 'Nethercott', 'Colquhoun', 'Stanhope', 'Harpur', 'Goxhill', 'Kettlewell', 'Bradshaw', 'Finchley', 'Ashbourne',
      'Baxendale', 'Chetwynd', 'Davenport', 'Ellerby', 'Grosvenor', 'Hawkesbury', 'Kenilworth', 'Langford', 'Montague', 'Norwood',
      'Oakhaven', 'Radcliffe', 'Stanbury', 'Thornbury', 'Wakefield', 'Yardley', 'Somerset', 'Ravenscroft', 'Kingswood', 'Beaumont'
    ]
  },
  'スペイン': {
    firstNames: [
      'Hugo', 'Mateo', 'Lucas', 'Martín', 'Daniel', 'Pablo', 'Alejandro', 'Manuel', 'Álvaro', 'Adrián',
      'David', 'Mario', 'Diego', 'Marcos', 'Javier', 'Nicolás', 'Sergio', 'Carlos', 'Gonzalo', 'Iker',
      'Rubén', 'Iván', 'Raúl', 'Jorge', 'Héctor', 'Guillermo', 'Jaime', 'Víctor', 'Samuel', 'Ignacio',
      'Unai', 'Aitor', 'Mikel', 'Julen', 'Ander', 'Gorka', 'Asier', 'Borja', 'César', 'Pelayo'
    ],
    lastNames: [
      'Carballeira', 'Villacastín', 'Monasterio', 'Zubeldia', 'Basterretxea', 'Aranguren', 'Bustamante', 'Campomanes', 'Fontcuberta', 'Urrutikoetxea',
      'Garmendia', 'Madariaga', 'Santisteban', 'Barrenetxea', 'Villanueva', 'Peñaflor', 'Alcántara', 'Benavides', 'Cienfuegos', 'Delgado',
      'Echeverría', 'Fernández', 'Garrido', 'Hidalgo', 'Izaguirre', 'Jiménez', 'Larrañaga', 'Mendizábal', 'Navarrete', 'Ochandiano',
      'Piedrahíta', 'Quintanilla', 'Rebolledo', 'Samaniego', 'Torregrosa', 'Valdepeñas', 'Yravedra', 'Zamudio', 'Barriocanal', 'Corcuera'
    ]
  },
  'ドイツ': {
    firstNames: [
      'Lukas', 'Finn', 'Jonas', 'Paul', 'Niklas', 'Tim', 'Jan', 'Leon', 'Felix', 'Maximilian',
      'Julian', 'Moritz', 'Elias', 'Hannes', 'Tobias', 'Simon', 'Fabian', 'Florian', 'Alexander', 'Marcel',
      'David', 'Philipp', 'Daniel', 'Marvin', 'Sebastian', 'Robin', 'Christian', 'Kevin', 'Patrick', 'Dominik',
      'Lennard', 'Hendrik', 'Mats', 'Torben', 'Malte', 'Sven', 'Jannik', 'Bastian', 'Nico', 'Benedikt'
    ],
    lastNames: [
      'Holzbrinck', 'Breitenstein', 'Westermann', 'Lindemann', 'Kaufbeuren', 'Schneidewind', 'Rosenkranz', 'Bärenfänger', 'Tannhäuser', 'Winterfeld',
      'Diefenbach', 'Stauffenberg', 'Klingenberg', 'Sonnenschein', 'Eichelmann', 'Falkenstein', 'Greifenstein', 'Himmelfarb', 'Jaegerndorff', 'Kirchberger',
      'Lichtenstein', 'Meisenheimer', 'Nordenschild', 'Otterstetter', 'Pfefferkorn', 'Quartier', 'Reichenbacher', 'Schwarzenberg', 'Trautmann', 'Ullenspiegel',
      'Vogelgesang', 'Wachenrodt', 'Zeitschel', 'Bernburger', 'Dobermann', 'Eisenach', 'Friedrichshof', 'Gleichenberg', 'Hohenstaufen', 'Kappelmeyer'
    ]
  },
  'イタリア': {
    firstNames: [
      'Lorenzo', 'Mattia', 'Tommaso', 'Gabriele', 'Edoardo', 'Federico', 'Riccardo', 'Davide', 'Samuele', 'Simone',
      'Michele', 'Pietro', 'Filippo', 'Andrea', 'Marco', 'Matteo', 'Luca', 'Francesco', 'Alessandro', 'Giovanni',
      'Alessio', 'Nicolò', 'Christian', 'Daniele', 'Jacopo', 'Manuel', 'Diego', 'Giacomo', 'Alberto', 'Elia',
      'Valerio', 'Fabio', 'Massimo', 'Stefano', 'Paolo', 'Giorgio', 'Claudio', 'Gianluca', 'Vincenzo', 'Salvatore'
    ],
    lastNames: [
      'Tagliaferri', 'Castelvecchio', 'Montesquieu', 'Barcellona', 'Campanella', 'Bentivoglio', 'Pietralunga', 'Valvassori', 'Bongiovanni', 'Scaramuccia',
      'Passalacqua', 'Mazzagatti', 'Quattrocchi', 'Abbondanzieri', 'Belcastro', 'Colluccini', 'Deangelis', 'Falcettelli', 'Gagliardelli', 'Innocentini',
      'Lombardozzi', 'Marcovaldi', 'Notaristefano', 'Ottaviani', 'Palombella', 'Quiriconi', 'Riccitelli', 'Sperandio', 'Tarantola', 'Uccellatori',
      'Venturini', 'Zaccagnini', 'Boncompagni', 'Casagrande', 'Dellarovere', 'Fattoruso', 'Guerrieri', 'Lanfranchi', 'Mastrorilli', 'Petrocchi'
    ]
  },
  'フランス': {
    firstNames: [
      'Gabriel', 'Raphaël', 'Jules', 'Arthur', 'Louis', 'Maël', 'Lucas', 'Adam', 'Hugo', 'Sacha',
      'Gaspard', 'Mathis', 'Nathan', 'Clément', 'Théo', 'Maxime', 'Alexandre', 'Antoine', 'Paul', 'Thomas',
      'Romain', 'Nicolas', 'Julien', 'Quentin', 'Valentin', 'Adrien', 'Guillaume', 'Florian', 'Bastien', 'Benjamin',
      'Dorian', 'Corentin', 'Dylan', 'Gaëtan', 'Loïc', 'Mathieu', 'Rémi', 'Tristan', 'Victor', 'Yanis'
    ],
    lastNames: [
      'Chanteloube', 'Villedieu', 'Rochechouart', 'Montauban', 'Beauchamp', 'Fontenelle', 'Castelbajac', 'Dambreuse', 'Chateaubriand', 'Lescure',
      'Grandchamp', 'Puydebat', 'Hautefort', 'Bellerive', 'Argenteuil', 'Boisrond', 'Courtemanche', 'Delaunay', 'Estrébelle', 'Fauconberg',
      'Gaucheron', 'Hardivillier', 'Isambert', 'Jolicoeur', 'Keroualle', 'Larmagnac', 'Montmorillon', 'Neuville', 'Orbec', 'Portefaix',
      'Quimperlé', 'Rochedieu', 'Sainte-Beuve', 'Tremblay', 'Ussé', 'Valmousquet', 'Wicquefort', 'Aubervilliers', 'Bréval', 'Corbineau'
    ]
  },
  '日本': {
    firstNames: [
      '翔太', '大輝', '拓海', '悠人', '陸', '駿', '颯太', '蓮', '優斗', '陽斗',
      '大樹', '和樹', '健太', '裕樹', '直人', '航平', '亮', '慎平', '翼', '海斗',
      '陽向', '蒼', '樹', '朝陽', '圭佑', '諒', '大輔', '勇人', '拓哉', '健人',
      '康平', '達也', '将太', '雄大', '剛', '大雅', '巧', '翔', '陸斗', '遥斗'
    ],
    lastNames: [
      '佐藤', '鈴木', '高橋', '田中', '渡辺', '伊藤', '山本', '中村', '小林', '加藤',
      '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水',
      '山崎', '森', '池田', '橋本', '阿部', '石川', '山下', '中島', '石井', '小川',
      '前田', '岡田', '長谷川', '藤田', '後藤', '近藤', '村上', '遠藤', '青木', '坂本'
    ]
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

    let finalName = p.name;
    const norm = finalName.trim().toLowerCase().replace(/[\s\-_・·\.\,\'\"\(\)]/g, '') || finalName.trim().toLowerCase();
    if (norm && registeredNormalizedNames.has(norm)) {
      if (p.id.startsWith('p_')) {
        finalName = `${p.name} Jr.`;
      } else {
        return false;
      }
    }

    let finalId = p.id;
    if (registeredPlayerIds.has(finalId)) {
      finalId = `${p.id}_${Math.floor(Math.random() * 10000)}`;
    }

    const cleanPlayer: Player = {
      ...p,
      id: finalId,
      name: finalName,
      currentClubId: p.clubId,
      squadStatus: p.squadStatus || 'OUT_OF_SQUAD',
      injuryStatus: p.injuryStatus || (p.injury?.isInjured ? 'INJURED' : 'FIT'),
      injury: p.injury || { isInjured: false },
      suspension: p.suspension || { isSuspended: false, matchesRemaining: 0 }
    };

    registry[finalId] = cleanPlayer;
    registeredPlayerIds.add(finalId);
    if (norm) {
      registeredNormalizedNames.add(norm);
    }
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
      const pId = seed.name === '鈴木 彩艶' 
        ? 'parma_zion_suzuki' 
        : `${clubId}_${idx + 1}_${seed.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}`;
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

      // Requirement 4: Zion Suzuki exceptional GK passing, kicking precision & build-up from back
      if (seed.name === '鈴木 彩艶') {
        player.name = '鈴木 彩艶 (Zion Suzuki)';
        player.passing = 76; // Footwork, build-up, short/long pass ability significantly high for a GK
        player.gk = 79;
        player.physical = 83;
        player.pace = 68;
        player.potential = 86;
        player.exactOvr = 78.0;
        player.playstyle = 'ビルドアップ型GK';
      }

      addPlayerIfUnique(player);
    });
  });

  // 3. First load all authentic J-League players (J1 and J2 authentic rosters)
  let baseRegistry = registry;
  if (ENABLE_J_LEAGUE) {
    baseRegistry = generateFullJLeaguePlayers(baseRegistry);
  }

  // 4. Ensure all clubs (all 96 European clubs + all 20 J1 clubs + all 20 J2 clubs) have at least 25 players across positions
  const allClubsToEnsure: Club[] = [
    ...ALL_CLUBS,
    ...(ENABLE_J_LEAGUE ? J2_20_CLUBS : [])
  ];

  // Deduplicate clubs by id
  const uniqueClubsMap = new Map<string, Club>();
  allClubsToEnsure.forEach(c => uniqueClubsMap.set(c.id, c));
  const uniqueClubs = Array.from(uniqueClubsMap.values());

  uniqueClubs.forEach((club, clubIdx) => {
    const existing = Object.values(baseRegistry).filter(p => p.clubId === club.id);
    const needed = Math.max(0, 25 - existing.length);

    if (needed > 0) {
      const isJapan = club.country === '日本';
      const depthData = DEPTH_NAMES_BY_COUNTRY[club.country] || DEPTH_NAMES_BY_COUNTRY['イングランド'];
      const tierBaseOvr = isJapan
        ? (club.league === 'j1-league' ? 73 : 69)
        : (club.tier === 'Elite' ? 80 : club.tier === 'Upper' ? 76 : club.tier === 'Mid' ? 72 : 68);

      for (let i = 0; i < needed; i++) {
        const pos = SQUAD_POSITIONS_TEMPLATE[(existing.length + i) % SQUAD_POSITIONS_TEMPLATE.length];
        
        // Generate authentic full name (Surname First for Japanese players)
        const fName = depthData.firstNames[(clubIdx * 5 + i * 2) % depthData.firstNames.length];
        const lName = depthData.lastNames[(clubIdx * 7 + i * 3) % depthData.lastNames.length];
        const uniqueFullName = isJapan ? `${lName} ${fName}` : `${fName} ${lName}`;
        const pId = `p_${club.id}_depth_${existing.length + i + 1}`;

        // Distribute age across the 6 specified brackets (16-19, 20-23, 24-28, 29-32, 33-36, 37+)
        const age = SPEC_AGE_DISTRIBUTION[(clubIdx * 4 + i) % SPEC_AGE_DISTRIBUTION.length];
        
        // Realistic OVR based on age and club tier
        let ovrModifier = (i % 3) - 1;
        if (age <= 19) ovrModifier -= 4; // Young prospects have raw OVR but high potential
        else if (age <= 22) ovrModifier -= 1;
        else if (age >= 34) ovrModifier -= 1;

        const ovr = Math.max(62, Math.min(84, tierBaseOvr + ovrModifier));
        
        // Potential calculation based on age
        const potential = age <= 19 
          ? Math.min(94, ovr + 8 + (i % 6))
          : age <= 23 
            ? Math.min(91, ovr + 4 + (i % 4))
            : age <= 28 
              ? Math.max(ovr, ovr + (i % 2))
              : ovr;

        const player = makeRealPlayer(
          pId,
          uniqueFullName,
          club.id,
          pos,
          age,
          club.country,
          ovr,
          potential,
          isJapan
            ? (club.league === 'j1-league' ? 800000 : 450000)
            : (club.tier === 'Elite' ? 16000000 : club.tier === 'Upper' ? 8000000 : 2500000),
          isJapan
            ? (club.league === 'j1-league' ? 14000 : 9000)
            : (club.tier === 'Elite' ? 55000 : club.tier === 'Upper' ? 30000 : 12000),
          26 + ((i * 3) % 65),
          i % 3 === 0 ? '左' : '右',
          pos === 'GK' ? 'ショットストッパー' : pos === 'CB' ? 'ボール運べるCB' : 'チャンスメイカー'
        );

        if (!baseRegistry[player.id]) {
          baseRegistry[player.id] = player;
        }
      }
    }
  });

  return baseRegistry;
}

export function populateClubsWithDefaultSquads(
  clubs: Record<string, Club>, 
  playersRegistry: Record<string, Player>
): { clubs: Record<string, Club>; players: Record<string, Player> } {
  // First run automated data integrity check
  const { players: cleanPlayers, clubs: cleanClubs } = checkPlayerDataIntegrity(playersRegistry, clubs);

  // Sync club.playerIds strictly from cleanPlayers
  Object.values(cleanClubs).forEach(club => {
    club.playerIds = [];
  });

  Object.values(cleanPlayers).forEach(p => {
    if (cleanClubs[p.clubId]) {
      if (!cleanClubs[p.clubId].playerIds.includes(p.id)) {
        cleanClubs[p.clubId].playerIds.push(p.id);
      }
    }
  });

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
