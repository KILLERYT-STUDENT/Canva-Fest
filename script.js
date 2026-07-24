document.addEventListener('DOMContentLoaded', () => {
  initSkeletonLoading();
  initNavScroll();
  initFadeInObserver();
  initRippleButtons();

  
  if (document.getElementById('registerForm')) {
    initRegistrationForm();
  }
});

function initSkeletonLoading() {
  const skeleton = document.querySelector('.skeleton-wrapper');
  if (!skeleton) return;

  
  const minDisplayTime = 1200;
  const startTime = Date.now();

  window.addEventListener('load', () => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minDisplayTime - elapsed);

    setTimeout(() => {
      skeleton.classList.add('loaded');
      document.body.classList.add('content-ready');

      
      setTimeout(() => {
        document.querySelectorAll('.hero .fade-in').forEach((el, i) => {
          setTimeout(() => el.classList.add('visible'), i * 120);
        });
      }, 300);

      
      setTimeout(() => {
        skeleton.remove();
      }, 800);
    }, remaining);
  });
}

function initNavScroll() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    if (currentScroll > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  }, { passive: true });
}

function initFadeInObserver() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          
          if (entry.target.closest('.hero')) return;

          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    }
  );

  document.querySelectorAll('.fade-in').forEach(el => {
    
    if (!el.closest('.hero')) {
      observer.observe(el);
    }
  });
}

function initRippleButtons() {
  document.querySelectorAll('.btn--primary').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      this.style.setProperty('--ripple-x', `${x}px`);
      this.style.setProperty('--ripple-y', `${y}px`);

      this.classList.remove('ripple');
      
      void this.offsetWidth;
      this.classList.add('ripple');

      setTimeout(() => {
        this.classList.remove('ripple');
      }, 600);
    });
  });
}

const TELEGRAM_BOT_TOKEN = '8784295656:AAH-NTy1SBqH8PmdyHUckPl3rZ1iDzRzM5I';
const TELEGRAM_CHAT_ID = '5816487553';

function initRegistrationForm() {
  const form = document.getElementById('registerForm');
  const formCard = document.getElementById('formCard');
  const successCard = document.getElementById('successCard');
  const submitBtn = document.getElementById('submitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    
    if (!validateForm(form)) return;

    
    const formData = {
      name: form.querySelector('#studentName').value.trim(),
      class: form.querySelector('#studentClass').value,
      section: form.querySelector('#studentSection').value,
      regNo: form.querySelector('#studentRegNo').value.trim()
    };

    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-spinner"></span> Submitting...';

    try {
      
      await sendToTelegram(formData);

      
      showSuccess(formCard, successCard, formData);
    } catch (error) {
      console.error('Telegram submission failed:', error);

      
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Submit Registration <span class="btn__icon">→</span>';

      
      showToast('Submission failed. Please check your connection and try again.', 'error');
    }
  });

  
  form.querySelectorAll('.form-group__input, .form-group__select').forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('error');
      const errorEl = input.parentElement.querySelector('.form-group__error');
      if (errorEl) errorEl.classList.remove('visible');
    });
  });
}

function validateForm(form) {
  let isValid = true;

  const name = form.querySelector('#studentName');
  const cls = form.querySelector('#studentClass');
  const section = form.querySelector('#studentSection');
  const regNo = form.querySelector('#studentRegNo');

  
  if (!name.value.trim()) {
    showFieldError(name, 'Please enter your full name');
    isValid = false;
  }

  
  if (!cls.value) {
    showFieldError(cls, 'Please select your class');
    isValid = false;
  }

  
  if (!section.value) {
    showFieldError(section, 'Please select your section');
    isValid = false;
  }

  
  if (!regNo.value.trim()) {
    showFieldError(regNo, 'Please enter your registration number');
    isValid = false;
  }

  return isValid;
}

function showFieldError(input, message) {
  input.classList.add('error');
  const errorEl = input.parentElement.querySelector('.form-group__error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }

  
  input.style.animation = 'none';
  void input.offsetWidth;
  input.style.animation = 'shake 0.4s ease';
}

function showSuccess(formCard, successCard, data) {
  
  document.getElementById('successName').textContent = data.name;
  document.getElementById('successClass').textContent = `Class ${data.class}`;
  document.getElementById('successSection').textContent = `Section ${data.section}`;
  document.getElementById('successRegNo').textContent = data.regNo;

  
  formCard.style.display = 'none';
  successCard.classList.add('visible');

  
  launchConfetti();
}

function launchConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  const colors = ['#00c4cc', '#6c63ff', '#7b2ff7', '#c084fc', '#f472b6', '#fbbf24', '#34d399'];
  const shapes = ['square', 'circle'];

  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';

    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const size = Math.random() * 8 + 6;
    const left = Math.random() * 100;
    const duration = Math.random() * 2 + 2;
    const delay = Math.random() * 0.8;

    piece.style.cssText = `
      left: ${left}%;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${shape === 'circle' ? '50%' : '2px'};
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
    `;

    container.appendChild(piece);
  }

  
  setTimeout(() => {
    container.remove();
  }, 4500);
}

const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }
`;
document.head.appendChild(shakeStyle);

async function sendToTelegram(data) {
  const timestamp = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const message = `
📋 *New Canva Fest Registration*
━━━━━━━━━━━━━━━━━━━━━

👤 *Name:* ${escapeMarkdown(data.name)}
🏫 *Class:* ${escapeMarkdown(data.class)}
📌 *Section:* ${escapeMarkdown(data.section)}
🔢 *Reg\\. No:* ${escapeMarkdown(data.regNo)}

🕐 *Submitted:* ${escapeMarkdown(timestamp)}
━━━━━━━━━━━━━━━━━━━━━
  `.trim();

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'MarkdownV2'
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Telegram API error: ${response.status} — ${errorData.description || 'Unknown error'}`);
  }

  return response.json();
}

function escapeMarkdown(text) {
  return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

function showToast(message, type = 'info') {
  
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__icon">${type === 'error' ? '⚠️' : 'ℹ️'}</span>
    <span class="toast__message">${message}</span>
  `;
  document.body.appendChild(toast);

  
  requestAnimationFrame(() => {
    toast.classList.add('toast--visible');
  });

  
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 400);
  }, 5000);
}

const extraStyles = document.createElement('style');
extraStyles.textContent = `
  
  .btn-spinner {
    display: inline-block;
    width: 18px;
    height: 18px;
    border: 2.5px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: btnSpin 0.7s linear infinite;
    vertical-align: middle;
  }

  @keyframes btnSpin {
    to { transform: rotate(360deg); }
  }

  .btn--submit:disabled {
    opacity: 0.8;
    cursor: not-allowed;
    transform: none !important;
  }

  
  .toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 24px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 14px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    font-size: 0.9rem;
    font-weight: 500;
    color: #374151;
    z-index: 11000;
    opacity: 0;
    transition: opacity 0.4s ease, transform 0.4s ease;
    max-width: 90vw;
  }

  .toast--visible {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  .toast--error {
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .toast__icon {
    font-size: 1.2rem;
    flex-shrink: 0;
  }
`;
document.head.appendChild(extraStyles);