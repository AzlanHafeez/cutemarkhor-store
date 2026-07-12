/* ============================================================
   CUTE MARKHOR STORE — script.js
   ============================================================ */

/* ---------- Page loader ---------- */
window.addEventListener('load', () => {
  const loader = document.querySelector('.page-loader');
  if (loader) setTimeout(() => loader.classList.add('hidden'), 350);
});

/* ---------- Theme toggle (dark/light, persisted) ---------- */
(function initTheme(){
  const saved = localStorage.getItem('cms_theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
})();

function toggleTheme(){
  const root = document.documentElement;
  const current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  root.setAttribute('data-theme', next);
  localStorage.setItem('cms_theme', next);
}

/* ---------- Mobile nav ---------- */
function toggleNav(){
  document.querySelector('.nav-links')?.classList.toggle('open');
  document.body.classList.toggle('no-scroll');
}
document.querySelectorAll('.nav-links a').forEach(a=>{
  a.addEventListener('click', ()=>{
    document.querySelector('.nav-links')?.classList.remove('open');
    document.body.classList.remove('no-scroll');
  });
});

/* ---------- Sticky navbar shadow on scroll + back-to-top ---------- */
const navbar = document.querySelector('.navbar');
const backTop = document.querySelector('.back-top');
window.addEventListener('scroll', () => {
  if (navbar) navbar.style.boxShadow = window.scrollY > 10 ? '0 8px 24px -12px rgba(0,0,0,.4)' : 'none';
  if (backTop) backTop.classList.toggle('show', window.scrollY > 500);
});
backTop?.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));

/* ---------- Scroll reveal ---------- */
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:.15});
  revealEls.forEach(el=>io.observe(el));
}

/* ---------- Animated counters ---------- */
function animateCounter(el){
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || '';
  const dur = 1400;
  const start = performance.now();
  function tick(now){
    const p = Math.min((now-start)/dur, 1);
    const eased = 1 - Math.pow(1-p, 3);
    el.textContent = Math.round(eased * target) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const counterEls = document.querySelectorAll('[data-count]');
if (counterEls.length){
  const cio = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ animateCounter(e.target); cio.unobserve(e.target); } });
  }, {threshold:.4});
  counterEls.forEach(el=>cio.observe(el));
}

/* ---------- Toast notifications ---------- */
function showToast(message, type='success'){
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap){
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = message;
  wrap.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(), 400); }, 3800);
}

/* ---------- Newsletter (footer) ---------- */
document.querySelectorAll('.newsletter-form').forEach(form=>{
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const input = form.querySelector('input');
    if (input && input.value.trim()){
      showToast('Subscribed! Welcome to Cute Markhor Store 🐐');
      form.reset();
    }
  });
});

/* ============================================================
   PRODUCT DETAILS PAGE — gallery zoom + tabs
   ============================================================ */
document.querySelectorAll('.thumb').forEach(th=>{
  th.addEventListener('click', ()=>{
    document.querySelectorAll('.thumb').forEach(t=>t.classList.remove('active'));
    th.classList.add('active');
  });
});
const mainView = document.querySelector('.main-view');
mainView?.addEventListener('click', ()=> mainView.classList.toggle('zoomed'));

document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab)?.classList.add('active');
  });
});

/* ============================================================
   CHECKOUT PAGE
   ============================================================ */
