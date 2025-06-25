"use client";

import Link from "next/link";
import {useState, useCallback} from "react";
import {Menu, X} from "lucide-react";
import {createPortal} from "react-dom";
import {useIsClient, useScrollLock} from "usehooks-ts";
import {clsx} from "clsx";

import {LogoIcon} from "@/meshwave-ui/icons";
import {BlogLink, DiscordLink, XLink} from "@/src/utils/constants";
import { useFaucetLink } from "@/src/hooks/useFaucetLink";

export function MobileMenu() {
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
        "fixed top-0 right-0 z-10 h-full w-screen overflow-auto bg-background-primary text-white transition-transform duration-400 ease-in-out",
        expanded ? "translate-x-0 shadow-md" : "translate-x-full",
      )}
    >
      <div className="flex items-center justify-between p-4">
        <Link
          href="/"
          className="w-16 h-8 flex flex-col justify-center text-white"
        >
          <LogoIcon />
        </Link>
        <button
          onClick={toggleExpanded}
          className="flex items-center justify-center border-none bg-transparent text-white"
          aria-label="Close mobile menu"
        >
          <X />
        </button>
      </div>

      <nav className="flex flex-col gap-6 p-4 text-base">
        <Link
          href="/swap"
          onClick={toggleExpanded}
          className="hover:text-white"
        >
          Swap
        </Link>
        <Link
          href="/liquidity"
          onClick={toggleExpanded}
          className="hover:text-white"
        >
          Liquidity
        </Link>
        <Link
          href="/points"
          onClick={toggleExpanded}
          className="hover:text-white"
        >
          Points
        </Link>
        <a
          href={faucetLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={toggleExpanded}
          className="hover:text-white"
        >
          Faucet
        </a>
        <a
          href={DiscordLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={toggleExpanded}
          className="hover:text-white"
        >
          Discord
        </a>
        <a
          href={XLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={toggleExpanded}
          className="hover:text-white"
        >
          X
        </a>
        <a
          href="https://docs.mira.ly"
          target="_blank"
          rel="noopener noreferrer"
          onClick={toggleExpanded}
          className="hover:text-white"
        >
          Docs
        </a>
        <a
          href={BlogLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={toggleExpanded}
          className="hover:text-white"
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
        className="flex justify-center items-center bg-transparent border-none text-content-primary"
        aria-label="Open mobile menu"
      >
        <Menu />
      </button>

      {isClient && createPortal(menu, document.body)}
    </>
  );
}
