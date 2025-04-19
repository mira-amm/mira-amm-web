import * as vercel from "@pulumiverse/vercel";
import Table from "cli-table3";

export const PROJECTS = [
  { name: "mira-amm-web", emoji: "🪙", domain:'mira.ly' },
  { name: "web", emoji: "🪙", domain: 'web.mira.ly' },
  { name: "microgame", emoji: "🕹", domain: 'microgame.mira.ly' },
  { name: "docs", emoji: "📚", domain: 'docs.mira.ly' },
  { name: "arch", emoji: "🏛", domain: 'arch.mira.ly' },
  { name: "design", emoji: "💅", domain: 'design.mira.ly' },
  { name: "graph", emoji: "🧭", domain: 'graph.mira.ly' }
];

export const PROJECT_OUTPUTS = PROJECTS.map(project =>
  vercel.getProjectOutput({ name: project.name })
);

export const DEPLOYMENT_OUTPUTS = PROJECTS.map(project =>
  vercel.getDeployment({id: project.domain,}))

const tableStyle = {
  chars: {
    'top': '═',
    'top-mid': '╤',
    'top-left': '╔',
    'top-right': '╗',
    'bottom': '═',
    'bottom-mid': '╧',
    'bottom-left': '╚',
    'bottom-right': '╝',
    'left': '║',
    'left-mid': '╟',
    'mid': '─',
    'mid-mid': '┼',
    'right': '║',
    'right-mid': '╢',
    'middle': '│',
  },
  style: {
    head: ['blue', 'bold'],
    compact: true,
  },
  wordWrap: true,
};

export const table = new Table({
  ...tableStyle,
});
