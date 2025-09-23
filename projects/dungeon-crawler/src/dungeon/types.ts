export const CellTypes = {
  Wall: 'wall',
  Floor: 'floor',
  Exit: 'exit',
} as const;
export type CellType = typeof CellTypes[keyof typeof CellTypes];

export const TrapTypes = {
  Spikes: 'spikes',
  Blade: 'blade',
  Darts: 'darts',
} as const;
export type TrapType = typeof TrapTypes[keyof typeof TrapTypes];

export const LootTypes = {
  Coin: 'coin',
  Potion: 'potion',
} as const;
export type LootType = typeof LootTypes[keyof typeof LootTypes];

export interface DungeonCell {
  type: CellType;
  trap?: TrapType;
  trapTriggered?: boolean;
  loot?: LootType;
  occupied?: boolean;
  discovered?: boolean;
}

export interface Room {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface DungeonData {
  width: number;
  height: number;
  cells: DungeonCell[];
  rooms: Room[];
  start: { x: number; y: number };
  exit: { x: number; y: number };
  enemySpawns: Array<{ x: number; y: number }>;
  lootSpawns: Array<{ x: number; y: number; loot: LootType }>;
  trapSpawns: Array<{ x: number; y: number; trap: TrapType }>;
}

export interface DungeonConfig {
  width: number;
  height: number;
  walkLength: number;
  roomChance: number;
  minRoomSize: number;
  maxRoomSize: number;
}
