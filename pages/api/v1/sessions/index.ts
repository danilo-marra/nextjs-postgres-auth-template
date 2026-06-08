import { createRouter } from "next-connect";
import type { NextApiResponse } from "next";
import controller from "infra/controller";
import authentication from "models/authentication";
import authorization from "models/authorization";
import session from "models/session";
import { ForbiddenError } from "infra/errors";
import type { AppApiRequest } from "infra/controller";

const router = createRouter<AppApiRequest, NextApiResponse>();

router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:session"), postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(
  request: AppApiRequest,
  response: NextApiResponse,
): Promise<void> {
  const userInputValues = request.body;

  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );

  if (!authorization.can(authenticatedUser, "create:session")) {
    throw new ForbiddenError({
      message: "You do not have permission to log in.",
      action: "Contact support if you believe this is an error.",
    });
  }

  const newSession = await session.create(authenticatedUser.id);

  controller.setSessionCookie(newSession.token, response);

  const secureOutputValues = authorization.filterOutput(
    authenticatedUser,
    "read:session",
    newSession,
  );

  response.status(201).json(secureOutputValues);
}

async function deleteHandler(
  request: AppApiRequest,
  response: NextApiResponse,
): Promise<void> {
  const userTryingToDelete = request.context.user;
  const sessionToken = request.cookies.session_id!;

  const sessionObject = await session.findOneValidByToken(sessionToken);
  const expiredSession = await session.expireById(sessionObject.id);
  controller.clearSessionCookie(response);

  const secureOutputValues = authorization.filterOutput(
    userTryingToDelete,
    "read:session",
    expiredSession,
  );

  response.status(200).json(secureOutputValues);
}
