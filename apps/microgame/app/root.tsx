import type { Route } from './+types/root';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import { RootProvider } from 'fumadocs-ui/provider/base';
import { ReactRouterProvider } from 'fumadocs-core/framework/react-router';
import type {BaseLayoutProps} from "fumadocs-ui/layouts/shared";
import {
  /* Figma as BrandIcon, */
  Rss as BlogIcon,
  Twitter
} from "lucide-react";
import {AiOutlineDiscord as DiscordIcon} from "react-icons/ai";

import { userFlowMachine } from '@/engine/machines/user';
import { createActorContext } from '@xstate/react';

/* import '@/fumadocs-ui/global.css'; */
import '@/meshwave-ui/global.css';

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
];

export const baseOptions: BaseLayoutProps = {
    searchToggle:{enabled: false},
  nav: {
    title: (
      <>
        <img
          src="/mira_stripes.png"
          alt="Mira Stripes"
          height={48}
          width={48}
        />
        <span className="text-lg font-bold text-[#01EC97]">
          Microchain <span className="text-[#F95465]">Systems</span>
        </span>
      </>
    ),
    url: "/",
  },
  links: [
    {
      type: "icon",
      text: "Blog",
      url: "https://mirror.xyz/miraly.eth",
      icon: <BlogIcon />,
      external: true,
    },
    {
      type: "icon",
      text: "Discord",
      url: "https://discord.gg/6pHdTY6rYq",
      external: true,
      icon: <DiscordIcon />,
    },
    {
      type: "icon",
      text: "X (Twitter)",
      url: "https://x.com/MiraProtocol",
      icon: <Twitter />,
      external: true,
    },
    /* {
*   type: "icon",
*   text: "Brand",
*   url: "https://figma.com",
*   external: true,
*   icon: <BrandIcon />,
* }, */
  ],
  githubUrl: "https://github.com/mira-amm/mira-amm-web",
};


export const UserMachineContext = createActorContext(userFlowMachine);

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ReactRouterProvider>
          <RootProvider>
            {children}
          </RootProvider>
        </ReactRouterProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return(
    <>
      <UserMachineContext.Provider>
      <Outlet />
      </UserMachineContext.Provider>
  </>
  )}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
