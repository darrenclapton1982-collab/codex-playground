import { City, District, RoadSegment, Building, Park, WaterBody, TransitLine, BuildingCategory, DistrictType, RoadType } from "./city-data.js";
import { SpatialHash } from "./spatial-index.js";
import { createNoise, layeredNoise } from "../utils/noise.js";
import { createRng } from "../utils/prng.js";

const DEFAULT_OPTIONS = {
  width: 1600,
  height: 1600,
  blockSize: 40,
  districtClusterSize: 6,
  mainRoadSpacing: 240,
  secondaryRoadSpacing: 160,
  localRoadProbability: 0.2,
  parkProbability: 0.08,
  plazaProbability: 0.02,
  riverCurviness: 0.25,
  riverWidth: 120,
  transitSpacing: 320,
  suburbStartRadius: 0.45,
  ruralStartRadius: 0.7
};

export class CityGenerator {
  constructor(options = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  generate(seed, overrides = {}) {
    const options = { ...this.options, ...overrides };
    const effectiveSeed = seed ?? options.seed ?? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
    const rng = createRng(effectiveSeed.length > 15 ? effectiveSeed.length : effectiveSeed);

    const city = new City({
      width: options.width,
      height: options.height,
      cellSize: options.blockSize,
      seed: effectiveSeed
    });

    const baseNoise = createNoise(`${effectiveSeed}-base`);
    const districtNoise = createNoise(`${effectiveSeed}-district`);
    const variationNoise = createNoise(`${effectiveSeed}-variation`);
    const parkNoise = createNoise(`${effectiveSeed}-park`);
    const riverNoise = createNoise(`${effectiveSeed}-river`);

    const grid = this._initializeGrid(city, options);
    const districtMetadata = this._assignDistricts(grid, options, districtNoise, variationNoise);
    const riverDescriptor = this._carveWater(grid, options, riverNoise);
    const parkPatches = this._placeParks(grid, options, parkNoise, rng);
    const roadDescriptor = this._layRoads(grid, options, variationNoise, rng);
    const buildingResults = this._placeBuildings(grid, options, baseNoise, rng);
    this._addTransitLines(city, grid, options, roadDescriptor, rng);

    this._finalizeCity({
      city,
      grid,
      districtMetadata,
      riverDescriptor,
      parkPatches,
      roadDescriptor,
      buildingResults
    });

    return city;
  }

  _initializeGrid(city, options) {
    const cols = Math.floor(city.width / options.blockSize);
    const rows = Math.floor(city.height / options.blockSize);
    const halfWidth = city.width / 2;
    const halfHeight = city.height / 2;

    const cells = new Array(cols);
    for (let x = 0; x < cols; x += 1) {
      cells[x] = new Array(rows);
      for (let z = 0; z < rows; z += 1) {
        const worldX = -halfWidth + options.blockSize * (x + 0.5);
        const worldZ = -halfHeight + options.blockSize * (z + 0.5);
        cells[x][z] = {
          gridX: x,
          gridZ: z,
          worldX,
          worldZ,
          districtType: null,
          districtId: null,
          density: 0,
          amenities: 0,
          isRoad: false,
          roadType: null,
          isPark: false,
          isWater: false,
          isRiverBank: false,
          building: null
        };
      }
    }

    return {
      cols,
      rows,
      cells,
      cellSize: options.blockSize,
      halfWidth,
      halfHeight
    };
  }

  _assignDistricts(grid, options, districtNoise, variationNoise) {
    const { cols, rows, cells, halfWidth, halfHeight } = grid;
    const maxDistance = Math.hypot(halfWidth, halfHeight);
    const clusterSize = options.districtClusterSize;
    const districtMeta = new Map();
    let districtCounter = 0;

    for (let x = 0; x < cols; x += 1) {
      for (let z = 0; z < rows; z += 1) {
        const cell = cells[x][z];
        const distanceFromCenter = Math.hypot(cell.worldX, cell.worldZ) / maxDistance;
        const radialBias = 1 - distanceFromCenter;
        const noiseSample = layeredNoise(districtNoise, x * 0.05, z * 0.05, 5, 0.55, 1.8);
        const variationSample = layeredNoise(variationNoise, x * 0.09, z * 0.09, 3, 0.5, 2.1);
        let type = DistrictType.RESIDENTIAL;

        if (distanceFromCenter < 0.18) {
          type = DistrictType.DOWNTOWN;
        } else if (distanceFromCenter < 0.3) {
          type = noiseSample > 0.2 ? DistrictType.COMMERCIAL : DistrictType.DOWNTOWN;
        } else if (distanceFromCenter < options.suburbStartRadius) {
          type = noiseSample > 0.35 ? DistrictType.COMMERCIAL : DistrictType.RESIDENTIAL;
        } else if (distanceFromCenter < options.ruralStartRadius) {
          type = variationSample > 0.15 ? DistrictType.SUBURBAN : DistrictType.INDUSTRIAL;
        } else {
          type = noiseSample > -0.2 ? DistrictType.RURAL : DistrictType.PARKLAND;
        }

        if (Math.abs(noiseSample) > 0.55 && variationSample > 0.25 && type === DistrictType.RESIDENTIAL) {
          type = DistrictType.COMMERCIAL;
        }

        cell.districtType = type;
        cell.density = Math.max(0.1, radialBias + Math.abs(noiseSample) * 0.35);
        cell.amenities = Math.max(0, variationSample + 0.5);

        const clusterKey = `${type}-${Math.floor(x / clusterSize)}-${Math.floor(z / clusterSize)}`;
        if (!districtMeta.has(clusterKey)) {
          districtMeta.set(clusterKey, {
            id: `district-${districtCounter}`,
            type,
            minX: cell.worldX,
            maxX: cell.worldX,
            minZ: cell.worldZ,
            maxZ: cell.worldZ,
            cellCount: 0,
            densityTotal: 0,
            amenitiesTotal: 0
          });
          districtCounter += 1;
        }

        const meta = districtMeta.get(clusterKey);
        meta.minX = Math.min(meta.minX, cell.worldX);
        meta.maxX = Math.max(meta.maxX, cell.worldX);
        meta.minZ = Math.min(meta.minZ, cell.worldZ);
        meta.maxZ = Math.max(meta.maxZ, cell.worldZ);
        meta.cellCount += 1;
        meta.densityTotal += cell.density;
        meta.amenitiesTotal += cell.amenities;
        cell.districtId = meta.id;
      }
    }

    return districtMeta;
  }

  _carveWater(grid, options, riverNoise) {
    const { cols, rows, cells, cellSize, halfWidth } = grid;
    const riverPath = [];
    const riverCells = new Set();
    const widthInCells = Math.max(2, Math.round(options.riverWidth / cellSize));

    for (let x = 0; x < cols; x += 1) {
      const t = x / Math.max(1, cols - 1);
      const baseRow = rows / 2 + riverNoise.noise2D(t * 1.2, 0.2) * rows * options.riverCurviness;
      const centerRow = Math.max(0, Math.min(rows - 1, Math.round(baseRow)));
      const worldX = -halfWidth + cellSize * (x + 0.5);
      const worldZ = cells[x][centerRow].worldZ;
      riverPath.push({ x: worldX, z: worldZ });

      for (let offset = -widthInCells; offset <= widthInCells; offset += 1) {
        const zIndex = centerRow + offset;
        if (zIndex < 0 || zIndex >= rows) {
          continue;
        }
        const cell = cells[x][zIndex];
        const distance = Math.abs(offset) / widthInCells;
        if (distance <= 1) {
          cell.isWater = true;
          cell.districtType = DistrictType.WATERFRONT;
          riverCells.add(`${x}:${zIndex}`);
          const bankIndex = centerRow + Math.sign(offset) * (widthInCells + 1);
          if (bankIndex >= 0 && bankIndex < rows) {
            cells[x][bankIndex].districtType = DistrictType.WATERFRONT;
            cells[x][bankIndex].isRiverBank = true;
          }
        }
      }
    }

    return {
      path: riverPath,
      width: widthInCells * cellSize,
      cellKeys: riverCells
    };
  }

  _placeParks(grid, options, parkNoise, rng) {
    const { cols, rows, cells } = grid;
    const parkPatches = [];
    let parkId = 0;

    for (let x = 0; x < cols; x += 1) {
      for (let z = 0; z < rows; z += 1) {
        const cell = cells[x][z];
        if (cell.isWater || cell.isRoad) {
          continue;
        }

        const noiseSample = parkNoise.noise2D(x * 0.2, z * 0.2);
        const shouldCreatePark = noiseSample > (0.75 - options.parkProbability) || cell.districtType === DistrictType.PARKLAND;
        if (shouldCreatePark && rng() < options.parkProbability) {
          cell.isPark = true;
          parkPatches.push({
            id: `park-${parkId}`,
            center: { x: cell.worldX, z: cell.worldZ },
            cells: [{ x, z }],
            hasWater: rng() < 0.2
          });
          parkId += 1;
        }
      }
    }

    return parkPatches;
  }

  _layRoads(grid, options, variationNoise, rng) {
    const { cols, rows, cells, cellSize } = grid;
    const mainSpacingCells = Math.max(3, Math.round(options.mainRoadSpacing / cellSize));
    const secondarySpacingCells = Math.max(3, Math.round(options.secondaryRoadSpacing / cellSize));
    const roadCells = new Set();

    const centerCol = Math.floor(cols / 2);
    const centerRow = Math.floor(rows / 2);

    for (let x = 0; x < cols; x += 1) {
      const cell = cells[x][centerRow];
      cell.isRoad = true;
      cell.roadType = RoadType.HIGHWAY;
      roadCells.add(`${x}:${centerRow}`);
    }

    for (let z = 0; z < rows; z += 1) {
      const cell = cells[centerCol][z];
      cell.isRoad = true;
      cell.roadType = RoadType.HIGHWAY;
      roadCells.add(`${centerCol}:${z}`);
    }

    for (let x = 0; x < cols; x += 1) {
      for (let z = 0; z < rows; z += 1) {
        if (cells[x][z].isRoad || cells[x][z].isWater) {
          continue;
        }

        const majorCandidate = x % mainSpacingCells === 0 || z % mainSpacingCells === 0;
        if (majorCandidate && rng() < 0.85) {
          cells[x][z].isRoad = true;
          cells[x][z].roadType = RoadType.ARTERIAL;
          roadCells.add(`${x}:${z}`);
          continue;
        }

        const secondaryCandidate = x % secondarySpacingCells === 0 || z % secondarySpacingCells === 0;
        const localChance = options.localRoadProbability + Math.max(0, variationNoise.noise2D(x * 0.2, z * 0.2));
        if (secondaryCandidate && rng() < 0.65) {
          cells[x][z].isRoad = true;
          cells[x][z].roadType = RoadType.COLLECTOR;
          roadCells.add(`${x}:${z}`);
        } else if (rng() < localChance * 0.35) {
          cells[x][z].isRoad = true;
          cells[x][z].roadType = RoadType.LOCAL;
          roadCells.add(`${x}:${z}`);
        }
      }
    }

    return { roadCells };
  }

  _selectBuildingCategory(districtType, rng) {
    switch (districtType) {
      case DistrictType.DOWNTOWN:
        return rng() < 0.6 ? BuildingCategory.SKYSCRAPER : BuildingCategory.OFFICE;
      case DistrictType.COMMERCIAL:
        return rng() < 0.5 ? BuildingCategory.COMMERCIAL : BuildingCategory.OFFICE;
      case DistrictType.INDUSTRIAL:
        return rng() < 0.6 ? BuildingCategory.FACTORY : BuildingCategory.WAREHOUSE;
      case DistrictType.SUBURBAN:
        return rng() < 0.5 ? BuildingCategory.HOUSE : BuildingCategory.CONDO;
      case DistrictType.RURAL:
        return rng() < 0.7 ? BuildingCategory.HOUSE : BuildingCategory.WAREHOUSE;
      case DistrictType.WATERFRONT:
        return rng() < 0.5 ? BuildingCategory.CONDO : BuildingCategory.COMMERCIAL;
      case DistrictType.PARKLAND:
        return BuildingCategory.PARK;
      default:
        return BuildingCategory.APARTMENT;
    }
  }

  _buildingAttributes(category, districtType, cellSize, rng) {
    const baseHeight = {
      [BuildingCategory.SKYSCRAPER]: 180,
      [BuildingCategory.OFFICE]: 90,
      [BuildingCategory.APARTMENT]: 70,
      [BuildingCategory.HOUSE]: 12,
      [BuildingCategory.CONDO]: 35,
      [BuildingCategory.FACTORY]: 24,
      [BuildingCategory.WAREHOUSE]: 18,
      [BuildingCategory.CIVIC]: 28,
      [BuildingCategory.COMMERCIAL]: 22,
      [BuildingCategory.PARK]: 4
    }[category] || 15;

    const variance = {
      [DistrictType.DOWNTOWN]: 0.35,
      [DistrictType.COMMERCIAL]: 0.3,
      [DistrictType.RESIDENTIAL]: 0.2,
      [DistrictType.SUBURBAN]: 0.15,
      [DistrictType.RURAL]: 0.1,
      [DistrictType.INDUSTRIAL]: 0.2,
      [DistrictType.WATERFRONT]: 0.25,
      [DistrictType.PARKLAND]: 0.1
    }[districtType] || 0.2;

    const height = Math.max(6, baseHeight * (0.7 + rng() * variance));
    const floors = Math.max(1, Math.round(height / 3.5));
    const footprintScale = category === BuildingCategory.HOUSE ? 0.5 : 0.8;
    const footprint = {
      width: cellSize * footprintScale,
      depth: cellSize * footprintScale
    };
    };
    const styleOptions = ["modern", "artdeco", "brutalist", "classical", "futuristic", "loft"];
    const palette = category === BuildingCategory.SKYSCRAPER
      ? ["#88c0d0", "#5e81ac", "#eceff4", "#4c566a"]
      : ["#d08770", "#ebcb8b", "#a3be8c", "#b48ead"];

    const color = palette[Math.floor(rng() * palette.length)] || "#999999";
    const style = styleOptions[Math.floor(rng() * styleOptions.length)];

    const populationCapacity = this._estimatePopulationCapacity(category, floors, footprint);
    const jobCapacity = this._estimateJobCapacity(category, floors, footprint);

    return { height, floors, footprint, color, style, populationCapacity, jobCapacity };
  }

