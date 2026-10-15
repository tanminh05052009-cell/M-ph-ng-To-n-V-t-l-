// Tiện ích hiển thị công thức toán KaTeX
export function renderMath(elementId, latexStr, isDisplayMode = false) {
  const el = typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
  if (!el) return;

  if (window.katex) {
    try {
      window.katex.render(latexStr, el, {
        throwOnError: false,
        displayMode: isDisplayMode
      });
      return;
    } catch (e) {
      console.warn("KaTeX render error:", e);
    }
  }

  // Fallback nếu chưa tải xong thư viện KaTeX
  el.textContent = latexStr;
}

export function renderAllMathInElement(containerElement) {
  if (!window.renderMathInElement || !containerElement) return;
  window.renderMathInElement(containerElement, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false },
      { left: "\\[", right: "\\]", display: true }
    ],
    throwOnError: false
  });
}
