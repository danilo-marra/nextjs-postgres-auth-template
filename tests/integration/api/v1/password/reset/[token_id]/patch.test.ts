import { version as uuidVersion } from "uuid";
import passwordReset from "models/password-reset";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/password/reset/[token_id]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent token", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/password/reset/00000000-0000-0000-0000-000000000000",
        { method: "PATCH" },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Password reset token not found or expired.",
        action: "Request a new password reset link.",
        status_code: 404,
      });
    });

    test("With expired token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - 2 * passwordReset.EXPIRATION_IN_MILISECONDS),
        doNotFake: ["nextTick", "setImmediate"],
      });

      const createdUser = await orchestrator.createUser();
      const expiredToken =
        await orchestrator.createPasswordResetToken(createdUser);

      jest.useRealTimers();

      const response = await fetch(
        `http://localhost:3000/api/v1/password/reset/${expiredToken!.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: "newpassword" }),
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Password reset token not found or expired.",
        action: "Request a new password reset link.",
        status_code: 404,
      });
    });

    test("With already used token", async () => {
      const createdUser = await orchestrator.createUser();
      const token = await orchestrator.createPasswordResetToken(createdUser);

      const response1 = await fetch(
        `http://localhost:3000/api/v1/password/reset/${token!.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: "newpassword1" }),
        },
      );
      expect(response1.status).toBe(200);

      const response2 = await fetch(
        `http://localhost:3000/api/v1/password/reset/${token!.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: "newpassword2" }),
        },
      );
      expect(response2.status).toBe(404);

      const responseBody2 = await response2.json();
      expect(responseBody2).toEqual({
        name: "NotFoundError",
        message: "Password reset token not found or expired.",
        action: "Request a new password reset link.",
        status_code: 404,
      });
    });

    test("With concurrent requests for the same token", async () => {
      const createdUser = await orchestrator.createUser({
        password: "oldpassword",
      });
      await orchestrator.activateUser(createdUser);
      const token = await orchestrator.createPasswordResetToken(createdUser);

      const resetOperation1 = settleReset(
        passwordReset.resetPassword(token!.id, "newpassword1"),
      );
      const resetOperation2 = settleReset(
        passwordReset.resetPassword(token!.id, "newpassword2"),
      );
      const resetResults = [await resetOperation1, await resetOperation2];

      const fulfilledResults = resetResults.filter(
        (result) => result.status === "fulfilled",
      );
      const rejectedResults = resetResults.filter(
        (result) => result.status === "rejected",
      );

      expect(fulfilledResults).toHaveLength(1);
      expect(rejectedResults).toHaveLength(1);
      expect(rejectedResults[0].reason).toMatchObject({
        name: "NotFoundError",
        message: "Password reset token not found or expired.",
      });

      const successfulPassword =
        resetResults[0].status === "fulfilled"
          ? "newpassword1"
          : "newpassword2";
      const failedPassword =
        resetResults[0].status === "fulfilled"
          ? "newpassword2"
          : "newpassword1";

      const loginResponse = await fetch(
        "http://localhost:3000/api/v1/sessions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: createdUser.email,
            password: successfulPassword,
          }),
        },
      );
      expect(loginResponse.status).toBe(201);

      const failedLoginResponse = await fetch(
        "http://localhost:3000/api/v1/sessions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: createdUser.email,
            password: failedPassword,
          }),
        },
      );
      expect(failedLoginResponse.status).toBe(401);
    });

    test("With valid token", async () => {
      const createdUser = await orchestrator.createUser({
        password: "oldpassword",
      });
      await orchestrator.activateUser(createdUser);
      const existingSession = await orchestrator.createSession(createdUser.id);
      const token = await orchestrator.createPasswordResetToken(createdUser);

      const response = await fetch(
        `http://localhost:3000/api/v1/password/reset/${token!.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: "newpassword" }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: token!.id,
        used_at: responseBody.used_at,
        user_id: token!.user_id,
        expires_at: token!.expires_at.toISOString(),
        created_at: token!.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(uuidVersion(responseBody.user_id)).toBe(4);
      expect(Date.parse(responseBody.used_at)).not.toBeNaN();
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(responseBody.created_at);
      expect(expiresAt.getTime() - createdAt.getTime()).toBeGreaterThanOrEqual(
        passwordReset.EXPIRATION_IN_MILISECONDS - 1000,
      );
      expect(expiresAt.getTime() - createdAt.getTime()).toBeLessThanOrEqual(
        passwordReset.EXPIRATION_IN_MILISECONDS + 1000,
      );

      // New password works
      const loginResponse = await fetch(
        "http://localhost:3000/api/v1/sessions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: createdUser.email,
            password: "newpassword",
          }),
        },
      );
      expect(loginResponse.status).toBe(201);

      // Old password fails
      const oldLoginResponse = await fetch(
        "http://localhost:3000/api/v1/sessions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: createdUser.email,
            password: "oldpassword",
          }),
        },
      );
      expect(oldLoginResponse.status).toBe(401);

      // Old session is invalidated
      const sessionCheckResponse = await fetch(
        "http://localhost:3000/api/v1/user",
        {
          headers: { Cookie: `session_id=${existingSession.token}` },
        },
      );
      expect(sessionCheckResponse.status).toBe(401);
    });
  });

  describe("Default user", () => {
    test("Authenticated user cannot use reset token", async () => {
      const user1 = await orchestrator.createUser();
      await orchestrator.activateUser(user1);
      const user1Session = await orchestrator.createSession(user1.id);

      const user2 = await orchestrator.createUser();
      const token = await orchestrator.createPasswordResetToken(user2);

      const response = await fetch(
        `http://localhost:3000/api/v1/password/reset/${token!.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${user1Session.token}`,
          },
          body: JSON.stringify({ password: "newpassword" }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You do not have permission to perform this action.",
        action: `Check if your user has the "read:password_reset_token" feature.`,
        status_code: 403,
      });
    });
  });
});

async function settleReset(resetOperation: Promise<unknown>) {
  try {
    return {
      status: "fulfilled",
      value: await resetOperation,
    };
  } catch (reason) {
    return {
      status: "rejected",
      reason,
    };
  }
}
