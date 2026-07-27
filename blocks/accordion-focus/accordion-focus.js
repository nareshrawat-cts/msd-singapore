/*
 * Accordion Focus block
 * "Our areas of focus" — a two-column tabs layout.
 * Left column: a vertical list of focus-area titles (tabs).
 * Right column: a detail panel showing the active item's content.
 * Exactly one item is active at a time; the first item is active by default.
 * On mobile it collapses to a single, stacked (accordion-style) column.
 */

export default function decorate(block) {
  const rows = [...block.children];

  const list = document.createElement('ul');
  list.className = 'accordion-focus-list';
  list.setAttribute('role', 'tablist');

  const panels = document.createElement('div');
  panels.className = 'accordion-focus-panels';

  const tabs = [];
  const panelEls = [];

  rows.forEach((row, index) => {
    const [titleCell, contentCell] = row.children;
    const id = `accordion-focus-${index}`;

    // Left: title becomes a tab button inside a list item.
    const item = document.createElement('li');
    item.className = 'accordion-focus-item';
    item.setAttribute('role', 'presentation');

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'accordion-focus-tab';
    tab.id = `${id}-tab`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `${id}-panel`);
    tab.append(...(titleCell ? titleCell.childNodes : []));
    item.append(tab);
    list.append(item);
    tabs.push(tab);

    // Right: content cell becomes a tab panel.
    const panel = contentCell || document.createElement('div');
    panel.className = 'accordion-focus-panel';
    panel.id = `${id}-panel`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `${id}-tab`);

    // Split the panel into an image layer and a text card so the desktop
    // layout can overlap them (large image top-right, white card over its
    // lower-left) — matching the source "areas of focus" composition.
    const media = panel.querySelector('picture, img');
    const mediaWrap = media ? (media.closest('p') || media) : null;
    const card = document.createElement('div');
    card.className = 'accordion-focus-panel-card';
    [...panel.children].forEach((child) => {
      if (child !== mediaWrap) card.append(child);
    });
    if (mediaWrap) {
      const mediaHolder = document.createElement('div');
      mediaHolder.className = 'accordion-focus-panel-media';
      mediaHolder.append(mediaWrap);
      panel.append(mediaHolder, card);
    } else {
      panel.append(card);
    }

    panels.append(panel);
    panelEls.push(panel);
  });

  const setActive = (index) => {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.setAttribute('tabindex', selected ? '0' : '-1');
      tab.parentElement.classList.toggle('active', selected);
      panelEls[i].classList.toggle('active', selected);
      panelEls[i].hidden = !selected;
    });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => setActive(index));
    tab.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (next !== null) {
        e.preventDefault();
        setActive(next);
        tabs[next].focus();
      }
    });
  });

  block.textContent = '';
  block.append(list, panels);

  // First item active by default.
  setActive(0);
}
