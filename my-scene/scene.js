// scene.js —— 自主实践：太阳系三维场景（Three.js）
// 第一步：环境（场景/相机/渲染器/星空/太阳/光源/resize适配）

// 1. 场景：黑色太空背景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000008);

// 2. 透视相机：放在太阳系斜上方，能俯瞰行星轨道
const camera = new THREE.PerspectiveCamera(
  55, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 9, 16);
camera.lookAt(0, 0, 0);

// 3. 渲染器：开启抗锯齿
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 4. 星空背景：用 Points 撒 1500 颗星（1次绘制调用，性能好）
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(1500 * 3);
for (let i = 0; i < starPos.length; i++) {
  starPos[i] = (Math.random() - 0.5) * 300; // 半径150的球域内随机
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const stars = new THREE.Points(
  starGeo,
  new THREE.PointsMaterial({ color: 0xffffff, size: 0.6 })
);
scene.add(stars);

// 5. 太阳：Basic材质不受光（自己发光的感觉），同时点光源照亮行星
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(1.4, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffcc33 })
);
sun.userData.name = '太阳';
scene.add(sun);

scene.add(new THREE.AmbientLight(0xffffff, 0.25));              // 环境光打底
const sunLight = new THREE.PointLight(0xffffff, 1.6, 200);     // 太阳点光源
scene.add(sunLight);

// 6. 行星主体：数据驱动，每颗行星放进一个位于原点的枢轴组，公转=转枢轴
const planetData = [
  { name: '水星', radius: 0.25, orbit: 2.4, color: 0x9e9e9e, speed: 0.48 },
  { name: '金星', radius: 0.42, orbit: 3.4, color: 0xffb74d, speed: 0.35 },
  { name: '地球', radius: 0.48, orbit: 4.5, color: 0x42a5f5, speed: 0.29 },
  { name: '火星', radius: 0.34, orbit: 5.6, color: 0xef5350, speed: 0.24 },
  { name: '木星', radius: 0.95, orbit: 7.4, color: 0xd7a86b, speed: 0.13 },
  { name: '土星', radius: 0.78, orbit: 9.2, color: 0xe6cf8f, speed: 0.10 }
];
const planets = []; // 保存枢轴组，第三步动画用
planetData.forEach(d => {
  const pivot = new THREE.Group();           // 公转轴
  scene.add(pivot);

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(d.radius, 32, 32),
    new THREE.MeshStandardMaterial({ color: d.color })
  );
  planet.position.x = d.orbit;
  planet.userData.name = d.name;
  pivot.add(planet);
  planets.push({ pivot: pivot, mesh: planet, speed: d.speed });

  // 土星环：圆环体横放（绕x轴转90度）
  if (d.name === '土星') {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(d.radius * 1.55, 0.06, 12, 64),
      new THREE.MeshStandardMaterial({ color: 0xcaa46a })
    );
    ring.position.x = d.orbit;
    ring.rotation.x = Math.PI / 2;
    pivot.add(ring);
  }

  // 轨道线：用LineLoop画一个细圆环
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

// 7. 渲染循环（第三步加入公转动画）
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// 8. 窗口resize适配：更新宽高比+画布尺寸
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
