import SimplexNoise from "/node_modules/simplex-noise/dist/esm/simplex-noise.js";
import { createRng } from "./prng.js";

export function createNoise(seed) {
  const rng = createRng(seed);
  return new SimplexNoise(() => rng() * 2 - 1);
}

export function layeredNoise(noise, x, y, layers = 4, persistence = 0.5, lacunarity = 2) {
  let amplitude = 1;
  let frequency = 1;
  let value = 0;
  let normalization = 0;

  for (let i = 0; i < layers; i += 1) {
    value += noise.noise2D(x * frequency, y * frequency) * amplitude;
    normalization += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return value / (normalization || 1);
}
