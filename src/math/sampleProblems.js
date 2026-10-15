// Danh mục đề bài toán hình học mẫu chuẩn chương trình THPT Quốc gia & Lớp 11-12
export const SAMPLE_PROBLEMS = [
  {
    id: "prob_pyramid_square_sa",
    title: "Chóp S.ABCD đáy hình vuông, SA vuông góc đáy",
    category: "3D",
    badge: "Đề thi THPT Quốc Gia",
    difficulty: "Mức độ 2 - Thông hiểu",
    image: "assets/sample_pyramid.jpg",
    text: "Cho hình chóp S.ABCD có đáy ABCD là hình vuông cạnh a = 4, cạnh bên SA vuông góc với mặt phẳng đáy (ABCD) và SA = 5. Gọi H là hình chiếu vuông góc của A lên cạnh SB. Xác định tọa độ các đỉnh và tính thể tích khối chóp.",
    parsed: {
      type: "pyramid_sa_square",
      name: "Hình chóp S.ABCD",
      baseType: "square",
      altitudeType: "sa_perp",
      altitudeVertex: "S",
      altitudeFoot: "A",
      params: { a: 4, b: 4, h: 5 },
      vertices: {
        A: [0, 0, 0],
        B: [4, 0, 0],
        C: [4, 4, 0],
        D: [0, 4, 0],
        S: [0, 0, 5],
        H: [0.97, 0, 3.79] // A chiếu lên SB
      },
      edges: [
        { from: "A", to: "B", type: "solid" },
        { from: "B", to: "C", type: "solid" },
        { from: "C", to: "D", type: "solid" },
        { from: "D", to: "A", type: "dashed" },
        { from: "S", to: "A", type: "dashed" },
        { from: "S", to: "B", type: "solid" },
        { from: "S", to: "C", type: "solid" },
        { from: "S", to: "D", type: "solid" },
        { from: "A", to: "H", type: "accent", label: "AH" },
        { from: "A", to: "C", type: "dashed", label: "AC" },
        { from: "B", to: "D", type: "dashed", label: "BD" }
      ],
      faces: [
        ["A", "B", "C", "D"],
        ["S", "A", "B"],
        ["S", "B", "C"],
        ["S", "C", "D"],
        ["S", "D", "A"]
      ],
      solutionSummary: {
        volume: "V = \\frac{1}{3} S_{ABCD} \\cdot SA = \\frac{1}{3} \\cdot 16 \\cdot 5 = \\frac{80}{3} \\approx 26.67",
        baseArea: "S_{ABCD} = a^2 = 16",
        height: "SA = 5",
        specialAngles: "Góc (SB, (ABCD)) = \\widehat{SBA} = \\arctan(\\frac{5}{4}) \\approx 51.34^\\circ",
        distance: "d(A, (SBC)) = AH = \\frac{SA \\cdot AB}{\\sqrt{SA^2 + AB^2}} = \\frac{5 \\cdot 4}{\\sqrt{25+16}} = \\frac{20}{\\sqrt{41}} \\approx 3.12"
      }
    }
  },
  {
    id: "prob_prism_triangular",
    title: "Lăng trụ đứng tam giác ABC.A'B'C' đáy vuông tại A",
    category: "3D",
    badge: "SGK Hình học 11-12",
    difficulty: "Mức độ 2 - Thông hiểu",
    image: "assets/sample_prism.jpg",
    text: "Cho hình lăng trụ đứng tam giác ABC.A'B'C' có đáy ABC là tam giác vuông tại A, biết AB = 3 cm, AC = 4 cm, cạnh bên AA' = 6 cm. Tính thể tích khối lăng trụ và diện tích toàn phần.",
    parsed: {
      type: "prism_triangular_right",
      name: "Lăng trụ tam giác ABC.A'B'C'",
      baseType: "right_triangle",
      altitudeType: "standing_prism",
      params: { ab: 3, ac: 4, h: 6 },
      vertices: {
        A: [0, 0, 0],
        B: [3, 0, 0],
        C: [0, 4, 0],
        "A'": [0, 0, 6],
        "B'": [3, 0, 6],
        "C'": [0, 4, 6]
      },
      edges: [
        { from: "A", to: "B", type: "solid" },
        { from: "B", to: "C", type: "solid" },
        { from: "C", to: "A", type: "dashed" },
        { from: "A'", to: "B'", type: "solid" },
        { from: "B'", to: "C'", type: "solid" },
        { from: "C'", to: "A'", type: "solid" },
        { from: "A", to: "A'", type: "dashed" },
        { from: "B", to: "B'", type: "solid" },
        { from: "C", to: "C'", type: "solid" }
      ],
      faces: [
        ["A", "B", "C"],
        ["A'", "B'", "C'"],
        ["A", "B", "B'", "A'"],
        ["B", "C", "C'", "B'"],
        ["C", "A", "A'", "C'"]
      ],
      solutionSummary: {
        volume: "V = S_{ABC} \\cdot AA' = (\\frac{1}{2} \\cdot 3 \\cdot 4) \\cdot 6 = 36 \\text{ cm}^3",
        baseArea: "S_{ABC} = \\frac{1}{2} AB \\cdot AC = 6 \\text{ cm}^2",
        height: "h = AA' = 6 \\text{ cm}",
        hypotenuse: "BC = \\sqrt{3^2 + 4^2} = 5 \\text{ cm}",
        totalArea: "S_{tp} = 2 S_{đáy} + S_{xq} = 2(6) + (3+4+5) \\cdot 6 = 12 + 72 = 84 \\text{ cm}^2"
      }
    }
  },
  {
    id: "prob_pyramid_regular_square",
    title: "Chóp tứ giác đều S.ABCD",
    category: "3D",
    badge: "Đề Chuyên Toán",
    difficulty: "Mức độ 3 - Vận dụng",
    image: null,
    text: "Cho hình chóp tứ giác đều S.ABCD có cạnh đáy a = 4, chiều cao SO = 5 với O là tâm của hình vuông ABCD. Tính góc giữa mặt bên và mặt phẳng đáy (ABCD).",
    parsed: {
      type: "pyramid_regular_square",
      name: "Chóp đều S.ABCD",
      baseType: "square",
      altitudeType: "center_so",
      params: { a: 4, h: 5 },
      vertices: {
        A: [-2, -2, 0],
        B: [2, -2, 0],
        C: [2, 2, 0],
        D: [-2, 2, 0],
        O: [0, 0, 0],
        S: [0, 0, 5],
        M: [0, 2, 0] // Trung điểm CD
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
        { from: "S", to: "O", type: "dashed", label: "SO (chiều cao)" },
        { from: "A", to: "C", type: "dashed" },
        { from: "B", to: "D", type: "dashed" },
        { from: "S", to: "M", type: "accent", label: "SM (trung đoạn)" },
        { from: "O", to: "M", type: "dashed", label: "OM" }
      ],
      solutionSummary: {
        volume: "V = \\frac{1}{3} a^2 h = \\frac{1}{3} \\cdot 16 \\cdot 5 = \\frac{80}{3} \\approx 26.67",
        baseArea: "S_{ABCD} = 4^2 = 16",
        height: "SO = 5",
        specialAngles: "Góc ((SCD), (ABCD)) = \\widehat{SMO} = \\arctan(\\frac{SO}{OM}) = \\arctan(\\frac{5}{2}) \\approx 68.2^\\circ"
      }
    }
  },
  {
    id: "prob_cone_revolution",
    title: "Hình nón tròn xoay (Thiết diện qua trục)",
    category: "3D",
    badge: "Khối tròn xoay Lớp 12",
    difficulty: "Mức độ 2 - Thông hiểu",
    image: null,
    text: "Cho hình nón tròn xoay có bán kính đáy r = 3, chiều cao h = 4. Một thiết diện qua trục là tam giác cân SAB. Tính độ dài đường sinh l, diện tích toàn phần và thể tích khối nón.",
    parsed: {
      type: "cone",
      name: "Hình nón tròn xoay đỉnh S",
      baseType: "circle",
      params: { r: 3, h: 4 },
      vertices: {
        O: [0, 0, 0],
        S: [0, 0, 4],
        A: [-3, 0, 0],
        B: [3, 0, 0]
      },
      edges: [
        { from: "S", to: "A", type: "solid", label: "Đường sinh l" },
        { from: "S", to: "B", type: "solid", label: "Đường sinh l" },
        { from: "S", to: "O", type: "dashed", label: "Trục h" },
        { from: "A", to: "B", type: "dashed", label: "Đường kính 2r" }
      ],
      solutionSummary: {
        volume: "V = \\frac{1}{3} \\pi r^2 h = \\frac{1}{3} \\pi \\cdot 3^2 \\cdot 4 = 12\\pi \\approx 37.70",
        slantHeight: "l = \\sqrt{r^2 + h^2} = \\sqrt{9 + 16} = 5",
        lateralArea: "S_{xq} = \\pi r l = \\pi \\cdot 3 \\cdot 5 = 15\\pi \\approx 47.12",
        totalArea: "S_{tp} = \\pi r l + \\pi r^2 = 15\\pi + 9\\pi = 24\\pi \\approx 75.40"
      }
    }
  },
  {
    id: "prob_cube_cross_section",
    title: "Hình lập phương ABCD.A'B'C'D' & Thiết diện",
    category: "3D",
    badge: "Hình học Không gian 11-12",
    difficulty: "Mức độ 3 - Vận dụng",
    image: null,
    text: "Cho hình lập phương ABCD.A'B'C'D' có cạnh a = 4. Dựng thiết diện tạo bởi mặt phẳng đi qua ba điểm A, C và D'. Tính diện tích thiết diện đó.",
    parsed: {
      type: "cube_cross_section",
      name: "Lập phương ABCD.A'B'C'D'",
      baseType: "square",
      params: { a: 4 },
      vertices: {
        A: [0, 0, 0],
        B: [4, 0, 0],
        C: [4, 4, 0],
        D: [0, 4, 0],
        "A'": [0, 0, 4],
        "B'": [4, 0, 4],
        "C'": [4, 4, 4],
        "D'": [0, 4, 4]
      },
      crossSection: ["A", "C", "D'"],
      solutionSummary: {
        volume: "V = a^3 = 4^3 = 64",
        crossSectionDesc: "Thiết diện là tam giác ACD' có các cạnh AC = CD' = D'A = 4\\sqrt{2} (tam giác đều)",
        crossSectionArea: "S = \\frac{(4\\sqrt{2})^2 \\sqrt{3}}{4} = \\frac{32\\sqrt{3}}{4} = 8\\sqrt{3} \\approx 13.86"
      }
    }
  },
  {
    id: "prob_2d_triangle_centers",
    title: "Tam giác Oxy: Trọng tâm, Trực tâm & Đường tròn ngoại tiếp",
    category: "2D",
    badge: "Hình học Phẳng Tọa độ Oxy",
    difficulty: "Mức độ 2 - Thông hiểu",
    image: null,
    text: "Trong mặt phẳng tọa độ Oxy, cho tam giác ABC với A(1, 4), B(-2, -1) và C(5, 0). Xác định tọa độ trọng tâm G, trực tâm H và tâm đường tròn ngoại tiếp O của tam giác.",
    parsed: {
      type: "2d_triangle",
      name: "Tam giác ABC trên Oxy",
      vertices: {
        A: [1, 4],
        B: [-2, -1],
        C: [5, 0]
      },
      solutionSummary: {
        centroid: "G(\\frac{1-2+5}{3}, \\frac{4-1+0}{3}) = G(\\frac{4}{3}, 1)",
        area: "S_{ABC} = \\frac{1}{2} |(x_B - x_A)(y_C - y_A) - (x_C - x_A)(y_B - y_A)| = 16",
        perimeter: "AB = \\sqrt{3^2 + 5^2} = \\sqrt{34}, BC = \\sqrt{7^2 + 1^2} = \\sqrt{50}, CA = \\sqrt{4^2 + 4^2} = \\sqrt{32}"
      }
    }
  }
];
