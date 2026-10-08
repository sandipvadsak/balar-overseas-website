// Testimonials: a cargo jet seen from above flies in over the clouds, cruises over
// the testimonials at a constant size, then leaves off the top.
import * as THREE from 'three';
import { createStage, lerp, seg } from './util.js';

// Fuselage profile (radius along the length), revolved with a lathe. Nose at -Z.
function fuselageGeometry() {
  const pts = [];
  const L = 66, R0 = 3.2;
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;               // 0 = nose, 1 = tail
    let r;
    if (t < 0.09) { const k = 1 - t / 0.09; r = R0 * Math.sqrt(Math.max(0, 1 - k * k)); }   // rounded nose
    else if (t < 0.7) r = R0;
    else r = R0 * (1 - Math.pow((t - 0.7) / 0.3, 1.5) * 0.8);                               // tapered tail
    pts.push(new THREE.Vector2(Math.max(r, 0.01), t * L - L / 2));
  }
  const g = new THREE.LatheGeometry(pts, 48);
  g.rotateX(Math.PI / 2); // lathe axis (Y) becomes Z, nose toward -Z
  return g;
}

function wing(rootFront, rootBack, span, tipFront, tipBack, thick) {
  const s = new THREE.Shape();
  s.moveTo(0, rootFront);
  s.lineTo(span, tipFront);
  s.quadraticCurveTo(span + 0.6, (tipFront + tipBack) / 2, span, tipBack);
  s.lineTo(0, rootBack);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: true, bevelSize: thick * 0.5, bevelThickness: thick * 0.5, bevelSegments: 3, curveSegments: 8 });
  g.translate(0, 0, -thick / 2);
  g.rotateX(Math.PI / 2); // shape Y becomes world Z (chord), extrusion becomes Y (thickness)
  return g;
}

function nacelleGeometry() {
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const r = 1.25 * (0.8 + 0.2 * Math.sin(Math.min(1, t * 1.6) * Math.PI / 2)) * (t > 0.8 ? 1 - (t - 0.8) * 1.6 : 1);
    pts.push(new THREE.Vector2(r, t * 7 - 3.5));
  }
  const g = new THREE.LatheGeometry(pts, 32);
  g.rotateX(Math.PI / 2);
  return g;
}

function buildPlane() {
  const plane = new THREE.Group();
  const white = new THREE.MeshPhysicalMaterial({ color: '#f5f6f8', metalness: 0.15, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  const grey = new THREE.MeshPhysicalMaterial({ color: '#c3c8d0', metalness: 0.7, roughness: 0.3, clearcoat: 0.4 });
  const dark = new THREE.MeshStandardMaterial({ color: '#1a1f27', metalness: 0.6, roughness: 0.3 });
  const accent = new THREE.MeshPhysicalMaterial({ color: '#c8102e', roughness: 0.35, clearcoat: 0.6 });
  const gold = new THREE.MeshPhysicalMaterial({ color: '#d9b48c', metalness: 0.6, roughness: 0.3, clearcoat: 0.6 });

  plane.add(new THREE.Mesh(fuselageGeometry(), white));
  // 747-style upper deck hump
  const hump = new THREE.Mesh(new THREE.CapsuleGeometry(2.3, 12, 10, 32).rotateX(Math.PI / 2), white);
  hump.scale.set(1, 0.8, 1);
  hump.position.set(0, 1.5, -20.5);
  plane.add(hump);
  // cockpit windows
  const win = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 2.0, 4, 8).rotateZ(Math.PI / 2), dark);
  win.position.set(0, 3.0, -27.4);
  win.rotation.x = -0.35;
  plane.add(win);
  // subtle spine panel line
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 44), new THREE.MeshStandardMaterial({ color: '#d7dbe1' }));
  spine.position.set(0, 3.22, 4);
  plane.add(spine);

  // main wings with dihedral + raked winglets
  [1, -1].forEach((side) => {
    const w = new THREE.Mesh(wing(-6, 6, 30, 12.5, 16, 0.5), white);
    w.scale.x = side;
    w.rotation.z = side * 0.06;
    w.position.set(side * 2.0, -0.6, 0);
    plane.add(w);
    const flap = new THREE.Mesh(wing(5.2, 6.4, 20, 13.2, 14.4, 0.12), grey);
    flap.scale.x = side;
    flap.rotation.z = side * 0.06;
    flap.position.set(side * 2.4, -0.3, 0);
    plane.add(flap);
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.6, 3.2), white);
    tip.position.set(side * 32.1, 1.0, 14.4);
    tip.rotation.z = side * -0.35;
    plane.add(tip);
    const navLight = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), side > 0 ? new THREE.MeshStandardMaterial({ color: '#2bd46a', emissive: '#18c057', emissiveIntensity: 2 }) : new THREE.MeshStandardMaterial({ color: '#ff3b3b', emissive: '#ff2020', emissiveIntensity: 2 }));
    navLight.position.set(side * 31.8, 0.4, 13.0);
    plane.add(navLight);

    // four engines on pylons
    [[10, 2.5], [19.5, 8.0]].forEach(([x, z]) => {
      const nac = new THREE.Mesh(nacelleGeometry(), grey);
      nac.position.set(side * x, -2.0, z - 4.5);
      plane.add(nac);
      const intake = new THREE.Mesh(new THREE.CircleGeometry(1.05, 24), dark);
      intake.position.set(side * x, -2.0, z - 8.05);
      intake.rotation.y = Math.PI;
      plane.add(intake);
      const lip = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.14, 8, 32), new THREE.MeshStandardMaterial({ color: '#e8e8e8', metalness: 1, roughness: 0.15 }));
      lip.position.set(side * x, -2.0, z - 8.0);
      plane.add(lip);
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 5.5), white);
      pylon.position.set(side * x, -1.0, z - 2.5);
      plane.add(pylon);
    });

    // horizontal stabiliser
    const tail = new THREE.Mesh(wing(25, 30.5, 11.5, 30, 32.5, 0.3), white);
    tail.scale.x = side;
    tail.position.set(side * 0.8, 0.7, 0);
    plane.add(tail);
  });

  // vertical fin (swept, seen almost edge-on from above) with brand colours
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0); finShape.lineTo(7.5, 0); finShape.lineTo(11, 10); finShape.lineTo(7.6, 10); finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.5, bevelEnabled: true, bevelSize: 0.15, bevelThickness: 0.15, bevelSegments: 2 });
  finGeo.translate(0, 0, -0.25);
  finGeo.rotateY(-Math.PI / 2);
  const fin = new THREE.Mesh(finGeo, white);
  fin.position.set(0, 2.0, 25);
  plane.add(fin);
  const finTop = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 3.6), accent);
  finTop.position.set(0, 11.7, 35.4);
  plane.add(finTop);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.25, 6), gold);
  stripe.position.set(0, 7.2, 32.5);
  plane.add(stripe);

  plane.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return plane;
}

