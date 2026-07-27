import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  // Local dev serves the fragment under /content; production (DA/EDS) serves it at root.
  let fragment = await loadFragment('/content/footer');
  if (!fragment) fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // tag the three sections: social band, program link columns, legal/copyright bar
  const sections = ['footer-social', 'footer-links', 'footer-legal'];
  sections.forEach((c, i) => {
    const section = footer.children[i];
    if (section) section.classList.add(c);
  });

  block.append(footer);
}
