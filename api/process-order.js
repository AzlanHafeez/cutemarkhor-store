/**
 * ============================================================
 * Cute Markhor Store — Order Processor (Vercel Serverless / Node)
 * ------------------------------------------------------------
 * Replaces php/process_order.php for deployments hosted on Vercel.
 * Parses the multipart checkout form (incl. payment screenshot),
 * validates it, and emails the ADMIN ONLY via SMTP (Nodemailer).
 *
 * Required Vercel Environment Variables (Project Settings → Environment Variables):
 *   SMTP_HOST      e.g. smtp.gmail.com
 *   SMTP_PORT      e.g. 587
 *   SMTP_SECURE    "tls" or "ssl"
 *   SMTP_USER      the sending email address
 *   SMTP_PASS      Gmail App Password (16 chars, NOT your normal password)
 *   MAIL_FROM_NAME e.g. Cute Markhor Store
 *   ADMIN_EMAIL    azlanhafeez329@gmail.com
 * ============================================================
 */

const formidable = require('formidable');
const nodemailer = require('nodemailer');
const fs = require('fs');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;
const PAYMENT_LABELS = { easypaisa: 'EasyPaisa', jazzcash: 'JazzCash', binance: 'Binance USDT' };

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

  const form = new formidable.IncomingForm({
    maxFileSize: MAX_BYTES,
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(200).json({ success: false, message: 'Upload failed or file too large (max 5MB).' });
      return;
    }

    // Honeypot
    if (first(fields.website)) {
      res.status(200).json({ success: true, message: 'OK' });
      return;
    }

    const fullName = escapeHtml(first(fields.full_name));
    const email = String(first(fields.email) || '').trim();
    const whatsapp = escapeHtml(first(fields.whatsapp));
    const productName = escapeHtml(first(fields.product_name) || 'ESP32 WiFi Development Module');
    const productPrice = escapeHtml(first(fields.product_price));
    const paymentKey = String(first(fields.payment_method) || '');
    const paymentMethod = PAYMENT_LABELS[paymentKey];

    const errors = [];
    if (!fullName || fullName.length < 2) errors.push('Invalid name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email.');
    if (!/^[0-9+\-\s]{10,15}$/.test(whatsapp)) errors.push('Invalid WhatsApp number.');
    if (!paymentMethod) errors.push('Invalid payment method.');

    const screenshot = first(files.screenshot);
    if (!screenshot) errors.push('Screenshot upload failed.');

    if (errors.length) {
      res.status(200).json({ success: false, message: errors.join(' ') });
      return;
    }

    if (!ALLOWED_MIME.includes(screenshot.mimetype)) {
      res.status(200).json({ success: false, message: 'Unsupported file type.' });
      return;
    }
    if (screenshot.size > MAX_BYTES) {
      res.status(200).json({ success: false, message: 'Screenshot is larger than 5MB.' });
      return;
    }

    const buffer = fs.readFileSync(screenshot.filepath);
    const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    const ext = extMap[screenshot.mimetype];

    const orderDate = new Date().toISOString().slice(0, 10);
    const orderTime = new Date().toISOString().slice(11, 19);
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    const browser = req.headers['user-agent'] || 'Unknown';

    let mailSent = false;
    let mailError = '';

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
        subject: 'New Order Received - Cute Markhor Store',
        html: `
          <h2>New Order Received</h2>
          <table cellpadding="6" style="border-collapse:collapse;">
            <tr><td><b>Customer Name</b></td><td>${fullName}</td></tr>
            <tr><td><b>Customer Email</b></td><td>${escapeHtml(email)}</td></tr>
            <tr><td><b>WhatsApp Number</b></td><td>${whatsapp}</td></tr>
            <tr><td><b>Product</b></td><td>${productName}</td></tr>
            <tr><td><b>Price</b></td><td>PKR ${productPrice}</td></tr>
            <tr><td><b>Payment Method</b></td><td>${paymentMethod}</td></tr>
            <tr><td><b>Order Date</b></td><td>${orderDate}</td></tr>
            <tr><td><b>Order Time</b></td><td>${orderTime}</td></tr>
            <tr><td><b>IP Address</b></td><td>${escapeHtml(ip)}</td></tr>
            <tr><td><b>Browser</b></td><td>${escapeHtml(browser)}</td></tr>
          </table>
          <p>Payment screenshot attached.</p>
        `,
        text: `New Order Received\nName: ${fullName}\nEmail: ${email}\nWhatsApp: ${whatsapp}\nProduct: ${productName}\nPrice: PKR ${productPrice}\nPayment: ${paymentMethod}\nDate: ${orderDate} ${orderTime}\nIP: ${ip}`,
        attachments: [{ filename: `payment_screenshot.${ext}`, content: buffer }],
      });

      mailSent = true;
    } catch (e) {
      mailError = e.message || String(e);
    } finally {
      fs.unlink(screenshot.filepath, () => {});
    }

    res.status(200).json({
      success: true, // customer-facing flow always shows the confirmation modal regardless
      mailSent,
      message: mailSent ? 'Order emailed to admin.' : `Order received but email failed: ${mailError}`,
    });
  });
};
