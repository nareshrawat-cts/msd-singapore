/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: msd-singapore section breaks.
 *
 * Inserts an <hr> before every non-first template section so the import
 * renders as distinct EDS sections. Section styles are all null for the
 * homepage template, so no Section Metadata blocks are created here.
 *
 * Section selectors come from tools/importer/page-templates.json (populated
 * by block-mapping-manager) and were verified against migration-work/cleaned.html.
 * Runs in afterTransform only.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  // Insert section breaks in beforeTransform, while the original section
  // anchor selectors (.mco-b5-content-block, .mccberg-related-link,
  // .mco-featured-banner-block, etc.) still match. In afterTransform the block
  // parsers have already replaced those elements with block markup, so the
  // selectors would no longer resolve and the breaks would be lost.
  if (hookName === TransformHook.beforeTransform) {
    const sections = (payload && payload.template && payload.template.sections) || [];
    if (sections.length < 2) return;

    // Process in reverse so inserting nodes does not shift the anchors of
    // sections we have not handled yet.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section || !section.selector) continue;

      const sectionEl = element.querySelector(section.selector);
      if (!sectionEl) continue;

      // Section Metadata block (only when a style is defined). All homepage
      // sections have style === null, so this branch is a no-op here but is
      // kept so the transformer stays correct if styles are added later.
      if (section.style) {
        const metaBlock = WebImporter.Blocks.createBlock(element.ownerDocument, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        sectionEl.after(metaBlock);
      }

      // Insert a section break before every section except the first, and
      // only when there is preceding content to break away from.
      if (i > 0 && sectionEl.previousElementSibling) {
        const hr = element.ownerDocument.createElement('hr');
        sectionEl.before(hr);
      }
    }
  }
}
