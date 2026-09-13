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

// 6. 渲染循环（行星主体和动画在后续步骤加入）
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// 7. 窗口resize适配：更新宽高比+画布尺寸
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
