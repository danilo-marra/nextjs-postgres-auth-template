import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";
import activation from "models/activation.js";
import session from "models/session.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:user"), postHandler);
router.get(controller.canRequest("read:session"), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const sessionObject = await session.findOneValidByToken(
    request.cookies.session_id,
  );
  const renewedSessionObject = await session.renew(sessionObject.id);
  await controller.setSessionCookie(renewedSessionObject.token, response);

  response.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.status(200).json(request.context.user);
}

async function postHandler(request, response) {
  const userInputValues = request.body;
  const newUser = await user.create(userInputValues);

  const activationToken = await activation.create(newUser.id);
  await activation.sendEmailToUser(newUser, activationToken);
  response.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
  return response.status(201).json(newUser);
}
