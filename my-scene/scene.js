const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000008);

const camera = new THREE.PerspectiveCamera(
  55, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 9, 16);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(1500 * 3);
for (let i = 0; i < starPos.length; i++) {
  starPos[i] = (Math.random() - 0.5) * 300;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const stars = new THREE.Points(
  starGeo,
  new THREE.PointsMaterial({ color: 0xffffff, size: 0.6 })
);
scene.add(stars);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(1.4, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffcc33 })
);
sun.userData.name = '太阳';
scene.add(sun);

scene.add(new THREE.AmbientLight(0xffffff, 0.25));
const sunLight = new THREE.PointLight(0xffffff, 1.6, 200);
scene.add(sunLight);

const planetData = [
  { name: '水星', radius: 0.25, orbit: 2.4, color: 0x9e9e9e, speed: 0.48 },
  { name: '金星', radius: 0.42, orbit: 3.4, color: 0xffb74d, speed: 0.35 },
  { name: '地球', radius: 0.48, orbit: 4.5, color: 0x42a5f5, speed: 0.29 },
  { name: '火星', radius: 0.34, orbit: 5.6, color: 0xef5350, speed: 0.24 },
  { name: '木星', radius: 0.95, orbit: 7.4, color: 0xd7a86b, speed: 0.13 },
  { name: '土星', radius: 0.78, orbit: 9.2, color: 0xe6cf8f, speed: 0.10 }
];
const planets = [];
planetData.forEach(d => {
  const pivot = new THREE.Group();
  scene.add(pivot);

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(d.radius, 32, 32),
    new THREE.MeshStandardMaterial({ color: d.color })
  );
  planet.position.x = d.orbit;
  planet.userData.name = d.name;
  pivot.add(planet);
  planets.push({ pivot: pivot, mesh: planet, speed: d.speed });

  if (d.name === '土星') {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(d.radius * 1.55, 0.06, 12, 64),
      new THREE.MeshStandardMaterial({ color: 0xcaa46a })
    );
    ring.position.x = d.orbit;
    ring.rotation.x = Math.PI / 2;
    pivot.add(ring);
  }

  const pts = [];
  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * d.orbit, 0, Math.sin(a) * d.orbit));
  }
  const orbitLine = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0x3a5a7a, transparent: true, opacity: 0.6 })
  );
  scene.add(orbitLine);
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const pickables = [sun].concat(planets.map(p => p.mesh));
let selected = null;
const labelEl = document.querySelector('#label');

function clearHighlight() {
  if (selected && selected.material.emissive) {
    selected.material.emissive.setHex(0x000000);
  }
  selected = null;
  labelEl.style.display = 'none';
}

window.addEventListener('click', (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pickables, false);
  clearHighlight();
  if (hits.length > 0) {
    selected = hits[0].object;
    if (selected.material.emissive) {
      selected.material.emissive.setHex(0xffaa00);
    }
    labelEl.textContent = selected.userData.name;
    labelEl.style.display = 'block';
  }
});

const tmpV = new THREE.Vector3();
function updateLabel() {
  if (!selected) return;
  selected.getWorldPosition(tmpV);
  tmpV.project(camera);
  labelEl.style.left = (((tmpV.x + 1) / 2) * window.innerWidth) + 'px';
  labelEl.style.top = (((-tmpV.y + 1) / 2) * window.innerHeight) + 'px';
}

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 4;
controls.maxDistance = 40;

function animate() {
  requestAnimationFrame(animate);
  planets.forEach(p => {
    p.pivot.rotation.y += p.speed * 0.01;
    p.mesh.rotation.y += 0.02;
  });
  sun.rotation.y += 0.003;
  controls.update();
  updateLabel();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
