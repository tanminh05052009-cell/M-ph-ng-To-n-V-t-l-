// Mô phỏng Từ trường, Hiện tượng Cảm ứng Điện từ & Lực Lorentz (Lớp 12 - GDPT 2018)
export class ElectromagnetismSim {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Chế độ mô phỏng
    this.subMode = 'faraday'; // 'faraday' (cảm ứng điện từ), 'lorentz' (lực lorentz)

    // --- DỮ LIỆU CẢM ỨNG ĐIỆN TỪ (FARADAY & LENZ) ---
    this.magnet = {
      x: 160,
      y: 200,
      width: 140,
      height: 44,
      isDragging: false,
      polarity: 'NS', // Cực N (đỏ) bên phải, S (xanh) bên trái
      vx: 0
    };

    this.coil = {
      x: 480,
      y: 200,
      turns: 6,
      radius: 65,
      width: 150
    };

    this.autoOscillate = false;
    this.autoTime = 0;

    // Đại lượng vật lý
    this.flux = 0; // Từ thông Phi (Wb)
    this.prevFlux = 0;
    this.emf = 0; // Suất điện động cảm ứng e (V)
    this.current = 0; // Cường độ dòng điện (A)
    this.resistance = 5.0; // Điện trở cuộn dây (Ohm)

    // Lịch sử sóng đồ thị
    this.waveHistory = [];
    this.maxWavePoints = 120;

    // --- DỮ LIỆU LỰC LORENTZ ---
    this.lorentz = {
      q: 1.0, // Điện tích (C hoặc e)
      m: 1.0, // Khối lượng
      v: 4.0, // Tốc độ
      B: 1.5, // Cảm ứng từ (T) hướng vuông góc vào mặt phẳng
      particles: []
    };
    this.setupLorentzParticle();

