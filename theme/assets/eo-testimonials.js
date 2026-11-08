/* Ember & Oak: testimonial slider controls on top of a CSS scroll-snap track. */
if (!customElements.get('eo-testimonials')) {
  customElements.define(
    'eo-testimonials',
    class EoTestimonials extends HTMLElement {
      connectedCallback() {
        this.track = this.querySelector('[data-track]');
        this.slides = Array.from(this.track.children);
        this.dots = Array.from(this.querySelectorAll('[data-dots] button'));
        if (this.slides.length < 2) return;

        this.querySelector('[data-prev]').addEventListener('click', () => this.go(this.index() - 1));
        this.querySelector('[data-next]').addEventListener('click', () => this.go(this.index() + 1));
        this.dots.forEach((dot, i) => dot.addEventListener('click', () => this.go(i)));
        this.track.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); this.go(this.index() + 1); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); this.go(this.index() - 1); }
        });

        let raf;
        this.track.addEventListener('scroll', () => {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => this.sync());
        }, { passive: true });
        this.sync();

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (this.dataset.autoplay === 'true' && !reduced && !window.Shopify?.designMode) {
          this.paused = false;
          const pause = () => (this.paused = true);
          const resume = () => (this.paused = false);
          this.addEventListener('mouseenter', pause);
          this.addEventListener('mouseleave', resume);
          this.addEventListener('focusin', pause);
          this.addEventListener('focusout', resume);
          this.addEventListener('touchstart', pause, { passive: true });
          this.timer = setInterval(() => {
            if (this.paused || document.hidden) return;
            const next = this.index() + 1 >= this.pages() ? 0 : this.index() + 1;
            this.go(next);
          }, Number(this.dataset.speed || 6) * 1000);
        }
      }

      disconnectedCallback() {
        clearInterval(this.timer);
      }

      perView() {
        const first = this.slides[0].getBoundingClientRect().width;
        return Math.max(1, Math.round(this.track.clientWidth / first));
      }

      pages() {
        return this.slides.length - this.perView() + 1;
      }

      index() {
        const step = this.slides[1].offsetLeft - this.slides[0].offsetLeft;
        return Math.round(this.track.scrollLeft / step);
      }

      go(i) {
        const max = this.pages() - 1;
        const target = Math.min(Math.max(i, 0), max);
        this.track.scrollTo({ left: this.slides[target].offsetLeft - this.slides[0].offsetLeft, behavior: 'smooth' });
      }

      sync() {
        const i = this.index();
        const max = this.pages();
        this.dots.forEach((dot, d) => {
          dot.hidden = d >= max;
          dot.setAttribute('aria-current', d === i ? 'true' : 'false');
        });
        this.querySelector('[data-prev]').disabled = i <= 0;
        this.querySelector('[data-next]').disabled = i >= max - 1;
      }
    }
  );
}
