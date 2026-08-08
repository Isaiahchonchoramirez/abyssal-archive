/**
 * Shared world dimensions.
 *
 * The diver controller, the water surface, the seafloor and the godrays all
 * need to agree on where the ocean is. Keeping the numbers here stops them
 * drifting apart and re-creating the "sealed box" feeling.
 */

/** Underside of the water. The diver can approach it but never breaches. */
export const SURFACE_Y = 22;

export const FLOOR_Y = -32;

/**
 * Height offset used by both the rendered seabed and diver collision.
 * PlaneGeometry's local Y becomes negative world Z after its -90° rotation,
 * so this function accepts world coordinates and handles that conversion once.
 */
export function seafloorReliefAt(x: number, z: number) {
  const planeY = -z;
  return (
    Math.sin(x * 0.045) * 2.6 +
    Math.cos(planeY * 0.037) * 2.9 +
    Math.sin((x + planeY) * 0.021) * 4.2 +
    Math.sin(x * 0.13) * Math.cos(planeY * 0.11) * 1.1
  );
}

export function seafloorHeightAt(x: number, z: number) {
  return FLOOR_Y + seafloorReliefAt(x, z);
}

/** Wide enough that fog always hides the edge before geometry runs out. */
export const BOUNDS_RADIUS = 150;
export const BOUNDS_TOP = 16;
export const BOUNDS_BOTTOM = -30;

export const SEAFLOOR_SIZE = 460;

export const FOG_COLOR = '#062330';
/** Visibility works out to roughly 120 units — the source of the depth. */
export const FOG_DENSITY = 0.019;
