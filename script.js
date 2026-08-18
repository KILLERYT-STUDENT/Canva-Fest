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

const CATEGORIES = {
  poster: {
    key: 'poster',
    name: 'Poster Making',
    badgeId: 'catSeatPoster',
    max: 10,
    defaultCount: 6
  },
  ppt: {
    key: 'ppt',
    name: 'PPT',
    badgeId: 'catSeatPPT',
    max: 5,
    defaultCount: 4
  },
  video: {
    key: 'video',
    name: 'Video Making',
    badgeId: 'catSeatVideo',
    max: 5,
    defaultCount: 2
  }
};

const TOTAL_MAX_SEATS = 20;
const TELEGRAM_BOT_TOKEN = '8784295656:AAH-NTy1SBqH8PmdyHUckPl3rZ1iDzRzM5I';
const TELEGRAM_CHAT_ID = '5816487553';
const COUNTER_PREFIX = 'CANVA_FEST_COUNTER:';
const STORAGE_KEY_MY_REG = 'canva_fest_my_registration';

function getCategoryKeyByName(name) {
  if (!name) return null;
  const n = name.toLowerCase();
  if (n.includes('poster')) return 'poster';
  if (n.includes('ppt') || n.includes('presentation')) return 'ppt';
  if (n.includes('video')) return 'video';
  return null;
}

function parseCounterText(text) {
  const result = {
    poster: CATEGORIES.poster.defaultCount,
    ppt: CATEGORIES.ppt.defaultCount,
    video: CATEGORIES.video.defaultCount
  };

  if (!text || !text.includes(COUNTER_PREFIX)) return result;

  const dataPart = text.split(COUNTER_PREFIX)[1].trim();

  if (dataPart.includes('poster=') || dataPart.includes('ppt=') || dataPart.includes('video=')) {
    const pairs = dataPart.split(',');
    pairs.forEach(pair => {
      const [k, v] = pair.split('=').map(s => s.trim().toLowerCase());
      const num = parseInt(v, 10);
      if (!isNaN(num) && result[k] !== undefined) {
        result[k] = Math.max(0, Math.min(CATEGORIES[k].max, num));
      }
    });
  } else {
    const totalNum = parseInt(dataPart, 10);
    if (!isNaN(totalNum)) {
      if (totalNum === 0) {
        result.poster = 0;
        result.ppt = 0;
        result.video = 0;
      }
    }
  }

  return result;
}

function serializeCounts(counts) {
  return `📊 ${COUNTER_PREFIX}poster=${counts.poster},ppt=${counts.ppt},video=${counts.video}`;
}

