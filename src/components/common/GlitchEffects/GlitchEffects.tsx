// src/components/common/GlitchEffects/index.tsx
import {ReactNode} from "react";
import Image from "next/image";
import MicroChainStatusText from "@/src/components/common/MicroChainStatusText/microChainStatusText";
import dino from "@/public/images/dino.png";

type Props = {
  overlayContent: ReactNode;
};

const GlitchEffects = ({overlayContent}: Props) => (
  <>
    <div className="glitchLayer">{overlayContent}</div>
    <div className="rainbowContainer">
      <div className="rainbowColor rainbowColor1"></div>
      <div className="rainbowColor rainbowColor2"></div>
      <div className="rainbowColor rainbowColor3"></div>
      <div className="rainbowColor rainbowColor4"></div>
      <div className="rainbowColor rainbowColor5"></div>
    </div>
    <Image
      src={dino}
      alt="Derek Dino"
      className="dino"
      style={{left: "30%", width: "190px", height: "170px"}}
    />
    <MicroChainStatusText />{" "}
  </>
);

export default GlitchEffects;
