// ==========================================================================
// OmniSim 3D - Main Application Controller
// ==========================================================================

import { GeometryProblemParser } from './math/problemParser.js';
import { SAMPLE_PROBLEMS } from './math/sampleProblems.js';
import { Geo3DStudio } from './math/geo3d.js';
import { Geo2DCanvas } from './math/geo2d.js';
import { GasThermodynamicsSim } from './physics/gasSim.js';
import { ElectromagnetismSim } from './physics/emInductionSim.js';
import { EMWaveAcSim } from './physics/emWaveAcSim.js';
import { NuclearDecaySim } from './physics/nuclearSim.js';
import { renderMath } from './utils/mathRenderer.js';

class OmniSimApp {
  constructor() {
    this.problemParser = new GeometryProblemParser();

    // Math visualizers
    this.geo3dScanner = null;
    this.geo3dStudio = null;
    this.geo2d = null;

    // Physics visualizers
    this.gasSim = null;
    this.emSim = null;
    this.waveAcSim = null;
    this.nuclearSim = null;

    this.currentMathModel = null;
  }

  init() {
    this.initNavigation();
    this.initMathModules();
    this.initPhysicsModules();
    this.initQuickTools();

    // Nạp bài toán mặc định cho Trợ lý Quét & Tự động vẽ hình
    const defaultSample = SAMPLE_PROBLEMS[0];
    this.loadSampleProblem(defaultSample, false);
  }

