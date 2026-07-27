/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-career. Base: hero.
 * Source: https://www.msd-singapore.com/ (.mco-featured-banner-block)
 * Structure (from library-description.txt): 1 column, 3 rows.
 *   Row 1: block name.
 *   Row 2: background image (single cell).
 *   Row 3: title + subheading + CTA (single cell).
 */
export default function parse(element, { document }) {
  const imageContainer = element.querySelector('.mco-featured-banner-image-container, [class*="image-container"]');
  const bgImage = (imageContainer || element).querySelector('img');

  const contentCard = element.querySelector('.mco-featured-banner-content-card, .mco-featured-banner-content-container, [class*="content-card"]')
    || element;

  const heading = contentCard.querySelector('h1, h2, h3, [class*="heading"], [class*="title"]');
  const description = contentCard.querySelector('div > p, p');
  const cta = contentCard.querySelector('.mco-featured-banner-btn-container a, [class*="btn-container"] a, a.btn');

  // Empty-block guard.
  if (!heading && !description && !bgImage) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background image (its own single-cell row).
  if (bgImage) cells.push([bgImage]);

  // Row 3: all text content in a single cell.
  const contentCell = [];
  if (heading) contentCell.push(heading);
  if (description) contentCell.push(description);
  if (cta) contentCell.push(cta.closest('p') || cta);
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-career', cells });
  element.replaceWith(block);
}
