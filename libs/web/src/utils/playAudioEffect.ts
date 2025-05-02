let currentAudio: HTMLAudioElement | null = null;

export function playAudioEffect(
  src: string,
  options: {
    volume?: number;
    maxDuration?: number;
    onStart?: () => void;
    onEnd?: () => void;
  },
) {
  stopCurrentAudio();

  const audio = new Audio(src);
  audio.volume = options.volume ?? 1;
  currentAudio = audio;

  audio.addEventListener("play", () => {
    options.onStart?.();
  });

  const cleanup = () => {
    options.onEnd?.();
    audio.remove();
  };

  audio.addEventListener("ended", cleanup);
  audio.addEventListener("pause", cleanup);

  audio.play();

  if (options.maxDuration) {
    setTimeout(() => {
      stopCurrentAudio();
    }, options.maxDuration);
  }
}

export function stopCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
