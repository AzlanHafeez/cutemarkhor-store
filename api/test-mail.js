/**
 * ============================================================
 * ONE-TIME SMTP TEST — Cute Markhor Store (Vercel)
 * ------------------------------------------------------------
 * After deploying, open this in your browser once:
 *   https://yourproject.vercel.app/api/test-mail
 *
 * It sends a test email using your Vercel Environment Variables
 * and reports back exactly what happened. DELETE this file (or
 * remove the route) once email is confirmed working — it has no
 * abuse protection and isn't meant to stay live.
 * ============================================================
 */

const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'ADMIN_EMAIL'];
  const missing = required.filter((k) => !process.env[k]);

  if (missing.length) {
    res.status(200).send(
      `Missing environment variables in Vercel: ${missing.join(', ')}\n\n` +
      `Go to your Vercel project → Settings → Environment Variables and add them, then redeploy.`
    );
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'ssl',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.verify();

    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || 'Cute Markhor Store'}" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: 'Cute Markhor Store — SMTP Test (Vercel)',
      text: 'If you are reading this in your inbox, SMTP is working correctly on Vercel.',
    });

    res.status(200).send(`✅ SUCCESS — test email sent to ${process.env.ADMIN_EMAIL}. Check inbox and Spam folder.`);
  } catch (e) {
    res.status(200).send(
      `❌ FAILED — ${e.message || e}\n\n` +
      `Common causes:\n` +
      `1. SMTP_PASS is your normal Gmail password instead of a 16-char App Password.\n` +
      `2. SMTP_HOST/SMTP_PORT/SMTP_SECURE don't match your provider.\n` +
      `3. Environment variables were added but the project wasn't redeployed afterward.`
    );
  }
};
