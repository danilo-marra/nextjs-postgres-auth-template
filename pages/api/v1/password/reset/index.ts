import { createRouter } from "next-connect";
import type { NextApiResponse } from "next";
import controller from "infra/controller";
import passwordReset from "models/password-reset";
import type { AppApiRequest } from "infra/controller";

const router = createRouter<AppApiRequest, NextApiResponse>();

router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:password_reset_token"), postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(
  request: AppApiRequest,
  response: NextApiResponse,
): Promise<void> {
  await passwordReset.create(request.body.email);
  response.status(200).json({
    message: "If that email is registered, a reset link has been sent.",
  });
}
