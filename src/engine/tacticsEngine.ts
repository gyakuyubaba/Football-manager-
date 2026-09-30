import { Position, FormationName, TeamTactics, Player } from '../types/game';

export interface FormationSlot {
  position: Position;
  pitchX: number; // 0 (left) to 100 (right)
  pitchY: number; // 0 (attack) to 100 (defense/GK)
}

// Coordinate system: X: 0-100 (horizontal), Y: 0 (opponent goal) - 90 (defense) - 95 (GK)
export const FORMATION_TEMPLATES: Record<FormationName, FormationSlot[]> = {
  '4-3-3': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CDM', pitchX: 50, pitchY: 60 },
    { position: 'CM', pitchX: 68, pitchY: 48 },
    { position: 'CM', pitchX: 32, pitchY: 48 },
    { position: 'RW', pitchX: 82, pitchY: 22 },
    { position: 'ST', pitchX: 50, pitchY: 16 },
    { position: 'LW', pitchX: 18, pitchY: 22 }
  ],
  '4-3-3 Holding': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CDM', pitchX: 62, pitchY: 62 },
    { position: 'CDM', pitchX: 38, pitchY: 62 },
    { position: 'CAM', pitchX: 50, pitchY: 40 },
    { position: 'RW', pitchX: 82, pitchY: 22 },
    { position: 'ST', pitchX: 50, pitchY: 16 },
    { position: 'LW', pitchX: 18, pitchY: 22 }
  ],
  '4-3-3 Defensive': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CDM', pitchX: 64, pitchY: 66 },
    { position: 'CDM', pitchX: 50, pitchY: 62 },
    { position: 'CDM', pitchX: 36, pitchY: 66 },
    { position: 'RW', pitchX: 82, pitchY: 24 },
    { position: 'ST', pitchX: 50, pitchY: 16 },
    { position: 'LW', pitchX: 18, pitchY: 24 }
  ],
  '4-3-3 Attacking': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CM', pitchX: 50, pitchY: 58 },
    { position: 'CAM', pitchX: 66, pitchY: 40 },
    { position: 'CAM', pitchX: 34, pitchY: 40 },
    { position: 'RW', pitchX: 84, pitchY: 20 },
    { position: 'ST', pitchX: 50, pitchY: 15 },
    { position: 'LW', pitchX: 16, pitchY: 20 }
  ],
  '4-1-2-3': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CDM', pitchX: 50, pitchY: 64 },
    { position: 'CM', pitchX: 65, pitchY: 48 },
    { position: 'CM', pitchX: 35, pitchY: 48 },
    { position: 'RW', pitchX: 82, pitchY: 22 },
    { position: 'ST', pitchX: 50, pitchY: 16 },
    { position: 'LW', pitchX: 18, pitchY: 22 }
  ],
  '4-2-4': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CM', pitchX: 62, pitchY: 54 },
    { position: 'CM', pitchX: 38, pitchY: 54 },
    { position: 'RW', pitchX: 86, pitchY: 22 },
    { position: 'ST', pitchX: 60, pitchY: 16 },
    { position: 'ST', pitchX: 40, pitchY: 16 },
    { position: 'LW', pitchX: 14, pitchY: 22 }
  ],
  '4-2-3-1': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CDM', pitchX: 62, pitchY: 62 },
    { position: 'CDM', pitchX: 38, pitchY: 62 },
    { position: 'CAM', pitchX: 50, pitchY: 38 },
    { position: 'RW', pitchX: 82, pitchY: 34 },
    { position: 'LW', pitchX: 18, pitchY: 34 },
    { position: 'ST', pitchX: 50, pitchY: 16 }
  ],
  '4-4-2': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'RM', pitchX: 84, pitchY: 48 },
    { position: 'CM', pitchX: 62, pitchY: 52 },
    { position: 'CM', pitchX: 38, pitchY: 52 },
    { position: 'LM', pitchX: 16, pitchY: 48 },
    { position: 'ST', pitchX: 60, pitchY: 18 },
    { position: 'ST', pitchX: 40, pitchY: 18 }
  ],
  '4-4-1-1': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'RM', pitchX: 84, pitchY: 48 },
    { position: 'CM', pitchX: 62, pitchY: 54 },
    { position: 'CM', pitchX: 38, pitchY: 54 },
    { position: 'LM', pitchX: 16, pitchY: 48 },
    { position: 'CAM', pitchX: 50, pitchY: 34 },
    { position: 'ST', pitchX: 50, pitchY: 16 }
  ],
  '4-1-4-1': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CDM', pitchX: 50, pitchY: 64 },
    { position: 'RM', pitchX: 84, pitchY: 42 },
    { position: 'CM', pitchX: 62, pitchY: 46 },
    { position: 'CM', pitchX: 38, pitchY: 46 },
    { position: 'LM', pitchX: 16, pitchY: 42 },
    { position: 'ST', pitchX: 50, pitchY: 16 }
  ],
  '4-2-2-2': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CDM', pitchX: 62, pitchY: 62 },
    { position: 'CDM', pitchX: 38, pitchY: 62 },
    { position: 'CAM', pitchX: 72, pitchY: 38 },
    { position: 'CAM', pitchX: 28, pitchY: 38 },
    { position: 'ST', pitchX: 60, pitchY: 18 },
    { position: 'ST', pitchX: 40, pitchY: 18 }
  ],
  '4-3-1-2': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CM', pitchX: 70, pitchY: 56 },
    { position: 'CDM', pitchX: 50, pitchY: 62 },
    { position: 'CM', pitchX: 30, pitchY: 56 },
    { position: 'CAM', pitchX: 50, pitchY: 36 },
    { position: 'ST', pitchX: 60, pitchY: 18 },
    { position: 'ST', pitchX: 40, pitchY: 18 }
  ],
  '4-3-2-1': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RB', pitchX: 85, pitchY: 76 },
    { position: 'CB', pitchX: 63, pitchY: 80 },
    { position: 'CB', pitchX: 37, pitchY: 80 },
    { position: 'LB', pitchX: 15, pitchY: 76 },
    { position: 'CM', pitchX: 72, pitchY: 56 },
    { position: 'CDM', pitchX: 50, pitchY: 62 },
    { position: 'CM', pitchX: 28, pitchY: 56 },
    { position: 'CAM', pitchX: 62, pitchY: 35 },
    { position: 'CAM', pitchX: 38, pitchY: 35 },
    { position: 'ST', pitchX: 50, pitchY: 16 }
  ],
  '3-5-2': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'CB', pitchX: 72, pitchY: 78 },
    { position: 'CB', pitchX: 50, pitchY: 82 },
    { position: 'CB', pitchX: 28, pitchY: 78 },
    { position: 'RWB', pitchX: 88, pitchY: 52 },
    { position: 'CDM', pitchX: 60, pitchY: 62 },
    { position: 'CDM', pitchX: 40, pitchY: 62 },
    { position: 'CAM', pitchX: 50, pitchY: 40 },
    { position: 'LWB', pitchX: 12, pitchY: 52 },
    { position: 'ST', pitchX: 60, pitchY: 18 },
    { position: 'ST', pitchX: 40, pitchY: 18 }
  ],
  '3-4-3': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'CB', pitchX: 72, pitchY: 78 },
    { position: 'CB', pitchX: 50, pitchY: 82 },
    { position: 'CB', pitchX: 28, pitchY: 78 },
    { position: 'RM', pitchX: 88, pitchY: 50 },
    { position: 'CM', pitchX: 62, pitchY: 54 },
    { position: 'CM', pitchX: 38, pitchY: 54 },
    { position: 'LM', pitchX: 12, pitchY: 50 },
    { position: 'RW', pitchX: 80, pitchY: 22 },
    { position: 'ST', pitchX: 50, pitchY: 16 },
    { position: 'LW', pitchX: 20, pitchY: 22 }
  ],
  '3-4-2-1': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'CB', pitchX: 72, pitchY: 78 },
    { position: 'CB', pitchX: 50, pitchY: 82 },
    { position: 'CB', pitchX: 28, pitchY: 78 },
    { position: 'RWB', pitchX: 88, pitchY: 50 },
    { position: 'CM', pitchX: 62, pitchY: 56 },
    { position: 'CM', pitchX: 38, pitchY: 56 },
    { position: 'LWB', pitchX: 12, pitchY: 50 },
    { position: 'CAM', pitchX: 64, pitchY: 34 },
    { position: 'CAM', pitchX: 36, pitchY: 34 },
    { position: 'ST', pitchX: 50, pitchY: 16 }
  ],
  '3-4-1-2': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'CB', pitchX: 72, pitchY: 78 },
    { position: 'CB', pitchX: 50, pitchY: 82 },
    { position: 'CB', pitchX: 28, pitchY: 78 },
    { position: 'RM', pitchX: 88, pitchY: 50 },
    { position: 'CM', pitchX: 62, pitchY: 56 },
    { position: 'CM', pitchX: 38, pitchY: 56 },
    { position: 'LM', pitchX: 12, pitchY: 50 },
    { position: 'CAM', pitchX: 50, pitchY: 36 },
    { position: 'ST', pitchX: 60, pitchY: 18 },
    { position: 'ST', pitchX: 40, pitchY: 18 }
  ],
  '3-1-4-2': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'CB', pitchX: 72, pitchY: 78 },
    { position: 'CB', pitchX: 50, pitchY: 82 },
    { position: 'CB', pitchX: 28, pitchY: 78 },
    { position: 'CDM', pitchX: 50, pitchY: 66 },
    { position: 'RM', pitchX: 88, pitchY: 48 },
    { position: 'CM', pitchX: 64, pitchY: 46 },
    { position: 'CM', pitchX: 36, pitchY: 46 },
    { position: 'LM', pitchX: 12, pitchY: 48 },
    { position: 'ST', pitchX: 60, pitchY: 18 },
    { position: 'ST', pitchX: 40, pitchY: 18 }
  ],
  '3-2-4-1': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'CB', pitchX: 72, pitchY: 78 },
    { position: 'CB', pitchX: 50, pitchY: 82 },
    { position: 'CB', pitchX: 28, pitchY: 78 },
    { position: 'CDM', pitchX: 62, pitchY: 64 },
    { position: 'CDM', pitchX: 38, pitchY: 64 },
    { position: 'RM', pitchX: 88, pitchY: 42 },
    { position: 'CAM', pitchX: 64, pitchY: 36 },
    { position: 'CAM', pitchX: 36, pitchY: 36 },
    { position: 'LM', pitchX: 12, pitchY: 42 },
    { position: 'ST', pitchX: 50, pitchY: 16 }
  ],
  '5-3-2': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RWB', pitchX: 88, pitchY: 70 },
    { position: 'CB', pitchX: 68, pitchY: 80 },
    { position: 'CB', pitchX: 50, pitchY: 84 },
    { position: 'CB', pitchX: 32, pitchY: 80 },
    { position: 'LWB', pitchX: 12, pitchY: 70 },
    { position: 'CM', pitchX: 70, pitchY: 50 },
    { position: 'CDM', pitchX: 50, pitchY: 58 },
    { position: 'CM', pitchX: 30, pitchY: 50 },
    { position: 'ST', pitchX: 60, pitchY: 18 },
    { position: 'ST', pitchX: 40, pitchY: 18 }
  ],
  '5-4-1': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RWB', pitchX: 88, pitchY: 70 },
    { position: 'CB', pitchX: 68, pitchY: 80 },
    { position: 'CB', pitchX: 50, pitchY: 84 },
    { position: 'CB', pitchX: 32, pitchY: 80 },
    { position: 'LWB', pitchX: 12, pitchY: 70 },
    { position: 'RM', pitchX: 84, pitchY: 46 },
    { position: 'CM', pitchX: 62, pitchY: 52 },
    { position: 'CM', pitchX: 38, pitchY: 52 },
    { position: 'LM', pitchX: 16, pitchY: 46 },
    { position: 'ST', pitchX: 50, pitchY: 18 }
  ],
  '5-2-3': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RWB', pitchX: 88, pitchY: 68 },
    { position: 'CB', pitchX: 68, pitchY: 80 },
    { position: 'CB', pitchX: 50, pitchY: 84 },
    { position: 'CB', pitchX: 32, pitchY: 80 },
    { position: 'LWB', pitchX: 12, pitchY: 68 },
    { position: 'CM', pitchX: 62, pitchY: 52 },
    { position: 'CM', pitchX: 38, pitchY: 52 },
    { position: 'RW', pitchX: 80, pitchY: 24 },
    { position: 'ST', pitchX: 50, pitchY: 16 },
    { position: 'LW', pitchX: 20, pitchY: 24 }
  ],
  '5-3-1-1': [
    { position: 'GK', pitchX: 50, pitchY: 92 },
    { position: 'RWB', pitchX: 88, pitchY: 70 },
    { position: 'CB', pitchX: 68, pitchY: 80 },
    { position: 'CB', pitchX: 50, pitchY: 84 },
    { position: 'CB', pitchX: 32, pitchY: 80 },
    { position: 'LWB', pitchX: 12, pitchY: 70 },
    { position: 'CM', pitchX: 70, pitchY: 52 },
    { position: 'CDM', pitchX: 50, pitchY: 58 },
    { position: 'CM', pitchX: 30, pitchY: 52 },
    { position: 'CAM', pitchX: 50, pitchY: 34 },
    { position: 'ST', pitchX: 50, pitchY: 16 }
  ]
};

