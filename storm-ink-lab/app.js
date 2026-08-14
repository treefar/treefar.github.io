document.documentElement.classList.add('js');

const galleryCards = [...document.querySelectorAll('.gallery-card')];
const filterButtons = [...document.querySelectorAll('.filter')];
const filterStatus = document.querySelector('#filter-status');
const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxCaption = document.querySelector('#lightbox-caption');
let visibleCards = galleryCards;
let activeIndex = 0;

function applyFilter(category) {
  filterButtons.forEach((button) => {
    const active = button.dataset.filter === category;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  galleryCards.forEach((card) => {
    card.hidden = category !== 'all' && card.dataset.category !== category;
  });
  visibleCards = galleryCards.filter((card) => !card.hidden);
  if (filterStatus) filterStatus.textContent = `顯示${category === 'all' ? '全部' : category.toUpperCase()} ${visibleCards.length} 項成果`;
}

function showImage(card) {
  activeIndex = visibleCards.indexOf(card);
  lightboxImage.src = card.dataset.full;
  lightboxImage.alt = card.querySelector('img')?.alt || '';
  lightboxCaption.textContent = card.dataset.caption || '';
  if (!lightbox.open) lightbox.showModal();
}

function moveImage(step) {
  activeIndex = (activeIndex + step + visibleCards.length) % visibleCards.length;
  showImage(visibleCards[activeIndex]);
}

filterButtons.forEach((button) => button.addEventListener('click', () => applyFilter(button.dataset.filter)));
galleryCards.forEach((card) => card.addEventListener('click', () => showImage(card)));
document.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
document.querySelector('.lightbox-nav.previous').addEventListener('click', () => moveImage(-1));
document.querySelector('.lightbox-nav.next').addEventListener('click', () => moveImage(1));
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});
lightbox.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') moveImage(-1);
  if (event.key === 'ArrowRight') moveImage(1);
});
