const ScrambleEffect = (): void => {
  const DURATION = 1800; // Total duration of the effect (in milliseconds)
  const DELAY_BW_FRAMES = 50; // Delay between each frame (in milliseconds) Decrease for faster scrambling at the cost of performance
  const MAX_SCRAMBLE_FRAMES = DURATION / DELAY_BW_FRAMES; // Max number of times each character will scramble
  const startTime = Date.now(); // Record the start time

  const blocker = document.createElement("div");
  Object.assign(blocker.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    zIndex: "999999",
    background: "transparent",
    pointerEvents: "auto",
  });
  document.body.appendChild(blocker);

  // Const to save all text nodes that need scrambling and their original text
  const scrambleTargets: {
    node: Text;
    original: string;
    scrambleMap: {char: string; countdown: number}[];
  }[] = [];

  // Walk through the DOM and find all text nodes that need scrambling
  (function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue || "";
      if (text.trim()) {
        const scrambleMap = Array.from(text).map((char) => ({
          char,
          countdown: Math.floor(Math.random() * MAX_SCRAMBLE_FRAMES),
        }));
        scrambleTargets.push({
          node: node as Text,
          original: text,
          scrambleMap,
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      node.childNodes.forEach(walk);
    }
  })(document.body);

  function scrambleFrame() {
    const now = Date.now();
    const elapsedTime = now - startTime;
    let stillScrambling = false;

    if (elapsedTime < DURATION) {
      // Scramble only during the effect duration
      for (const target of scrambleTargets) {
        const updatedText = target.scrambleMap
          .map(({char, countdown}, i) => {
            if (countdown > 0) {
              stillScrambling = true;
              target.scrambleMap[i].countdown--;
              return String.fromCharCode(Math.floor(Math.random() * 94 + 33));
            }
            return char;
          })
          .join("");

        target.node.nodeValue = updatedText;
      }

      if (stillScrambling) {
        setTimeout(scrambleFrame, DELAY_BW_FRAMES); // Run the next frame after a small delay
      }
    } else {
      // Ensure full restore after effect ends
      for (const target of scrambleTargets) {
        target.node.nodeValue = target.original;
      }
      blocker.remove();
    }
  }

  // Start the scrambling animation
  scrambleFrame();
};

export default ScrambleEffect;
