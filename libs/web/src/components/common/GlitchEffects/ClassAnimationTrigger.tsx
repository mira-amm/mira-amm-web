export function triggerClassAnimation(classname: string): () => void {
  if (typeof window === "undefined") return () => {};

  const duration: number = classname === "dino" ? 2000 : 3500;
  const glitchElements = document.querySelectorAll(`.${classname}`);
  glitchElements.forEach((el) => {
    (el as HTMLElement).style.display = "block";
  });

  const timeoutId = setTimeout(() => {
    glitchElements.forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });
  }, duration);

  return () => clearTimeout(timeoutId);
}
