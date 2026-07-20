// <video-slot> — user-fillable VIDEO/motion placeholder.
//
// Companion to image-slot, but keeps motion: the dropped file is stored
// as-is (no canvas re-encode, which would freeze video / animated webp to
// one frame). Renders a muted, looping, autoplaying <video> for video
// files and an <img> for animated image files (webp/gif/apng) or stills.
// Persists the drop across reloads via a .video-slots.state.json sidecar
// (same read-via-fetch / write-via-window.omelette contract as image-slot).
//
// Attributes:
//   id           Persistence key. REQUIRED for the drop to survive reload.
//   shape        rect | rounded | circle | pill        (default 'rounded')
//   radius       Corner radius px for 'rounded'.        (default 12)
//   fit          cover | contain                        (default 'cover')
//   placeholder  Empty-state caption.                   (default 'Drop a video')
//   poster       Optional still shown before/without a drop (image URL).
//   src          Production asset URL (mp4/webm or animated webp/gif). Used
//                when no drop is stored in the sidecar — how deploys ship a
//                real video into the slot without a base64 sidecar blob.
//
// Sizing: fills its container by default; put it in a sized wrapper.

(() => {
  const STATE_FILE = '.video-slots.state.json';
  // Files stored inline in the sidecar as data URLs. Keep clips short —
  // above this the base64 blob bloats the sidecar and the host write can
  // fail. 30MB source ≈ a short 1080p loop.
  const MAX_BYTES = 30 * 1024 * 1024;
  const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
  const IMAGE_TYPES = ['image/webp', 'image/gif', 'image/apng', 'image/png', 'image/jpeg'];
  const ACCEPT = VIDEO_TYPES.concat(IMAGE_TYPES);

  // ── Shared sidecar store (mirrors image-slot) ───────────────────────────
  const subs = new Set();
  let slots = {};
  const tombstones = new Set();
  let loaded = false;
  let loadP = null;

  function load() {
    if (loadP) return loadP;
    loadP = fetch(STATE_FILE)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && typeof j === 'object') {
          const merged = Object.assign({}, j, slots);
          for (const id of tombstones) delete merged[id];
          slots = merged;
        }
        tombstones.clear();
      })
      .catch(() => {})
      .then(() => { loaded = true; subs.forEach((fn) => fn()); });
    return loadP;
  }

  let saving = false, saveDirty = false;
  function save() {
    if (saving) { saveDirty = true; return; }
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return;
    saving = true;
    Promise.resolve(w(STATE_FILE, JSON.stringify(slots)))
      .catch(() => {})
      .then(() => { saving = false; if (saveDirty) { saveDirty = false; save(); } });
  }
  function flushNow() {
    if (!loaded) return;
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return;
    try { Promise.resolve(w(STATE_FILE, JSON.stringify(slots))).catch(() => {}); } catch (e) {}
  }

  function getSlot(id) {
    const v = slots[id];
    if (!v) return null;
    return typeof v === 'string' ? { u: v, t: 'video/mp4' } : v;
  }
  function setSlot(id, val) {
    if (!id) return;
    if (val) { slots[id] = val; tombstones.delete(id); }
    else { delete slots[id]; if (!loaded) tombstones.add(id); }
    subs.forEach((fn) => fn());
    if (loaded) save(); else load().then(save);
  }

  function readDataUrl(file) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = () => rej(fr.error || new Error('read failed'));
      fr.readAsDataURL(file);
    });
  }

  const css =
    ':host{display:block;position:relative;width:100%;height:100%;aspect-ratio:3/2;' +
    '  font:13px/1.3 system-ui,-apple-system,sans-serif;color:rgba(0,0,0,.55)}' +
    '.frame{position:absolute;inset:0;overflow:hidden;background:rgba(0,0,0,.04)}' +
    '.frame video,.frame img{position:absolute;inset:0;width:100%;height:100%;display:none;' +
    '  -webkit-user-drag:none;user-select:none}' +
    '.empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' +
    '  justify-content:center;gap:6px;text-align:center;padding:12px;box-sizing:border-box;' +
    '  cursor:pointer;user-select:none}' +
    '.empty svg{opacity:.45}.empty .cap{max-width:90%;font-weight:500;letter-spacing:.01em}' +
    '.empty .sub{font-size:11px}.empty .sub u{text-underline-offset:2px}' +
    '.empty:hover .sub u{color:rgba(0,0,0,.75)}' +
    '.ring{position:absolute;inset:0;pointer-events:none;border:1.5px dashed rgba(0,0,0,.25)}' +
    ':host([data-filled]) .ring{display:none}' +
    ':host([data-over]) .frame{outline:2px solid #c96442;outline-offset:-2px;' +
    '  background:rgba(201,100,66,.10)}' +
    ':host([data-over]) .ring{border-color:#c96442}' +
    '.ctl{position:absolute;top:8px;right:8px;display:flex;gap:6px;opacity:0;' +
    '  pointer-events:none;transition:opacity .12s;z-index:2}' +
    ':host([data-filled][data-editable]:hover) .ctl{opacity:1;pointer-events:auto}' +
    '.ctl button{appearance:none;border:0;border-radius:6px;padding:5px 10px;cursor:pointer;' +
    '  background:rgba(0,0,0,.65);color:#fff;font:11px/1 system-ui,sans-serif}' +
    '.ctl button:hover{background:rgba(0,0,0,.8)}' +
    '.err{position:absolute;left:8px;bottom:8px;right:8px;color:#b3261e;font-size:11px;' +
    '  background:rgba(255,255,255,.85);padding:4px 6px;border-radius:5px;pointer-events:none}' +
    ':host-context([data-om-exporting]) .ctl{display:none !important}';

  const icon =
    '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="2" y="4" width="14" height="16" rx="2"/>' +
    '<path d="m16 9 6-3v12l-6-3"/></svg>';

  class VideoSlot extends HTMLElement {
    static get observedAttributes() {
      return ['shape', 'radius', 'fit', 'placeholder', 'poster', 'src', 'id'];
    }
    constructor() {
      super();
      const root = this.shadowRoot || this.attachShadow({ mode: 'open', clonable: true });
      root.innerHTML =
        '<style>' + css + '</style>' +
        '<div class="frame" part="frame">' +
        '  <video part="video" muted loop autoplay playsinline></video>' +
        '  <img part="image" alt="" draggable="false">' +
        '  <div class="empty" part="empty">' + icon +
        '    <div class="cap"></div><div class="sub">or <u>browse files</u></div></div>' +
        '  <div class="ring" part="ring"></div>' +
        '</div>' +
        '<div class="ctl"><button data-act="replace">Replace</button>' +
        '  <button data-act="clear">Clear</button></div>' +
        '<input type="file" accept="' + ACCEPT.join(',') + '" hidden>';
      this._frame = root.querySelector('.frame');
      this._video = root.querySelector('video');
      this._img = root.querySelector('img');
      this._empty = root.querySelector('.empty');
      this._cap = root.querySelector('.cap');
      this._sub = root.querySelector('.sub');
      this._ring = root.querySelector('.ring');
      this._ctl = root.querySelector('.ctl');
      this._input = root.querySelector('input');
      this._err = null;
      this._depth = 0;
      this._gen = 0;
      this._subFn = () => this._render();
      this._empty.addEventListener('click', () => this._input.click());
      root.addEventListener('click', (e) => {
        const act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
        if (!act || !this.hasAttribute('data-editable')) return;
        if (act === 'replace') this._input.click();
        if (act === 'clear') { setSlot(this.id || '', null); if (!this.id) { this._local = null; this._render(); } }
      });
      this._input.addEventListener('change', () => {
        const f = this._input.files && this._input.files[0];
        if (f) this._ingest(f);
        this._input.value = '';
      });
    }
    connectedCallback() {
      if (!this.id && !VideoSlot._warned) {
        VideoSlot._warned = true;
        console.warn('<video-slot> without an id will not persist its drop.');
      }
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((t) => this.addEventListener(t, this));
      subs.add(this._subFn);
      this.addEventListener('pointerenter', this._subFn);
      load();
      this._render();
    }
    disconnectedCallback() {
      subs.delete(this._subFn);
      this.removeEventListener('pointerenter', this._subFn);
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((t) => this.removeEventListener(t, this));
    }
    attributeChangedCallback() { if (this.shadowRoot) this._render(); }
    handleEvent(e) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        e.preventDefault(); e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        if (e.type === 'dragenter') this._depth++;
        this.setAttribute('data-over', '');
      } else if (e.type === 'dragleave') {
        if (--this._depth <= 0) { this._depth = 0; this.removeAttribute('data-over'); }
      } else if (e.type === 'drop') {
        e.preventDefault(); e.stopPropagation();
        this._depth = 0; this.removeAttribute('data-over');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) this._ingest(f);
      }
    }
    async _ingest(file) {
      this._setError(null);
      if (!file || ACCEPT.indexOf(file.type) < 0) {
        this._setError('Drop an MP4, WebM, animated WebP or GIF.'); return;
      }
      if (file.size > MAX_BYTES) {
        this._setError('Clip too large — trim to a short loop (under 30MB).'); return;
      }
      const gen = ++this._gen;
      try {
        const url = await readDataUrl(file);
        if (gen !== this._gen) return;
        const val = { u: url, t: file.type };
        setSlot(this.id || '', val);
        if (!this.id) { this._local = val; this._render(); }
      } catch (err) {
        if (gen !== this._gen) return;
        this._setError('Could not read that file.');
        console.warn('<video-slot> ingest failed:', err);
      }
    }
    _setError(msg) {
      if (this._err) { this._err.remove(); this._err = null; }
      if (!msg) return;
      const d = document.createElement('div');
      d.className = 'err'; d.textContent = msg;
      this.shadowRoot.appendChild(d);
      this._err = d;
      setTimeout(() => { if (this._err === d) { d.remove(); this._err = null; } }, 3200);
    }
    _render() {
      const shape = (this.getAttribute('shape') || 'rounded').toLowerCase();
      let radius = '';
      if (shape === 'circle') radius = '50%';
      else if (shape === 'pill') radius = '9999px';
      else if (shape === 'rounded') {
        const n = parseFloat(this.getAttribute('radius'));
        radius = (Number.isFinite(n) ? n : 12) + 'px';
      }
      this._frame.style.borderRadius = radius;
      this._ring.style.borderRadius = radius;
      const fit = (this.getAttribute('fit') || 'cover').toLowerCase() === 'contain' ? 'contain' : 'cover';
      this._video.style.objectFit = fit;
      this._img.style.objectFit = fit;

      const editable = !!(window.omelette && window.omelette.writeFile);
      this.toggleAttribute('data-editable', editable);
      this._sub.style.display = editable ? '' : 'none';
      this._cap.textContent = this.getAttribute('placeholder') || 'Drop a video';

      let stored = this.id ? getSlot(this.id) : this._local;
      if (stored && stored.u && !/^data:/i.test(stored.u)) stored = null;
      const poster = this.getAttribute('poster') || '';
      // Production fallback: a plain src="assets/…" URL shipped with the deploy.
      // Used only when no interactive drop is stored in the sidecar.
      const srcAttr = this.getAttribute('src') || '';
      const url = (stored && stored.u) || srcAttr;
      const type = (stored && stored.t) || '';
      const isImg = url
        ? (IMAGE_TYPES.indexOf(type) >= 0 || (!type && /\.(webp|gif|apng|png|jpe?g|avif)(\?|$)/i.test(url)))
        : false;

      if (url && !isImg) {
        if (this._video.getAttribute('src') !== url) { this._video.src = url; this._video.play && this._video.play().catch(() => {}); }
        this._video.style.display = 'block';
        this._img.style.display = 'none';
        this._img.removeAttribute('src');
        this._empty.style.display = 'none';
        this.setAttribute('data-filled', '');
      } else if (url && isImg) {
        if (this._img.getAttribute('src') !== url) this._img.src = url;
        this._img.style.display = 'block';
        this._video.style.display = 'none';
        this._video.removeAttribute('src');
        this._empty.style.display = 'none';
        this.setAttribute('data-filled', '');
      } else if (poster) {
        if (this._img.getAttribute('src') !== poster) this._img.src = poster;
        this._img.style.display = 'block';
        this._video.style.display = 'none';
        this._empty.style.display = 'none';
        this.setAttribute('data-filled', '');
      } else {
        this._video.style.display = 'none';
        this._img.style.display = 'none';
        this._video.removeAttribute('src');
        this._img.removeAttribute('src');
        this._empty.style.display = 'flex';
        this.removeAttribute('data-filled');
      }
    }
  }
  if (!customElements.get('video-slot')) customElements.define('video-slot', VideoSlot);
  window.addEventListener('pagehide', flushNow);
})();
