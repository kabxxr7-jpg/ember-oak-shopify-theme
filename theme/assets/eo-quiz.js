/*
 * Ember & Oak: product quiz.
 * scoreProducts() is pure (no DOM) so it is unit-tested in tests/quiz.test.mjs.
 */
(function () {
  const ROAST_ORDER = ['light', 'medium-light', 'medium', 'dark'];
  const LABELS = {
    brew_methods: (v) => `Brews well as ${v.replace(/-/g, ' ')}`,
    flavor_profile: (v) => `${v[0].toUpperCase()}${v.slice(1)} notes`,
    roast_level: (v) => `${v[0].toUpperCase()}${v.slice(1).replace(/-/g, ' ')} roast`,
    caffeine: (v) => (v === 'decaf' ? 'Decaf' : 'Full caffeine'),
  };

  /**
   * @param {Array} products  [{ attrs: { key: string | string[] }, available, ... }]
   * @param {Array} answers   [{ key, values: string[], weight: number, filter: boolean }]
   * @returns {Array} products sorted best first, each with score (0-100) and reasons[]
   */
  function scoreProducts(products, answers) {
    const counted = answers.filter((a) => a.values.length && !a.values.includes('any'));
    const max = counted.reduce((sum, a) => sum + a.weight, 0) || 1;

    return products
      .map((p, order) => {
        let points = 0;
        const reasons = [];
        let excluded = !p.available;
        for (const a of counted) {
          const raw = p.attrs[a.key];
          const have = Array.isArray(raw) ? raw : raw ? [raw] : [];
          const hit = a.values.find((v) => have.includes(v));
          if (hit) {
            points += a.weight;
            reasons.push(LABELS[a.key] ? LABELS[a.key](hit) : hit);
          } else if (a.key === 'roast_level' && have.length) {
            const distance = Math.min(...a.values.map((v) => Math.abs(ROAST_ORDER.indexOf(v) - ROAST_ORDER.indexOf(have[0]))));
            if (distance === 1) {
              points += a.weight / 2;
              reasons.push(`Close to your roast (${have[0].replace(/-/g, ' ')})`);
            }
          }
          if (a.filter && !hit) excluded = true;
        }
        return { ...p, score: Math.round((points / max) * 100), reasons, excluded, order };
      })
      .filter((p) => !p.excluded)
      .sort((a, b) => b.score - a.score || a.order - b.order);
  }

  if (typeof window !== 'undefined') window.eoQuizScore = scoreProducts;
  if (typeof module !== 'undefined') module.exports = { scoreProducts };
  if (typeof customElements === 'undefined' || customElements.get('eo-quiz')) return;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  customElements.define(
    'eo-quiz',
    class EoQuiz extends HTMLElement {
      connectedCallback() {
        this.products = JSON.parse(this.querySelector('[data-products]').textContent);
        this.t = JSON.parse(this.querySelector('[data-strings]').textContent);
        this.steps = Array.from(this.querySelectorAll('[data-question]'));
        this.form = this.querySelector('[data-form]');
        this.intro = this.querySelector('[data-step="intro"]');
        this.results = this.querySelector('[data-results]');
        this.current = 0;

        this.querySelector('[data-start]').addEventListener('click', () => this.start());
        this.querySelector('[data-restart]').addEventListener('click', () => this.restart());
        this.steps.forEach((step, i) => {
          step.querySelector('[data-next]').addEventListener('click', () => this.next(i));
          step.querySelector('[data-back]').addEventListener('click', () => this.show(i - 1));
          // Single-answer questions advance as soon as an answer is picked.
          if (step.dataset.multi !== 'true') {
            step.querySelectorAll('input').forEach((input) =>
              input.addEventListener('change', () => setTimeout(() => this.next(i), 180))
            );
          }
        });
        this.form.addEventListener('submit', (e) => e.preventDefault());
      }

      start() {
        this.intro.hidden = true;
        this.form.hidden = false;
        this.show(0);
      }

      restart() {
        this.form.reset();
        this.results.hidden = true;
        this.start();
      }

      show(i) {
        if (i < 0) {
          this.form.hidden = true;
          this.intro.hidden = false;
          this.querySelector('[data-start]').focus();
          return;
        }
        this.current = i;
        this.steps.forEach((s, n) => (s.hidden = n !== i));
        const bar = this.querySelector('[data-progress]');
        bar.style.width = `${(i / this.steps.length) * 100}%`;
        bar.parentElement.setAttribute('aria-valuenow', String(i));
        const first = this.steps[i].querySelector('input:checked') || this.steps[i].querySelector('input');
        if (first) first.focus({ preventScroll: true });
        this.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      values(step) {
        return Array.from(step.querySelectorAll('input:checked')).map((i) => i.value);
      }

      next(i) {
        const step = this.steps[i];
        const error = step.querySelector('[data-error]');
        if (!this.values(step).length) {
          error.hidden = false;
          return;
        }
        error.hidden = true;
        if (i + 1 < this.steps.length) this.show(i + 1);
        else this.finish();
      }

      finish() {
        const answers = this.steps.map((s) => ({
          key: s.dataset.key,
          values: this.values(s),
          weight: Number(s.dataset.weight || 1),
          filter: s.dataset.filter === 'true',
        }));
        const ranked = scoreProducts(this.products, answers);
        this.form.hidden = true;
        this.results.hidden = false;
        this.querySelector('[data-results-list]').innerHTML = this.render(ranked);
        this.results.focus({ preventScroll: true });
        this.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      card(p, primary) {
        return `
          <article class="eo-result${primary ? ' eo-result--primary' : ''}">
            <a href="${esc(p.url)}" class="eo-result__media">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.alt)}" width="600" height="600" loading="lazy">` : ''}</a>
            <div class="eo-result__body">
              <span class="eo-badge">${esc(this.t.match.replace('{{ percent }}', p.score))}</span>
              <h3 class="${primary ? 'h1' : 'h3'}"><a href="${esc(p.url)}">${esc(p.title)}</a></h3>
              ${p.notes ? `<p class="eo-muted">${esc(p.notes)}</p>` : ''}
              ${primary && p.reasons.length ? `<p class="eo-result__why">${esc(this.t.why)}</p><ul class="eo-chips" role="list">${p.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
              <p class="eo-result__price">${esc(p.price)}</p>
              <div class="eo-result__actions">
                <button type="button" class="button${primary ? '' : ' button--secondary'} eo-btn" data-eo-add="${esc(p.variant)}"><span class="eo-btn-label">${esc(this.t.add)}</span></button>
                ${primary ? `<a class="eo-link" href="${esc(p.url)}">${esc(this.t.view)}</a>` : ''}
              </div>
            </div>
          </article>`;
      }

      render(ranked) {
        if (!ranked.length) return `<p>${esc(this.t.none)}</p>`;
        const [best, ...rest] = ranked;
        const also = rest.slice(0, 2);
        return `${this.card(best, true)}${also.length ? `<h3 class="eo-quiz__also">${esc(this.t.also)}</h3><div class="eo-result-grid">${also.map((p) => this.card(p, false)).join('')}</div>` : ''}`;
      }
    }
  );
})();
