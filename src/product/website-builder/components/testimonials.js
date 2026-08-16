import { escapeHtml } from '../render-utils.js';

function renderQuoteCard(item) {
    return `<li class="testimonial-card">
      <p class="testimonial-quote">&ldquo;${escapeHtml(item.quote || '')}&rdquo;</p>
      <p class="testimonial-author"><strong>${escapeHtml(item.name || '')}</strong>${item.role ? `, ${escapeHtml(item.role)}` : ''}</p>
    </li>`;
}

/** variant "grid": all quotes visible at once, side by side. */
function renderGridTestimonials(section) {
    const { content } = section;
    const items = Array.isArray(content.items) ? content.items : [];
    return `<section class="testimonials testimonials-grid" id="${escapeHtml(section.id)}">
  <div class="section-inner">
    ${content.title ? `<h2>${escapeHtml(content.title)}</h2>` : ''}
    <ul class="testimonial-list">${items.map(renderQuoteCard).join('')}</ul>
  </div>
</section>`;
}

/** variant "single": one larger featured quote, for a more editorial feel. */
function renderSingleTestimonial(section) {
    const { content } = section;
    const items = Array.isArray(content.items) ? content.items : [];
    const first = items[0] ?? {};
    return `<section class="testimonials testimonials-single" id="${escapeHtml(section.id)}">
  <div class="section-inner">
    <blockquote class="testimonial-featured">
      <p>&ldquo;${escapeHtml(first.quote || '')}&rdquo;</p>
      <footer><strong>${escapeHtml(first.name || '')}</strong>${first.role ? `, ${escapeHtml(first.role)}` : ''}</footer>
    </blockquote>
  </div>
</section>`;
}

function renderTestimonials(section) {
    return section.variant === 'single' ? renderSingleTestimonial(section) : renderGridTestimonials(section);
}

export { renderTestimonials };

// END OF FILE
