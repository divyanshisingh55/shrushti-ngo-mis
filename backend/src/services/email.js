const nodemailer = require("nodemailer");

// Configure transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail({ to, subject, html, text }) {
  const mailOptions = {
    from: process.env.SMTP_FROM || `"Shrushti MIS Portal" <no-reply@shrushtisavasamiti.org>`,
    to,
    subject,
    text,
    html,
  };

  // Development Fallback: Log to console if SMTP credentials are missing
  if (!process.env.SMTP_USER) {
    console.log("========================================");
    console.log("📨 EMAIL DISPATCH (DEVELOPMENT FALLBACK)");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${text || html}`);
    console.log("========================================");
    return { messageId: "dev-simulated-id" };
  }

  return transporter.sendMail(mailOptions);
}

module.exports = { sendEmail };
