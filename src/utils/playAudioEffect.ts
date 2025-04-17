export const playAudioEffect = (
  src: string,
  options?: {
    volume?: number;
  },
) => {
  const {volume = 0.7} = options || {};

  if (typeof window === "undefined") return;

  const audio = new Audio(src);
  audio.volume = volume;

  audio.play().catch((e) => {
    console.error("Audio playback failed:", e);
  });
};
