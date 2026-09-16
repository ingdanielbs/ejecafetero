import * as THREE from 'three';
import { createPBR, palette } from './materials';

const sharedTrunkMat = createPBR(palette.palmTrunk, { roughness: 0.92 });
const sharedFrondMat = createPBR(palette.palmFrond, { roughness: 0.75 });

let trunkGeo: THREE.CylinderGeometry | null = null;
let frondGeo: THREE.ConeGeometry | null = null;

function getGeometries() {
  if (!trunkGeo) trunkGeo = new THREE.CylinderGeometry(0.12, 0.28, 1, 6);
  if (!frondGeo) frondGeo = new THREE.ConeGeometry(1.2, 2.2, 5);
  return { trunkGeo, frondGeo };
}

/**
 * Palma de cera estilizada (procedural).
 * Usamos meshes compartidos + clones ligeros; para bosques densos preferir InstancedMesh.
 */
export function createPalmTree(height = 18 + Math.random() * 10): THREE.Group {
  const group = new THREE.Group();
  const { trunkGeo, frondGeo } = getGeometries();

  const trunk = new THREE.Mesh(trunkGeo, sharedTrunkMat);
  trunk.scale.set(1, height, 1);
  trunk.position.y = height / 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  const crown = new THREE.Group();
  crown.position.y = height;
  const frondCount = 5 + Math.floor(Math.random() * 3);
  for (let i = 0; i < frondCount; i++) {
    const frond = new THREE.Mesh(frondGeo, sharedFrondMat);
    const angle = (i / frondCount) * Math.PI * 2;
    frond.position.set(Math.cos(angle) * 0.35, 0.2, Math.sin(angle) * 0.35);
    frond.rotation.z = 0.85 + Math.random() * 0.25;
    frond.rotation.y = angle;
    frond.castShadow = true;
    crown.add(frond);
  }
  group.add(crown);
  group.userData.isPalm = true;
  return group;
}

/** Bosque de palmas con InstancedMesh (mejor para Quest). */
export function createPalmForest(
  parent: THREE.Object3D,
  count: number,
  area: { minX: number; maxX: number; minZ: number; maxZ: number },
  avoid: (x: number, z: number) => boolean,
): void {
  const { trunkGeo, frondGeo } = getGeometries();
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, sharedTrunkMat, count);
  const frondMesh = new THREE.InstancedMesh(frondGeo, sharedFrondMat, count * 6);
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;
  frondMesh.castShadow = true;

  const dummy = new THREE.Object3D();
  let placed = 0;
  let frondIdx = 0;
  let attempts = 0;

  while (placed < count && attempts < count * 20) {
    attempts++;
    const x = THREE.MathUtils.lerp(area.minX, area.maxX, Math.random());
    const z = THREE.MathUtils.lerp(area.minZ, area.maxZ, Math.random());
    if (avoid(x, z)) continue;

    const height = 14 + Math.random() * 14;
    dummy.position.set(x, height / 2, z);
    dummy.scale.set(1, height, 1);
    dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(placed, dummy.matrix);

    const frondCount = 6;
    for (let i = 0; i < frondCount; i++) {
      const angle = (i / frondCount) * Math.PI * 2 + Math.random() * 0.2;
      dummy.position.set(
        x + Math.cos(angle) * 0.35,
        height + 0.2,
        z + Math.sin(angle) * 0.35,
      );
      dummy.scale.set(1.1, 1.1, 1.1);
      dummy.rotation.set(0.2, angle, 0.9);
      dummy.updateMatrix();
      frondMesh.setMatrixAt(frondIdx++, dummy.matrix);
    }
    placed++;
  }

  trunkMesh.count = placed;
  frondMesh.count = frondIdx;
  trunkMesh.instanceMatrix.needsUpdate = true;
  frondMesh.instanceMatrix.needsUpdate = true;
  parent.add(trunkMesh, frondMesh);
}
