// Mô phỏng Hình học Phẳng 2D Tương tác trên Hệ trục Tọa độ Oxy (Interactive Oxy Geometry Canvas)
export class Geo2DCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Cấu hình tọa độ Oxy
    this.scale = 45; // 45 pixels = 1 unit
    this.origin = { x: 0, y: 0 };
    this.mouseWorld = { x: 0, y: 0 };
    this.isDragging = false;
    this.draggedPoint = null;

    // Chế độ hình vẽ 2D
    this.mode = 'triangle'; // 'triangle', 'circle', 'ellipse', 'vector'

    // Dữ liệu hình vẽ:
    // 1. Tam giác Oxy
    this.triangle = {
      A: { x: 1, y: 4, name: 'A', color: '#f43f5e' },
      B: { x: -3, y: -2, name: 'B', color: '#10b981' },
      C: { x: 5, y: -1, name: 'C', color: '#00f2fe' }
    };

    // Tùy chọn hiển thị các điểm đặc biệt tam giác
    this.triangleOptions = {
      showCentroid: true,        // Trọng tâm G
      showOrthocenter: true,      // Trực tâm H
      showCircumcircle: true,    // Tâm O & Đường tròn ngoại tiếp
      showIncircle: false,       // Tâm I & Đường tròn nội tiếp
      showAltitudes: true,       // Các đường cao
      showMedians: false         // Các đường trung tuyến
    };

    // 2. Đường tròn Oxy
    this.circle = {
      center: { x: 1, y: 1, name: 'I', color: '#38bdf8' },
      radiusPoint: { x: 4, y: 1, name: 'M', color: '#f59e0b' }
    };

    // 3. Elip Oxy
    this.ellipse = {
      a: 4,
      b: 2.5
    };

    // 4. Vector Oxy
    this.vectors = {
      u: { x: 3, y: 3, name: 'u', color: '#00f2fe' },
      v: { x: 4, y: -2, name: 'v', color: '#a855f7' }
    };

    this.onUpdateCallback = null;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Sự kiện chuột
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', () => this.onMouseUp());
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    // Touch events cho điện thoại / tablet
    this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    window.addEventListener('touchend', () => this.onMouseUp());

    this.render();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width || 800;
    this.canvas.height = rect.height || 550;
    this.origin.x = this.canvas.width / 2;
    this.origin.y = this.canvas.height / 2;
    this.render();
  }

  // Chuyển đổi tọa độ World Oxy <-> Screen Canvas
  worldToScreen(wx, wy) {
    return {
      x: this.origin.x + wx * this.scale,
      y: this.origin.y - wy * this.scale
    };
  }

  screenToWorld(sx, sy) {
    return {
      x: (sx - this.origin.x) / this.scale,
      y: (this.origin.y - sy) / this.scale
    };
  }

  // Vẽ lưới tọa độ Oxy chuyên nghiệp
  drawGrid() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Nền tối hiện đại
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Lưới phụ (Sub-grid)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;

    const left = -this.origin.x / this.scale;
    const right = (w - this.origin.x) / this.scale;
    const bottom = -(h - this.origin.y) / this.scale;
    const top = this.origin.y / this.scale;

    ctx.beginPath();
    for (let x = Math.floor(left); x <= Math.ceil(right); x++) {
      const sx = this.origin.x + x * this.scale;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
    }
    for (let y = Math.floor(bottom); y <= Math.ceil(top); y++) {
      const sy = this.origin.y - y * this.scale;
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
    }
    ctx.stroke();

    // Trục chính Ox và Oy
    ctx.lineWidth = 2;
    // Ox
    ctx.strokeStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(0, this.origin.y);
    ctx.lineTo(w, this.origin.y);
    ctx.stroke();

    // Mũi tên Ox
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(w - 12, this.origin.y - 6);
    ctx.lineTo(w, this.origin.y);
    ctx.lineTo(w - 12, this.origin.y + 6);
    ctx.fill();

    // Oy
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(this.origin.x, h);
    ctx.lineTo(this.origin.x, 0);
    ctx.stroke();

    // Mũi tên Oy
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(this.origin.x - 6, 12);
    ctx.lineTo(this.origin.x, 0);
    ctx.lineTo(this.origin.x + 6, 12);
    ctx.fill();

    // Đánh số trục tọa độ
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Số trên Ox
    for (let x = Math.floor(left); x <= Math.ceil(right); x++) {
      if (x === 0) continue;
      const sx = this.origin.x + x * this.scale;
      ctx.fillText(x.toString(), sx, this.origin.y + 6);
    }

    // Số trên Oy
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = Math.floor(bottom); y <= Math.ceil(top); y++) {
      if (y === 0) continue;
      const sy = this.origin.y - y * this.scale;
      ctx.fillText(y.toString(), this.origin.x - 8, sy);
    }

    // Nhãn trục
    ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#f43f5e';
    ctx.textAlign = 'right';
    ctx.fillText('x (Ox)', w - 16, this.origin.y - 12);

    ctx.fillStyle = '#10b981';
    ctx.textAlign = 'left';
    ctx.fillText('y (Oy)', this.origin.x + 12, 16);

    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText('O', this.origin.x - 6, this.origin.y + 6);
  }

  render() {
    this.drawGrid();

    if (this.mode === 'triangle') {
      this.renderTriangle();
    } else if (this.mode === 'circle') {
      this.renderCircle();
    } else if (this.mode === 'ellipse') {
      this.renderEllipse();
    } else if (this.mode === 'vector') {
      this.renderVectors();
    }

    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.getCalculations());
    }
  }

  // --- MÔ PHỎNG TAM GIÁC OXY & CÁC ĐIỂM ĐẶC BIỆT ---
  renderTriangle() {
    const ctx = this.ctx;
    const { A, B, C } = this.triangle;

    const sA = this.worldToScreen(A.x, A.y);
    const sB = this.worldToScreen(B.x, B.y);
    const sC = this.worldToScreen(C.x, C.y);

    // Tô màu diện tích tam giác dạng gradient phát sáng
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sA.x, sA.y);
    ctx.lineTo(sB.x, sB.y);
    ctx.lineTo(sC.x, sC.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 242, 254, 0.12)';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#00f2fe';
    ctx.stroke();
    ctx.restore();

    // Tính toán các điểm đặc biệt
    const calcs = this.calcTriangleProperties();

    // 1. Đường tròn ngoại tiếp & Tâm O
    if (this.triangleOptions.showCircumcircle && calcs.circumcenter) {
      const { O, R } = calcs.circumcenter;
      const sO = this.worldToScreen(O.x, O.y);
      const sR = R * this.scale;

      ctx.save();
      ctx.beginPath();
      ctx.arc(sO.x, sO.y, sR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Tâm O
      this.drawPoint(O.x, O.y, 'O (Ngoại tiếp)', '#38bdf8', 5);
      ctx.restore();
    }

    // 2. Đường cao & Trực tâm H
    if (this.triangleOptions.showOrthocenter && calcs.orthocenter) {
      const H = calcs.orthocenter;
      const sH = this.worldToScreen(H.x, H.y);

      if (this.triangleOptions.showAltitudes) {
        ctx.save();
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;

        // Vẽ đường cao từ A, B, C tới H
        [sA, sB, sC].forEach(sP => {
          ctx.beginPath();
          ctx.moveTo(sP.x, sP.y);
          ctx.lineTo(sH.x, sH.y);
          ctx.stroke();
        });
        ctx.restore();
      }

      this.drawPoint(H.x, H.y, 'H (Trực tâm)', '#f43f5e', 5);
    }

    // 3. Trọng tâm G
    if (this.triangleOptions.showCentroid && calcs.centroid) {
      const G = calcs.centroid;
      const sG = this.worldToScreen(G.x, G.y);

      if (this.triangleOptions.showMedians) {
        ctx.save();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;

        // Trung điểm M_BC, M_CA, M_AB
        const mBC = this.worldToScreen((B.x + C.x) / 2, (B.y + C.y) / 2);
        const mCA = this.worldToScreen((C.x + A.x) / 2, (C.y + A.y) / 2);
        const mAB = this.worldToScreen((A.x + B.x) / 2, (A.y + B.y) / 2);

        ctx.beginPath();
        ctx.moveTo(sA.x, sA.y); ctx.lineTo(mBC.x, mBC.y);
        ctx.moveTo(sB.x, sB.y); ctx.lineTo(mCA.x, mCA.y);
        ctx.moveTo(sC.x, sC.y); ctx.lineTo(mAB.x, mAB.y);
        ctx.stroke();
        ctx.restore();
      }

      this.drawPoint(G.x, G.y, 'G (Trọng tâm)', '#f59e0b', 5);
    }

    // Vẽ 3 đỉnh kéo thả A, B, C
    this.drawPoint(A.x, A.y, `A(${A.x.toFixed(1)}, ${A.y.toFixed(1)})`, A.color, 8, true);
    this.drawPoint(B.x, B.y, `B(${B.x.toFixed(1)}, ${B.y.toFixed(1)})`, B.color, 8, true);
    this.drawPoint(C.x, C.y, `C(${C.x.toFixed(1)}, ${C.y.toFixed(1)})`, C.color, 8, true);
  }

  // --- MÔ PHỎNG ĐƯỜNG TRÒN OXY ---
  renderCircle() {
    const ctx = this.ctx;
    const { center, radiusPoint } = this.circle;
    const r = Math.hypot(radiusPoint.x - center.x, radiusPoint.y - center.y);

    const sC = this.worldToScreen(center.x, center.y);
    const sR = r * this.scale;
    const sP = this.worldToScreen(radiusPoint.x, radiusPoint.y);

    // Hình tròn phát sáng
    ctx.save();
    ctx.beginPath();
    ctx.arc(sC.x, sC.y, sR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Bán kính R
    ctx.beginPath();
    ctx.moveTo(sC.x, sC.y);
    ctx.lineTo(sP.x, sP.y);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.stroke();
    ctx.restore();

    // Tiếp tuyến tại M
    const dx = radiusPoint.x - center.x;
    const dy = radiusPoint.y - center.y;
    const tx = -dy, ty = dx;
    const p1 = this.worldToScreen(radiusPoint.x + tx * 3, radiusPoint.y + ty * 3);
    const p2 = this.worldToScreen(radiusPoint.x - tx * 3, radiusPoint.y - ty * 3);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();

    this.drawPoint(center.x, center.y, `Tâm I(${center.x.toFixed(1)}, ${center.y.toFixed(1)})`, center.color, 8, true);
    this.drawPoint(radiusPoint.x, radiusPoint.y, `M (Tiếp điểm, R=${r.toFixed(2)})`, radiusPoint.color, 8, true);
  }

  // --- MÔ PHỎNG ELIP OXY ---
  renderEllipse() {
    const ctx = this.ctx;
    const { a, b } = this.ellipse;
    const sC = this.worldToScreen(0, 0);

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(sC.x, sC.y, a * this.scale, b * this.scale, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(168, 85, 247, 0.12)';
    ctx.fill();
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 2 Tiêu điểm F1, F2
    if (a >= b) {
      const c = Math.sqrt(a * a - b * b);
      this.drawPoint(-c, 0, `F1(-${c.toFixed(2)}, 0)`, '#f43f5e', 6);
      this.drawPoint(c, 0, `F2(${c.toFixed(2)}, 0)`, '#f43f5e', 6);
    }
    ctx.restore();
  }

  // --- MÔ PHỎNG VECTOR OXY ---
  renderVectors() {
    const { u, v } = this.vectors;
    const sum = { x: u.x + v.x, y: u.y + v.y };

    // Vẽ hình bình hành cộng vector
    const sO = this.worldToScreen(0, 0);
    const sU = this.worldToScreen(u.x, u.y);
    const sV = this.worldToScreen(v.x, v.y);
    const sSum = this.worldToScreen(sum.x, sum.y);

    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sU.x, sU.y);
    ctx.lineTo(sSum.x, sSum.y);
    ctx.lineTo(sV.x, sV.y);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();

    this.drawArrow(0, 0, u.x, u.y, u.color, `u(${u.x.toFixed(1)}, ${u.y.toFixed(1)})`);
    this.drawArrow(0, 0, v.x, v.y, v.color, `v(${v.x.toFixed(1)}, ${v.y.toFixed(1)})`);
    this.drawArrow(0, 0, sum.x, sum.y, '#10b981', `u + v (${sum.x.toFixed(1)}, ${sum.y.toFixed(1)})`, 3);

    this.drawPoint(u.x, u.y, '', u.color, 7, true);
    this.drawPoint(v.x, v.y, '', v.color, 7, true);
  }

  drawPoint(wx, wy, label, color = '#00f2fe', radius = 6, isInteractive = false) {
    const ctx = this.ctx;
    const s = this.worldToScreen(wx, wy);

    ctx.save();
    // Vòng phát sáng
    if (isInteractive) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, radius + 4, 0, Math.PI * 2);
      ctx.fillStyle = color.replace(')', ', 0.25)').replace('rgb', 'rgba');
      ctx.fill();
    }

    // Điểm chính
    ctx.beginPath();
    ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Nhãn
    if (label) {
      ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, s.x + 10, s.y - 6);
    }
    ctx.restore();
  }

  drawArrow(fromX, fromY, toX, toY, color, label, width = 2) {
    const ctx = this.ctx;
    const sFrom = this.worldToScreen(fromX, fromY);
    const sTo = this.worldToScreen(toX, toY);

    const angle = Math.atan2(sTo.y - sFrom.y, sTo.x - sFrom.x);
    const headLen = 12;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;

    ctx.beginPath();
    ctx.moveTo(sFrom.x, sFrom.y);
    ctx.lineTo(sTo.x, sTo.y);
    ctx.stroke();

    // Mũi tên
    ctx.beginPath();
    ctx.moveTo(sTo.x, sTo.y);
    ctx.lineTo(sTo.x - headLen * Math.cos(angle - Math.PI / 6), sTo.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(sTo.x - headLen * Math.cos(angle + Math.PI / 6), sTo.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    if (label) {
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillStyle = color;
      ctx.fillText(label, (sFrom.x + sTo.x) / 2 + 10, (sFrom.y + sTo.y) / 2 - 8);
    }
    ctx.restore();
  }

  // Tính chất toán học tam giác
  calcTriangleProperties() {
    const { A, B, C } = this.triangle;
    // Độ dài cạnh
    const a = Math.hypot(B.x - C.x, B.y - C.y); // BC
    const b = Math.hypot(C.x - A.x, C.y - A.y); // CA
    const c = Math.hypot(A.x - B.x, A.y - B.y); // AB

    // Diện tích theo tích có hướng
    const S = 0.5 * Math.abs((B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y));
    const P = a + b + c;

    // Trọng tâm G
    const G = {
      x: (A.x + B.x + C.x) / 3,
      y: (A.y + B.y + C.y) / 3
    };

    // Tâm đường tròn ngoại tiếp O
    const D = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
    let O = null, R = 0;
    if (Math.abs(D) > 1e-6) {
      const Ox = ((A.x*A.x + A.y*A.y) * (B.y - C.y) + (B.x*B.x + B.y*B.y) * (C.y - A.y) + (C.x*C.x + C.y*C.y) * (A.y - B.y)) / D;
      const Oy = ((A.x*A.x + A.y*A.y) * (C.x - B.x) + (B.x*B.x + B.y*B.y) * (A.x - C.x) + (C.x*C.x + C.y*C.y) * (B.x - A.x)) / D;
      O = { x: Ox, y: Oy };
      R = Math.hypot(A.x - Ox, A.y - Oy);
    }

    // Trực tâm H: quan hệ Euler OH = 3 OG => H = 3G - 2O
    let H = null;
    if (O) {
      H = {
        x: 3 * G.x - 2 * O.x,
        y: 3 * G.y - 2 * O.y
      };
    }

    // Các góc
    const angleA = (Math.acos((b*b + c*c - a*a) / (2 * b * c)) * 180 / Math.PI) || 0;
    const angleB = (Math.acos((a*a + c*c - b*b) / (2 * a * c)) * 180 / Math.PI) || 0;
    const angleC = 180 - angleA - angleB;

    return {
      sides: { a, b, c },
      angles: { A: angleA, B: angleB, C: angleC },
      area: S,
      perimeter: P,
      centroid: G,
      orthocenter: H,
      circumcenter: O ? { O, R } : null
    };
  }

  getCalculations() {
    if (this.mode === 'triangle') {
      const p = this.calcTriangleProperties();
      return {
        mode: 'triangle',
        vertices: {
          A: `(${this.triangle.A.x.toFixed(2)}, ${this.triangle.A.y.toFixed(2)})`,
          B: `(${this.triangle.B.x.toFixed(2)}, ${this.triangle.B.y.toFixed(2)})`,
          C: `(${this.triangle.C.x.toFixed(2)}, ${this.triangle.C.y.toFixed(2)})`
        },
        sides: `BC = ${p.sides.a.toFixed(2)}, CA = ${p.sides.b.toFixed(2)}, AB = ${p.sides.c.toFixed(2)}`,
        angles: `∠A = ${p.angles.A.toFixed(1)}°, ∠B = ${p.angles.B.toFixed(1)}°, ∠C = ${p.angles.C.toFixed(1)}°`,
        area: `S = ${p.area.toFixed(2)}`,
        perimeter: `P = ${p.perimeter.toFixed(2)}`,
        centroid: `G(${p.centroid.x.toFixed(2)}, ${p.centroid.y.toFixed(2)})`,
        orthocenter: p.orthocenter ? `H(${p.orthocenter.x.toFixed(2)}, ${p.orthocenter.y.toFixed(2)})` : 'N/A',
        circumcircle: p.circumcenter ? `O(${p.circumcenter.O.x.toFixed(2)}, ${p.circumcenter.O.y.toFixed(2)}), R = ${p.circumcenter.R.toFixed(2)}` : 'N/A'
      };
    } else if (this.mode === 'circle') {
      const { center, radiusPoint } = this.circle;
      const r = Math.hypot(radiusPoint.x - center.x, radiusPoint.y - center.y);
      return {
        mode: 'circle',
        center: `I(${center.x.toFixed(2)}, ${center.y.toFixed(2)})`,
        radius: `R = ${r.toFixed(2)}`,
        area: `S = ${(Math.PI * r * r).toFixed(2)}`,
        circumference: `C = ${(2 * Math.PI * r).toFixed(2)}`,
        equation: `(x - ${center.x.toFixed(1)})^2 + (y - ${center.y.toFixed(1)})^2 = ${(r * r).toFixed(2)}`
      };
    } else if (this.mode === 'vector') {
      const { u, v } = this.vectors;
      const dot = u.x * v.x + u.y * v.y;
      const lenU = Math.hypot(u.x, u.y);
      const lenV = Math.hypot(v.x, v.y);
      const angle = (Math.acos(dot / (lenU * lenV || 1)) * 180 / Math.PI) || 0;
      return {
        mode: 'vector',
        vectorU: `u = (${u.x.toFixed(1)}, ${u.y.toFixed(1)}), |u| = ${lenU.toFixed(2)}`,
        vectorV: `v = (${v.x.toFixed(1)}, ${v.y.toFixed(1)}), |v| = ${lenV.toFixed(2)}`,
        dotProduct: `u · v = ${dot.toFixed(2)}`,
        angle: `Góc (u, v) = ${angle.toFixed(1)}°`,
        sum: `u + v = (${(u.x + v.x).toFixed(1)}, ${(u.y + v.y).toFixed(1)})`
      };
    }
    return {};
  }

  // --- SỰ KIỆN TƯƠNG TÁC CHUỘT ---
  onMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = this.screenToWorld(sx, sy);

    const hitThreshold = 18 / this.scale; // 18px

    if (this.mode === 'triangle') {
      for (const [key, pt] of Object.entries(this.triangle)) {
        if (Math.hypot(world.x - pt.x, world.y - pt.y) < hitThreshold) {
          this.isDragging = true;
          this.draggedPoint = pt;
          return;
        }
      }
    } else if (this.mode === 'circle') {
      if (Math.hypot(world.x - this.circle.center.x, world.y - this.circle.center.y) < hitThreshold) {
        this.isDragging = true;
        this.draggedPoint = this.circle.center;
        return;
      }
      if (Math.hypot(world.x - this.circle.radiusPoint.x, world.y - this.circle.radiusPoint.y) < hitThreshold) {
        this.isDragging = true;
        this.draggedPoint = this.circle.radiusPoint;
        return;
      }
    } else if (this.mode === 'vector') {
      if (Math.hypot(world.x - this.vectors.u.x, world.y - this.vectors.u.y) < hitThreshold) {
        this.isDragging = true;
        this.draggedPoint = this.vectors.u;
        return;
      }
      if (Math.hypot(world.x - this.vectors.v.x, world.y - this.vectors.v.y) < hitThreshold) {
        this.isDragging = true;
        this.draggedPoint = this.vectors.v;
        return;
      }
    }
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    this.mouseWorld = this.screenToWorld(sx, sy);

    if (this.isDragging && this.draggedPoint) {
      // Snap nhẹ vào số nguyên nếu gần 0.1
      let wx = this.mouseWorld.x;
      let wy = this.mouseWorld.y;
      if (Math.abs(wx - Math.round(wx)) < 0.12) wx = Math.round(wx);
      if (Math.abs(wy - Math.round(wy)) < 0.12) wy = Math.round(wy);

      this.draggedPoint.x = Number(wx.toFixed(2));
      this.draggedPoint.y = Number(wy.toFixed(2));
      this.render();
    }
  }

  onMouseUp() {
    this.isDragging = false;
    this.draggedPoint = null;
  }

  onTouchStart(e) {
    if (e.touches.length === 1) {
      e.preventDefault();
      this.onMouseDown(e.touches[0]);
    }
  }

  onTouchMove(e) {
    if (e.touches.length === 1) {
      e.preventDefault();
      this.onMouseMove(e.touches[0]);
    }
  }

  onWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    this.scale = Math.max(20, Math.min(100, this.scale * zoomFactor));
    this.render();
  }

  setMode(mode) {
    this.mode = mode;
    this.render();
  }

  setTriangleVertex(name, x, y) {
    if (this.triangle[name]) {
      this.triangle[name].x = x;
      this.triangle[name].y = y;
      this.render();
    }
  }

  toggleTriangleOption(opt) {
    if (this.triangleOptions.hasOwnProperty(opt)) {
      this.triangleOptions[opt] = !this.triangleOptions[opt];
      this.render();
    }
  }
}
