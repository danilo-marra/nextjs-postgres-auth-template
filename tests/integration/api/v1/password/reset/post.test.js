import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/password/reset", () => {
  describe("Anonymous user", () => {
    test("With registered email", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.deleteAllEmails();

      const response = await fetch(
        "http://localhost:3000/api/v1/password/reset",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: createdUser.email }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        message: "If that email is registered, a reset link has been sent.",
      });

      const lastEmail = await orchestrator.getLastEmail();
      expect(lastEmail.sender).toBe(
        `<${process.env.APP_EMAIL || "no-reply@template.com"}>`,
      );
      expect(lastEmail.recipients[0]).toBe(`<${createdUser.email}>`);
      expect(lastEmail.subject).toBe("Reset your password on Template");
      expect(lastEmail.text).toContain(createdUser.username);
      expect(lastEmail.text).toContain("/password/reset/");
    });

    test("With unknown email", async () => {
      await orchestrator.deleteAllEmails();

      const response = await fetch(
        "http://localhost:3000/api/v1/password/reset",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "notregistered@example.com" }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        message: "If that email is registered, a reset link has been sent.",
      });

      const lastEmail = await orchestrator.getLastEmail();
      expect(lastEmail).toBeNull();
    });
  });

  describe("Default user", () => {
    test("Authenticated user cannot request reset", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(createdUser.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/password/reset",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({ email: createdUser.email }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You do not have permission to perform this action.",
        action: `Check if your user has the "create:password_reset_token" feature.`,
        status_code: 403,
      });
    });
  });
});
