// Renderer, scene lifecycle, quality presets, object helpers (local stud instancing + geometry merging)
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as K from './brik/brik.js';
import * as W from './brik/world.js';
export { THREE };
export const E = { r: null, scene: null, cam: null, comp: null, bloom: null, envTex: null, w: 1, h: 1, q: 'med', timeScale: 1, t: 0, dt: 0, frame: 0, fps: 60, onFrame: null, paused: false };
export const QUALITY = {
  low: { pr: 1, shadows: false, bloom: false, shadowSize: 512, studs: false },
  med: { pr: 1.5, shadows: true, bloom: false, shadowSize: 1024, studs: true },
  high: { pr: 2, shadows: true, bloom: true, shadowSize: 2048, studs: true },
};
export function initEngine(q) {
  E.q = QUALITY[q] ? q : 'med'; K.Q.low = E.q !== 'high'; W.WQ.shadow = QUALITY[E.q].shadows ? QUALITY[E.q].shadowSize : 0;
  const r = new THREE.WebGLRenderer({ antialias: E.q === 'high', powerPreference: 'high-performance', preserveDrawingBuffer: !!window.__HW_TEST });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, QUALITY[E.q].pr));
  r.shadowMap.enabled = QUALITY[E.q].shadows; r.shadowMap.type = E.q === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
  r.domElement.id = 'gl'; document.body.prepend(r.domElement); E.r = r;
  const pm = new THREE.PMREMGenerator(r); E.envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  E.cam = new THREE.PerspectiveCamera(55, 1, 4, 30000);
  newScene();
  addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 300));
  if (window.visualViewport) visualViewport.addEventListener('resize', resize);
  resize();
  let last = performance.now();
  const loop = (now) => {
    requestAnimationFrame(loop);
    let rdt = Math.min(0.05, (now - last) / 1000); last = now;
    E.fps = E.fps * 0.95 + (1 / Math.max(rdt, 0.001)) * 0.05;
    if (E.paused) rdt = 0;
    E.dt = rdt * E.timeScale; E.rdt = rdt; E.t += E.dt; E.frame++;
    try { if (E.onFrame) E.onFrame(E.dt, rdt); } catch (e) { console.error(e); window.__HWshowErr && __HWshowErr(e.message + ' @frame'); E.onFrame = null; }
    render();
  };
  requestAnimationFrame(loop);
}
export function render() {
  if (!E.scene) return;
  if (E.comp && QUALITY[E.q].bloom) E.comp.render(); else E.r.render(E.scene, E.cam);
}
export function resize() {
  const w = innerWidth, h = innerHeight; E.w = w; E.h = h;
  E.r.setSize(w, h); E.cam.aspect = w / h; E.cam.updateProjectionMatrix();
  if (E.comp) { E.comp.setSize(w, h); }
}
// fresh scene; disposes the old one (geometries/materials not shared via cache are dropped by GC)
export function newScene(opt = {}) {
  if (E.scene) disposeScene(E.scene);
  const s = new THREE.Scene(); s.environment = E.envTex; s.environmentIntensity = 0.55; E.scene = s;
  E.flash = new THREE.PointLight(0xff8a2a, 0, 900, 1.6); s.add(E.flash); // single pooled explosion light (constant light count)
  if (QUALITY[E.q].bloom) {
    E.comp = new EffectComposer(E.r); E.comp.addPass(new RenderPass(s, E.cam));
    E.bloom = new UnrealBloomPass(new THREE.Vector2(E.w, E.h), opt.bloom ?? 0.55, 0.5, opt.bloomTh ?? 0.86); E.comp.addPass(E.bloom); E.comp.addPass(new OutputPass());
    E.comp.setSize(E.w, E.h);
  } else E.comp = null;
  E.cam.fov = 55; E.cam.near = 4; E.cam.far = 30000; E.cam.updateProjectionMatrix();
  return s;
}
const keepMat = new Set();
function disposeScene(s) {
  s.traverse(o => {
    if (o.isMesh || o.isInstancedMesh) { if (o.geometry && !o.geometry.userData.keep) o.geometry.dispose(); }
  });
  if (s.background && s.background.isTexture) s.background.dispose();
}
// Build an object whose studs are instanced INSIDE the object (so it can move). fn(root) may add to root or return a group.
export function makeObj(fn, { merge = true } = {}) {
  const root = new THREE.Group();
  const studsOn = QUALITY[E.q].studs;
  const bank = studsOn ? new K.StudBank(root) : null; const prev = K.getBank(); K.setBank(bank);
  let g; try { g = fn(root); } finally { K.setBank(prev); }
  if (g && g !== root && !g.parent) root.add(g);
  if (bank) { if (!Object.keys(bank.m).length) { K.setBank(bank); K.bankStuds(root); K.setBank(prev); } bank.flush(); }
  root.traverse(o => { if (o.userData.studs) delete o.userData.studs; });
  stripLights(root);
  if (merge) mergeObj(root);
  return root;
}
export function stripLights(root) { const L = []; root.traverse(o => { if (o.isLight) L.push(o); }); L.forEach(l => l.parent.remove(l)); }
// Merge all static plain meshes of root (by material) into a few meshes. Keeps InstancedMesh + array-material meshes + named "keep" nodes.
export function mergeObj(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const groups = new Map(); const kill = [];
  root.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material) || o.userData.keep) return;
    let p = o.parent, skip = false; while (p && p !== root) { if (p.userData.keep) skip = true; p = p.parent; } if (skip) return;
    const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
    let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    if (!geo.attributes.normal) geo.computeVertexNormals();
    geo.morphAttributes = {}; geo.clearGroups();
    geo.applyMatrix4(m);
    const key = o.material.uuid; if (!groups.has(key)) groups.set(key, { mat: o.material, geos: [], cast: false });
    const G = groups.get(key); G.geos.push(geo); G.cast = G.cast || o.castShadow; kill.push(o);
  });
  if (kill.length < 2) return root;
  kill.forEach(o => o.parent.remove(o));
  for (const { mat, geos, cast } of groups.values()) {
    const g = mergeGeometries(geos, false); if (!g) continue;
    const mesh = new THREE.Mesh(g, mat); mesh.castShadow = cast; mesh.receiveShadow = true; root.add(mesh);
  }
  // prune empty groups
  const empt = []; root.traverse(o => { if (o !== root && o.type === 'Group' && o.children.length === 0 && !o.userData.keep) empt.push(o); }); empt.forEach(o => o.parent && o.parent.remove(o));
  return root;
}
export function sunLight(scene, { dir = [300, 500, 200], color = 0xfff0d8, i = 2.4, hemi = 0.8, sky = 0xbcd4ff, ground = 0x6a5a4a, ext = 500 } = {}) {
  const sun = new THREE.DirectionalLight(color, i); sun.position.set(...dir); sun.userData.dir = new THREE.Vector3(...dir).normalize();
  const q = QUALITY[E.q];
  if (q.shadows) { sun.castShadow = true; sun.shadow.mapSize.set(q.shadowSize, q.shadowSize); const c = sun.shadow.camera; c.left = -ext; c.right = ext; c.top = ext; c.bottom = -ext; c.near = 10; c.far = 3000; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.5; }
  scene.add(sun); scene.add(sun.target);
  scene.add(new THREE.HemisphereLight(sky, ground, hemi));
  return sun;
}
// keep shadow camera centered on a moving focus
export function followSun(sun, p) { const d = sun.userData.dir; sun.position.set(p.x + d.x * 1200, p.y + d.y * 1200, p.z + d.z * 1200); sun.target.position.copy(p); }
export function skyGrad(scene, stops) { K.sky(scene, stops); }
const _v = new THREE.Vector3();
export function toScreen(p) { _v.copy(p).project(E.cam); return { x: (_v.x * 0.5 + 0.5) * E.w, y: (-_v.y * 0.5 + 0.5) * E.h, vis: _v.z < 1 && _v.z > -1 }; }
export const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const pick = a => a[Math.floor(Math.random() * a.length)];
