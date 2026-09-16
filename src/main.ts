import './styles.css';
import * as THREE from 'three';
import { createWorld } from './scenes/createWorld';
import { DesktopControls } from './controls/DesktopControls';
import { TeleportControls } from './controls/TeleportControls';
import { setupXR } from './xr/setupXR';
import { createUI } from './ui/hud';
import type { HotspotId } from './ui/hotspotContent';
import { AmbientAudioStub } from './audio/AmbientAudioStub';

const canvas = document.querySelector('#c') as HTMLCanvasElement;
const uiRoot = document.querySelector('#ui-root') as HTMLElement;
const ui = createUI(uiRoot);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 250);

ui.setLoading('Cargando modelos del Valle del Cócora…');
const world = await createWorld((message) => ui.setLoading(message));
ui.setLoading(null);
camera.position.copy(world.spawn);

function collidesWithHouse(x: number, z: number, forTeleport = false): boolean {
  if (world.isInterior()) return false;
  const hp = world.house.group.position;
  const halfW = world.house.halfW;
  const halfD = world.house.halfD;
  const insideFootprint = Math.abs(x - hp.x) < halfW && Math.abs(z - hp.z) < halfD;
  if (!insideFootprint) return false;
  // Hueco de puerta hacia +Z (fachada)
  const doorZ = hp.z + halfD - 0.2;
  if (z > doorZ - 0.8 && Math.abs(x - hp.x) < 1.1) return false;
  return forTeleport || true;
}

const desktop = new DesktopControls({
  camera,
  domElement: canvas,
  eyeHeight: 1.6,
  speed: 4.5,
  bounds: { minX: -90, maxX: 90, minZ: -90, maxZ: 90 },
  collides: (x, z) => collidesWithHouse(x, z),
});
desktop.connect();
desktop.lookAt(new THREE.Vector3(0, 1.6, -20));

const teleport = new TeleportControls({
  scene: world.scene,
  camera,
  renderer,
  getTeleportSurfaces: () => {
    if (world.isInterior()) return [world.museum.group];
    return [world.outdoor, world.house.group];
  },
  isValidTarget: (p) => {
    if (world.isInterior()) {
      const hp = world.house.group.position;
      return Math.abs(p.x - hp.x) < world.house.halfW - 0.6 && Math.abs(p.z - hp.z) < world.house.halfD - 0.6;
    }
    return !collidesWithHouse(p.x, p.z, true);
  },
});
teleport.connect();

const audio = new AmbientAudioStub();
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
raycaster.far = 4.5;
const pointer = new THREE.Vector2(0, 0);
const rotMatrix = new THREE.Matrix4();

const zoneLabels: Record<string, string> = {
  valley: 'Valle del Cócora',
  house: 'Casa típica',
  museum: 'Museo — interior',
};

function enterMuseum(): void {
  world.setInteriorMode(true);
  const target = world.house.doorInterior;
  const lookTarget = world.house.group.position.clone().add(new THREE.Vector3(0, 1.5, -2));
  if (renderer.xr.isPresenting) {
    teleport.teleportTo(new THREE.Vector3(target.x, 0, target.z));
  } else {
    desktop.setPosition(target.x, 1.6, target.z);
    desktop.lookAt(lookTarget);
  }
  ui.setZone(zoneLabels.museum);
  ui.setPrompt(null);
}

function exitMuseum(): void {
  world.setInteriorMode(false);
  const target = world.house.doorExterior;
  const lookTarget = target.clone().add(new THREE.Vector3(0, 0, 8));
  if (renderer.xr.isPresenting) {
    teleport.teleportTo(new THREE.Vector3(target.x, 0, target.z));
  } else {
    desktop.setPosition(target.x, 1.6, target.z);
    desktop.lookAt(lookTarget);
  }
  ui.setZone(zoneLabels.house);
  ui.setPrompt(null);
}

function getPlayerPosition(): THREE.Vector3 {
  const p = new THREE.Vector3();
  camera.getWorldPosition(p);
  return p;
}

function gatherInteractables(): THREE.Object3D[] {
  const list: THREE.Object3D[] = [];
  if (world.isInterior()) {
    list.push(world.museum.exitTrigger);
    world.museum.group.traverse((obj) => {
      if (obj.userData.isHotspot) list.push(obj);
    });
  } else {
    world.house.group.traverse((obj) => {
      if (obj.userData.isDoorTrigger) list.push(obj);
    });
  }
  return list;
}