  // --- QUẢN LÝ TAB & CHUYỂN ĐỔI GIAO DIỆN ---
  initNavigation() {
    // 1. Tab chính (Toán vs Vật lý)
    const mainTabs = document.querySelectorAll('.nav-tab');
    mainTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        mainTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const target = tab.dataset.tab;
        document.querySelectorAll('.module-section').forEach(sec => sec.classList.remove('active'));
        const activeSec = document.getElementById(`module-${target}`);
        if (activeSec) activeSec.classList.add('active');

        // Kích hoạt resize khi chuyển tab để canvas render đúng kích thước
        window.dispatchEvent(new Event('resize'));
      });
    });

    // 2. Sub-tabs trong Toán Học
    const mathSubTabs = document.querySelectorAll('#module-math .sub-tab');
    mathSubTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        mathSubTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const sub = tab.dataset.sub;
        document.querySelectorAll('#module-math .subview').forEach(v => v.classList.remove('active'));
        const activeSub = document.getElementById(`subview-${sub}`);
        if (activeSub) activeSub.classList.add('active');

        window.dispatchEvent(new Event('resize'));
      });
    });

    // 3. Sub-tabs trong Vật Lý
    const physSubTabs = document.querySelectorAll('#module-physics .sub-tab');
    physSubTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        physSubTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const sub = tab.dataset.sub;
        document.querySelectorAll('#module-physics .subview').forEach(v => v.classList.remove('active'));
        const activeSub = document.getElementById(`subview-${sub}`);
        if (activeSub) activeSub.classList.add('active');

        window.dispatchEvent(new Event('resize'));
      });
    });
  }

  // ==========================================================================
  // MODULE 1: TOÁN HỌC (GEOLAB)
  // ==========================================================================
  initMathModules() {
    // 1. Khởi tạo 3D Studio cho Scanner
    this.geo3dScanner = new Geo3DStudio('three-scanner-container');

    // 2. Khởi tạo 3D Studio cho Kho Không Gian
    this.geo3dStudio = new Geo3DStudio('three-studio-container');
    this.setupGeo3dStudioControls();

    // 3. Khởi tạo 2D Canvas Oxy
    this.geo2d = new Geo2DCanvas('canvas-2d-oxy');
    this.setupGeo2dControls();

    // 4. Khởi tạo Trợ lý Quét & Bóc tách Đề bài
    this.setupScannerControls();

    // 5. Khởi tạo Thư viện Đề thi Mẫu
    this.renderSampleProblemsLibrary();
  }

  setupScannerControls() {
    const textInput = document.getElementById('problem-text-input');
    const btnParse = document.getElementById('btn-parse-and-render');
    const btnClear = document.getElementById('btn-clear-problem');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const scanBox = document.getElementById('scan-preview-box');
    const scanImg = document.getElementById('scanned-image-preview');

    // Nút phân tích đề bài
    btnParse.addEventListener('click', () => {
      const text = textInput.value;
      this.executeProblemAnalysis(text);
    });

    // Nút xóa
    btnClear.addEventListener('click', () => {
      textInput.value = '';
      scanBox.style.display = 'none';
    });

    // Ký hiệu toán học nhanh
    document.querySelectorAll('.sym-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sym = btn.dataset.sym;
        textInput.value += sym;
        textInput.focus();
      });
    });

    // Thẻ ảnh mẫu có sẵn (1-click test)
    document.querySelectorAll('.photo-card').forEach(card => {
      card.addEventListener('click', () => {
        const sampleId = card.dataset.sample;
        const sample = SAMPLE_PROBLEMS.find(s => s.id === sampleId);
        if (sample) {
          this.loadSampleProblem(sample, true);
        }
      });
    });

    // Tải ảnh qua Dropzone / File
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--accent-cyan)';
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      if (e.dataTransfer.files.length > 0) {
        this.handleImageFile(e.dataTransfer.files[0]);
      }
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        this.handleImageFile(fileInput.files[0]);
      }
    });

    // Viewport header buttons
    document.getElementById('btn-toggle-axes').addEventListener('click', (e) => {
      this.geo3dScanner.toggleAxes();
      e.currentTarget.classList.toggle('active');
    });

    document.getElementById('btn-toggle-labels').addEventListener('click', (e) => {
      this.geo3dScanner.toggleLabels();
      e.currentTarget.classList.toggle('active');
    });

    document.getElementById('btn-reset-cam-scanner').addEventListener('click', () => {
      this.geo3dScanner.resetCamera();
    });
  }

  handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const scanBox = document.getElementById('scan-preview-box');
      const scanImg = document.getElementById('scanned-image-preview');
      scanImg.src = e.target.result;
      scanBox.style.display = 'block';

      // Chạy hiệu ứng laser scan 1.5s rồi bóc tách
      setTimeout(() => {
        // Tự động nhận diện (nếu ảnh chứa từ khóa hoặc mẫu gần đúng)
        const sample = SAMPLE_PROBLEMS[0]; // Giả lập OCR nhận diện văn bản từ ảnh đề thi
        this.loadSampleProblem(sample, false);
      }, 1500);
    };
    reader.readAsDataURL(file);
  }

  loadSampleProblem(sample, triggerScanEffect = true) {
    const textInput = document.getElementById('problem-text-input');
    const scanBox = document.getElementById('scan-preview-box');
    const scanImg = document.getElementById('scanned-image-preview');

    textInput.value = sample.text;

    if (sample.image && triggerScanEffect) {
      scanImg.src = sample.image;
      scanBox.style.display = 'block';

      // Hiệu ứng quét laser
      setTimeout(() => {
        this.applyParsedModel(sample.parsed);
      }, 1200);
    } else {
      scanBox.style.display = 'none';
      this.applyParsedModel(sample.parsed);
    }
  }

  executeProblemAnalysis(text) {
    const parsed = this.problemParser.parseText(text);
    this.applyParsedModel(parsed);
  }

  applyParsedModel(modelData) {
    this.currentMathModel = modelData;

    // Cập nhật tiêu đề mô hình
    document.getElementById('model-name-display').textContent = modelData.name || 'Mô hình không gian';

    // Vẽ 3D
    this.geo3dScanner.loadModel(modelData);

    // Cập nhật bảng công thức và phân tích KaTeX
    this.renderMathAnalysisCards(modelData);
  }

  renderMathAnalysisCards(modelData) {
    const container = document.getElementById('math-cards-grid');
    container.innerHTML = '';

    if (!modelData.solutionSummary) return;

    for (const [key, latex] of Object.entries(modelData.solutionSummary)) {
      const card = document.createElement('div');
      card.className = 'math-card';

      let labelText = 'Kết Quả:';
      if (key === 'volume') labelText = 'Thể Tích (V):';
      else if (key === 'baseArea') labelText = 'Diện Tích Đáy (S_đáy):';
      else if (key === 'height') labelText = 'Chiều Cao (h):';
      else if (key === 'totalArea') labelText = 'Diện Tích Toàn Phần (S_tp):';
      else if (key === 'lateralArea') labelText = 'Diện Tích Xung Quanh (S_xq):';
      else if (key === 'slantHeight') labelText = 'Đường Sinh (l):';
      else if (key === 'diagonal') labelText = 'Độ Dài Đường Chéo:';
      else if (key === 'distance') labelText = 'Khoảng Cách:';
      else if (key === 'specialAngles') labelText = 'Góc Đặc Trưng:';
      else if (key === 'hypotenuse') labelText = 'Cạnh Huyền:';
      else if (key === 'crossSectionDesc') labelText = 'Thiết Diện:';
      else if (key === 'crossSectionArea') labelText = 'Diện Tích Thiết Diện:';

      const labelEl = document.createElement('div');
      labelEl.className = 'math-card-label';
      labelEl.textContent = labelText;

      const formulaEl = document.createElement('div');
      formulaEl.className = 'math-card-formula';
      renderMath(formulaEl, latex, false);

      card.appendChild(labelEl);
      card.appendChild(formulaEl);
      container.appendChild(card);
    }
  }

  setupGeo3dStudioControls() {
    const selectPreset = document.getElementById('select-3d-preset');
    const sliderA = document.getElementById('slider-dim-a');
    const sliderH = document.getElementById('slider-dim-h');
    const valA = document.getElementById('val-dim-a');
    const valH = document.getElementById('val-dim-h');
    const chkCross = document.getElementById('toggle-cross-section');
    const crossBox = document.getElementById('cross-section-controls');
    const sliderCrossZ = document.getElementById('slider-cross-z');
    const valCrossZ = document.getElementById('val-cross-z');

    const update3DFromControls = () => {
      const preset = selectPreset.value;
      const a = parseFloat(sliderA.value);
      const h = parseFloat(sliderH.value);

      valA.textContent = a.toFixed(1);
      valH.textContent = h.toFixed(1);

      let model;
      if (preset === 'pyramid_sa_square') model = this.problemParser.buildPyramidSquareSA(a, h);
      else if (preset === 'pyramid_regular_square') model = this.problemParser.buildRegularSquarePyramid(a, h);
      else if (preset === 'pyramid_sa_triangle') model = this.problemParser.buildPyramidTriangleSA(a, h);
      else if (preset === 'regular_tetrahedron') model = this.problemParser.buildRegularTetrahedron(a, h);
      else if (preset === 'cube') model = this.problemParser.buildCube(a);
      else if (preset === 'box') model = this.problemParser.buildBox(a, a * 0.75, h);
      else if (preset === 'prism_triangular') model = this.problemParser.buildPrismTriangular(a, a * 1.2, h);
      else if (preset === 'cone') model = this.problemParser.buildCone(a * 0.75, h);
      else if (preset === 'cylinder') model = this.problemParser.buildCylinder(a * 0.75, h);
      else if (preset === 'sphere') model = this.problemParser.buildSphere(a * 0.8);
      else model = this.problemParser.buildPyramidSquareSA(a, h);

      this.geo3dStudio.loadModel(model);
    };

    selectPreset.addEventListener('change', update3DFromControls);
    sliderA.addEventListener('input', update3DFromControls);
    sliderH.addEventListener('input', update3DFromControls);

    // Mặt phẳng cắt (Thiết diện)
    chkCross.addEventListener('change', () => {
      const enabled = chkCross.checked;
      crossBox.style.display = enabled ? 'block' : 'none';
      this.geo3dStudio.setCrossSection(enabled, parseFloat(sliderCrossZ.value));
    });

    sliderCrossZ.addEventListener('input', () => {
      const z = parseFloat(sliderCrossZ.value);
      valCrossZ.textContent = z.toFixed(2);
      this.geo3dStudio.setCrossSection(chkCross.checked, z);
    });

    // Chế độ mặt
    document.querySelectorAll('#subview-math-3d .btn-toggle[data-mode]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#subview-math-3d .btn-toggle[data-mode]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.geo3dStudio.setRenderMode(e.currentTarget.dataset.mode);
      });
    });

    document.getElementById('btn-reset-cam-3d').addEventListener('click', () => {
      this.geo3dStudio.resetCamera();
    });

    // Tải mặc định
    update3DFromControls();
  }

  setupGeo2dControls() {
    // Chế độ hình vẽ 2D
    document.querySelectorAll('#subview-math-2d .btn-toggle[data-mode2d]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#subview-math-2d .btn-toggle[data-mode2d]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const mode = e.currentTarget.dataset.mode2d;
        this.geo2d.setMode(mode);

        const triBox = document.getElementById('options-triangle-2d');
        if (triBox) triBox.style.display = mode === 'triangle' ? 'block' : 'none';
      });
    });

    // Tùy chọn tam giác
    document.getElementById('chk-centroid').addEventListener('change', () => this.geo2d.toggleTriangleOption('showCentroid'));
    document.getElementById('chk-orthocenter').addEventListener('change', () => this.geo2d.toggleTriangleOption('showOrthocenter'));
    document.getElementById('chk-circumcircle').addEventListener('change', () => this.geo2d.toggleTriangleOption('showCircumcircle'));
    document.getElementById('chk-medians').addEventListener('change', () => this.geo2d.toggleTriangleOption('showMedians'));

    // Cập nhật thống kê tọa độ khi kéo thả điểm
    this.geo2d.onUpdateCallback = (data) => {
      const statContainer = document.getElementById('stats-2d-content');
      if (!statContainer) return;

      let html = '';
      if (data.mode === 'triangle') {
        html = `
          <div class="stat-row"><span>Tọa độ A:</span> <strong class="accent-rose">${data.vertices.A}</strong></div>
          <div class="stat-row"><span>Tọa độ B:</span> <strong class="accent-cyan">${data.vertices.B}</strong></div>
          <div class="stat-row"><span>Tọa độ C:</span> <strong class="accent-cyan">${data.vertices.C}</strong></div>
          <div class="stat-row"><span>Độ dài cạnh:</span> <span>${data.sides}</span></div>
          <div class="stat-row"><span>Các góc:</span> <span>${data.angles}</span></div>
          <div class="stat-row"><span>Diện tích S:</span> <strong class="accent-amber">${data.area}</strong></div>
          <div class="stat-row"><span>Trọng tâm:</span> <strong class="accent-amber">${data.centroid}</strong></div>
          <div class="stat-row"><span>Trực tâm:</span> <strong class="accent-rose">${data.orthocenter}</strong></div>
          <div class="stat-row"><span>Ngoại tiếp:</span> <span>${data.circumcircle}</span></div>
        `;
      } else if (data.mode === 'circle') {
        html = `
          <div class="stat-row"><span>Tâm I:</span> <strong class="accent-cyan">${data.center}</strong></div>
          <div class="stat-row"><span>Bán kính R:</span> <strong class="accent-amber">${data.radius}</strong></div>
          <div class="stat-row"><span>Diện tích:</span> <span>${data.area}</span></div>
          <div class="stat-row"><span>Phương trình:</span> <span class="formula-text">${data.equation}</span></div>
        `;
      } else if (data.mode === 'vector') {
        html = `
          <div class="stat-row"><span>Vector u:</span> <strong class="accent-cyan">${data.vectorU}</strong></div>
          <div class="stat-row"><span>Vector v:</span> <strong class="accent-purple">${data.vectorV}</strong></div>
          <div class="stat-row"><span>Tích vô hướng:</span> <strong class="accent-amber">${data.dotProduct}</strong></div>
          <div class="stat-row"><span>Góc (u, v):</span> <span>${data.angle}</span></div>
          <div class="stat-row"><span>Tổng u + v:</span> <strong class="accent-cyan">${data.sum}</strong></div>
        `;
      }
      statContainer.innerHTML = html;
    };
  }

  renderSampleProblemsLibrary() {
    const list = document.getElementById('sample-cards-list');
    if (!list) return;
    list.innerHTML = '';

    SAMPLE_PROBLEMS.forEach(sample => {
      const card = document.createElement('div');
      card.className = 'sample-item-card';
      card.innerHTML = `
        <div class="sample-item-header">
          <span class="photo-badge">${sample.badge}</span>
          <span class="tag">${sample.difficulty}</span>
        </div>
        <div class="sample-item-title">${sample.title}</div>
        <div class="sample-item-text">${sample.text}</div>
        <button class="btn btn-secondary btn-sm" style="margin-top: auto;">Mô Phỏng Bài Toán Này ➜</button>
      `;

      card.addEventListener('click', () => {
        // Chuyển sang sub-tab scanner và nạp bài
        const subTab = document.querySelector('#module-math .sub-tab[data-sub="math-scanner"]');
        if (subTab) subTab.click();
        this.loadSampleProblem(sample, true);
      });

      list.appendChild(card);
    });
  }

  // ==========================================================================
  // MODULE 2: VẬT LÝ 12 ẢO (PHYSICLAB 12)
  // ==========================================================================
  initPhysicsModules() {
    // 1. Vật lý Nhiệt & Khí lý tưởng
    this.gasSim = new GasThermodynamicsSim('canvas-gas-sim', 'canvas-gas-graph');
    this.setupGasControls();

    // 2. Từ trường & Cảm ứng điện từ
    this.emSim = new ElectromagnetismSim('canvas-em-sim');
    this.setupEmControls();

    // 3. Sóng điện từ 3D & Dòng xoay chiều AC
    this.waveAcSim = new EMWaveAcSim('three-wave-container', 'canvas-ac-generator');
    this.setupWaveAcControls();

    // 4. Vật lý Hạt nhân & Phóng xạ
    this.nuclearSim = new NuclearDecaySim('canvas-nuclear-sim', 'canvas-decay-graph');
    this.setupNuclearControls();
  }

  setupGasControls() {
    const sliderT = document.getElementById('slider-gas-temp');
    const sliderV = document.getElementById('slider-gas-vol');
    const valT = document.getElementById('val-gas-t');
    const valV = document.getElementById('val-gas-v');

    sliderT.addEventListener('input', () => {
      const t = parseInt(sliderT.value);
      valT.textContent = `${t} K`;
      this.gasSim.setTemperature(t);
    });

    sliderV.addEventListener('input', () => {
      const v = parseFloat(sliderV.value);
      valV.textContent = `${v.toFixed(1)} L`;
      this.gasSim.setPistonVolume(v);
    });

    // Nút nung nóng / làm lạnh
    document.getElementById('btn-heat-fire').addEventListener('mousedown', () => this.gasSim.setHeatSource(1));
    document.getElementById('btn-heat-fire').addEventListener('mouseup', () => this.gasSim.setHeatSource(0));
    document.getElementById('btn-heat-ice').addEventListener('mousedown', () => this.gasSim.setHeatSource(-1));
    document.getElementById('btn-heat-ice').addEventListener('mouseup', () => this.gasSim.setHeatSource(0));
    document.getElementById('btn-heat-stop').addEventListener('click', () => this.gasSim.setHeatSource(0));

    // Chế độ đẳng quá trình
    document.querySelectorAll('#subview-phys-gas .btn-toggle[data-gas-mode]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#subview-phys-gas .btn-toggle[data-gas-mode]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.gasSim.setProcessMode(e.currentTarget.dataset.gasMode);
      });
    });

    // Callback cập nhật đại lượng
    this.gasSim.onUpdateCallback = (data) => {
      document.getElementById('stat-gas-p').textContent = `${data.P.toFixed(2)} atm`;
      document.getElementById('stat-gas-v').textContent = `${data.V.toFixed(2)} L`;
      document.getElementById('stat-gas-t').textContent = `${Math.round(data.T)} K (${(data.T - 273.15).toFixed(1)}°C)`;
      sliderT.value = data.T;
      sliderV.value = data.V;
      valT.textContent = `${Math.round(data.T)} K`;
      valV.textContent = `${data.V.toFixed(1)} L`;
    };
  }

  setupEmControls() {
    // Chuyển chuyên đề Faraday vs Lorentz
    document.querySelectorAll('#subview-phys-em .btn-toggle[data-em-mode]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#subview-phys-em .btn-toggle[data-em-mode]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const mode = e.currentTarget.dataset.emMode;
        this.emSim.setSubMode(mode);

        document.getElementById('em-faraday-controls').style.display = mode === 'faraday' ? 'block' : 'none';
        document.getElementById('em-lorentz-controls').style.display = mode === 'lorentz' ? 'block' : 'none';
      });
    });

    // Nút dao động tự động
    const btnOscillate = document.getElementById('btn-toggle-oscillate');
    btnOscillate.addEventListener('click', () => {
      this.emSim.toggleAutoOscillate();
      btnOscillate.classList.toggle('btn-glow');
    });

    // Đảo cực nam châm
    document.getElementById('btn-flip-magnet').addEventListener('click', () => {
      this.emSim.reverseMagnetPolarity();
    });

    // Thanh trượt Lorentz
    const sliderB = document.getElementById('slider-lorentz-b');
    const sliderV = document.getElementById('slider-lorentz-v');
    const valB = document.getElementById('val-lorentz-b');
    const valV = document.getElementById('val-lorentz-v');

    sliderB.addEventListener('input', () => {
      const b = parseFloat(sliderB.value);
      valB.textContent = `${b.toFixed(2)} T`;
      this.emSim.lorentz.B = b;
      this.emSim.setupLorentzParticle();
    });

    sliderV.addEventListener('input', () => {
      const v = parseFloat(sliderV.value);
      valV.textContent = `${v.toFixed(1)} m/s`;
      this.emSim.lorentz.v = v;
      this.emSim.setupLorentzParticle();
    });

    document.getElementById('btn-charge-pos').addEventListener('click', (e) => {
      document.getElementById('btn-charge-neg').classList.remove('active');
      e.currentTarget.classList.add('active');
      this.emSim.lorentz.q = 1.0;
      this.emSim.setupLorentzParticle();
    });

    document.getElementById('btn-charge-neg').addEventListener('click', (e) => {
      document.getElementById('btn-charge-pos').classList.remove('active');
      e.currentTarget.classList.add('active');
      this.emSim.lorentz.q = -1.0;
      this.emSim.setupLorentzParticle();
    });

    // Cập nhật chỉ số Faraday
    this.emSim.onUpdateCallback = (data) => {
      document.getElementById('stat-em-flux').textContent = `${data.flux.toFixed(3)} Wb`;
      document.getElementById('stat-em-emf').textContent = `${data.emf.toFixed(3)} V`;
      document.getElementById('stat-em-current').textContent = `${data.current.toFixed(3)} A`;
    };
  }

  setupWaveAcControls() {
    const sliderF = document.getElementById('slider-wave-freq');
    const sliderL = document.getElementById('slider-wave-len');
    const valF = document.getElementById('val-wave-f');
    const valL = document.getElementById('val-wave-l');

    sliderF.addEventListener('input', () => {
      const f = parseFloat(sliderF.value);
      valF.textContent = `${f.toFixed(2)} Hz`;
      this.waveAcSim.setFrequency(f);
    });

    sliderL.addEventListener('input', () => {
      const l = parseFloat(sliderL.value);
      valL.textContent = `${l.toFixed(1)} m`;
      this.waveAcSim.setWavelength(l);
    });

    document.getElementById('btn-toggle-wave-play').addEventListener('click', () => {
      this.waveAcSim.togglePlay();
    });
  }

  setupNuclearControls() {
    const selectIso = document.getElementById('select-isotope');
    selectIso.addEventListener('change', () => {
      this.nuclearSim.setIsotope(selectIso.value);
    });

    document.getElementById('btn-reset-decay').addEventListener('click', () => {
      this.nuclearSim.reset();
    });

    this.nuclearSim.onUpdateCallback = (data) => {
      document.getElementById('stat-nuc-rem').textContent = data.remaining;
      document.getElementById('stat-nuc-dec').textContent = data.decayed;
      document.getElementById('stat-nuc-ratio').textContent = `${data.ratio.toFixed(1)}%`;
      document.getElementById('stat-nuc-time').textContent = `${data.timeElapsed.toFixed(2)} chu kỳ T (${(data.timeElapsed * data.isotope.halfLife).toLocaleString()} ${data.isotope.unit})`;
    };
  }

  initQuickTools() {
    // Toàn màn hình
    document.getElementById('btn-fullscreen').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(err));
      } else {
        document.exitFullscreen();
      }
    });

    // Xuất ảnh PNG
    document.getElementById('btn-export-img').addEventListener('click', () => {
      // Tìm canvas đang hiển thị
      let canvasToExport = null;
      const activeSec = document.querySelector('.module-section.active');
      if (activeSec) {
        const activeSub = activeSec.querySelector('.subview.active');
        if (activeSub) {
          canvasToExport = activeSub.querySelector('canvas');
        }
      }

      if (canvasToExport) {
        const link = document.createElement('a');
        link.download = `omnisim-snapshot-${Date.now()}.png`;
        link.href = canvasToExport.toDataURL('image/png');
        link.click();
      } else {
        alert('Đã sẵn sàng! Hãy chọn khung nhìn mô phỏng cần xuất ảnh.');
      }
    });
  }
}

// Khởi chạy ứng dụng an toàn
function startOmniSim() {
  const app = new OmniSimApp();
  app.init();
  window.__omnisim_app = app;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startOmniSim);
} else {
  startOmniSim();
}
