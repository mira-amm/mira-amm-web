export function useIsRebrandEnabled(){
  return process.env.NEXT_PUBLIC_ENABLE_REBRAND_UI === "true";
};