function configureRaycasterFromView(): void {
  if (renderer.xr.isPresenting) {
    const ctrl = renderer.xr.getController(0);
    rotMatrix.identity().extractRotation(ctrl.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(ctrl.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(rotMatrix);
  } else {
    raycaster.setFromCamera(pointer, camera);
  }
}

function updateInteraction(): void {
  if (ui.isOverlayOpen()) {
    ui.setPrompt('Pulsa Esc para cerrar');
    ui.setCrosshairHot(false);
    return;
  }

  configureRaycasterFromView();
  const hits = raycaster.intersectObjects(gatherInteractables(), false);
  const hit = hits[0];

  if (!hit) {
    const pos = getPlayerPosition();
    if (!world.isInterior()) {
      if (pos.distanceTo(world.house.doorExterior) < 2.8) {
        ui.setPrompt('Pulsa E para entrar a la casa');
        ui.setCrosshairHot(true);
        return;
      }
    } else {
      const exit = new THREE.Vector3().setFromMatrixPosition(world.museum.exitTrigger.matrixWorld);
      if (pos.distanceTo(exit) < 2.5) {
        ui.setPrompt('Pulsa E para salir al valle');
        ui.setCrosshairHot(true);
        return;
      }
    }
    ui.setPrompt(null);
    ui.setCrosshairHot(false);
    return;
  }

  const obj = hit.object;
  if (obj.userData.isHotspot) {
    ui.setPrompt('Pulsa E o clic para ver el exhibidor');
    ui.setCrosshairHot(true);
  } else if (obj.userData.isDoorTrigger) {
    ui.setPrompt('Pulsa E para entrar a la casa');
    ui.setCrosshairHot(true);
  } else if (obj.userData.isExitTrigger) {
    ui.setPrompt('Pulsa E para salir al valle');
    ui.setCrosshairHot(true);
  }
}

function tryInteract(): void {
  if (ui.isOverlayOpen()) {
    ui.closeHotspot();
    return;
  }

  configureRaycasterFromView();
  const hits = raycaster.intersectObjects(gatherInteractables(), false);
  if (hits.length > 0) {
    const obj = hits[0].object;
    if (obj.userData.isHotspot) {
      ui.openHotspot(obj.userData.hotspotId as HotspotId);
      return;
    }
    if (obj.userData.isDoorTrigger) {
      enterMuseum();
      return;
    }
    if (obj.userData.isExitTrigger) {
      exitMuseum();
      return;
    }
  }

  const pos = getPlayerPosition();
  if (!world.isInterior()) {
    if (pos.distanceTo(world.house.doorExterior) < 2.8) enterMuseum();
  } else {
    const exit = new THREE.Vector3().setFromMatrixPosition(world.museum.exitTrigger.matrixWorld);
    if (pos.distanceTo(exit) < 2.5) exitMuseum();
  }
}

function onResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onResize);

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyE') tryInteract();
  if (e.code === 'Escape' && ui.isOverlayOpen()) ui.closeHotspot();
});

canvas.addEventListener('click', () => {
  void audio.tryStart();
  if (desktop.isLocked() && !ui.isOverlayOpen()) {
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(gatherInteractables(), false);
    if (hits[0]?.object.userData.isHotspot) {
      ui.openHotspot(hits[0].object.userData.hotspotId as HotspotId);
    }
  }
});

const interactController = renderer.xr.getController(1);
interactController.addEventListener('selectstart', () => {
  if (!renderer.xr.isPresenting) return;
  rotMatrix.identity().extractRotation(interactController.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(interactController.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(rotMatrix);
  const hits = raycaster.intersectObjects(gatherInteractables(), false);
  const obj = hits[0]?.object;
  if (!obj) return;
  if (obj.userData.isHotspot) ui.openHotspot(obj.userData.hotspotId as HotspotId);
  else if (obj.userData.isDoorTrigger) enterMuseum();
  else if (obj.userData.isExitTrigger) exitMuseum();
});

await setupXR(renderer, ui);

/** API mínima para pruebas automatizadas (no afecta la UX). */
(window as unknown as { __tourDebug: Record<string, unknown> }).__tourDebug = {
  enterMuseum,
  exitMuseum,
  openHotspot: (id: HotspotId) => ui.openHotspot(id),
  getZone: () => world.getZone(getPlayerPosition()),
  isInterior: () => world.isInterior(),
  setPosition: (x: number, y: number, z: number) => desktop.setPosition(x, y, z),
  getPosition: () => {
    const p = getPlayerPosition();
    return { x: p.x, y: p.y, z: p.z };
  },
};

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const presenting = renderer.xr.isPresenting;

  desktop.setEnabled(!presenting && !ui.isOverlayOpen());
  if (!presenting && !ui.isOverlayOpen()) desktop.update(dt);
  if (presenting) teleport.update();

  updateInteraction();
  ui.setZone(zoneLabels[world.getZone(getPlayerPosition())]);
  renderer.render(world.scene, camera);
});
