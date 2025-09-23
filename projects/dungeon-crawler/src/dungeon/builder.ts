import * as THREE from 'three';
import type { DungeonData } from './types';
import { CellTypes } from './types';

export interface DungeonVisuals {
  group: THREE.Group;
  wallColliderTransforms: Array<{ x: number; y: number; z: number; sx: number; sy: number; sz: number }>;
  floorPositions: Array<{ x: number; y: number }>;
}

const CELL_SIZE = 1;
const WALL_HEIGHT = 2.6;

export class DungeonBuilder {
  build(data: DungeonData): DungeonVisuals {
    const group = new THREE.Group();
    const wallColliderTransforms: Array<{ x: number; y: number; z: number; sx: number; sy: number; sz: number }> = [];
    const floorPositions: Array<{ x: number; y: number }> = [];

    const floorCells: Array<{ x: number; y: number; isExit: boolean }> = [];
    const wallCells: Array<{ x: number; y: number }> = [];

    const { width, height, cells } = data;
    const idx = (x: number, y: number) => x + y * width;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const cell = cells[idx(x, y)];
        if (cell.type === CellTypes.Floor || cell.type === CellTypes.Exit) {
          floorCells.push({ x, y, isExit: cell.type === CellTypes.Exit });
          continue;
        }
        if (cell.type === CellTypes.Wall) {
          const neighbours = this.hasAdjacentFloor(x, y, data);
          if (neighbours) {
            wallCells.push({ x, y });
          }
        }
      }
    }

    const floorGeometry = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE);
    floorGeometry.rotateX(-Math.PI / 2);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x2e3542, roughness: 0.85, metalness: 0.05 });

    const floorMesh = new THREE.InstancedMesh(floorGeometry, floorMaterial, floorCells.length);
    floorMesh.receiveShadow = true;

    const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1f29, roughness: 0.9, metalness: 0.02 });
    const ceilingMesh = new THREE.InstancedMesh(floorGeometry.clone(), ceilingMaterial, floorCells.length);

    const wallGeometry = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x131821, roughness: 0.8 });
    const wallMesh = new THREE.InstancedMesh(wallGeometry, wallMaterial, wallCells.length);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;

    const matrix = new THREE.Matrix4();

    floorCells.forEach((cell, index) => {
      const worldX = cell.x * CELL_SIZE + CELL_SIZE / 2;
      const worldZ = cell.y * CELL_SIZE + CELL_SIZE / 2;
      matrix.makeTranslation(worldX, 0, worldZ);
      floorMesh.setMatrixAt(index, matrix);
      if (cell.isExit) {
        const emissiveMaterial = floorMaterial.clone();
        emissiveMaterial.emissive = new THREE.Color(0x194d82);
        emissiveMaterial.emissiveIntensity = 0.8;
        const exitPlane = new THREE.Mesh(floorGeometry, emissiveMaterial);
        exitPlane.position.set(worldX, 0.01, worldZ);
        exitPlane.receiveShadow = false;
        group.add(exitPlane);
      }
      ceilingMesh.setMatrixAt(index, matrix.clone().setPosition(worldX, WALL_HEIGHT, worldZ));
      floorPositions.push({ x: cell.x, y: cell.y });
    });
    floorMesh.instanceMatrix.needsUpdate = true;
    ceilingMesh.instanceMatrix.needsUpdate = true;

    wallCells.forEach((cell, index) => {
      const worldX = cell.x * CELL_SIZE + CELL_SIZE / 2;
      const worldZ = cell.y * CELL_SIZE + CELL_SIZE / 2;
      matrix.makeTranslation(worldX, WALL_HEIGHT / 2, worldZ);
      wallMesh.setMatrixAt(index, matrix);
      wallColliderTransforms.push({ x: worldX, y: WALL_HEIGHT / 2, z: worldZ, sx: CELL_SIZE / 2, sy: WALL_HEIGHT / 2, sz: CELL_SIZE / 2 });
    });
    wallMesh.instanceMatrix.needsUpdate = true;

    group.add(floorMesh);
    group.add(ceilingMesh);
    group.add(wallMesh);

    return {
      group,
      wallColliderTransforms,
      floorPositions,
    };
  }

  private hasAdjacentFloor(x: number, y: number, data: DungeonData): boolean {
    const { width, height, cells } = data;
    const idx = (cx: number, cy: number) => cx + cy * width;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
        continue;
      }
      const cell = cells[idx(nx, ny)];
      if (cell.type === CellTypes.Floor || cell.type === CellTypes.Exit) {
        return true;
      }
    }
    return false;
  }
}
