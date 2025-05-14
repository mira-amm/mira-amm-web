import type { Route } from './+types/home';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { Link } from 'react-router';
import { baseOptions } from '../root';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Microchain Docs' },
    { name: 'description', content: 'Welcome to Microchain!' },
  ];
}

export default function Home() {

  return (
    <HomeLayout
      className="text-center"
      {...baseOptions}
    >
      <div className="py-12">
        <h1 className="text-xl font-bold mb-2">Microchain</h1>
        <p className="text-fd-muted-foreground mb-8">
          The Liquidity Hub on Fuel
        </p>
        <Link
          className="text-sm bg-fd-primary/80 text-fd-primary-foreground rounded-full font-medium px-4 py-2.5"
          to="/"
        >
          Docs
        </Link>
      </div>
    </HomeLayout>
  );
}
