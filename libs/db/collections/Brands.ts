import type { CollectionConfig } from 'payload/types'
import { navAccordions } from './navAccordions';
import { Payload } from 'payload'
import { getOrUploadMedia } from '../seed/index';

export const Brands: CollectionConfig = {
  slug: 'brands',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'symbol', 'description', 'id', 'updatedAt', 'createdAt'],
    group: navAccordions.categories,
  },
  versions: {
    drafts: true,
    maxPerDoc: 3,
  },
  hooks: {
  },
  fields: [
    {type:"row",
    fields:[
    { name: 'symbol', type: 'upload', relationTo: 'media', label: 'Symbol', required: false,
      access: {
    read: () => true,
    } },
    { name: 'wordmark', type: 'upload', relationTo: 'media', label: 'Wordmark', required: false },
    ]},
    { name: 'name', type: 'text', required: true, label: 'Name' },
    { name: 'description', type: 'textarea', label: 'Description' },
    { name: 'domain', type: 'text', admin: { position: 'sidebar' } },
    {name: 'links', type: 'array', label: 'Links',
      labels: {singular: 'Link', plural: 'Links'},
      fields: [
        {name: 'name', type: 'text'},
        {name: 'link', type: 'text'},
      ],
    },
  ],
}

export async function seedBrands(payload: Payload, req: any) {
  payload.logger.info("📸 Uploading brand logos & inserting brands...");
  await Promise.all(
[
      {
        "name": "Bash",
        "domain": "https://www.gnu.org/software/bash/",
        "symbol": "https://bashlogo.com/img/symbol/png/monochrome_light.png"
      },
      {
        "name": "Emacs Lisp",
        "domain": "https://en.wikipedia.org/wiki/Emacs_Lisp",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/emacs/emacs-original.svg"
      },
      {
        "name": "TypeScript",
        "domain": "https://www.typescriptlang.org/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg"
      },
      {
        "name": "LaTeX",
        "domain": "https://www.latex-project.org/",
        "symbol": "https://raw.githubusercontent.com/MFarabi619/MFarabi619/5a4606bb573657a028ae5b2583f58ea151268667/Markdown%20Sections/Section%20Data/latex_logo.svg"
      },
      {
        "name": "HTML",
        "domain": "https://www.w3.org/html/",
        "symbol": "https://raw.githubusercontent.com/devicons/devicon/master/icons/html5/html5-original-wordmark.svg"
      },
      {
        "name": "CSS",
        "domain": "https://www.w3schools.com/css/",
        "symbol": "https://raw.githubusercontent.com/devicons/devicon/master/icons/css3/css3-original-wordmark.svg"
      },
      {
        "name": "Pulumi",
        "domain": "https://www.pulumi.com",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/pulumi/pulumi-original.svg"
      },
      {
        "name": "Node.js",
        "domain": "https://nodejs.org/en/about",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-plain-wordmark.svg"
      },
      {
        "name": "Express",
        "domain": "https://expressjs.com/",
        "symbol": "https://raw.githubusercontent.com/MFarabi619/MFarabi619/5a4606bb573657a028ae5b2583f58ea151268667/Markdown%20Sections/Section%20Data/express_logo.svg"
      },

      {
        "name": "XState",
        "domain": "https://xstate.js.org",
        "symbol": "https://avatars.githubusercontent.com/u/61783956?s=200&v=4.png"
      },

      {
        "name": "PostgreSQL",
        "domain": "https://www.postgresql.org/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-plain-wordmark.svg"
      },
      {
        "name": "Drizzle",
        "domain": "https://orm.drizzle.team/",
        "symbol": "https://avatars.githubusercontent.com/u/108468352?s=160&v=4.svg"
      },
      {
        "name": "GraphQL",
        "domain": "https://graphql.org/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/graphql/graphql-plain-wordmark.svg"
      },
      {
        "name": "Nest.js",
        "domain": "https://nestjs.com/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nestjs/nestjs-original.svg"
      },
      {
        "name": "Payload CMS",
        "domain": "https://payloadcms.com/",
        "symbol": "https://avatars.githubusercontent.com/u/62968818?s=48&v=4"
      },
      {
        "name": "React Router",
        "domain": "https://reactrouter.com",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/reactrouter/reactrouter-original.svg"
      },
      {
        "name": "Next.js",
        "domain": "https://nextjs.org/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg"
      },
      {
        "name": "Sli.dev",
        "domain": "https://sli.dev",
        "symbol": "https://camo.githubusercontent.com/afc49f89c6467ea6e85a87c60ad0f19cda3831c4dfc89f114f6a8001555b9fe4/68747470733a2f2f736c692e6465762f6c6f676f2d7469746c652e706e67"
      },
      {
        "name": "React",
        "domain": "https://reactjs.org/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg"
      },
      {
        "name": "Tailwind CSS",
        "domain": "https://tailwindcss.com/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg"
      },
      {
        "name": "Storybook",
        "domain": "https://storybook.js.org/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/storybook/storybook-original.svg"
      },
      {
        "name": "Serenity.js Screenplay Pattern",
        "domain": "https://playwright.dev/",
        "symbol": "https://avatars.githubusercontent.com/u/25189746?s=200&v=4"
      },
      {
        "name": "Playwright",
        "domain": "https://playwright.dev/",
        "symbol": "https://playwright.dev/img/playwright-logo.svg"
      },
      {
        "name": "Vitest",
        "domain": "https://vitest.dev/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vitest/vitest-original.svg"
      },
      {
        "name": "GNU/Linux",
        "domain": "https://www.linux.org/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linux/linux-original.svg"
      },
      {
        "name": "Arch Linux",
        "domain": "https://archlinux.org/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/archlinux/archlinux-original.svg"
      },
      {
        "name": "Git",
        "domain": "https://git-scm.com/",
        "symbol": "https://www.vectorlogo.zone/logos/git-scm/git-scm-icon.svg"
      },
      {
        "name": "NixOS",
        "domain": "https://nixos.org/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nixos/nixos-original.svg"
      },
      {
        "name": "Zellij",
        "domain": "https://zellij.dev/",
        "symbol": "https://raw.githubusercontent.com/zellij-org/zellij/main/assets/logo.png"
      },
      {
        "name": "Docker",
        "domain": "https://www.docker.com/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-plain-wordmark.svg"
      },
      {
        "name": "Nx",
        "domain": "https://nx.dev",
        "symbol": "https://api.iconify.design/logos:nx.svg"
      },
      {
        "name": "Supabase",
        "domain": "https://supabase.com",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/supabase/supabase-original.svg"
      },
      {
        "name": "GitHub Actions",
        "domain": "https://github.com/features/actions",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/githubactions/githubactions-plain.svg"
      },
      {
        "name": "Netlify",
        "domain": "https://netlify.com",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/netlify/netlify-original.svg"
      },
      {
        "name": "LikeC4",
        "domain": "https://likec4.dev",
        "symbol": "https://avatars.githubusercontent.com/u/128791862?s=200&v=4"
      },
      {
        "name": "Doom Emacs",
        "domain": "https://github.com/doomemacs/doomemacs",
        "symbol": "https://user-images.githubusercontent.com/590297/85930281-0d379c00-b889-11ea-9eb8-6f7b816b6c4a.png"
      },
      {
        "name": "Org-mode",
        "domain": "https://orgmode.org",
        "symbol": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Org-mode-unicorn.svg"
      },
      {
        "name": "Figma",
        "domain": "https://www.figma.com/",
        "symbol": "https://www.vectorlogo.zone/logos/figma/figma-icon.svg"
      },

      {
        "name": "Java",
        "domain": "https://www.java.com",
        "symbol": "https://raw.githubusercontent.com/devicons/devicon/master/icons/java/java-original.svg"
      },
      {
        "name": "Python",
        "domain": "https://www.python.org",
        "symbol": "https://raw.githubusercontent.com/devicons/devicon/master/icons/python/python-original.svg"
      },
      {
        "name": "JavaScript",
        "domain": "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        "symbol": "https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg"
      },
      {
        "name": "Svelte",
        "domain": "https://svelte.dev/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/svelte/svelte-original-wordmark.svg"
      },
      {
        "name": "Embedded C",
        "domain": "https://en.wikipedia.org/wiki/Embedded_C",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/embeddedc/embeddedc-original-wordmark.svg"
      },
      {
        "name": "C++",
        "domain": "https://en.wikipedia.org/wiki/C%2B%2B",
        "symbol": "https://raw.githubusercontent.com/devicons/devicon/master/icons/cplusplus/cplusplus-original.svg"
      },
      {
        "name": "Arduino",
        "domain": "https://www.arduino.cc/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/arduino/arduino-original-wordmark.svg"
      },
      {
        "name": "Lua",
        "domain": "https://www.lua.org/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/lua/lua-original.svg"
      },

      {
        "name": "Remix.js",
        "domain": "https://remix.run/",
        "symbol": "https://github.com/user-attachments/assets/5ac0e523-a337-42a2-ba56-c13d314fdaac"
      },
      {
        "name": "Astro",
        "domain": "https://astro.build/",
        "symbol": "https://www.svgrepo.com/show/373446/astro.svg"
      },
      {
        "name": "SvelteKit",
        "domain": "https://kit.svelte.dev/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/svelte/svelte-original.svg"
      },
      {
        "name": "Ember.js",
        "domain": "https://emberjs.com/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ember/ember-original-wordmark.svg"
      },
      {
        "name": "Framer Motion",
        "domain": "https://motion.dev",
        "symbol": "https://user-images.githubusercontent.com/7850794/164965523-3eced4c4-6020-467e-acde-f11b7900ad62.png"
      },
      {
        "name": "Jest",
        "domain": "https://jestjs.io/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/jest/jest-plain.svg"
      },
      {
        "name": "Chai",
        "domain": "https://www.chaijs.com/",
        "symbol": "https://avatars.githubusercontent.com/u/1515293?s=280&v=4"
      },
      {
        "name": "Mocha",
        "domain": "https://mochajs.org/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mocha/mocha-original.svg"
      },
      {
        "name": "PyTest",
        "domain": "https://docs.pytest.org/en/7.3.x/",
        "symbol": "https://upload.wikimedia.org/wikipedia/commons/b/ba/Pytest_logo.svg"
      },

      {
        "name": "Oracle Enterprise Linux",
        "domain": "https://www.oracle.com/ca-en/linux/",
        "symbol": "https://upload.wikimedia.org/wikipedia/commons/4/46/Oracle_linux_logo.svg"
      },
      {

        "name": "Ubuntu",
        "domain": "https://ubuntu.com/",
        "symbol": "https://www.vectorlogo.zone/logos/ubuntu/ubuntu-icon.svg"
      },
      {
        "name": "NeoVim",
        "domain": "https://neovim.io/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/neovim/neovim-original.svg"
      },
      {
        "name": "Vim",
        "domain": "https://www.vim.org/",
        "symbol": "https://cdn.worldvectorlogo.com/logos/vim.svg"
      },
      {
        "name": "VS Code",
        "domain": "https://code.visualstudio.com/",
        "symbol": "https://cdn.worldvectorlogo.com/logos/visual-studio-code-1.svg"
      },
      {
        "name": "Tmux",
        "domain": "https://github.com/tmux/tmux/wiki",
        "symbol": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Tmux_logo.svg"
      },
      {
        "name": "Jira",
        "domain": "https://www.atlassian.com/software/jira",
        "symbol": "https://cdn.worldvectorlogo.com/logos/jira-1.svg"
      },
      {
        "name": "BitBucket",
        "domain": "https://bitbucket.org/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bitbucket/bitbucket-original.svg"
      },
      {
        "name": "Confluence",
        "domain": "https://www.atlassian.com/software/confluence",
        "symbol": "https://cdn.worldvectorlogo.com/logos/confluence-1.svg"
      },
      {
        "name": "Azure DevOps",
        "domain": "https://azure.microsoft.com/en-ca/products/devops",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azuredevops/azuredevops-original.svg"
      },
      {
        "name": "Sanity",
        "domain": "https://www.sanity.io/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sanity/sanity-original.svg"
      },

      {
        "name": "Smalltalk",
        "domain":"https://squeak.org",
        "symbol": "https://upload.wikimedia.org/wikipedia/commons/b/bf/Smalltalk_Balloon.svg"
      },
      {
        "name": "Rust",
        "domain": "https://www.rust-lang.org/",
        "symbol": "https://icons.veryicon.com/png/o/business/vscode-program-item-icon/rust-1.png"
      },
      {
        "name": "Solidity",
        "domain": "https://soliditylang.org",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/solidity/solidity-original.svg"
      },
      {
        "name": "Go",
        "domain": "https://golang.org/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original-wordmark.svg"
      },

      {
        "name": "Leptos",
        "domain": "https://leptos.dev",
        "symbol": "https://avatars.githubusercontent.com/u/118319153?s=200&v=4"
      },
      {
        "name": "Node.ts",
        "domain": "https://typestrong.org/ts-node/",
        "symbol": "https://raw.githubusercontent.com/TypeStrong/ts-node/main/logo.svg"
      },
      {
        "name": "NestJS TRPC",
        "domain": "https://www.nestjs-trpc.io",
        "symbol": "https://www.nestjs-trpc.io/logo.png"
      },
      {
        "name": "Analog.js",
        "domain": "https://analogjs.org/",
        "symbol": "https://analogjs.org/img/logos/analog-logo.svg"
      },
      {
        "name": "Angular",
        "domain": "https://angular.dev/",
        "symbol": "https://logosandtypes.com/wp-content/uploads/2024/01/angular.svg"
      },
      {
        "name": "Spring Boot",
        "domain": "https://spring.io/projects/spring-boot",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/spring/spring-original-wordmark.svg"
      },
      {
        "name": "PyTorch",
        "domain": "https://pytorch.org/",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/pytorch/pytorch-plain-wordmark.svg"
      },
      {
        "name": "FreeBSD Unix",
        "domain": "https://www.freebsd.org",
        "symbol": "https://wiki.installgentoo.com/images/thumb/0/0a/Freebsd.png/600px-Freebsd.png"
      },
      {
        "name": "AWS",
        "domain": "https://aws.amazon.com/?nc2=h_lg",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg"
      },
      {
        "name": "Kubernetes",
        "domain": "https://kubernetes.io",
        "symbol": "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kubernetes/kubernetes-original.svg"
      },
      {
        "name": "Pharo",
        "domain": "https://pharo.org/",
        "symbol": "https://pharo.org/web/files/pharo.png"
      }
].map(async (brand) => {
      const symbol = await getOrUploadMedia(
        payload,
        req,
        brand.symbol,
        `${brand.name.replace(/ /g, "-").toLowerCase()}-logo-symbol`,
        `${brand.name} Logo`,
      );

      await payload.create({
        collection: "brands",
        data: {
          name: brand.name,
          description: brand.description || '',
          symbol: symbol?.id || null,
          domain: brand.domain || null,
          links: brand.links || [],
        },
      });
      payload.logger.info(`✅ Inserted brand: ${brand.name}`);
    }),
  );
}
