"use client";

import {motion, AnimatePresence} from "framer-motion";
import {ReactNode} from "react";

interface AnimatedTextProps {
  children: ReactNode;
  isVisible: boolean;
  shouldRender: boolean;
  className?: string;
}

export function AnimatedText({
  children,
  isVisible,
  shouldRender,
  className,
}: AnimatedTextProps) {
  return (
    <AnimatePresence mode="wait">
      {shouldRender && (
        <motion.p
          className={className}
          initial={{opacity: 0, y: -10}}
          animate={{opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -10}}
          exit={{opacity: 0, y: -10}}
          transition={{duration: 0.3, ease: "easeInOut"}}
        >
          {children}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
