import Image from "next/image";
import MicroChainStatusText from "@/src/components/common/MicroChainStatusText/microChainStatusText";
import dino from "@/public/images/dino.png";

const GlitchEffects = () => (
  <>
    <div className="rainbowContainer">
      <div className="rainbowColor rainbowColor1"></div>
      <div className="rainbowColor rainbowColor2"></div>
      <div className="rainbowColor rainbowColor3"></div>
      <div className="rainbowColor rainbowColor4"></div>
      <div className="rainbowColor rainbowColor5"></div>
    </div>
    <Image src={dino} alt="Derek Dino" className="dino" />
    <MicroChainStatusText />{" "}
  </>
);

export default GlitchEffects;
