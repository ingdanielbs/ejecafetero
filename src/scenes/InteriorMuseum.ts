import * as THREE from 'three';
import { createPBR, palette } from '../utils/materials';
import type { HotspotId } from '../ui/hotspotContent';
import { loadModel, MODEL_URLS, prepareGltfMaterials, type LoadProgress } from '../utils/gltfAssets';

export interface MuseumResult {
  group: THREE.Group;
  hotspots: THREE.Object3D[];
  exitTrigger: THREE.Object3D;
}

function makeLabelTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#1a281e';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#e8a06a';
  ctx.font = 'bold 42px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createFallbackProp(color: number): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.28, 1),
    createPBR(color, {
      roughness: 0.45,
      metalness: 0.15,
      emissive: color,
      emissiveIntensity: 0.08,
    }),
  );
}

function createPedestal(
  title: string,
  hotspotId: HotspotId,
  exhibitColor: number,
  propRoot: THREE.Object3D | null,
): THREE.Group {
  const g = new THREE.Group();
  g.name = `Hotspot_${hotspotId}`;

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.55, 0.9, 16),
    createPBR(palette.pedestal, { roughness: 0.7 }),
  );
  base.position.y = 0.45;
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);

  const prop = propRoot ?? createFallbackProp(exhibitColor);
  prop.position.y = 0.9;
  prop.castShadow = true;
  g.add(prop);

  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.28),
    new THREE.MeshBasicMaterial({ map: makeLabelTexture(title) }),
  );
  plate.position.set(0, 0.55, 0.56);
  g.add(plate);

  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 12, 12),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hit.position.y = 1.15;
  hit.userData.isHotspot = true;
  hit.userData.hotspotId = hotspotId as HotspotId;
  g.add(hit);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.03, 8, 24),
    createPBR(0xe8a06a, {
      roughness: 0.4,
      metalness: 0.3,
      emissive: 0xc45c26,
      emissiveIntensity: 0.35,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.05;
  g.add(ring);

  return g;
}

function createWallPanel(hotspotId: HotspotId, title: string): THREE.Group {
  const g = new THREE.Group();
  g.name = `Panel_${hotspotId}`;

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.1, 0.08),
    createPBR(palette.wood, { roughness: 0.8 }),
  );
  frame.castShadow = true;
  g.add(frame);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 0.9),
    new THREE.MeshBasicMaterial({
      color: hotspotId === 'video' ? 0x1a1a22 : 0x2a3a30,
      map: makeLabelTexture(title),
    }),
  );
  screen.position.z = 0.05;
  g.add(screen);

  if (hotspotId === 'video') {
    const play = new THREE.Mesh(
      new THREE.CircleGeometry(0.18, 24),
      createPBR(0xe8a06a, { emissive: 0xc45c26, emissiveIntensity: 0.4 }),
    );
    play.position.z = 0.06;
    g.add(play);
  }

  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 1.2, 0.4),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hit.userData.isHotspot = true;
  hit.userData.hotspotId = hotspotId;
  g.add(hit);

  return g;
}

async function loadExhibitProp(
  url: string,
  label: string,
  onProgress?: LoadProgress,
  scale = 1,
): Promise<THREE.Group | null> {
  const model = await loadModel(url, label, onProgress);
  if (!model) return null;
  prepareGltfMaterials(model);
  model.scale.setScalar(scale);
  return model;
}

/**
 * Interior museo dentro de la casa (misma huella ~10×8).
 * Props GLB sobre pedestales; overlays HTML de hotspot sin cambios.
 */
