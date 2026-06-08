import { createRouter } from "next-connect";
import type { NextApiResponse } from "next";
import controller from "infra/controller";
import migrator from "models/migrator";
import authorization from "models/authorization";
import type { AppApiRequest } from "infra/controller";

const router = createRouter<AppApiRequest, NextApiResponse>();

router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:migration"), getHandler);
router.post(controller.canRequest("create:migration"), postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(
  request: AppApiRequest,
  response: NextApiResponse,
): Promise<void> {
  const userTryingToGet = request.context.user;
  const pendingMigrations = await migrator.listPendingMigrations();

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:migration",
    pendingMigrations,
  );

  response.status(200).json(secureOutputValues);
}

async function postHandler(
  request: AppApiRequest,
  response: NextApiResponse,
): Promise<void> {
  const userTryingToPost = request.context.user;
  const migratedMigrations = await migrator.runPendingMigrations();

  const secureOutputValues = authorization.filterOutput(
    userTryingToPost,
    "create:migration",
    migratedMigrations,
  );

  if (migratedMigrations.length > 0) {
    response.status(201).json(secureOutputValues);
    return;
  }

  response.status(200).json(secureOutputValues);
}
