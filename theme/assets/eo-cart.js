/*
 * Ember & Oak: shared "add to cart" used by the quiz, lookbook and comparison table.
 * Posts to the AJAX Cart API and hands the response to Dawn's own cart drawer / notification,
 * so the header bubble and drawer update exactly as they do from a product page.
 */
(function () {
  if (window.eoAddToCart) return;

  window.eoAddToCart = async function eoAddToCart(variantId, button) {
    const cart = document.querySelector('cart-drawer') || document.querySelector('cart-notification');
    const body = { items: [{ id: Number(variantId), quantity: 1 }] };
    if (cart && typeof cart.getSectionsToRender === 'function') {
      body.sections = cart.getSectionsToRender().map((s) => s.id);
      body.sections_url = window.location.pathname;
      if (typeof cart.setActiveElement === 'function') cart.setActiveElement(document.activeElement);
    }

    const label = button ? button.querySelector('.eo-btn-label') || button : null;
    const original = label ? label.textContent : '';
    if (button) {
      button.setAttribute('aria-disabled', 'true');
      button.classList.add('loading');
    }

    try {
      const res = await fetch(`${(window.routes && window.routes.cart_add_url) || '/cart/add'}.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.status) throw new Error(data.description || data.message || 'Could not add to cart');

      if (cart && typeof cart.renderContents === 'function') {
        cart.classList.remove('is-empty');
        cart.renderContents({ ...data.items[0], sections: data.sections });
      } else if (label) {
        label.textContent = 'Added ✓';
        setTimeout(() => (label.textContent = original), 2000);
      }
      document.dispatchEvent(new CustomEvent('eo:cart-added', { detail: { variantId } }));
    } catch (err) {
      if (label) {
        label.textContent = err.message;
        setTimeout(() => (label.textContent = original), 3000);
      }
    } finally {
      if (button) {
        button.removeAttribute('aria-disabled');
        button.classList.remove('loading');
      }
    }
  };

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-eo-add]');
    if (!button || button.getAttribute('aria-disabled') === 'true') return;
    event.preventDefault();
    window.eoAddToCart(button.dataset.eoAdd, button);
  });
})();
