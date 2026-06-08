import retry from "async-retry";
import { faker } from "@faker-js/faker";

import database from "infra/database";
import migrator from "models/migrator";
import user from "models/user";
import session from "models/session";
import activation from "models/activation";
import passwordReset from "models/password-reset";
import type { UserRow, UserCreateInput } from "models/user";
import type { SessionRow } from "models/session";
import type { Feature } from "models/authorization";
import type { PasswordResetTokenRow } from "models/password-reset";

const emailHttpUrl = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

interface EmailMessage {
  id: string;
  sender: string;
  recipients: string[];
  subject: string;
  text?: string;
}

async function waitForAllServices(): Promise<void> {
  await waitForWebServer();
  await waitForEmailServer();

  async function waitForWebServer(): Promise<void> {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage(): Promise<void> {
      const response = await fetch("http://localhost:3000/api/v1/status");

      if (response.status !== 200) {
        throw Error();
      }
    }
  }

  async function waitForEmailServer(): Promise<void> {
    return retry(fetchEmailPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchEmailPage(): Promise<void> {
      const response = await fetch(emailHttpUrl);

      if (response.status !== 200) {
        throw Error();
      }
    }
  }
}

async function clearDatabase(): Promise<void> {
  await database.query("drop schema public cascade; create schema public;");
}

async function runPendingMigrations(): Promise<void> {
  await migrator.runPendingMigrations();
}

async function createUser(
  userObject?: Partial<UserCreateInput>,
): Promise<UserRow> {
  return await user.create({
    username:
      userObject?.username || faker.internet.username().replace(/[_.-]/g, ""),
    email: userObject?.email || faker.internet.email(),
    password: userObject?.password || "validpassword",
  });
}

async function createSession(userId: string): Promise<SessionRow> {
  return await session.create(userId);
}

async function deleteAllEmails(): Promise<void> {
  await fetch(`${emailHttpUrl}/messages`, {
    method: "DELETE",
  });
}

async function getLastEmail(): Promise<EmailMessage | null> {
  const emailListResponse = await fetch(`${emailHttpUrl}/messages`);
  const emailListBody = (await emailListResponse.json()) as EmailMessage[];
  const lastEmailItem = emailListBody.pop();

  if (!lastEmailItem) {
    return null;
  }

  const emailTextReponse = await fetch(
    `${emailHttpUrl}/messages/${lastEmailItem.id}.plain`,
  );
  const emailTextBody = await emailTextReponse.text();

  lastEmailItem.text = emailTextBody;
  return lastEmailItem;
}

function extractUUID(text: string): string | null {
  const match = text.match(/[0-9a-fA-F-]{36}/);
  return match ? match[0] : null;
}

async function activateUser(inactiveUser: UserRow): Promise<UserRow> {
  return await activation.activateUserByUserId(inactiveUser.id);
}

async function addFeaturesToUser(
  userObject: UserRow,
  features: Feature[],
): Promise<UserRow> {
  const updatedUser = await user.addFeatures(userObject.id, features);
  return updatedUser;
}

async function createPasswordResetToken(userObject: {
  email: string;
}): Promise<PasswordResetTokenRow | null> {
  return await passwordReset.create(userObject.email);
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createSession,
  deleteAllEmails,
  getLastEmail,
  extractUUID,
  activateUser,
  addFeaturesToUser,
  createPasswordResetToken,
};

export default orchestrator;
