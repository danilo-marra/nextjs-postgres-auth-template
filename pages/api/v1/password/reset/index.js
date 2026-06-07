import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import passwordReset from "models/password-reset.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:password_reset_token"), postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  await passwordReset.create(request.body.email);
  return response.status(200).json({
    message: "If that email is registered, a reset link has been sent.",
  });
}
