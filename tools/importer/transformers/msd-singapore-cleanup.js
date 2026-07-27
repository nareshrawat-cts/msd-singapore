/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: msd-singapore site-wide cleanup.
 *
 * Removes non-authorable site chrome and blocking overlays so the import
 * contains only page-level authorable content.
 *
 * All selectors below were verified against migration-work/cleaned.html.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Blocking overlays / consent banners captured in cleaned.html:
    //   <div id="onetrust-consent-sdk">        (line 757)
    //   <div id="externalLinkModal" class="popup"> (line 723)
    //   <div id="ukUserModal" class="popup">    (line 741)
    // NOTE: the ".popup" modals inside .mco-b5-content-block (lines 433/466)
    // are content-block video popups handled by the block parser, so we only
    // target the top-level modal ids here — never a broad ".popup" selector.
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
      '#externalLinkModal',
      '#ukUserModal',
      // Video-popup modals inside the b5 content blocks. These are non-authorable
      // overlays whose close button ("×") otherwise leaks into the imported
      // content between the promo blocks. Target by the block-specific modal
      // class so real block content is preserved.
      '.mco-b5-content-block-modal',
    ]);

    // Decorative empty title blocks: some pages (e.g. Operation Overview) use an
    // .mco-title-block purely as a full-width background-image banner with no
    // authorable text. transformBackgroundImages would otherwise convert that
    // CSS background into a stray <img>. Remove only title blocks that have no
    // meaningful text so real intro title blocks (with headings/copy) survive.
    element.querySelectorAll('.mco-title-block').forEach((tb) => {
      if (!tb.textContent || tb.textContent.trim().length === 0) {
        tb.remove();
      }
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome captured in cleaned.html:
    //   <a class="skip-link ...">Skip to content</a>   (line 3)
    //   <header id="masthead" ...> (site header + nav + search) (line 4)
    //   <footer id="footerMain" ...>                    (line 608)
    // Stray stylesheet <link> tags leaked into the body (lines 475, 716-722).
    // We target #masthead by id (NOT the bare "header" tag) because the hero
    // carousel uses <header class="h1"> for authorable story titles inside
    // #content, which must be preserved.
    WebImporter.DOMUtils.remove(element, [
      'a.skip-link',
      'header#masthead',
      'footer#footerMain',
      'link',
    ]);
  }
}
