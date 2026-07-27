/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-story. Base: carousel.
 * Source: https://www.msd-singapore.com/ (.mco-home-hero-block)
 * Structure (from library-description.txt): 2 columns, multiple rows.
 *   Row 1: block name.
 *   Each subsequent row = one slide: [image] | [tag + headline + Read story CTA].
 */
export default function parse(element, { document }) {
  // Real slide images live in the primary image slider; skip cloned items.
  const imageItems = Array.from(
    element.querySelectorAll(
      '.mco-home-hero-primary-image-slider > li.tns-item, [class*="primary-image-slider"] > li.tns-item',
    ),
  ).filter((li) => !li.classList.contains('tns-slide-cloned'));

  // Each slide's text content (tag / headline / CTA).
  const contentItems = Array.from(
    element.querySelectorAll('.mco-home-hero-content-item'),
  );

  const slideCount = Math.max(imageItems.length, contentItems.length);
  const cells = [];

  for (let i = 0; i < slideCount; i += 1) {
    const imageItem = imageItems[i];
    const contentItem = contentItems[i];

    const image = imageItem
      ? imageItem.querySelector('img')
      : null;

    const textCell = [];
    if (contentItem) {
      const tag = contentItem.querySelector('small.text-slug, .text-slug');
      // header.h1 carries the semantic headline (small.h1 is a duplicate).
      const headline = contentItem.querySelector('header.h1, header, .h1');
      const cta = contentItem.querySelector('p a.btn, a.btn, p a');

      if (tag) textCell.push(tag);
      if (headline) textCell.push(headline);
      if (cta) textCell.push(cta.closest('p') || cta);
    }

    // Skip empty slides (no image and no text).
    if (!image && textCell.length === 0) continue;

    cells.push([image || '', textCell.length ? textCell : '']);
  }

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-story', cells });
  element.replaceWith(block);
}
