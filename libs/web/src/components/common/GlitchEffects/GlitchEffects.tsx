import Image from "next/image";
import MicroChainStatusText from "@/src/components/common/MicroChainStatusText/microChainStatusText";
import dino from "@/public/images/dino.png";

const GlitchEffects = () => (
  <>
    <div className="rainbowContainer" data-id="rainbow">
      <div className="rainbowColor -translate-x-1/2 rainbowColor1"></div>
      <div className="rainbowColor -translate-x-1/2 rainbowColor2"></div>
      <div className="rainbowColor -translate-x-1/2 rainbowColor3"></div>
      <div className="rainbowColor -translate-x-1/2 rainbowColor4"></div>
      <div className="rainbowColor -translate-x-1/2 rainbowColor5"></div>
    </div>
    <Image src={dino} alt="Derek Dino" className="dino" />
    <MicroChainStatusText />{" "}
  </>
);

export default GlitchEffects;
