import {source} from "../../../../source";
import {DocsPage, DocsBody, DocsDescription, DocsTitle} from "fumadocs-ui/page";
import {notFound} from "next/navigation";
import {ImageZoom} from "fumadocs-ui/components/image-zoom";
import defaultMdxComponents, {createRelativeLink} from "fumadocs-ui/mdx";
import {Tab, Tabs} from "fumadocs-ui/components/tabs";

export default async function Page(props: {
  params: Promise<{slug?: string[]}>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDXContent = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDXContent
          components={{
            ...defaultMdxComponents,
            Tab,
            Tabs,
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
            img: (props) => <ImageZoom {...(props as any)} />,
            // you can add other MDX components here
          }}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{slug?: string[]}>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
