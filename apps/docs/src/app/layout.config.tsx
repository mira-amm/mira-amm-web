import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import type { HomeLayoutProps } from 'fumadocs-ui/layouts/home'
import Image from 'next/image'

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <>
        <Image src="https://github.com/user-attachments/assets/f4cea652-6234-438b-9b9d-e75cddd4e0c3" alt="Mira Stripes" height={48} width={48} />
        <span className="text-lg font-bold text-[#01EC97]">
          Mira
          {' '}
          <span className="text-[#F95465]">Docs</span>
        </span>
      </>
    ),
    url: '/',
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
