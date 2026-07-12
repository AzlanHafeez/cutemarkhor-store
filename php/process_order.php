<?php
/**
 * ============================================================
 * Cute Markhor Store — Order Processor
 * ------------------------------------------------------------
 * Receives checkout form data + payment screenshot, validates
 * and sanitizes everything, saves the screenshot securely, and
 * emails the full order to the ADMIN ONLY via PHPMailer/SMTP.
 *
 * The customer never sees this response body directly — the
 * front-end (script.js) always shows the "Order Confirmed"
 * modal regardless of what happens here, per the project spec.
 * This file exists so the admin reliably gets every order by
 * email, with proper validation and a stored audit trail.
 * ============================================================
 */

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', '0'); // never leak PHP errors to the client

require __DIR__ . '/config.php';
require __DIR__ . '/PHPMailer/src/Exception.php';
require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function respond(bool $success, string $message = '', array $extra = []): void {
    echo json_encode(array_merge(['success' => $success, 'message' => $message], $extra));
    exit;
}

function clean(string $value): string {
    return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Invalid request method.');
}

// ---------- Honeypot / basic spam guard ----------
if (!empty($_POST['website'] ?? '')) {
    respond(true, 'OK'); // silently drop bots, but don't reveal detection to caller
}

// ---------- Validate required fields ----------
$fullName      = clean($_POST['full_name'] ?? '');
$email         = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$whatsapp      = clean($_POST['whatsapp'] ?? '');
$productName   = clean($_POST['product_name'] ?? 'ESP32 WiFi Development Module');
$productPrice  = clean($_POST['product_price'] ?? '');
$paymentMethodRaw = clean($_POST['payment_method'] ?? '');

$allowedMethods = ['easypaisa' => 'EasyPaisa', 'jazzcash' => 'JazzCash', 'binance' => 'Binance USDT'];
$paymentMethod = $allowedMethods[$paymentMethodRaw] ?? null;

$errors = [];
if ($fullName === '' || mb_strlen($fullName) < 2) $errors[] = 'Invalid name.';
if (!$email) $errors[] = 'Invalid email.';
if (!preg_match('/^[0-9+\-\s]{10,15}$/', $whatsapp)) $errors[] = 'Invalid WhatsApp number.';
if (!$paymentMethod) $errors[] = 'Invalid payment method.';
if (empty($_FILES['screenshot']) || $_FILES['screenshot']['error'] !== UPLOAD_ERR_OK) $errors[] = 'Screenshot upload failed.';

if (!empty($errors)) {
    respond(false, implode(' ', $errors));
}

// ---------- Validate & store screenshot securely ----------
$file = $_FILES['screenshot'];

if ($file['size'] > MAX_UPLOAD_BYTES) {
    respond(false, 'Screenshot is larger than 5MB.');
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mime, ALLOWED_MIME_TYPES, true)) {
    respond(false, 'Unsupported file type.');
}

$extMap = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
$ext = $extMap[$mime];
$safeName = 'order_' . date('Ymd_His') . '_' . bin2hex(random_bytes(6)) . '.' . $ext;

if (!is_dir(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}
// Prevent execution of anything uploaded here
$htaccessPath = UPLOAD_DIR . '.htaccess';
if (!file_exists($htaccessPath)) {
    file_put_contents($htaccessPath, "php_flag engine off\nAddHandler cgi-script .php .phtml .php3 .pl .py .jsp .asp .sh .cgi\nOptions -ExecCGI\n");
}

$destPath = UPLOAD_DIR . $safeName;
if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    respond(false, 'Could not save screenshot.');
}

// ---------- Gather metadata ----------
$orderDate = date('Y-m-d');
$orderTime = date('H:i:s');
$ip = clean($_SERVER['REMOTE_ADDR'] ?? 'Unknown');
$browser = clean($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown');

// ---------- Build & send admin email ----------
$mail = new PHPMailer(true);
$mailSent = false;
$mailError = '';

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
    $mail->addReplyTo($email, $fullName);

    $mail->isHTML(true);
    $mail->Subject = 'New Order Received - Cute Markhor Store';
    $mail->Body = "
        <h2>New Order Received</h2>
        <table cellpadding='6' style='border-collapse:collapse;'>
          <tr><td><b>Customer Name</b></td><td>{$fullName}</td></tr>
          <tr><td><b>Customer Email</b></td><td>{$email}</td></tr>
          <tr><td><b>WhatsApp Number</b></td><td>{$whatsapp}</td></tr>
          <tr><td><b>Product</b></td><td>{$productName}</td></tr>
          <tr><td><b>Price</b></td><td>PKR {$productPrice}</td></tr>
          <tr><td><b>Payment Method</b></td><td>{$paymentMethod}</td></tr>
          <tr><td><b>Order Date</b></td><td>{$orderDate}</td></tr>
          <tr><td><b>Order Time</b></td><td>{$orderTime}</td></tr>
          <tr><td><b>IP Address</b></td><td>{$ip}</td></tr>
          <tr><td><b>Browser</b></td><td>{$browser}</td></tr>
        </table>
        <p>Payment screenshot attached.</p>
    ";
    $mail->AltBody = "New Order Received\nName: {$fullName}\nEmail: {$email}\nWhatsApp: {$whatsapp}\nProduct: {$productName}\nPrice: PKR {$productPrice}\nPayment: {$paymentMethod}\nDate: {$orderDate} {$orderTime}\nIP: {$ip}";

    $mail->addAttachment($destPath, 'payment_screenshot.' . $ext);

    $mail->send();
    $mailSent = true;
} catch (Exception $e) {
    $mailError = $mail->ErrorInfo;
}

// Always log locally too, in case email delivery fails (admin can review manually)
$logLine = sprintf(
    "[%s %s] %s | %s | %s | %s | PKR %s | %s | mail_sent=%s %s\n",
    $orderDate, $orderTime, $fullName, $email, $whatsapp, $productName, $productPrice, $paymentMethod,
    $mailSent ? 'yes' : 'no', $mailError
);
@file_put_contents(__DIR__ . '/orders.log', $logLine, FILE_APPEND);

respond(true, $mailSent ? 'Order received and emailed to admin.' : 'Order received and logged (email delivery pending).');
