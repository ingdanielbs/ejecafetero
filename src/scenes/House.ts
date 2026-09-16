import * as THREE from 'three';
import { createPBR, palette } from '../utils/materials';
import { loadModel, MODEL_URLS, prepareGltfMaterials, type LoadProgress } from '../utils/gltfAssets';

export interface HouseResult {
  group: THREE.Group;
  /** Punto frente a la puerta (exterior) */
  doorExterior: THREE.Vector3;
  /** Punto justo dentro del umbral */
  doorInterior: THREE.Vector3;
  doorTrigger: THREE.Object3D;
  /** Semianchos para colisión / teletransporte */
  halfW: number;
  halfD: number;
}

function attachDoorTrigger(
  group: THREE.Group,
  worldPosition: THREE.Vector3,
  frontLocalZ: number,
): Pick<HouseResult, 'doorExterior' | 'doorInterior' | 'doorTrigger'> {
  const doorExterior = new THREE.Vector3(
    worldPosition.x,
    1.6,
    worldPosition.z + frontLocalZ + 2.0,
  );
  const doorInterior = new THREE.Vector3(
    worldPosition.x,
    1.6,
    worldPosition.z + frontLocalZ - 1.5,
  );

  const doorTrigger = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 2.6, 1.8),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  doorTrigger.name = 'DoorTriggerMesh';
  doorTrigger.position.set(0, 1.3, frontLocalZ + 0.6);
  doorTrigger.userData.isDoorTrigger = true;
  group.add(doorTrigger);

  return { doorExterior, doorInterior, doorTrigger };
}

/**
 * Casa típica del Eje Cafetero: muros claros, madera, techo de teja.
 * Usada como fallback si el GLB no carga.
 */
export function createProceduralHouse(position: THREE.Vector3): HouseResult {
  const group = new THREE.Group();
  group.name = 'CasaTipica';
  group.position.copy(position);

  const wallMat = createPBR(palette.wall, { roughness: 0.88 });
  const woodMat = createPBR(palette.wood, { roughness: 0.8 });
  const woodDarkMat = createPBR(palette.woodDark, { roughness: 0.85 });
  const roofMat = createPBR(palette.roof, { roughness: 0.78, metalness: 0.08 });

  const floorY = 0.15;
  const w = 10;
  const d = 8;
  const h = 3.2;

  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.6, 0.3, d + 1.2),
    woodDarkMat,
  );
  plinth.position.set(0, 0.15, 0.2);
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  const porch = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.2, 0.12, 1.6),
    woodMat,
  );
  porch.position.set(0, floorY + 0.06, d / 2 + 0.5);
  porch.receiveShadow = true;
  group.add(porch);

  const wallThickness = 0.18;
  const walls: THREE.Mesh[] = [];

  const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, wallThickness), wallMat);
  back.position.set(0, floorY + h / 2, -d / 2);
  walls.push(back);

  const left = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, h, d), wallMat);
  left.position.set(-w / 2, floorY + h / 2, 0);
  walls.push(left);

  const right = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, h, d), wallMat);
  right.position.set(w / 2, floorY + h / 2, 0);
  walls.push(right);

  const doorWidth = 1.4;
  const doorHeight = 2.3;
  const sideW = (w - doorWidth) / 2;
  const frontLeft = new THREE.Mesh(
    new THREE.BoxGeometry(sideW, h, wallThickness),
    wallMat,
  );
  frontLeft.position.set(-(doorWidth / 2 + sideW / 2), floorY + h / 2, d / 2);
  walls.push(frontLeft);

  const frontRight = new THREE.Mesh(
    new THREE.BoxGeometry(sideW, h, wallThickness),
    wallMat,
  );
  frontRight.position.set(doorWidth / 2 + sideW / 2, floorY + h / 2, d / 2);
  walls.push(frontRight);

  const lintel = new THREE.Mesh(
    new THREE.BoxGeometry(doorWidth, h - doorHeight, wallThickness),
    wallMat,
  );
  lintel.position.set(0, floorY + doorHeight + (h - doorHeight) / 2, d / 2);
  walls.push(lintel);

  for (const wall of walls) {
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);
  }

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(doorWidth + 0.15, doorHeight + 0.1, 0.12),
    woodMat,
  );
  frame.position.set(0, floorY + doorHeight / 2, d / 2 + 0.05);
  group.add(frame);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(doorWidth * 0.92, doorHeight * 0.96, 0.08),
    woodDarkMat,
  );
  door.position.set(0, floorY + doorHeight / 2, d / 2 + 0.12);
  door.name = 'Door';
  door.userData.isDoor = true;
  group.add(door);

  for (const sx of [-w / 2 + 0.5, w / 2 - 0.5]) {
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, h * 0.95, 8),
      woodMat,
    );
    col.position.set(sx, floorY + (h * 0.95) / 2, d / 2 + 1.1);
    col.castShadow = true;
    group.add(col);
  }

  const roofGroup = new THREE.Group();
  const roofLen = w + 1.2;
  const roofDepth = d + 2.2;
  const pitch = 1.35;
  const roofLeft = new THREE.Mesh(
    new THREE.BoxGeometry(roofLen, 0.12, roofDepth / 2 + 0.3),
    roofMat,
  );
  roofLeft.position.set(0, h + floorY + pitch * 0.35, -roofDepth * 0.12);
  roofLeft.rotation.x = 0.38;
  roofLeft.castShadow = true;
  roofGroup.add(roofLeft);

  const roofRight = new THREE.Mesh(
    new THREE.BoxGeometry(roofLen, 0.12, roofDepth / 2 + 0.3),
    roofMat,
  );
  roofRight.position.set(0, h + floorY + pitch * 0.35, roofDepth * 0.12);
  roofRight.rotation.x = -0.38;
  roofRight.castShadow = true;
  roofGroup.add(roofRight);

  const ridge = new THREE.Mesh(
    new THREE.BoxGeometry(roofLen + 0.1, 0.15, 0.2),
    woodDarkMat,
  );
  ridge.position.set(0, h + floorY + pitch * 0.75, 0);
  roofGroup.add(ridge);
  group.add(roofGroup);

  const windowMat = createPBR(0x87a8b8, {
    roughness: 0.25,
    metalness: 0.2,
    emissive: 0x223344,
    emissiveIntensity: 0.15,
  });
  for (const side of [-1, 1]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 1.4), windowMat);
    win.position.set(side * (w / 2 + 0.02), floorY + 1.7, -0.5);
    group.add(win);
  }

  const doorBits = attachDoorTrigger(group, position, d / 2);
  return {
    group,
    ...doorBits,
    halfW: w / 2 + 0.1,
    halfD: d / 2 + 0.1,
  };
}

/**
 * Casa desde GLB Blender. Fachada original hacia −Z; rotamos π para mirar al sendero (+Z).
 */
export async function createHouse(
  position: THREE.Vector3,
  onProgress?: LoadProgress,
): Promise<HouseResult> {
  const model = await loadModel(MODEL_URLS.casa, 'casa típica', onProgress);
  if (!model) {
    return createProceduralHouse(position);
  }

  prepareGltfMaterials(model);

  const group = new THREE.Group();
  group.name = 'CasaTipica';
  group.position.copy(position);
  // Porche del asset mira −Z; el valle se aborda desde +Z.
  model.rotation.y = Math.PI;
  group.add(model);
  group.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const frontLocalZ = box.max.z - position.z;
  const doorBits = attachDoorTrigger(group, position, frontLocalZ);

  return {
    group,
    ...doorBits,
    halfW: Math.max(size.x / 2, 5),
    halfD: Math.max(size.z / 2, 4),
  };
}
