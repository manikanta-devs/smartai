import nodemailer from "nodemailer";
import { logger } from "../common/utils/logger";

const hasSmtpConfig = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransport = () => {
  if (!hasSmtpConfig()) return null;

  const secure = (process.env.SMTP_SECURE || "false").toLowerCase() === "true";
  const port = Number(process.env.SMTP_PORT || (secure ? 465 : 587));

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

export const sendApplicationConfirmationEmail = async (payload: {
  to: string;
  userName?: string;
  jobTitle: string;
  company: string;
  location?: string | null;
  jobUrl?: string | null;
  applicationId: string;
}) => {
  const transporter = getTransport();
  if (!transporter) {
    logger.warn("SMTP not configured; skipping application confirmation email", { to: payload.to });
    return { sent: false, skipped: true };
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || "no-reply@smartai.local";
  const name = payload.userName || "there";
  const applyLink = payload.jobUrl ? `<p><a href=\"${payload.jobUrl}\">Open job posting</a></p>` : "";

  await transporter.sendMail({
    from,
    to: payload.to,
    subject: `Application submitted: ${payload.jobTitle} at ${payload.company}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
        <h2>Application Submitted</h2>
        <p>Hi ${name}, your application has been recorded successfully.</p>
        <p><strong>Role:</strong> ${payload.jobTitle}</p>
        <p><strong>Company:</strong> ${payload.company}</p>
        <p><strong>Location:</strong> ${payload.location || "India"}</p>
        <p><strong>Application ID:</strong> ${payload.applicationId}</p>
        ${applyLink}
        <p>We have also tracked this in your SmartAI application tracker.</p>
      </div>
    `
  });

  return { sent: true, skipped: false };
};
