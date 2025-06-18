import {ReactNode} from "react";
import {clsx} from "clsx";
import {Prompt, Inter} from "next/font/google";

import "../../styles.css";
import "@/meshwave-ui/global.css";

import {Providers} from "@/src/core/providers/Providers";

const prompt = Prompt({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-prompt",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function Layout({children}: {readonly children: ReactNode}) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" as="image" href="/images/loader.webp" />
      </head>
      <body className={clsx(inter.className, inter.variable, prompt.variable)}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
