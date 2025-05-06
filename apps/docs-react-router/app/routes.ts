import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  // TODO: Render introduction page as '/' route
  index('routes/home.tsx'),
  route('/*', 'docs/page.tsx'),
  route('api/search', 'docs/search.ts'),
] satisfies RouteConfig;
