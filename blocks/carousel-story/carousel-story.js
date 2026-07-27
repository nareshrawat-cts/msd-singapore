const AUTO_ADVANCE_MS = 6000;

const PAUSE_ICON = `<svg viewBox="0 0 13 16" aria-hidden="true" focusable="false">
  <rect width="3" height="16"></rect>
  <rect x="10" width="3" height="16"></rect>
</svg>`;

const PLAY_ICON = `<svg viewBox="0 0 13 16" aria-hidden="true" focusable="false">
  <path d="M0 0 L13 8 L0 16 Z"></path>
</svg>`;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

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

/**
 * Wires up auto-rotation with a pause/play toggle and an animated progress bar.
 * The progress fill is driven by requestAnimationFrame so it grows smoothly
 * across the slide duration, then advances to the next slide and resets. The
 * toggle button pauses/resumes the timer and freezes/unfreezes the fill.
 * @param {Element} block the carousel block
 */
function setupAutoRotation(block) {
  const slides = block.querySelectorAll('.carousel-story-slide');
  if (slides.length < 2) return;

  const reducedMotion = prefersReducedMotion();
  const state = {
    playing: !reducedMotion,
    rafId: null,
    startTime: 0,
    elapsed: 0,
    index: 0,
  };

  const activeFill = () => {
    const active = slides[state.index];
    return active ? active.querySelector('.carousel-story-progress-fill') : null;
  };

  const activeToggle = () => {
    const active = slides[state.index];
    return active ? active.querySelector('.carousel-story-toggle') : null;
  };

  const setFillWidth = (pct) => {
    const fill = activeFill();
    if (fill) fill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  };

  const stopRaf = () => {
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
  };

  const advance = () => {
    setFillWidth(0);
    state.elapsed = 0;
    state.startTime = 0;
    const next = (state.index + 1) % slides.length;
    state.index = next;
    showSlide(block, next);
  };

  const tick = (now) => {
    if (!state.playing) return;
    if (!state.startTime) state.startTime = now;
    const total = state.elapsed + (now - state.startTime);
    if (total >= AUTO_ADVANCE_MS) {
      // advance first so the fill lookup targets the newly-active slide's bar
      advance();
    } else {
      setFillWidth((total / AUTO_ADVANCE_MS) * 100);
    }
    state.rafId = requestAnimationFrame(tick);
  };

  const play = () => {
    if (state.playing && state.rafId) return;
    state.playing = true;
    state.startTime = 0;
    stopRaf();
    state.rafId = requestAnimationFrame(tick);
    const toggle = activeToggle();
    if (toggle) {
      toggle.innerHTML = PAUSE_ICON;
      toggle.setAttribute('aria-label', 'Pause');
      toggle.dataset.state = 'playing';
    }
  };

  const pause = () => {
    state.playing = false;
    stopRaf();
    // freeze accumulated time so resume continues from here
    const fill = activeFill();
    if (fill) {
      const pct = parseFloat(fill.style.width) || 0;
      state.elapsed = (pct / 100) * AUTO_ADVANCE_MS;
    }
    const toggle = activeToggle();
    if (toggle) {
      toggle.innerHTML = PLAY_ICON;
      toggle.setAttribute('aria-label', 'Play');
      toggle.dataset.state = 'paused';
    }
  };

  const resetTimer = () => {
    state.elapsed = 0;
    state.startTime = 0;
    setFillWidth(0);
    if (state.playing) {
      stopRaf();
      state.rafId = requestAnimationFrame(tick);
    }
  };

  // wire the toggle button on every slide (only the active one is visible)
  block.querySelectorAll('.carousel-story-toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      if (state.playing) {
        pause();
      } else {
        play();
      }
    });
  });

  // manual navigation via the "Next story:" titles resets the timer/bar
  block.addEventListener('carousel-story:navigate', (e) => {
    if (e.detail && typeof e.detail.index === 'number') {
      // clear the fill on the slide we're leaving before switching target
      setFillWidth(0);
      state.index = e.detail.index;
    }
    resetTimer();
  });

  // sync each slide's toggle icon to the current state as it becomes active
  const syncToggles = () => {
    block.querySelectorAll('.carousel-story-toggle').forEach((toggle) => {
      if (state.playing) {
        toggle.innerHTML = PAUSE_ICON;
        toggle.setAttribute('aria-label', 'Pause');
        toggle.dataset.state = 'playing';
      } else {
        toggle.innerHTML = PLAY_ICON;
        toggle.setAttribute('aria-label', 'Play');
        toggle.dataset.state = 'paused';
      }
    });
  };
  syncToggles();

  if (state.playing) {
    play();
  }
}

