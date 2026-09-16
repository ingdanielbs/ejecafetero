import * as THREE from 'three';
import { createPBR, palette } from '../utils/materials';
import { createPalmForest } from '../utils/palmTree';

export interface OutdoorSceneResult {
  group: THREE.Group;
  pathPoints: THREE.Vector3[];
  houseApproach: THREE.Vector3;
}

export function createOutdoorScene(): OutdoorSceneResult {
  const group = new THREE.Group();
  group.name = 'OutdoorScene';

  // Terreno ondulado simple
  const groundGeo = new THREE.PlaneGeometry(220, 220, 64, 64);
  const pos = groundGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const h =
      Math.sin(x * 0.04) * 1.8 +
      Math.cos(y * 0.035) * 2.2 +
      Math.sin((x + y) * 0.02) * 1.4;
    // Valle central más bajo
    const dist = Math.hypot(x, y);
    const valley = THREE.MathUtils.smoothstep(12, 55, dist) * h;
    pos.setZ(i, valley);
  }
  groundGeo.computeVertexNormals();
  const ground = new THREE.Mesh(
    groundGeo,
    createPBR(palette.grass, { roughness: 0.95, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Colinas lejanas (siluetas)
  const hillMat = createPBR(palette.grassDark, { roughness: 1 });
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + 0.2;
    const r = 85 + (i % 3) * 8;
    const hill = new THREE.Mesh(
      new THREE.SphereGeometry(18 + (i % 4) * 4, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
      hillMat,
    );
    hill.position.set(Math.cos(angle) * r, -2, Math.sin(angle) * r);
    hill.scale.set(1.4, 0.55 + (i % 3) * 0.15, 1.2);
    hill.receiveShadow = true;
    group.add(hill);
  }

  // Sendero hacia la casa (z negativo)
  const pathPoints: THREE.Vector3[] = [];
  for (let t = 0; t <= 1; t += 0.05) {
    const z = THREE.MathUtils.lerp(8, -28, t);
    const x = Math.sin(t * Math.PI) * 2.5;
    pathPoints.push(new THREE.Vector3(x, 0.05, z));
  }

  const pathCurve = new THREE.CatmullRomCurve3(pathPoints);
  const pathGeo = new THREE.TubeGeometry(pathCurve, 48, 1.1, 6, false);
  const path = new THREE.Mesh(pathGeo, createPBR(palette.path, { roughness: 0.98 }));
  path.position.y = 0.02;
  path.receiveShadow = true;
  group.add(path);

  const houseApproach = new THREE.Vector3(0, 0, -30);

  createPalmForest(
    group,
    48,
    { minX: -70, maxX: 70, minZ: -70, maxZ: 70 },
    (x, z) => {
      // Evitar sendero y patio de la casa
      if (Math.abs(x) < 5 && z < 12 && z > -40) return true;
      if (Math.hypot(x - houseApproach.x, z - houseApproach.z) < 12) return true;
      return false;
    },
  );

  // Algunas rocas / hitos
  const rockMat = createPBR(0x6a6a62, { roughness: 0.95 });
  for (let i = 0; i < 10; i++) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.4 + Math.random() * 0.6, 0),
      rockMat,
    );
    const side = i % 2 === 0 ? 1 : -1;
    rock.position.set(side * (3.5 + Math.random() * 2), 0.25, 5 - i * 3.2);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  }

  return { group, pathPoints, houseApproach };
}

export function createSkyDome(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(180, 32, 16);
  const uniforms = {
    topColor: { value: new THREE.Color(palette.skyTop) },
    bottomColor: { value: new THREE.Color(palette.skyHorizon) },
    offset: { value: 8 },
    exponent: { value: 0.55 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
        float t = max(pow(max(h, 0.0), exponent), 0.0);
        gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const sky = new THREE.Mesh(geo, mat);
  sky.name = 'SkyDome';
  return sky;
}
