export const useIsRebrandEnabled = () => {
  return process.env.NEXT_PUBLIC_ENABLE_REBRAND_UI === "true";
};