export async function createInteriorMuseum(
  housePosition: THREE.Vector3,
  onProgress?: LoadProgress,
): Promise<MuseumResult> {
  const group = new THREE.Group();
  group.name = 'InteriorMuseum';
  group.position.copy(housePosition);
  group.visible = false;

  const floorY = 0.2;
  const w = 9.4;
  const d = 7.4;

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.1, d),
    createPBR(palette.interiorFloor, { roughness: 0.75 }),
  );
  floor.position.y = floorY;
  floor.receiveShadow = true;
  group.add(floor);

  const wallMat = createPBR(palette.interiorWall, { roughness: 0.9 });
  const ceilingMat = createPBR(0xe8e0d4, { roughness: 0.95 });

  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), ceilingMat);
  ceiling.position.y = 3.1;
  group.add(ceiling);

  const back = new THREE.Mesh(new THREE.BoxGeometry(w, 2.9, 0.12), wallMat);
  back.position.set(0, floorY + 1.45, -d / 2 + 0.1);
  group.add(back);

  const left = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.9, d), wallMat);
  left.position.set(-w / 2 + 0.1, floorY + 1.45, 0);
  group.add(left);

  const right = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.9, d), wallMat);
  right.position.set(w / 2 - 0.1, floorY + 1.45, 0);
  group.add(right);

  const ambient = new THREE.AmbientLight(0xfff2e0, 0.7);
  group.add(ambient);

  const lamp = new THREE.PointLight(0xffe0b8, 6.5, 18, 1.2);
  lamp.position.set(0, 2.55, 0);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(512, 512);
  group.add(lamp);

  const fillA = new THREE.PointLight(0xd4e8c8, 2.2, 12);
  fillA.position.set(-2.5, 2.0, 1.5);
  group.add(fillA);

  const fillB = new THREE.PointLight(0xffd7a8, 2.2, 12);
  fillB.position.set(2.5, 2.0, -1.5);
  group.add(fillB);

  onProgress?.('Cargando props del museo…');
  const [saco, taza, guaduaProp, artesaniaProp] = await Promise.all([
    loadExhibitProp(MODEL_URLS.sacoCafe, 'saco de café', onProgress),
    loadExhibitProp(MODEL_URLS.tazaCafe, 'taza de café', onProgress, 4),
    loadExhibitProp(MODEL_URLS.guadua, 'guadua', onProgress),
    loadExhibitProp(MODEL_URLS.artesania, 'artesanía', onProgress),
  ]);

  const cafeProp = new THREE.Group();
  cafeProp.name = 'CafeExhibit';
  if (saco) {
    saco.position.set(-0.12, 0, 0);
    cafeProp.add(saco);
  }
  if (taza) {
    taza.position.set(0.28, 0.02, 0.12);
    cafeProp.add(taza);
  }
  if (cafeProp.children.length === 0) {
    cafeProp.add(createFallbackProp(0x6b4423));
  }

  const hotspots: THREE.Object3D[] = [];

  const cafe = createPedestal('Café', 'cafe', 0x6b4423, cafeProp);
  cafe.position.set(-2.8, floorY, -1.5);
  group.add(cafe);
  hotspots.push(...cafe.children.filter((c) => c.userData.isHotspot));

  const guadua = createPedestal('Guadua', 'guadua', 0x2f6b35, guaduaProp);
  guadua.position.set(2.8, floorY, -1.5);
  group.add(guadua);
  hotspots.push(...guadua.children.filter((c) => c.userData.isHotspot));

  const artesania = createPedestal('Artesanía', 'artesania', 0xb87333, artesaniaProp);
  artesania.position.set(0, floorY, -2.6);
  group.add(artesania);
  hotspots.push(...artesania.children.filter((c) => c.userData.isHotspot));

  const videoPanel = createWallPanel('video', 'Video');
  videoPanel.position.set(-w / 2 + 0.2, floorY + 1.6, 1.2);
  videoPanel.rotation.y = Math.PI / 2;
  group.add(videoPanel);
  hotspots.push(...videoPanel.children.filter((c) => c.userData.isHotspot));

  const bench = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.45, 0.55),
    createPBR(palette.wood, { roughness: 0.85 }),
  );
  bench.position.set(0, floorY + 0.22, 1.5);
  bench.castShadow = true;
  group.add(bench);

  const exitTrigger = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 2.5, 1.2),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  exitTrigger.position.set(0, 1.3, d / 2 - 0.4);
  exitTrigger.userData.isExitTrigger = true;
  exitTrigger.name = 'ExitTrigger';
  group.add(exitTrigger);

  const exitSign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.28),
    new THREE.MeshBasicMaterial({ map: makeLabelTexture('Salida'), side: THREE.DoubleSide }),
  );
  exitSign.position.set(0, 2.4, d / 2 - 0.2);
  group.add(exitSign);

  return { group, hotspots, exitTrigger };
}
