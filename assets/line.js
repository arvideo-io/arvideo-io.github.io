/* arvideo.io — "The Line" interactive demo (vanilla port of the design component) */
(function () {
  var FOLDERS = [
    {key:'barnegat', label:'2019 · barnegat light', clips:'214 clips', color:'#1F5CA8', type:'light', det:'barnegat light · 99%', fact:'first lit 1859 — still burning', title:'BARNEGAT LIGHT · JUL 2019', cam:'TRV50 · MINIDV', dur:'3:12'},
    {key:'steam', label:'2024 · gas & steam festival', clips:'96 clips', color:'#C0A05E', type:'steam', det:'flywheel · 96%', fact:'the governor holds 220 rpm', title:'GAS & STEAM · APR 2024', cam:'GL2 · DV', dur:'4:05'},
    {key:'skate', label:'2025 · austin skatepark', clips:'58 clips', color:'#E4762B', type:'skate', det:'skateboard · 97%', fact:'switch 360 flip, second try', title:'AUSTIN SKATEPARK · MAR 2025', cam:'HERO12 · 4K60', dur:'2:31'},
    {key:'culebra', label:'2026 · culebra — day 2', clips:'41 clips', color:'#7FA99B', type:'reef', det:'queen angelfish · 93%', fact:'angelfish patrol one reef for life', title:'CULEBRA DAY 2 · MAY 2026', cam:'X5 · 5.7K', dur:'6:48'},
    {key:'ridge', label:'2025 · avata — the ridge', clips:'12 clips', color:'#D6432E', type:'ridge', det:'dji avata · 99%', fact:'gpmf + flight log, resolved', title:'THE RIDGE · OCT 2025', cam:'AVATA · 4K100', dur:'1:58', drone:true},
    {key:'perseids', label:'2025 · perseids — backyard', clips:'9 clips', color:'#1C3A63', type:'night', det:'perseid · 96%', fact:'sixty meteors an hour, one camera', title:'PERSEIDS · AUG 2025', cam:'HERO12 · NLAPSE', dur:'1:12'}
  ];
  var PROMPTF = {key:'prompt', label:'prompt', color:'#1F5CA8', type:'montage', det:'christmas tree · 99%', fact:'12 christmases, 9 cameras, one cut', title:'MERRY CHRISTMAS — ALL TIME', cam:'MIXED · 9 CAMS', dur:'2:00'};

  var state = {
    sourceMode: 'folders',
    on: {barnegat:true, steam:false, skate:true, culebra:false, ridge:true},
    cut: 'auto', mode: 'none',
    render: 'overlay',
    boxes: true, hud: false, scale: 1
  };

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }

  function lanePath(srcY, tY, oY, dip, dY) {
    var d = 'M 210 ' + srcY + ' C 275 ' + srcY + ' 270 ' + tY + ' 335 ' + tY;
    if (dip) d += ' H 490 C 526 ' + tY + ' 508 ' + dY + ' 544 ' + dY + ' H 744 C 780 ' + dY + ' 762 ' + tY + ' 798 ' + tY;
    d += ' H 862 C 912 ' + tY + ' 894 ' + oY + ' 954 ' + oY;
    return d;
  }

  function chipSt(sel, dis) {
    var s = 'padding:6px 14px;border-radius:999px;font-size:12px;font-weight:800;cursor:pointer;border:2px solid #2A1F16;letter-spacing:.02em;user-select:none;';
    s += sel ? 'background:#2A1F16;color:#FAF7ED;' : 'background:#FAF7ED;color:#2A1F16;';
    if (dis) s += 'opacity:.35;cursor:default;';
    return s;
  }

  /* --- output thumbnail scenes (ported 1:1 from the design doc) --- */
  function sceneSvg(f, star, boxOn, color) {
    var box = function (x, y, w, h) {
      return boxOn ? '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="none" stroke="' + color + '" stroke-width="2"></rect>' : '';
    };
    var open = '<svg viewBox="0 0 170 93" style="position:absolute;inset:0;width:100%;height:100%">';
    if (star) {
      return open +
        '<rect width="170" height="93" fill="#1C3A63"></rect>' +
        '<circle cx="18" cy="70" r="1.4" fill="#EDE6D4"></circle><circle cx="45" cy="80" r="1.1" fill="#EDE6D4"></circle><circle cx="90" cy="76" r="1.5" fill="#EDE6D4"></circle><circle cx="150" cy="66" r="1.2" fill="#EDE6D4"></circle><circle cx="30" cy="16" r="1.3" fill="#EDE6D4"></circle><circle cx="70" cy="52" r="1.2" fill="#EDE6D4"></circle>' +
        '<path d="M22,42 L52,56 L82,36 L112,50 L142,30" fill="none" stroke="#7FA99B" stroke-width="1.4"></path>' +
        '<circle cx="22" cy="42" r="2.4" fill="#F0BC3C"></circle><circle cx="52" cy="56" r="2.4" fill="#F0BC3C"></circle><circle cx="82" cy="36" r="2.4" fill="#F0BC3C"></circle><circle cx="112" cy="50" r="2.4" fill="#F0BC3C"></circle><circle cx="142" cy="30" r="2.4" fill="#F0BC3C"></circle>' +
        '<text x="96" y="26" font-size="7" letter-spacing="1.5" fill="#7FA99B" font-family="Archivo,Helvetica,sans-serif" font-weight="700">CASSIOPEIA</text>' +
        '<rect x="128" y="18" width="28" height="22" fill="none" stroke="' + color + '" stroke-width="2"></rect>' +
        '<rect x="128" y="8" width="42" height="10" fill="' + color + '"></rect>' +
        '<text x="131" y="15.5" font-size="6.5" fill="#FAF7ED" font-family="Archivo,Helvetica,sans-serif" font-weight="700">vega · α lyr</text>' +
        '</svg>';
    }
    switch (f.type) {
      case 'light': return open +
        '<rect width="170" height="93" fill="#F4EFE2"></rect>' +
        '<circle cx="140" cy="18" r="10" fill="#F0BC3C"></circle>' +
        '<rect y="66" width="170" height="27" fill="#7FA99B"></rect>' +
        '<rect x="62" y="20" width="18" height="48" fill="#FAF7ED" stroke="#2A1F16" stroke-width="2"></rect>' +
        '<rect x="62" y="28" width="18" height="8" fill="#D6432E"></rect><rect x="62" y="44" width="18" height="8" fill="#D6432E"></rect>' +
        '<rect x="66" y="12" width="10" height="8" fill="#2A1F16"></rect>' +
        '<line x1="56" y1="14" x2="48" y2="10" stroke="#F0BC3C" stroke-width="2"></line><line x1="86" y1="14" x2="94" y2="10" stroke="#F0BC3C" stroke-width="2"></line>' +
        box(52, 8, 38, 64) + '</svg>';
      case 'steam': return open +
        '<rect width="170" height="93" fill="#F4EFE2"></rect>' +
        '<circle cx="85" cy="56" r="26" fill="#C0A05E" stroke="#2A1F16" stroke-width="4"></circle>' +
        '<g stroke="#2A1F16" stroke-width="3"><line x1="63" y1="56" x2="107" y2="56"></line><line x1="85" y1="34" x2="85" y2="78"></line><line x1="70" y1="41" x2="100" y2="71"></line><line x1="70" y1="71" x2="100" y2="41"></line></g>' +
        '<circle cx="85" cy="56" r="5" fill="#2A1F16"></circle>' +
        '<circle cx="118" cy="22" r="6" fill="#CFC5AC"></circle><circle cx="130" cy="14" r="4.5" fill="#CFC5AC"></circle><circle cx="139" cy="8" r="3" fill="#CFC5AC"></circle>' +
        box(53, 24, 64, 62) + '</svg>';
      case 'skate': return open +
        '<rect width="170" height="93" fill="#F4EFE2"></rect>' +
        '<rect x="96" y="58" width="74" height="12" fill="#2A1F16"></rect><rect x="112" y="70" width="58" height="12" fill="#2A1F16" opacity=".85"></rect><rect x="128" y="82" width="42" height="12" fill="#2A1F16" opacity=".7"></rect>' +
        '<g transform="rotate(-14 56 40)"><rect x="38" y="34" width="36" height="7" rx="3.5" fill="#E4762B"></rect><circle cx="46" cy="45" r="3.2" fill="#2A1F16"></circle><circle cx="66" cy="45" r="3.2" fill="#2A1F16"></circle></g>' +
        '<path d="M26,60 Q46,54 64,58" fill="none" stroke="#B9AD93" stroke-width="2"></path>' +
        box(30, 22, 54, 34) + '</svg>';
      case 'reef': return open +
        '<rect width="170" height="93" fill="#7FA99B"></rect>' +
        '<rect width="170" height="10" fill="#FAF7ED" opacity=".28"></rect><rect y="14" width="170" height="5" fill="#FAF7ED" opacity=".16"></rect>' +
        '<ellipse cx="78" cy="54" rx="24" ry="13" fill="#FAF7ED"></ellipse>' +
        '<path d="M100,54 L118,42 L118,66 Z" fill="#FAF7ED"></path>' +
        '<circle cx="62" cy="51" r="2.2" fill="#2A1F16"></circle>' +
        '<line x1="74" y1="43" x2="74" y2="65" stroke="#2A1F16" stroke-width="2.5"></line><line x1="84" y1="44" x2="84" y2="64" stroke="#2A1F16" stroke-width="2.5"></line>' +
        '<circle cx="52" cy="34" r="2" fill="#FAF7ED" opacity=".7"></circle><circle cx="47" cy="26" r="1.4" fill="#FAF7ED" opacity=".7"></circle>' +
        box(46, 34, 80, 40) + '</svg>';
      case 'ridge': return open +
        '<rect width="170" height="93" fill="#F4EFE2"></rect>' +
        '<path d="M0,74 L44,46 L78,66 L120,40 L170,68 V93 H0 Z" fill="#B9AD93"></path>' +
        '<path d="M0,86 L54,62 L96,80 L140,58 L170,76 V93 H0 Z" fill="#D6432E"></path>' +
        '<g stroke="#2A1F16" stroke-width="2.5"><line x1="74" y1="24" x2="98" y2="36"></line><line x1="98" y1="24" x2="74" y2="36"></line></g>' +
        '<circle cx="72" cy="23" r="5" fill="none" stroke="#2A1F16" stroke-width="2"></circle><circle cx="100" cy="23" r="5" fill="none" stroke="#2A1F16" stroke-width="2"></circle><circle cx="72" cy="37" r="5" fill="none" stroke="#2A1F16" stroke-width="2"></circle><circle cx="100" cy="37" r="5" fill="none" stroke="#2A1F16" stroke-width="2"></circle>' +
        '<rect x="81" y="27" width="10" height="6" fill="#2A1F16"></rect>' +
        box(58, 10, 56, 38) + '</svg>';
      case 'night': return open +
        '<rect width="170" height="93" fill="#1C3A63"></rect>' +
        '<circle cx="14" cy="20" r="1.3" fill="#EDE6D4"></circle><circle cx="38" cy="44" r="1.1" fill="#EDE6D4"></circle><circle cx="58" cy="14" r="1.5" fill="#EDE6D4"></circle><circle cx="84" cy="52" r="1.2" fill="#EDE6D4"></circle><circle cx="118" cy="46" r="1.3" fill="#EDE6D4"></circle><circle cx="146" cy="30" r="1.6" fill="#EDE6D4"></circle><circle cx="160" cy="54" r="1.1" fill="#EDE6D4"></circle><circle cx="30" cy="60" r="1.2" fill="#EDE6D4"></circle>' +
        '<line x1="98" y1="12" x2="130" y2="32" stroke="#EDE6D4" stroke-width="2" stroke-linecap="round"></line>' +
        '<line x1="52" y1="26" x2="72" y2="39" stroke="#EDE6D4" stroke-width="1.2" stroke-linecap="round" opacity=".6"></line>' +
        '<path d="M0,82 L44,70 L86,78 L132,66 L170,76 V93 H0 Z" fill="#10203A"></path>' +
        box(90, 4, 48, 34) + '</svg>';
      case 'montage': return open +
        '<rect width="170" height="93" fill="#F4EFE2"></rect>' +
        '<rect x="8" y="30" width="46" height="34" fill="#FAF7ED" stroke="#2A1F16" stroke-width="2"></rect>' +
        '<rect x="62" y="26" width="50" height="42" fill="#FAF7ED" stroke="#2A1F16" stroke-width="2.5"></rect>' +
        '<rect x="120" y="30" width="46" height="34" fill="#FAF7ED" stroke="#2A1F16" stroke-width="2"></rect>' +
        '<path d="M87,34 L99,52 H75 Z" fill="#77863F"></path><path d="M87,42 L101,62 H73 Z" fill="#77863F"></path><rect x="84" y="62" width="6" height="5" fill="#2A1F16"></rect>' +
        '<path d="M87,28 l1.8,3.6 4,.6 -2.9,2.8 .7,4 -3.6,-1.9 -3.6,1.9 .7,-4 -2.9,-2.8 4,-.6 Z" fill="#F0BC3C"></path>' +
        box(60, 24, 54, 46) + '</svg>';
    }
    return open + '</svg>';
  }

  function outputHtml(f, idx, opts) {
    var star = opts.star, boxOn = opts.boxOn && !star, hud = opts.hud;
    var hudInk = (star || f.type === 'night') ? '#EDE6D4' : '#2A1F16';
    var h = '<div style="position:absolute;right:12px;top:' + (30 + idx * 104) + 'px;width:156px">' +
      '<div style="position:relative;height:88px;border:3px solid ' + f.color + ';border-radius:6px;overflow:hidden;background:#F4EFE2;box-sizing:border-box">' +
      sceneSvg(f, star, boxOn, f.color);
    if (boxOn) h += '<div style="position:absolute;left:4px;top:4px;background:' + f.color + ';color:#FAF7ED;font-size:6.8px;font-weight:700;letter-spacing:.04em;padding:2px 6px;pointer-events:none">' + esc(f.det) + '</div>';
    if (opts.review) h += '<div style="position:absolute;left:0;right:0;bottom:0;height:9px;display:flex">' +
      '<span style="flex:1;background:' + f.color + ';opacity:.9"></span><span style="flex:1;background:#2A1F16;opacity:.75"></span><span style="flex:1;background:' + f.color + ';opacity:.6"></span><span style="flex:1;background:#2A1F16;opacity:.5"></span><span style="flex:1;background:' + f.color + ';opacity:.4"></span></div>';
    if (!star) h += '<div style="position:absolute;left:5px;bottom:5px;background:rgba(250,247,237,.94);color:#2A1F16;font-size:6.8px;font-weight:800;letter-spacing:.1em;padding:2.5px 6px;pointer-events:none">' + esc(f.title) + '</div>';
    if (hud) {
      h += '<div style="position:absolute;inset:0;pointer-events:none">' +
        '<div style="position:absolute;left:3px;top:3px;width:10px;height:10px;border-left:2px solid ' + hudInk + ';border-top:2px solid ' + hudInk + '"></div>' +
        '<div style="position:absolute;right:3px;top:3px;width:10px;height:10px;border-right:2px solid ' + hudInk + ';border-top:2px solid ' + hudInk + '"></div>' +
        '<div style="position:absolute;left:3px;bottom:3px;width:10px;height:10px;border-left:2px solid ' + hudInk + ';border-bottom:2px solid ' + hudInk + '"></div>' +
        '<div style="position:absolute;right:3px;bottom:3px;width:10px;height:10px;border-right:2px solid ' + hudInk + ';border-bottom:2px solid ' + hudInk + '"></div>' +
        '<div style="position:absolute;left:16px;top:5px;font-size:6px;font-weight:700;letter-spacing:.06em;color:' + hudInk + '">' + esc(f.cam) + '</div>' +
        '<div style="position:absolute;right:16px;top:5px;font-size:6px;font-weight:700;color:' + hudInk + '">59.94 · TC ' + esc(f.dur) + '</div>' +
        '<div style="position:absolute;right:5px;top:20px;display:flex;flex-direction:column;gap:1.5px;align-items:flex-end">' +
        '<span style="width:14px;height:2.5px;background:' + hudInk + ';opacity:.9"></span><span style="width:10px;height:2.5px;background:' + hudInk + ';opacity:.7"></span><span style="width:6px;height:2.5px;background:' + hudInk + ';opacity:.5"></span></div>' +
        '<div style="position:absolute;left:16px;bottom:18px;font-size:6px;font-weight:700;letter-spacing:.06em;color:' + hudInk + '">GPS ✔ · MOTION .87</div>';
      if (f.drone) h += '<div style="position:absolute;left:50%;bottom:26px;transform:translateX(-50%);border:1.5px solid ' + hudInk + ';border-radius:4px;padding:1.5px 5px;font-size:6px;font-weight:800;letter-spacing:.08em;color:' + hudInk + ';background:rgba(250,247,237,.6)">ALT 122M · SPD 14 M/S · HDG 214°</div>';
      h += '</div>';
    }
    h += '</div><div style="margin-top:5px;font-size:9px;font-weight:700;letter-spacing:.08em;color:#6A5A48;line-height:1.4">' + esc(opts.caption) + '</div></div>';
    return h;
  }

  function chip(label, sel, dis, onclick) {
    var el = document.createElement('span');
    el.style.cssText = chipSt(sel, dis);
    el.textContent = label;
    if (!dis) el.onclick = onclick;
    return el;
  }

  function render() {
    var s = state, F = FOLDERS;
    var promptActive = s.sourceMode === 'prompt';
    var act = promptActive ? [] : F.filter(function (f) { return s.on[f.key]; });
    var allNight = !promptActive && act.length > 0 && act.every(function (f) { return f.type === 'night'; });
    var rnd = (s.render === 'star' && !allNight) ? 'overlay' : s.render;
    var detOn = rnd === 'overlay' || rnd === 'star' || s.mode === 'guide';
    var boxesOn = (rnd === 'star' || s.mode === 'guide') ? true : (rnd === 'overlay' ? s.boxes : false);
    var boxesEnabled = rnd === 'overlay' && s.mode !== 'guide';
    var n = promptActive ? 1 : act.length;
    var tBase = 170 - (Math.max(n, 1) - 1) * 8, dBase = 430 - (Math.max(n, 1) - 1) * 8;

    /* option chips */
    var mount = function (id, defs) {
      var box = $(id); box.innerHTML = '';
      defs.forEach(function (d) { box.appendChild(d); });
    };
    var setOpt = function (field, k) {
      return function () {
        if (field === 'mode' && k === 'guide') {
          state.mode = 'guide';
          if (state.render === 'normal') state.render = 'overlay';
        } else state[field] = k;
        render();
      };
    };
    mount('cutOpts', [
      chip('auto', s.cut === 'auto', false, setOpt('cut', 'auto')),
      chip('ai-edit', s.cut === 'ai-edit', false, setOpt('cut', 'ai-edit')),
      chip('review', s.cut === 'review', false, setOpt('cut', 'review'))
    ]);
    mount('modeOpts', [
      chip('standard', s.mode === 'none', false, setOpt('mode', 'none')),
      chip('guide', s.mode === 'guide', false, setOpt('mode', 'guide'))
    ]);
    mount('renderOpts', [
      chip('normal', rnd === 'normal', false, setOpt('render', 'normal')),
      chip('overlay', rnd === 'overlay', false, setOpt('render', 'overlay')),
      chip('star', rnd === 'star' && allNight, !allNight, setOpt('render', 'star'))
    ]);
    var bx = $('boxesChip');
    bx.style.cssText = chipSt(boxesOn, !boxesEnabled);
    bx.onclick = boxesEnabled ? function () { state.boxes = !state.boxes; render(); } : null;
    var hd = $('hudChip');
    hd.style.cssText = chipSt(s.hud, false);
    hd.onclick = function () { state.hud = !state.hud; render(); };

    var boxNote = '';
    if (!allNight) boxNote = 'star needs a night-sky event — try perseids';
    else if (rnd === 'star') boxNote = 'star renders include boxes';
    else if (rnd === 'normal') boxNote = 'boxes need overlay or star';
    if (s.mode === 'guide') boxNote = 'guide keeps boxes on' + (boxNote ? ' · ' + boxNote : '');
    $('boxNote').textContent = boxNote;

    /* folder chips + prompt */
    var fc = $('folderChips'); fc.innerHTML = '';
    F.forEach(function (f, i) {
      var on = !promptActive && s.on[f.key];
      var el = document.createElement('div');
      el.style.cssText = 'position:absolute;left:0;top:' + (37 + i * 50) + 'px;width:200px;height:44px;box-sizing:border-box;border:2.5px solid ' + (on ? f.color : '#B9AD93') + ';background:' + (on ? '#FAF7ED' : 'transparent') + ';opacity:' + (promptActive ? .45 : (on ? 1 : .6)) + ';border-radius:10px;display:flex;align-items:center;gap:9px;padding:0 12px;cursor:pointer';
      el.innerHTML = '<span style="width:11px;height:11px;background:' + f.color + ';flex:none;border-radius:3px"></span>' +
        '<span style="font-size:11.5px;font-weight:700;color:#2A1F16;line-height:1.2">' + esc(f.label) + '<br><span style="font-weight:600;font-size:9.5px;color:#6A5A48;letter-spacing:.06em">' + esc(f.clips) + '</span></span>';
      el.onclick = function () { state.sourceMode = 'folders'; state.on[f.key] = !state.on[f.key]; render(); };
      fc.appendChild(el);
    });
    var pc = $('promptChip');
    pc.style.borderColor = promptActive ? '#1F5CA8' : '#B9AD93';
    pc.style.background = promptActive ? '#FAF7ED' : 'transparent';
    pc.style.opacity = promptActive ? 1 : .75;
    pc.onclick = function () { state.sourceMode = 'prompt'; render(); };

    /* lanes + outputs */
    var lanes = $('lanes'); lanes.innerHTML = '';
    var outs = $('outputs'); outs.innerHTML = '';
    var mk = function (f, idx, srcY) {
      var tY = tBase + idx * 16, dY = dBase + idx * 16, oCy = 74 + idx * 104;
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', lanePath(srcY, tY, oCy, detOn, dY));
      p.setAttribute('fill', 'none'); p.setAttribute('stroke', f.color);
      p.setAttribute('stroke-width', '12'); p.setAttribute('stroke-linecap', 'round');
      lanes.appendChild(p);
      var star = rnd === 'star';
      var caption;
      if (s.cut === 'review') caption = 'review — all clips, back to back · no music';
      else if (star) caption = 'star — ids vetted by the committee';
      else if (s.mode === 'guide') caption = 'guide — cut follows the detections';
      else if (boxesOn) caption = f.fact;
      else caption = (s.cut === 'ai-edit' ? 'ai directed · byo keys' : 'cut to the beat') + ' · ' + f.dur;
      outs.insertAdjacentHTML('beforeend', outputHtml(f, idx, {
        star: star, boxOn: boxesOn, hud: s.hud, review: s.cut === 'review', caption: caption
      }));
    };
    if (promptActive) mk(PROMPTF, 0, 370);
    else act.forEach(function (f, i) { mk(f, i, 59 + F.indexOf(f) * 50); });
    $('noOutputs').style.display = n === 0 ? '' : 'none';

    /* detections rail */
    $('ghostPath').setAttribute('opacity', detOn ? 0 : .35);
    $('detGates').setAttribute('opacity', detOn ? 1 : .3);
    document.querySelectorAll('.detop').forEach(function (el) { el.style.opacity = detOn ? 1 : .3; });
    $('railA').textContent = rnd === 'star' ? 'HIPPARCOS' : 'LOCAL';
    $('railB').textContent = rnd === 'star' ? 'IAU' : 'EXPERT';
    $('railC').textContent = rnd === 'star' ? 'SKYFIELD' : 'COMMITTEE';
    $('railSub1').textContent = rnd === 'star' ? 'plate-solve — stars are solved against the catalog, not detected' : 'local: yoloe · sam2 — expert picked to fit the event';
    $('railSub2').textContent = rnd === 'star' ? 'hipparcos catalog · iau designations · skyfield ephemeris' : 'committee: gemini · perplexity · openai — claude presiding';
    $('detState').textContent = 'DETECTIONS — ' + (detOn ? (rnd === 'star' ? 'PLATE-SOLVE, ON THE LINE' : 'ON THE LINE') : 'IDLE — NOT NEEDED FOR THIS RENDER');
    $('detNote').textContent = (!promptActive && act.some(function (f) { return f.drone; }) && rnd !== 'star') ? 'drone mode (upcoming) — solved against openstreetmap overpass' : '';

    var modeName = s.mode === 'none' ? 'STANDARD' : s.mode.toUpperCase();
    $('slateLine').textContent = 'SLATE — CUT ' + s.cut.toUpperCase() + ' · ' + modeName + ' · ' + rnd.toUpperCase() + (boxesOn ? ' + BOXES' : '') + (s.hud ? ' · HUD' : '') + (detOn ? ' · DETECTIONS ON' : '');
  }

  /* responsive scale: fixed 1160×640 canvas, scaled to fit */
  function attachScale() {
    var outer = $('lineOuter'), inner = $('lineInner');
    if (!outer || typeof ResizeObserver === 'undefined') return;
    var apply = function (w) {
      var sc = Math.max(.3, Math.min(1, w / 1160));
      inner.style.transform = 'scale(' + sc + ')';
      outer.style.height = Math.round(640 * sc) + 'px';
    };
    new ResizeObserver(function (es) { apply(es[0].contentRect.width); }).observe(outer);
    apply(outer.getBoundingClientRect().width);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { attachScale(); render(); });
  } else { attachScale(); render(); }
})();
