import {ApiReference} from "@scalar/nextjs-api-reference";

const config = {
  pageTitle: "🕹 Microgame API Reference",
  // theme:
  // "alternate",
  // "default",
  // "galaxy",
  // "moon",
  // "purple",
  // "solarized",
  // "bluePlanet",
  // "deepSpace",
  // "saturn",
  // "kepler",
  // "elysiajs",
  // "fastify",
  // "mars",
  // "laserwave",
  // "none",
  favicon: "https://mira.ly/images/favicon.png",
  spec: {
    url: "/api/openapi.json",
    // url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
  },
};

export const GET = ApiReference(config);
