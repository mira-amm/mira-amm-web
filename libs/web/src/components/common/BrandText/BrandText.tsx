import { ReactNode } from "react";

interface BrandTextProps {
  mira: ReactNode;
  microchain: ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * SSR-safe brand text component that uses CSS to show/hide content
 * based on data-brand attribute on html element
 */
export function BrandText({ 
  mira, 
  microchain, 
  className = "", 
  as: Component = "span" 
}: BrandTextProps) {
  return (
    <>
      <Component className={`${className} brand-mira`}>
        {mira}
      </Component>
      <Component className={`${className} brand-microchain`}>
        {microchain}
      </Component>
    </>
  );
}