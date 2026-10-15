// Bộ mô phỏng Hình học Không gian 3D (Three.js 3D Geometry Studio)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Geo3DStudio {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.geometryGroup = null;
    this.labelsGroup = null;
    this.axesGroup = null;
    this.crossSectionMesh = null;

    this.options = {
      showAxes: true,
      showGrid: true,
      showLabels: true,
      renderMode: 'glass', // 'glass', 'solid', 'wireframe'
      crossSectionEnabled: false,
      crossSectionHeight: 2.5
    };

    this.currentModelData = null;
    this.init();
  }

  init() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 550;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(11, -12, 9);
    this.camera.up.set(0, 0, 1); // Trục Oz hướng lên theo chuẩn Toán học Việt Nam!

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(1.5, 1.5, 2);

    // Groups
    this.axesGroup = new THREE.Group();
    this.geometryGroup = new THREE.Group();
    this.labelsGroup = new THREE.Group();
    this.scene.add(this.axesGroup);
    this.scene.add(this.geometryGroup);
    this.scene.add(this.labelsGroup);

    // Lights
    this.setupLighting();

    // Axes & Grid
    this.buildAxesAndGrid();

    // Resize handler
    window.addEventListener('resize', () => this.onResize());

    // Animation loop
    this.animate();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f2fe, 1.2);
    dirLight1.position.set(15, -10, 20);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x8b5cf6, 0.8);
    dirLight2.position.set(-15, 15, -10);
    this.scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 0.8, 50);
    pointLight.position.set(5, 5, 10);
    this.scene.add(pointLight);
  }

  buildAxesAndGrid() {
    this.axesGroup.clear();

    if (this.options.showGrid) {
      // Lưới mặt phẳng Oxy (z = 0)
      const gridHelper = new THREE.GridHelper(16, 16, 0x334155, 0x1e293b);
      gridHelper.rotation.x = Math.PI / 2; // Xoay vào mặt phẳng Oxy
      gridHelper.position.set(0, 0, 0);
      this.axesGroup.add(gridHelper);
    }

    if (this.options.showAxes) {
      const axisLen = 9;
      // Ox (Đỏ / Amber)
      const xArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), axisLen, 0xf43f5e, 0.8, 0.35);
      this.axesGroup.add(xArrow);
      this.axesGroup.add(this.createAxisLabel("x (Ox)", [axisLen + 0.5, 0, 0], "#f43f5e"));

      // Oy (Xanh lục / Emerald)
      const yArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), axisLen, 0x10b981, 0.8, 0.35);
      this.axesGroup.add(yArrow);
      this.axesGroup.add(this.createAxisLabel("y (Oy)", [0, axisLen + 0.5, 0], "#10b981"));

      // Oz (Xanh dương / Cyan - Trục cao đứng)
      const zArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), axisLen, 0x00f2fe, 0.8, 0.35);
      this.axesGroup.add(zArrow);
      this.axesGroup.add(this.createAxisLabel("z (Oz)", [0, 0, axisLen + 0.5], "#00f2fe"));

      // Gốc O
      this.axesGroup.add(this.createAxisLabel("O(0,0,0)", [-0.4, -0.4, -0.4], "#94a3b8"));
    }
  }

  createAxisLabel(text, position, color = "#ffffff") {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(position[0], position[1], position[2]);
    sprite.scale.set(1.5, 0.5, 1);
    return sprite;
  }

  createVertexLabel(text, coord, subtext = "") {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');

    // Nền bong bóng bo góc hiện đại
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(8, 8, 284, 104, 16);
    ctx.fill();
    ctx.stroke();

    // Tên đỉnh
    ctx.font = 'bold 42px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(text, 150, 48);

    // Tọa độ nhỏ bên dưới
    ctx.font = '24px "JetBrains Mono", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(subtext || `(${coord.map(n => Number(n).toFixed(1)).join(', ')})`, 150, 92);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(coord[0], coord[1], coord[2] + 0.45);
    sprite.scale.set(1.4, 0.56, 1);
    return sprite;
  }

  // Tải và hiển thị mô hình hình học từ dữ liệu phân tích
  loadModel(modelData) {
    this.currentModelData = modelData;
    this.geometryGroup.clear();
    this.labelsGroup.clear();

    if (!modelData || !modelData.vertices) return;

    const vertices = modelData.vertices;

    // 1. Dựng các mặt đa diện (Faces) với phong cách Glassmorphism
    if (modelData.faces && this.options.renderMode !== 'wireframe') {
      const isGlass = this.options.renderMode === 'glass';
      const faceMat = new THREE.MeshPhysicalMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: isGlass ? 0.28 : 0.85,
        roughness: 0.2,
        metalness: 0.1,
        transmission: isGlass ? 0.7 : 0,
        ior: 1.4,
        side: THREE.DoubleSide,
        depthWrite: !isGlass
      });

      modelData.faces.forEach(faceIndices => {
        if (faceIndices.length === 3) {
          const vA = new THREE.Vector3(...vertices[faceIndices[0]]);
          const vB = new THREE.Vector3(...vertices[faceIndices[1]]);
          const vC = new THREE.Vector3(...vertices[faceIndices[2]]);
          const geom = new THREE.BufferGeometry().setFromPoints([vA, vB, vC]);
          geom.computeVertexNormals();
          const mesh = new THREE.Mesh(geom, faceMat);
          this.geometryGroup.add(mesh);
        } else if (faceIndices.length === 4) {
          const vA = new THREE.Vector3(...vertices[faceIndices[0]]);
          const vB = new THREE.Vector3(...vertices[faceIndices[1]]);
          const vC = new THREE.Vector3(...vertices[faceIndices[2]]);
          const vD = new THREE.Vector3(...vertices[faceIndices[3]]);
          const geom = new THREE.BufferGeometry().setFromPoints([vA, vB, vC, vA, vC, vD]);
          geom.computeVertexNormals();
          const mesh = new THREE.Mesh(geom, faceMat);
          this.geometryGroup.add(mesh);
        }
      });
    }

    // 2. Dựng các cạnh (Edges): Nét liền và Nét đứt (chuẩn phối cảnh Việt Nam)
    const solidLineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2.5 });
    const dashedLineMat = new THREE.LineDashedMaterial({
      color: 0x94a3b8,
      linewidth: 1.8,
      dashSize: 0.35,
      gapSize: 0.2
    });
    const accentLineMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 3 }); // Nét nhấn đường cao/đường chéo

    if (modelData.edges) {
      modelData.edges.forEach(edge => {
        const p1 = vertices[edge.from];
        const p2 = vertices[edge.to];
        if (!p1 || !p2) return;

        const points = [new THREE.Vector3(...p1), new THREE.Vector3(...p2)];
        const geom = new THREE.BufferGeometry().setFromPoints(points);

        let line;
        if (edge.type === 'dashed') {
          geom.computeLineDistances();
          line = new THREE.Line(geom, dashedLineMat);
        } else if (edge.type === 'accent') {
          line = new THREE.Line(geom, accentLineMat);
        } else {
          line = new THREE.Line(geom, solidLineMat);
        }
        this.geometryGroup.add(line);
      });
    }

    // 3. Dựng các điểm đỉnh (Vertex Spheres) & Nhãn
    const sphereGeom = new THREE.SphereGeometry(0.12, 16, 16);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      emissive: 0x0284c7,
      roughness: 0.2
    });

    for (const [name, coord] of Object.entries(vertices)) {
      const pointMesh = new THREE.Mesh(sphereGeom, sphereMat);
      pointMesh.position.set(...coord);
      this.geometryGroup.add(pointMesh);

      if (this.options.showLabels) {
        const sprite = this.createVertexLabel(name, coord);
        this.labelsGroup.add(sprite);
      }
    }

    // 4. Khối tròn xoay đặc biệt: Hình Nón, Hình Trụ, Hình Cầu
    if (modelData.type === 'cone') {
      this.buildConeMesh(modelData.params);
    } else if (modelData.type === 'cylinder') {
      this.buildCylinderMesh(modelData.params);
    } else if (modelData.type === 'sphere') {
      this.buildSphereMesh(modelData.params);
    }

    // 5. Mặt phẳng cắt (Thiết diện) nếu bật
    if (this.options.crossSectionEnabled) {
      this.updateCrossSection();
    }

    // Căn giữa camera
    this.fitCameraToModel(vertices);
  }

  buildConeMesh(params) {
    const { r, h } = params;
    const geom = new THREE.ConeGeometry(r, h, 48, 1, true);
    geom.rotateX(Math.PI / 2); // Đặt trục theo Oz
    geom.translate(0, 0, h / 2);

    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.35,
      roughness: 0.2,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geom, mat);
    this.geometryGroup.add(mesh);

    // Vòng tròn đáy
    const circleGeom = new THREE.RingGeometry(0, r, 48);
    const circleMesh = new THREE.Mesh(circleGeom, mat);
    this.geometryGroup.add(circleMesh);
  }

  buildCylinderMesh(params) {
    const { r, h } = params;
    const geom = new THREE.CylinderGeometry(r, r, h, 48, 1, true);
    geom.rotateX(Math.PI / 2);
    geom.translate(0, 0, h / 2);

    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.35,
      roughness: 0.2,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geom, mat);
    this.geometryGroup.add(mesh);

    // 2 đáy
    const circleGeom = new THREE.CircleGeometry(r, 48);
    const bottomCap = new THREE.Mesh(circleGeom, mat);
    const topCap = new THREE.Mesh(circleGeom, mat);
    topCap.position.set(0, 0, h);
    this.geometryGroup.add(bottomCap);
    this.geometryGroup.add(topCap);
  }

  buildSphereMesh(params) {
    const { r } = params;
    const geom = new THREE.SphereGeometry(r, 40, 40);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.35,
      roughness: 0.2,
      wireframe: this.options.renderMode === 'wireframe'
    });
    const mesh = new THREE.Mesh(geom, mat);
    this.geometryGroup.add(mesh);

    // Vòng xích đạo nổi bật
    const eqGeom = new THREE.RingGeometry(r - 0.05, r + 0.05, 64);
    const eqMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide });
    const eqMesh = new THREE.Mesh(eqGeom, eqMat);
    this.geometryGroup.add(eqMesh);
  }

  updateCrossSection() {
    if (this.crossSectionMesh) {
      this.geometryGroup.remove(this.crossSectionMesh);
      this.crossSectionMesh = null;
    }

    if (!this.options.crossSectionEnabled) return;

    const z = this.options.crossSectionHeight;
    const size = 9;
    const planeGeom = new THREE.PlaneGeometry(size, size);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      emissive: 0xd97706,
      emissiveIntensity: 0.2
    });

    this.crossSectionMesh = new THREE.Mesh(planeGeom, planeMat);
    this.crossSectionMesh.position.set(2, 2, z);
    this.geometryGroup.add(this.crossSectionMesh);
  }

  fitCameraToModel(vertices) {
    const coords = Object.values(vertices);
    if (coords.length === 0) return;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    coords.forEach(([x, y, z]) => {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;
    this.controls.target.set(centerX, centerY, centerZ);

    const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ, 4);
    const dist = maxDim * 2.4;
    this.camera.position.set(centerX + dist * 0.9, centerY - dist * 1.1, centerZ + dist * 0.7);
    this.camera.lookAt(centerX, centerY, centerZ);
  }

  resetCamera() {
    if (this.currentModelData) {
      this.fitCameraToModel(this.currentModelData.vertices);
    } else {
      this.camera.position.set(11, -12, 9);
      this.controls.target.set(1.5, 1.5, 2);
    }
  }

  toggleAxes() {
    this.options.showAxes = !this.options.showAxes;
    this.buildAxesAndGrid();
  }

  toggleLabels() {
    this.options.showLabels = !this.options.showLabels;
    this.labelsGroup.visible = this.options.showLabels;
  }

  setRenderMode(mode) {
    this.options.renderMode = mode;
    if (this.currentModelData) {
      this.loadModel(this.currentModelData);
    }
  }

  setCrossSection(enabled, height) {
    this.options.crossSectionEnabled = enabled;
    if (height !== undefined) this.options.crossSectionHeight = height;
    this.updateCrossSection();
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 550;
    if (width > 0 && height > 0) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.controls) this.controls.update();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  captureImage() {
    return this.renderer.domElement.toDataURL('image/png');
  }
}
