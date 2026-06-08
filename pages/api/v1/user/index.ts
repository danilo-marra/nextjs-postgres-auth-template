import { createRouter } from "next-connect";
import type { NextApiResponse } from "next";
import controller from "infra/controller";
import user from "models/user";
import session from "models/session";
import authorization from "models/authorization";
import type { AppApiRequest } from "infra/controller";

const router = createRouter<AppApiRequest, NextApiResponse>();

router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:session"), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(
  request: AppApiRequest,
  response: NextApiResponse,
): Promise<void> {
  const userTryingToGet = request.context.user;
  const sessionToken = request.cookies.session_id!;

  const sessionObject = await session.findOneValidByToken(sessionToken);
  const renewedSessionObject = await session.renew(sessionObject.id);
  controller.setSessionCookie(renewedSessionObject.token, response);

  const userFound = await user.findOneById(sessionObject.user_id);

  response.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:user:self",
    userFound,
  );
  response.status(200).json(secureOutputValues);
}
