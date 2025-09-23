export class SpatialHash {
  constructor(cellSize = 50) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  _cellKey(x, z) {
    const ix = Math.floor(x / this.cellSize);
    const iz = Math.floor(z / this.cellSize);
    return `${ix}:${iz}`;
  }

  insert(item, bounds) {
    const { minX, maxX, minZ, maxZ } = bounds;
    for (let x = Math.floor(minX / this.cellSize); x <= Math.floor(maxX / this.cellSize); x += 1) {
      for (let z = Math.floor(minZ / this.cellSize); z <= Math.floor(maxZ / this.cellSize); z += 1) {
        const key = `${x}:${z}`;
        if (!this.cells.has(key)) {
          this.cells.set(key, new Set());
        }
        this.cells.get(key).add(item);
      }
    }
  }

  remove(item, bounds) {
    const { minX, maxX, minZ, maxZ } = bounds;
    for (let x = Math.floor(minX / this.cellSize); x <= Math.floor(maxX / this.cellSize); x += 1) {
      for (let z = Math.floor(minZ / this.cellSize); z <= Math.floor(maxZ / this.cellSize); z += 1) {
        const key = `${x}:${z}`;
        const bucket = this.cells.get(key);
        if (bucket) {
          bucket.delete(item);
          if (bucket.size === 0) {
            this.cells.delete(key);
          }
        }
      }
    }
  }

  queryRange(bounds) {
    const results = new Set();
    const { minX, maxX, minZ, maxZ } = bounds;
    for (let x = Math.floor(minX / this.cellSize); x <= Math.floor(maxX / this.cellSize); x += 1) {
      for (let z = Math.floor(minZ / this.cellSize); z <= Math.floor(maxZ / this.cellSize); z += 1) {
        const bucket = this.cells.get(`${x}:${z}`);
        if (bucket) {
          bucket.forEach((item) => results.add(item));
        }
      }
    }
    return Array.from(results);
  }
}
