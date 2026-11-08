/*
 * Ember & Oak: stockist finder. geocodeZip() is called at most once per ZIP per browser (localStorage cache);
 * sortByDistance() is pure and unit-tested in tests/locator.test.mjs.
 */
(function () {
  const R_MI = 3958.8;
  const R_KM = 6371;

  function haversine(a, b, unit) {
    const rad = (d) => (d * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * (unit === 'km' ? R_KM : R_MI) * Math.asin(Math.sqrt(h));
  }

  function sortByDistance(locations, origin, { unit = 'mi', kind = 'all', limit = Infinity } = {}) {
    return locations
      .filter((l) => kind === 'all' || l.kind === kind)
      .filter((l) => Number.isFinite(Number(l.lat)) && Number.isFinite(Number(l.lng)))
      .map((l) => ({ ...l, distance: haversine(origin, { lat: Number(l.lat), lng: Number(l.lng) }, unit) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  }

  const CACHE_KEY = 'eo:zip-geocode:v1';
  function readCache() {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  async function geocodeZip(zip, fetchImpl = fetch) {
    const cache = readCache();
    if (cache[zip]) return { ...cache[zip], cached: true };
    const res = await fetchImpl(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
    const data = await res.json();
    const place = data.places && data.places[0];
    if (!place) return null;
    const result = { lat: Number(place.latitude), lng: Number(place.longitude), place: `${place['place name']}, ${place['state abbreviation']}` };
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ...cache, [zip]: result }));
    } catch (e) {
      /* storage full or blocked: still works, just not cached */
    }
    return result;
  }

  if (typeof window !== 'undefined') window.eoLocator = { haversine, sortByDistance, geocodeZip };
  if (typeof module !== 'undefined') module.exports = { haversine, sortByDistance, geocodeZip };
  if (typeof customElements === 'undefined' || customElements.get('eo-locator')) return;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  customElements.define(
    'eo-locator',
    class EoLocator extends HTMLElement {
      connectedCallback() {
        this.locations = JSON.parse(this.querySelector('[data-locations]').textContent);
        this.t = JSON.parse(this.querySelector('[data-strings]').textContent);
        this.list = this.querySelector('[data-list]');
        this.status = this.querySelector('[data-status]');
        this.input = this.querySelector('input[name="zip"]');
        this.unit = this.dataset.unit || 'mi';
        this.limit = Number(this.dataset.limit || 8);
        this.origin = null;

        this.querySelector('[data-form]').addEventListener('submit', (e) => {
          e.preventDefault();
          this.searchZip(this.input.value.trim());
        });
        this.querySelector('[data-geo]').addEventListener('click', () => this.useLocation());
        this.querySelectorAll('input[type="radio"]').forEach((r) => r.addEventListener('change', () => this.render()));
      }

      kind() {
        const checked = this.querySelector('input[type="radio"]:checked');
        return checked ? checked.value : 'all';
      }

      async searchZip(zip) {
        if (!/^\d{5}$/.test(zip)) {
          this.say(this.t.badZip, true);
          this.input.focus();
          return;
        }
        this.say(this.t.locating);
        try {
          const geo = await geocodeZip(zip);
          if (!geo) return this.say(this.t.notFound, true);
          this.origin = geo;
          this.render();
        } catch (err) {
          this.say(err.message, true);
        }
      }

      useLocation() {
        if (!navigator.geolocation) return this.say(this.t.geoDenied, true);
        this.say(this.t.locating);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            this.origin = { lat: pos.coords.latitude, lng: pos.coords.longitude, place: this.t.yourLocation };
            this.render();
          },
          () => this.say(this.t.geoDenied, true),
          { timeout: 10000, maximumAge: 600000 }
        );
      }

      say(msg, isError = false) {
        this.status.textContent = msg;
        this.status.classList.toggle('is-error', isError);
      }

      render() {
        if (!this.origin) {
          // No search yet: just apply the filter to the server-rendered list.
          this.list.querySelectorAll('[data-kind]').forEach((li) => {
            li.hidden = this.kind() !== 'all' && li.dataset.kind !== this.kind();
          });
          return;
        }
        const rows = sortByDistance(this.locations, this.origin, { unit: this.unit, kind: this.kind(), limit: this.limit });
        this.say(this.t.near.replace('__N__', rows.length).replace('__PLACE__', this.origin.place));
        this.list.innerHTML = rows
          .map((l, i) => {
            const q = encodeURIComponent(`${l.address}, ${l.city}, ${l.state} ${l.zip}`);
            return `<li class="eo-store${i === 0 ? ' is-nearest' : ''}">
              <div>
                <span class="eo-badge eo-badge--quiet">${esc(this.t[l.kind] || l.kind)}</span>
                <h3 class="eo-store__name">${esc(l.name)}</h3>
                <p class="eo-muted">${esc(l.address)}, ${esc(l.city)}, ${esc(l.state)} ${esc(l.zip)}</p>
                ${l.hours ? `<p class="eo-store__hours">${esc(l.hours)}</p>` : ''}
              </div>
              <div class="eo-store__side">
                <strong class="eo-store__distance">${l.distance < 10 ? l.distance.toFixed(1) : Math.round(l.distance).toLocaleString()} ${this.unit}</strong>
                <a class="eo-link" href="https://www.google.com/maps/dir/?api=1&destination=${q}" target="_blank" rel="noopener">${esc(this.t.directions)}</a>
              </div>
            </li>`;
          })
          .join('');
      }
    }
  );
})();
