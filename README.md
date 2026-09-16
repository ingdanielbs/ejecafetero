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
│   └── assets/          # GLTF, HDRI, audio, video (reemplazos futuros)
└── src/
    ├── main.ts          # bucle de render, interacción, zonas
    ├── styles.css
    ├── scenes/          # valle, casa, museo, ensamblado del mundo
    ├── controls/        # FPS escritorio + teletransporte XR
    ├── xr/              # WebXRManager + botón VR
    ├── ui/              # HUD en español + overlays de hotspots
    ├── audio/           # stub de audio ambiental
    └── utils/           # materiales PBR, palmas instanciadas
```

## Qué incluye el hito 1

1. **Exterior:** colinas verdes, niebla, cielo en gradiente, sendero y bosque de palmas de cera (procedural + `InstancedMesh`).
2. **Casa típica:** muros claros, madera, techo terracota, corredor y puerta-portal.
3. **Museo interior:** pedestales y panel de video stub; hotspots **Café**, **Guadua**, **Artesanía** (+ video) con overlay HTML en español.
4. **Rendimiento:** sombras acotadas, instancing de palmas, geometría simple orientada a Quest Browser.

## Sustituir placeholders por assets reales

| Elemento | Dónde enganchar | Formato sugerido |
|----------|-----------------|------------------|
| Palmas / vegetación | `src/utils/palmTree.ts` / `OutdoorScene` | `.glb` + `GLTFLoader` |
| Casa | `src/scenes/House.ts` | `.glb` con puerta nombrada |
| Interior / props | `src/scenes/InteriorMuseum.ts` | `.glb` + hotspots por `userData` |
| Cielo | `createSkyDome()` en `OutdoorScene` | HDRI vía `RGBELoader` → `scene.environment` |
| Audio | `src/audio/AmbientAudioStub.ts` | `public/assets/audio/ambiente.mp3` |
| Video hotspot | overlay en `src/ui/hud.ts` | `public/assets/video/….mp4` |

Mantén materiales **PBR** (`MeshStandardMaterial` / maps del GLTF) y un `scene.environment` para el look fotorrealista.

## Atribución de assets

El hito 1 **no incluye fotografías de lugares reales** ni modelos de terceros: todo es **geometría procedural**, SVG/canvas generados en código y un stub de audio sintético.

Cuando añadas recursos externos, documenta aquí licencia y autor (p. ej. Poly Haven HDRI CC0, Sketchfab con licencia permisiva, etc.).

## Licencia del código

Proyecto de demostración / base técnica para el Eje Cafetero. Ajusta la licencia según las necesidades del equipo.
