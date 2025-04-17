/**
 * TextScramble Class
 *
 * Creates a "hacking" scramble effect for text elements,
 * randomly replacing characters with symbols before settling
 * back to the original text.
 */
export class TextScramble {
  private el: HTMLElement;
  private chars: string;
  private resolve: Function | null;
  private queue: {
    from: string;
    to: string;
    start: number;
    end: number;
    char?: string;
  }[];
  private frameRequest: number | null;
  private frame: number;

  /**
   * Constructor
   * @param el - The DOM element containing the text to scramble
   */
  constructor(el: HTMLElement) {
    this.el = el;
    // Character set to use for scrambling
    this.chars = "!<>-_\\/[]{}—=+*^?#_$%&()~";
    this.resolve = null;
    this.queue = [];
    this.frameRequest = null;
    this.frame = 0;
    this.update = this.update.bind(this);
  }

  /**
   * Sets new text with scramble effect
   * @param newText - Text to scramble to
   * @returns Promise that resolves when scrambling is complete
   */
  setText(newText: string): Promise<void> {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    // Create a promise that will resolve when the animation is done
    const promise = new Promise<void>((resolve) => {
      this.resolve = resolve;
    });

    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || "";
      const to = newText[i] || "";
      const start = Math.floor(Math.random() * 40); // Randomize start time
      const end = start + Math.floor(Math.random() * 40); // Randomize end time
      this.queue.push({from, to, start, end});
    }

    // Cancel any ongoing animation
    if (this.frameRequest) {
      cancelAnimationFrame(this.frameRequest);
    }
    this.frame = 0;
    this.update();
    return promise;
  }

  /**
   * Animation update loop
   * Updates characters based on the current frame
   */
  update(): void {
    let output = "";
    let complete = 0;

    for (let i = 0; i < this.queue.length; i++) {
      let {from, to, start, end, char} = this.queue[i];

      // If animation hasn't started for this character, use original
      if (this.frame < start) {
        output += from;
        continue;
      }

      // If animation is complete for this character, use final
      if (this.frame >= end) {
        complete++;
        output += to;
        continue;
      }

      // Generate a random character for the scramble effect
      if (!char || Math.random() < 0.28) {
        char = this.randomChar();
        this.queue[i].char = char;
      }

      output += char;
    }

    this.el.innerText = output;

    // Check if animation is complete
    if (complete === this.queue.length) {
      if (this.resolve) {
        this.resolve();
        this.resolve = null;
      }
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }

  /**
   * Generates a random character from the chars string
   */
  randomChar(): string {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}
