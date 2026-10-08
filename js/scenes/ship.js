// "Why us": top-down container ship. Camera follows the ship, then climbs up
// through cloud layers into white (hand-off to the plane section).
import * as THREE from 'three';
import { createStage, makeContainer, seeded, lerp, seg } from './util.js';

const NOISE = /* glsl */ `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1,0)), u.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
`;
// Two alternating bay colour patterns (5 columns each)
const BAY_A = ['#2fa04f', '#e2452f', '#3a22d6', '#4f8fe6', '#ee6a2a'];
const BAY_B = ['#2c1fb8', '#e65c9c', '#efefef', '#ee6a2a', '#f1b43c'];

function buildShip() {
  const ship = new THREE.Group();
  const W = 7.2;
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-W, -26);
  hullShape.lineTo(W, -26);
  hullShape.lineTo(W, 14);
  hullShape.quadraticCurveTo(W, 24, 0, 30);
  hullShape.quadraticCurveTo(-W, 24, -W, 14);
  hullShape.lineTo(-W, -26);
  const hullGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 3, bevelEnabled: true, bevelSize: 0.35, bevelThickness: 0.35, bevelSegments: 2 });
  hullGeo.rotateX(-Math.PI / 2); // bow toward -Z
  ship.add(new THREE.Mesh(hullGeo, new THREE.MeshStandardMaterial({ color: '#1b3566', roughness: 0.5, metalness: 0.3 })));
  const deck = new THREE.Mesh(new THREE.ShapeGeometry(hullShape).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#5b84b8', roughness: 0.75 }));
  deck.position.y = 3.37; deck.scale.set(0.95, 1, 0.97);
  ship.add(deck);

  const dark = new THREE.MeshStandardMaterial({ color: '#2a3f63', roughness: 0.7 });
  const rail = new THREE.MeshStandardMaterial({ color: '#c9d6e8', roughness: 0.5 });
  const add = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); ship.add(b); return b; };
  let bay = 0;
  for (let bz = -17; bz <= 16; bz += 6.6, bay++) {
    add(14.2, 0.6, 0.55, dark, 0, 3.7 + 5.2, bz - 3.3);   // lashing bridge between bays
    add(0.25, 0.6, 0.55, rail, -6.9, 3.7 + 5.2, bz - 3.3);
    add(0.25, 0.6, 0.55, rail, 6.9, 3.7 + 5.2, bz - 3.3);
    const cols = bay % 2 ? BAY_B : BAY_A;
    [-4.95, -2.475, 0, 2.475, 4.95].forEach((x, i) => {
      for (let k = 0; k < 2; k++) {
        const c = makeContainer(cols[i], { length: 6, ribTop: true });
        c.rotation.y = Math.PI / 2;
        c.position.set(x, 3.37 + 1.3 + k * 2.6, bz);
        ship.add(c);
      }
    });
  }
  // superstructure at the stern
  const white = new THREE.MeshStandardMaterial({ color: '#f2f2f2', roughness: 0.5 });
  add(12, 11, 4.4, white, 0, 3.4 + 5.5, 22.4);
  add(15.6, 0.35, 1.8, white, 0, 3.4 + 10.6, 20.6);
  add(12.2, 0.3, 4.6, new THREE.MeshStandardMaterial({ color: '#dcdcdc' }), 0, 3.4 + 11.1, 22.4);
  add(1.8, 1.6, 1.8, new THREE.MeshStandardMaterial({ color: '#203a66' }), 0, 3.4 + 12, 23.5);
  add(0.2, 3.2, 0.2, white, 2.2, 3.4 + 12.8, 22.4);
  add(0.2, 3.2, 0.2, white, -2.2, 3.4 + 12.8, 22.4);
  add(2.2, 0.6, 1.6, white, 0, 3.4 + 0.3, -24.5);         // forecastle
  add(14.4, 0.5, 0.4, rail, 0, 3.6, -23.4);
  // lifeboats, funnel band, mooring winches and bollards
  const orange = new THREE.MeshPhysicalMaterial({ color: '#ff6a1a', roughness: 0.35, clearcoat: 0.6 });
  [-6.6, 6.6].forEach((x) => {
    const boat = new THREE.Mesh(new THREE.CapsuleGeometry(0.7, 3.2, 6, 14).rotateX(Math.PI / 2), orange);
    boat.position.set(x, 3.4 + 6.5, 23.2);
    ship.add(boat);
  });
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 4.5, 24), new THREE.MeshPhysicalMaterial({ color: '#203a66', clearcoat: 0.5 }));
  funnel.position.set(0, 3.4 + 13, 23.4);
  ship.add(funnel);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.33, 1.33, 0.8, 24), new THREE.MeshPhysicalMaterial({ color: '#e3cab6', metalness: 0.6, roughness: 0.3 }));
  band.position.set(0, 3.4 + 14.2, 23.4);
  ship.add(band);
  const steel = new THREE.MeshStandardMaterial({ color: '#6f7d92', metalness: 0.7, roughness: 0.4 });
  [[-3, -26.5], [3, -26.5], [-4.5, 21], [4.5, 21]].forEach(([x, z]) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.4, 16).rotateZ(Math.PI / 2), steel);
    w.position.set(x, 3.4 + 0.6, z);
    ship.add(w);
  });
  for (let z = -22; z <= 20; z += 6) [-6.7, 6.7].forEach((x) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 10), steel);
    b.position.set(x, 3.65, z);
    ship.add(b);
  });
  ship.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return ship;
}

