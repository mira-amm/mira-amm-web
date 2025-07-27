import {cn} from "@/src/utils/cn";

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
  const baseClasses = "flex items-center mx-auto";
  const sizeClasses = {
    small: "gap-2 gap-6 flex-wrap justify-center pb-4",
    large: "gap-6",
  };

  const linkBaseClasses =
    "px-3 py-1 rounded-full transition hover:bg-background-grey-light text-content-tertiary";
  const linkSizeClasses = {
    small: "text-sm sm:text-base",
    large: "",
  };

  return (
    <nav className={cn(baseClasses, sizeClasses[size], className)}>
      {navLinks.map(({href, label, match, external}) =>
        external ? (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(linkBaseClasses, linkSizeClasses[size])}
          >
            {label}
          </a>
        ) : (
          <a
            key={label}
            href={href}
            className={cn(
              linkBaseClasses,
              linkSizeClasses[size],
              match &&
                "bg-background-primary text-white dark:bg-background-grey-light hover:bg-background-primary"
            )}
          >
            {label}
          </a>
        )
      )}
    </nav>
  );
}
