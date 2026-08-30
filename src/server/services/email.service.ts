import nodemailer from "nodemailer";

import { env } from "@/server/config/env";

type VerificationEmailPayload = {
  email: string;
  displayName: string;
  otpCode: string;
};

type PasswordResetEmailPayload = {
  email: string;
  displayName: string;
  resetToken: string;
  resetUrl: string;
};

type OperationalReminderEmailPayload = {
  email: string;
  recipientName: string;
  subject: string;
  message: string;
  eventName: string;
  requirementName: string;
  dueDate: string | null;
};

let transporter: nodemailer.Transporter | null = null;

export async function sendVerificationEmail(payload: VerificationEmailPayload) {
  const transport = await getTransporter();

  await transport.sendMail({
    from: env.emailFrom,
    to: payload.email,
    subject: "Verify your FightOps email",
    text: [
      `Hi ${payload.displayName || "there"},`,
      "",
      "Use the verification code below to verify your email address:",
      payload.otpCode,
      "",
      `This code expires in ${env.authOtpExpiresInMinutes} minutes.`,
    ].join("\n"),
    html: `
      <p>Hi ${escapeHtml(payload.displayName || "there")},</p>
      <p>Use the verification code below to verify your email address:</p>
      <p><strong style="font-size:24px;letter-spacing:4px;">${escapeHtml(payload.otpCode)}</strong></p>
      <p>This code expires in ${env.authOtpExpiresInMinutes} minutes.</p>
    `,
  });
}

export async function sendPasswordResetEmail(payload: PasswordResetEmailPayload) {
  const transport = await getTransporter();

  await transport.sendMail({
    from: env.emailFrom,
    to: payload.email,
    subject: "Reset your FightOps password",
    text: [
      `Hi ${payload.displayName || "there"},`,
      "",
      "Use the link below to reset your password:",
      payload.resetUrl,
      "",
      `If needed, your reset token is: ${payload.resetToken}`,
      `This link expires in ${env.authResetTokenExpiresInMinutes} minutes.`,
    ].join("\n"),
    html: `
      <p>Hi ${escapeHtml(payload.displayName || "there")},</p>
      <p>Use the link below to reset your password:</p>
      <p><a href="${escapeHtml(payload.resetUrl)}">${escapeHtml(payload.resetUrl)}</a></p>
      <p>If needed, your reset token is <strong>${escapeHtml(payload.resetToken)}</strong>.</p>
      <p>This link expires in ${env.authResetTokenExpiresInMinutes} minutes.</p>
    `,
  });
}

export async function sendOperationalReminderEmail(
  payload: OperationalReminderEmailPayload,
) {
  const transport = await getTransporter();
  const dueDateLabel = payload.dueDate ? payload.dueDate.slice(0, 10) : "the deadline";

  await transport.sendMail({
    from: env.emailFrom,
    to: payload.email,
    subject: payload.subject,
    text: [
      `Hi ${payload.recipientName || "there"},`,
      "",
      payload.message,
      "",
      `Event: ${payload.eventName}`,
      `Requirement: ${payload.requirementName}`,
      `Due date: ${dueDateLabel}`,
    ].join("\n"),
    html: `
      <p>Hi ${escapeHtml(payload.recipientName || "there")},</p>
      <p>${escapeHtml(payload.message)}</p>
      <p><strong>Event:</strong> ${escapeHtml(payload.eventName)}</p>
      <p><strong>Requirement:</strong> ${escapeHtml(payload.requirementName)}</p>
      <p><strong>Due date:</strong> ${escapeHtml(dueDateLabel)}</p>
    `,
  });
}

async function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    throw new Error("SMTP configuration is incomplete.");
  }

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  return transporter;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
