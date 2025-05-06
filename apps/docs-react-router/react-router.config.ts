import type { Config } from '@react-router/dev/config';

export default {
  ssr: true,
  async prerender({ getStaticPaths }) {
    const { source } = await import('./app/source');
    return [
      ...getStaticPaths(),
      ...source.getPages().map((page) => page.url)
    ];
  },
} satisfies Config;
