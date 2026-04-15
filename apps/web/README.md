This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Run backend:
```bash
cd /home/bazelisek/DEV/websites/strategyVisualiser/apps/backend
podman run -d --name strategy-visualiser-postgres \
  -e POSTGRES_USER=strategyuser \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=postgres \
  -p 5433:5432 docker.io/library/postgres:16

SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5433/postgres \
SPRING_DATASOURCE_USERNAME=strategyuser \
SPRING_DATASOURCE_PASSWORD=password \
bash ./mvnw spring-boot:run
```

## Strategy Execution

Strategies are now stored with configuration option definitions, and the backend resolves those definitions into execution values when a job starts.

The reserved `universe` option must contain a `defaultValue` array of stock symbols. When `/api/strategies/{id}/analyze` is called, the backend:

- resolves the saved configuration array into a plain JSON object of config values
- loads all persisted stock rows for every symbol in `universe.defaultValue`
- writes the resolved config to `config.json`
- writes the aggregated market data to `stock-data.csv`
- writes execution metadata, including the resolved universe and per-symbol row counts, to `job-context.json`

Legacy strategies created before the `universe` option existed are removed by Flyway migration `V0003__clean_legacy_strategies_without_universe.sql`, so the strategy table starts clean under the new contract.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
