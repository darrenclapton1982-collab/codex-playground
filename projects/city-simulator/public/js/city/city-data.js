export const DistrictType = {
  DOWNTOWN: "downtown",
  COMMERCIAL: "commercial",
  RESIDENTIAL: "residential",
  INDUSTRIAL: "industrial",
  SUBURBAN: "suburban",
  RURAL: "rural",
  PARKLAND: "parkland",
  WATERFRONT: "waterfront"
};

export const BuildingCategory = {
  SKYSCRAPER: "skyscraper",
  OFFICE: "office",
  APARTMENT: "apartment",
  HOUSE: "house",
  CONDO: "condo",
  FACTORY: "factory",
  WAREHOUSE: "warehouse",
  CIVIC: "civic",
  COMMERCIAL: "commercial",
  PARK: "park"
};

export const RoadType = {
  HIGHWAY: "highway",
  ARTERIAL: "arterial",
  COLLECTOR: "collector",
  LOCAL: "local",
  TRANSIT: "transit"
};

export const WeatherType = {
  CLEAR: "clear",
  RAIN: "rain",
  FOG: "fog",
  SNOW: "snow"
};

export class City {
  constructor({ width, height, cellSize, seed }) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.seed = seed;
    this.districts = [];
    this.roads = [];
    this.buildings = [];
    this.parks = [];
    this.waterBodies = [];
    this.transitLines = [];
    this.landmarks = [];
    this.metadata = {
      populationCapacity: 0,
      jobCapacity: 0,
      greenSpace: 0,
      roadLength: 0,
      economicScore: 0
    };
  }

  addDistrict(district) {
    this.districts.push(district);
  }

  addRoad(road) {
    this.roads.push(road);
    this.metadata.roadLength += road.length;
  }

  addBuilding(building) {
    this.buildings.push(building);
    this.metadata.populationCapacity += building.populationCapacity || 0;
    this.metadata.jobCapacity += building.jobCapacity || 0;
    if (building.category === BuildingCategory.PARK) {
      this.metadata.greenSpace += building.area;
    }
  }

  addPark(park) {
    this.parks.push(park);
    this.metadata.greenSpace += park.area || 0;
  }

  addWaterBody(body) {
    this.waterBodies.push(body);
  }

  addTransitLine(line) {
    this.transitLines.push(line);
  }

  addLandmark(landmark) {
    this.landmarks.push(landmark);
  }
}

export class District {
  constructor({ id, type, boundary, density, amenities }) {
    this.id = id;
    this.type = type;
    this.boundary = boundary;
    this.density = density;
    this.amenities = amenities;
  }
}

export class RoadSegment {
  constructor({ id, from, to, width, lanes, type }) {
    this.id = id;
    this.from = from;
    this.to = to;
    this.width = width;
    this.lanes = lanes;
    this.type = type;
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    this.length = Math.hypot(dx, dz);
  }
}

export class Building {
  constructor({
    id,
    position,
    footprint,
    height,
    floors,
    color,
    category,
    districtId,
    populationCapacity = 0,
    jobCapacity = 0,
    quality = 0.5,
    style = "modern"
  }) {
    this.id = id;
    this.position = position;
    this.footprint = footprint;
    this.height = height;
    this.floors = floors;
    this.color = color;
    this.category = category;
    this.districtId = districtId;
    this.populationCapacity = populationCapacity;
    this.jobCapacity = jobCapacity;
    this.quality = quality;
    this.style = style;
  }

  get area() {
    return this.footprint.width * this.footprint.depth;
  }
}

export class Park {
  constructor({ id, position, radius, hasWaterFeature = false }) {
    this.id = id;
    this.position = position;
    this.radius = radius;
    this.hasWaterFeature = hasWaterFeature;
    this.area = Math.PI * radius * radius;
  }
}

export class WaterBody {
  constructor({ id, path, width }) {
    this.id = id;
    this.path = path;
    this.width = width;
  }
}

export class TransitLine {
  constructor({ id, path, stations, type }) {
    this.id = id;
    this.path = path;
    this.stations = stations;
    this.type = type;
  }
}

export class Landmark {
  constructor({ id, position, name, description }) {
    this.id = id;
    this.position = position;
    this.name = name;
    this.description = description;
  }
}

export class CityAction {
  constructor({ id, type, payload, author }) {
    this.id = id;
    this.type = type;
    this.payload = payload;
    this.author = author;
    this.timestamp = Date.now();
  }
}
