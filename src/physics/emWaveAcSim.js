// Mô phỏng 3D Sóng Điện Từ & Dòng Điện Xoay Chiều AC (Lớp 12 - GDPT 2018)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class EMWaveAcSim {
  constructor(threeContainerId, acCanvasId) {
    this.container = document.getElementById(threeContainerId);
    this.acCanvas = document.getElementById(acCanvasId);
    this.acCtx = this.acCanvas ? this.acCanvas.getContext('2d') : null;

    // Tham số sóng điện từ
    this.wavelength = 5.0; // Bước sóng lambda
    this.frequency = 1.0;  // Tần số f (Hz)
    this.speed = 4.0;      // Tốc độ truyền sóng
    this.amplitudeE = 2.4; // Biên độ điện trường E0
    this.amplitudeB = 2.4; // Biên độ từ trường B0
    this.time = 0;
    this.isRunning = true;

    // Tham số máy phát điện xoay chiều
    this.acOmega = 2.0;    // Tốc độ góc (rad/s)
    this.acE0 = 220;       // Suất điện động cực đại
    this.acTime = 0;
    this.acWaveHistory = [];

    // Three.js
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.waveGroup = null;

    this.initThree();
    this.initAC();
  }

  initThree() {
    if (!this.container) return;
    const width = this.container.clientWidth || 700;
    const height = this.container.clientHeight || 450;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(16, 10, 12);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.target.set(0, 0, 0);

    // Ánh sáng
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 20, 15);
    this.scene.add(dirLight);

    // Nhóm chứa sóng
    this.waveGroup = new THREE.Group();
    this.scene.add(this.waveGroup);

    // Dựng trục truyền sóng Oz và các trục Ox, Oy
    this.buildAxes();

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  buildAxes() {
    const axesGroup = new THREE.Group();
    const len = 12;

    // Trục truyền sóng z (màu xám / trắng với mũi tên chỉ phương truyền sóng v = c)
    const zDir = new THREE.Vector3(0, 0, 1);
    const zArrow = new THREE.ArrowHelper(zDir, new THREE.Vector3(0, 0, -len), len * 2, 0x94a3b8, 0.8, 0.4);
    axesGroup.add(zArrow);

    // Trục điện trường E (Oy - Thẳng đứng, màu Đỏ)
    const yDir = new THREE.Vector3(0, 1, 0);
    const yArrow = new THREE.ArrowHelper(yDir, new THREE.Vector3(0, -3.5, 0), 7.0, 0xef4444, 0.6, 0.3);
    axesGroup.add(yArrow);

    // Trục từ trường B (Ox - Nằm ngang, màu Xanh cyan)
    const xDir = new THREE.Vector3(1, 0, 0);
    const xArrow = new THREE.ArrowHelper(xDir, new THREE.Vector3(-3.5, 0, 0), 7.0, 0x00f2fe, 0.6, 0.3);
    axesGroup.add(xArrow);

    this.scene.add(axesGroup);
  }

  updateWave() {
    this.waveGroup.clear();

    const zStart = -9;
    const zEnd = 9;
    const sampleCount = 180;
    const k = (2 * Math.PI) / this.wavelength;
    const omega = 2 * Math.PI * this.frequency;

    // 1. Đường bao hình sin của Điện trường E (Màu Đỏ trên mặt phẳng yz)
    const pointsE = [];
    // 2. Đường bao hình sin của Từ trường B (Màu Xanh trên mặt phẳng xz)
    const pointsB = [];

    for (let i = 0; i <= sampleCount; i++) {
      const z = zStart + (i / sampleCount) * (zEnd - zStart);
      const phase = k * z - omega * this.time;
      const valE = this.amplitudeE * Math.sin(phase);
      const valB = this.amplitudeB * Math.sin(phase);

      pointsE.push(new THREE.Vector3(0, valE, z));
      pointsB.push(new THREE.Vector3(valB, 0, z));

      // Vẽ các vector mũi tên E và B cách đều nhau
      if (i % 6 === 0) {
        // Vector E (Màu Đỏ)
        if (Math.abs(valE) > 0.1) {
          const eDir = new THREE.Vector3(0, valE > 0 ? 1 : -1, 0);
          const eArrow = new THREE.ArrowHelper(eDir, new THREE.Vector3(0, 0, z), Math.abs(valE), 0xef4444, 0.25, 0.12);
          this.waveGroup.add(eArrow);
        }

        // Vector B (Màu Xanh Cyan)
        if (Math.abs(valB) > 0.1) {
          const bDir = new THREE.Vector3(valB > 0 ? 1 : -1, 0, 0);
          const bArrow = new THREE.ArrowHelper(bDir, new THREE.Vector3(0, 0, z), Math.abs(valB), 0x00f2fe, 0.25, 0.12);
          this.waveGroup.add(bArrow);
        }
      }
    }

    // Nối đường cong E
    const geomE = new THREE.BufferGeometry().setFromPoints(pointsE);
    const matE = new THREE.LineBasicMaterial({ color: 0xf43f5e, linewidth: 3 });
    const lineE = new THREE.Line(geomE, matE);
    this.waveGroup.add(lineE);

    // Nối đường cong B
    const geomB = new THREE.BufferGeometry().setFromPoints(pointsB);
    const matB = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 });
    const lineB = new THREE.Line(geomB, matB);
    this.waveGroup.add(lineB);
  }

  initAC() {
    if (!this.acCanvas) return;
    this.resizeAC();
  }

  resizeAC() {
    if (!this.acCanvas) return;
    const rect = this.acCanvas.parentElement.getBoundingClientRect();
    this.acCanvas.width = rect.width || 400;
    this.acCanvas.height = rect.height || 220;
  }

  updateAC() {
    if (!this.acCtx) return;
    this.acTime += 0.035;

    // e(t) = E0 * cos(omega * t)
    const eCurrent = this.acE0 * Math.cos(this.acOmega * this.acTime);
    this.acWaveHistory.push(eCurrent);
    if (this.acWaveHistory.length > 150) {
      this.acWaveHistory.shift();
    }

    this.renderAC();
  }

  renderAC() {
    const ctx = this.acCtx;
    const w = this.acCanvas.width;
    const h = this.acCanvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, w, h);

    // 1. Bên trái: Vòng tròn lượng giác & Vector quay Fresnel
    const circleR = 50;
    const cx = 75;
    const cy = h / 2;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, circleR, 0, Math.PI * 2);
    ctx.stroke();

    // Trục tọa độ vòng tròn
    ctx.beginPath();
    ctx.moveTo(cx - circleR - 10, cy); ctx.lineTo(cx + circleR + 10, cy);
    ctx.moveTo(cx, cy - circleR - 10); ctx.lineTo(cx, cy + circleR + 10);
    ctx.stroke();

    // Vector quay E0
    const angle = this.acOmega * this.acTime;
    const vx = cx + Math.cos(angle) * circleR;
    const vy = cy - Math.sin(angle) * circleR; // Trục y canvas ngược

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(vx, vy);
    ctx.stroke();

    // Mũi tên vector
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(vx, vy, 4, 0, Math.PI * 2);
    ctx.fill();

    // Đường dóng sang đồ thị
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(150, vy);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Bên phải: Đồ thị hình sin dao động điện áp xoay chiều e(t)
    const graphLeft = 150;
    const graphRight = w - 20;

    // Trục hoành
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(graphLeft, cy);
    ctx.lineTo(graphRight, cy);
    ctx.stroke();

    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('0', graphLeft - 14, cy + 4);
    ctx.fillText('+E0', graphLeft - 30, cy - circleR + 4);
    ctx.fillText('-E0', graphLeft - 30, cy + circleR + 4);

    // Vẽ sóng hình sin
    if (this.acWaveHistory.length > 1) {
      const step = (graphRight - graphLeft) / 150;
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      this.acWaveHistory.forEach((val, i) => {
        const x = graphRight - (this.acWaveHistory.length - 1 - i) * step;
        const normY = (val / this.acE0) * circleR;
        const y = cy - normY;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.isRunning) {
      this.time += 0.025;
      this.updateWave();
      this.updateAC();
    }
    if (this.controls) this.controls.update();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || 700;
    const height = this.container.clientHeight || 450;
    if (width > 0 && height > 0) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
    this.resizeAC();
  }

  setFrequency(f) {
    this.frequency = f;
  }

  setWavelength(l) {
    this.wavelength = l;
  }

  togglePlay() {
    this.isRunning = !this.isRunning;
  }
}