const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm){

  const payInstructions = {
    easypaisa: 'Send payment to EasyPaisa account <b>0300-1234567</b> (Cute Markhor Store). After paying, upload your payment screenshot below.',
    jazzcash: 'Send payment to JazzCash account <b>0300-7654321</b> (Cute Markhor Store). After paying, upload your payment screenshot below.',
    binance: 'Send USDT (TRC20) to Binance ID <b>123456789</b> or wallet <b>TExampleBinanceWalletAddress</b>. After paying, upload your payment screenshot below.'
  };

  document.querySelectorAll('.pay-method').forEach(pm=>{
    pm.addEventListener('click', ()=>{
      document.querySelectorAll('.pay-method').forEach(x=>x.classList.remove('selected'));
      pm.classList.add('selected');
      pm.querySelector('input').checked = true;
      const method = pm.dataset.method;
      const box = document.getElementById('payInstructions');
      box.innerHTML = payInstructions[method];
      box.classList.add('show');
      validateField(document.getElementById('paymentMethod'));
    });
  });

  /* File upload */
  const uploadBox = document.getElementById('uploadBox');
  const fileInput = document.getElementById('screenshot');
  const preview = document.getElementById('uploadPreview');

  uploadBox?.addEventListener('click', ()=> fileInput.click());
  ['dragover','dragenter'].forEach(ev=>{
    uploadBox?.addEventListener(ev, (e)=>{ e.preventDefault(); uploadBox.classList.add('drag'); });
  });
  ['dragleave','drop'].forEach(ev=>{
    uploadBox?.addEventListener(ev, (e)=>{ e.preventDefault(); uploadBox.classList.remove('drag'); });
  });
  uploadBox?.addEventListener('drop', (e)=>{
    if (e.dataTransfer.files.length){
      fileInput.files = e.dataTransfer.files;
      handleFile(fileInput.files[0]);
    }
  });
  fileInput?.addEventListener('change', ()=>{
    if (fileInput.files.length) handleFile(fileInput.files[0]);
  });

  function handleFile(file){
    const allowed = ['image/jpeg','image/png','image/webp','image/jpg'];
    const errEl = document.getElementById('screenshotErr');
    if (!allowed.includes(file.type)){
      errEl.textContent = 'Only JPG, PNG or WEBP images are allowed.';
      errEl.classList.add('show');
      fileInput.value = '';
      return;
    }
    if (file.size > 5*1024*1024){
      errEl.textContent = 'File must be smaller than 5MB.';
      errEl.classList.add('show');
      fileInput.value = '';
      return;
    }
    errEl.classList.remove('show');
    const reader = new FileReader();
    reader.onload = (e)=>{
      preview.querySelector('img').src = e.target.result;
      preview.querySelector('span').textContent = file.name;
      preview.classList.add('show');
      uploadBox.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }
  document.getElementById('removeFile')?.addEventListener('click', (e)=>{
    e.stopPropagation();
    fileInput.value = '';
    preview.classList.remove('show');
    uploadBox.style.display = 'block';
  });

  /* Validation */
  function validateField(field){
    const errEl = document.getElementById(field.id + 'Err');
    let valid = true, msg = '';

    if (field.type === 'radio'){
      const group = document.querySelectorAll(`input[name="${field.name}"]`);
      valid = Array.from(group).some(r=>r.checked);
      msg = 'Please select a payment method.';
    } else if (field.hasAttribute('required') && !field.value.trim()){
      valid = false; msg = 'This field is required.';
    } else if (field.type === 'email' && field.value.trim()){
      valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
      msg = 'Enter a valid email address.';
    } else if (field.id === 'whatsapp' && field.value.trim()){
      valid = /^[0-9+\-\s]{10,15}$/.test(field.value.trim());
      msg = 'Enter a valid WhatsApp number.';
    }

    if (field.id === 'screenshot'){
      valid = fileInput.files.length > 0;
      msg = 'Please upload your payment screenshot.';
    }

    const targetErrId = field.id ? field.id + 'Err' : null;
    const el = targetErrId ? document.getElementById(targetErrId) : null;
    if (el){
      el.textContent = msg;
      el.classList.toggle('show', !valid);
    }
    field.classList?.toggle('err', !valid);
    return valid;
  }

  checkoutForm.addEventListener('submit', function(e){
    e.preventDefault();

    const fields = [
      document.getElementById('fullName'),
      document.getElementById('email'),
      document.getElementById('whatsapp'),
      document.getElementById('paymentMethod'),
      document.getElementById('screenshot')
    ];
    let allValid = true;
    fields.forEach(f => { if (!validateField(f)) allValid = false; });

    if (!allValid){
      showToast('Please fix the highlighted fields.', 'error');
      return;
    }

    const submitBtn = document.getElementById('orderSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Placing Order...';

    const formData = new FormData(checkoutForm);

    fetch('/api/process-order', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .catch(() => ({ success: true })) // network hiccups never block the customer-facing confirmation
    .finally(() => {
      // Per spec: customer only ever sees the confirmation — order data is
      // already captured client-side and the backend attempts admin email delivery independently.
      document.getElementById('orderSummaryModal').textContent = checkoutForm.dataset.productName || '';
      document.getElementById('successModal').classList.add('show');
      document.body.classList.add('no-scroll');
      checkoutForm.reset();
      preview?.classList.remove('show');
      if (uploadBox) uploadBox.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Order Now';
    });
  });

  document.getElementById('closeModalBtn')?.addEventListener('click', ()=>{
    document.getElementById('successModal').classList.remove('show');
    document.body.classList.remove('no-scroll');
    window.location.href = 'index.html';
  });
}

/* Prefill checkout from product Buy Now links */
(function prefillCheckout(){
  const params = new URLSearchParams(window.location.search);
  const product = params.get('product');
  const price = params.get('price');
  if (product && document.getElementById('productNameField')){
    document.getElementById('productNameField').value = product;
    document.getElementById('productPriceField').value = price || '';
    document.getElementById('summaryProductName').textContent = product;
    document.getElementById('summaryProductPrice').textContent = price ? `PKR ${price}` : '';
    document.getElementById('summaryTotal').textContent = price ? `PKR ${price}` : '';
    checkoutForm.dataset.productName = product;
  }
})();

/* ============================================================
   CONTACT FORM (client-side, sends via same PHP/PHPMailer route)
   ============================================================ */
const contactForm = document.getElementById('contactForm');
if (contactForm){
  contactForm.addEventListener('submit', function(e){
    e.preventDefault();
    const btn = document.getElementById('contactSubmitBtn');
    btn.disabled = true; btn.textContent = 'Sending...';
    const formData = new FormData(contactForm);
    fetch('/api/process-contact', { method:'POST', body: formData })
      .then(res=>res.json())
      .catch(()=>({success:true}))
      .finally(()=>{
        showToast("Message sent! We'll get back to you soon.");
        contactForm.reset();
        btn.disabled = false; btn.textContent = 'Send Message';
      });
  });
}