    this.animationId = null;
    this.onUpdateCallback = null;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Kéo thả nam châm
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
    this.canvas.width = rect.width || 800;
    this.canvas.height = rect.height || 500;
    this.coil.x = this.canvas.width * 0.65;
    this.coil.y = this.canvas.height * 0.45;
    this.magnet.y = this.coil.y;
  }

  setupLorentzParticle() {
    this.lorentz.particles = [];
    const r = (this.lorentz.m * this.lorentz.v) / (Math.abs(this.lorentz.q) * this.lorentz.B) * 35;
    this.lorentz.radius = r;
    this.lorentz.angle = 0;
  }

  setSubMode(mode) {
    this.subMode = mode;
    if (mode === 'lorentz') {
      this.setupLorentzParticle();
    }
  }

  toggleAutoOscillate() {
    this.autoOscillate = !this.autoOscillate;
  }

  reverseMagnetPolarity() {
    this.magnet.polarity = this.magnet.polarity === 'NS' ? 'SN' : 'NS';
  }

  updatePhysics() {
    if (this.subMode === 'faraday') {
      // Tự động dao động qua cuộn dây nếu bật
      if (this.autoOscillate && !this.magnet.isDragging) {
        this.autoTime += 0.04;
        const centerX = this.coil.x;
        const amplitude = 180;
        const oldX = this.magnet.x;
        this.magnet.x = centerX - 120 + Math.sin(this.autoTime) * amplitude;
        this.magnet.vx = this.magnet.x - oldX;
      }

      // Tính từ thông qua cuộn dây:
      // Mô hình từ trường lưỡng cực từ: B(x) tỉ lệ nghịch với khoảng cách mũ 3
      const dist = (this.magnet.x + this.magnet.width / 2) - (this.coil.x - this.coil.width / 2);
      const poleSign = this.magnet.polarity === 'NS' ? 1 : -1;
      
      // Độ lớn từ trường tại tâm cuộn dây
      const B_eff = (15000 / Math.pow(Math.abs(dist) + 70, 2.4)) * (dist < 0 ? 1 : -0.7) * poleSign;
      this.prevFlux = this.flux;
      this.flux = Number((B_eff * 0.05).toFixed(3));

      // Suất điện động cảm ứng: e = -dPhi / dt
      const dPhi = this.flux - this.prevFlux;
      this.emf = Number((-dPhi * 30).toFixed(3)); // Khuyếch đại hiển thị
      this.current = Number((this.emf / this.resistance).toFixed(3));

      // Lưu lịch sử đồ thị sóng
      this.waveHistory.push({ flux: this.flux, emf: this.emf });
      if (this.waveHistory.length > this.maxWavePoints) {
        this.waveHistory.shift();
      }

      if (this.onUpdateCallback) {
        this.onUpdateCallback({
          flux: this.flux,
          emf: this.emf,
          current: this.current,
          polarity: this.magnet.polarity
        });
      }
    } else if (this.subMode === 'lorentz') {
      // Hạt chuyển động tròn đều trong từ trường
      const omega = (Math.abs(this.lorentz.q) * this.lorentz.B) / this.lorentz.m * 0.04;
      const dir = (this.lorentz.q > 0) ? 1 : -1;
      this.lorentz.angle += omega * dir;
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (this.subMode === 'faraday') {
      this.renderFaraday();
    } else if (this.subMode === 'lorentz') {
      this.renderLorentz();
    }
  }

  // --- VẼ THÍ NGHIỆM CẢM ỨNG ĐIỆN TỪ FARADAY ---
  renderFaraday() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Vẽ các đường sức từ B của thanh nam châm
    this.drawMagneticFieldLines();

    // 2. Vẽ cuộn dây Solenoid
    this.drawCoil();

    // 3. Vẽ mạch điện với Điện kế G và Đèn LED kép
    this.drawCircuitAndMeter();

    // 4. Vẽ thanh nam châm
    this.drawMagnet();

    // 5. Vẽ đồ thị thời gian thực phía dưới góc
    this.drawMiniWaveform();
  }

  drawMagneticFieldLines() {
    const ctx = this.ctx;
    const m = this.magnet;
    const cx = m.x + m.width / 2;
    const cy = m.y + m.height / 2;

    ctx.save();
    ctx.lineWidth = 1.3;

    // Các đường cong từ trường vòm kín tỏa ra từ N vào S
    const radii = [45, 80, 130, 200];
    radii.forEach(r => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 1.5, r, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.setLineDash([6, 6]);
      ctx.stroke();

      // Mũi tên chỉ chiều đường sức từ (ra Bắc vào Nam)
      const arrowDir = this.magnet.polarity === 'NS' ? 1 : -1;
      const ax = cx;
      const ay = cy - r;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.moveTo(ax + 6 * arrowDir, ay);
      ctx.lineTo(ax - 6 * arrowDir, ay - 4);
      ctx.lineTo(ax - 6 * arrowDir, ay + 4);
      ctx.fill();
    });
    ctx.restore();
  }

  drawMagnet() {
    const ctx = this.ctx;
    const m = this.magnet;
    const halfW = m.width / 2;

    ctx.save();
    // Vòng sáng khi kéo
    if (m.isDragging) {
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 15;
    }

    const isNS = m.polarity === 'NS';
    const leftColor = isNS ? '#3b82f6' : '#ef4444'; // S (Lam) hoặc N (Đỏ)
    const rightColor = isNS ? '#ef4444' : '#3b82f6';
    const leftLabel = isNS ? 'S (Nam)' : 'N (Bắc)';
    const rightLabel = isNS ? 'N (Bắc)' : 'S (Nam)';

    // Nửa bên trái
    ctx.fillStyle = leftColor;
    ctx.beginPath();
    ctx.roundRect(m.x, m.y, halfW, m.height, [8, 0, 0, 8]);
    ctx.fill();

    // Nửa bên phải
    ctx.fillStyle = rightColor;
    ctx.beginPath();
    ctx.roundRect(m.x + halfW, m.y, halfW, m.height, [0, 8, 8, 0]);
    ctx.fill();

    // Viền kim loại
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Chữ nhãn cực N / S
    ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(leftLabel, m.x + halfW / 2, m.y + m.height / 2);
    ctx.fillText(rightLabel, m.x + halfW * 1.5, m.y + m.height / 2);

    // Gợi ý kéo nam châm
    ctx.font = '11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('⟷ Kéo rê hoặc bật Tự động', m.x + halfW, m.y - 12);
    ctx.restore();
  }

  drawCoil() {
    const ctx = this.ctx;
    const c = this.coil;
    const turns = c.turns;
    const turnSpacing = c.width / turns;

    ctx.save();
    // Lõi cuộn dây (trụ rỗng trong suốt)
    ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
    ctx.fillRect(c.x - c.width / 2, c.y - c.radius, c.width, c.radius * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(c.x - c.width / 2, c.y - c.radius, c.width, c.radius * 2);

    // Các vòng dây đồng
    for (let i = 0; i < turns; i++) {
      const loopX = c.x - c.width / 2 + i * turnSpacing + turnSpacing / 2;

      // Nửa sau cuộn dây (nét đứt hoặc mờ)
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(loopX, c.y, turnSpacing * 0.45, c.radius, 0, Math.PI / 2, Math.PI * 1.5);
      ctx.stroke();

      // Nửa trước cuộn dây (đồng sáng bóng)
      const loopGrad = ctx.createLinearGradient(loopX, c.y - c.radius, loopX, c.y + c.radius);
      loopGrad.addColorStop(0, '#f59e0b');
      loopGrad.addColorStop(0.5, '#fef08a');
      loopGrad.addColorStop(1, '#b45309');
      ctx.strokeStyle = loopGrad;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(loopX, c.y, turnSpacing * 0.45, c.radius, 0, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      // Mũi tên chỉ chiều dòng điện cảm ứng nếu đang có dòng
      if (Math.abs(this.current) > 0.05) {
        const arrowDir = this.current > 0 ? 1 : -1;
        ctx.fillStyle = '#00f2fe';
        ctx.beginPath();
        const ay = c.y - c.radius + 10;
        ctx.arc(loopX, ay, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.textAlign = 'center';
    ctx.fillText('Cuộn dây Solenoid', c.x, c.y - c.radius - 14);
    ctx.restore();
  }

  drawCircuitAndMeter() {
    const ctx = this.ctx;
    const c = this.coil;
    const circuitY = c.y + c.radius + 70;
    const meterX = c.x;

    ctx.save();
    // Dây dẫn nối từ 2 đầu cuộn dây xuống điện kế
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    // Dây bên trái
    ctx.moveTo(c.x - c.width / 2, c.y + c.radius);
    ctx.lineTo(c.x - c.width / 2, circuitY);
    ctx.lineTo(meterX - 60, circuitY);

    // Dây bên phải
    ctx.moveTo(c.x + c.width / 2, c.y + c.radius);
    ctx.lineTo(c.x + c.width / 2, circuitY);
    ctx.lineTo(meterX + 60, circuitY);
    ctx.stroke();

    // 1. Điện kế G (Galvanometer)
    const meterR = 45;
    ctx.beginPath();
    ctx.arc(meterX, circuitY, meterR, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // Mặt số và vạch chia điện kế
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('G', meterX, circuitY - 18);
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText('-I', meterX - 25, circuitY - 6);
    ctx.fillText('0', meterX, circuitY - 26);
    ctx.fillText('+I', meterX + 25, circuitY - 6);

    // Kim điện kế xoay theo cường độ dòng điện
    // current = [-1.5, 1.5] -> angle = [-0.6 rad, 0.6 rad]
    const maxI = 1.0;
    const needleAngle = -Math.PI / 2 + Math.max(-0.7, Math.min(0.7, (this.current / maxI) * 0.7));

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(meterX, circuitY + 10);
    ctx.lineTo(meterX + Math.cos(needleAngle) * (meterR - 8), circuitY + 10 + Math.sin(needleAngle) * (meterR - 8));
    ctx.stroke();

    // Chốt trục kim
    ctx.beginPath();
    ctx.arc(meterX, circuitY + 10, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 2. Bóng đèn LED kép (Sáng theo chiều dòng điện)
    const ledX = meterX + 110;
    const ledY = circuitY;

    // Đèn LED
    const isLit = Math.abs(this.current) > 0.08;
    const ledColor = this.current > 0 ? '#10b981' : (this.current < -0.08 ? '#f43f5e' : '#475569');

    ctx.save();
    if (isLit) {
      ctx.shadowColor = ledColor;
      ctx.shadowBlur = 20;
    }
    ctx.beginPath();
    ctx.arc(ledX, ledY, 14, 0, Math.PI * 2);
    ctx.fillStyle = ledColor;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.font = '11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = isLit ? '#ffffff' : '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText(isLit ? '💡 LED SÁNG' : 'LED', ledX, ledY + 28);
    ctx.restore();
  }

  drawMiniWaveform() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const boxW = 240;
    const boxH = 90;
    const boxX = w - boxW - 20;
    const boxY = 20;

    ctx.save();
    // Nền hộp đồ thị
    ctx.fillStyle = 'rgba(11, 15, 25, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 10);
    ctx.fill();
    ctx.stroke();

    // Tiêu đề
    ctx.font = '10px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('ĐỒ THỊ TỪ THÔNG Φ & SUẤT ĐIỆN ĐỘNG e_c', boxX + 12, boxY + 16);

    // Trục giữa 0
    const midY = boxY + boxH * 0.6;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(boxX + 10, midY);
    ctx.lineTo(boxX + boxW - 10, midY);
    ctx.stroke();

    if (this.waveHistory.length > 1) {
      const step = (boxW - 24) / this.maxWavePoints;

      // Đường e_c (vàng cam)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      this.waveHistory.forEach((pt, i) => {
        const x = boxX + 12 + i * step;
        const y = midY - pt.emf * 25;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
    ctx.restore();
  }

  // --- MÔ PHỎNG LỰC LORENTZ ---
  renderLorentz() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w * 0.5;
    const cy = h * 0.5;

    // 1. Vẽ vùng từ trường đều B (ký hiệu dấu x - đâm vuông góc vào mặt phẳng)
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(w * 0.15, h * 0.1, w * 0.7, h * 0.8);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(w * 0.15, h * 0.1, w * 0.7, h * 0.8);

    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.textAlign = 'center';
    for (let x = w * 0.2; x <= w * 0.8; x += 40) {
      for (let y = h * 0.18; y <= h * 0.82; y += 40) {
        ctx.fillText('⊗', x, y);
      }
    }

    ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`Vùng từ trường đều B = ${this.lorentz.B} T (hướng đâm vào)`, cx, h * 0.15);

    // 2. Quỹ đạo chuyển động tròn bán kính R
    const R = (this.lorentz.m * this.lorentz.v) / (Math.abs(this.lorentz.q) * this.lorentz.B) * 35;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Vị trí hạt mang điện
    const angle = this.lorentz.angle;
    const px = cx + Math.cos(angle) * R;
    const py = cy + Math.sin(angle) * R;

    // Hạt
    const particleColor = this.lorentz.q > 0 ? '#ef4444' : '#3b82f6';
    ctx.beginPath();
    ctx.arc(px, py, 10, 0, Math.PI * 2);
    ctx.fillStyle = particleColor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Dấu hạt (+ / -)
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.lorentz.q > 0 ? '+' : '−', px, py);

    // Vector Lực Lorentz F hướng tâm (Màu vàng)
    const fx = cx - px;
    const fy = cy - py;
    const fLen = Math.hypot(fx, fy);
    const arrowLen = 45;
    const fNormX = (fx / fLen) * arrowLen;
    const fNormY = (fy / fLen) * arrowLen;

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + fNormX, py + fNormY);
    ctx.stroke();

    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('F_L', px + fNormX * 1.2, py + fNormY * 1.2);

    // Vector Vận tốc v tiếp tuyến (Màu xanh lục)
    const vx = -Math.sin(angle) * arrowLen * (this.lorentz.q > 0 ? 1 : -1);
    const vy = Math.cos(angle) * arrowLen * (this.lorentz.q > 0 ? 1 : -1);

    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + vx, py + vy);
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.fillText('v', px + vx * 1.2, py + vy * 1.2);

    // Chú thích bán kính
    ctx.font = '13px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`Bán kính quỹ đạo: R = mv / (|q|B) = ${( (this.lorentz.m * this.lorentz.v) / (Math.abs(this.lorentz.q) * this.lorentz.B) ).toFixed(2)} m`, w * 0.18, h * 0.86);
    ctx.restore();
  }

  // --- XỬ LÝ CHUỘT ---
  onMouseDown(e) {
    if (this.subMode !== 'faraday') return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const m = this.magnet;

    if (mx >= m.x && mx <= m.x + m.width && my >= m.y && my <= m.y + m.height) {
      m.isDragging = true;
      this.autoOscillate = false;
      this.dragStartX = mx - m.x;
    }
  }

  onMouseMove(e) {
    if (!this.magnet.isDragging) return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const oldX = this.magnet.x;

    this.magnet.x = Math.max(20, Math.min(this.canvas.width - this.magnet.width - 20, mx - this.dragStartX));
    this.magnet.vx = this.magnet.x - oldX;
  }

  onMouseUp() {
    this.magnet.isDragging = false;
    this.magnet.vx = 0;
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
