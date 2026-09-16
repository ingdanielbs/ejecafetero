import * as THREE from 'three';

/** Colores y materiales PBR reutilizables (fáciles de sustituir por texturas GLTF). */
export const palette = {
  grass: 0x3d6b3a,
  grassDark: 0x2a4a2c,
  path: 0x8b7355,
  wood: 0x6b4423,
  woodDark: 0x4a2f18,
  wall: 0xf2ebe0,
  roof: 0xb85a2a,
  palmTrunk: 0x7a5c3a,
  palmFrond: 0x2f6b35,
  fog: 0xa8c4b0,
  skyTop: 0x7eb8d4,
  skyHorizon: 0xd4e8c8,
  interiorFloor: 0x8a6a45,
  interiorWall: 0xf5f0e6,
  pedestal: 0xcfc4b0,
} as const;

export function createPBR(
  color: number,
  opts: Partial<{
    roughness: number;
    metalness: number;
    emissive: number;
    emissiveIntensity: number;
  }> = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.85,
    metalness: opts.metalness ?? 0.05,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
  });
}

export function disposeMaterial(mat: THREE.Material | THREE.Material[]): void {
  const list = Array.isArray(mat) ? mat : [mat];
  for (const m of list) m.dispose();
}
