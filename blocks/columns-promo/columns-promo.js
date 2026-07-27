/**
 * loads and decorates the columns-promo block
 * Two-column promo: one column is an image, the other is a teal
 * accent panel with an optional eyebrow, heading, paragraph and CTA link.
 * The image side alternates between consecutive columns-promo blocks
 * (first block: image right, second: image left, ...).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;

  [...row.children].forEach((col) => {
    const pic = col.querySelector('picture');
    if (pic && col.children.length === 1 && col.firstElementChild === pic) {
      // picture is the only content -> image column
      col.classList.add('columns-promo-img');
    } else {
      // text/content column -> teal panel
      col.classList.add('columns-promo-text');
      // first paragraph before the heading is the eyebrow label
      const heading = col.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) {
        const first = col.firstElementChild;
        if (first && first !== heading && first.tagName === 'P'
          && !first.querySelector('a')) {
          first.classList.add('columns-promo-eyebrow');
        }
      }
    }
  });

  // alternate image side across consecutive columns-promo blocks on the page
  const all = [...document.querySelectorAll('.columns-promo')];
  const index = all.indexOf(block);
  block.classList.add(index % 2 === 0 ? 'columns-promo-img-right' : 'columns-promo-img-left');
}
