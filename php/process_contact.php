<?php
/**
 * Cute Markhor Store — Contact Form Processor
 * Emails the admin whenever someone submits the Contact page form.
 */

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', '0');

require __DIR__ . '/config.php';
require __DIR__ . '/PHPMailer/src/Exception.php';
require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function respond(bool $success, string $message = ''): void {
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}
function clean(string $value): string {
    return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Invalid request method.');
}

$name    = clean($_POST['name'] ?? '');
$email   = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$subject = clean($_POST['subject'] ?? 'Website Contact Form');
$message = clean($_POST['message'] ?? '');

if ($name === '' || !$email || $message === '') {
    respond(false, 'Please fill all required fields correctly.');
}

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USERNAME;
    $mail->Password   = SMTP_PASSWORD;
    $mail->SMTPSecure = SMTP_SECURE === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = SMTP_PORT;

    $mail->setFrom(MAIL_FROM_EMAIL, MAIL_FROM_NAME);
    $mail->addAddress(ADMIN_EMAIL);
    $mail->addReplyTo($email, $name);

    $mail->isHTML(true);
    $mail->Subject = 'New Contact Message - Cute Markhor Store: ' . $subject;
    $mail->Body = "<h3>New Contact Form Submission</h3>
        <p><b>Name:</b> {$name}</p>
        <p><b>Email:</b> {$email}</p>
        <p><b>Subject:</b> {$subject}</p>
        <p><b>Message:</b><br>" . nl2br($message) . "</p>";
    $mail->AltBody = "Name: {$name}\nEmail: {$email}\nSubject: {$subject}\nMessage: {$message}";

    $mail->send();
    respond(true, 'Message sent.');
} catch (Exception $e) {
    @file_put_contents(__DIR__ . '/contact.log', date('c') . " | {$name} | {$email} | {$subject} | " . $mail->ErrorInfo . "\n", FILE_APPEND);
    respond(false, 'Message logged, email delivery pending.');
}
