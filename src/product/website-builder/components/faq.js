import { escapeHtml } from '../render-utils.js';

/** Uses native <details>/<summary> for the accordion -- no JavaScript needed, keyboard-accessible by default. */
function renderFaqItem(item) {
    return `<details class="faq-item">
      <summary>${escapeHtml(item.question || '')}</summary>
      <p>${escapeHtml(item.answer || '')}</p>
    </details>`;
}

function renderFaq(section) {
    const { content } = section;
    const items = Array.isArray(content.items) ? content.items : [];

    return `<section class="faq" id="${escapeHtml(section.id)}">
  <div class="section-inner">
    ${content.title ? `<h2>${escapeHtml(content.title)}</h2>` : ''}
    <div class="faq-list">${items.map(renderFaqItem).join('')}</div>
  </div>
</section>`;
}

export { renderFaq };

// END OF FILE
