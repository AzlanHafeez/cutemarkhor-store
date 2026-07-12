<?php
/**
 * ============================================================
 * ONE-TIME SMTP TEST — Cute Markhor Store
 * ------------------------------------------------------------
 * Upload this file into your /php folder on your live hosting,
 * then open it directly in your browser:
 *
 *   https://yourdomain.com/php/test_mail.php
 *
 * It will show you EXACTLY why email is or isn't sending —
 * full SMTP conversation log, not a hidden/generic error.
 *
 * DELETE THIS FILE from your server once emails are working.
 * It has no spam/abuse protection and isn't meant to stay live.
 * ============================================================
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');

require __DIR__ . '/config.php';
require __DIR__ . '/PHPMailer/src/Exception.php';
require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

echo "<pre style='background:#111;color:#0f0;padding:20px;font-size:13px;white-space:pre-wrap;'>";

echo "Config check:\n";
echo "SMTP_HOST     = " . SMTP_HOST . "\n";
echo "SMTP_PORT     = " . SMTP_PORT . "\n";
echo "SMTP_SECURE   = " . SMTP_SECURE . "\n";
echo "SMTP_USERNAME = " . SMTP_USERNAME . "\n";
echo "SMTP_PASSWORD = " . (SMTP_PASSWORD === 'PUT_YOUR_16_CHAR_APP_PASSWORD_HERE' ? "❌ STILL THE PLACEHOLDER — this is why nothing sends. Edit config.php." : str_repeat('*', strlen(SMTP_PASSWORD)) . " (looks set)") . "\n";
echo "ADMIN_EMAIL   = " . ADMIN_EMAIL . "\n\n";

echo "Attempting to connect and send a test email...\n\n";

$mail = new PHPMailer(true);

try {
    $mail->SMTPDebug = 2; // print full SMTP conversation
    $mail->Debugoutput = function($str, $level) {
        echo htmlspecialchars($str) . "\n";
    };

    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USERNAME;
    $mail->Password   = SMTP_PASSWORD;
    $mail->SMTPSecure = SMTP_SECURE === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = SMTP_PORT;

    $mail->setFrom(MAIL_FROM_EMAIL, MAIL_FROM_NAME);
    $mail->addAddress(ADMIN_EMAIL);
    $mail->Subject = 'Cute Markhor Store — SMTP Test';
    $mail->Body    = 'If you are reading this in your inbox, SMTP is working correctly.';

    $mail->send();
    echo "\n\n✅ SUCCESS — test email sent. Check " . ADMIN_EMAIL . " (and Spam folder).\n";
} catch (Exception $e) {
    echo "\n\n❌ FAILED — PHPMailer error: " . $mail->ErrorInfo . "\n";
    echo "\nCommon causes:\n";
    echo "1. SMTP_PASSWORD in config.php is still the placeholder, or is your normal Gmail password instead of an App Password.\n";
    echo "2. Your host blocks outgoing SMTP ports (587/465) on shared hosting — contact your host and ask, or switch to their own SMTP.\n";
    echo "3. 2-Step Verification isn't enabled on the Gmail account, so no App Password could be generated.\n";
    echo "4. Wrong SMTP_HOST/SMTP_PORT/SMTP_SECURE combination for your provider.\n";
}

echo "</pre>";
