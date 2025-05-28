import LaunchAppButton from "../LaunchAppButton/LaunchAppButton";
import miraLogo from "../../icons/MiraLogo.png";

export function MiraApp(){
  return (
    <div className="flex flex-col items-center gap-[20px] mb-5 lg:gap-4">
      <img className="w-20 h-20" src={miraLogo.src} alt="Mira Logo" />

      <h2
        className="text-[54px] leading-[58px] text-center mt-3 font-[var(--font-prompt)] lg:text-[32px] lg:leading-[40px]"
        style={{ fontFamily: "var(--font-prompt), sans-serif" }}
      >
        Welcome to MIRA
      </h2>

      <p className="font-normal text-[20px] leading-[28px] text-center text-[var(--content-dimmed-light)] mb-3 lg:text-[18px] lg:leading-[24px]">
        Exceptional capital efficiency with robust liquidity and minimal fees
      </p>

      <LaunchAppButton className="w-[240px] py-4 lg:w-full lg:text-[18px] lg:leading-[24px]" />
    </div>
  );
};
