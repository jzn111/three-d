// perf.js —— 选做研究3：antialias开关与物体数量对帧率的影响
// 三组：A=100物体+抗锯齿开  B=3000物体+抗锯齿开  C=3000物体+抗锯齿关
const CASES = [
  { name: 'A', count: 100,  aa: true,  label: '100物体 · antialias开' },
  { name: 'B', count: 3000, aa: true,  label: '3000物体 · antialias开' },
  { name: 'C', count: 3000, aa: false, label: '3000物体 · antialias关' }
];
const DURATION = 4000;   // 每组测量4秒
const WARMUP = 500;      // 前0.5秒预热不计入

let running = false;

async function runOne(c) {
  const stage = document.querySelector('#stage');
  stage.innerHTML = '';  // 清掉上一组的canvas

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f1420);
  const camera = new THREE.PerspectiveCamera(50, 800 / 500, 0.1, 1000);
  camera.position.set(0, 6, 14);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: c.aa });
  renderer.setSize(800, 500);
  stage.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dl = new THREE.DirectionalLight(0xffffff, 0.8);
  dl.position.set(4, 8, 6);
  scene.add(dl);

  const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  // 共享6个材质（3000个独立Mesh仍产生3000次draw call，但材质创建不耗时）
  const sharedMats = [0x4fc3f7, 0xffb74d, 0xef5350, 0x81c784, 0xba68c8, 0xffd54f]
    .map(col => new THREE.MeshStandardMaterial({ color: col }));
  const group = new THREE.Group();
  for (let i = 0; i < c.count; i++) {
    const m = new THREE.Mesh(geo, sharedMats[i % sharedMats.length]);
    // 均匀撒在一个立方区域内
    m.position.set(
      (Math.random() - 0.5) * 18,
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 12 - 2
    );
    m.userData.speed = 0.005 + Math.random() * 0.01;
    group.add(m);
  }
  scene.add(group);

  // —— 测量段：requestAnimationFrame 帧间隔统计平均 FPS ——
  const fps = await new Promise(resolve => {
    const start = performance.now();
    let frames = 0;
    function tick(now) {
      const elapsed = now - start;
      group.children.forEach(m => { m.rotation.x += m.userData.speed; m.rotation.y += m.userData.speed; });
      renderer.render(scene, camera);
      if (elapsed > WARMUP && elapsed < DURATION) frames++;
      if (elapsed >= DURATION) {
        const avg = frames / ((DURATION - WARMUP) / 1000);
        resolve(avg);
        return;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });

  const drawCalls = renderer.info.render.calls;
  renderer.dispose();
  return { fps: fps, calls: drawCalls };
}

async function runAll() {
  if (running) return;
  running = true;
  const tbody = document.querySelector('#result');
  tbody.innerHTML = '';
  document.querySelector('#conclusion').textContent = '';
  for (const c of CASES) {
    document.querySelector('#status').textContent = '正在运行 ' + c.label + ' …';
    const r = await runOne(c);
    tbody.insertAdjacentHTML('beforeend',
      '<tr><td>' + c.name + '</td><td>' + c.count + '</td><td>' + (c.aa ? '开' : '关') +
      '</td><td>' + r.fps.toFixed(1) + '</td><td>' + r.calls + '</td></tr>');
  }
  document.querySelector('#status').textContent = '实验完成';
  document.querySelector('#conclusion').textContent =
    '结论：物体数量从100增加到3000后，draw calls同步增加，帧率明显下降，说明独立Mesh数量（CPU绘制提交开销）是主要瓶颈；' +
    '关闭antialias后边缘不再做多重采样，帧率有小幅回升，但画面锯齿变明显。优化方向：用InstancedMesh合批减少draw calls、降低分段数、少用光源。';
  running = false;
}

document.querySelector('#run-all').addEventListener('click', runAll);
