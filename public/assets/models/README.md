# Assets GLB — Eje Cafetero / Valle del Cócora

Modelos procedurales generados con **Blender 4.2.23 LTS** (headless) para el tour Three.js + WebXR.

## Convención de escena

| Parámetro | Valor |
|-----------|--------|
| Unidad | **1 unidad = 1 metro** |
| Origen | En el **suelo** (contacto con el piso), centrado en XZ |
| Ejes | **+Y arriba** (glTF / Three.js). Casa con fachada/porche hacia **−Z** cuando aplica |
| Materiales | Principled BSDF (PBR-friendly), sin texturas externas |
| Formato | `.glb` (binario glTF 2.0) |

Escala sugerida en Three.js: `model.scale.set(1, 1, 1)` (ya en metros). Ajusta solo si quieres variación (p. ej. palmas de distinta altura).

## Archivos

### Escenario / arquitectura

| Archivo | Descripción | Escala sugerida | Tris (aprox.) |
|---------|-------------|-----------------|---------------|
| `casa_tipica_eje_cafetero.glb` | Casa típica cafetera: muros blancos, madera, teja de barro, porche y puerta. Cáscara exterior + interior simple para caminar dentro (~10 m de frente). | `1` | ~400 |
| `palma_cera.glb` | Palma de cera individual (~30 m): tronco cónico + corona y frondas. Pivot en la base. Optimizada para Quest (&lt;15k tris). | `1` (o `0.7`–`1.2` para variedad) | ~3.7k |
| `terreno_colina_modulo.glb` | Parche de colina suave ~20×20 m, reusable para mosaico o base del valle. | `1` (puedes escalar XZ para variar) | ~2k |

### Props de museo (pedestal)

| Archivo | Descripción | Escala sugerida | Tris (aprox.) |
|---------|-------------|-----------------|---------------|
| `prop_saco_cafe.glb` | Saco de café en yute con amarre | `1` (~0.9 m alto) | ~540 |
| `prop_taza_cafe.glb` | Taza + plato + café | `1` (~8 cm) o `8`–`12` si quieres “gigante” de museo | ~530 |
| `prop_guadua.glb` | Haz de cañas de guadua atadas | `1` (~1.6 m) | ~2.4k |
| `prop_artesania.glb` | Vasija de barro con bandeja tejida | `1` (~30 cm) | ~1k |

## Uso rápido en Three.js

```js
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
<<<<<<< HEAD
loader.load('/assets/casa_tipica_eje_cafetero.glb', (gltf) => {
=======
loader.load('/assets/models/casa_tipica_eje_cafetero.glb', (gltf) => {
>>>>>>> dcee0a713b95cba146c2227912d1805f256c45b0
  const casa = gltf.scene;
  casa.position.set(0, 0, -15); // metros
  scene.add(casa);
});
```

Para WebXR / Meta Quest: preferir estos meshes de bajo polígono; combina con lightmaps o `MeshStandardMaterial` ya embebido en el GLB. Instancia `palma_cera` y `terreno_colina_modulo` con `InstancedMesh` o clones para el valle.

## Regenerar

Scripts en `scripts/`. Ejemplo:

```bash
/workspace/tools/blender-4.2.23-linux-x64/blender --background \
  --python /workspace/ejecafetero-assets/scripts/gen_casa.py
```

Scripts: `gen_casa.py`, `gen_palma.py`, `gen_terreno.py`, `gen_props.py` (+ `common.py`).

## Notas / limitaciones

- Geometría **procedural** (bloques, conos, esferas): adecuada para prototipo y Quest; no sustituye assets artísticos finales.
- Sin texturas baked ni AO; colores sólidos PBR.
- La casa es una cáscara walkable, no incluye muebles ni collider detallado (añade `MeshBVH` / colliders en Three.js).
- La palma no usa hojas billboard; frondas son sólidos bajos en polígonos.

## Siguiente paso de integración

1. Copiar los `.glb` al `public/assets/` (o CDN) del tour.
2. Cargar con `GLTFLoader` / `DRACOLoader` si más adelante comprimes con Draco.
3. Colocar `terreno_colina_modulo` como base, instanciar `palma_cera` a lo largo del valle, y la `casa` como POI walkable.
4. Montar los `prop_*` sobre pedestales en la sala museo / info points.
