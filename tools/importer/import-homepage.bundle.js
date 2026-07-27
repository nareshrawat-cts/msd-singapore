/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/carousel-story.js
  function parse(element, { document }) {
    const imageItems = Array.from(
      element.querySelectorAll(
        '.mco-home-hero-primary-image-slider > li.tns-item, [class*="primary-image-slider"] > li.tns-item'
      )
    ).filter((li) => !li.classList.contains("tns-slide-cloned"));
    const contentItems = Array.from(
      element.querySelectorAll(".mco-home-hero-content-item")
    );
    const slideCount = Math.max(imageItems.length, contentItems.length);
    const cells = [];
    for (let i = 0; i < slideCount; i += 1) {
      const imageItem = imageItems[i];
      const contentItem = contentItems[i];
      const image = imageItem ? imageItem.querySelector("img") : null;
      const textCell = [];
      if (contentItem) {
        const tag = contentItem.querySelector("small.text-slug, .text-slug");
        const headline = contentItem.querySelector("header.h1, header, .h1");
        const cta = contentItem.querySelector("p a.btn, a.btn, p a");
        if (tag) textCell.push(tag);
        if (headline) textCell.push(headline);
        if (cta) textCell.push(cta.closest("p") || cta);
      }
      if (!image && textCell.length === 0) continue;
      cells.push([image || "", textCell.length ? textCell : ""]);
    }
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-story", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-promo.js
  function parse2(element, { document }) {
    const imageSection = element.querySelector('.mco-b5-content-block-image-section, [class*="image-section"]');
    const image = (imageSection || element).querySelector("img");
    const contentSection = element.querySelector('.mco-b5-content-block-content-section, [class*="content-section"]');
    const scope = contentSection || element;
    const tagline = scope.querySelector("small.tagline, .tagline");
    const heading = scope.querySelector('h1, h2, h3, [class*="heading"], [class*="title"]');
    const description = scope.querySelector('.mco-b5-content-block-description, [class*="description"]');
    const ctas = Array.from(
      scope.querySelectorAll('.mco-b5-content-block-content-buttons-container a, [class*="buttons"] a, a.btn')
    );
    const contentCell = [];
    if (tagline) contentCell.push(tagline);
    if (heading) contentCell.push(heading);
    if (description) contentCell.push(description);
    ctas.forEach((cta) => contentCell.push(cta.closest("p") || cta));
    if (!image && contentCell.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[image || "", contentCell.length ? contentCell : ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-focus.js
  function parse3(element, { document }) {
    const titleContainers = Array.from(
      element.querySelectorAll(".mccberg-related-link-container")
    );
    const cells = [];
    titleContainers.forEach((titleContainer) => {
      let contentPanel = titleContainer.nextElementSibling;
      if (contentPanel && !contentPanel.classList.contains("mccberg-related-link-expanded")) {
        contentPanel = titleContainer.parentElement ? titleContainer.parentElement.querySelector(":scope > .mccberg-related-link-expanded") : null;
      }
      const title = titleContainer.querySelector("h4, h3, h2");
      const contentCell = [];
      if (contentPanel) {
        const image = contentPanel.querySelector("img");
        const heading = contentPanel.querySelector("h4, h3, h2");
        const paragraphs = Array.from(contentPanel.querySelectorAll(":scope > p")).filter(
          (p) => !p.querySelector("a.btn, a")
        );
        const cta = contentPanel.querySelector("p a.btn, a.btn, p a");
        if (image) contentCell.push(image);
        if (heading) contentCell.push(heading);
        paragraphs.forEach((p) => contentCell.push(p));
        if (cta) contentCell.push(cta.closest("p") || cta);
      }
      if (!title && contentCell.length === 0) return;
      cells.push([title || "", contentCell.length ? contentCell : ""]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion-focus", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-career.js
  function parse4(element, { document }) {
    const imageContainer = element.querySelector('.mco-featured-banner-image-container, [class*="image-container"]');
    const bgImage = (imageContainer || element).querySelector("img");
    const contentCard = element.querySelector('.mco-featured-banner-content-card, .mco-featured-banner-content-container, [class*="content-card"]') || element;
    const heading = contentCard.querySelector('h1, h2, h3, [class*="heading"], [class*="title"]');
    const description = contentCard.querySelector("div > p, p");
    const cta = contentCard.querySelector('.mco-featured-banner-btn-container a, [class*="btn-container"] a, a.btn');
    if (!heading && !description && !bgImage) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (bgImage) cells.push([bgImage]);
    const contentCell = [];
    if (heading) contentCell.push(heading);
    if (description) contentCell.push(description);
    if (cta) contentCell.push(cta.closest("p") || cta);
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-career", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/msd-singapore-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        "#externalLinkModal",
        "#ukUserModal",
        // Video-popup modals inside the b5 content blocks. These are non-authorable
        // overlays whose close button ("×") otherwise leaks into the imported
        // content between the promo blocks. Target by the block-specific modal
        // class so real block content is preserved.
        ".mco-b5-content-block-modal"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "a.skip-link",
        "header#masthead",
        "footer#footerMain",
        "link"
      ]);
    }
  }

  // tools/importer/transformers/msd-singapore-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.beforeTransform) {
      const sections = payload && payload.template && payload.template.sections || [];
      if (sections.length < 2) return;
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section || !section.selector) continue;
        const sectionEl = element.querySelector(section.selector);
        if (!sectionEl) continue;
        if (section.style) {
          const metaBlock = WebImporter.Blocks.createBlock(element.ownerDocument, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          sectionEl.after(metaBlock);
        }
        if (i > 0 && sectionEl.previousElementSibling) {
          const hr = element.ownerDocument.createElement("hr");
          sectionEl.before(hr);
        }
      }
    }
  }

  // tools/importer/import-homepage.js
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "MSD Singapore homepage with hero story carousel, intro title block, content promo blocks, focus areas accordion, and featured career banner",
    urls: [
      "https://www.msd-singapore.com/"
    ],
    blocks: [
      {
        name: "carousel-story",
        instances: [".mco-home-hero-block"]
      },
      {
        name: "columns-promo",
        instances: [".mco-b5-content-block"]
      },
      {
        name: "accordion-focus",
        instances: [".mccberg-block.wp-block-mccberg-related-links.mccberg-related-link"]
      },
      {
        name: "hero-career",
        instances: [".mco-featured-banner-block"]
      }
    ],
    sections: [
      {
        id: "section-1",
        name: "Hero Story Carousel",
        selector: ".mco-home-hero-block",
        style: null,
        blocks: ["carousel-story"],
        defaultContent: []
      },
      {
        id: "section-2",
        name: "Intro Title",
        selector: ".mco-title-block",
        style: null,
        blocks: [],
        defaultContent: [".mco-title-block-title", ".mco-title-block-content p", ".mco-title-block-cta-container"]
      },
      {
        id: "section-3",
        name: "Promo - Well-being",
        selector: "#mco-b5-content-block-block_ea379ce4175dd5f2fce455a277133f65",
        style: null,
        blocks: ["columns-promo"],
        defaultContent: []
      },
      {
        id: "section-4",
        name: "Promo - Presence",
        selector: "#mco-b5-content-block-block_b0c0dcbf8c0a075df859d5db4286afdb",
        style: null,
        blocks: ["columns-promo"],
        defaultContent: []
      },
      {
        id: "section-5",
        name: "Areas of Focus",
        selector: ".mccberg-related-link",
        style: null,
        blocks: ["accordion-focus"],
        defaultContent: [".mccberg-related-link-header"]
      },
      {
        id: "section-6",
        name: "Featured Career Banner",
        selector: ".mco-featured-banner-block",
        style: null,
        blocks: ["hero-career"],
        defaultContent: []
      }
    ]
  };
  var parsers = {
    "carousel-story": parse,
    "columns-promo": parse2,
    "accordion-focus": parse3,
    "hero-career": parse4
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const { document, url, html, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      let pathname = new URL(params.originalURL).pathname.replace(/\.html$/, "");
      if (pathname === "/" || pathname === "") {
        pathname = "/index";
      } else {
        pathname = pathname.replace(/\/$/, "");
      }
      const path = WebImporter.FileUtils.sanitizePath(pathname);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