async function fetchRemoteSeats() {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat?chat_id=${TELEGRAM_CHAT_ID}`
    );
    const data = await res.json();
    if (data.ok && data.result.pinned_message) {
      const text = data.result.pinned_message.text || '';
      const counts = parseCounterText(text);
      const totalRegistered = counts.poster + counts.ppt + counts.video;
      const totalRemaining = Math.max(0, TOTAL_MAX_SEATS - totalRegistered);

      return {
        counts,
        totalRegistered,
        totalRemaining,
        messageId: data.result.pinned_message.message_id
      };
    }
    return null;
  } catch (e) {
    console.error('Failed to fetch remote seats:', e);
    return null;
  }
}

async function initializeRemoteCounter(initialCounts) {
  try {
    const counts = initialCounts || {
      poster: CATEGORIES.poster.defaultCount,
      ppt: CATEGORIES.ppt.defaultCount,
      video: CATEGORIES.video.defaultCount
    };

    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: serializeCounts(counts)
        })
      }
    );
    const data = await res.json();
    if (data.ok) {
      await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/pinChatMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            message_id: data.result.message_id,
            disable_notification: true
          })
        }
      );
      const totalRegistered = counts.poster + counts.ppt + counts.video;
      const totalRemaining = Math.max(0, TOTAL_MAX_SEATS - totalRegistered);
      return {
        counts,
        totalRegistered,
        totalRemaining,
        messageId: data.result.message_id
      };
    }
  } catch (e) {
    console.error('Failed to initialize remote counter:', e);
  }
  return null;
}

async function updateRemoteCounter(newCounts, messageId) {
  try {
    const latest = await fetchRemoteSeats();
    const actualMsgId = latest ? latest.messageId : messageId;

    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          message_id: actualMsgId,
          text: serializeCounts(newCounts)
        })
      }
    );
  } catch (e) {
    console.error('Failed to update remote counter:', e);
  }
}

let currentCounterState = {
  counts: { poster: 6, ppt: 4, video: 2 },
  totalRegistered: 12,
  totalRemaining: 8,
  messageId: null
};

function hasAlreadyRegistered() {
  return localStorage.getItem(STORAGE_KEY_MY_REG) !== null;
}

function getMyRegistration() {
  const data = localStorage.getItem(STORAGE_KEY_MY_REG);
  return data ? JSON.parse(data) : null;
}

function saveMyRegistration(data) {
  localStorage.setItem(STORAGE_KEY_MY_REG, JSON.stringify(data));
}

async function initSeatsManager() {
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.has('clearreg')) {
    localStorage.removeItem(STORAGE_KEY_MY_REG);
  }

  if (urlParams.has('setcounts')) {
    const param = urlParams.get('setcounts');
    const counts = { poster: 6, ppt: 3, video: 2 };
    param.split(',').forEach(part => {
      const [k, v] = part.split(':').map(s => s.trim().toLowerCase());
      const num = parseInt(v, 10);
      if (!isNaN(num) && counts[k] !== undefined) {
        counts[k] = num;
      }
    });
    const current = await fetchRemoteSeats();
    if (current && current.messageId) {
      await updateRemoteCounter(counts, current.messageId);
    } else {
      await initializeRemoteCounter(counts);
    }
    showToast(`⚡ Set counts: Poster: ${counts.poster}, PPT: ${counts.ppt}, Video: ${counts.video}`, 'info');
  }

  if (urlParams.has('reset') || urlParams.has('resetseats')) {
    await resetSeats();
    return;
  }

  updateSeatsUILoading();

  let remote = await fetchRemoteSeats();

  if (!remote) {
    remote = await initializeRemoteCounter({
      poster: CATEGORIES.poster.defaultCount,
      ppt: CATEGORIES.ppt.defaultCount,
      video: CATEGORIES.video.defaultCount
    });
  }

  if (remote) {
    currentCounterState = remote;
  }

  updateSeatsUI(currentCounterState);

  if (hasAlreadyRegistered()) {
    showAlreadyRegistered();
  }

  if (currentCounterState.totalRemaining <= 0) {
    showSeatsFull();
  }

  initFooterSecretReset();
}

async function resetSeats() {
  const zeroCounts = { poster: 0, ppt: 0, video: 0 };
  const remote = await initializeRemoteCounter(zeroCounts);
  if (remote) {
    currentCounterState = remote;
  }
  localStorage.removeItem(STORAGE_KEY_MY_REG);
  localStorage.removeItem('canva_fest_registered_count');
  updateSeatsUI(currentCounterState);

  const formCard = document.getElementById('formCard');
  const closedCard = document.getElementById('closedCard');
  const alreadyCard = document.getElementById('alreadyRegisteredCard');
  const seatsBanner = document.getElementById('seatsBanner');

  if (formCard) formCard.style.display = 'block';
  if (closedCard) closedCard.classList.remove('visible');
  if (alreadyCard) alreadyCard.classList.remove('visible');
  if (seatsBanner) seatsBanner.style.display = 'flex';

  showToast('⚡ Seats counter reset to zero!', 'info');
}
window.resetSeats = resetSeats;

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

function updateSeatsUILoading() {
  const seatsBadgeText = document.getElementById('seatsBadgeText');
  const seatsText = document.getElementById('seatsText');
  const heroBadgeText = document.getElementById('heroBadgeText');

  if (seatsBadgeText) seatsBadgeText.textContent = 'Loading...';
  if (seatsText) seatsText.textContent = 'Fetching seat data...';
  if (heroBadgeText) heroBadgeText.textContent = 'Checking availability...';
}

function updateSeatsUI(state) {
  const remaining = state.totalRemaining;
  const registered = state.totalRegistered;
  const counts = state.counts;
  const percentage = Math.max(0, Math.min(100, (remaining / TOTAL_MAX_SEATS) * 100));

  const seatsBadgeText = document.getElementById('seatsBadgeText');
  const seatsText = document.getElementById('seatsText');
  const seatsBadge = document.getElementById('seatsBadge');
  const seatsProgressFill = document.getElementById('seatsProgressFill');

  if (seatsBadgeText) {
    if (remaining <= 0) {
      seatsBadgeText.textContent = '0 Seats Left';
      if (seatsBadge) seatsBadge.classList.add('seats-badge--urgent');
    } else if (remaining <= 3) {
      seatsBadgeText.textContent = `Only ${remaining} Seats Left!`;
      if (seatsBadge) seatsBadge.classList.add('seats-badge--urgent');
    } else {
      seatsBadgeText.textContent = `${remaining} Seats Available`;
      if (seatsBadge) seatsBadge.classList.remove('seats-badge--urgent');
    }
  }

  if (seatsText) {
    seatsText.textContent = `Max ${TOTAL_MAX_SEATS} Teams · ${registered} Registered`;
  }

  if (seatsProgressFill) {
    seatsProgressFill.style.width = `${percentage}%`;
  }

  const heroBadgeText = document.getElementById('heroBadgeText');
  const heroBadgeDot = document.getElementById('heroBadgeDot');
  if (heroBadgeText) {
    if (remaining <= 0) {
      heroBadgeText.textContent = 'All Seats Filled — Registration Closed';
      if (heroBadgeDot) heroBadgeDot.style.background = '#ef4444';
    } else {
      heroBadgeText.textContent = `Registrations Open (${remaining} Seats Left)`;
      if (heroBadgeDot) heroBadgeDot.style.background = 'var(--canva-teal)';
    }
  }

  const heroFullBanner = document.getElementById('heroFullBanner');
  if (heroFullBanner) {
    if (remaining <= 0) {
      heroFullBanner.classList.add('visible');
    } else {
      heroFullBanner.classList.remove('visible');
    }
  }

  updateCategoryCardsUI(counts);

  const formCard = document.getElementById('formCard');
  const closedCard = document.getElementById('closedCard');
  const seatsBanner = document.getElementById('seatsBanner');

  if (formCard && closedCard) {
    if (remaining <= 0) {
      formCard.style.display = 'none';
      if (seatsBanner) seatsBanner.style.display = 'none';
      closedCard.classList.add('visible');
    } else if (!hasAlreadyRegistered()) {
      formCard.style.display = 'block';
      if (seatsBanner) seatsBanner.style.display = 'flex';
      closedCard.classList.remove('visible');
    }
  }
}

function updateCategoryCardsUI(counts) {
  Object.keys(CATEGORIES).forEach(catKey => {
    const cat = CATEGORIES[catKey];
    const registered = counts[catKey] || 0;
    const catRemaining = Math.max(0, cat.max - registered);

    const badgeEl = document.getElementById(cat.badgeId);
    const cardEl = document.querySelector(`.mcq-card[data-category="${catKey}"]`);
    const radioEl = cardEl ? cardEl.querySelector('input[type="radio"]') : null;

    if (badgeEl) {
      badgeEl.className = 'mcq-card__seat-badge';
      if (catRemaining <= 0) {
        badgeEl.textContent = `🔒 Full (${cat.max}/${cat.max})`;
        badgeEl.classList.add('mcq-card__seat-badge--full');
      } else if (catRemaining <= 2) {
        badgeEl.textContent = `⚡ Only ${catRemaining} Left!`;
        badgeEl.classList.add('mcq-card__seat-badge--urgent');
      } else {
        badgeEl.textContent = `${catRemaining} Seats Left`;
      }
    }

    if (cardEl) {
      if (catRemaining <= 0) {
        cardEl.classList.add('mcq-card--locked');
        cardEl.classList.remove('selected');
        if (radioEl) {
          radioEl.disabled = true;
          radioEl.checked = false;
        }
      } else {
        cardEl.classList.remove('mcq-card--locked');
        if (radioEl) {
          radioEl.disabled = false;
        }
      }
    }
  });
}

function showAlreadyRegistered() {
  const formCard = document.getElementById('formCard');
  const alreadyCard = document.getElementById('alreadyRegisteredCard');
  const seatsBanner = document.getElementById('seatsBanner');

  if (!alreadyCard) return;

  const myReg = getMyRegistration();
  if (myReg) {
    const arCategory = document.getElementById('arCategory');
    const arMember1 = document.getElementById('arMember1');
    const arMember2 = document.getElementById('arMember2');

    if (arCategory) arCategory.textContent = myReg.category;
    if (arMember1) arMember1.textContent = `${myReg.member1.name} (Class ${myReg.member1.class}-${myReg.member1.section})`;
    if (arMember2) arMember2.textContent = `${myReg.member2.name} (Class ${myReg.member2.class}-${myReg.member2.section})`;
  }

  if (formCard) formCard.style.display = 'none';
  if (seatsBanner) seatsBanner.style.display = 'none';
  alreadyCard.classList.add('visible');
}

function showSeatsFull() {
  const heroFullBanner = document.getElementById('heroFullBanner');
  if (heroFullBanner) {
    heroFullBanner.classList.add('visible');
  }

  const formCard = document.getElementById('formCard');
  const closedCard = document.getElementById('closedCard');
  const seatsBanner = document.getElementById('seatsBanner');

  if (formCard && closedCard) {
    formCard.style.display = 'none';
    if (seatsBanner) seatsBanner.style.display = 'none';
    closedCard.classList.add('visible');
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

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
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

function initRegistrationForm() {
  const form = document.getElementById('registerForm');
  const formCard = document.getElementById('formCard');
  const successCard = document.getElementById('successCard');
  const submitBtn = document.getElementById('submitBtn');

  initMCQCards(form);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const latestSeats = await fetchRemoteSeats();
    if (latestSeats) {
      currentCounterState = latestSeats;
      updateSeatsUI(latestSeats);
    }

    if (currentCounterState.totalRemaining <= 0) {
      showSeatsFull();
      showToast('Sorry! All seats across all categories are filled.', 'error');
      return;
    }

    if (!validateForm(form)) return;

    const selectedCategoryInput = form.querySelector('input[name="eventCategory"]:checked');
    const categoryName = selectedCategoryInput ? selectedCategoryInput.value : 'Not Selected';
    const catKey = getCategoryKeyByName(categoryName);

    if (catKey && currentCounterState.counts[catKey] >= CATEGORIES[catKey].max) {
      showToast(`⚠️ ${CATEGORIES[catKey].name} is full (Max ${CATEGORIES[catKey].max} reached). Please choose another category!`, 'error');
      updateCategoryCardsUI(currentCounterState.counts);
      return;
    }

    const formData = {
      category: categoryName,
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
      const newCounts = { ...currentCounterState.counts };
      if (catKey && newCounts[catKey] !== undefined) {
        newCounts[catKey] = newCounts[catKey] + 1;
      }

      await sendToTelegram(formData, newCounts);

      await updateRemoteCounter(newCounts, currentCounterState.messageId);

      currentCounterState.counts = newCounts;
      currentCounterState.totalRegistered = newCounts.poster + newCounts.ppt + newCounts.video;
      currentCounterState.totalRemaining = Math.max(0, TOTAL_MAX_SEATS - currentCounterState.totalRegistered);

      updateSeatsUI(currentCounterState);

      saveMyRegistration(formData);

      showSuccess(formCard, successCard, formData);
    } catch (error) {
      console.error('Submission failed:', error);
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
    const catKey = card.getAttribute('data-category');

    card.addEventListener('click', (e) => {
      if (card.classList.contains('mcq-card--locked') || (radio && radio.disabled)) {
        e.preventDefault();
        const catName = CATEGORIES[catKey] ? CATEGORIES[catKey].name : 'This category';
        const maxLimit = CATEGORIES[catKey] ? CATEGORIES[catKey].max : '';
        showToast(`⚠️ ${catName} is full (${maxLimit}/${maxLimit} registered). Please choose another category!`, 'error');
        card.style.animation = 'none';
        void card.offsetWidth;
        card.style.animation = 'shake 0.4s ease';
        return;
      }

      mcqCards.forEach(c => {
        c.classList.remove('selected', 'error');
      });

      card.classList.add('selected');
      if (radio) radio.checked = true;

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
    if (categoryError) {
      categoryError.textContent = 'Please select a category to participate';
      categoryError.classList.add('visible');
    }
    mcqCards.forEach(card => {
      if (!card.classList.contains('mcq-card--locked')) {
        card.classList.add('error');
      }
    });
  } else {
    const catKey = getCategoryKeyByName(selectedCategory.value);
    if (catKey && currentCounterState.counts[catKey] >= CATEGORIES[catKey].max) {
      isValid = false;
      if (categoryError) {
        categoryError.textContent = `${CATEGORIES[catKey].name} is full! Please choose another category.`;
        categoryError.classList.add('visible');
      }
      showToast(`⚠️ ${CATEGORIES[catKey].name} is full! Please choose another category.`, 'error');
    } else {
      if (categoryError) categoryError.classList.remove('visible');
      mcqCards.forEach(card => card.classList.remove('error'));
    }
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

async function sendToTelegram(data, newCounts) {
  const timestamp = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const totalRegistered = newCounts.poster + newCounts.ppt + newCounts.video;
  const totalRemaining = Math.max(0, TOTAL_MAX_SEATS - totalRegistered);

  const posterLeft = Math.max(0, CATEGORIES.poster.max - newCounts.poster);
  const pptLeft = Math.max(0, CATEGORIES.ppt.max - newCounts.ppt);
  const videoLeft = Math.max(0, CATEGORIES.video.max - newCounts.video);

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

📊 *Category Seats Status:*
    🖼️ Poster Making: ${posterLeft} / ${CATEGORIES.poster.max} left
    📊 PPT: ${pptLeft} / ${CATEGORIES.ppt.max} left
    🎥 Video Making: ${videoLeft} / ${CATEGORIES.video.max} left

⚡ *Overall Seats Left:* ${totalRemaining} / ${TOTAL_MAX_SEATS} (Total Registered: ${totalRegistered})
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
