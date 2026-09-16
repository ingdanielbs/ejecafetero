import * as THREE from 'three';
import { createOutdoorScene, createSkyDome } from './OutdoorScene';
import { createHouse } from './House';
import { createInteriorMuseum } from './InteriorMuseum';
import { palette } from '../utils/materials';

export type ZoneId = 'valley' | 'house' | 'museum';

export interface World {
  scene: THREE.Scene;
  outdoor: THREE.Group;
  house: ReturnType<typeof createHouse>;
  museum: ReturnType<typeof createInteriorMuseum>;
  spawn: THREE.Vector3;
  setInteriorMode: (inside: boolean) => void;
  isInterior: () => boolean;
  getZone: (position: THREE.Vector3) => ZoneId;
}

export function createWorld(): World {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(palette.fog, 0.012);
  scene.background = new THREE.Color(palette.skyHorizon);

  const sky = createSkyDome();
  scene.add(sky);

  // Iluminación exterior tipo mañana andina
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

  const outdoor = createOutdoorScene();
  scene.add(outdoor.group);

  const house = createHouse(outdoor.houseApproach.clone().setY(0));
  scene.add(house.group);

  const museum = createInteriorMuseum(outdoor.houseApproach.clone().setY(0));
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
      // Atenuar sol al entrar (simula interior)
      sun.intensity = inside ? 0.15 : 1.35;
      hemi.intensity = inside ? 0.25 : 0.85;
      scene.fog = inside
        ? new THREE.FogExp2(0xd8cfc0, 0.035)
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

  return world;
}