  _estimatePopulationCapacity(category, floors, footprint) {
    const area = footprint.width * footprint.depth;
    switch (category) {
      case BuildingCategory.APARTMENT:
      case BuildingCategory.CONDO:
        return Math.round((area * floors) / 45);
      case BuildingCategory.HOUSE:
        return Math.max(2, Math.round(area / 35));
      case BuildingCategory.SKYSCRAPER:
        return Math.round((area * floors) / 60);
      default:
        return 0;
    }
  }

  _estimateJobCapacity(category, floors, footprint) {
    const area = footprint.width * footprint.depth;
    switch (category) {
      case BuildingCategory.OFFICE:
      case BuildingCategory.SKYSCRAPER:
        return Math.round((area * floors) / 30);
      case BuildingCategory.COMMERCIAL:
        return Math.round((area * floors) / 45);
      case BuildingCategory.FACTORY:
      case BuildingCategory.WAREHOUSE:
        return Math.round((area * floors) / 60);
      default:
        return 0;
    }
  }

  _placeBuildings(grid, options, baseNoise, rng) {
    const { cols, rows, cells } = grid;
    const buildingEntries = [];
    let buildingId = 0;

    for (let x = 0; x < cols; x += 1) {
      for (let z = 0; z < rows; z += 1) {
        const cell = cells[x][z];
        if (cell.isRoad || cell.isWater || cell.isPark) {
          continue;
        }

        const category = this._selectBuildingCategory(cell.districtType, rng);
        if (category === BuildingCategory.PARK) {
          cell.isPark = true;
          continue;
        }

        const densityModifier = Math.max(0.2, cell.density + baseNoise.noise2D(x * 0.1, z * 0.1));
        if (rng() > densityModifier) {
          continue;
        }

        const attrs = this._buildingAttributes(category, cell.districtType, grid.cellSize, rng);
        const building = new Building({
          id: `building-${buildingId}`,
          position: { x: cell.worldX, y: 0, z: cell.worldZ },
          footprint: attrs.footprint,
          height: attrs.height,
          floors: attrs.floors,
          color: attrs.color,
          category,
          districtId: cell.districtId,
          populationCapacity: attrs.populationCapacity,
          jobCapacity: attrs.jobCapacity,
          quality: 0.4 + rng() * 0.6,
          style: attrs.style
        });

        cell.building = building;
        buildingEntries.push(building);
        buildingId += 1;
      }
    }

    return { buildings: buildingEntries };
  }