export function initPlane(canvas) {
  const stage = createStage(canvas, { fov: 30, env: true, far: 4000, shadows: true, maxDpr: 1.5 });
  const { scene, camera } = stage;
  camera.up.set(0, 0, -1);

  const sun = new THREE.DirectionalLight('#ffffff', 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 400 });
  sun.shadow.radius = 6;
  scene.add(sun, sun.target, new THREE.HemisphereLight('#ffffff', '#9aa4b8', 0.55));

  const plane = buildPlane();
  scene.add(plane);

  // Soft drop shadow on the page/clouds below the plane
  const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.08 }));
  shadowCatcher.position.y = -30;
  shadowCatcher.receiveShadow = true;
  scene.add(shadowCatcher);

  // cloud bank under the plane at the start of the section
  const time = { value: 0 };
  const cloud = new THREE.Mesh(
    new THREE.PlaneGeometry(1600, 1600).rotateX(-Math.PI / 2),
    new THREE.ShaderMaterial({
      uniforms: { uTime: time, uFade: { value: 1 } },
      vertexShader: /* glsl */ `varying vec2 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vP = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform float uFade; varying vec2 vP;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
          return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
        float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=.5;} return v; }
        void main(){
          vec2 q = vP * 0.01 + vec2(0.0, uTime * 0.03);
          float c = fbm(q);
          float lit = fbm(q + vec2(0.02, 0.02)) - c;      // fake light direction across the cloud tops
          float a = smoothstep(0.35, 0.72, c) * uFade;
          vec3 col = mix(vec3(0.62, 0.66, 0.76), vec3(1.0), smoothstep(0.45, 0.85, c));
          col -= lit * 1.5;
          gl_FragColor = vec4(col, a);
        }`,
      transparent: true, depthWrite: false,
    }),
  );
  cloud.position.y = -60;
  scene.add(cloud);

  let target = 0, p = 0, cruiseH = 300;
  stage.onResize = (w) => {
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const frac = w < 700 ? 0.82 : 0.48;      // wingspan as a fraction of the viewport width
    cruiseH = (66 / frac) / 2 / (tan * camera.aspect);
  };
  stage.resize();

  stage.onFrame = (t, dt) => {
    p = THREE.MathUtils.damp(p, target, 6, dt);
    time.value = t;
    // already visible over the clouds when the section starts, then settles to cruise
    const enter = seg(p, 0, 0.18), exit = seg(p, 0.86, 1);
    camera.position.set(0, cruiseH, 0);
    camera.lookAt(0, 0, 0);
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const halfH = cruiseH * tan;
    const zCruise = -halfH * 0.3;
    const z = lerp(lerp(halfH * 0.55, zCruise, enter), -halfH - 60, exit);
    plane.position.set(Math.sin(t * 0.35) * 1.5, 0, z);
    plane.rotation.z = Math.sin(t * 0.5) * 0.07;              // gentle bank
    plane.rotation.y = Math.sin(t * 0.25) * 0.025;
    sun.position.set(plane.position.x - 40, 120, z - 50);
    sun.target.position.set(plane.position.x, 0, z);
    cloud.material.uniforms.uFade.value = 1 - seg(p, 0.12, 0.3);
  };

  return { setProgress(v) { target = v; } };
}
