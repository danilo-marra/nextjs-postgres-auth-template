import { createRouter } from "next-connect";
import type { NextApiResponse } from "next";
import controller from "infra/controller";
import user from "models/user";
import activation from "models/activation";
import authorization from "models/authorization";
import type { AppApiRequest } from "infra/controller";

const router = createRouter<AppApiRequest, NextApiResponse>();
router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:user"), postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(
  request: AppApiRequest,
  response: NextApiResponse,
): Promise<void> {
  const userTryingToPost = request.context.user;
  const userInputValues = request.body;
  const newUser = await user.create(userInputValues);

  const activationToken = await activation.create(newUser.id);
  await activation.sendEmailToUser(newUser, activationToken);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPost,
    "read:user",
    newUser,
  );

  response.status(201).json(secureOutputValues);
}
