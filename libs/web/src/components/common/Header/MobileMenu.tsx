"use client";

import {useState, useCallback} from "react";
import {createPortal} from "react-dom";
import {useIsClient, useScrollLock} from "usehooks-ts";
import {clsx} from "clsx";
import Link from "next/link";

import Logo from "@/src/components/common/Logo/Logo";
import { MenuIcon, CloseIcon } from "@/src/components/icons";
import {BlogLink, DiscordLink, XLink} from "@/src/utils/constants";
import useFaucetLink from "@/src/hooks/useFaucetLink";

export default function MobileMenu() {
  const [expanded, setExpanded] = useState(false);
  const {lock, unlock} = useScrollLock({autoLock: false});
  const isClient = useIsClient();
  const faucetLink = useFaucetLink();

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      next ? lock() : unlock();
      return next;
    });
  }, [lock, unlock]);

  const menu = (
    <div
      className={clsx(
        "fixed top-0 right-0 z-10 h-full w-screen overflow-auto bg-[var(--background-primary)] transition-transform duration-400 ease-in-out",
        expanded ? "translate-x-0 shadow-md" : "translate-x-full",
      )}
    >
      <div className="flex items-center justify-between p-4">
        <Logo />
        <button
          onClick={toggleExpanded}
          className="flex items-center justify-center border-none bg-transparent text-[var(--content-primary)]"
          aria-label="Close mobile menu"
        >
          <CloseIcon />
        </button>
      </div>

      <nav className="flex flex-col gap-6 p-4 text-base">
        <Link href="/swap" onClick={toggleExpanded}>
          Swap
        </Link>
        <Link href="/liquidity" onClick={toggleExpanded}>
          Liquidity
        </Link>
        <Link href="/points" onClick={toggleExpanded}>
          Points
        </Link>
        <a
          href={faucetLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={toggleExpanded}
        >
          Faucet
        </a>
        <a
          href={DiscordLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={toggleExpanded}
        >
          Discord
        </a>
        <a
          href={XLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={toggleExpanded}
        >
          X
        </a>
        <a
          href="https://docs.mira.ly"
          target="_blank"
          rel="noopener noreferrer"
          onClick={toggleExpanded}
        >
          Docs
        </a>
        <a
          href={BlogLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={toggleExpanded}
        >
          Blog
        </a>
      </nav>
    </div>
  );

  return (
    <>
      <button
        onClick={toggleExpanded}
        className="flex justify-center items-center bg-transparent border-none text-[var(--content-primary)]"
        aria-label="Open mobile menu"
      >
        <MenuIcon />
      </button>

      {isClient && createPortal(menu, document.body)}
    </>
  );
}
