// Bộ phân tích ngôn ngữ tự nhiên đề bài Toán hình học & Nhận diện hình ảnh (NLP & Smart Geometry Parser)
import { SAMPLE_PROBLEMS } from './sampleProblems.js';

export class GeometryProblemParser {
  constructor() {
    this.sampleProblems = SAMPLE_PROBLEMS;
  }

  // Phân tích văn bản đề bài hình học tiếng Việt
  parseText(rawText) {
    if (!rawText || typeof rawText !== 'string') {
      return this.getDefaultPyramid();
    }

    const text = rawText.trim().toLowerCase();

    // 1. Kiểm tra đối chiếu với kho đề mẫu trước (nếu trùng tiêu đề hoặc tương tự)
    for (const sample of this.sampleProblems) {
      if (text.includes(sample.title.toLowerCase()) || 
          (sample.parsed.name && text.includes(sample.parsed.name.toLowerCase()))) {
        return JSON.parse(JSON.stringify(sample.parsed));
      }
    }

    // 2. Tự động bóc tách tham số và phân loại hình học:
    
    // --- DẠNG 1: HÌNH CHÓP (S.ABCD, S.ABC, Chóp tứ giác, Chóp tam giác) ---
    if (text.includes("chóp") || text.includes("chop") || text.includes("s.abcd") || text.includes("s.abc")) {
      const isTriangular = text.includes("tam giác") || text.includes("s.abc");
      const isSquare = text.includes("vuông") || text.includes("hcn") || text.includes("chữ nhật");
      const isRegular = text.includes("đều") || text.includes("deu");
      const saPerp = text.includes("sa vuông") || text.includes("sa vuông góc") || text.includes("sa ⊥");

      // Trích xuất số đo
      const aMatch = text.match(/(?:cạnh|đáy|cạnh đáy|ab|a)\s*(?:=|bằng)?\s*([0-9]+(?:\.[0-9]+)?)/i);
      const hMatch = text.match(/(?:sa|chiều cao|so|h)\s*(?:=|bằng)?\s*([0-9]+(?:\.[0-9]+)?)/i);
      
      const a = aMatch ? parseFloat(aMatch[1]) : 4;
      const h = hMatch ? parseFloat(hMatch[1]) : 5;

      if (isTriangular) {
        if (isRegular) {
          return this.buildRegularTetrahedron(a, h);
        } else {
          return this.buildPyramidTriangleSA(a, h);
        }
      } else {
        // Chóp tứ giác
        if (isRegular && !saPerp) {
          return this.buildRegularSquarePyramid(a, h);
        } else {
          return this.buildPyramidSquareSA(a, h);
        }
      }
    }

    // --- DẠNG 2: LĂNG TRỤ (Lăng trụ tam giác, ABC.A'B'C') ---
    if (text.includes("lăng trụ") || text.includes("lang tru") || text.includes("abc.a'b'c'") || text.includes("abc.a1b1c1")) {
      const aMatch = text.match(/(?:ab|cạnh đáy|a)\s*(?:=|bằng)?\s*([0-9]+(?:\.[0-9]+)?)/i);
      const bMatch = text.match(/(?:ac|b)\s*(?:=|bằng)?\s*([0-9]+(?:\.[0-9]+)?)/i);
      const hMatch = text.match(/(?:aa'|chiều cao|cạnh bên|h)\s*(?:=|bằng)?\s*([0-9]+(?:\.[0-9]+)?)/i);

      const ab = aMatch ? parseFloat(aMatch[1]) : 3;
      const ac = bMatch ? parseFloat(bMatch[1]) : 4;
      const h = hMatch ? parseFloat(hMatch[1]) : 6;

      return this.buildPrismTriangular(ab, ac, h);
    }

    // --- DẠNG 3: HÌNH LẬP PHƯƠNG & HÌNH HỘP CHỮ NHẬT ---
    if (text.includes("lập phương") || text.includes("lap phuong") || text.includes("khối lập phương")) {
      const aMatch = text.match(/(?:cạnh|a)\s*(?:=|bằng)?\s*([0-9]+(?:\.[0-9]+)?)/i);
      const a = aMatch ? parseFloat(aMatch[1]) : 4;
      return this.buildCube(a);
    }

    if (text.includes("hộp chữ nhật") || text.includes("hop chu nhat")) {
      const aMatch = text.match(/(?:ab|dài)\s*(?:=|bằng)?\s*([0-9]+(?:\.[0-9]+)?)/i);
      const bMatch = text.match(/(?:ad|rộng)\s*(?:=|bằng)?\s*([0-9]+(?:\.[0-9]+)?)/i);
      const cMatch = text.match(/(?:aa'|cao|h)\s*(?:=|bằng)?\s*([0-9]+(?:\.[0-9]+)?)/i);
      const a = aMatch ? parseFloat(aMatch[1]) : 4;
      const b = bMatch ? parseFloat(bMatch[1]) : 3;
      const c = cMatch ? parseFloat(cMatch[1]) : 5;
      return this.buildBox(a, b, c);
    }

    // --- DẠNG 4: HÌNH NÓN (Cone) ---
    if (text.includes("hình nón") || text.includes("hinh non") || text.includes("khối nón")) {
      const rMatch = text.match(/(?:bán kính|r)\s*(?:=|bằng)?\s*([0-9]+(?:\.[0-9]+)?)/i);
      const hMatch = text.match(/(?:chiều cao|h|so)\s*(?:=|bằng)?\s*([0-9]+(?:\.[0-9]+)?)/i);
      const r = rMatch ? parseFloat(rMatch[1]) : 3;
      const h = hMatch ? parseFloat(hMatch[1]) : 4;
      return this.buildCone(r, h);
    }

    // --- DẠNG 5: HÌNH TRỤ (Cylinder) ---
    if (text.includes("hình trụ") || text.includes("hinh tru") || text.includes("khối trụ")) {
      const rMatch = text.match(/(?:bán kính|r)\s*(?:=|bằng)?\s*([0-9]+(?:\.[0-9]+)?)/i);
      const hMatch = text.match(/(?:chiều cao|h|oo')\s*(?:=|bằng)?\s*([0-9]+(?:\.[0-9]+)?)/i);
      const r = rMatch ? parseFloat(rMatch[1]) : 3;
      const h = hMatch ? parseFloat(hMatch[1]) : 5;
      return this.buildCylinder(r, h);
    }

    // --- DẠNG 6: HÌNH CẦU (Sphere) ---
    if (text.includes("hình cầu") || text.includes("hinh cau") || text.includes("mặt cầu")) {
      const rMatch = text.match(/(?:bán kính|r)\s*(?:=|bằng)?\s*([0-9]+(?:\.[0-9]+)?)/i);
      const r = rMatch ? parseFloat(rMatch[1]) : 3.5;
      return this.buildSphere(r);
    }

    // --- DẠNG 7: HÌNH HỌC PHẲNG 2D (Oxy Tam giác, Đường tròn) ---
    if (text.includes("mặt phẳng") || text.includes("oxy") || (text.includes("tam giác") && !text.includes("chóp"))) {
      // Tìm tọa độ A(x, y), B(x, y), C(x, y)
      const coordRegex = /([a-z])\s*\(\s*(-?[0-9]+(?:\.[0-9]+)?)\s*[,;]\s*(-?[0-9]+(?:\.[0-9]+)?)\s*\)/gi;
      let match;
      const points = {};
      while ((match = coordRegex.exec(rawText)) !== null) {
        const name = match[1].toUpperCase();
        points[name] = [parseFloat(match[2]), parseFloat(match[3])];
      }

      if (points.A && points.B && points.C) {
        return this.build2DTriangle(points.A, points.B, points.C);
      }
    }

    // Mặc định: Chóp S.ABCD
    return this.buildPyramidSquareSA(4, 5);
  }

  // --- CÁC HÀM DỰNG MÔ HÌNH HÌNH HỌC CHUẨN ---

  buildPyramidSquareSA(a = 4, h = 5) {
    return {
      type: "pyramid_sa_square",
      name: `Hình chóp S.ABCD (SA ⊥ đáy, a=${a}, h=${h})`,
      baseType: "square",
      altitudeType: "sa_perp",
      params: { a, h },
      vertices: {
        A: [0, 0, 0],
        B: [a, 0, 0],
        C: [a, a, 0],
        D: [0, a, 0],
        S: [0, 0, h],
        H: [Number((a * h * h / (a * a + h * h)).toFixed(2)), 0, Number((h * a * a / (a * a + h * h)).toFixed(2))]
      },
      edges: [
        { from: "A", to: "B", type: "solid" },
        { from: "B", to: "C", type: "solid" },
        { from: "C", to: "D", type: "solid" },
        { from: "D", to: "A", type: "dashed" },
        { from: "S", to: "A", type: "dashed", label: `SA=${h}` },
        { from: "S", to: "B", type: "solid" },
        { from: "S", to: "C", type: "solid" },
        { from: "S", to: "D", type: "solid" },
        { from: "A", to: "C", type: "dashed" },
        { from: "B", to: "D", type: "dashed" },
        { from: "A", to: "H", type: "accent", label: "AH ⊥ SB" }
      ],
      faces: [
        ["A", "B", "C", "D"],
        ["S", "A", "B"],
        ["S", "B", "C"],
        ["S", "C", "D"],
        ["S", "D", "A"]
      ],
      solutionSummary: {
        volume: `V = \\frac{1}{3} a^2 h = \\frac{1}{3} \\cdot ${a * a} \\cdot ${h} = ${( (a * a * h) / 3 ).toFixed(2)}`,
        baseArea: `S_{đáy} = a^2 = ${a * a}`,
        height: `SA = ${h}`,
        specialAngles: `Góc (SB, đáy) = \\widehat{SBA} = ${(Math.atan2(h, a) * 180 / Math.PI).toFixed(1)}^\\circ`,
        distance: `d(A, (SBC)) = AH = \\frac{SA \\cdot AB}{\\sqrt{SA^2 + AB^2}} = ${( (a * h) / Math.sqrt(a * a + h * h) ).toFixed(2)}`
      }
    };
  }

  buildRegularSquarePyramid(a = 4, h = 5) {
    const half = a / 2;
    return {
      type: "pyramid_regular_square",
      name: `Chóp tứ giác đều S.ABCD (cạnh đáy=${a}, SO=${h})`,
      baseType: "square",
      altitudeType: "center_so",
      params: { a, h },
      vertices: {
        A: [-half, -half, 0],
        B: [half, -half, 0],
        C: [half, half, 0],
        D: [-half, half, 0],
        O: [0, 0, 0],
        S: [0, 0, h],
        M: [0, half, 0]
      },
      edges: [
        { from: "A", to: "B", type: "solid" },
        { from: "B", to: "C", type: "solid" },
        { from: "C", to: "D", type: "dashed" },
        { from: "D", to: "A", type: "dashed" },
        { from: "S", to: "A", type: "solid" },
        { from: "S", to: "B", type: "solid" },
        { from: "S", to: "C", type: "solid" },
        { from: "S", to: "D", type: "dashed" },
        { from: "S", to: "O", type: "dashed", label: `SO=${h}` },
        { from: "S", to: "M", type: "accent", label: "SM" },
        { from: "O", to: "M", type: "dashed" }
      ],
      faces: [
        ["A", "B", "C", "D"],
        ["S", "A", "B"],
        ["S", "B", "C"],
        ["S", "C", "D"],
        ["S", "D", "A"]
      ],
      solutionSummary: {
        volume: `V = \\frac{1}{3} S_{ABCD} \\cdot SO = ${( (a * a * h) / 3 ).toFixed(2)}`,
        baseArea: `S_{ABCD} = ${a * a}`,
        height: `SO = ${h}`,
        specialAngles: `Góc ((SCD), (ABCD)) = \\widehat{SMO} = ${(Math.atan2(h, half) * 180 / Math.PI).toFixed(1)}^\\circ`
      }
    };
  }

  buildPyramidTriangleSA(a = 4, h = 5) {
    return {
      type: "pyramid_sa_triangle",
      name: `Chóp S.ABC (SA ⊥ đáy, đáy tam giác vuông)`,
      baseType: "right_triangle",
      params: { a, h },
      vertices: {
        A: [0, 0, 0],
        B: [a, 0, 0],
        C: [0, a, 0],
        S: [0, 0, h]
      },
      edges: [
        { from: "A", to: "B", type: "solid" },
        { from: "B", to: "C", type: "solid" },
        { from: "C", to: "A", type: "dashed" },
        { from: "S", to: "A", type: "dashed", label: `SA=${h}` },
        { from: "S", to: "B", type: "solid" },
        { from: "S", to: "C", type: "solid" }
      ],
      faces: [
        ["A", "B", "C"],
        ["S", "A", "B"],
        ["S", "B", "C"],
        ["S", "C", "A"]
      ],
      solutionSummary: {
        volume: `V = \\frac{1}{3} S_{ABC} \\cdot SA = ${( (0.5 * a * a * h) / 3 ).toFixed(2)}`,
        baseArea: `S_{ABC} = \\frac{1}{2} a^2 = ${0.5 * a * a}`,
        height: `SA = ${h}`
      }
    };
  }

  buildRegularTetrahedron(a = 4, h = 4) {
    const r = a / Math.sqrt(3);
    return {
      type: "regular_tetrahedron",
      name: `Tứ diện đều S.ABC (cạnh=${a})`,
      params: { a, h },
      vertices: {
        A: [r, 0, 0],
        B: [-r / 2, (a / 2), 0],
        C: [-r / 2, -(a / 2), 0],
        O: [0, 0, 0],
        S: [0, 0, h]
      },
      edges: [
        { from: "A", to: "B", type: "solid" },
        { from: "B", to: "C", type: "dashed" },
        { from: "C", to: "A", type: "solid" },
        { from: "S", to: "A", type: "solid" },
        { from: "S", to: "B", type: "solid" },
        { from: "S", to: "C", type: "dashed" },
        { from: "S", to: "O", type: "dashed", label: "SO" }
      ],
      solutionSummary: {
        volume: `V = \\frac{a^3 \\sqrt{2}}{12} \\approx ${( (Math.pow(a, 3) * Math.SQRT2) / 12 ).toFixed(2)}`,
        height: `SO = a \\sqrt{\\frac{2}{3}} \\approx ${( a * Math.sqrt(2/3) ).toFixed(2)}`
      }
    };
  }

  buildPrismTriangular(ab = 3, ac = 4, h = 6) {
    return {
      type: "prism_triangular",
      name: `Lăng trụ đứng tam giác ABC.A'B'C'`,
      params: { ab, ac, h },
      vertices: {
        A: [0, 0, 0],
        B: [ab, 0, 0],
        C: [0, ac, 0],
        "A'": [0, 0, h],
        "B'": [ab, 0, h],
        "C'": [0, ac, h]
      },
      edges: [
        { from: "A", to: "B", type: "solid" },
        { from: "B", to: "C", type: "solid" },
        { from: "C", to: "A", type: "dashed" },
        { from: "A'", to: "B'", type: "solid" },
        { from: "B'", to: "C'", type: "solid" },
        { from: "C'", to: "A'", type: "solid" },
        { from: "A", to: "A'", type: "dashed", label: `h=${h}` },
        { from: "B", to: "B'", type: "solid" },
        { from: "C", to: "C'", type: "solid" }
      ],
      solutionSummary: {
        volume: `V = S_{ABC} \\cdot h = ${(0.5 * ab * ac * h).toFixed(2)}`,
        baseArea: `S_{đáy} = \\frac{1}{2} \\cdot ${ab} \\cdot ${ac} = ${0.5 * ab * ac}`,
        hypotenuse: `BC = \\sqrt{${ab}^2 + ${ac}^2} = ${(Math.hypot(ab, ac)).toFixed(2)}`
      }
    };
  }

  buildCube(a = 4) {
    return {
      type: "cube",
      name: `Hình lập phương ABCD.A'B'C'D' (cạnh a=${a})`,
      params: { a },
      vertices: {
        A: [0, 0, 0],
        B: [a, 0, 0],
        C: [a, a, 0],
        D: [0, a, 0],
        "A'": [0, 0, a],
        "B'": [a, 0, a],
        "C'": [a, a, a],
        "D'": [0, a, a]
      },
      edges: [
        { from: "A", to: "B", type: "solid" },
        { from: "B", to: "C", type: "solid" },
        { from: "C", to: "D", type: "solid" },
        { from: "D", to: "A", type: "dashed" },
        { from: "A'", to: "B'", type: "solid" },
        { from: "B'", to: "C'", type: "solid" },
        { from: "C'", to: "D'", type: "solid" },
        { from: "D'", to: "A'", type: "solid" },
        { from: "A", to: "A'", type: "dashed" },
        { from: "B", to: "B'", type: "solid" },
        { from: "C", to: "C'", type: "solid" },
        { from: "D", to: "D'", type: "solid" },
        { from: "A'", to: "C", type: "accent", label: "Đường chéo A'C" }
      ],
      solutionSummary: {
        volume: `V = a^3 = ${Math.pow(a, 3)}`,
        totalArea: `S_{tp} = 6a^2 = ${6 * a * a}`,
        diagonal: `A'C = a\\sqrt{3} = ${(a * Math.sqrt(3)).toFixed(2)}`
      }
    };
  }

  buildBox(a = 4, b = 3, c = 5) {
    return {
      type: "box",
      name: `Hình hộp chữ nhật (${a} x ${b} x ${c})`,
      params: { a, b, c },
      vertices: {
        A: [0, 0, 0],
        B: [a, 0, 0],
        C: [a, b, 0],
        D: [0, b, 0],
        "A'": [0, 0, c],
        "B'": [a, 0, c],
        "C'": [a, b, c],
        "D'": [0, b, c]
      },
      edges: [
        { from: "A", to: "B", type: "solid" },
        { from: "B", to: "C", type: "solid" },
        { from: "C", to: "D", type: "solid" },
        { from: "D", to: "A", type: "dashed" },
        { from: "A'", to: "B'", type: "solid" },
        { from: "B'", to: "C'", type: "solid" },
        { from: "C'", to: "D'", type: "solid" },
        { from: "D'", to: "A'", type: "solid" },
        { from: "A", to: "A'", type: "dashed" },
        { from: "B", to: "B'", type: "solid" },
        { from: "C", to: "C'", type: "solid" },
        { from: "D", to: "D'", type: "solid" }
      ],
      solutionSummary: {
        volume: `V = a \\cdot b \\cdot c = ${a * b * c}`,
        totalArea: `S_{tp} = 2(ab + bc + ca) = ${2 * (a * b + b * c + c * a)}`,
        diagonal: `d = \\sqrt{a^2 + b^2 + c^2} = ${(Math.hypot(a, b, c)).toFixed(2)}`
      }
    };
  }

  buildCone(r = 3, h = 4) {
    const l = Math.hypot(r, h);
    return {
      type: "cone",
      name: `Hình nón tròn xoay (r=${r}, h=${h})`,
      params: { r, h, l },
      vertices: {
        O: [0, 0, 0],
        S: [0, 0, h],
        A: [-r, 0, 0],
        B: [r, 0, 0]
      },
      edges: [
        { from: "S", to: "A", type: "solid", label: `l=${l.toFixed(2)}` },
        { from: "S", to: "B", type: "solid", label: `l=${l.toFixed(2)}` },
        { from: "S", to: "O", type: "dashed", label: `h=${h}` },
        { from: "A", to: "B", type: "dashed", label: `2r=${2 * r}` }
      ],
      solutionSummary: {
        volume: `V = \\frac{1}{3} \\pi r^2 h = ${( (Math.PI * r * r * h) / 3 ).toFixed(2)}`,
        slantHeight: `l = \\sqrt{r^2 + h^2} = ${l.toFixed(2)}`,
        lateralArea: `S_{xq} = \\pi r l = ${(Math.PI * r * l).toFixed(2)}`,
        totalArea: `S_{tp} = \\pi r (l + r) = ${(Math.PI * r * (l + r)).toFixed(2)}`
      }
    };
  }

  buildCylinder(r = 3, h = 5) {
    return {
      type: "cylinder",
      name: `Hình trụ tròn xoay (r=${r}, h=${h})`,
      params: { r, h },
      vertices: {
        O: [0, 0, 0],
        "O'": [0, 0, h],
        A: [-r, 0, 0],
        B: [r, 0, 0],
        "A'": [-r, 0, h],
        "B'": [r, 0, h]
      },
      edges: [
        { from: "A", to: "A'", type: "solid", label: `h=${h}` },
        { from: "B", to: "B'", type: "solid", label: `h=${h}` },
        { from: "O", to: "O'", type: "dashed", label: "Trục OO'" }
      ],
      solutionSummary: {
        volume: `V = \\pi r^2 h = ${(Math.PI * r * r * h).toFixed(2)}`,
        lateralArea: `S_{xq} = 2\\pi r h = ${(2 * Math.PI * r * h).toFixed(2)}`,
        totalArea: `S_{tp} = 2\\pi r(h + r) = ${(2 * Math.PI * r * (h + r)).toFixed(2)}`
      }
    };
  }

  buildSphere(r = 3.5) {
    return {
      type: "sphere",
      name: `Hình cầu (bán kính R=${r})`,
      params: { r },
      vertices: {
        O: [0, 0, 0],
        A: [r, 0, 0],
        B: [-r, 0, 0],
        C: [0, 0, r]
      },
      solutionSummary: {
        volume: `V = \\frac{4}{3} \\pi R^3 = ${( (4 / 3) * Math.PI * Math.pow(r, 3) ).toFixed(2)}`,
        surfaceArea: `S = 4\\pi R^2 = ${(4 * Math.PI * r * r).toFixed(2)}`
      }
    };
  }

  build2DTriangle(A, B, C) {
    const G = [
      Number(((A[0] + B[0] + C[0]) / 3).toFixed(2)),
      Number(((A[1] + B[1] + C[1]) / 3).toFixed(2))
    ];
    return {
      type: "2d_triangle",
      name: `Tam giác ABC trên Oxy`,
      vertices: { A, B, C, G },
      solutionSummary: {
        centroid: `G(${G[0]}, ${G[1]})`,
        area: `S_{ABC} = ${( 0.5 * Math.abs((B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1])) ).toFixed(2)}`
      }
    };
  }

  getDefaultPyramid() {
    return this.buildPyramidSquareSA(4, 5);
  }
}
