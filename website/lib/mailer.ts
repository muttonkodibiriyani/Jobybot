/** Gmail SMTP via Nodemailer — used for admin notify + customer delivery. */
import nodemailer from "nodemailer";

const GMAIL = process.env.GMAIL_ADDRESS;
const APP_PW = process.env.GMAIL_APP_PASSWORD;
const FROM_NAME = process.env.GMAIL_FROM_NAME ?? "Jobybot";

function transporter() {
  if (!GMAIL || !APP_PW) {
    throw new Error("GMAIL_ADDRESS / GMAIL_APP_PASSWORD missing — set them in .env.local");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL, pass: APP_PW },
  });
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer | string; contentType?: string }[];
  replyTo?: string;
}): Promise<void> {
  const t = transporter();
  await t.sendMail({
    from: `"${FROM_NAME}" <${GMAIL}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    attachments: opts.attachments,
    replyTo: opts.replyTo,
  });
}

export async function sendAdminNotify(order: {
  id: string;
  name: string;
  email: string;
  phone: string;
  amountInr: number;
  txnRef: string;
  txnTime: string;
}, screenshot?: { filename: string; content: Buffer; contentType: string }): Promise<void> {
  if (!GMAIL) return;
  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin`;
  await sendMail({
    to: GMAIL,
    subject: `[Jobybot] New order ${order.id} — ₹${order.amountInr} from ${order.name}`,
    html: `
      <h2>New Jobybot order pending verification</h2>
      <table cellpadding="6">
        <tr><td><b>Order ID</b></td><td>${order.id}</td></tr>
        <tr><td><b>Name</b></td><td>${order.name}</td></tr>
        <tr><td><b>Email</b></td><td>${order.email}</td></tr>
        <tr><td><b>Phone</b></td><td>${order.phone}</td></tr>
        <tr><td><b>Amount</b></td><td>₹${order.amountInr}</td></tr>
        <tr><td><b>Txn reference</b></td><td>${order.txnRef}</td></tr>
        <tr><td><b>Txn time</b></td><td>${order.txnTime}</td></tr>
      </table>
      <p style="margin-top:24px"><a href="${adminUrl}" style="background:#FF6B00;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Open admin → verify</a></p>
    `,
    attachments: screenshot ? [screenshot] : undefined,
  });
}

/**
 * Sent the moment the owner approves a payment in /admin.
 * The customer's account flips to "active" → they can sign in at /login.
 */
export async function sendActivationEmail(customer: {
  name: string;
  email: string;
  orderId: string;
}): Promise<void> {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com").replace(/\/$/, "");
  await sendMail({
    to: customer.email,
    subject: "Your JobyBots account is active — sign in to download",
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:580px;margin:0 auto;color:#0f172a">
        <h2 style="margin:0 0 8px">Hi ${escape(customer.name)}, you're in.</h2>
        <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6">
          Your UPI payment is verified and your JobyBots account is now <strong>active</strong>.
          Sign in with the email or phone you registered, plus your password.
        </p>

        <p style="margin:24px 0">
          <a href="${site}/login?id=${encodeURIComponent(customer.email)}"
             style="background:#FF6B00;color:#fff;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:600;display:inline-block">
            Sign in to your portal →
          </a>
        </p>

        <h3 style="margin:28px 0 10px;font-size:16px">What happens after sign-in</h3>
        <ol style="margin:0;padding-left:20px;color:#334155;line-height:1.7;font-size:14px">
          <li>The portal walks you through a 6-step config wizard (Gmail App Password, Gemini key, target roles).</li>
          <li>Click <strong>Download personalised ZIP</strong> — your <code>.env</code> + install scripts come bundled in one file.</li>
          <li>On your laptop: double-click <code>INSTALL-WINDOWS.bat</code> or <code>INSTALL-MAC.command</code>.</li>
          <li>First run takes ~3 minutes. Then JobyBots is hunting jobs for you 24/7.</li>
        </ol>

        <p style="margin:32px 0 0;padding:16px;background:#FFF7ED;border-left:3px solid #FF6B00;border-radius:6px;font-size:13px;color:#7c2d12;line-height:1.6">
          <strong>Privacy reminder:</strong> the config wizard runs in your browser. Your Gmail
          App Password and Gemini key never reach our servers — verify in DevTools → Network.
          See <a href="${site}/security" style="color:#7c2d12">how this works</a>.
        </p>

        <p style="margin:28px 0 0;color:#64748b;font-size:12px">
          Order ${escape(customer.orderId)} · Reply to this email if anything's off — I personally read every one.
        </p>
        <p style="margin:6px 0 0;color:#64748b;font-size:12px">
          <a href="${site}/refund" style="color:#64748b">7-day refund policy</a> ·
          <a href="${site}/security" style="color:#64748b">Security</a> ·
          <a href="${site}/install" style="color:#64748b">Install walkthrough</a>
        </p>
      </div>
    `,
  });
}

/**
 * Sent if the owner can't verify a UPI transaction. Polite, actionable.
 */
export async function sendRejectionEmail(payload: {
  name: string;
  email: string;
  orderId: string;
  reason: string;
}): Promise<void> {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobybots.com").replace(/\/$/, "");
  await sendMail({
    to: payload.email,
    subject: "We couldn't verify your JobyBots payment — quick fix inside",
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:580px;margin:0 auto;color:#0f172a">
        <h2 style="margin:0 0 8px">Hi ${escape(payload.name)},</h2>
        <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6">
          I tried to verify your UPI payment (Order <code>${escape(payload.orderId)}</code>)
          and couldn't make the match. Here's what I saw:
        </p>
        <blockquote style="margin:0 0 20px;padding:12px 16px;background:#FEF2F2;border-left:3px solid #DC2626;border-radius:6px;color:#7f1d1d;font-size:14px">
          ${escape(payload.reason)}
        </blockquote>
        <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.6">
          Two easy fixes:
        </p>
        <ol style="margin:0;padding-left:20px;color:#334155;line-height:1.7;font-size:14px">
          <li><strong>Reply to this email</strong> with a fresh screenshot showing the UPI ref + timestamp.</li>
          <li><strong>WhatsApp +971 50 561 9548</strong> — I'll fix it inside an hour.</li>
        </ol>
        <p style="margin:28px 0 0;color:#475569;font-size:14px">
          If you'd rather just be refunded, no questions asked:
          <a href="${site}/refund" style="color:#FF6B00;font-weight:600">request a refund</a>
          (5 business days back to the same UPI).
        </p>
        <p style="margin:36px 0 0;color:#64748b;font-size:12px">
          Order ${escape(payload.orderId)}
        </p>
      </div>
    `,
  });
}

/** Kept for backwards compatibility with existing call sites. */
export async function sendDeliveryEmail(customer: {
  name: string;
  email: string;
  id: string;
}): Promise<void> {
  await sendActivationEmail({
    name: customer.name,
    email: customer.email,
    orderId: customer.id,
  });
}

function escape(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]!));
}
