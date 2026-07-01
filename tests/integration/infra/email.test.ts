import email from "infra/email";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: "Template <no-reply@template.com>",
      to: "contato@curso.dev",
      subject: "Test subject",
      text: "Test body.",
    });

    await email.send({
      from: "Template <no-reply@template.com>",
      to: "contato@curso.dev",
      subject: "Last sent email",
      text: "Body of last email",
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail!.sender).toBe("<no-reply@template.com>");
    expect(lastEmail!.recipients[0]).toBe("<contato@curso.dev>");
    expect(lastEmail!.subject).toBe("Last sent email");
    expect(lastEmail!.text!.trim()).toBe("Body of last email");
  });
});
