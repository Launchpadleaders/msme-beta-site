
  var PAGE_ACCENTS = {
    overview: '#F2762E',
    diagnose: '#D97706',
    develop:  '#B45309',
    deliver:  '#B45309',
    about:    '#F2762E'
  };

  function goTo(page){
    document.querySelectorAll('.page-section').forEach(function(el){ el.classList.remove('active'); });
    document.getElementById('page-' + page).classList.add('active');

    document.querySelectorAll('nav a.nav-link').forEach(function(el){
      el.classList.remove('active');
      el.style.color = '';
    });
    var navLink = document.getElementById('nav-' + page);
    if (navLink) {
      navLink.classList.add('active');
      navLink.style.color = PAGE_ACCENTS[page] || '';
    }

    window.scrollTo({top: 0, behavior: 'instant'});
    if (history.replaceState) { history.replaceState(null, '', '#' + page); }
  }

  // Auto-scrolling teaser strips (Develop/Deliver audience cards): manual
  // prev/next controls pause the CSS animation and nudge the track by one
  // card-width, so visitors aren't stuck waiting for the auto-scroll if
  // more cards get added later.
  function scrollTeaser(btn, dir){
    var teaser = btn.closest('.scroll-teaser');
    if (!teaser) return;
    var track = teaser.querySelector('.scroll-track');
    if (!track) return;
    track.classList.add('paused');
    var cardWidth = 202; // mini-card width (190px) + gap (12px)
    var current = parseFloat(track.getAttribute('data-offset') || '0');
    current += dir * -cardWidth;
    var maxScroll = -(track.scrollWidth / 2 - teaser.clientWidth);
    // Content is duplicated for the seamless auto-scroll loop, so wrap
    // around at each boundary instead of hard-stopping the manual clicks.
    if (current > 0) current = maxScroll;
    if (current < maxScroll) current = 0;
    track.setAttribute('data-offset', current);
    track.style.transform = 'translateX(' + current + 'px)';
  }

  function goToContact(){
    goTo('overview');
    setTimeout(function(){
      var el = document.getElementById('contact');
      if (el) el.scrollIntoView({behavior:'smooth'});
    }, 50);
  }

  /* ============================================================
     AUTH — demo login state + access-gate rendering
     ============================================================ */
  var currentUser = { loggedIn:false, role:null, name:null };
  var pendingAuthRole = null;
  var pendingDestination = null;
  var ROLE_LABELS = { msme:'MSME', forum:'Forum / Institute', consultant:'Consultant' };

  // The modal now shows one of two full forms — a "Sign up" form (name,
  // organisation, email, password, phone, a Users role dropdown) or a
  // simpler "Log in" form — rather than the old role-cards-then-name steps.
  // Anything that doesn't explicitly ask for 'login' opens the sign-up form,
  // since every non-login caller in this file is really an onboarding CTA.
  function openAuthModal(mode){
    var isRegister = mode !== 'login';
    resetLoginFlow();
    document.getElementById('authModalTitle').textContent = isRegister ? 'Sign up' : 'Log in';
    document.getElementById('authRegisterForm').style.display = isRegister ? 'block' : 'none';
    document.getElementById('authLoginForm').style.display = isRegister ? 'none' : 'block';
    document.getElementById('authModalOverlay').classList.add('open');
    var focusId = isRegister ? 'authFullName' : 'authLoginEmail';
    window.setTimeout(function(){
      var el = document.getElementById(focusId);
      if (el) el.focus();
    }, 0);
  }
  function closeAuthModal(){
    document.getElementById('authModalOverlay').classList.remove('open');
    pendingDestination = null;
    resetLoginFlow();
  }
  // Puts the login side of the modal back to its starting state: the
  // Email method selected, and any verify progress cleared — so reopening
  // the modal, or switching to "Sign up", never leaves stale state behind.
  function resetLoginFlow(){
    ['LoginEmail', 'LoginPhone'].forEach(resetVerify);
    selectLoginMethod('email');
  }
  // Kept for the many CTAs across the site that pre-select a visitor type
  // before opening the modal (e.g. "Join our network" → role 'consultant').
  // It now just pre-fills the Users dropdown in the sign-up form instead of
  // advancing a wizard step.
  function selectAuthRole(role){
    pendingAuthRole = role;
    var select = document.getElementById('authUsersSelect');
    if (select) select.value = role;
  }
  function finishAuth(name, role){
    currentUser = { loggedIn:true, role:role, name:name };
    document.getElementById('authLoggedOut').style.display = 'none';
    document.getElementById('authLoggedIn').style.display = 'flex';
    document.getElementById('authGreeting').textContent = 'Hi, ' + name.split(' ')[0] + ' (' + (ROLE_LABELS[role] || role) + ')';
    document.getElementById('authModalOverlay').classList.remove('open');
    refreshAccessGates();
    if (pendingDestination){
      window.location.href = pendingDestination;
      pendingDestination = null;
    }
  }
  // Every sign-up field is mandatory (there's no password field any more —
  // the account is set up passwordless and signs in by OTP instead).
  function completeRegister(){
    var fullName = document.getElementById('authFullName');
    var org = document.getElementById('authOrg');
    var email = document.getElementById('authEmail');
    var phone = document.getElementById('authPhone');
    var select = document.getElementById('authUsersSelect');
    var required = [fullName, org, email, phone];
    for (var i = 0; i < required.length; i++){
      if (!required[i].value.trim()){
        required[i].focus();
        return;
      }
    }
    if (!select || !select.value){
      if (select) select.focus();
      return;
    }
    var name = fullName.value.trim();
    var role = select.value;
    pendingAuthRole = role;
    finishAuth(name, role);
  }
  // Login now has two channels — Email or Phone — as an "or" choice (only
  // one is shown/used at a time), and is itself OTP-based: the visitor must
  // verify whichever channel they picked (via MSG91, see sendVerifyCode
  // below) before "Log in" actually completes.
  var pendingLoginMethod = 'email';
  function selectLoginMethod(method){
    pendingLoginMethod = method === 'phone' ? 'phone' : 'email';
    var emailBtn = document.getElementById('authLoginMethodEmail');
    var phoneBtn = document.getElementById('authLoginMethodPhone');
    var emailField = document.getElementById('authLoginEmailField');
    var phoneField = document.getElementById('authLoginPhoneField');
    var isPhone = pendingLoginMethod === 'phone';
    if (emailBtn){ emailBtn.classList.toggle('active', !isPhone); emailBtn.setAttribute('aria-selected', String(!isPhone)); }
    if (phoneBtn){ phoneBtn.classList.toggle('active', isPhone); phoneBtn.setAttribute('aria-selected', String(isPhone)); }
    if (emailField) emailField.style.display = isPhone ? 'none' : 'block';
    if (phoneField) phoneField.style.display = isPhone ? 'block' : 'none';
  }
  function completeLogin(){
    var field = pendingLoginMethod === 'phone' ? 'LoginPhone' : 'LoginEmail';
    var input = document.getElementById('auth' + field);
    if (!input || !input.value.trim()){
      if (input) input.focus();
      return;
    }
    if (!verifiedFields[field]){
      var btn = document.getElementById('auth' + field + 'VerifyBtn');
      if (btn) btn.focus();
      return;
    }
    var name = pendingLoginMethod === 'phone' ? 'Demo User' : (input.value.split('@')[0] || 'Demo User');
    var role = pendingAuthRole || 'msme';
    finishAuth(name, role);
  }

  /* ============================================================
     AUTH — Email/Phone "Verify" hand-off to MSG91
     Verification itself happens on MSG91's side (redirect there and
     back) — there's no in-page OTP box to build here. This static demo
     has nowhere real to redirect to, so it just mirrors the round trip:
     the button shows a brief "Redirecting…" state, then "Verified",
     standing in for the MSG91 flow leaving and returning.
     ============================================================ */
  var verifiedFields = {
    Email:false, Phone:false,
    LoginEmail:false, LoginPhone:false
  };

  function sendVerifyCode(field){
    var input = document.getElementById('auth' + field);
    if (!input || !input.value.trim()){
      if (input) input.focus();
      return;
    }
    var btn = document.getElementById('auth' + field + 'VerifyBtn');
    if (!btn || btn.classList.contains('verified') || btn.classList.contains('verifying')) return;
    btn.classList.add('verifying');
    btn.disabled = true;
    btn.textContent = 'Redirecting…';
    // TODO: hand off to MSG91's hosted verification flow for this field
    // and pick this back up on return, instead of this simulated delay.
    window.setTimeout(function(){
      verifiedFields[field] = true;
      btn.classList.remove('verifying');
      btn.classList.add('verified');
      btn.textContent = 'Verified';
    }, 900);
  }

  // If the visitor edits an already-verified email/phone, the old
  // verification no longer applies to the new value — drop it rather than
  // leave a stale "Verified" badge next to a changed address/number.
  function resetVerify(field){
    if (!verifiedFields[field]) return;
    verifiedFields[field] = false;
    var btn = document.getElementById('auth' + field + 'VerifyBtn');
    if (btn){
      btn.textContent = 'Verify';
      btn.classList.remove('verified', 'verifying');
      btn.disabled = false;
    }
  }

  // Gate a link that has a real destination (e.g. a built tool). If not
  // logged in, opens the auth modal and remembers where to send the user
  // once they complete the demo login; if already logged in, goes straight there.
  function requireAuthThenGo(url){
    if (currentUser.loggedIn){
      window.location.href = url;
    } else {
      pendingDestination = url;
      openAuthModal();
    }
    return false;
  }

  // Gate a link with no real destination yet (placeholder tools, sample
  // reports). Just prompts login if needed; otherwise a light "coming soon" note.
  function requireAuthPlaceholder(){
    if (currentUser.loggedIn){
      alert('This is a demo — the real version of this page isn\'t built yet.');
    } else {
      pendingDestination = null;
      openAuthModal();
    }
    return false;
  }

  // Sample reports are open to preview without an account — no login gate,
  // unlike actually running a tool.
  function viewSamplePlaceholder(){
    alert('This is a demo — the real sample report isn\'t built yet.');
    return false;
  }
  function doLogout(){
    currentUser = { loggedIn:false, role:null, name:null };
    document.getElementById('authLoggedOut').style.display = 'flex';
    document.getElementById('authLoggedIn').style.display = 'none';
    refreshAccessGates();
  }

  function refreshAccessGates(){
    document.querySelectorAll('[data-requires-role]').forEach(function(el){
      var requiredRole = el.getAttribute('data-requires-role');
      var unlocked = currentUser.loggedIn && currentUser.role === requiredRole;
      var content = el.querySelector('.gated-content');
      var lock = el.querySelector('.locked-panel');
      if (content) content.style.display = unlocked ? 'block' : 'none';
      if (lock) lock.style.display = unlocked ? 'none' : 'block';
    });
    refreshMatchedStrips();
    refreshDeliverVisibility();
    refreshDevelopVisibility();
  }

  // Develop page: once logged in as a specific role, the generic pillars
  // and the *other* audience's card are just noise — show only what's
  // relevant to the visitor who's actually signed in.
  // Develop page: filter the "browse all live programmes" grid by sector and state.
  // Develop page: filter a "browse all live programmes" grid by sector and
  // state. Shared by both the MSME and Forum cards (each has its own set
  // of filter/grid ids, since both copies can exist in the DOM at once).
  function applyProgFilters(sectorId, stateId, gridId, emptyId){
    var sectorEl = document.getElementById(sectorId);
    var stateEl = document.getElementById(stateId);
    if (!sectorEl || !stateEl) return;
    var sector = sectorEl.value;
    var state = stateEl.value;
    var cards = document.querySelectorAll('#' + gridId + ' .prog-card');
    var visibleCount = 0;
    cards.forEach(function(card){
      var cardSector = card.getAttribute('data-sector');
      var cardState = card.getAttribute('data-state');
      var matchSector = sector === 'all' || cardSector === sector;
      var matchState = state === 'all' || cardState === state;
      var match = matchSector && matchState;
      card.style.display = match ? 'block' : 'none';
      if (match) visibleCount++;
    });
    var empty = document.getElementById(emptyId);
    if (empty) empty.style.display = visibleCount === 0 ? 'block' : 'none';
  }
  function applyDevProgFilters(){
    applyProgFilters('devFilterSector', 'devFilterState', 'devProgGrid', 'devProgEmpty');
  }
  function applyForumProgFilters(){
    applyProgFilters('forumFilterSector', 'forumFilterState', 'forumProgGrid', 'forumProgEmpty');
  }

  function refreshDevelopVisibility(){
    var pillars = document.getElementById('devPillarsSection');
    var head = document.getElementById('devAudienceHead');
    var grid = document.getElementById('devAudienceGrid');
    var msmeCard = document.getElementById('devMsmeCard');
    var forumCard = document.getElementById('devForumCard');
    var msmePitch = document.getElementById('msmePitch');
    var forumPitch = document.getElementById('forumPitch');
    var msmeAudLabel = document.getElementById('msmeAudLabel');
    var forumAudLabel = document.getElementById('forumAudLabel');
    if (!pillars || !grid || !msmeCard || !forumCard) return;

    var role = currentUser.loggedIn ? currentUser.role : null;

    if (role === 'msme'){
      pillars.style.display = 'none';
      msmeCard.style.display = 'block';
      forumCard.style.display = 'none';
      grid.style.gridTemplateColumns = '1fr';
      if (head) head.style.display = 'none';
      if (msmePitch) msmePitch.style.display = 'none';
      if (msmeAudLabel) msmeAudLabel.style.display = 'none';
    } else if (role === 'forum'){
      pillars.style.display = 'none';
      msmeCard.style.display = 'none';
      forumCard.style.display = 'block';
      grid.style.gridTemplateColumns = '1fr';
      if (head) head.style.display = 'none';
      if (forumPitch) forumPitch.style.display = 'none';
      if (forumAudLabel) forumAudLabel.style.display = 'none';
    } else {
      pillars.style.display = 'block';
      msmeCard.style.display = 'block';
      forumCard.style.display = 'block';
      grid.style.gridTemplateColumns = '';
      if (head) head.style.display = 'block';
      if (msmePitch) msmePitch.style.display = 'block';
      if (forumPitch) forumPitch.style.display = 'block';
      if (msmeAudLabel) msmeAudLabel.style.display = 'inline-block';
      if (forumAudLabel) forumAudLabel.style.display = 'inline-block';
    }
  }

  // Deliver page: once logged in as a specific role, the generic pillars
  // and the *other* audience's card are just noise — mirrors Develop's
  // same pattern exactly.
  function refreshDeliverVisibility(){
    var pillars = document.getElementById('delPillarsSection');
    var head = document.getElementById('delAudienceHead');
    var grid = document.getElementById('delAudienceGrid');
    var msmeCard = document.getElementById('delMsmeCard');
    var consultantCard = document.getElementById('delConsultantCard');
    var msmePitch = document.getElementById('delMsmePitch');
    var consultantPitch = document.getElementById('delConsultantPitch');
    var msmeAudLabel = document.getElementById('delMsmeAudLabel');
    var consultantAudLabel = document.getElementById('delConsultantAudLabel');
    if (!pillars || !grid || !msmeCard || !consultantCard) return;

    var role = currentUser.loggedIn ? currentUser.role : null;

    if (role === 'msme'){
      pillars.style.display = 'none';
      msmeCard.style.display = 'block';
      consultantCard.style.display = 'none';
      grid.style.gridTemplateColumns = '1fr';
      if (head) head.style.display = 'none';
      if (msmePitch) msmePitch.style.display = 'none';
      if (msmeAudLabel) msmeAudLabel.style.display = 'none';
    } else if (role === 'consultant'){
      pillars.style.display = 'none';
      msmeCard.style.display = 'none';
      consultantCard.style.display = 'block';
      grid.style.gridTemplateColumns = '1fr';
      if (head) head.style.display = 'none';
      if (consultantPitch) consultantPitch.style.display = 'none';
      if (consultantAudLabel) consultantAudLabel.style.display = 'none';
    } else {
      pillars.style.display = 'block';
      msmeCard.style.display = 'block';
      consultantCard.style.display = 'block';
      grid.style.gridTemplateColumns = '';
      if (head) head.style.display = 'block';
      if (msmePitch) msmePitch.style.display = 'block';
      if (consultantPitch) consultantPitch.style.display = 'block';
      if (msmeAudLabel) msmeAudLabel.style.display = 'inline-block';
      if (consultantAudLabel) consultantAudLabel.style.display = 'inline-block';
    }

    var isMsme = role === 'msme';
    var recommendPanel = document.getElementById('expertiseRecommend');
    if (recommendPanel) recommendPanel.style.display = isMsme ? 'flex' : 'none';
    if (typeof applyConsultantFilters === 'function') applyConsultantFilters();

    // "Not on the network yet?" is a join-CTA for people who aren't
    // logged in — an anonymous visitor sees it as noise before they've
    // even chosen a role, so only show it once they're logged in as
    // something other than a consultant (e.g. browsing as MSME/Forum).
    var joinCard = document.getElementById('joinNetworkCard');
    if (joinCard) joinCard.style.display = currentUser.loggedIn ? 'flex' : 'none';
  }

  // Develop page: requesting a programme is a Forum/Institute action —
  // prompt login (pre-selecting that role) if not already logged in as one.
  function requireForumThenContact(){
    if (currentUser.loggedIn && currentUser.role === 'forum'){
      goToContact();
    } else {
      openAuthModal();
      selectAuthRole('forum');
    }
    return false;
  }

  // "Matched for you" strips claim personalised results — only show that
  // copy when the visitor is actually logged in as an MSME; otherwise show
  // an honest generic CTA towards Diagnose instead.
  function refreshMatchedStrips(){
    var isMsme = currentUser.loggedIn && currentUser.role === 'msme';

    var devLabel = document.getElementById('devMatchedLabel');
    if (devLabel){
      document.getElementById('devMatchedLabel').textContent = isMsme ? 'Matched for you' : 'Not sure which fits?';
      document.getElementById('devMatchedText').textContent = isMsme
        ? 'Based on your last diagnosis, we\'ve shortlisted 3 programmes below.'
        : 'Take the automated assessment on Diagnose and we\'ll match you to the right programme automatically.';
      document.getElementById('devMatchedCta').style.display = isMsme ? 'none' : 'inline';
    }

    var delLabel = document.getElementById('delMatchedLabel');
    if (delLabel){
      document.getElementById('delMatchedLabel').textContent = isMsme ? 'Matched for you' : 'Not sure who to pick?';
      document.getElementById('delMatchedText').textContent = isMsme
        ? 'Based on your diagnosis, we\'ve shortlisted consultants who specialise in your gap.'
        : 'Take the automated assessment on Diagnose and we\'ll shortlist consultants who specialise in your gap.';
      document.getElementById('delMatchedCta').style.display = isMsme ? 'none' : 'inline';
    }
  }



  function applyConsultantFilters(){
    var expertise = document.getElementById('filterExpertise').value;
    var sector = document.getElementById('filterSector').value;
    var minRating = parseFloat(document.getElementById('filterRating').value);
    var availability = document.getElementById('filterAvailability').value;
    var cards = document.querySelectorAll('#consultantGrid .c-card');
    var visibleCount = 0;

    cards.forEach(function(card){
      var cardExpertise = card.getAttribute('data-expertise');
      var sectors = card.getAttribute('data-sector');
      var rating = parseFloat(card.getAttribute('data-rating'));
      var avail = card.getAttribute('data-availability');

      var matchExpertise = expertise === 'all' || cardExpertise === expertise;
      var matchSector = sector === 'all' || sectors.indexOf(sector) !== -1;
      var matchRating = rating >= minRating;
      var matchAvailability = availability === 'all' || avail === availability;

      var match = matchExpertise && matchSector && matchRating && matchAvailability;
      card.style.display = match ? 'flex' : 'none';
      if (match) visibleCount++;
    });

    document.getElementById('consultantEmpty').style.display = visibleCount === 0 ? 'block' : 'none';
  }

  // Lets a logged-in MSME jump straight to consultants matching a gap
  // their diagnosis flagged, without hunting through the dropdown.
  function applyRecommendedExpertise(val){
    var select = document.getElementById('filterExpertise');
    if (select) select.value = val;
    applyConsultantFilters();
  }

  // Support direct links like file.html#diagnose, and browser back/forward
  function routeFromHash(isInitialLoad){
    var hash = window.location.hash.replace('#', '');
    var valid = ['overview','diagnose','develop','deliver','privacy','about'];
    if (valid.indexOf(hash) !== -1) {
      goTo(hash);
    } else if (hash === 'contact') {
      goToContact();
    } else if (isInitialLoad) {
      goTo('overview');
    }
    // else: an in-page anchor (e.g. #scope on the privacy page) — leave it
    // to the browser's native scroll-to-fragment behaviour, not a page change.
  }
  window.addEventListener('hashchange', function(){ routeFromHash(false); });
  document.addEventListener('DOMContentLoaded', function(){
    routeFromHash(true);
    refreshAccessGates();
  });

  /* ============================================================
     MSME ASSIST — lightweight, rule-based Q&A widget
     Matches user questions against a curated knowledge base by
     keyword scoring. No external API calls — fully self-contained.
     ============================================================ */
  var MA_KB = [
    { kw: ['pmegp','prime minister employment'],
      a: "PMEGP (Prime Minister's Employment Generation Programme) gives margin money subsidy for new micro-enterprises — 15–35% depending on your category and whether you're rural or urban. Our Diagnose page has a DPR generator that builds the full loan pack for you." },
    { kw: ['udyam','msme registration','register my business','how to register'],
      a: "Udyam Registration is the official government registration for MSMEs — free, done on the Udyam portal using Aadhaar and PAN. It's the base document almost every scheme and our own platform will ask for." },
    { kw: ['classification','micro small medium','turnover limit','investment limit'],
      a: "MSME classification is based on investment + turnover: Micro (up to ₹1 cr investment / ₹5 cr turnover), Small (up to ₹10 cr / ₹50 cr), Medium (up to ₹50 cr / ₹250 cr). Your classification affects which schemes and subsidy rates you qualify for." },
    { kw: ['cgtmse','credit guarantee','collateral free','collateral-free'],
      a: "CGTMSE (Credit Guarantee Fund Trust for Micro and Small Enterprises) lets you get collateral-free loans up to a set limit, with the government guaranteeing part of the risk to your bank. A consultant on our Deliver network can package your loan application for this." },
    { kw: ['credit gap','funding gap','why cant i get a loan','cant get loan'],
      a: "India's MSME credit gap is estimated at around ₹30 lakh crore — driven mostly by thin financial statements, weak collateral, and informal cash flows. Our Deliver network can match you with a consultant to build a lender-ready case for your business." },
    { kw: ['treds','payment delay','buyer not paying','late payment'],
      a: "TReDS is a platform that lets you discount your unpaid invoices for early cash, instead of waiting on a slow-paying buyer. A consultant on our Deliver network can assess your receivables and route you to TReDS." },
    { kw: ['gst','bookkeeping','tax filing','compliance'],
      a: "Most MSMEs above the threshold need GST registration and monthly/quarterly filing. We don't run an automated bookkeeping tool for this today — our Deliver network can match you with a consultant who handles categorisation, GST filing, and tax-calendar management for you." },
    { kw: ['subsidy rate','how much subsidy','subsidy percentage'],
      a: "Subsidy rates depend on category and area: General category gets 15% (urban) or 25% (rural); Special category (SC/ST/OBC/Women/Minority/PH/Ex-servicemen/NER) gets 25% (urban) or 35% (rural). Our PMEGP tool calculates this automatically for you." },
    { kw: ['zed','zero defect','quality certification'],
      a: "ZED Certification (Zero Defect Zero Effect) is a quality-and-sustainability rating for manufacturers, with a free Bronze entry tier. Our Lean Operations & Quality Improvement tool can help you get audit-ready." },
    { kw: ['dpdp','data protection','personal data law'],
      a: "The DPDP Rules (Digital Personal Data Protection) carry a compliance deadline of 13 May 2027. If you handle customer or employee data, our DPDP Compliance Readiness tool on the Diagnose page flags your gaps before then." },
    { kw: ['what is launchpad','about launchpad','who are you','what does launchpad'],
      a: "Launchpad Leaders is The MSME Transformation Platform — we Diagnose where your business stands, Develop it through shared cluster/cohort programmes, and Deliver the last-mile support through vetted consultants. Diagnosed. Developed. Delivered." },
    { kw: ['what is diagnose','diagnose page','assessment tools'],
      a: "Diagnose is our automated assessment suite — 360° diagnostics covering compliance, security, scheme eligibility, and digital/export readiness, at a fraction of the cost of a consultant. Start with the flagship 360° Business Assessment." },
    { kw: ['what is develop','develop page','cohort','cluster programme'],
      a: "Develop runs the cluster and cohort programmes that move groups of similar MSMEs to sector standard together — plus ongoing tools like shared-facility monitoring and pooled procurement that outlast the programme." },
    { kw: ['what is deliver','deliver page','find a consultant','consulting'],
      a: "Deliver is our vetted, onboarded consultant network. Sector standard is the floor, not the ceiling — Deliver matches you to a consultant for the last mile beyond it, based on expertise and sector fit." },
    { kw: ['is it free','cost','pricing','how much does it cost','price'],
      a: "It depends on the tool — some (like the Scheme-Change Alert or ERP-Lite bundle) are free with quick registration; others are licensed, priced per report or per month. The 360° Business Assessment is ₹2,999–7,999 per report depending on complexity. Check the pricing badge on each tool card in Diagnose." },
    { kw: ['match consultant','get matched','how do i find','need a consultant'],
      a: "The fastest way is to take the 360° Business Assessment on the Diagnose page — your results automatically route you to the right consultant on Deliver. You can also browse the consultant directory directly." },
    { kw: ['join network','become a consultant','consultant onboarding','work with launchpad'],
      a: "Consultants join our vetted network for a steady pipeline of qualified engagements plus delivery tools (DPR generator, pricing calculator, engagement tracker). Head to the Deliver page → For Consultants, or use the 'Join our network' link in Contact." },
    { kw: ['partner with you','become a partner','forum','institute','association'],
      a: "Forums, industry bodies, banks, and state PMUs partner with us to turn their existing MSME relationships into structured programmes — without building the infrastructure themselves. See 'For Forums & Institutes' on the Develop page." },
    { kw: ['contact','email','phone','address','reach you','talk to someone'],
      a: "You can reach us at connect@launchpadleaders.in. Full details are in the Contact section at the bottom of the Overview page." },
    { kw: ['team','founder','who runs','leadership'],
      a: "Launchpad Leaders is co-founded by Sudhindra S Paraki and Pramod D'Souza, both Principal Consultants — you can see the full team in the Contact section on the Overview page." }
  ];

  var MA_FALLBACK = "I don't have a confident answer for that yet — this assistant works from a curated knowledge base, not a live connection. For anything specific, reach us directly at connect@launchpadleaders.in.";

  function maMatch(question){
    var q = question.toLowerCase();
    var best = null, bestScore = 0;
    MA_KB.forEach(function(entry){
      var score = 0;
      entry.kw.forEach(function(k){
        if (q.indexOf(k) !== -1) score += k.split(' ').length; // longer phrase matches score higher
      });
      if (score > bestScore) { bestScore = score; best = entry; }
    });
    return best ? best.a : MA_FALLBACK;
  }

  function maAppend(text, who){
    var body = document.getElementById('ma-body');
    var msg = document.createElement('div');
    msg.className = 'ma-msg ma-' + who;
    var bubble = document.createElement('div');
    bubble.className = 'ma-bubble';
    bubble.textContent = text;
    msg.appendChild(bubble);
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight;
  }

  function maAsk(question){
    maAppend(question, 'user');
    var chips = document.getElementById('ma-chips');
    if (chips) chips.remove();
    setTimeout(function(){
      maAppend(maMatch(question), 'bot');
    }, 350);
  }

  function maSend(){
    var input = document.getElementById('ma-input');
    var q = input.value.trim();
    if (!q) return;
    input.value = '';
    maAsk(q);
  }

  function toggleAssist(){
    var panel = document.getElementById('msme-assist-panel');
    var iconChat = document.getElementById('assist-icon-chat');
    var iconClose = document.getElementById('assist-icon-close');
    panel.classList.toggle('open');
    var isOpen = panel.classList.contains('open');
    iconChat.style.display = isOpen ? 'none' : 'block';
    iconClose.style.display = isOpen ? 'block' : 'none';
    if (isOpen) document.getElementById('ma-input').focus();
  }
