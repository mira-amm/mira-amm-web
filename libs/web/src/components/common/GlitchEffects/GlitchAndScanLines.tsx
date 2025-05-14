const triggerTextGlitch = () => {
  const styleId = "glitch-style";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
          @keyframes glitch {
            0% { transform: translate(0); }
            10% { transform: translate(-2px, 2px); }
            20% { transform: translate(2px, -2px); }
            30% { transform: translate(-1px, 1px); }
            40% { transform: translate(1px, -1px); }
            50% { transform: translate(0); }
            100% { transform: translate(0); }
          }
    
          .glitchy {
            animation: glitch 120ms infinite;
          }
    
          img.glitchy,
          svg.glitchy,
          table.glitchy,
          input.glitchy,
          textarea.glitchy,
          [class^="SearchBar_searchBar__"].glitchy {
            animation: glitch 200ms infinite;
            filter: brightness(1.2) contrast(1.1);
          }
        `;
    document.head.appendChild(style);
  }

  const elements = Array.from(document.querySelectorAll<HTMLElement>("body *"));
  const glitchedElements: HTMLElement[] = [];

  elements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const childNodes = Array.from(el.childNodes);
    let hasVisibleText = false;

    for (const node of childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim().length) {
        hasVisibleText = true;
        break;
      }
    }

    const tagName = el.tagName.toLowerCase();
    const className = el.className?.toString() || "";

    const isImage = tagName === "img";
    const isTextSpan = tagName === "span" && el.textContent?.trim().length;
    const isSvg = tagName === "svg";
    const isTable = tagName === "table";
    const isInput = tagName === "input" || tagName === "textarea";
    const isSearchBar = /^SearchBar_searchBar__/.test(className);

    if (
      hasVisibleText ||
      isImage ||
      isTextSpan ||
      isSvg ||
      isTable ||
      isInput ||
      isSearchBar
    ) {
      el.classList.add("glitchy");
      glitchedElements.push(el);
    }
  });

  // Auto-remove glitch after 2 seconds
  setTimeout(() => {
    glitchedElements.forEach((el) => el.classList.remove("glitchy"));
  }, 2000);
};

const triggerScanAndSweep = () => {
  // Clean up previous instance
  document.querySelector("#crt-style")?.remove();
  document.querySelector("#crt-sweep")?.remove();
  document.body.classList.remove("scanlines");

  // Inject CRT scanline styles
  const style = document.createElement("style");
  style.id = "crt-style";
  style.innerHTML = `
          @keyframes scanline-move {
              0%   { top: -100%; }
              100% { top: 100%; }
          }
  
          @keyframes static-scanlines {
              0% { background-position: 0 0; }
              100% { background-position: 0 4px; }
          }
  
          .scanlines {
              position: relative !important;
          }
  
          .scanlines::before,
          .scanlines::after {
              content: '';
              position: fixed;
              left: 0;
              width: 100vw;
              height: 100vh;
              pointer-events: none;
              z-index: 999999;
          }
  
          /* Moving scanline (sweeping) */
          .scanlines::before {
              background: linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%);
              animation: scanline-move 1s linear infinite;
              opacity: 0.4;
          }
  
          /* Static scanlines */
          .scanlines::after {
              top: 0;
              background-image: repeating-linear-gradient(
                  to bottom,
                  rgba(0,0,0,0.35),
                  rgba(0,0,0,0.35) 2px,
                  transparent 2px,
                  transparent 4px
              );
              animation: static-scanlines 0.25s steps(60) infinite;
              mix-blend-mode: multiply;
          }
      `;
  document.head.appendChild(style);

  // Apply effect
  document.body.classList.add("scanlines");

  // Stop the scanline effect after 2 seconds and clean everything up
  setTimeout(() => {
    // Stop the scanline animations
    const newStyle = document.createElement("style");
    newStyle.id = "crt-sweep";
    newStyle.innerHTML = `
              .scanlines::before {
                  animation: none !important;
              }
              .scanlines::after {
                  animation: none !important;
                  background: none !important;
              }
          `;
    document.head.appendChild(newStyle);

    // Clean up everything after stopping the effect
    document.querySelector("#crt-style")?.remove();
    document.querySelector("#crt-sweep")?.remove();
    document.body.classList.remove("scanlines");
  }, 2000);
};

const GlitchAndScanLines = () => {
  triggerTextGlitch();

  // Trigger scan and sweep 500ms before glitch effect ends (1500ms)
  setTimeout(() => {
    triggerScanAndSweep();
  }, 1500);
};

export default GlitchAndScanLines;
