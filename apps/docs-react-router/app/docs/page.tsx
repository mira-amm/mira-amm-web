import type { Route } from './+types/page';
import { rehypeCode } from 'fumadocs-core/mdx-plugins';
/* Errors when imported */
/* Unknown file extension ".css" ... */
/* import { ImageZoom } from 'fumadocs-ui/components/image-zoom'; */
import {baseOptions} from '../root'
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/page';
import { source } from '../source';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import {Mermaid} from '../mermaid'
import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { executeMdxSync } from '@fumadocs/mdx-remote/client';
import type { PageTree } from 'fumadocs-core/server';
import { createCompiler } from '@fumadocs/mdx-remote';
import * as path from 'node:path';
import {fileGenerator, remarkDocGen, remarkInstall} from "fumadocs-docgen";

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Microchain Docs' },
    { name: 'description', content: 'Welcome to Microchain!' },
  ];
}

const compiler = createCompiler({
  development: false,
    remarkPlugins: [
      remarkInstall,
      [remarkDocGen, {generators: [fileGenerator()]}],
    ],
 rehypePlugins: [rehypeCode],
});

export async function loader({ params }: Route.LoaderArgs) {
  const slugs = params['*'].split('/').filter((v) => v.length > 0);
  const page = source.getPage(slugs);
  if (!page) throw new Error('Not found');

  const compiled = await compiler.compileFile({
    path: path.resolve('content/docs', page.file.path),
    value: page.data.content,
  });

  return {
    page,
    compiled: compiled.toString(),
    tree: source.pageTree,
  };
}


export default function Page(props: Route.ComponentProps) {
  const { page, compiled, tree } = props.loaderData;
  const { default: Mdx, toc } = executeMdxSync(compiled);

  return (
    <DocsLayout
      tree={tree as PageTree.Root}
         {...baseOptions}
    >
      <DocsPage toc={toc}>
        <DocsTitle>{page.data.title}</DocsTitle>
        <DocsDescription>{page.data.description}</DocsDescription>
        <DocsBody>
          <Mdx components={{
            ...defaultMdxComponents,
            Mermaid,
            Tab,
            Tabs,
            Accordion,
            Accordions,
          }} />
        </DocsBody>
      </DocsPage>
    </DocsLayout>
  );
}
