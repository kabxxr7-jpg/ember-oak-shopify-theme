/* Ember & Oak: lookbook hotspots. One card open at a time; Escape or an outside click closes it. */
if (!customElements.get('eo-lookbook')) {
  customElements.define(
    'eo-lookbook',
    class EoLookbook extends HTMLElement {
      connectedCallback() {
        this.dots = Array.from(this.querySelectorAll('.eo-hotspot__dot'));
        this.dots.forEach((dot) => dot.addEventListener('click', () => this.toggle(dot)));

        // Hovering or focusing a list item highlights its hotspot on the photo.
        this.querySelectorAll('[data-hotspot-index]').forEach((item) => {
          const dot = this.dots[Number(item.dataset.hotspotIndex)];
          if (!dot) return;
          const on = () => dot.classList.add('is-active');
          const off = () => dot.classList.remove('is-active');
          item.addEventListener('mouseenter', on);
          item.addEventListener('mouseleave', off);
          item.addEventListener('focusin', on);
          item.addEventListener('focusout', off);
        });

        this.onDocClick = (e) => {
          if (!e.target.closest('.eo-hotspot')) this.closeAll();
        };
        this.onKey = (e) => {
          if (e.key !== 'Escape') return;
          const open = this.dots.find((d) => d.getAttribute('aria-expanded') === 'true');
          this.closeAll();
          if (open) open.focus();
        };
        document.addEventListener('click', this.onDocClick);
        document.addEventListener('keydown', this.onKey);
      }

      disconnectedCallback() {
        document.removeEventListener('click', this.onDocClick);
        document.removeEventListener('keydown', this.onKey);
      }

      toggle(dot) {
        const open = dot.getAttribute('aria-expanded') === 'true';
        this.closeAll();
        if (open) return;
        dot.setAttribute('aria-expanded', 'true');
        document.getElementById(dot.getAttribute('aria-controls')).hidden = false;
      }

      closeAll() {
        this.dots.forEach((d) => {
          d.setAttribute('aria-expanded', 'false');
          document.getElementById(d.getAttribute('aria-controls')).hidden = true;
        });
      }
    }
  );
}