  _addTransitLines(city, grid, options, roadDescriptor, rng) {
    const { cols, rows, cells, cellSize } = grid;
    const transitLines = [];
    const spacing = Math.max(5, Math.round(options.transitSpacing / cellSize));
    let lineId = 0;

    for (let x = spacing; x < cols - spacing; x += spacing) {
      const path = [];
      const stations = [];
      for (let z = 0; z < rows; z += Math.max(1, Math.floor(spacing / 2))) {
        const cell = cells[x][z];
        if (!cell.isRoad) {
          continue;
        }
        path.push({ x: cell.worldX, z: cell.worldZ });
        if (z % spacing === 0) {
          stations.push({ x: cell.worldX, z: cell.worldZ, name: `Station ${lineId}-${stations.length}` });
        }
      }
      if (path.length > 3) {
        transitLines.push(new TransitLine({
          id: `transit-${lineId}`,
          path,
          stations,
          type: rng() < 0.5 ? "tram" : "metro"
        }));
        lineId += 1;
      }
    }

    transitLines.forEach((line) => city.addTransitLine(line));
  }

  _finalizeCity({ city, grid, districtMetadata, riverDescriptor, parkPatches, roadDescriptor, buildingResults }) {
    districtMetadata.forEach((meta) => {
      const boundary = {
        minX: meta.minX,
        maxX: meta.maxX,
        minZ: meta.minZ,
        maxZ: meta.maxZ
      };
      const density = meta.densityTotal / Math.max(1, meta.cellCount);
      const amenities = meta.amenitiesTotal / Math.max(1, meta.cellCount);
      city.addDistrict(new District({
        id: meta.id,
        type: meta.type,
        boundary,
        density,
        amenities
      }));
    });

    this._collectRoadSegments(city, grid, roadDescriptor);
    this._collectParks(city, parkPatches);
    this._collectWater(city, riverDescriptor);

    buildingResults.buildings.forEach((building) => {
      city.addBuilding(building);
    });

    if (city.buildings.length > 0) {
      city.metadata.economicScore = city.buildings.reduce((acc, building) => acc + (building.jobCapacity + building.populationCapacity * 0.5), 0) / city.buildings.length;
    }
  }

