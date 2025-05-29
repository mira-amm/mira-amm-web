import { ReactNode } from "react";

export default function PromoBlock({ icon, title, link, linkText }: {
  icon: ReactNode;
  title: string;
  link: string;
  linkText: string;
}) {
  return (
    <a
      href={link}
      target="_blank"
      className="w-full flex gap-2.5 p-3 rounded-lg bg-[var(--background-grey-dark)] group"
      rel="noopener noreferrer"
    >
      <div className="flex items-center justify-center w-11 h-11 rounded bg-gradient-to-r from-[#5872fc] to-[#c41cff] text-[var(--content-primary)]">
        {icon}
      </div>
      <div className="flex-1 flex flex-col justify-center gap-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm leading-4 text-[var(--content-dimmed-light)] group-hover:text-[var(--content-primary)]">
          {linkText}
        </p>
      </div>
    </a>
  );
}
