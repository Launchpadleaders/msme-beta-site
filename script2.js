
/* ============================================================
   PRODUCTION BEHAVIOUR LAYER v6
   Mobile navigation, focus management, scroll reveal, and
   live-region announcements. Written to degrade safely: if this
   script never runs, nothing is hidden and every link still works.
   ============================================================ */
(function () {
  'use strict';

  var PAGES = ['overview', 'diagnose', 'develop', 'deliver', 'about'];
  var reduceMotion = window.matchMedia &&
                     window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     Focus trap — shared by the menu drawer and the auth modal
     --------------------------------------------------------- */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]),' +
                  'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function trapFocus(container, e) {
    var items = Array.prototype.filter.call(
      container.querySelectorAll(FOCUSABLE),
      function (el) { return el.offsetParent !== null; }
    );
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function firstFocusable(container) {
    var items = container.querySelectorAll(FOCUSABLE);
    return items.length ? items[0] : null;
  }

  /* ---------------------------------------------------------
     Mobile navigation drawer
     --------------------------------------------------------- */
  var drawer = document.getElementById('mobileNav');
  var scrim = document.getElementById('mobileNavScrim');
  var toggle = document.getElementById('navToggle');
  var lastNavFocus = null;

  function openMobileNav() {
    if (!drawer) return;
    lastNavFocus = document.activeElement;
    drawer.classList.add('open');
    if (scrim) scrim.classList.add('open');
    if (toggle) { toggle.setAttribute('aria-expanded', 'true'); toggle.setAttribute('aria-label', 'Close menu'); }
    document.body.classList.add('nav-open');
    var f = firstFocusable(drawer);
    if (f) f.focus();
  }

  function closeMobileNav() {
    if (!drawer) return;
    drawer.classList.remove('open');
    if (scrim) scrim.classList.remove('open');
    if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open menu'); }
    document.body.classList.remove('nav-open');
    if (lastNavFocus && lastNavFocus.focus) lastNavFocus.focus();
    lastNavFocus = null;
  }

  function toggleMobileNav() {
    if (!drawer) return;
    if (drawer.classList.contains('open')) closeMobileNav();
    else openMobileNav();
  }

  window.openMobileNav = openMobileNav;
  window.closeMobileNav = closeMobileNav;
  window.toggleMobileNav = toggleMobileNav;

  /* Keep the drawer's active state in step with the router. */
  function syncMobileNav(page) {
    PAGES.forEach(function (p) {
      var link = document.getElementById('mnav-' + p);
      if (link) link.classList.toggle('active', p === page);
    });
  }

  /* Mirror the header's Register/Login controls into the drawer,
     since those controls are hidden on narrow screens. */
  function renderDrawerActions() {
    var box = document.getElementById('mnavActions');
    if (!box) return;
    var loggedIn = document.getElementById('authLoggedIn');
    var isIn = loggedIn && loggedIn.style.display !== 'none';
    if (isIn) {
      var greeting = document.getElementById('authGreeting');
      box.innerHTML =
        '<div style="font-size:13.5px;font-weight:600;color:var(--paper-ink);padding:2px 4px 6px;">' +
        (greeting ? greeting.textContent : '') + '</div>' +
        '<button type="button" class="btn btn-ghost-light" ' +
        'onclick="doLogout(); closeMobileNav();">Log out</button>';
    } else {
      box.innerHTML =
        '<button type="button" class="btn btn-primary" ' +
        'onclick="closeMobileNav(); openAuthModal(\'register\');">Register</button>' +
        '<button type="button" class="btn btn-ghost-light" ' +
        'onclick="closeMobileNav(); openAuthModal(\'login\');">Log in</button>';
    }
  }

  /* Close the drawer if the viewport grows past the breakpoint. */
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (window.innerWidth > 980 && drawer && drawer.classList.contains('open')) {
        closeMobileNav();
      }
    }, 120);
  });

  /* ---------------------------------------------------------
     Escape + focus trapping for both overlays
     --------------------------------------------------------- */
  document.addEventListener('keydown', function (e) {
    var modal = document.getElementById('authModalOverlay');
    var modalOpen = modal && modal.classList.contains('open');
    var navOpen = drawer && drawer.classList.contains('open');

    if (e.key === 'Escape' || e.key === 'Esc') {
      if (modalOpen && typeof window.closeAuthModal === 'function') { window.closeAuthModal(); return; }
      if (navOpen) { closeMobileNav(); return; }
      var panel = document.getElementById('msme-assist-panel');
      if (panel && panel.classList.contains('open') && typeof window.toggleAssist === 'function') {
        window.toggleAssist();
      }
      return;
    }
    if (e.key === 'Tab') {
      if (modalOpen) trapFocus(modal, e);
      else if (navOpen) trapFocus(drawer, e);
    }
  });

  /* The two audience pillars share one Register button; hide it once the
     visitor is signed in. */
  function syncRegisterCtas() {
    var loggedIn = document.getElementById('authLoggedIn');
    var isIn = loggedIn && loggedIn.style.display !== 'none';
    ['devRegisterCta', 'delRegisterCta'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = isIn ? 'none' : 'flex';
    });
  }

  /* ---------------------------------------------------------
     Wrap the existing router and auth helpers, rather than
     rewriting them, so their original behaviour is preserved.
     --------------------------------------------------------- */
  var originalGoTo = window.goTo;
  if (typeof originalGoTo === 'function') {
    window.goTo = function (page) {
      originalGoTo(page);
      syncMobileNav(page);
      initReveal();
    };
  }

  var originalGates = window.refreshAccessGates;
  if (typeof originalGates === 'function') {
    window.refreshAccessGates = function () {
      originalGates();
      renderDrawerActions();
      syncRegisterCtas();
    };
  }

  /* Auth modal: remember and restore the trigger's focus. */
  var lastModalFocus = null;
  var originalOpenAuth = window.openAuthModal;
  if (typeof originalOpenAuth === 'function') {
    window.openAuthModal = function (mode) {
      lastModalFocus = document.activeElement;
      originalOpenAuth(mode);
      var modal = document.getElementById('authModalOverlay');
      if (modal) {
        var f = firstFocusable(modal);
        if (f) f.focus();
      }
    };
  }
  var originalCloseAuth = window.closeAuthModal;
  if (typeof originalCloseAuth === 'function') {
    window.closeAuthModal = function () {
      originalCloseAuth();
      if (lastModalFocus && lastModalFocus.focus) lastModalFocus.focus();
      lastModalFocus = null;
    };
  }

  /* Assist launcher: keep aria-expanded truthful. */
  var originalAssist = window.toggleAssist;
  if (typeof originalAssist === 'function') {
    window.toggleAssist = function () {
      originalAssist();
      var panel = document.getElementById('msme-assist-panel');
      var launcher = document.getElementById('msme-assist-launcher');
      if (panel && launcher) {
        var open = panel.classList.contains('open');
        launcher.setAttribute('aria-expanded', open ? 'true' : 'false');
        launcher.setAttribute('aria-label', open ? 'Close MSME Assist' : 'Open MSME Assist');
      }
    };
  }

  /* ---------------------------------------------------------
     Filter result announcements for screen readers
     --------------------------------------------------------- */
  var announcer = null;
  function announce(msg) {
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.className = 'sr-only';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      document.body.appendChild(announcer);
    }
    announcer.textContent = msg;
  }

  function countVisible(gridId, itemSelector) {
    var grid = document.getElementById(gridId);
    if (!grid) return null;
    return Array.prototype.filter.call(
      grid.querySelectorAll(itemSelector),
      function (el) { return el.style.display !== 'none'; }
    ).length;
  }

  function wrapFilter(name, gridId, itemSelector, noun) {
    var original = window[name];
    if (typeof original !== 'function') return;
    window[name] = function () {
      original.apply(this, arguments);
      var n = countVisible(gridId, itemSelector);
      if (n === null) return;
      announce(n === 0
        ? 'No ' + noun + ' match the current filters.'
        : n + ' ' + (n === 1 ? noun.replace(/s$/, '') : noun) + ' shown.');
    };
  }

  wrapFilter('applyDevProgFilters', 'devProgGrid', '.prog-card', 'programmes');
  wrapFilter('applyForumProgFilters', 'forumProgGrid', '.prog-card', 'programmes');
  wrapFilter('applyConsultantFilters', 'consultantGrid', '.consultant-card', 'consultants');

  /* ---------------------------------------------------------
     Scroll reveal
     Attributes are added here, not in the markup, so a failed
     script can never leave content stuck at opacity 0.
     --------------------------------------------------------- */
  var REVEAL_SELECTOR = [
    '#page-overview .v-card', '#page-overview .eng-card', '#page-overview .hero-foot-item',
    '.pillar-card', '.audience-card', '#page-diagnose .group', '#page-diagnose .flagship',
    '.sector-tile', '.team-card', '#page-about .stat-block'
  ].join(',');

  var observer = null;

  /* Failsafe: whatever happens with the observer, nothing stays
     hidden. Content visibility must never depend on an animation
     firing correctly. */
  function revealAll() {
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-reveal]'),
      function (el) { el.classList.add('is-in'); }
    );
  }
  if (document.readyState === 'complete') {
    setTimeout(revealAll, 2500);
  } else {
    window.addEventListener('load', function () { setTimeout(revealAll, 2500); });
  }
  window.addEventListener('beforeprint', revealAll);
  /* Belt and braces: if the tab is restored from bfcache or the page is
     hidden while the observer would have fired, reveal on visibility. */
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) setTimeout(revealAll, 1200);
  });

  function initReveal() {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(
        document.querySelectorAll('[data-reveal]'),
        function (el) { el.classList.add('is-in'); }
      );
      return;
    }
    if (!observer) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    }
    var active = document.querySelector('.page-section.active') || document;
    var nodes = active.querySelectorAll(REVEAL_SELECTOR);
    Array.prototype.forEach.call(nodes, function (el, i) {
      if (el.hasAttribute('data-reveal')) return;
      el.setAttribute('data-reveal', '');
      el.style.transitionDelay = Math.min(i, 3) * 45 + 'ms';
      observer.observe(el);
    });
    /* Elements marked in the markup itself. */
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-reveal]:not(.is-in)'),
      function (el) { observer.observe(el); }
    );
  }
  window.initReveal = initReveal;

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  function boot() {
    var hash = (window.location.hash || '').replace('#', '');
    syncMobileNav(PAGES.indexOf(hash) !== -1 ? hash : 'overview');
    renderDrawerActions();
    syncRegisterCtas();
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  window.addEventListener('hashchange', function () {
    var hash = (window.location.hash || '').replace('#', '');
    if (PAGES.indexOf(hash) !== -1) syncMobileNav(hash);
    initReveal();
  });
})();
