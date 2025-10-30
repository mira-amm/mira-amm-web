# Mira Indexer & Web App — Local Setup

## 1) Process Cleanup

Kill running processes on relevant ports:

```bash
(lsof -ti :3000 | xargs kill -9 2>/dev/null || true) && \
(lsof -ti :4000 | xargs kill -9 2>/dev/null || true) && \
(lsof -ti :4350 | xargs kill -9 2>/dev/null || true) && \
(pkill -f indexer || true)
```

Force-remove all indexer containers and delete volumes:

```bash
docker ps -a | grep indexer | awk '{print $1}' | xargs docker rm -f
docker volume rm \
  indexer_processor-cache \
  indexer_processor-node-modules \
  indexer_server-cache \
  indexer_server-node-modules
```

---

## 2) Indexer Setup

1. Clone the repository

```bash
git clone git@github.com:mira-amm/mira-sqd-indexer.git
cd mira-sqd-indexer
git submodule update --init --recursive
pnpm install
```

2. Compile TypeScript

```bash
npx tsc
```

3. Start docker services

```bash
docker-compose up
```

4. Apply database migrations (open new terminal)

```bash
npx squid-typeorm-migration apply
```

5. Start Fuel dev node (new terminal)

```bash
pnpm fuels dev
```

6. Start GraphQL server (new terminal)

```bash
npx squid-graphql-server
```

7. Start processor (new terminal)

```bash
./run_processor_with_test_env.sh
```

8. Initialize pools (new terminal)

```bash
pnpm run init-pools
```

9. Confirm the indexer is running  
   - After running `init-pools` you should get all ✅ green checks  
   - Query `assets` and confirm prices exist for **ETH, FUEL, USDC**

> **Note:**  
> If anything fails at this stage, return to **Process Cleanup (Step 1)** and repeat **Indexer Setup (Step 2)**.

---

## 3) Web App Setup

1. Ensure the indexer is running

2. Clone the web app repository

```bash
git clone git@github.com:mira-amm/mira-amm-web.git
cd mira-amm-web
git submodule update --init --recursive
pnpm install
```

3. Navigate into the web app

```bash
cd apps/web
```

4. Copy environment files

```bash
cp .env.dev.local.example .env.dev.local
```

5. Copy verified asset list from indexer → web app

6. Copy binned-liquidity API contract IDs  
   from: `mira-binned-liquidity-api/contract-ids.json`  
   to:   `apps/indexer/mira-binned-liquidity-api/contract-ids.json`

7. Start the dev server

```bash
pnpm dev
```
