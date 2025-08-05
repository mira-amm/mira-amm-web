import Image from "next/image";
import MicroChainStatusText from "@/src/components/common/MicroChainStatusText/microChainStatusText";

const GlitchEffects = () => (
  <>
    <div className="rainbowContainer" data-id="rainbow">
      <div className="rainbowColor -translate-x-1/2 rainbowColor1"></div>
      <div className="rainbowColor -translate-x-1/2 rainbowColor2"></div>
      <div className="rainbowColor -translate-x-1/2 rainbowColor3"></div>
      <div className="rainbowColor -translate-x-1/2 rainbowColor4"></div>
      <div className="rainbowColor -translate-x-1/2 rainbowColor5"></div>
    </div>
    <Image
      src={"/images/dino.png"}
      alt="Derek Dino"
      className="dino"
      width={0}
      height={0}
      sizes="auto"
      style={{width: "auto", height: "auto"}}
    />
    <MicroChainStatusText />{" "}
  </>
);

export default GlitchEffects;
