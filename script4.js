
/* Auto-scrolling sector ticker. Progressive enhancement: builds a duplicated,
   continuously-scrolling row list (icon + name, one per sector) from the
   static .sector-group markup above, then overlays it on the scrollable
   panel. The static panel is never removed from the DOM or the accessibility
   tree -- typing in the search box (or focusing it) simply hides the overlay
   so the real, filterable list underneath becomes visible again. With
   JavaScript off, #sectorTicker stays [hidden] and the static list is all
   that ever shows. */
(function () {
  'use strict';
  var ticker = document.getElementById('sectorTicker');
  var track = document.getElementById('sectorTickerTrack');
  var searchInput = document.getElementById('sectorFilter');
  if (!ticker || !track) return;

  var rows = [];
  Array.prototype.forEach.call(document.querySelectorAll('.sector-group'), function (g) {
    var cluster = g.getAttribute('data-group');
    Array.prototype.forEach.call(g.querySelectorAll('.sector-chip'), function (chip) {
      rows.push({name: chip.textContent, cluster: cluster});
    });
  });
  if (!rows.length) return;

  function buildRow(r) {
    var div = document.createElement('div');
    div.className = 'sector-row';

    var iconSpan = document.createElement('span');
    iconSpan.className = 'sr-icon';
    iconSpan.setAttribute('aria-hidden', 'true');
    var svgNS = 'http://www.w3.org/2000/svg';
    var xlinkNS = 'http://www.w3.org/1999/xlink';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 120 120');
    var use = document.createElementNS(svgNS, 'use');
    use.setAttributeNS(xlinkNS, 'xlink:href', '#ic-' + r.cluster);
    use.setAttribute('href', '#ic-' + r.cluster);
    svg.appendChild(use);
    iconSpan.appendChild(svg);

    var nameSpan = document.createElement('span');
    nameSpan.className = 'sr-name';
    nameSpan.textContent = r.name;

    div.appendChild(iconSpan);
    div.appendChild(nameSpan);
    return div;
  }

  var frag = document.createDocumentFragment();
  var copies = 2; /* duplicate once so translateY(-50%) loops seamlessly */
  for (var c = 0; c < copies; c++) {
    rows.forEach(function (r) { frag.appendChild(buildRow(r)); });
  }
  track.appendChild(frag);

  ticker.hidden = false;

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      ticker.hidden = searchInput.value.trim().length > 0;
    });
    searchInput.addEventListener('focus', function () {
      ticker.hidden = true;
    });
    searchInput.addEventListener('blur', function () {
      if (searchInput.value.trim().length === 0) ticker.hidden = false;
    });
  }
})();
