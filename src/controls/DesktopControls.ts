import * as THREE from 'three';

const KEYS: Record<string, boolean> = {};

export interface DesktopControlsOptions {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLElement;
  eyeHeight?: number;
  speed?: number;
  bounds?: { minX: number; maxX: number; minZ: number; maxZ: number };
  /** Colisión simple: true = bloqueado */
  collides?: (x: number, z: number) => boolean;
}

/**
 * Controles FPS de escritorio: WASD + pointer lock.
 */
export class DesktopControls {
  readonly camera: THREE.PerspectiveCamera;
  private readonly dom: HTMLElement;
  private readonly eyeHeight: number;
  private readonly speed: number;
  private readonly bounds: DesktopControlsOptions['bounds'];
  private readonly collides?: (x: number, z: number) => boolean;

  private enabled = true;
  private locked = false;
  private euler = new THREE.Euler(0, 0, 0, 'YXZ');

  constructor(opts: DesktopControlsOptions) {
    this.camera = opts.camera;
    this.dom = opts.domElement;
    this.eyeHeight = opts.eyeHeight ?? 1.6;
    this.speed = opts.speed ?? 4.2;
    this.bounds = opts.bounds;
    this.collides = opts.collides;

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onPointerLockChange = this.onPointerLockChange.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  connect(): void {
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    this.dom.addEventListener('click', this.onClick);
  }

  disconnect(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    this.dom.removeEventListener('click', this.onClick);
    if (document.pointerLockElement === this.dom) document.exitPointerLock();
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
    if (!v && document.pointerLockElement === this.dom) document.exitPointerLock();
  }

  isLocked(): boolean {
    return this.locked;
  }

  setPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
  }

  lookAt(target: THREE.Vector3): void {
    this.camera.lookAt(target);
    this.euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
  }

  update(dt: number): void {
    if (!this.enabled) return;

    let inputX = 0;
    let inputZ = 0;
    if (KEYS['KeyW'] || KEYS['ArrowUp']) inputZ += 1;
    if (KEYS['KeyS'] || KEYS['ArrowDown']) inputZ -= 1;
    if (KEYS['KeyD'] || KEYS['ArrowRight']) inputX += 1;
    if (KEYS['KeyA'] || KEYS['ArrowLeft']) inputX -= 1;

    if (inputX !== 0 || inputZ !== 0) {
      const len = Math.hypot(inputX, inputZ);
      inputX /= len;
      inputZ /= len;
    }

    const boost = KEYS['ShiftLeft'] || KEYS['ShiftRight'] ? 1.7 : 1;
    const dist = this.speed * boost * dt;

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() > 0) forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const move = new THREE.Vector3();
    move.addScaledVector(forward, inputZ * dist);
    move.addScaledVector(right, inputX * dist);

    if (this.bounds) {
      const nx = this.camera.position.x + move.x;
      const nz = this.camera.position.z + move.z;
      if (nx < this.bounds.minX || nx > this.bounds.maxX) move.x = 0;
      if (nz < this.bounds.minZ || nz > this.bounds.maxZ) move.z = 0;
    }

    const tryX = this.camera.position.x + move.x;
    const tryZ = this.camera.position.z + move.z;
    if (this.collides?.(tryX, this.camera.position.z)) move.x = 0;
    if (this.collides?.(this.camera.position.x + move.x, tryZ)) move.z = 0;

    this.camera.position.x += move.x;
    this.camera.position.z += move.z;
    this.camera.position.y = this.eyeHeight;
  }

  private onClick(): void {
    if (!this.enabled) return;
    if (document.pointerLockElement !== this.dom) this.dom.requestPointerLock();
  }

  private onPointerLockChange(): void {
    this.locked = document.pointerLockElement === this.dom;
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.locked || !this.enabled) return;
    const movementX = e.movementX || 0;
    const movementY = e.movementY || 0;
    this.euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
    this.euler.y -= movementX * 0.0022;
    this.euler.x -= movementY * 0.0022;
    this.euler.x = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.euler.x));
    this.camera.quaternion.setFromEuler(this.euler);
  }

  private onKeyDown(e: KeyboardEvent): void {
    KEYS[e.code] = true;
  }

  private onKeyUp(e: KeyboardEvent): void {
    KEYS[e.code] = false;
  }
}

export function isKeyDown(code: string): boolean {
  return !!KEYS[code];
}
