import * as THREE from 'three';
import { createOutdoorScene, createSkyDome } from './OutdoorScene';
import { createHouse } from './House';
import { createInteriorMuseum } from './InteriorMuseum';
import { palette } from '../utils/materials';
import type { LoadProgress } from '../utils/gltfAssets';

export type ZoneId = 'valley' | 'house' | 'museum';

export interface World {
  scene: THREE.Scene;
  outdoor: THREE.Group;
  house: Awaited<ReturnType<typeof createHouse>>;
  museum: Awaited<ReturnType<typeof createInteriorMuseum>>;
  spawn: THREE.Vector3;
  setInteriorMode: (inside: boolean) => void;
  isInterior: () => boolean;
  getZone: (position: THREE.Vector3) => ZoneId;
}

export async function createWorld(onProgress?: LoadProgress): Promise<World> {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(palette.fog, 0.012);
  scene.background = new THREE.Color(palette.skyHorizon);

  const sky = createSkyDome();
  scene.add(sky);

  const hemi = new THREE.HemisphereLight(0xc8e4f0, 0x3d5a3a, 0.85);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff0d8, 1.35);
  sun.position.set(35, 50, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 140;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.bottom = -50;
  sun.shadow.bias = -0.0002;
  scene.add(sun);

  onProgress?.('Preparando el valle…');
  const outdoor = await createOutdoorScene(onProgress);
  scene.add(outdoor.group);

  onProgress?.('Colocando la casa típica…');
  const house = await createHouse(outdoor.houseApproach.clone().setY(0), onProgress);
  scene.add(house.group);

  onProgress?.('Montando el museo interior…');
  const museum = await createInteriorMuseum(outdoor.houseApproach.clone().setY(0), onProgress);
  scene.add(museum.group);

  let interior = false;

  const world: World = {
    scene,
    outdoor: outdoor.group,
    house,
    museum,
    spawn: new THREE.Vector3(0, 1.6, 10),
    setInteriorMode(inside: boolean) {
      interior = inside;
      museum.group.visible = inside;
      outdoor.group.visible = !inside;
      house.group.visible = !inside;
      sky.visible = !inside;
      sun.intensity = inside ? 0.05 : 1.35;
      hemi.intensity = inside ? 0.45 : 0.85;
      scene.background = new THREE.Color(inside ? 0x1e2a22 : palette.skyHorizon);
      scene.fog = inside
        ? new THREE.Fog(0xcfc6b8, 8, 22)
        : new THREE.FogExp2(palette.fog, 0.012);
    },
    isInterior() {
      return interior;
    },
    getZone(position: THREE.Vector3) {
      if (interior) return 'museum';
      const hx = house.group.position.x;
      const hz = house.group.position.z;
      if (Math.hypot(position.x - hx, position.z - hz) < 14) return 'house';
      return 'valley';
    },
  };

  onProgress?.('Listo');
  return world;
}
