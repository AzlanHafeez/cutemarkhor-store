# Cute Markhor Store — Deployment Guide

Is project mein **do backend versions** hain — jahan bhi deploy karein, sirf wahi wala use hoga:

- **Vercel** → `/api/process-order.js` + `/api/process-contact.js` (Node.js, Nodemailer) ← **aap ye use kar rahe hain**
- **Traditional PHP hosting** (Hostinger/cPanel) → `/php/process_order.php` + PHPMailer

---

## A. Vercel Par Deploy Karna (aapka current setup)

### 1. Environment Variables Set Karein
Vercel Dashboard → apna project → **Settings → Environment Variables** mein ye add karein:

| Key | Value |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `tls` |
| `SMTP_USER` | `azlanhafeez329@gmail.com` |
| `SMTP_PASS` | apka 16-character Gmail **App Password** (normal password nahi) |
| `MAIL_FROM_NAME` | `Cute Markhor Store` |
| `ADMIN_EMAIL` | `azlanhafeez329@gmail.com` |

Environment variables add/change karne ke baad **Redeploy zaroor karein** (Deployments tab → latest deployment → "..." → Redeploy) — Vercel purani deployment mein naye env vars automatically inject nahi karta.

### 2. Test Karein
Deploy hone ke baad browser mein ye kholein (apna real Vercel URL daal kar):
```
https://yourproject.vercel.app/api/test-mail
```
Ye turant bata dega ke SMTP kaam kar raha hai ya nahi, aur exact error kya hai. **Kaam karne ke baad ye file (`api/test-mail.js`) delete kar dein** ya redeploy se pehle hata dein, kyunke ye publicly accessible hai bina kisi protection ke.

### 3. `php/` Folder Ka Kya Karna Hai
`.vercelignore` already `php/` aur `uploads/` folders ko deployment se exclude karta hai — is liye wo Vercel par upload hi nahi hongay. Ye zaroori hai warna `php/config.php` (jisme password hota) plain text ki tarah publicly serve ho sakti thi, kyunke Vercel `.php` files execute nahi karta.

---

## B. Traditional PHP Hosting (Hostinger / cPanel) — Alternative

Agar kabhi PHP hosting par shift karna ho, neeche steps follow karein.

## 1. Files Upload Karein

Pura `markhor` folder ka **content** (files ke andar wala sab kuch) apne hosting ke `public_html` folder mein upload kar dein — ya to File Manager se, ya FTP se.

Final structure `public_html` mein aisa hona chahiye:
```
public_html/
  index.html
  products.html
  product-details.html
  checkout.html
  about.html
  contact.html
  privacy.html
  terms.html
  robots.txt
  sitemap.xml
  css/style.css
  js/script.js
  php/
    config.php
    process_order.php
    process_contact.php
    PHPMailer/...
  uploads/   (payment screenshots yahan save hongi)
```

## 2. SMTP Set Karein (Zaroori — is ke bina email nahi jayegi)

`php/config.php` file kholein aur ye 2 lines update karein:

```php
define('SMTP_USERNAME', 'azlanhafeez329@gmail.com');
define('SMTP_PASSWORD', 'PUT_YOUR_16_CHAR_APP_PASSWORD_HERE');
```

Gmail App Password banane ka tareeqa:
1. `myaccount.google.com/security` par jayein
2. **2-Step Verification** ON karein (agar pehle se on nahi hai)
3. `myaccount.google.com/apppasswords` par jayein
4. Naya App Password generate karein (name "Cute Markhor Store" de dein)
5. Jo 16-character password milay, wo `SMTP_PASSWORD` mein paste kar dein (normal Gmail password nahi chalega)

Agar Hostinger ka apna SMTP use karna chahein (recommended for reliability), unke support se `mail.yourdomain.com` ka host/port/username/password lein aur wahi values daal dein.

## 3. Permissions

`uploads/` folder par write permission (755 ya 775) honi chahiye taake payment screenshots save ho sakein. Zyada tar Hostinger accounts par ye by default theek hota hai.

## 4. Test Karein

1. Site open karein → koi bhi product "Buy Now" par click karein
2. Checkout form fill karein, payment method choose karein, screenshot upload karein, "Order Now" dabayein
3. Customer ko turant "Order Confirmed" wala success message milega
4. Aap ko `azlanhafeez329@gmail.com` par order ki poori detail + screenshot attachment email mein aani chahiye

Agar email na aaye, `php/orders.log` file check karein (usi `php` folder mein banti hai) — us mein har order ka record aur agar mail fail hui to reason likha hota hai.

## Design Notes

- Theme: dark "circuit-trace" UI jo PCB traces aur markhor ke spiral horns se inspired hai (teal + gold accents)
- Fonts: Space Grotesk (headings), Inter (body), JetBrains Mono (prices/specs)
- Har page responsive hai, dark/light mode toggle top-right mein hai
- Sirf ek product hai (ESP32) jaisa spec mein tha — checkout URL parameters (`?product=...&price=...`) se dusre products bhi future mein easily add ho saktay hain
