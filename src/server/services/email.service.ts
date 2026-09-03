import nodemailer from "nodemailer";
import path from "node:path";

import { env } from "@/server/config/env";
import { renderReminderEmailTemplate } from "@/server/services/email-template.service";

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
  fighterName: string;
  eventDate: string;
  eventLocation: string;
  daysRemaining: string;
  uploadLink: string;
};

type FighterInviteEmailPayload = {
  email: string;
  fighterName: string;
  promoterName: string;
  eventName: string;
  eventDate: string;
  division: string;
  acceptUrl: string;
  expiresInDays: number;
};

let transporter: nodemailer.Transporter | null = null;

export async function sendVerificationEmail(payload: VerificationEmailPayload) {
  const transport = await getTransporter();

  await transport.sendMail({
    from: env.emailFrom,
    to: payload.email,
    attachments: [logoAttachment()],
    subject: "Verify your FightOps email",
    text: [
      `Hi ${payload.displayName || "there"},`,
      "",
      "Use the verification code below to verify your email address:",
      payload.otpCode,
      "",
      `This code expires in ${env.authOtpExpiresInMinutes} minutes.`,
    ].join("\n"),
    html: brandedEmail({
      title: "Verify your email",
      content: `
        <p>Hi ${escapeHtml(payload.displayName || "there")},</p>
        <p>Use the verification code below to verify your email address:</p>
        <div style="margin:24px 0;text-align:center;">
          <span style="display:inline-block;padding:14px 22px;border-radius:10px;background:#edf3ff;color:#2463eb;font-size:28px;font-weight:700;letter-spacing:6px;">${escapeHtml(payload.otpCode)}</span>
        </div>
        <p>This code expires in ${env.authOtpExpiresInMinutes} minutes.</p>
      `,
    }),
  });
}

export async function sendPasswordResetEmail(payload: PasswordResetEmailPayload) {
  const transport = await getTransporter();

  await transport.sendMail({
    from: env.emailFrom,
    to: payload.email,
    attachments: [logoAttachment()],
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
    html: brandedEmail({
      title: "Reset your password",
      content: `
        <p>Hi ${escapeHtml(payload.displayName || "there")},</p>
        <p>Use the button below to choose a new password for your FightOps account.</p>
        ${emailButton("Reset password", payload.resetUrl)}
        <p style="color:#64748b;font-size:13px;">This link expires in ${env.authResetTokenExpiresInMinutes} minutes.</p>
        <p style="color:#64748b;font-size:13px;">If the button does not work, use this link: ${escapeHtml(payload.resetUrl)}</p>
      `,
    }),
  });
}

export async function sendOperationalReminderEmail(
  payload: OperationalReminderEmailPayload,
) {
  const transport = await getTransporter();
  const dueDateLabel = payload.dueDate ? payload.dueDate.slice(0, 10) : "the deadline";
  const templateValues = {
    recipientName: payload.recipientName || "there",
    fighterName: payload.fighterName,
    eventName: payload.eventName,
    eventDate: payload.eventDate,
    eventLocation: payload.eventLocation,
    requirementName: payload.requirementName,
    dueDate: dueDateLabel,
    daysRemaining: payload.daysRemaining,
    uploadLink: payload.uploadLink,
  };
  const subject = renderReminderEmailTemplate(payload.subject, templateValues);
  const message = renderReminderEmailTemplate(payload.message, templateValues);

  await transport.sendMail({
    from: env.emailFrom,
    to: payload.email,
    attachments: [logoAttachment()],
    subject,
    text: [
      `Hi ${payload.recipientName || "there"},`,
      "",
      message,
      "",
      `Event: ${payload.eventName}`,
      `Requirement: ${payload.requirementName}`,
      `Due date: ${dueDateLabel}`,
      `Days remaining: ${payload.daysRemaining}`,
      `Upload documents: ${payload.uploadLink}`,
    ].join("\n"),
    html: brandedEmail({
      title: escapeHtml(payload.requirementName),
      content: `
        <p>Hi ${escapeHtml(payload.recipientName || "there")},</p>
        <p>${escapeHtml(message)}</p>
        <div style="margin:22px 0;padding:16px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;">
          <p style="margin:0 0 8px;"><strong>Event:</strong> ${escapeHtml(payload.eventName)}</p>
          <p style="margin:0 0 8px;"><strong>Event date:</strong> ${escapeHtml(payload.eventDate)}</p>
          <p style="margin:0 0 8px;"><strong>Location:</strong> ${escapeHtml(payload.eventLocation)}</p>
          <p style="margin:0 0 8px;"><strong>Due date:</strong> ${escapeHtml(dueDateLabel)}</p>
          <p style="margin:0;"><strong>Days remaining:</strong> ${escapeHtml(payload.daysRemaining)}</p>
        </div>
        ${emailButton("Upload documents", payload.uploadLink)}
      `,
    }),
  });
}

