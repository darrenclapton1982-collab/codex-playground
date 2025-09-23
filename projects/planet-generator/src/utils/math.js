export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const lerp = (start, end, t) => start + (end - start) * t;
export const inverseLerp = (min, max, value) => {
    if (min === max) return 0;
    return (value - min) / (max - min);
};
export const smoothstep = (edge0, edge1, x) => {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
};
