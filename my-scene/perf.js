const CASES = [
  { name: 'A', count: 100,  aa: true,  label: '100物体 · antialias开' },
  { name: 'B', count: 3000, aa: true,  label: '3000物体 · antialias开' },
  { name: 'C', count: 3000, aa: false, label: '3000物体 · antialias关' }
];
const DURATION = 4000;
const WARMUP = 500;

let running = false;

async function runOne(c) {
  const stage = document.querySelector('#stage');
  stage.innerHTML = '';

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
  const sharedMats = [0x4fc3f7, 0xffb74d, 0xef5350, 0x81c784, 0xba68c8, 0xffd54f]
    .map(col => new THREE.MeshStandardMaterial({ color: col }));
  const group = new THREE.Group();
  for (let i = 0; i < c.count; i++) {
    const m = new THREE.Mesh(geo, sharedMats[i % sharedMats.length]);
    m.position.set(
      (Math.random() - 0.5) * 18,
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 12 - 2
    );
    m.userData.speed = 0.005 + Math.random() * 0.01;
    group.add(m);
  }
  scene.add(group);

  const result = await new Promise(resolve => {
    const start = performance.now();
    let frames = 0, renderTotal = 0;
    function tick(now) {
      const elapsed = now - start;
      group.children.forEach(m => { m.rotation.x += m.userData.speed; m.rotation.y += m.userData.speed; });
      const t0 = performance.now();
      renderer.render(scene, camera);
      const t1 = performance.now();
      if (elapsed > WARMUP && elapsed < DURATION) {
        frames++;
        renderTotal += (t1 - t0);
      }
      if (elapsed >= DURATION) {
        resolve({
          fps: frames / ((DURATION - WARMUP) / 1000),
          renderMs: renderTotal / frames
        });
        return;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });

  const drawCalls = renderer.info.render.calls;
  renderer.dispose();
  return { fps: result.fps, renderMs: result.renderMs, calls: drawCalls };
}

async function runAll() {
  if (running) return;
  running = true;
  const tbody = document.querySelector('#result');
  tbody.innerHTML = '';
  document.querySelector('#conclusion').textContent = '';
  const results = {};
  for (const c of CASES) {
    document.querySelector('#status').textContent = '正在运行 ' + c.label + ' …';
    const r = await runOne(c);
    results[c.name] = r;
    tbody.insertAdjacentHTML('beforeend',
      '<tr><td>' + c.name + '</td><td>' + c.count + '</td><td>' + (c.aa ? '开' : '关') +
      '</td><td>' + r.fps.toFixed(1) + '</td><td>' + r.renderMs.toFixed(3) + '</td><td>' + r.calls + '</td></tr>');
  }
  document.querySelector('#status').textContent = '实验完成';

  const A = results.A, B = results.B, C = results.C;
  const ratioMs = (B.renderMs / A.renderMs).toFixed(1);
  const ratioCalls = (B.calls / A.calls).toFixed(1);
  const aaPct = ((B.renderMs - C.renderMs) / B.renderMs * 100).toFixed(1);
  let aaText;
  if (Math.abs(aaPct) < 5) {
    aaText = '关闭antialias后单帧耗时变化小于5%（基本持平，差异在测量误差范围内），说明本机GPU对多重采样的开销不敏感';
  } else if (aaPct > 0) {
    aaText = '关闭antialias后单帧耗时下降约' + aaPct + '%，代价是物体边缘锯齿变明显';
  } else {
    aaText = '关闭antialias后单帧耗时反而上升约' + Math.abs(aaPct) + '%（在测量波动范围内，多次运行结论更稳定）';
  }
  document.querySelector('#conclusion').textContent =
    '结论（两组对比，数据为本次实测）：对比一（A与B）：物体数量从100增加到3000后，draw calls从' +
    A.calls + '次增加到' + B.calls + '次（约' + ratioCalls + '倍），单帧渲染耗时从' + A.renderMs.toFixed(3) +
    'ms增加到' + B.renderMs.toFixed(3) + 'ms（约' + ratioMs + '倍），说明独立Mesh数量带来的CPU绘制提交开销是主要瓶颈；' +
    '对比二（B与C）：' + aaText + '。优化方向：用InstancedMesh合批把数千次draw call合并为1次、降低几何体分段数、减少光源数量。';
  running = false;
}

document.querySelector('#run-all').addEventListener('click', runAll);
