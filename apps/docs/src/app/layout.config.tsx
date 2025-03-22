import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import type { HomeLayoutProps } from 'fumadocs-ui/layouts/home'

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <>
        <svg
          width="24"
          height="24"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Logo"
        >
          <circle cx={12} cy={12} r={12} fill="currentColor" />
        </svg>
        My App
      </>
    ),
  },
  links: [
    {
      text: 'Documentation',
      url: '/docs',
      active: 'nested-url',
    },
  ],
  githubUrl: 'https://github.com/mira-amm/mira-amm-web',
};

export const homeOptions: HomeLayoutProps = { ...baseOptions }