export async function sendFighterInviteEmail(payload: FighterInviteEmailPayload) {
  const transport = await getTransporter();

  await transport.sendMail({
    from: env.emailFrom,
    to: payload.email,
    attachments: [logoAttachment()],
    subject: `You're invited to ${payload.eventName}`,
    text: [
      `Hi ${payload.fighterName || "there"},`,
      "",
      `${payload.promoterName} invited you to join ${payload.eventName}.`,
      `Division: ${payload.division}`,
      `Event date: ${payload.eventDate}`,
      "",
      "Use the link below to accept your invite and set your password:",
      payload.acceptUrl,
      "",
      `This invite expires in ${payload.expiresInDays} day${
        payload.expiresInDays === 1 ? "" : "s"
      }.`,
    ].join("\n"),
    html: brandedEmail({
      title: "You are invited to FightOps",
      content: `
        <p>Hi ${escapeHtml(payload.fighterName || "there")},</p>
        <p><strong>${escapeHtml(payload.promoterName)}</strong> invited you to join <strong>${escapeHtml(payload.eventName)}</strong>.</p>
        <div style="margin:22px 0;padding:16px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;">
          <p style="margin:0 0 8px;"><strong>Division:</strong> ${escapeHtml(payload.division)}</p>
          <p style="margin:0;"><strong>Event date:</strong> ${escapeHtml(payload.eventDate)}</p>
        </div>
        <p>Accept the invite to review the fight details and set your password.</p>
        ${emailButton("Accept invitation", payload.acceptUrl)}
        <p style="color:#64748b;font-size:13px;">This invite expires in ${payload.expiresInDays} day${
          payload.expiresInDays === 1 ? "" : "s"
        }.</p>
      `,
    }),
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

function brandedEmail(params: { title: string; content: string }) {
  return `
    <div style="margin:0;background:#f1f6fc;padding:32px 16px;font-family:Inter,Arial,sans-serif;color:#17233d;line-height:1.6;">
      <div style="display:none;max-height:0;overflow:hidden;">${params.title} | FightOps AI</div>
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #dbe5f0;border-radius:16px;overflow:hidden;">
        <div style="padding:22px 28px;background:#07090d;color:#ffffff;">
          <img src="cid:fightops-logo" alt="FightOps AI" style="display:block;width:auto;height:34px;max-width:220px;" />
          <span style="display:none;font-size:22px;font-weight:700;letter-spacing:-.5px;">FightOps <span style="color:#94a3b8;font-size:14px;">AI</span></span>
        </div>
        <div style="padding:28px;">
          <h1 style="margin:0 0 20px;font-size:24px;line-height:1.25;color:#17233d;">${params.title}</h1>
          ${params.content}
        </div>
        <div style="padding:18px 28px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;">
          FightOps AI · Fighter operations workspace
        </div>
      </div>
    </div>
  `;
}

function logoAttachment() {
  return {
    filename: "logo_inverted.png",
    path: path.join(process.cwd(), "public", "brand", "logo_inverted.png"),
    cid: "fightops-logo",
  };
}

function emailButton(label: string, url: string) {
  return `
    <p style="margin:26px 0;">
      <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#2864eb;color:#ffffff;text-decoration:none;font-weight:600;">${label}</a>
    </p>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
