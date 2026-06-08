import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import { ServiceError } from "./errors";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT
    ? Number(process.env.EMAIL_SMTP_PORT)
    : undefined,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASSWORD,
  },
  secure: process.env.NODE_ENV === "production",
});

async function send(mailOptions: Mail.Options): Promise<void> {
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ServiceError({
      message: "Failed to send email",
      action: "Check if the email service is available",
      cause: error,
      context: mailOptions,
    });
  }
}

const email = {
  send,
};

export default email;
