document.addEventListener('DOMContentLoaded', () => {
  initSkeletonLoading();
  initNavScroll();
  initFadeInObserver();
  initRippleButtons();

  initSeatsManager();

  if (document.getElementById('registerForm')) {
    initRegistrationForm();
  }
});

const MAX_SEATS = 15;
const STORAGE_KEY_REGISTERED = 'canva_fest_registered_count';

function getRegisteredCount() {
  const stored = localStorage.getItem(STORAGE_KEY_REGISTERED);
  return stored ? parseInt(stored, 10) : 0;
}

function getRemainingSeats() {
  return Math.max(0, MAX_SEATS - getRegisteredCount());
}

function incrementRegisteredCount() {
  const current = getRegisteredCount();
  localStorage.setItem(STORAGE_KEY_REGISTERED, current + 1);
}

function resetSeats() {
  localStorage.removeItem(STORAGE_KEY_REGISTERED);
  updateSeatsUI();
  const formCard = document.getElementById('formCard');
  const closedCard = document.getElementById('closedCard');
  const seatsBanner = document.getElementById('seatsBanner');

  if (formCard && closedCard) {
    formCard.style.display = 'block';
    if (seatsBanner) seatsBanner.style.display = 'flex';
    closedCard.classList.remove('visible');
  }

  if (typeof showToast === 'function') {
    showToast('⚡ Seats counter reset to 15!', 'info');
  }
}
window.resetSeats = resetSeats;

function initSeatsManager() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('reset') || urlParams.has('resetseats')) {
    resetSeats();
  }

  updateSeatsUI();
  initFooterSecretReset();
}

function initFooterSecretReset() {
  const footerText = document.querySelector('.footer__text');
  if (!footerText) return;

  let clickCount = 0;
  let clickTimer = null;

  footerText.addEventListener('click', () => {
    clickCount++;
    clearTimeout(clickTimer);

    if (clickCount >= 3) {
      resetSeats();
      clickCount = 0;
    } else {
      clickTimer = setTimeout(() => {
        clickCount = 0;
      }, 1000);
    }
  });
}