function bindEvents(block) {
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

/**
 * Builds the pause/play toggle + progress bar control row. Placed at the top
 * of the content column, above the eyebrow.
 * @returns {Element} the control row element
 */
function createControl() {
  const control = document.createElement('div');
  control.classList.add('carousel-story-control');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.classList.add('carousel-story-toggle');
  toggle.setAttribute('aria-label', 'Pause');
  toggle.dataset.state = 'playing';
  toggle.innerHTML = PAUSE_ICON;

  const track = document.createElement('div');
  track.classList.add('carousel-story-progress');
  track.setAttribute('role', 'progressbar');
  track.setAttribute('aria-hidden', 'true');

  const fill = document.createElement('div');
  fill.classList.add('carousel-story-progress-fill');
  track.append(fill);

  control.append(toggle, track);
  return control;
}

function decorateSlideContent(content, slideIndex, carouselId) {
  const paragraphs = content.querySelectorAll(':scope > p');
  const [textPara, ...rest] = paragraphs;
  if (textPara) {
    const { category, headline } = splitCategoryHeadline(textPara.textContent);
    const frag = document.createDocumentFragment();
    // control row (pause/play + progress) sits above the eyebrow
    frag.append(createControl());
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

/**
 * Builds the "Next story:" preview panel inside each slide's content column.
 * Each slide gets a panel listing the OTHER slides' headlines as clickable
 * buttons. Because only the active slide's content is visible, this naturally
 * keeps the currently-active story excluded from its own preview list.
 * Clicking a preview title navigates the carousel to that slide via showSlide
 * and dispatches a navigate event so the auto-rotation timer resets.
 * @param {Element} block the carousel block
 * @param {Object} placeholders localized label strings
 */
function buildNextStoryPreviews(block, placeholders = {}) {
  const slides = [...block.querySelectorAll('.carousel-story-slide')];
  if (slides.length < 2) return;

  // collect the headline text for every slide up front (data-driven)
  const titles = slides.map((slide) => {
    const headline = slide.querySelector('.carousel-story-headline');
    return headline ? headline.textContent.trim() : '';
  });

  slides.forEach((slide, slideIndex) => {
    const content = slide.querySelector('.carousel-story-slide-content');
    if (!content) return;

    const preview = document.createElement('div');
    preview.classList.add('carousel-story-next');

    const heading = document.createElement('p');
    heading.classList.add('carousel-story-next-heading');
    heading.textContent = placeholders.nextStory || 'Next story:';
    preview.append(heading);

    const list = document.createElement('ul');
    list.classList.add('carousel-story-next-list');

    slides.forEach((_, targetIndex) => {
      if (targetIndex === slideIndex) return;
      const item = document.createElement('li');
      item.classList.add('carousel-story-next-item');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.classList.add('carousel-story-next-link');
      btn.textContent = titles[targetIndex];
      btn.setAttribute('aria-label', `${placeholders.goToStory || 'Go to story'}: ${titles[targetIndex]}`);
      btn.addEventListener('click', () => {
        showSlide(block, targetIndex);
        block.dispatchEvent(new CustomEvent('carousel-story:navigate', { detail: { index: targetIndex } }));
      });

      item.append(btn);
      list.append(item);
    });

    preview.append(list);
    content.append(preview);
  });
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

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    slidesWrapper.append(slide);
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  if (!isSingleSlide) {
    buildNextStoryPreviews(block, placeholders);
    bindEvents(block);
    setupAutoRotation(block);
  }
}
