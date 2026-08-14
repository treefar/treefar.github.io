const filters = [...document.querySelectorAll('.filter')];
const gameCards = [...document.querySelectorAll('.game-card')];
const filterStatus = document.querySelector('#filter-status');

for (const filter of filters) {
  filter.addEventListener('click', () => {
    const category = filter.dataset.filter;
    filters.forEach((item) => {
      const active = item === filter;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });

    let visibleCount = 0;
    gameCards.forEach((card) => {
      const visible = category === 'all' || card.dataset.category === category;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    const label = category === 'all' ? '全部' : filter.textContent.trim();
    filterStatus.textContent = `顯示「${label}」${visibleCount} 款原型`;
  });
}

const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxCaption = document.querySelector('#lightbox-caption');
const galleryCards = [...document.querySelectorAll('.gallery-card')];
let activeImageIndex = 0;

function showImage(index) {
  activeImageIndex = (index + galleryCards.length) % galleryCards.length;
  const card = galleryCards[activeImageIndex];
  const thumbnail = card.querySelector('img');
  lightboxImage.src = card.dataset.full;
  lightboxImage.alt = thumbnail.alt;
  lightboxCaption.textContent = card.dataset.caption;
}

galleryCards.forEach((card, index) => {
  card.addEventListener('click', () => {
    showImage(index);
    lightbox.showModal();
  });
});

document.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
document.querySelector('.lightbox-nav.previous').addEventListener('click', () => showImage(activeImageIndex - 1));
document.querySelector('.lightbox-nav.next').addEventListener('click', () => showImage(activeImageIndex + 1));

lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});

document.addEventListener('keydown', (event) => {
  if (!lightbox.open) return;
  if (event.key === 'ArrowLeft') showImage(activeImageIndex - 1);
  if (event.key === 'ArrowRight') showImage(activeImageIndex + 1);
});