export function initShip(canvas) {
  const stage = createStage(canvas, { fov: 35, far: 4000, shadows: true, maxDpr: 1.5 });
  const { scene, camera } = stage;
  camera.up.set(0, 0, -1);

  scene.add(new THREE.HemisphereLight('#dfe8ff', '#0b2244', 1.15));
  const sun = new THREE.DirectionalLight('#fff4e0', 2.1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 200 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  const time = { value: 0 };
  const shipPos = { value: new THREE.Vector2() };
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(6000, 6000).rotateX(-Math.PI / 2),
    new THREE.ShaderMaterial({
      uniforms: { uTime: time, uShip: shipPos },
      vertexShader: /* glsl */ `varying vec2 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vP = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform vec2 uShip; varying vec2 vP;
        ${NOISE}
        float waves(vec2 p){ return fbm(p * 0.22 + vec2(uTime * 0.06, uTime * 0.04)) + 0.5 * fbm(p * 0.6 - vec2(uTime * 0.09, 0.0)); }
        void main(){
          vec2 p = vP;
          float n = fbm(p * 0.035 + vec2(uTime * 0.015, uTime * 0.01));
          vec3 col = mix(vec3(0.015, 0.06, 0.24), vec3(0.05, 0.17, 0.48), smoothstep(0.2, 0.85, n));
          // wave normal from height differences → sun glitter + sky reflection
          float e0 = waves(p), ex = waves(p + vec2(0.35, 0.0)), ez = waves(p + vec2(0.0, 0.35));
          vec3 nrm = normalize(vec3((e0 - ex) * 1.3, 1.0, (e0 - ez) * 1.3));
          vec3 L = normalize(vec3(-0.35, 0.85, -0.4));
          float spec = pow(max(dot(reflect(-L, nrm), vec3(0.0, 1.0, 0.0)), 0.0), 260.0);
          float fres = 1.0 - nrm.y;
          col += vec3(0.2, 0.35, 0.65) * fres * 1.6;
          col += vec3(1.0, 0.97, 0.9) * spec * 0.55;
          vec2 d = p - uShip;
          // soft cast shadow of the hull, offset away from the sun
          vec2 sd = d - vec2(3.2, 3.0);
          float shadow = smoothstep(1.08, 0.86, length(vec2(sd.x / 7.4, (sd.y + 2.0) / 29.5)));
          col *= 1.0 - shadow * 0.45;
          float b = d.y + 30.0;
          float breakup = smoothstep(0.3, 0.75, fbm(p * 0.12 + vec2(0.0, uTime * 0.25)));
          float wv = step(0.0, b) * smoothstep(2.0 + b * 0.06, 0.0, abs(abs(d.x) - b * 0.32)) * smoothstep(160.0, 15.0, b) * breakup;
          float st = d.y - 26.0;
          float trail = step(0.0, st) * smoothstep(7.5 + st * 0.06, 0.0, abs(d.x)) * smoothstep(140.0, 0.0, st);
          float e = length(vec2(d.x / 7.8, (d.y + 2.0) / 30.0));
          float hull = smoothstep(1.3, 1.0, e) * (0.45 + 0.55 * smoothstep(0.0, -24.0, d.y));
          float foam = clamp(wv * 0.35 + trail * 0.85 + hull * 0.7, 0.0, 1.0) * (0.4 + 0.8 * fbm(p * 0.45 + uTime * 0.7));
          col = mix(col, vec3(0.9, 0.95, 1.0), foam);
          gl_FragColor = vec4(col, 1.0);
        }`,
    }),
  );
  scene.add(water);

  const ship = buildShip();
  scene.add(ship);

  // Cloud layers the camera climbs through
  const cloudMat = (seed, density) => new THREE.ShaderMaterial({
    uniforms: { uTime: time, uSeed: { value: seed }, uDensity: { value: density } },
    vertexShader: /* glsl */ `varying vec2 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vP = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uSeed; uniform float uDensity; varying vec2 vP;
      ${NOISE}
      void main(){
        float c = fbm(vP * 0.006 + vec2(uSeed, uTime * 0.004));
        float a = smoothstep(0.62 - uDensity, 0.85 - uDensity * 0.6, c);
        vec3 col = mix(vec3(0.72, 0.75, 0.86), vec3(1.0), smoothstep(0.5, 0.9, c));
        gl_FragColor = vec4(col, a * 0.95);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const clouds = [140, 320, 560].map((y, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000).rotateX(-Math.PI / 2), cloudMat(i * 13.7, 0));
    m.position.y = y;
    scene.add(m);
    return m;
  });

  let target = 0, p = 0, shipX = 0;
  stage.onResize = (w, h) => { shipX = 0; };
  stage.resize();

  stage.onFrame = (t, dt) => {
    p = THREE.MathUtils.damp(p, target, 6, dt);
    time.value = t;
    const z = lerp(30, -150, p);
    ship.position.set(shipX, Math.sin(t * 0.8) * 0.12, z);
    sun.position.set(shipX - 30, 70, z - 28);
    sun.target.position.set(shipX, 0, z);
    clouds.forEach((c) => { c.visible = p > 0.66; });
    ship.rotation.z = Math.sin(t * 0.6) * 0.01;
    shipPos.value.set(shipX, z);

    // whole ship (≈56 units incl. wake start) fits ~80% of the screen height
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const baseH = Math.max(35 / tan, (9 / camera.aspect) / tan);
    const climb = seg(p, 0.7, 1);
    const camH = lerp(baseH, 900, Math.pow(climb, 2.2));
    camera.position.set(shipX, camH, z + lerp(1, 25, climb));
    camera.lookAt(shipX, 0, z + lerp(1, 25, climb));
    clouds.forEach((c, i) => { c.material.uniforms.uDensity.value = 0.12 + climb * (0.25 + i * 0.08); });
  };

  return { setProgress(v) { target = v; } };
}
