import {remarkMermaid} from "@theguild/remark-mermaid";
import {fileGenerator, remarkDocGen, remarkInstall} from "fumadocs-docgen";
import {defineConfig, defineDocs} from "fumadocs-mdx/config";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

export const docs = defineDocs({
  dir: "content/docs",
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [
      remarkMath,
      remarkMermaid,
      remarkInstall,
      [remarkDocGen, {generators: [fileGenerator()]}],
    ],
    // Placed first, otherwise gets affected by syntax highlighter
    rehypePlugins: (v) => [rehypeKatex, ...v],
  },
});
