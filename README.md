<h1 align="center">
  <a href="https://mira.ly">
   🟩 Mira 🦕
  </a>
</h1>

![Mira GitHub Repo README Cover](libs/shared/assets/mira-github-repo-readme-banner.png)

<div align="center">
  🚧 Major Monorepo Migration in Progress 🏗

<hr/>

![Static Badge](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=fff)
![Static Badge](https://img.shields.io/badge/Monorepo-%23143055?style=flat&logo=Nx&link=https%3A%2F%2Fnx.dev%2F)
<a href="https://github.com/storybooks/storybook">
<img src="https://raw.githubusercontent.com/storybooks/brand/master/badge/badge-storybook.svg" alt="Storybook">
</a>
<a href="https://conventionalcommits.org">
<img src="https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white" alt="Conventional Commits">
</a>
<a href="http://commitizen.github.io/cz-cli/">
<img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen friendly">
</a>
<a href="https://github.com/antfu/eslint-config">
<img src="https://antfu.me/badge-code-style.svg" alt="Code Style">
</a>
<img src="https://img.shields.io/github/repo-size/cuhacking/2025" alt="Repo Size">
[![Maturity badge - level 3](https://img.shields.io/badge/Maturity-Level%203%20--%20Stable-green.svg)](https://github.com/tophat/getting-started/blob/master/scorecard.md)

</div>

<hr/>

<div style="display: flex; gap: 10px;">
    <a href="https://github.com/mira-amm/mira-amm-web/actions/workflows/lint.yml">
        <img src="https://github.com/mira-amm/mira-amm-web/actions/workflows/lint.yml/badge.svg" alt="Lint">
    </a>
    <a href="https://github.com/mira-amm/mira-amm-web/actions/workflows/test_unit.yml">
        <img src="https://github.com/mira-amm/mira-amm-web/actions/workflows/test_unit.yml/badge.svg" alt="Unit Tests">
    </a>
    <!-- <a href="https://github.com/mira-amm/mira-amm-web/actions/workflows/test_e2e.yml"> -->
    <!--     <img src="https://github.com/mira-amm/mira-amm-web/actions/workflows/test_e2e.yml/badge.svg" alt="End-to-End Tests"> -->
    <!-- </a> -->
</div>

<hr/>

# Introduction

Source code for the [Mira Exchange](https://mira.ly/) web interface that enables users to interact with the Mira decentralized exchange (DEX) on
the [Fuel blockchain](https://fuel.network/).

## Features

### [Decentralized Exchange - (DEX)](https://mira.ly/)
| [Swap Tokens](https://mira.ly) | [Manage Liquidity](https://mira.ly/liquidity/?page=1) | [Earn Points](https://mira.ly/points/) |
|-|-|-|
| ![Mira Token Swaps](libs/shared/assets/mira-token-swaps.png) | ![Mira Liquidity Pools](libs/shared/assets/mira-liquidity.png) | ![Mira Points Program](libs/shared/assets/mira-points.png) |

## Platform

| [🪙 Decentralized Exchange - (DEX)](https://mira.ly/) | [📢 Website](https://mira.ly/landing) | [📚 Docs Site](https://docs.mira.ly) | [🌟 Design System - Storybook](https://design.mira.ly) | [🏛 Architecture](https://arch.mira.ly) |
| :-: | :-: | :-: | :-: | :-: |
| ![DEX](libs/shared/assets/mira-token-swaps.png) | ![Website](libs/shared/assets/screenshots/mira-landing-page.png) | ![Docs Site](apps/docs/public/screenshots/docs-site.png) | ![Storybook](apps/docs/public/screenshots/storybook.png) | ![Architecture](apps/docs/public/screenshots/architecture-site.png) |

- [Core Contract](https://github.com/mira-amm/mira-v1-core)
- [Periphery Scripts](https://github.com/mira-amm/mira-v1-periphery)
- [TypeScript SDK](https://github.com/mira-amm/mira-v1-ts)
- [Rust SDK](https://github.com/mira-amm/mira-v1-rs)
- [Blog](https://mirror.xyz/miraly.eth)

![Blog](apps/docs/public/screenshots/mirror-blog.png)

## Contributing

Developers are treated as first-class citizens here. The Mira platform's robust suite of tools handle the majority of environment setup, providing an outstanding full-stack development experience. 

The codebase is self-documenting.

| 🖥️ Microvisor | 💊 Microdoctor | [📍 Project Graph](https://mira.ly/landing) |
| :-: | :-: | :-: |
| ![Microvisor](apps/docs/public/screenshots/microvisor-status.png) | ![Microdoctor](apps/docs/public/screenshots/microdoctor.png) | ![Project Graph](apps/docs/public/screenshots/project-graph.png) |

| Drizzle Studio | Drizzle Schema Visualizer |
| :-: | :-: |
| ![Drizzle Studio](apps/docs/public/screenshots/drizzle-studio.png) | ![Drizzle Schema Visualizer](apps/docs/public/screenshots/drizzle-schema-visualizer.png) |

- OpenAPI Support

| JSON Endpoint | Swagger | Redoc | Rapidoc | Fumadocs | 
| :-: | :-: | :-: | :-: | :-: |
| ![OpenAPI JSON](apps/docs/public/screenshots/openapi-json.webp) | ![OpenAPI Swagger](apps/docs/public/screenshots/openapi-swagger.webp) | ![OpenAPI Redoc](apps/docs/public/screenshots/openapi-redoc.webp) | ![OpenAPI Rapidoc](apps/docs/public/screenshots/openapi-rapidoc.webp) | ![OpenAPI Fumadocs](apps/docs/public/screenshots/openapi-fumadocs.webp) |

See [docs](https://docs.mira.ly/libraries/contributing/installation) for instructions.

## Socials/Contact
- [Twitter/X - @MiraProtocol](https://x.com/MiraProtocol)
- [Discord](https://discord.gg/6pHdTY6rYq)

## Acknowledgements & Ecosystem

| [Fuel](https://fuel.network) | [Swaylend](https://swaylend.com) |
|-|-|
| ![Fuel Website](apps/docs/public/screenshots/fuel-website.png) | ![Swaylend Website](apps/docs/public/screenshots/swaylend-website.png) | 

Many of the monorepo scaffolding foundations have been inspired by, and brought over from [cuHacking](https://docs.cuhacking.ca)'s Axiom framework. 💚

### Maintained with 💙 by Open-Source @ [ChartHouse Labs](https://www.charthouse.io) 🔱

![ChartHouse Labs Banner](libs/shared/assets/charthouse-labs-banner.png)
