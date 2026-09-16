import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** Rutas públicas de modelos GLB (1 unidad = 1 m). */
export const MODEL_URLS = {
  casa: '/assets/models/casa_tipica_eje_cafetero.glb',
  palma: '/assets/models/palma_cera.glb',
  terreno: '/assets/models/terreno_colina_modulo.glb',
  sacoCafe: '/assets/models/prop_saco_cafe.glb',
  tazaCafe: '/assets/models/prop_taza_cafe.glb',
  guadua: '/assets/models/prop_guadua.glb',
  artesania: '/assets/models/prop_artesania.glb',
} as const;

const loader = new GLTFLoader();
const cache = new Map<string, Promise<THREE.Group>>();

export type LoadProgress = (message: string) => void;

function enableShadows(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });
}

/**
 * Carga un GLB y lo cachea. Si falla, resuelve `null` (fallback procedural).
 */
export function loadModel(
  url: string,
  label: string,
  onProgress?: LoadProgress,
): Promise<THREE.Group | null> {
  const existing = cache.get(url);
  if (existing) {
    return existing.then((g) => g.clone(true));
  }

  onProgress?.(`Cargando ${label}…`);
  const promise = new Promise<THREE.Group>((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const root = gltf.scene;
        root.name = label;
        enableShadows(root);
        resolve(root);
      },
      undefined,
      (err) => reject(err),
    );
  });

  cache.set(
    url,
    promise.catch((err) => {
      cache.delete(url);
      throw err;
    }),
  );

  return promise
    .then((g) => g.clone(true))
    .catch((err) => {
      console.warn(`[assets] No se pudo cargar ${label} (${url}):`, err);
      onProgress?.(`No se pudo cargar ${label}; usando geometría de reserva.`);
      return null;
    });
}

/** Ajusta materiales embebidos a espacio de color correcto. */
export function prepareGltfMaterials(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      const std = mat as THREE.MeshStandardMaterial;
      if (std.map) std.map.colorSpace = THREE.SRGBColorSpace;
      if ('color' in std && std.color) std.needsUpdate = true;
    }
  });
}
