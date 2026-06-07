import email from "infra/email.js";
import database from "infra/database.js";
import webserver from "infra/webserver.js";
import user from "models/user.js";
import password from "models/password.js";
import { NotFoundError } from "infra/errors";

const EXPIRATION_IN_MILISECONDS = 60 * 60 * 1000; // 1 hour

async function create(userEmail) {
  let foundUser;
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

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
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

async function findOneValidById(tokenId) {
  const results = await database.query({
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

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "Password reset token not found or expired.",
      action: "Request a new password reset link.",
    });
  }

  return results.rows[0];
}

async function sendEmailToUser(foundUser, token) {
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

async function markTokenAsUsed(tokenId) {
  const results = await database.query({
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

async function resetPassword(tokenId, newPassword) {
  let client;

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

async function claimTokenById(client, tokenId) {
  const results = await client.query({
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

  if (results.rowCount === 0) {
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
