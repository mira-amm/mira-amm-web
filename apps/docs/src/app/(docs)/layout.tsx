import type {ReactNode} from "react";
import {DocsLayout} from "fumadocs-ui/layouts/notebook";
import {source} from "../../../source";
import {baseOptions} from "../layout.config";
import "katex/dist/katex.css";

export default function Layout({children}: {children: ReactNode}) {
  return (
    <DocsLayout {...baseOptions} tabMode="navbar" tree={source.pageTree}>
      {children}
    </DocsLayout>
  );
}
