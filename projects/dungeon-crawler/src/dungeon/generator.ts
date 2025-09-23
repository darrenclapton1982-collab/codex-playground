import { createNoise2D, type NoiseFunction2D } from 'simplex-noise';
import type { DungeonCell, DungeonConfig, DungeonData, Room, LootType, TrapType } from './types';
import { CellTypes, LootTypes, TrapTypes } from './types';

const directions = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class DungeonGenerator {
  private readonly noise2D: NoiseFunction2D;
  private readonly config: DungeonConfig;

  constructor(config: Partial<DungeonConfig> = {}, seed?: string) {
    this.config = {
      width: config.width ?? 48,
      height: config.height ?? 48,
      walkLength: config.walkLength ?? 2800,
      roomChance: config.roomChance ?? 0.18,
      minRoomSize: config.minRoomSize ?? 4,
      maxRoomSize: config.maxRoomSize ?? 10,
    };
    const randomFn = seed ? this.createSeededRandom(seed) : Math.random;
    this.noise2D = createNoise2D(randomFn);
  }

  generate(level: number): DungeonData {
    const { width, height } = this.config;
    const totalCells = width * height;
    const cells: DungeonCell[] = Array.from({ length: totalCells }, () => ({ type: CellTypes.Wall }));
    const rooms: Room[] = [];

    const walker = {
      x: Math.floor(width / 2),
      y: Math.floor(height / 2),
    };

    const floorSet = new Set<string>();
    const key = (x: number, y: number) => x + ',' + y;
    const idx = (x: number, y: number) => x + y * width;

    const carve = (x: number, y: number) => {
      const index = idx(x, y);
      const cell = cells[index];
      if (cell.type !== CellTypes.Floor) {
        cell.type = CellTypes.Floor;
      }
      floorSet.add(key(x, y));
    };

    const carveRoom = (cx: number, cy: number, sizeNoise: number) => {
      const maxRoom = this.config.maxRoomSize;
      const minRoom = this.config.minRoomSize;
      const sizeVariance = ((sizeNoise + 1) / 2) * (maxRoom - minRoom);
      const roomWidth = Math.round(clamp(minRoom + sizeVariance, minRoom, maxRoom));
      const roomHeight = Math.round(
        clamp(minRoom + ((1 - sizeNoise) / 2) * (maxRoom - minRoom), minRoom, maxRoom)
      );

      const halfW = Math.floor(roomWidth / 2);
      const halfH = Math.floor(roomHeight / 2);

      const startX = clamp(cx - halfW, 1, width - 2);
      const endX = clamp(cx + halfW, 1, width - 2);
      const startY = clamp(cy - halfH, 1, height - 2);
      const endY = clamp(cy + halfH, 1, height - 2);

      rooms.push({
        id: rooms.length,
        x: startX,
        y: startY,
        width: endX - startX + 1,
        height: endY - startY + 1,
        centerX: cx,
        centerY: cy,
      });

      for (let y = startY; y <= endY; y += 1) {
        for (let x = startX; x <= endX; x += 1) {
          carve(x, y);
        }
      }
    };

    const steps = Math.round(this.config.walkLength * (1 + level * 0.15));
    carve(walker.x, walker.y);

    for (let step = 0; step < steps; step += 1) {
      const turnNoise = this.noise2D(walker.x * 0.15, walker.y * 0.15 + step * 0.01);
      const dirIndex = clamp(Math.floor(((turnNoise + 1) / 2) * directions.length), 0, directions.length - 1);
      const dir = directions[dirIndex];

      walker.x = clamp(walker.x + dir.x, 1, width - 2);
      walker.y = clamp(walker.y + dir.y, 1, height - 2);

      carve(walker.x, walker.y);

      const roomRoll = Math.random();
      const noiseRoll = this.noise2D(walker.x * 0.2, walker.y * 0.2 + step * 0.05);
      if (roomRoll < this.config.roomChance + noiseRoll * 0.1) {
        carveRoom(walker.x, walker.y, noiseRoll);
      }
    }

    const floorCells = Array.from(floorSet).map((position) => {
      const parts = position.split(',');
      return { x: Number(parts[0]), y: Number(parts[1]) };
    });

    const startCell = floorCells[0] ?? { x: Math.floor(width / 2), y: Math.floor(height / 2) };
    const farthestA = this.findFarthestCell(startCell, width, height, cells);
    const farthestB = this.findFarthestCell(farthestA, width, height, cells);

    const start = farthestA;
    const exit = farthestB;

    cells[idx(exit.x, exit.y)].type = CellTypes.Exit;

    const levelIntensity = 0.05 + level * 0.02;
    const trapSpawns: Array<{ x: number; y: number; trap: TrapType }> = [];
    const lootSpawns: Array<{ x: number; y: number; loot: LootType }> = [];
    const enemySpawns: Array<{ x: number; y: number }> = [];

    const available = floorCells.filter((cell) => !(cell.x === start.x && cell.y === start.y));
    const exitKey = key(exit.x, exit.y);

    const trapTarget = Math.min(
      available.length,
      Math.round(available.length * clamp(levelIntensity, 0.05, 0.28))
    );
    const lootTarget = Math.max(2, Math.round(available.length * clamp(0.08 - level * 0.01, 0.02, 0.1)));
    const enemyTarget = clamp(Math.round(rooms.length * 0.7 + level * 1.5), 3, Math.max(5, rooms.length + level));

    for (const cell of available) {
      const cellNoise = this.noise2D(cell.x * 0.3, cell.y * 0.3);
      const cellKey = key(cell.x, cell.y);
      if (cellKey === exitKey) {
        continue;
      }
      if (trapSpawns.length < trapTarget && Math.abs(cellNoise) > 0.55 && Math.random() < 0.35) {
        const trapPool = Object.values(TrapTypes);
        const index = Math.floor(((cellNoise + 1) / 2) * trapPool.length) % trapPool.length;
        const trap = trapPool[index];
        trapSpawns.push({ x: cell.x, y: cell.y, trap });
        cells[idx(cell.x, cell.y)].trap = trap;
        continue;
      }
      if (lootSpawns.length < lootTarget && cellNoise > 0 && Math.random() < 0.3) {
        const loot = cellNoise > 0.65 ? LootTypes.Potion : LootTypes.Coin;
        lootSpawns.push({ x: cell.x, y: cell.y, loot });
        cells[idx(cell.x, cell.y)].loot = loot;
        continue;
      }
      if (enemySpawns.length < enemyTarget && Math.random() < 0.15) {
        enemySpawns.push({ x: cell.x, y: cell.y });
      }
    }

    return {
      width,
      height,
      cells,
      rooms,
      start,
      exit,
      enemySpawns,
      lootSpawns,
      trapSpawns,
    };
  }

  private findFarthestCell(
    origin: { x: number; y: number },
    width: number,
    height: number,
    cells: DungeonCell[]
  ): { x: number; y: number } {
    const idx = (x: number, y: number) => x + y * width;
    const distances = new Array(width * height).fill(Number.POSITIVE_INFINITY);
    const queue: Array<{ x: number; y: number }> = [];

    distances[idx(origin.x, origin.y)] = 0;
    queue.push({ ...origin });

    let farthest = { ...origin };

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentIndex = idx(current.x, current.y);
      const currentDistance = distances[currentIndex];

      for (const dir of directions) {
        const nx = current.x + dir.x;
        const ny = current.y + dir.y;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
          continue;
        }
        const neighbourIndex = idx(nx, ny);
        const neighbour = cells[neighbourIndex];
        if (neighbour.type === CellTypes.Wall) {
          continue;
        }
        if (distances[neighbourIndex] > currentDistance + 1) {
          distances[neighbourIndex] = currentDistance + 1;
          queue.push({ x: nx, y: ny });
          if (distances[neighbourIndex] > distances[idx(farthest.x, farthest.y)]) {
            farthest = { x: nx, y: ny };
          }
        }
      }
    }

    return farthest;
  }

  private createSeededRandom(seed: string): () => number {
    let hash = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i += 1) {
      hash = Math.imul(hash ^ seed.charCodeAt(i), 3432918353);
      hash = (hash << 13) | (hash >>> 19);
    }
    return () => {
      hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
      hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
      const result = (hash ^= hash >>> 16) >>> 0;
      return (result & 0xfffffff) / 0x10000000;
    };
  }
}
