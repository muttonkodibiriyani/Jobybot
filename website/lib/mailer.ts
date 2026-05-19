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

export async function sendDeliveryEmail(customer: { name: string; email: string; id: string }): Promise<void> {
  const link = process.env.INSTALLER_DOWNLOAD_URL ?? "";
  await sendMail({
    to: customer.email,
    subject: "Your Jobybot Pro download — Order " + customer.id,
    html: `
      <h2 style="font-family:system-ui">Hi ${customer.name}, your Jobybot Pro is ready.</h2>
      <p>Thank you for your purchase. Here is your download link:</p>
      <p style="margin:24px 0">
        <a href="${link}" style="background:#FF6B00;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600">Download Jobybot Pro</a>
      </p>
      <p>What's next:</p>
      <ol>
        <li>Unzip <code>Jobybot-Pro-Setup.zip</code>.</li>
        <li>Double-click <code>SETUP_FOR_FRIENDS.bat</code>.</li>
        <li>Run <code>RUN_BOT_NOW.bat</code> for your first cycle.</li>
      </ol>
      <p>Full guide: docs/USER_GUIDE.md inside the zip.</p>
      <p>Reply to this email for any help.</p>
      <p style="color:#888;font-size:12px;margin-top:36px">Order ${customer.id}</p>
    `,
  });
}
