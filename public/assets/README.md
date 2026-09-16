# Assets públicos

Recursos estáticos servidos sin pasar por el bundler de Vite.

```
public/assets/
  models/     # GLB Blender (casa, palmas, terreno, props museo)
  hdri/       # cielo.hdr / .env (futuro)
  audio/      # ambiente.mp3 (futuro)
  video/      # documental.mp4 (futuro)
  textures/   # PBR maps (futuro)
```

## Modelos GLB (`models/`)

| Archivo | Uso en el tour |
|---------|----------------|
| `casa_tipica_eje_cafetero.glb` | Casa del valle (`src/scenes/House.ts`) |
| `palma_cera.glb` | Bosque de clones (`src/utils/palmTree.ts`) |
| `terreno_colina_modulo.glb` | Colinas decorativas (`OutdoorScene`) |
| `prop_saco_cafe.glb` | Pedestal Café |
| `prop_taza_cafe.glb` | Complemento del pedestal Café (escala ×4) |
| `prop_guadua.glb` | Pedestal Guadua |
| `prop_artesania.glb` | Pedestal Artesanía |

Convención: **1 unidad = 1 m**, origen en el suelo. Detalle completo en `models/README.md`.

Si un GLB falla al cargar, el tour usa geometría procedural de reserva y muestra un aviso en la pantalla de carga.
