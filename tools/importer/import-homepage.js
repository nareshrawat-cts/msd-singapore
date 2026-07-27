/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselStoryParser from './parsers/carousel-story.js';
import columnsPromoParser from './parsers/columns-promo.js';
import accordionFocusParser from './parsers/accordion-focus.js';
import heroCareerParser from './parsers/hero-career.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/msd-singapore-cleanup.js';
import sectionsTransformer from './transformers/msd-singapore-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'MSD Singapore homepage with hero story carousel, intro title block, content promo blocks, focus areas accordion, and featured career banner',
  urls: [
    'https://www.msd-singapore.com/',
  ],
  blocks: [
    {
      name: 'carousel-story',
      instances: ['.mco-home-hero-block'],
    },
    {
      name: 'columns-promo',
      instances: ['.mco-b5-content-block'],
    },
    {
      name: 'accordion-focus',
      instances: ['.mccberg-block.wp-block-mccberg-related-links.mccberg-related-link'],
    },
    {
      name: 'hero-career',
      instances: ['.mco-featured-banner-block'],
    },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Hero Story Carousel',
      selector: '.mco-home-hero-block',
      style: null,
      blocks: ['carousel-story'],
      defaultContent: [],
    },
    {
      id: 'section-2',
      name: 'Intro Title',
      selector: '.mco-title-block',
      style: null,
      blocks: [],
      defaultContent: ['.mco-title-block-title', '.mco-title-block-content p', '.mco-title-block-cta-container'],
    },
    {
      id: 'section-3',
      name: 'Promo - Well-being',
      selector: '#mco-b5-content-block-block_ea379ce4175dd5f2fce455a277133f65',
      style: null,
      blocks: ['columns-promo'],
      defaultContent: [],
    },
    {
      id: 'section-4',
      name: 'Promo - Presence',
      selector: '#mco-b5-content-block-block_b0c0dcbf8c0a075df859d5db4286afdb',
      style: null,
      blocks: ['columns-promo'],
      defaultContent: [],
    },
    {
      id: 'section-5',
      name: 'Areas of Focus',
      selector: '.mccberg-related-link',
      style: null,
      blocks: ['accordion-focus'],
      defaultContent: ['.mccberg-related-link-header'],
    },
    {
      id: 'section-6',
      name: 'Featured Career Banner',
      selector: '.mco-featured-banner-block',
      style: null,
      blocks: ['hero-career'],
      defaultContent: [],
    },
  ],
};

// PARSER REGISTRY
const parsers = {
  'carousel-story': carouselStoryParser,
  'columns-promo': columnsPromoParser,
  'accordion-focus': accordionFocusParser,
  'hero-career': heroCareerParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document, url, html, params } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // Already replaced by earlier parser
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section breaks)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    let pathname = new URL(params.originalURL).pathname.replace(/\.html$/, '');
    // Root/homepage ("/") sanitizes to an empty string, which breaks
    // FileUtils.sanitizePath (path.resolve needs a cwd). Map it to /index.
    if (pathname === '/' || pathname === '') {
      pathname = '/index';
    } else {
      pathname = pathname.replace(/\/$/, '');
    }
    const path = WebImporter.FileUtils.sanitizePath(pathname);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
