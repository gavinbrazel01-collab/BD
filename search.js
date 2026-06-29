/**
 * search.js
 * Shift + click any agency card → opens a targeted Bing search to find
 * named individuals at that agency responsible for technology / investigation
 * tool procurement — prioritising LinkedIn profiles.
 *
 * Drop in the same folder as all country HTML files.
 * Add <script src="search.js"></script> before </body> on each page.
 */
 
(function () {
  'use strict';
 
  /*
   * ── Query strategy ──────────────────────────────────────────────────────
   *
   * Structure:
   *   site:linkedin.com/in  (force LinkedIn people results)
   *   AND (agency name clause)
   *   AND (job title clause — procurement / technology decision-maker roles)
   *
   * A second query (non-LinkedIn) opens simultaneously for broader coverage.
   * ────────────────────────────────────────────────────────────────────────
   */
 
  /* Job titles that indicate procurement / technology buying authority */
  const TITLE_TERMS = [
    'Head of Technology',
    'Chief Technology Officer',
    'CTO',
    'Head of Digital',
    'Head of IT',
    'Head of Procurement',
    'Procurement Manager',
    'Technology Procurement',
    'Digital Forensics',
    'Head of Forensics',
    'IT Director',
    'Chief Information Officer',
    'CIO',
    'Head of Innovation',
    'Capability Development',
    'Head of Intelligence Systems',
    'Technical Director',
    'Equipment Manager',
    'Head of Investigations Technology',
    'Surveillance Technology',
  ];
 
  /* Broad procurement signal terms for the non-LinkedIn fallback query */
  const PROCUREMENT_SIGNALS = [
    'procurement',
    'tender',
    'contract award',
    'technology acquisition',
    'investigation technology',
    'digital forensics',
    'surveillance',
    'intelligence software',
  ];
 
  /* ── Build the LinkedIn-targeted Bing query ── */
  function buildLinkedInQuery(abbr, fullName, nativeName) {
    const nameClause  = buildNameClause(abbr, fullName, nativeName);
    const titleClause = '(' + TITLE_TERMS.map(t => `"${t}"`).join(' OR ') + ')';
    // Force results from linkedin.com/in (people profiles)
    return `site:linkedin.com/in ${nameClause} ${titleClause}`;
  }
 
  /* ── Build a broader fallback query (no site restriction) ── */
  function buildBroadQuery(abbr, fullName, nativeName) {
    const nameClause = buildNameClause(abbr, fullName, nativeName);
    const procClause = '(' + PROCUREMENT_SIGNALS.map(t => `"${t}"`).join(' OR ') + ')';
    const titleClause = '("Head of" OR "Director" OR "Chief" OR "Manager") AND ' +
                        '("technology" OR "procurement" OR "digital" OR "IT" OR "forensics")';
    return `${nameClause} AND ${procClause} AND ${titleClause}`;
  }
 
  function buildNameClause(abbr, fullName, nativeName) {
    const parts = [];
    if (abbr)     parts.push(`"${abbr}"`);
    if (fullName && fullName !== abbr) parts.push(`"${fullName}"`);
    if (nativeName && nativeName !== fullName && nativeName !== abbr) {
      parts.push(`"${nativeName}"`);
    }
    if (parts.length === 0) return '""';
    return parts.length === 1 ? parts[0] : '(' + parts.join(' OR ') + ')';
  }
 
  function toBingURL(query) {
    return 'https://www.bing.com/search?q=' + encodeURIComponent(query);
  }
 
  /* ── Extract agency name from a card ── */
  function extractCardData(card) {
    const abbrEl = card.querySelector('.card-abbr');
    const nameEl = card.querySelector('.card-name');
 
    const rawAbbr = abbrEl ? abbrEl.textContent.trim() : '';
    const rawName = nameEl ? nameEl.textContent.trim() : '';
 
    let englishName = rawName;
    let nativeName  = '';
 
    // "Native Name (English translation)" pattern
    const parenMatch = rawName.match(/^(.+?)\s*\((.+?)\)/);
    if (parenMatch) {
      englishName = parenMatch[1].trim();
      nativeName  = parenMatch[2].trim();
    }
 
    // "Name — Native Name" or "Name – Native Name" pattern
    const dashMatch = rawName.match(/^(.+?)\s*[—–]\s*(.+)$/);
    if (dashMatch && !parenMatch) {
      englishName = dashMatch[1].trim();
      nativeName  = dashMatch[2].trim();
    }
 
    return {
      abbr:       rawAbbr,
      fullName:   englishName || rawName,
      nativeName: nativeName,
    };
  }
 
  /* ── Badge shown while Shift is held ── */
  let badge = null;
 
  function showBadge() {
    if (badge) return;
    badge = document.createElement('div');
    badge.textContent = '⇧  Shift + click — find procurement contacts on LinkedIn';
    Object.assign(badge.style, {
      position:      'fixed',
      bottom:        '20px',
      left:          '50%',
      transform:     'translateX(-50%)',
      background:    '#0A66C2',   // LinkedIn blue — signals the mode clearly
      color:         '#ffffff',
      fontSize:      '12px',
      fontFamily:    'inherit',
      padding:       '8px 18px',
      borderRadius:  '20px',
      zIndex:        '9999',
      pointerEvents: 'none',
      letterSpacing: '0.02em',
      boxShadow:     '0 2px 14px rgba(10,102,194,0.35)',
      whiteSpace:    'nowrap',
    });
    document.body.appendChild(badge);
  }
 
  function hideBadge() {
    if (!badge) return;
    badge.remove();
    badge = null;
  }
 
  /* ── Hover highlight while Shift held ── */
  function addShiftStyles() {
    if (document.getElementById('shift-search-style')) return;
    const style = document.createElement('style');
    style.id = 'shift-search-style';
    style.textContent = `
      body.shift-held .card,
      body.shift-held .country-card {
        cursor: crosshair !important;
      }
      body.shift-held .card:hover,
      body.shift-held .country-card:hover {
        border-color: #0A66C2 !important;
        box-shadow: 0 0 0 2.5px rgba(10,102,194,0.22) !important;
      }
    `;
    document.head.appendChild(style);
  }
 
  /* ── Main ── */
  function init() {
    addShiftStyles();
 
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Shift') {
        document.body.classList.add('shift-held');
        showBadge();
      }
    });
 
    document.addEventListener('keyup', function (e) {
      if (e.key === 'Shift') {
        document.body.classList.remove('shift-held');
        hideBadge();
      }
    });
 
    /* Intercept on mousedown (capture) — before the <a> navigates */
    document.addEventListener('mousedown', function (e) {
      if (!e.shiftKey || e.button !== 0) return;
 
      const card = e.target.closest('.card, .country-card');
      if (!card) return;
 
      e.preventDefault();
      e.stopImmediatePropagation();
 
      const { abbr, fullName, nativeName } = extractCardData(card);
 
      if (!abbr && !fullName) {
        console.warn('[search.js] Could not extract name from card:', card);
        return;
      }
 
      // Open LinkedIn-targeted search
      const linkedInURL = toBingURL(buildLinkedInQuery(abbr, fullName, nativeName));
      window.open(linkedInURL, '_blank', 'noopener,noreferrer');
 
      // Open broader fallback search in a second tab
      const broadURL = toBingURL(buildBroadQuery(abbr, fullName, nativeName));
      window.open(broadURL, '_blank', 'noopener,noreferrer');
 
    }, true);
 
    /* Block the click that follows, just in case */
    document.addEventListener('click', function (e) {
      if (!e.shiftKey) return;
      const card = e.target.closest('.card, .country-card');
      if (!card) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    }, true);
  }
 
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
 
})();
