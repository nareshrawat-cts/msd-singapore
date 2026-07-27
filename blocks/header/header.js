import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// MSD Singapore header: logo + Search/Menu with click-triggered nav overlay.
// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeMenu(nav) {
  nav.setAttribute('aria-expanded', 'false');
  document.body.style.overflowY = '';
  nav.querySelectorAll('.nav-sections li[aria-expanded="true"]').forEach((li) => {
    li.setAttribute('aria-expanded', 'false');
  });
}

function toggleMenu(nav, forceClose = false) {
  const expanded = nav.getAttribute('aria-expanded') === 'true';
  if (forceClose || expanded) {
    closeMenu(nav);
  } else {
    nav.setAttribute('aria-expanded', 'true');
    document.body.style.overflowY = 'hidden';
  }
}

function closeOnEscape(e, nav) {
  if (e.code === 'Escape') closeMenu(nav);
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  // Local dev serves the fragment under /content; production (DA/EDS) serves it at root.
  let fragment = await loadFragment('/content/nav');
  if (!fragment) fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'promo'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // brand link cleanup
  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand && navBrand.querySelector('a.button');
  if (brandLink) {
    brandLink.className = '';
    const container = brandLink.closest('.button-container');
    if (container) container.className = '';
  }

  // expandable nav sections (top-level items with a child <ul>)
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li, :scope > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) {
        navSection.classList.add('nav-drop');
        navSection.setAttribute('aria-expanded', 'false');
        // the label is the first <p> (or text) — toggle sub-list on click
        const label = navSection.querySelector(':scope > p');
        const toggleTarget = label || navSection;
        toggleTarget.addEventListener('click', (e) => {
          // if label contains a real link, let it navigate; otherwise toggle
          if (e.target.closest('a')) return;
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        });
      }
    });
  }

  // build the header bar: logo (brand) stays visible; sections + promo live in the overlay
  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  if (navSections) overlay.append(navSections);
  const navPromo = nav.querySelector('.nav-promo');
  if (navPromo) overlay.append(navPromo);

  // header actions: Search + Menu toggle
  const actions = document.createElement('div');
  actions.className = 'nav-actions';

  const searchBtn = document.createElement('button');
  searchBtn.type = 'button';
  searchBtn.className = 'nav-search-toggle';
  searchBtn.setAttribute('aria-label', 'Search everything');
  searchBtn.innerHTML = '<img class="nav-action-icon" src="/content/images/search-white.svg" alt=""><span>Search everything</span>';

  const menuBtn = document.createElement('button');
  menuBtn.type = 'button';
  menuBtn.className = 'nav-menu-toggle';
  menuBtn.setAttribute('aria-controls', 'nav');
  menuBtn.setAttribute('aria-label', 'Menu');
  menuBtn.innerHTML = '<img class="nav-action-icon" src="/content/images/burger-white.svg" alt=""><span>Menu</span>';
  const menuLabel = menuBtn.querySelector('span');
  menuBtn.addEventListener('click', () => {
    toggleMenu(nav);
    const open = nav.getAttribute('aria-expanded') === 'true';
    menuLabel.textContent = open ? 'Close' : 'Menu';
    menuBtn.setAttribute('aria-label', open ? 'Close' : 'Menu');
  });

  actions.append(searchBtn, menuBtn);

  // assemble: brand in the centered bar, overlay below
  const bar = document.createElement('div');
  bar.className = 'nav-bar';
  if (navBrand) bar.append(navBrand);

  nav.append(bar, overlay);

  // close overlay on escape
  window.addEventListener('keydown', (e) => closeOnEscape(e, nav));

  // reset state when crossing the desktop/mobile breakpoint
  isDesktop.addEventListener('change', () => {
    closeMenu(nav);
    menuBtn.textContent = 'Menu';
    menuBtn.setAttribute('aria-label', 'Menu');
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  // actions bar is pinned to the top-right corner of the full-width wrapper
  navWrapper.append(actions);
  block.append(navWrapper);
}