// Calculate Positional Suitability and Effective OVR
export function getPositionFitOvr(player: Player, targetPosition: Position): {
  effectiveOvr: number;
  penalty: number;
  fitGrade: 'S' | 'A' | 'B' | 'C' | 'D';
} {
  // 1. Natural match
  if (player.position === targetPosition) {
    return { effectiveOvr: player.ovr, penalty: 0, fitGrade: 'S' };
  }

  // 2. Listed in alternative positions
  if (player.altPositions && player.altPositions.includes(targetPosition)) {
    const penalty = 2;
    return { effectiveOvr: Math.max(40, player.ovr - penalty), penalty, fitGrade: 'A' };
  }

  // 3. Closely related tactical roles
  const relatedGroups: Record<Position, Position[]> = {
    GK: [],
    CB: ['LB', 'RB', 'CDM'],
    LB: ['LWB', 'CB', 'LM'],
    RB: ['RWB', 'CB', 'RM'],
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

  if (relatedGroups[player.position]?.includes(targetPosition)) {
    const penalty = 4;
    return { effectiveOvr: Math.max(40, player.ovr - penalty), penalty, fitGrade: 'B' };
  }

  // 4. Same field category (Defenders, Midfielders, Forwards)
  const isDef = (pos: Position) => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos);
  const isMid = (pos: Position) => ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos);
  const isFwd = (pos: Position) => ['LW', 'RW', 'CF', 'ST'].includes(pos);

  if ((isDef(player.position) && isDef(targetPosition)) ||
      (isMid(player.position) && isMid(targetPosition)) ||
      (isFwd(player.position) && isFwd(targetPosition))) {
    const penalty = 8;
    return { effectiveOvr: Math.max(40, player.ovr - penalty), penalty, fitGrade: 'C' };
  }

  // 5. Severe positional mismatch (e.g. ST at CB, or outfield at GK)
  const penalty = targetPosition === 'GK' || player.position === 'GK' ? 32 : 18;
  return { effectiveOvr: Math.max(35, player.ovr - penalty), penalty, fitGrade: 'D' };
}

// Generate updated tactics when changing formation
export function updateTacticsFormation(currentTactics: TeamTactics, newFormation: FormationName): TeamTactics {
  const template = FORMATION_TEMPLATES[newFormation];
  if (!template) return currentTactics;

  const currentStarters = [...currentTactics.lineup.starters];
  const newStarters = template.map((slot, index) => {
    const existingPlayer = currentStarters[index];
    return {
      playerId: existingPlayer?.playerId || '',
      position: slot.position,
      pitchX: slot.pitchX,
      pitchY: slot.pitchY
    };
  });

  return {
    ...currentTactics,
    formation: newFormation,
    lineup: {
      ...currentTactics.lineup,
      starters: newStarters
    }
  };
}
