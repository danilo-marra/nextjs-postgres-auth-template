import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import passwordReset from "models/password-reset.js";
import authorization from "models/authorization.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:password_reset_token"), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const token = await passwordReset.resetPassword(
    request.query.token_id,
    request.body.password,
  );

  const secureOutputValues = authorization.filterOutput(
    request.context.user,
    "read:password_reset_token",
    token,
  );

  return response.status(200).json(secureOutputValues);
}
