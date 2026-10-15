// Mô phỏng Vật lý Nhiệt & Thuyết Động học Phân tử Chất Khí (Lớp 12 - GDPT 2018)
export class GasThermodynamicsSim {
  constructor(canvasId, graphCanvasId) {
    this.canvas = document.getElementById(canvasId);
    this.graphCanvas = document.getElementById(graphCanvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.graphCtx = this.graphCanvas ? this.graphCanvas.getContext('2d') : null;

    // Tham số nhiệt động học:
    this.T = 300; // Nhiệt độ (Kelvin)
    this.V = 5.0; // Thể tích (Lít), tương ứng với vị trí piston
    this.n = 1.0; // Số mol khí
    this.R = 0.0821; // Hằng số khí lý tưởng (L·atm / mol·K)
    this.P = 0; // Áp suất (atm)

    // Chế độ biến đổi trạng thái:
    this.processMode = 'free'; // 'free', 'isothermal' (đẳng nhiệt), 'isobaric' (đẳng áp), 'isochoric' (đẳng tích)

    // Phân tử khí
    this.particleCount = 90;
    this.particles = [];
    this.showVelocities = true;
    this.showCollisionGlow = true;

    // Piston
    this.isDraggingPiston = false;
    this.pistonMinX = 0.2; // Tỷ lệ chiều rộng
    this.pistonMaxX = 0.88;
    this.pistonXRatio = 0.55; // Vị trí hiện tại

    // Lịch sử đồ thị p-V-T
    this.history = [];
    this.maxHistory = 150;

    // Nguồn nhiệt (Lửa / Băng)
    this.heatSource = 0; // -1: làm lạnh, 0: bình thường, 1: đốt nóng

    this.animationId = null;
    this.onUpdateCallback = null;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.setupParticles();
    this.calculatePressure();

    // Sự kiện chuột kéo piston
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', () => this.onMouseUp());

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        this.onMouseDown(e.touches[0]);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        this.onMouseMove(e.touches[0]);
      }
    }, { passive: false });

    this.start();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width || 700;
    this.canvas.height = rect.height || 420;

    if (this.graphCanvas) {
      const gRect = this.graphCanvas.parentElement.getBoundingClientRect();
      this.graphCanvas.width = gRect.width || 320;
      this.graphCanvas.height = gRect.height || 220;
    }
  }

  setupParticles() {
    this.particles = [];
    const chamber = this.getChamberBounds();

    for (let i = 0; i < this.particleCount; i++) {
      const speed = Math.sqrt(this.T / 300) * (2.0 + Math.random() * 2.5);
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        x: chamber.left + Math.random() * (chamber.right - chamber.left - 10),
        y: chamber.top + Math.random() * (chamber.bottom - chamber.top - 10),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3.5,
        glow: 0
      });
    }
  }

  getChamberBounds() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const top = h * 0.18;
    const bottom = h * 0.78;
    const left = w * 0.08;
    const right = left + (w * 0.78) * this.pistonXRatio;
    return { left, right, top, bottom, width: right - left, height: bottom - top };
  }

  calculatePressure() {
    // p = (n * R * T) / V
    // Chuẩn hóa V từ 1L đến 10L dựa trên vị trí piston
    this.V = Number((1.5 + this.pistonXRatio * 8.5).toFixed(2));
    this.P = Number(((this.n * this.R * this.T) / (this.V * 0.1)).toFixed(2)); // atm

    this.history.push({ p: this.P, v: this.V, t: this.T });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  setTemperature(tempK) {
    this.T = Math.max(100, Math.min(800, tempK));

    // Nếu đang ở chế độ đẳng áp, thể tích phải tự dãn nở: V tỉ lệ với T
    if (this.processMode === 'isobaric') {
      const newV = (this.n * this.R * this.T) / (this.P * 0.1);
      const newRatio = (newV - 1.5) / 8.5;
      this.pistonXRatio = Math.max(this.pistonMinX, Math.min(this.pistonMaxX, newRatio));
    }

    // Cập nhật tốc độ phân tử theo sqrt(T)
    const factor = Math.sqrt(this.T / 300);
    this.particles.forEach(p => {
      const currentSpeed = Math.hypot(p.vx, p.vy) || 1;
      const targetSpeed = factor * (2.0 + Math.random() * 2.0);
      p.vx = (p.vx / currentSpeed) * targetSpeed;
      p.vy = (p.vy / currentSpeed) * targetSpeed;
    });

    this.calculatePressure();
  }

  setPistonVolume(volLiters) {
    const ratio = (volLiters - 1.5) / 8.5;
    this.pistonXRatio = Math.max(this.pistonMinX, Math.min(this.pistonMaxX, ratio));

    // Nếu đẳng nhiệt: T giữ nguyên, P thay đổi
    // Nếu đẳng áp: T phải thay đổi tương ứng
    if (this.processMode === 'isobaric') {
      this.T = Math.round((this.P * 0.1 * volLiters) / (this.n * this.R));
    }

    this.calculatePressure();
  }

  setProcessMode(mode) {
    this.processMode = mode;
  }

  setHeatSource(source) {
    this.heatSource = source; // -1: lạnh, 0: tắt, 1: nóng
  }

  updatePhysics() {
    // Xử lý nguồn nhiệt liên tục
    if (this.heatSource !== 0) {
      const deltaT = this.heatSource * 1.5;
      this.setTemperature(this.T + deltaT);
    }

    const chamber = this.getChamberBounds();

    // Cập nhật vị trí các phân tử khí
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      // Va chạm thành trái
      if (p.x - p.radius < chamber.left) {
        p.x = chamber.left + p.radius;
        p.vx = -p.vx;
        p.glow = 1.0;
      }
      // Va chạm piston bên phải
      if (p.x + p.radius > chamber.right) {
        p.x = chamber.right - p.radius;
        p.vx = -p.vx;
        p.glow = 1.0;
      }
      // Va chạm thành trên
      if (p.y - p.radius < chamber.top) {
        p.y = chamber.top + p.radius;
        p.vy = -p.vy;
        p.glow = 1.0;
      }
      // Va chạm thành dưới
      if (p.y + p.radius > chamber.bottom) {
        p.y = chamber.bottom - p.radius;
        p.vy = -p.vy;
        p.glow = 1.0;
      }

      // Giảm dần độ sáng va chạm
      if (p.glow > 0) p.glow -= 0.05;
    });

    if (this.onUpdateCallback) {
      this.onUpdateCallback({
        T: this.T,
        V: this.V,
        P: this.P,
        process: this.processMode
      });
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const chamber = this.getChamberBounds();

    ctx.clearRect(0, 0, w, h);

    // 1. Vẽ thân xi-lanh bằng kim loại thủy tinh công nghệ cao
    ctx.save();
    // Vùng chứa khí
    const gasGradient = ctx.createLinearGradient(chamber.left, chamber.top, chamber.right, chamber.bottom);
    if (this.T > 450) {
      gasGradient.addColorStop(0, 'rgba(239, 68, 68, 0.12)');
      gasGradient.addColorStop(1, 'rgba(245, 158, 11, 0.08)');
    } else if (this.T < 220) {
      gasGradient.addColorStop(0, 'rgba(56, 189, 248, 0.14)');
      gasGradient.addColorStop(1, 'rgba(99, 102, 241, 0.08)');
    } else {
      gasGradient.addColorStop(0, 'rgba(16, 185, 129, 0.08)');
      gasGradient.addColorStop(1, 'rgba(6, 182, 212, 0.05)');
    }

    ctx.fillStyle = gasGradient;
    ctx.fillRect(chamber.left, chamber.top, chamber.width, chamber.height);

    // Thành xi-lanh
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 6;
    ctx.beginPath();
    // Thành trên
    ctx.moveTo(w * 0.9, chamber.top);
    ctx.lineTo(chamber.left, chamber.top);
    // Thành trái
    ctx.lineTo(chamber.left, chamber.bottom);
    // Thành dưới
    ctx.lineTo(w * 0.9, chamber.bottom);
    ctx.stroke();

    // Vạch đo thể tích dọc đáy xi-lanh
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'center';

    for (let v = 2; v <= 10; v += 2) {
      const ratio = (v - 1.5) / 8.5;
      const tickX = chamber.left + (w * 0.78) * ratio;
      if (tickX < w * 0.88) {
        ctx.beginPath();
        ctx.moveTo(tickX, chamber.bottom);
        ctx.lineTo(tickX, chamber.bottom + 8);
        ctx.stroke();
        ctx.fillText(`${v}L`, tickX, chamber.bottom + 20);
      }
    }
    ctx.restore();

    // 2. Vẽ piston và thanh truyền
    ctx.save();
    const pistonWidth = 18;
    const pistonX = chamber.right;

    // Mặt piston
    const pistonGrad = ctx.createLinearGradient(pistonX, chamber.top, pistonX + pistonWidth, chamber.bottom);
    pistonGrad.addColorStop(0, '#94a3b8');
    pistonGrad.addColorStop(0.5, '#f8fafc');
    pistonGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = pistonGrad;
    ctx.fillRect(pistonX, chamber.top, pistonWidth, chamber.height);

    // Thanh truyền piston
    ctx.fillStyle = '#64748b';
    ctx.fillRect(pistonX + pistonWidth, (chamber.top + chamber.bottom) / 2 - 8, w - (pistonX + pistonWidth), 16);

    // Tay nắm piston
    ctx.fillStyle = '#00f2fe';
    ctx.beginPath();
    ctx.roundRect(pistonX + pistonWidth + 12, (chamber.top + chamber.bottom) / 2 - 20, 16, 40, 6);
    ctx.fill();

    // Nhãn kéo
    ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('KÉO PISTON', pistonX + 10, chamber.top - 12);
    ctx.restore();

    // 3. Vẽ các phân tử khí (hạt)
    this.particles.forEach(p => {
      // Giới hạn trong buồng
      if (p.x > chamber.right) p.x = chamber.right - p.radius;

      ctx.save();
      const speed = Math.hypot(p.vx, p.vy);
      // Màu theo nhiệt độ / vận tốc
      let color = '#38bdf8'; // Vừa
      if (speed > 4.5) color = '#f43f5e'; // Nhanh / nóng
      else if (speed < 2.0) color = '#818cf8'; // Chậm / lạnh

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Hiệu ứng phát sáng khi va chạm
      if (p.glow > 0 && this.showCollisionGlow) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + 6 * p.glow, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.glow * 0.4})`;
        ctx.fill();
      }

      // Vector vận tốc
      if (this.showVelocities) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 3.5, p.y + p.vy * 3.5);
        ctx.stroke();
      }
      ctx.restore();
    });

    // 4. Vẽ ngọn lửa / đá lạnh dưới đáy
    this.drawThermodynamicSource(chamber);

    // 5. Vẽ đồng hồ áp suất (Pressure Gauge) gắn trên nóc xi-lanh
    this.drawPressureGauge(chamber.left + chamber.width * 0.4, chamber.top);

    // 6. Vẽ đồ thị thời gian thực (nếu có canvas đồ thị)
    if (this.graphCtx) {
      this.renderGraph();
    }
  }

  drawPressureGauge(x, y) {
    const ctx = this.ctx;
    const r = 36;
    const gaugeY = y - r - 22;

    ctx.save();
    // Ống nối
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, gaugeY + r);
    ctx.stroke();

    // Vỏ đồng hồ
    ctx.beginPath();
    ctx.arc(x, gaugeY, r, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#00f2fe';
    ctx.stroke();

    // Vạch đồng hồ
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const angle = Math.PI * 0.75 + (i / 7) * Math.PI * 1.5;
      const x1 = x + Math.cos(angle) * (r - 4);
      const y1 = gaugeY + Math.sin(angle) * (r - 4);
      const x2 = x + Math.cos(angle) * (r - 10);
      const y2 = gaugeY + Math.sin(angle) * (r - 10);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Kim đo áp suất
    // max áp suất = 10 atm
    const maxP = 8.0;
    const normP = Math.min(1.0, this.P / maxP);
    const needleAngle = Math.PI * 0.75 + normP * Math.PI * 1.5;

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, gaugeY);
    ctx.lineTo(x + Math.cos(needleAngle) * (r - 8), gaugeY + Math.sin(needleAngle) * (r - 8));
    ctx.stroke();

    // Chốt giữa
    ctx.beginPath();
    ctx.arc(x, gaugeY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Số đo
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.P} atm`, x, gaugeY + r + 14);
    ctx.restore();
  }

  drawThermodynamicSource(chamber) {
    const ctx = this.ctx;
    const cx = chamber.left + chamber.width * 0.45;
    const cy = chamber.bottom + 25;

    ctx.save();
    if (this.heatSource > 0) {
      // Ngọn lửa đốt nóng
      for (let i = -2; i <= 2; i++) {
        const fx = cx + i * 22;
        const fy = cy;
        const h = 25 + Math.sin(Date.now() * 0.01 + i) * 8;

        const flameGrad = ctx.createRadialGradient(fx, fy, 2, fx, fy - h * 0.6, h);
        flameGrad.addColorStop(0, '#ffffff');
        flameGrad.addColorStop(0.3, '#f59e0b');
        flameGrad.addColorStop(0.8, '#ef4444');
        flameGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(fx - 10, fy);
        ctx.quadraticCurveTo(fx - 12, fy - h * 0.7, fx, fy - h);
        ctx.quadraticCurveTo(fx + 12, fy - h * 0.7, fx + 10, fy);
        ctx.closePath();
        ctx.fill();
      }
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#f97316';
      ctx.textAlign = 'center';
      ctx.fillText(`🔥 Đang nung nóng (${this.T} K)`, cx, cy + 24);
    } else if (this.heatSource < 0) {
      // Tảng băng làm lạnh
      ctx.fillStyle = '#38bdf8';
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.roundRect(cx + i * 24 - 10, cy - 14, 20, 14, 4);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.fill();
        ctx.strokeStyle = '#00f2fe';
        ctx.stroke();
      }
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText(`❄️ Đang làm lạnh (${this.T} K)`, cx, cy + 24);
    } else {
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.textAlign = 'center';
      ctx.fillText(`Nhiệt độ hiện tại: ${this.T} K (${(this.T - 273.15).toFixed(1)}°C)`, cx, cy + 20);
    }
    ctx.restore();
  }

  renderGraph() {
    const ctx = this.graphCtx;
    const w = this.graphCanvas.width;
    const h = this.graphCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Nền
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, w, h);

    // Trục đồ thị (p-V hoặc V-T hoặc p-T)
    const pad = 35;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad, pad / 2);
    ctx.lineTo(pad, h - pad);
    ctx.lineTo(w - pad / 2, h - pad);
    ctx.stroke();

    // Nhãn trục
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f2fe';
    ctx.fillText('p (atm)', pad + 4, pad / 2 + 10);
    ctx.fillText('V (L)', w - pad, h - pad - 6);

    // Vẽ các điểm lịch sử
    if (this.history.length > 1) {
      ctx.beginPath();
      const maxV = 10, maxP = 6;

      this.history.forEach((pt, idx) => {
        const x = pad + (pt.v / maxV) * (w - 1.5 * pad);
        const y = (h - pad) - (pt.p / maxP) * (h - 1.5 * pad);

        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Điểm hiện tại
      const last = this.history[this.history.length - 1];
      const curX = pad + (last.v / maxV) * (w - 1.5 * pad);
      const curY = (h - pad) - (last.p / maxP) * (h - 1.5 * pad);

      ctx.beginPath();
      ctx.arc(curX, curY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    }
  }

  onMouseDown(e) {
    if (this.processMode === 'isochoric') return; // Đẳng tích khóa piston
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const chamber = this.getChamberBounds();

    if (Math.abs(sx - chamber.right) < 30) {
      this.isDraggingPiston = true;
    }
  }

  onMouseMove(e) {
    if (!this.isDraggingPiston || this.processMode === 'isochoric') return;
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const w = this.canvas.width;
    const left = w * 0.08;
    const totalW = w * 0.78;

    const newRatio = (sx - left) / totalW;
    this.pistonXRatio = Math.max(this.pistonMinX, Math.min(this.pistonMaxX, newRatio));
    this.calculatePressure();
  }

  onMouseUp() {
    this.isDraggingPiston = false;
  }

  start() {
    const loop = () => {
      this.updatePhysics();
      this.render();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
