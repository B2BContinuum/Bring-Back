import { Coordinates } from 'bring-back-shared';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(coord1.latitude)) * 
            Math.cos(toRadians(coord2.latitude)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if a coordinate is within a specified radius of another coordinate
 * @param center Center coordinate
 * @param point Point to check
 * @param radiusKm Radius in kilometers
 * @returns True if point is within radius
 */
export function isWithinRadius(center: Coordinates, point: Coordinates, radiusKm: number): boolean {
  return calculateDistance(center, point) <= radiusKm;
}

/**
 * Convert degrees to radians
 * @param degrees Degrees to convert
 * @returns Radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Find the closest coordinate from a list of coordinates
 * @param origin Origin coordinate
 * @param coordinates List of coordinates to search
 * @returns Closest coordinate and its distance
 */
export function findClosest(origin: Coordinates, coordinates: Coordinates[]): { coordinate: Coordinates; distance: number } | null {
  if (coordinates.length === 0) return null;
  
  let closest = coordinates[0];
  let minDistance = calculateDistance(origin, closest);
  
  for (let i = 1; i < coordinates.length; i++) {
    const distance = calculateDistance(origin, coordinates[i]);
    if (distance < minDistance) {
      minDistance = distance;
      closest = coordinates[i];
    }
  }
  
  return { coordinate: closest, distance: minDistance };
}

/**
 * Sort coordinates by distance from origin
 * @param origin Origin coordinate
 * @param coordinates List of coordinates to sort
 * @returns Sorted coordinates with distances
 */
export function sortByDistance(origin: Coordinates, coordinates: Coordinates[]): Array<{ coordinate: Coordinates; distance: number }> {
  return coordinates
    .map(coord => ({ coordinate: coord, distance: calculateDistance(origin, coord) }))
    .sort((a, b) => a.distance - b.distance);
}