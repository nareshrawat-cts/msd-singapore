function updateActiveSlide(slide) {
  const block = slide.closest('.carousel-story');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-story-slide');

  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
    aSlide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  const indicators = block.querySelectorAll('.carousel-story-slide-indicator');
  indicators.forEach((indicator, idx) => {
    if (idx !== slideIndex) {
      indicator.querySelector('button').removeAttribute('disabled');
    } else {
      indicator.querySelector('button').setAttribute('disabled', 'true');
    }
  });
}

export function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-story-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];

  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.carousel-story-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-story-slide-indicators');
  if (!slideIndicators) return;

  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const slideIndicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
    });
  });

  block.querySelector('.slide-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
  });

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.carousel-story-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

/**
 * Splits a concatenated "CategoryHeadline" string into its category eyebrow
 * and story headline. The source authors run the category tag directly into
 * the headline (e.g. "Our PeopleASEAN youth leaders..."). We detect the split
 * at the lowercase-to-uppercase boundary that starts the headline, so
 * "Our People" + "ASEAN youth..." separates cleanly.
 * @param {string} raw the combined text
 * @returns {{category: string, headline: string}}
 */
function splitCategoryHeadline(raw) {
  const text = (raw || '').trim();
  // find a lowercase letter immediately followed by an uppercase letter — the
  // boundary between the category label and the start of the headline.
  const match = text.match(/[a-z](?=[A-Z])/);
  if (match && match.index > 1 && match.index < text.length - 1) {
    const splitAt = match.index + 1;
    return {
      category: text.slice(0, splitAt).trim(),
      headline: text.slice(splitAt).trim(),
    };
  }
  return { category: '', headline: text };
}

function decorateSlideContent(content, slideIndex, carouselId) {
  const paragraphs = content.querySelectorAll(':scope > p');
  const [textPara, ...rest] = paragraphs;
  if (textPara) {
    const { category, headline } = splitCategoryHeadline(textPara.textContent);
    const frag = document.createDocumentFragment();
    if (category) {
      const eyebrow = document.createElement('p');
      eyebrow.classList.add('carousel-story-category');
      eyebrow.textContent = category;
      frag.append(eyebrow);
    }
    const title = document.createElement('h2');
    title.classList.add('carousel-story-headline');
    title.id = `carousel-story-${carouselId}-title-${slideIndex}`;
    title.textContent = headline;
    frag.append(title);
    textPara.replaceWith(frag);
  }
  // mark the CTA link as a primary button (styled via global button rules)
  rest.forEach((p) => {
    const link = p.querySelector('a');
    if (link) {
      link.classList.add('button', 'primary');
      p.classList.add('carousel-story-cta');
    }
  });
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-story-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-story-slide');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    const isContent = colIdx !== 0;
    column.classList.add(`carousel-story-slide-${isContent ? 'content' : 'image'}`);
    if (isContent) {
      decorateSlideContent(column, slideIndex, carouselId);
    }
    slide.append(column);
  });

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-story-${carouselId}`);
  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;

  const placeholders = {};

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-story-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-story-slides');
  block.prepend(slidesWrapper);

  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-story-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);
    block.append(slideIndicatorsNav);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-story-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class= "slide-prev" aria-label="${placeholders.previousSlide || 'Previous Slide'}"></button>
      <button type="button" class="slide-next" aria-label="${placeholders.nextSlide || 'Next Slide'}"></button>
    `;

    container.append(slideNavButtons);
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-story-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="${placeholders.showSlide || 'Show Slide'} ${idx + 1} ${placeholders.of || 'of'} ${rows.length}"></button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  if (!isSingleSlide) {
    bindEvents(block);
  }
}