  _collectRoadSegments(city, grid, roadDescriptor) {
    const { cols, rows, cells, cellSize } = grid;
    const processed = new Set();
    let roadId = 0;

    const directionVectors = [
      { dx: 1, dz: 0 },
      { dx: 0, dz: 1 }
    ];

    const toWorld = (gx, gz) => ({
      x: cells[gx][gz].worldX,
      z: cells[gx][gz].worldZ
    });

    for (let x = 0; x < cols; x += 1) {
      for (let z = 0; z < rows; z += 1) {
        const cell = cells[x][z];
        if (!cell.isRoad) {
          continue;
        }
        const key = `${x}:${z}`;
        if (processed.has(key)) {
          continue;
        }

        let bestDirection = null;
        for (const direction of directionVectors) {
          const nx = x + direction.dx;
          const nz = z + direction.dz;
          if (nx >= 0 && nx < cols && nz >= 0 && nz < rows && cells[nx][nz].isRoad && cells[nx][nz].roadType === cell.roadType) {
            bestDirection = direction;
            break;
          }
        }

        if (!bestDirection) {
          const fromPoint = { x: cell.worldX - cellSize * 0.5, z: cell.worldZ - cellSize * 0.5 };
          const toPoint = { x: cell.worldX + cellSize * 0.5, z: cell.worldZ + cellSize * 0.5 };
          city.addRoad(new RoadSegment({
            id: `road-${roadId}`,
            from: fromPoint,
            to: toPoint,
            width: cellSize * 0.8,
            lanes: cell.roadType === RoadType.HIGHWAY ? 6 : 2,
            type: cell.roadType
          }));
          roadId += 1;
          processed.add(key);
          continue;
        }

        let length = 0;
        let currentX = x;
        let currentZ = z;
        const start = toWorld(x, z);
        let end = start;

        while (currentX >= 0 && currentX < cols && currentZ >= 0 && currentZ < rows) {
          const currentKey = `${currentX}:${currentZ}`;
          const currentCell = cells[currentX][currentZ];
          if (!currentCell.isRoad || currentCell.roadType !== cell.roadType) {
            break;
          }

          processed.add(currentKey);
          end = toWorld(currentX, currentZ);
          length += cellSize;
          currentX += bestDirection.dx;
          currentZ += bestDirection.dz;
        }

        const fromPoint = { x: start.x, z: start.z };
        const toPoint = { x: end.x, z: end.z };
        city.addRoad(new RoadSegment({
          id: `road-${roadId}`,
          from: fromPoint,
          to: toPoint,
          width: cellSize * (cell.roadType === RoadType.HIGHWAY ? 1.2 : 0.8),
          lanes: cell.roadType === RoadType.HIGHWAY ? 6 : cell.roadType === RoadType.ARTERIAL ? 4 : 2,
          type: cell.roadType
        }));
        roadId += 1;
      }
    }
  }

  _collectParks(city, parkPatches) {
    parkPatches.forEach((patch) => {
      const radius = Math.sqrt(patch.cells.length) * 10;
      city.addPark(new Park({
        id: patch.id,
        position: { x: patch.center.x, z: patch.center.z },
        radius,
        hasWaterFeature: patch.hasWater
      }));
    });
  }

  _collectWater(city, riverDescriptor) {
    if (!riverDescriptor || riverDescriptor.path.length === 0) {
      return;
    }
    city.addWaterBody(new WaterBody({
      id: "river-0",
      path: riverDescriptor.path,
      width: riverDescriptor.width
    }));
  }
}
