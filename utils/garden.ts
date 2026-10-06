export const GARDEN_LIMIT = 48;
export interface GardenPlant {
  id: string;
  x: number;
  y: number;
  tilt: number;
  size: number;
}

export function readGarden(raw: string | null): GardenPlant[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data) || data.length > GARDEN_LIMIT) return [];
    const ids = new Set<string>();
    for (const plant of data) {
      if (
        !plant ||
        typeof plant !== "object" ||
        typeof plant.id !== "string" ||
        plant.id.length > 100 ||
        !plant.id ||
        ids.has(plant.id) ||
        !Number.isFinite(plant.x) ||
        plant.x < 12 ||
        plant.x > 88 ||
        !Number.isFinite(plant.y) ||
        plant.y < 40 ||
        plant.y > 94 ||
        !Number.isFinite(plant.tilt) ||
        Math.abs(plant.tilt) > 10 ||
        !Number.isFinite(plant.size) ||
        plant.size < 0.8 ||
        plant.size > 1.2
      )
        return [];
      ids.add(plant.id);
    }
    return data;
  } catch {
    return [];
  }
}

export function gardenPosition(x: number, y: number) {
  return {
    x: Math.max(12, Math.min(88, x)),
    y: Math.max(40, Math.min(94, y)),
  };
}