function updateSeatsUI() {
  const remaining = getRemainingSeats();
  const registered = getRegisteredCount();
  const percentage = Math.max(0, Math.min(100, (remaining / MAX_SEATS) * 100));

  const seatsBadgeText = document.getElementById('seatsBadgeText');
  const seatsText = document.getElementById('seatsText');
  const seatsBadge = document.getElementById('seatsBadge');
  const seatsProgressFill = document.getElementById('seatsProgressFill');

  if (seatsBadgeText) {
    if (remaining <= 0) {
      seatsBadgeText.textContent = '0 Seats Left';
      if (seatsBadge) seatsBadge.classList.add('seats-badge--urgent');
    } else if (remaining === 1) {
      seatsBadgeText.textContent = 'Only 1 Seat Left!';
      if (seatsBadge) seatsBadge.classList.add('seats-badge--urgent');
    } else {
      seatsBadgeText.textContent = `${remaining} Seats Available`;
      if (seatsBadge && remaining > 5) seatsBadge.classList.remove('seats-badge--urgent');
    }
  }

  if (seatsText) {
    seatsText.textContent = `Max 15 Teams · ${registered} Registered`;
  }

  if (seatsProgressFill) {
    seatsProgressFill.style.width = `${percentage}%`;
  }

  const heroBadgeText = document.getElementById('heroBadgeText');
  if (heroBadgeText) {
    if (remaining <= 0) {
      heroBadgeText.textContent = 'Registrations Closed (0 Seats Left)';
    } else {
      heroBadgeText.textContent = `Registrations Open (${remaining} Seats Left)`;
    }
  }

  const formCard = document.getElementById('formCard');
  const closedCard = document.getElementById('closedCard');
  const seatsBanner = document.getElementById('seatsBanner');

  if (formCard && closedCard) {
    if (remaining <= 0) {
      formCard.style.display = 'none';
      if (seatsBanner) seatsBanner.style.display = 'none';
      closedCard.classList.add('visible');
    } else {
      formCard.style.display = 'block';
      if (seatsBanner) seatsBanner.style.display = 'flex';
      closedCard.classList.remove('visible');
    }
  }
}

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

  initMCQCards(form);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (getRemainingSeats() <= 0) {
      updateSeatsUI();
      return;
    }

    if (!validateForm(form)) return;

    const selectedCategoryInput = form.querySelector('input[name="eventCategory"]:checked');

    const formData = {
      category: selectedCategoryInput ? selectedCategoryInput.value : 'Not Selected',
      member1: {
        name: form.querySelector('#member1Name').value.trim(),
        class: form.querySelector('#member1Class').value,
        section: form.querySelector('#member1Section').value,
        regNo: form.querySelector('#member1RegNo').value.trim(),
        phone: form.querySelector('#member1Phone').value.trim()
      },
      member2: {
        name: form.querySelector('#member2Name').value.trim(),
        class: form.querySelector('#member2Class').value,
        section: form.querySelector('#member2Section').value,
        regNo: form.querySelector('#member2RegNo').value.trim(),
        phone: form.querySelector('#member2Phone').value.trim()
      }
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-spinner"></span> Submitting...';

    try {
      await sendToTelegram(formData);
      incrementRegisteredCount();
      updateSeatsUI();
      showSuccess(formCard, successCard, formData);
    } catch (error) {
      console.error('Telegram submission failed:', error);
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Register Team <span class="btn__icon">→</span>';
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

function initMCQCards(form) {
  const mcqCards = form.querySelectorAll('.mcq-card');
  const categoryError = document.getElementById('categoryError');

  mcqCards.forEach(card => {
    const radio = card.querySelector('input[type="radio"]');

    card.addEventListener('click', () => {
      mcqCards.forEach(c => {
        c.classList.remove('selected', 'error');
      });

      card.classList.add('selected');
      radio.checked = true;

      if (categoryError) {
        categoryError.classList.remove('visible');
      }
    });
  });
}

function validateForm(form) {
  let isValid = true;

  const selectedCategory = form.querySelector('input[name="eventCategory"]:checked');
  const categoryError = document.getElementById('categoryError');
  const mcqCards = form.querySelectorAll('.mcq-card');

  if (!selectedCategory) {
    isValid = false;
    if (categoryError) categoryError.classList.add('visible');
    mcqCards.forEach(card => card.classList.add('error'));
  } else {
    if (categoryError) categoryError.classList.remove('visible');
    mcqCards.forEach(card => card.classList.remove('error'));
  }

  const phoneRegex = /^\d{10}$/;

  for (let i = 1; i <= 2; i++) {
    const name = form.querySelector(`#member${i}Name`);
    const cls = form.querySelector(`#member${i}Class`);
    const section = form.querySelector(`#member${i}Section`);
    const regNo = form.querySelector(`#member${i}RegNo`);
    const phone = form.querySelector(`#member${i}Phone`);

    if (!name.value.trim()) {
      showFieldError(name, `Please enter member ${i}'s name`);
      isValid = false;
    }
    if (!cls.value) {
      showFieldError(cls, 'Select class');
      isValid = false;
    }
    if (!section.value) {
      showFieldError(section, 'Select section');
      isValid = false;
    }
    if (!regNo.value.trim()) {
      showFieldError(regNo, 'Please enter reg. number');
      isValid = false;
    }
    if (!phone || !phoneRegex.test(phone.value.trim())) {
      showFieldError(phone, `Please enter a valid 10-digit phone number`);
      isValid = false;
    }
  }

  return isValid;
}

function showFieldError(input, message) {
  if (!input) return;
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
  const categoryEl = document.getElementById('successCategory');
  if (categoryEl) categoryEl.textContent = data.category;

  document.getElementById('successMember1').textContent = `${data.member1.name} (Class ${data.member1.class}-${data.member1.section}, Reg: ${data.member1.regNo})`;
  const m1PhoneEl = document.getElementById('successMember1Phone');
  if (m1PhoneEl) m1PhoneEl.textContent = data.member1.phone;

  document.getElementById('successMember2').textContent = `${data.member2.name} (Class ${data.member2.class}-${data.member2.section}, Reg: ${data.member2.regNo})`;
  const m2PhoneEl = document.getElementById('successMember2Phone');
  if (m2PhoneEl) m2PhoneEl.textContent = data.member2.phone;

  formCard.style.display = 'none';
  const seatsBanner = document.getElementById('seatsBanner');
  if (seatsBanner) seatsBanner.style.display = 'none';

  successCard.classList.add('visible');
  launchConfetti();
}

async function sendToTelegram(data) {
  const timestamp = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const remaining = getRemainingSeats() - 1;

  const message = `
🎨 *New Canva Fest Registration*
━━━━━━━━━━━━━━━━━━━━━

🎯 *Selected Category:* ${escapeMarkdown(data.category)}

👤 *Member 1*
    Name: ${escapeMarkdown(data.member1.name)}
    Class: ${escapeMarkdown(data.member1.class)} \\| Section: ${escapeMarkdown(data.member1.section)}
    Reg No: ${escapeMarkdown(data.member1.regNo)}
    📱 Phone: ${escapeMarkdown(data.member1.phone)}

👤 *Member 2*
    Name: ${escapeMarkdown(data.member2.name)}
    Class: ${escapeMarkdown(data.member2.class)} \\| Section: ${escapeMarkdown(data.member2.section)}
    Reg No: ${escapeMarkdown(data.member2.regNo)}
    📱 Phone: ${escapeMarkdown(data.member2.phone)}

⚡ *Seats Left After This Reg:* ${remaining < 0 ? 0 : remaining} / ${MAX_SEATS}
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