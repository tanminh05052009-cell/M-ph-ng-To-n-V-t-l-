// Mô phỏng Vật lý Hạt nhân & Định luật Phóng xạ Nguyên tử (Lớp 12 - GDPT 2018)
export class NuclearDecaySim {
  constructor(canvasId, graphCanvasId) {
    this.canvas = document.getElementById(canvasId);
    this.graphCanvas = document.getElementById(graphCanvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.graphCtx = this.graphCanvas ? this.graphCanvas.getContext('2d') : null;

    // Cấu hình đồng vị
    this.isotopes = {
      c14: { name: 'Carbon-14 (14C)', halfLife: 5730, unit: 'năm', decayType: 'beta', daughter: 'Nitrogen-14 (14N)' },
      ra226: { name: 'Radium-226 (226Ra)', halfLife: 1600, unit: 'năm', decayType: 'alpha', daughter: 'Radon-222 (222Rn)' },
      i131: { name: 'Iodine-131 (131I)', halfLife: 8.0, unit: 'ngày', decayType: 'beta_gamma', daughter: 'Xenon-131 (131Xe)' }
    };
    this.currentIsotope = this.isotopes.c14;

    // Hạt nhân trong mạng tinh thể
    this.totalNuclei = 220;
    this.nuclei = [];
    this.emittedParticles = []; // Tia phóng xạ bay ra

    // Thời gian và thống kê
    this.timeElapsed = 0; // Đơn vị: số chu kỳ T (0 đến 4T)
    this.decayHistory = [];
    this.isRunning = true;
    this.speedFactor = 1.0;

    this.animationId = null;
    this.onUpdateCallback = null;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.reset();
    this.start();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width || 700;
    this.canvas.height = rect.height || 420;

    if (this.graphCanvas) {
      const gRect = this.graphCanvas.parentElement.getBoundingClientRect();
      this.graphCanvas.width = gRect.width || 340;
      this.graphCanvas.height = gRect.height || 220;
    }
  }

  reset() {
    this.timeElapsed = 0;
    this.decayHistory = [{ t: 0, N: this.totalNuclei }];
    this.emittedParticles = [];
    this.nuclei = [];

    const w = this.canvas.width;
    const h = this.canvas.height;
    const pad = 40;

    // Phân bố đều các hạt nhân theo mạng lưới
    const cols = 20;
    const rows = Math.ceil(this.totalNuclei / cols);
    const stepX = (w - 2 * pad) / cols;
    const stepY = (h - 2 * pad) / rows;

    for (let i = 0; i < this.totalNuclei; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      this.nuclei.push({
        x: pad + c * stepX + (Math.random() - 0.5) * 8,
        y: pad + r * stepY + (Math.random() - 0.5) * 8,
        decayed: false,
        flash: 0
      });
    }
  }

  setIsotope(key) {
    if (this.isotopes[key]) {
      this.currentIsotope = this.isotopes[key];
      this.reset();
    }
  }

  updatePhysics() {
    if (!this.isRunning) return;

    // delta t theo chu kỳ bán rã: 1 chu kỳ T tương ứng khoảng 300 frames ở tốc độ chuẩn
    const dt = (0.0035 * this.speedFactor);
    this.timeElapsed += dt;

    // Xác suất phân rã mỗi frame: P = lambda * dt = (ln 2 / T) * dt
    const lambdaDt = 0.693 * dt;

    let remainingCount = 0;

    this.nuclei.forEach(n => {
      if (!n.decayed) {
        if (Math.random() < lambdaDt) {
          n.decayed = true;
          n.flash = 1.0;

          // Bắn ra tia phóng xạ (alpha, beta, gamma)
          const angle = Math.random() * Math.PI * 2;
          const speed = 4 + Math.random() * 4;
          this.emittedParticles.push({
            x: n.x,
            y: n.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            type: this.currentIsotope.decayType,
            life: 1.0
          });
        } else {
          remainingCount++;
        }
      }

      if (n.flash > 0) n.flash -= 0.04;
    });

    // Cập nhật tia phóng xạ bay ra
    for (let i = this.emittedParticles.length - 1; i >= 0; i--) {
      const p = this.emittedParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
      if (p.life <= 0) {
        this.emittedParticles.splice(i, 1);
      }
    }

    // Ghi lại lịch sử phân rã
    if (this.decayHistory.length === 0 || this.timeElapsed - this.decayHistory[this.decayHistory.length - 1].t > 0.05) {
      this.decayHistory.push({ t: this.timeElapsed, N: remainingCount });
    }

    if (this.onUpdateCallback) {
      this.onUpdateCallback({
        isotope: this.currentIsotope,
        timeElapsed: this.timeElapsed,
        remaining: remainingCount,
        decayed: this.totalNuclei - remainingCount,
        total: this.totalNuclei,
        ratio: (remainingCount / this.totalNuclei) * 100
      });
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Vẽ các hạt nhân trong mẫu vật chất
    this.nuclei.forEach(n => {
      ctx.save();
      if (!n.decayed) {
        // Hạt nhân mẹ chưa phân rã (Xanh cyan phát sáng)
        ctx.beginPath();
        ctx.arc(n.x, n.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#00f2fe';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else {
        // Hạt nhân con đã phân rã (Tím violet)
        ctx.beginPath();
        ctx.arc(n.x, n.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#8b5cf6';
        ctx.fill();

        // Chớp sáng bùng nổ khi vừa phân rã
        if (n.flash > 0) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 16 * n.flash, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(245, 158, 11, ${n.flash * 0.7})`;
          ctx.fill();
        }
      }
      ctx.restore();
    });

    // 2. Vẽ các tia phóng xạ bay ra
    this.emittedParticles.forEach(p => {
      ctx.save();
      let color = '#f59e0b';
      let size = 3;
      if (p.type === 'alpha') {
        color = '#ef4444'; // Hạt alpha (He) nặng, màu đỏ
        size = 5;
      } else if (p.type === 'beta') {
        color = '#38bdf8'; // Hạt beta (e-) nhanh, màu lam
        size = 2.5;
      } else {
        color = '#eab308'; // Tia gamma
        size = 3;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    });

    // 3. Vẽ đồ thị phân rã phóng xạ
    if (this.graphCtx) {
      this.renderDecayGraph();
    }
  }

  renderDecayGraph() {
    const ctx = this.graphCtx;
    const w = this.graphCanvas.width;
    const h = this.graphCanvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, w, h);

    const pad = 35;
    const maxT = 4.0; // 4 chu kỳ T
    const maxN = this.totalNuclei;

    // Trục tọa độ
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad, pad / 2);
    ctx.lineTo(pad, h - pad);
    ctx.lineTo(w - 15, h - pad);
    ctx.stroke();

    // Nhãn trục
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('N', pad - 18, pad / 2 + 10);
    ctx.fillText('t (chu kỳ T)', w - 70, h - pad + 20);

    // Vạch 1T, 2T, 3T
    for (let t = 1; t <= 3; t++) {
      const gx = pad + (t / maxT) * (w - pad - 20);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(gx, pad / 2);
      ctx.lineTo(gx, h - pad);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillText(`${t}T`, gx - 6, h - pad + 15);
    }

    // 1. Đường cong lý thuyết N(t) = N0 * 2^(-t/T)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let px = 0; px <= w - pad - 20; px += 2) {
      const t = (px / (w - pad - 20)) * maxT;
      const theoN = maxN * Math.pow(2, -t);
      const x = pad + px;
      const y = (h - pad) - (theoN / maxN) * (h - pad - 20);
      if (px === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 2. Đường thực nghiệm đếm hạt thực tế (Màu Vàng cam)
    if (this.decayHistory.length > 1) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      this.decayHistory.forEach((pt, i) => {
        const x = pad + (Math.min(pt.t, maxT) / maxT) * (w - pad - 20);
        const y = (h - pad) - (pt.N / maxN) * (h - pad - 20);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
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
