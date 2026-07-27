/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-promo. Base: columns.
 * Source: https://www.msd-singapore.com/ (.mco-b5-content-block)
 * Structure (from library-description.txt): first row = block name;
 *   one content row with 2 cells matching the visual grouping:
 *   [image] | [tagline + heading + paragraph + CTA].
 */
export default function parse(element, { document }) {
  const imageSection = element.querySelector('.mco-b5-content-block-image-section, [class*="image-section"]');
  const image = (imageSection || element).querySelector('img');

  const contentSection = element.querySelector('.mco-b5-content-block-content-section, [class*="content-section"]');
  const scope = contentSection || element;

  const tagline = scope.querySelector('small.tagline, .tagline');
  const heading = scope.querySelector('h1, h2, h3, [class*="heading"], [class*="title"]');
  const description = scope.querySelector('.mco-b5-content-block-description, [class*="description"]');
  const ctas = Array.from(
    scope.querySelectorAll('.mco-b5-content-block-content-buttons-container a, [class*="buttons"] a, a.btn'),
  );

  const contentCell = [];
  if (tagline) contentCell.push(tagline);
  if (heading) contentCell.push(heading);
  if (description) contentCell.push(description);
  ctas.forEach((cta) => contentCell.push(cta.closest('p') || cta));

  // Empty-block guard.
  if (!image && contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[image || '', contentCell.length ? contentCell : '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-promo', cells });
  element.replaceWith(block);
}
