<?php
/**
 * ============================================================
 * Cute Markhor Store — SMTP / Site Configuration
 * ============================================================
 * Fill in your real SMTP credentials below, then upload this
 * whole /php folder to your Hostinger/cPanel hosting.
 *
 * RECOMMENDED (Gmail):
 *   1. Turn on 2-Step Verification on azlanhafeez329@gmail.com
 *   2. Create an "App Password": myaccount.google.com/apppasswords
 *   3. Use that 16-character app password below (NOT your normal Gmail password)
 *
 * ALTERNATIVE: use your hosting's own SMTP (e.g. mail.cutemarkhorstore.com)
 * if your host (Hostinger) provides one — ask their support for the
 * host/port/username/password, then paste them below instead.
 * ============================================================
 */

// ---- SMTP SETTINGS ----
define('SMTP_HOST', 'smtp.gmail.com');          // e.g. smtp.gmail.com or mail.yourdomain.com
define('SMTP_PORT', 587);                        // 587 = TLS, 465 = SSL
define('SMTP_SECURE', 'tls');                    // 'tls' or 'ssl'
define('SMTP_USERNAME', 'azlanhafeez329@gmail.com'); // the email that SENDS the notification
define('SMTP_PASSWORD', 'PUT_YOUR_16_CHAR_APP_PASSWORD_HERE');

// ---- FROM / TO ----
define('MAIL_FROM_EMAIL', 'azlanhafeez329@gmail.com');
define('MAIL_FROM_NAME', 'Cute Markhor Store');
define('ADMIN_EMAIL', 'azlanhafeez329@gmail.com');

// ---- UPLOAD SETTINGS ----
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('MAX_UPLOAD_BYTES', 5 * 1024 * 1024); // 5MB
define('ALLOWED_MIME_TYPES', ['image/jpeg', 'image/png', 'image/webp']);
