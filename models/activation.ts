import email from "infra/email";
import database from "infra/database";
import webserver from "infra/webserver";
import user from "models/user";
import { ForbiddenError, NotFoundError } from "infra/errors";
import authorization from "models/authorization";
import type { UserRow } from "models/user";

export interface ActivationTokenRow {
  id: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
  expires_at: Date;
  used_at: Date | null;
}

const EXPIRATION_IN_MILISECONDS = 60 * 15 * 1000; // 15 minutes

async function findOneValidById(tokenId: string): Promise<ActivationTokenRow> {
  const activationTokenId = await runSelectQuery(tokenId);

  return activationTokenId;

  async function runSelectQuery(tokenId: string): Promise<ActivationTokenRow> {
    const results = await database.query<ActivationTokenRow>({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          id = $1
          AND expires_at > NOW()
          AND used_at IS NULL
        LIMIT
          1
        ;`,
      values: [tokenId],
    });

    if (!results.rowCount) {
      throw new NotFoundError({
        message: "Activation token not found or expired.",
        action: "Please register again.",
      });
    }

    return results.rows[0];
  }
}

async function create(userId: string): Promise<ActivationTokenRow> {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(
    userId: string,
    expiresAt: Date,
  ): Promise<ActivationTokenRow> {
    const results = await database.query<ActivationTokenRow>({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING
          *
        ;`,
      values: [userId, expiresAt],
    });
    return results.rows[0];
  }
}

async function sendEmailToUser(
  userToNotify: UserRow,
  activationToken: ActivationTokenRow,
): Promise<void> {
  const appName = process.env.APP_NAME;
  const appEmail = process.env.APP_EMAIL;
  const activationPath = process.env.ACTIVATION_PATH || "/activate";

  await email.send({
    from: `${appName} <${appEmail}>`,
    to: userToNotify.email,
    subject: `Activate your account on ${appName}!`,
    text: `${userToNotify.username}, click the link below to activate your account on ${appName}:

${webserver.origin}${activationPath}/${activationToken.id}

Best regards,
${appName} Team`,
  });
}

async function markTokenAsUsed(
  activationTokenId: string,
): Promise<ActivationTokenRow> {
  const usedActivationToken = await runUpdateQuery(activationTokenId);
  return usedActivationToken;

  async function runUpdateQuery(
    activationTokenId: string,
  ): Promise<ActivationTokenRow> {
    const results = await database.query<ActivationTokenRow>({
      text: `
        UPDATE
          user_activation_tokens
        SET
          used_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
        ;`,
      values: [activationTokenId],
    });

    return results.rows[0];
  }
}

async function activateUserByUserId(userId: string): Promise<UserRow> {
  const userToActivate = await user.findOneById(userId);

  if (!authorization.can(userToActivate, "read:activation_token")) {
    throw new ForbiddenError({
      message: "You can no longer use activation tokens.",
      action: "Contact support.",
    });
  }
  const activatedUser = await user.setFeatures(userId, [
    "create:session",
    "read:session",
    "update:user",
  ]);
  return activatedUser;
}

const activation = {
  create,
  sendEmailToUser,
  markTokenAsUsed,
  findOneValidById,
  activateUserByUserId,
  EXPIRATION_IN_MILISECONDS,
};

export default activation;
