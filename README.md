# Valle del Cócora — Tour Virtual (Eje Cafetero)

Aplicación web inmersiva (Vite + TypeScript + Three.js) para explorar el **Valle del Cócora**, acercarse a una **casa típica** del paisaje cafetero y recorrer un **museo interior** con hotspots interactivos.

Compatible con **escritorio** (ratón + teclado) y **Meta Quest** vía **WebXR**.

## Requisitos

- Node.js 20+ (recomendado)
- Navegador moderno con WebGL2
- Para VR: Meta Quest Browser (u otro con `immersive-vr`)

## Instalación y scripts

```bash
npm install
npm run dev      # servidor de desarrollo (http://localhost:5173)
npm run build    # compilación de producción → dist/
npm run preview  # servir el build localmente
npm run typecheck
npm run smoke    # recorrido Playwright (requiere `npm run dev`)
```

## Controles (escritorio)

| Acción | Entrada |
|--------|---------|
| Moverse | `W` `A` `S` `D` (o flechas) |
| Correr | `Shift` |
| Mirar | clic en el canvas (pointer lock) + ratón |
| Interactuar / entrar / salir | `E` o clic sobre el hotspot |
| Soltar el ratón / cerrar panel | `Esc` |

## WebXR (Meta Quest)

**Locomoción elegida: teletransporte.** Es la opción más fiable y cómoda para un recorrido tipo museo en Quest (menos mareo que el movimiento suave continuo, y encaja bien con suelos irregulares / interiores).

- Botón **«Entrar en VR»** (esquina inferior derecha) cuando el navegador soporta `immersive-vr`.
- **Mando primario (select/gatillo):** apunta al suelo y suelta para teletransportarte.
- **Mando secundario:** apunta a puerta / hotspots y pulsa select para interactuar.

### Cómo probar en Quest

WebXR exige un origen seguro: **HTTPS** o **localhost**.

1. **Misma red Wi‑Fi** que el PC de desarrollo.
2. Opciones habituales:
   - Túnel HTTPS (`npx localtunnel --port 5173`, Cloudflare Tunnel, ngrok, etc.) y abrir la URL `https://…` en **Quest Browser**.
   - O servir con certificados locales y visitar la IP del PC por HTTPS.
3. Acepta permisos de VR cuando el navegador lo pida.
4. Pulsa **Entrar en VR**.

> Nota: `http://IP-LAN:5173` suele **bloquear** WebXR fuera de localhost. Usa HTTPS.

## Mapa de carpetas

```
├── index.html
├── package.json
├── vite.config.ts
├── public/
│   └── assets/
│       └── models/      # GLB Blender (casa, palmas, terreno, props)
└── src/
    ├── main.ts          # bucle de render, interacción, zonas
    ├── styles.css
    ├── scenes/          # valle, casa, museo, ensamblado del mundo
    ├── controls/        # FPS escritorio + teletransporte XR
    ├── xr/              # WebXRManager + botón VR
    ├── ui/              # HUD en español + overlays de hotspots
    ├── audio/           # stub de audio ambiental
    └── utils/           # GLTFLoader, materiales PBR, bosque de palmas
```

## Mapa de assets GLB

| Archivo | Escena | Notas |
|---------|--------|-------|
| `casa_tipica_eje_cafetero.glb` | Valle / casa | Reemplaza la casa procedural; trigger de puerta según bounds del mesh |
| `palma_cera.glb` | Valle | Clones con escala 0.4–0.65 (~19–31 m) |
| `terreno_colina_modulo.glb` | Valle | Parches de colina sobre el suelo procedural |
| `prop_saco_cafe.glb` | Museo | Pedestal **Café** |
| `prop_taza_cafe.glb` | Museo | Junto al saco (escala ×4 para lectura de museo) |
| `prop_guadua.glb` | Museo | Pedestal **Guadua** |
| `prop_artesania.glb` | Museo | Pedestal **Artesanía** |

Convención Blender: **1 unidad = 1 metro**, origen en el suelo, +Y arriba. Ver `public/assets/models/README.md`.

Carga con `GLTFLoader` (`src/utils/gltfAssets.ts`). Si un archivo falla, el tour muestra un aviso en español y cae a geometría procedural / props stub **sin romper** WebXR, WASD ni el flujo museo.

## Qué incluye el tour

1. **Exterior:** colinas, módulos GLB de terreno, niebla, cielo en gradiente, sendero y bosque de palmas de cera (GLB + fallback `InstancedMesh`).
2. **Casa típica:** modelo Blender con portal; entrada con `E` / raycast al trigger.
3. **Museo interior:** pedestales con props GLB; hotspots **Café**, **Guadua**, **Artesanía** (+ video stub) con overlay HTML en español.
4. **Rendimiento:** sombras acotadas, clones ligeros de palma, geometría baja orientada a Quest Browser.

## Sustituir o ampliar assets

| Elemento | Dónde enganchar | Formato |
|----------|-----------------|---------|
| Palmas / vegetación | `src/utils/palmTree.ts` / `OutdoorScene` | `.glb` + `GLTFLoader` |
| Casa | `src/scenes/House.ts` | `.glb` (fachada −Z en Blender) |
| Interior / props | `src/scenes/InteriorMuseum.ts` | `.glb` + hotspots por `userData` |
| Cielo | `createSkyDome()` en `OutdoorScene` | HDRI vía `RGBELoader` |
| Audio | `src/audio/AmbientAudioStub.ts` | `public/assets/audio/ambiente.mp3` |
| Video hotspot | overlay en `src/ui/hud.ts` | `public/assets/video/….mp4` |

Mantén materiales **PBR** (`MeshStandardMaterial` / maps del GLTF) y un `scene.environment` si añades HDRI.

## Atribución de assets

Los modelos en `public/assets/models/` son **geometría procedural generada en Blender 4.2 LTS** para este proyecto (sin texturas externas). Documenta aquí cualquier recurso de terceros que añadas (licencia y autor).

## Licencia del código

Proyecto de demostración / base técnica para el Eje Cafetero. Ajusta la licencia según las necesidades del equipo.
