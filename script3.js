
/* Sector filter. Operates on the static markup so the list still renders,
   and remains readable, if this never runs. */
(function () {
  'use strict';
  var debounce = null;

  window.filterSectors = function (raw) {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(function () { run(raw); }, 90);
  };

  function run(raw) {
    var q = (raw || '').trim().toLowerCase();
    var groups = document.querySelectorAll('.sector-group');
    var shown = 0;

    Array.prototype.forEach.call(groups, function (g) {
      var groupName = (g.querySelector('.sg-name').textContent || '').toLowerCase();
      var groupMatch = q && groupName.indexOf(q) !== -1;
      var visibleInGroup = 0;

      Array.prototype.forEach.call(g.querySelectorAll('.sector-chip'), function (chip) {
        if (!chip.dataset.original) chip.dataset.original = chip.textContent;
        var text = chip.dataset.original;
        var hit = !q || groupMatch || text.toLowerCase().indexOf(q) !== -1;
        chip.hidden = !hit;
        if (hit) {
          visibleInGroup++;
          /* highlight any chip that matches on its own text; chips shown
             only because the cluster name matched stay unhighlighted */
          highlight(chip, text, q);
        }
      });

      g.hidden = visibleInGroup === 0;
      var badge = g.querySelector('.sg-count');
      if (badge) badge.textContent = visibleInGroup;
      shown += visibleInGroup;
    });

    var empty = document.getElementById('sectorEmpty');
    if (empty) empty.classList.toggle('show', shown === 0);
    updateCount(q, shown);
    announce(shown === 0
      ? 'No sectors match ' + q
      : shown + (shown === 1 ? ' sector' : ' sectors') + ' shown');
  }

  /* Wrap the matched run in <mark>, without using innerHTML on user input. */
  function highlight(chip, text, q) {
    while (chip.firstChild) chip.removeChild(chip.firstChild);
    var i = q ? text.toLowerCase().indexOf(q) : -1;
    if (i === -1) { chip.appendChild(document.createTextNode(text)); return; }
    chip.appendChild(document.createTextNode(text.slice(0, i)));
    var m = document.createElement('mark');
    m.appendChild(document.createTextNode(text.slice(i, i + q.length)));
    chip.appendChild(m);
    chip.appendChild(document.createTextNode(text.slice(i + q.length)));
  }

  /* Keep the running total honest while a filter is active. */
  var TOTAL = null;
  function updateCount(q, shown) {
    var line = document.getElementById('sectorCountLine');
    if (!line) return;
    if (TOTAL === null) TOTAL = document.querySelectorAll('.sector-chip').length;
    while (line.firstChild) line.removeChild(line.firstChild);
    var b = document.createElement('b');
    if (!q) {
      b.appendChild(document.createTextNode(String(TOTAL)));
      line.appendChild(b);
      line.appendChild(document.createTextNode(' sectors across '));
      var b2 = document.createElement('b');
      b2.appendChild(document.createTextNode(String(document.querySelectorAll('.sector-group').length)));
      line.appendChild(b2);
      line.appendChild(document.createTextNode(' clusters'));
    } else {
      b.appendChild(document.createTextNode(String(shown)));
      line.appendChild(b);
      line.appendChild(document.createTextNode(' of ' + TOTAL + (shown === 1 ? ' sector' : ' sectors')));
    }
  }

  var live = null;
  function announce(msg) {
    if (!live) {
      live = document.createElement('div');
      live.className = 'sr-only';
      live.setAttribute('role', 'status');
      live.setAttribute('aria-live', 'polite');
      document.body.appendChild(live);
    }
    live.textContent = msg;
  }
})();
