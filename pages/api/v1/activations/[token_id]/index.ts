import { createRouter } from "next-connect";
import type { NextApiResponse } from "next";
import controller from "infra/controller";
import activation from "models/activation";
import authorization from "models/authorization";
import type { AppApiRequest } from "infra/controller";

const router = createRouter<AppApiRequest, NextApiResponse>();

router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(
  request: AppApiRequest,
  response: NextApiResponse,
): Promise<void> {
  const activationTokenId = request.query.token_id as string;

  const validActivationToken =
    await activation.findOneValidById(activationTokenId);

  await activation.activateUserByUserId(validActivationToken.user_id);

  const usedActivationToken =
    await activation.markTokenAsUsed(activationTokenId);

  const secureOutputValues = authorization.filterOutput(
    request.context.user,
    "read:activation_token",
    usedActivationToken,
  );

  response.status(200).json(secureOutputValues);
}
