import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database";
import type { RunnerOption } from "node-pg-migrate";

const defaultMigrationOptions = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up" as "up" | "down",
  log: () => {},
  migrationsTable: "pgmigrations",
};

async function listPendingMigrations() {
  let dbClient;

  try {
    dbClient = await database.getNewClient();
    const pendingMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
    } as RunnerOption);
    return pendingMigrations;
  } finally {
    await dbClient?.release();
  }
}

async function runPendingMigrations() {
  let dbClient;

  try {
    dbClient = await database.getNewClient();
    const migratedMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
      dryRun: false,
    } as RunnerOption);

    return migratedMigrations;
  } finally {
    await dbClient?.release();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
