/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-focus. Base: accordion.
 * Source: https://www.msd-singapore.com/ (.mccberg-related-link)
 * Structure (from library-description.txt): 2 columns, multiple rows.
 *   Row 1: block name.
 *   Each subsequent row = one accordion item as 2 cells:
 *   Title cell | Content cell (image + heading + paragraph + CTA).
 */
export default function parse(element, { document }) {
  // Each focus area = a title container paired with its expanded content panel.
  const titleContainers = Array.from(
    element.querySelectorAll('.mccberg-related-link-container'),
  );

  const cells = [];

  titleContainers.forEach((titleContainer) => {
    // The expanded content panel is the next sibling of the title container.
    let contentPanel = titleContainer.nextElementSibling;
    if (contentPanel && !contentPanel.classList.contains('mccberg-related-link-expanded')) {
      contentPanel = titleContainer.parentElement
        ? titleContainer.parentElement.querySelector(':scope > .mccberg-related-link-expanded')
        : null;
    }

    const title = titleContainer.querySelector('h4, h3, h2');

    const contentCell = [];
    if (contentPanel) {
      const image = contentPanel.querySelector('img');
      // First h4 inside the panel duplicates the title; keep it as the panel heading.
      const heading = contentPanel.querySelector('h4, h3, h2');
      const paragraphs = Array.from(contentPanel.querySelectorAll(':scope > p')).filter(
        (p) => !p.querySelector('a.btn, a'),
      );
      const cta = contentPanel.querySelector('p a.btn, a.btn, p a');

      if (image) contentCell.push(image);
      if (heading) contentCell.push(heading);
      paragraphs.forEach((p) => contentCell.push(p));
      if (cta) contentCell.push(cta.closest('p') || cta);
    }

    // Skip if neither a title nor content is present.
    if (!title && contentCell.length === 0) return;

    cells.push([title || '', contentCell.length ? contentCell : '']);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-focus', cells });

  // Preserve the section intro (heading + description + "View all focus areas"
  // CTA) as default content ABOVE the accordion. The source wraps it in
  // .coporateberg-related-link-header-container; without this the imported page
  // drops the "Our areas of focus" heading/intro entirely.
  const headerContainer = element.querySelector('.coporateberg-related-link-header-container, [class*="related-link-header-container"]');
  const introNodes = [];
  if (headerContainer) {
    const heading = headerContainer.querySelector('h1, h2, h3, [class*="header"]');
    const description = headerContainer.querySelector('p:not(:has(a)), .mccberg-related-link-description, [class*="description"]');
    const cta = headerContainer.querySelector('a.btn, a[href], p a');
    if (heading) {
      const h = document.createElement('h2');
      h.textContent = heading.textContent.trim();
      introNodes.push(h);
    }
    if (description && description !== heading) {
      const p = document.createElement('p');
      p.textContent = description.textContent.trim();
      introNodes.push(p);
    }
    if (cta && cta.getAttribute('href') && cta.getAttribute('href') !== '#') {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', cta.getAttribute('href'));
      a.textContent = cta.textContent.trim();
      p.append(a);
      introNodes.push(p);
    }
  }

  if (introNodes.length) {
    const wrapper = document.createElement('div');
    wrapper.append(...introNodes, block);
    element.replaceWith(wrapper);
  } else {
    element.replaceWith(block);
  }
}
