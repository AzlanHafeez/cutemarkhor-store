/**
 * Cute Markhor Store — Contact Form Processor (Vercel Serverless / Node)
 * Uses the same env vars as api/process-order.js
 */

const formidable = require('formidable');
const nodemailer = require('nodemailer');

function first(v) {
  return Array.isArray(v) ? v[0] : v;
}
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed.' });
    return;
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields) => {
    if (err) {
      res.status(200).json({ success: false, message: 'Form parse error.' });
      return;
    }

    const name = escapeHtml(first(fields.name));
    const email = String(first(fields.email) || '').trim();
    const subject = escapeHtml(first(fields.subject) || 'Website Contact Form');
    const message = escapeHtml(first(fields.message));

    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) {
      res.status(200).json({ success: false, message: 'Please fill all required fields correctly.' });
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'ssl',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      await transporter.sendMail({
        from: `"${process.env.MAIL_FROM_NAME || 'Cute Markhor Store'}" <${process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL,
        replyTo: email,
        subject: `New Contact Message - Cute Markhor Store: ${subject}`,
        html: `<h3>New Contact Form Submission</h3><p><b>Name:</b> ${name}</p><p><b>Email:</b> ${escapeHtml(email)}</p><p><b>Subject:</b> ${subject}</p><p><b>Message:</b><br>${message.replace(/\n/g, '<br>')}</p>`,
        text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`,
      });

      res.status(200).json({ success: true, message: 'Message sent.' });
    } catch (e) {
      res.status(200).json({ success: false, message: 'Email delivery failed: ' + (e.message || e) });
    }
  });
};
