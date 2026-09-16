import * as THREE from 'three';

export interface TeleportOptions {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  /** Altura de ojos aproximada en modo VR (reference space) */
  eyeHeight?: number;
  /** Capas/objetos sobre los que se puede teletransportar */
  getTeleportSurfaces: () => THREE.Object3D[];
  /** Validar destino */
  isValidTarget?: (point: THREE.Vector3) => boolean;
  onTeleport?: (point: THREE.Vector3) => void;
}

/**
 * Locomoción por teletransporte (recomendado para Quest / museo).
 * Más fiable y menos mareo que movimiento suave continuo.
 *
 * Uso: mantén el gatillo / select del mando, apunta al suelo,
 * suelta para teletransportarte.
 */
export class TeleportControls {
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.Camera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly eyeHeight: number;
  private readonly getTeleportSurfaces: () => THREE.Object3D[];
  private readonly isValidTarget?: (point: THREE.Vector3) => boolean;
  private readonly onTeleport?: (point: THREE.Vector3) => void;

  private controllers: THREE.XRTargetRaySpace[] = [];
  private controllerGrips: THREE.XRGripSpace[] = [];
  private raycaster = new THREE.Raycaster();
  private tempMatrix = new THREE.Matrix4();
  private marker: THREE.Mesh;
  private line: THREE.Line;
  private aiming = false;
  private aimPoint = new THREE.Vector3();
  private valid = false;
  private baseReferenceSpace: XRReferenceSpace | null = null;
  private offsetPosition = new THREE.Vector3();
  private connected = false;

  constructor(opts: TeleportOptions) {
    this.scene = opts.scene;
    this.camera = opts.camera;
    this.renderer = opts.renderer;
    this.eyeHeight = opts.eyeHeight ?? 1.6;
    this.getTeleportSurfaces = opts.getTeleportSurfaces;
    this.isValidTarget = opts.isValidTarget;
    this.onTeleport = opts.onTeleport;

    const markerGeo = new THREE.RingGeometry(0.25, 0.35, 32);
    markerGeo.rotateX(-Math.PI / 2);
    this.marker = new THREE.Mesh(
      markerGeo,
      new THREE.MeshBasicMaterial({
        color: 0xe8a06a,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthTest: false,
      }),
    );
    this.marker.visible = false;
    this.marker.renderOrder = 10;
    this.scene.add(this.marker);

    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1),
    ]);
    this.line = new THREE.Line(
      lineGeo,
      new THREE.LineBasicMaterial({ color: 0xe8a06a, transparent: true, opacity: 0.7 }),
    );
    this.line.visible = false;
  }

  connect(): void {
    if (this.connected) return;
    this.connected = true;

    for (let i = 0; i < 2; i++) {
      const controller = this.renderer.xr.getController(i);
      controller.addEventListener('selectstart', () => this.onSelectStart(controller));
      controller.addEventListener('selectend', () => this.onSelectEnd(controller));
      controller.add(this.line.clone());
      this.scene.add(controller);
      this.controllers.push(controller);

      const grip = this.renderer.xr.getControllerGrip(i);
      // Indicador simple del mando
      const tip = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.04, 0.12),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5 }),
      );
      tip.position.z = -0.05;
      grip.add(tip);
      this.scene.add(grip);
      this.controllerGrips.push(grip);
    }

    this.renderer.xr.addEventListener('sessionstart', () => {
      const ref = this.renderer.xr.getReferenceSpace();
      this.baseReferenceSpace = ref;
      this.offsetPosition.set(0, 0, 0);
    });
  }

  /** Teletransporte programático (p. ej. entrar/salir de la casa en VR). */
  teleportTo(point: THREE.Vector3): void {
    this.applyTeleport(point);
  }

  getOffsetPosition(): THREE.Vector3 {
    return this.offsetPosition.clone();
  }

  update(): void {
    if (!this.renderer.xr.isPresenting || !this.aiming) {
      this.marker.visible = false;
      return;
    }

    const controller = this.controllers.find((c) => c.userData.aiming);
    if (!controller) {
      this.marker.visible = false;
      return;
    }

    this.tempMatrix.identity().extractRotation(controller.matrixWorld);
    this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.tempMatrix);

    const hits = this.raycaster.intersectObjects(this.getTeleportSurfaces(), true);
    if (hits.length > 0) {
      const hit = hits[0];
      this.aimPoint.copy(hit.point);
      this.valid = this.isValidTarget ? this.isValidTarget(this.aimPoint) : true;
      this.marker.position.copy(this.aimPoint);
      this.marker.position.y += 0.02;
      (this.marker.material as THREE.MeshBasicMaterial).color.setHex(
        this.valid ? 0xe8a06a : 0xaa3333,
      );
      this.marker.visible = true;

      // Actualizar línea del mando
      const line = controller.children.find((c) => (c as THREE.Line).isLine) as THREE.Line | undefined;
      if (line) {
        const dist = hit.distance;
        line.scale.z = dist;
        line.visible = true;
      }
    } else {
      this.valid = false;
      this.marker.visible = false;
    }
  }

  private onSelectStart(controller: THREE.XRTargetRaySpace): void {
    if (!this.renderer.xr.isPresenting) return;
    controller.userData.aiming = true;
    this.aiming = true;
  }

  private onSelectEnd(controller: THREE.XRTargetRaySpace): void {
    controller.userData.aiming = false;
    this.aiming = this.controllers.some((c) => c.userData.aiming);
    const line = controller.children.find((c) => (c as THREE.Line).isLine) as THREE.Line | undefined;
    if (line) {
      line.scale.z = 1;
      line.visible = false;
    }
    if (this.valid && this.marker.visible) {
      this.applyTeleport(this.aimPoint);
    }
    this.marker.visible = false;
  }

  private applyTeleport(point: THREE.Vector3): void {
    // Offset del reference space: el jugador se mueve al punto (suelo).
    this.offsetPosition.set(point.x, point.y, point.z);

    const base = this.baseReferenceSpace ?? this.renderer.xr.getReferenceSpace();
    if (!base) {
      // Fallback: mover la cámara (desktop no debería llegar aquí)
      this.camera.position.set(point.x, point.y + this.eyeHeight, point.z);
      this.onTeleport?.(point);
      return;
    }

    const offsetTransform = new XRRigidTransform({
      x: -point.x,
      y: -point.y,
      z: -point.z,
    });
    const space = base.getOffsetReferenceSpace(offsetTransform);
    this.renderer.xr.setReferenceSpace(space);
    this.onTeleport?.(point);
  }
}
