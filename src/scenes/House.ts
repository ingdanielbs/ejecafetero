import * as THREE from 'three';
import { createPBR, palette } from '../utils/materials';

export interface HouseResult {
  group: THREE.Group;
  /** Punto frente a la puerta (exterior) */
  doorExterior: THREE.Vector3;
  /** Punto justo dentro del umbral */
  doorInterior: THREE.Vector3;
  doorTrigger: THREE.Object3D;
}

/**
 * Casa típica del Eje Cafetero: muros claros, madera, techo de teja.
 * Geometría procedural lista para reemplazar por GLTF.
 */
export function createHouse(position: THREE.Vector3): HouseResult {
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

  // Plataforma / zócalo
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.6, 0.3, d + 1.2),
    woodDarkMat,
  );
  plinth.position.set(0, 0.15, 0.2);
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  // Piso exterior del corredor
  const porch = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.2, 0.12, 1.6),
    woodMat,
  );
  porch.position.set(0, floorY + 0.06, d / 2 + 0.5);
  porch.receiveShadow = true;
  group.add(porch);

  // Muros (caja hueca simplificada: 4 paneles + techo)
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

  // Frente con hueco de puerta: dos paneles laterales + dintel
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

  // Marco de puerta y hoja (portal)
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

  // Columnas del corredor
  for (const sx of [-w / 2 + 0.5, w / 2 - 0.5]) {
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, h * 0.95, 8),
      woodMat,
    );
    col.position.set(sx, floorY + (h * 0.95) / 2, d / 2 + 1.1);
    col.castShadow = true;
    group.add(col);
  }

  // Techo a dos aguas
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

  // Cumbrera
  const ridge = new THREE.Mesh(
    new THREE.BoxGeometry(roofLen + 0.1, 0.15, 0.2),
    woodDarkMat,
  );
  ridge.position.set(0, h + floorY + pitch * 0.75, 0);
  roofGroup.add(ridge);
  group.add(roofGroup);

  // Ventanas laterales decorativas
  const windowMat = createPBR(0x87a8b8, { roughness: 0.25, metalness: 0.2, emissive: 0x223344, emissiveIntensity: 0.15 });
  for (const side of [-1, 1]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 1.4), windowMat);
    win.position.set(side * (w / 2 + 0.02), floorY + 1.7, -0.5);
    group.add(win);
  }

  const doorExterior = new THREE.Vector3(
    position.x,
    1.6,
    position.z + d / 2 + 2.2,
  );
  const doorInterior = new THREE.Vector3(position.x, 1.6, position.z + d / 2 - 1.2);

  const doorTrigger = new THREE.Object3D();
  doorTrigger.name = 'DoorTrigger';
  doorTrigger.position.set(0, 1.2, d / 2 + 0.8);
  doorTrigger.userData.isDoorTrigger = true;
  group.add(doorTrigger);

  // Zona interactuable invisible
  const triggerMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 2.5, 1.5),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  triggerMesh.position.copy(doorTrigger.position);
  triggerMesh.userData.isDoorTrigger = true;
  triggerMesh.name = 'DoorTriggerMesh';
  group.add(triggerMesh);

  return { group, doorExterior, doorInterior, doorTrigger: triggerMesh };
}
