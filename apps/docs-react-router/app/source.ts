import {
  loader,
  type MetaData,
  type PageData,
  type Source,
  type VirtualFile,
} from 'fumadocs-core/source';
import matter from 'gray-matter';
// import { icons } from "lucide-react";
// import {createElement} from "react";
import * as path from 'node:path';

const files = Object.entries(
  import.meta.glob<true, 'raw'>('/content/docs/**/*', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
);

const virtualFiles: VirtualFile[] = files.flatMap(([file, content]) => {
  const ext = path.extname(file);
  const virtualPath = path.relative(
    'content/docs',
    path.join(process.cwd(), file),
  );

  if (ext === '.mdx' || ext === '.md') {
    const parsed = matter(content);

    return {
      type: 'page',
      path: virtualPath,
      data: {
        ...parsed.data,
        content: parsed.content,
      },
    };
  }

  if (ext === '.json') {
    return {
      type: 'meta',
      path: virtualPath,
      data: JSON.parse(content),
    };
  }

  return [];
});

export const source = loader({
  source: {
    files: virtualFiles,
  } as Source<{
    pageData: PageData & {
      content: string;
    };
    metaData: MetaData;
  }>,
  baseUrl: '/',
  // TODO: Investigate "TypeError: Component is not a function"
  // pageTree: {
  //   resolveIcon(icon) {
  //   if (icon && icon in icons){
  //     return createElement(icons[icon as keyof typeof icons]);
  //   }
  //     return;
  //   }
  // },
  // TODO: Investigate "TypeError: Component is not a function"
//   icon: (icon) => {
//     console.log(createElement(icons[icon as keyof typeof icons]));
//     if (icon && icon in icons){
//       return createElement(icons[icon as keyof typeof icons]);
// }
//       return;
//     }
})
