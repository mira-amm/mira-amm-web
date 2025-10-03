import {ReactNode} from "react";

interface BrandTextProps {
  microchain: ReactNode;
  className?: string;
}

export function BrandText({microchain, className = ""}: BrandTextProps) {
  return <span className={className}>{microchain}</span>;
}
