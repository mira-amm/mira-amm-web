# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Microchain (formerly Mira) is a decentralized exchange (DEX) built on the Fuel blockchain. This monorepo contains the web interface, SDKs, smart contracts, and supporting infrastructure for the platform.

## Common Development Commands

### Core Development
- `pnpm dev` - Start the development environment with TUI (includes microvisor, process-compose)
- `pnpm start` - Start development without TUI wrapper 
- `pnpm storybook` - Run Storybook design system on port specified by `$STORYBOOK_DEV_SERVER_PORT`

### Code Quality & Testing
- `pnpm nx lint <project>` - Lint a specific project
- `pnpm nx test <project>` - Run tests for a specific project  
- `pnpm nx typecheck <project>` - Type check a specific project
- `pnpm nx format:all` - Format all code (TypeScript + Rust)
- `pnpm nx format:all:check` - Check formatting without applying changes

### Build & Deploy
- `pnpm nx build <project>` - Build a specific project
- `pnpm nx build ts-sdk` - Build the TypeScript SDK (required before releases)

### Project Management
- `pnpm nx show project <name> --web` - View project details in browser
- `pnpm nx graph` - View dependency graph

## Architecture Overview

### Monorepo Structure

**Apps:**
- `web` - Main DEX web application (Next.js)
- `docs` - Documentation site (Fumadocs)
- `design` - Storybook design system
- `admin` - Admin interface (PayloadCMS)
- `microvisor` - Development environment manager (browser extension using WXT)
- `arch` - Architecture documentation and diagrams
- `microgame` - Gamification components
- `web-e2e` - End-to-end tests

**Core Libraries:**
- `ts-sdk` - TypeScript SDK for interacting with Mira contracts
- `rust-sdk` - Rust SDK implementation
- `api` - NestJS API server with GraphQL
- `db` - Database schemas and migrations (Drizzle ORM)
- `web` - Shared web components and utilities
- `shared` - Common utilities and types
- `swap` - Swap-specific logic and components

**Contract Libraries:**
- `mira-v1-core` - Core V1 AMM contracts
- `mira-v1-periphery` - V1 peripheral contracts  
- `contracts` - V2 contracts and binned liquidity

**Infrastructure:**
- `platform-vercel` - Vercel deployment configuration (Pulumi)
- `external` - External service integrations
- `scripts` - Build and utility scripts
- `engine` - Core trading engine logic
- `meshwave-ui` - UI component library

### Key Technologies

- **Frontend**: Next.js, React, TailwindCSS, Radix UI, Framer Motion
- **Backend**: NestJS, GraphQL, PostgreSQL, Drizzle ORM
- **Blockchain**: Fuel Network, Fuels TypeScript SDK
- **Testing**: Vitest, Playwright, Serenity-JS
- **Tooling**: Nx monorepo, pnpm, ESLint, Prettier, Storybook
- **Infrastructure**: Vercel, Pulumi

### Smart Contract Integration

The project supports two contract versions:
- **V1 Contracts** (`mira-v1-core`, `mira-v1-periphery`): Broad spectrum and stable swaps
- **V2 Contracts** (`contracts`): Concentrated liquidity with binned pools

TypeScript types are auto-generated from Sway contract ABIs using the Fuels typegen:
- `pnpm nx typegen:contracts ts-sdk` - Generate contract types
- `pnpm nx typegen:scripts ts-sdk` - Generate script types

### Development Environment

The project uses **Microvisor** - a sophisticated development environment manager that:
- Orchestrates multiple services (database, API, web app, etc.)
- Provides a browser-based terminal interface via ttyd + zellij
- Manages service dependencies and startup order
- Integrates with external tools and process-compose

Start with `pnpm dev` to launch the full development stack.

### Data Layer

- **Database**: PostgreSQL with Drizzle ORM for schema management
- **Indexing**: Subsquid indexer for pool data, Sentio for points program
- **State Management**: Zustand for client state, TanStack Query for server state
- **GraphQL**: Apollo Server with auto-generated schemas

### Testing Strategy

- **Unit Tests**: Vitest for component and utility testing
- **E2E Tests**: Playwright with Serenity-JS for behavior-driven testing
- **Contract Tests**: Fuel SDK testing utilities
- **Visual Tests**: Storybook for component visual testing

### Key Patterns

1. **Workspace Dependencies**: Use `workspace:*` for internal package references
2. **Catalog Dependencies**: Centralized dependency management via `pnpm-workspace.yaml`
3. **Code Generation**: Auto-generate types from contracts and GraphQL schemas
4. **Incremental Builds**: Nx caching for faster builds and tests
5. **Conventional Commits**: Structured commit messages with automated releases

## Important Notes

- Always run `pnpm nx typegen:contracts ts-sdk` and `pnpm nx typegen:scripts ts-sdk` after contract updates
- The `ts-sdk` must be built before creating releases (`pnpm nx build ts-sdk`)
- Use `mira-dex-ts` as the published package name for the TypeScript SDK
- Mainnet contract: `0x2e40f2b244b98ed6b8204b3de0156c6961f98525c8162f80162fcf53eebd90e7`
- Testnet contract: `0x05e5fa8c29cbc326beac9758634946e74f69b293b7e7d326f1b539f33b8c7f56`

## Environment Setup

The project uses Nix for reproducible development environments. Key environment files:
- `devenv.nix` - Nix development environment
- `.envrc` - direnv configuration
- `.env.example` - Environment variable template

External services required:
- Vercel (deployment)
- Fuel Network RPC endpoints