import { createRouter } from "next-connect";
import type { NextApiResponse } from "next";
import controller from "infra/controller";
import passwordReset from "models/password-reset";
import authorization from "models/authorization";
import type { AppApiRequest } from "infra/controller";

const router = createRouter<AppApiRequest, NextApiResponse>();

router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:password_reset_token"), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(
  request: AppApiRequest,
  response: NextApiResponse,
): Promise<void> {
  const token = await passwordReset.resetPassword(
    request.query.token_id as string,
    request.body.password,
  );

  const secureOutputValues = authorization.filterOutput(
    request.context.user,
    "read:password_reset_token",
    token,
  );

  response.status(200).json(secureOutputValues);
}
