import { escapeHtml } from '../render-utils.js';

function renderStatCard(item) {
    return `<li class="stat-card">
      <strong class="stat-value">${escapeHtml(item.value || '')}</strong>
      <span class="stat-label">${escapeHtml(item.label || '')}</span>
    </li>`;
}

function renderStats(section) {
    const { content } = section;
    const items = Array.isArray(content.items) ? content.items : [];

    return `<section class="stats" id="${escapeHtml(section.id)}">
  <div class="section-inner">
    ${content.title ? `<h2>${escapeHtml(content.title)}</h2>` : ''}
    <ul class="stat-list">${items.map(renderStatCard).join('')}</ul>
  </div>
</section>`;
}

export { renderStats };

// END OF FILE
