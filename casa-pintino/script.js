const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');

function setHeaderState() {
  header.classList.toggle('is-scrolled', window.scrollY > 24);
}

function closeMenu() {
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Obrir menú');
  nav.classList.remove('is-open');
  document.body.classList.remove('menu-open');
}

toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  toggle.setAttribute('aria-label', open ? 'Obrir menú' : 'Tancar menú');
  nav.classList.toggle('is-open', !open);
  document.body.classList.toggle('menu-open', !open);
});

nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
window.addEventListener('scroll', setHeaderState, { passive: true });
setHeaderState();

const lightbox = document.querySelector('.lightbox');
const lightboxImage = lightbox.querySelector('img');
const lightboxClose = lightbox.querySelector('.lightbox-close');
let lastFocused = null;

function openLightbox(src, trigger) {
  lastFocused = trigger;
  lightboxImage.src = src;
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  lightboxImage.src = '';
  document.body.style.overflow = '';
  if (lastFocused) lastFocused.focus();
}

document.querySelectorAll('[data-lightbox]').forEach(button => {
  button.addEventListener('click', () => openLightbox(button.dataset.lightbox, button));
});

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', event => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (nav.classList.contains('is-open')) closeMenu();
    if (lightbox.classList.contains('is-open')) closeLightbox();
  }
});
