import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "lil-gui";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { DoubleSide, sRGBEncoding } from "three";

/**
 * Base
 */
// Debug
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// texture
const front = new THREE.TextureLoader().load("./front.png");
const back = new THREE.TextureLoader().load("./back.png");

[front, back].forEach((t) => {
  t.wrapS = 1000;
  t.wrapT = 1000;
  t.repeat.set(1, 1);
  t.offset.setX(0.5);
  t.flipY = false;
  // t.encoding = sRGBEncoding;
});
back.repeat.set(-1, 1);

const frontMaterial = new THREE.MeshStandardMaterial({
  map: front,
  side: THREE.BackSide,
  roughness: 0.65,
  metalness: 0.25,
  alphaTest: true,
  flatShading: true,
});
const backMaterial = new THREE.MeshStandardMaterial({
  map: back,
  side: THREE.FrontSide,
  roughness: 0.65,
  metalness: 0.25,
  alphaTest: true,
  flatShading: true,
});

/**
 * Floor
 */
// const plan = new THREE.Mesh(
//   new THREE.SphereGeometry(1, 30, 30),
//   new THREE.MeshBasicMaterial({
//     color: 0x00ff00,
//     side: DoubleSide,
//     wireframe: true,
//   })
// );

// scene.add(plan);

let num = 7;
let curvePoints = [];
for (let i = 0; i < num; i++) {
  let theta = (i / num) * Math.PI * 2;

  curvePoints.push(
    new THREE.Vector3().setFromSphericalCoords(
      0.8,
      Math.PI / 2 + (Math.random() - 0.5),
      theta
    )
  );
}

const curve = new THREE.CatmullRomCurve3(curvePoints);
curve.tension = 0.7;
curve.closed = true;
const points = curve.getPoints(50);
const geometry = new THREE.BufferGeometry().setFromPoints(points);
let material = new THREE.LineBasicMaterial({ color: 0xff0000 });

const curveObject = new THREE.Line(geometry, material);

// scene.add(curveObject);

let number = 1000;
let frenetFrames = curve.computeFrenetFrames(number, true);
let spacedPoints = curve.getSpacedPoints(number);
let tempPlane = new THREE.PlaneGeometry(1, 1, number, 1);
let dimension = [-0.2, 0, 0.2];

material = [frontMaterial, backMaterial];
tempPlane.addGroup(0, 6000, 0);
tempPlane.addGroup(0, 6000, 1);

let point = new THREE.Vector3();
let binormalShift = new THREE.Vector3();
let temp2 = new THREE.Vector3();

let finalPoints = [];

dimension.forEach((d) => {
  for (let i = 0; i <= number; i++) {
    point = spacedPoints[i];
    binormalShift.add(frenetFrames.binormals[i]).multiplyScalar(d);

    finalPoints.push(
      new THREE.Vector3().copy(point).add(binormalShift).normalize()
    );
  }
});

finalPoints[0].copy(finalPoints[number]);
finalPoints[number + 1].copy(finalPoints[2 * number + 1]);

tempPlane.setFromPoints(finalPoints);

let finalMesh = new THREE.Mesh(tempPlane, material);
finalMesh.rotation.set(0, Math.PI, 0);
scene.add(finalMesh);
/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(-5, 5, 0);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, 0, 1.6);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // Update controls
  controls.update();

  material.forEach((m, i) => {
    m.map.offset.setX(elapsedTime * 0.1);
    if (i > 0) {
      m.map.offset.setX(-elapsedTime * 0.1);
    }
  });

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
