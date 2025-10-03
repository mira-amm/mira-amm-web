"use client";

import {motion} from "framer-motion";

const SVGComponent = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={800}
    height={300}
    viewBox="0 0 800 300"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <radialGradient
        id="grad-green"
        cx={0.5}
        cy={0.5}
        r={0.5}
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0%" stopColor="#7EEAC0" stopOpacity={1} />
        <stop offset="80%" stopColor="#7EEAC0" stopOpacity={0} />
      </radialGradient>
      <radialGradient
        id="grad-red"
        cx={0.5}
        cy={0.5}
        r={0.5}
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0%" stopColor="#FF7A7A" stopOpacity={1} />
        <stop offset="80%" stopColor="#FF7A7A" stopOpacity={0} />
      </radialGradient>
      <radialGradient
        id="grad-blue"
        cx={0.5}
        cy={0.5}
        r={0.5}
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0%" stopColor="#93AFFF" stopOpacity={1} />
        <stop offset="80%" stopColor="#93AFFF" stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={250} cy={150} r={200} fill="url(#grad-green)" />
    <circle cx={400} cy={150} r={200} fill="url(#grad-red)" />
    <circle cx={550} cy={150} r={200} fill="url(#grad-blue)" />
  </svg>
);

const MotionSVGComponent = motion(SVGComponent);

interface BackgroundGlowProps {
  isVisible: boolean;
}

export function BackgroundGlow({isVisible}: BackgroundGlowProps) {
  return (
    <motion.div
      className="absolute bottom-[-100px] -z-10"
      style={{
        left: "50%",
        transform: "translateX(-50%)",
        width: "200%",
        maxWidth: "1200px",
      }}
      initial={{opacity: 0}}
      animate={{opacity: isVisible ? 1 : 0}}
      exit={{opacity: 0}}
      transition={{duration: 0.6, ease: "easeInOut"}}
    >
      <MotionSVGComponent className="w-full h-auto opacity-80" />
    </motion.div>
  );
}
