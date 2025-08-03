export function getIsRebrandEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_REBRAND_UI === "true";
}
