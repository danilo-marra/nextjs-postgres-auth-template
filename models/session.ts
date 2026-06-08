import crypto from "node:crypto";
import database from "infra/database";
import { UnauthorizedError } from "infra/errors";

export interface SessionRow {
  id: string;
  token: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
  expires_at: Date;
}

const EXPIRATION_IN_MILISECONDS = 60 * 60 * 24 * 30 * 1000; // 30 days

async function findOneValidByToken(sessionToken: string): Promise<SessionRow> {
  const sessionFound = await runSelectQuery(sessionToken);

  return sessionFound;

  async function runSelectQuery(sessionToken: string): Promise<SessionRow> {
    const results = await database.query<SessionRow>({
      text: `
        SELECT
          *
        FROM
          sessions
        WHERE
          token = $1
          AND expires_at > NOW()
        LIMIT 1
      ;`,
      values: [sessionToken],
    });

    if (!results.rowCount) {
      throw new UnauthorizedError({
        message: "User does not have an active session.",
        action: "Check if this user is logged in and try again.",
      });
    }

    return results.rows[0];
  }
}

async function create(userId: string): Promise<SessionRow> {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECONDS);

  const newSession = await runInsertQuery(token, userId, expiresAt);
  return newSession;

  async function runInsertQuery(
    token: string,
    userId: string,
    expiresAt: Date,
  ): Promise<SessionRow> {
    const results = await database.query<SessionRow>({
      text: `
        INSERT INTO
          sessions (token, user_id, expires_at)
        VALUES
          ($1, $2, $3)
        RETURNING
        *
      ;`,
      values: [token, userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function renew(sessionId: string): Promise<SessionRow> {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECONDS);

  const renewedSessionObject = await runUpdateQuery(sessionId, expiresAt);
  return renewedSessionObject;

  async function runUpdateQuery(
    sessionId: string,
    expiresAt: Date,
  ): Promise<SessionRow> {
    const results = await database.query<SessionRow>({
      text: `
        UPDATE
          sessions
        SET
          expires_at = $2,
          updated_at = NOW()
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [sessionId, expiresAt],
    });

    return results.rows[0];
  }
}

async function expireById(sessionId: string): Promise<SessionRow> {
  const expiredSessionObject = runUpdateQuery(sessionId);
  return expiredSessionObject;

  async function runUpdateQuery(sessionId: string): Promise<SessionRow> {
    const results = await database.query<SessionRow>({
      text: `
        UPDATE
          sessions
        SET
          expires_at = expires_at - INTERVAL '1 year',
          updated_at = NOW()
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [sessionId],
    });

    return results.rows[0];
  }
}

async function deleteAllByUserId(userId: string): Promise<void> {
  await database.query({
    text: `DELETE FROM sessions WHERE user_id = $1`,
    values: [userId],
  });
}

const session = {
  create,
  EXPIRATION_IN_MILISECONDS,
  findOneValidByToken,
  renew,
  expireById,
  deleteAllByUserId,
};

export default session;
