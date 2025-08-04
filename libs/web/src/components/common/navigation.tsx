import {cn} from "@/src/utils/cn";
import Link from "next/link";
import {useEffect, useRef, useState} from "react";

export interface NavLink {
  href: string;
  label: string;
  match?: boolean;
  external?: boolean;
}

interface NavigationProps {
  navLinks: NavLink[];
  size?: "small" | "large";
  className?: string;
}

export function Navigation({
  navLinks,
  size = "large",
  className,
}: NavigationProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<(HTMLElement | null)[]>([]);

  // Find the active link index
  useEffect(() => {
    const index = navLinks.findIndex((link) => link.match);
    setActiveIndex(index >= 0 ? index : null);
  }, [navLinks]);

  const baseClasses = "flex items-center mx-auto relative";
  const sizeClasses = {
    small: "gap-2 gap-6 justify-center",
    large: "gap-6",
  };

  const linkBaseClasses =
    "px-3 py-1 rounded-full transition-all duration-300 ease-in-out text-content-tertiary relative z-10";
  const linkSizeClasses = {
    small: "text-md",
    large: "text-md",
  };

  return (
    <nav ref={navRef} className={cn(baseClasses, sizeClasses[size], className)}>
      {/* Animated background element */}
      {activeIndex !== null && (
        <div
          className="absolute bg-background-primary dark:bg-background-grey-light rounded-full transition-all duration-300 ease-in-out z-0"
          style={{
            left: linkRefs.current[activeIndex]?.offsetLeft ?? 0,
            width: linkRefs.current[activeIndex]?.offsetWidth ?? 0,
            height: linkRefs.current[activeIndex]?.offsetHeight ?? 0,
          }}
        />
      )}

      {navLinks.map(({href, label, match, external}, index) =>
        external ? (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            ref={(el) => {
              linkRefs.current[index] = el;
            }}
            className={cn(linkBaseClasses, linkSizeClasses[size])}
          >
            {label}
          </a>
        ) : (
          <Link
            key={label}
            href={href}
            ref={(el) => {
              linkRefs.current[index] = el;
            }}
            className={cn(
              linkBaseClasses,
              linkSizeClasses[size],
              match && "text-white"
            )}
          >
            {label}
          </Link>
        )
      )}
    </nav>
  );
}
