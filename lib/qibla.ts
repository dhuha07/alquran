// Qibla bearing calculation using the Great Circle formula.
// Kaaba coordinates: 21.4225° N, 39.8262° E

export const KAABA_LAT = 21.4225;
export const KAABA_LNG = 39.8262;

const toRad = (deg: number): number => (deg * Math.PI) / 180;
const toDeg = (rad: number): number => (rad * 180) / Math.PI;

/**
 * Calculate the Qibla bearing (direction from North, clockwise) from a given
 * latitude/longitude to the Kaaba in Mecca.
 *
 * Uses the forward azimuth formula for the great-circle path between two points
 * on a sphere:
 *
 *   θ = atan2( sin Δλ · cos φ₂ ,
 *              cos φ₁ · sin φ₂ − sin φ₁ · cos φ₂ · cos Δλ )
 *
 * where φ₁,λ₁ is the user location and φ₂,λ₂ is the Kaaba.
 *
 * @param userLat  user latitude in decimal degrees
 * @param userLng  user longitude in decimal degrees
 * @returns bearing in degrees [0, 360) measured clockwise from true North
 */
export function calculateQiblaBearing(userLat: number, userLng: number): number {
  const phi1 = toRad(userLat);
  const phi2 = toRad(KAABA_LAT);
  const deltaLambda = toRad(KAABA_LNG - userLng);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  const bearing = (toDeg(theta) + 360) % 360;
  return bearing;
}

/**
 * The shortest surface distance (km) between the user and the Kaaba.
 * Useful for informational display.
 */
export function calculateDistanceToKaaba(userLat: number, userLng: number): number {
  const R = 6371; // Earth radius km
  const phi1 = toRad(userLat);
  const phi2 = toRad(KAABA_LAT);
  const dPhi = toRad(KAABA_LAT - userLat);
  const dLambda = toRad(KAABA_LNG - userLng);

  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Normalize an angle to [0, 360)
 */
export function normalizeAngle(deg: number): number {
  return (deg + 360) % 360;
}

/**
 * Smallest absolute difference between two angles, accounting for wrap at 360.
 */
export function angularDifference(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}
