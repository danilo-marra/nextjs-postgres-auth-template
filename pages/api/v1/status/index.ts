import { createRouter } from "next-connect";
import type { NextApiResponse } from "next";
import database from "infra/database";
import controller from "infra/controller";
import authorization from "models/authorization";
import type { AppApiRequest } from "infra/controller";

const router = createRouter<AppApiRequest, NextApiResponse>();

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(
  request: AppApiRequest,
  response: NextApiResponse,
): Promise<void> {
  const userTryingToGet = request.context.user;
  const updatedAt = new Date().toISOString();

  const databaseVersionResult = await database.query<{
    server_version: string;
  }>("SHOW server_version;");
  const databaseVersionValue = databaseVersionResult.rows[0].server_version;

  const databaseMaxConnectionsResult = await database.query<{
    max_connections: string;
  }>("SHOW max_connections;");
  const databaseMaxConnectionsValue =
    databaseMaxConnectionsResult.rows[0].max_connections;

  const databaseName = process.env.POSTGRES_DB;
  const databaseOpenedConnectionsResult = await database.query<{
    count: number;
  }>({
    text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
    values: [databaseName],
  });
  const databaseOpenedConnectionsValue =
    databaseOpenedConnectionsResult.rows[0].count;

  const statusObject = {
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: databaseVersionValue,
        max_connections: parseInt(databaseMaxConnectionsValue),
        opened_connections: databaseOpenedConnectionsValue,
      },
    },
  };

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:status",
    statusObject,
  );

  response.status(200).json(secureOutputValues);
}
