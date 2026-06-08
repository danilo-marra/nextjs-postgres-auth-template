import email from "infra/email";
import database from "infra/database";
import webserver from "infra/webserver";
import user from "models/user";
import password from "models/password";
import { NotFoundError } from "infra/errors";
import type { UserRow } from "models/user";
import type { PoolClient } from "pg";

export interface PasswordResetTokenRow {
  id: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
  expires_at: Date;
  used_at: Date | null;
}

const EXPIRATION_IN_MILISECONDS = 60 * 60 * 1000; // 1 hour

async function create(
  userEmail: string,
): Promise<PasswordResetTokenRow | null> {
  let foundUser: UserRow;
  try {
    foundUser = await user.findOneByEmail(userEmail);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }

    throw error;
  }

  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECONDS);
  const newToken = await runInsertQuery(foundUser.id, expiresAt);
  await sendEmailToUser(foundUser, newToken);
  return newToken;

  async function runInsertQuery(
    userId: string,
    expiresAt: Date,
  ): Promise<PasswordResetTokenRow> {
    const results = await database.query<PasswordResetTokenRow>({
      text: `
        INSERT INTO
          password_reset_tokens (user_id, expires_at)
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

async function findOneValidById(
  tokenId: string,
): Promise<PasswordResetTokenRow> {
  const results = await database.query<PasswordResetTokenRow>({
    text: `
      SELECT
        *
      FROM
        password_reset_tokens
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
      message: "Password reset token not found or expired.",
      action: "Request a new password reset link.",
    });
  }

  return results.rows[0];
}

async function sendEmailToUser(
  foundUser: UserRow,
  token: PasswordResetTokenRow,
): Promise<void> {
  const appName = process.env.APP_NAME;
  const appEmail = process.env.APP_EMAIL;
  const passwordResetPath =
    process.env.PASSWORD_RESET_PATH || "/password/reset";

  await email.send({
    from: `${appName} <${appEmail}>`,
    to: foundUser.email,
    subject: `Reset your password on ${appName}`,
    text: `${foundUser.username}, click the link below to reset your password on ${appName}:

${webserver.origin}${passwordResetPath}/${token.id}

If you did not request this, you can safely ignore this email.

Best regards,
${appName} Team`,
  });
}

async function markTokenAsUsed(
  tokenId: string,
): Promise<PasswordResetTokenRow> {
  const results = await database.query<PasswordResetTokenRow>({
    text: `
      UPDATE
        password_reset_tokens
      SET
        used_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
      ;`,
    values: [tokenId],
  });

  return results.rows[0];
}

async function resetPassword(
  tokenId: string,
  newPassword: string,
): Promise<PasswordResetTokenRow> {
  let client: PoolClient | undefined;

  try {
    client = await database.getNewClient();
    await client.query("BEGIN");

    const usedToken = await claimTokenById(client, tokenId);
    const hashedPassword = await password.hash(newPassword);

    await client.query({
      text: `
        UPDATE
          users
        SET
          password = $2,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        ;`,
      values: [usedToken.user_id, hashedPassword],
    });

    await client.query({
      text: `DELETE FROM sessions WHERE user_id = $1`,
      values: [usedToken.user_id],
    });

    await client.query("COMMIT");
    return usedToken;
  } catch (error) {
    await client?.query("ROLLBACK");
    throw error;
  } finally {
    await client?.release();
  }
}

async function claimTokenById(
  client: PoolClient,
  tokenId: string,
): Promise<PasswordResetTokenRow> {
  const results = await client.query<PasswordResetTokenRow>({
    text: `
      UPDATE
        password_reset_tokens
      SET
        used_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
      WHERE
        id = $1
        AND expires_at > NOW()
        AND used_at IS NULL
      RETURNING
        *
      ;`,
    values: [tokenId],
  });

  if (!results.rowCount) {
    throw new NotFoundError({
      message: "Password reset token not found or expired.",
      action: "Request a new password reset link.",
    });
  }

  return results.rows[0];
}

const passwordReset = {
  create,
  findOneValidById,
  sendEmailToUser,
  markTokenAsUsed,
  resetPassword,
  EXPIRATION_IN_MILISECONDS,
};

export default passwordReset;
