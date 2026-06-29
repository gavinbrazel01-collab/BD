/**
 * search.js
 * Shift + click any agency card → opens a Bing boolean procurement search
 * for that agency in a new tab.
 *
 * Drop this file in the same folder as all country HTML files.
 * Add <script src="search.js"></script> before </body> on each page.
 */

(function () {
  'use strict';

  /* ── Procurement boolean terms appended to every search ── */
  const PROCUREMENT_TERMS = [
    'procurement',
    'tender',
    'contract',
    'RFP',
    'RFT',
    'investigation technology',
    'digital forensics',
    'surveillance technology',
    'data analytics',
    'intelligence software',
  ];

  const PEOPLE_TERMS = [
    'director',
    'head',
    'chief',
    'commissioner',
    'superintendent',
    'commander',
    'procurement officer',
    'technology lead',
  ];

  /* ── Build the Bing search URL ── */
  function buildQuery(abbr, fullName, nativeName) {
    const nameClause = buildNameClause(abbr, fullName, nativeName);
    const procClause = '(' + PROCUREMENT_TERMS.map(t => `"${t}"`).join(' OR ') + ')';
    const peopleClause = '(' + PEOPLE_TERMS.map(t => `"${t}"`).join(' OR ') + ')';
    const query = `${nameClause} AND ${procClause} AND ${peopleClause}`;
    return 'https://www.bing.com/search?q=' + encodeURIComponent(query);
  }

  function buildNameClause(abbr, fullName, nativeName) {
    const parts = [];
    if (abbr)       parts.push(`"${abbr}"`);
    if (fullName)   parts.push(`"${fullName}"`);
    if (nativeName && nativeName !== fullName) parts.push(`"${nativeName}"`);
    return parts.length > 1
      ? '(' + parts.join(' OR ') + ')'
      : parts[0] || '""';
  }

  /* ── Extract text from a card ── */
  function extractCardData(card) {
    // .card-abbr holds the short name / abbreviation
    const abbrEl    = card.querySelector('.card-abbr');
    // .card-name holds the full (often bilingual) name
    const nameEl    = card.querySelector('.card-name');
    // .card-role holds the role description — we don't need it for the query
    // but the full name element often contains "English name — Native name"
    // separated by an em-dash, so we split on that if present.

    const rawAbbr = abbrEl ? abbrEl.textContent.trim() : '';
    const rawName = nameEl ? nameEl.textContent.trim() : '';

    // Many cards format the name as:
    // "Full English Name (Native Name in Brackets)"  or
    // "Native Name (translation)"
    // We pass the whole thing as fullName and let the OR clause handle it.
    // Split on em-dash or parenthesis to attempt to separate:
    let englishName = rawName;
    let nativeName  = '';

    // Pattern: "Native Name (English translation)" or vice-versa
    const parenMatch = rawName.match(/^(.+?)\s*\((.+?)\)/);
    if (parenMatch) {
      englishName = parenMatch[1].trim();
      nativeName  = parenMatch[2].trim();
    }

    // Pattern: "Name — Native Name"
    const dashMatch = rawName.match(/^(.+?)\s*[—–-]{1,2}\s*(.+)$/);
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

  /* ── Indicator badge shown while Shift is held ── */
  let badge = null;

  function showBadge() {
    if (badge) return;
    badge = document.createElement('div');
    badge.id = 'shift-search-badge';
    badge.textContent = '⇧ Shift + click any card to search Bing for procurement contacts';
    Object.assign(badge.style, {
      position:        'fixed',
      bottom:          '20px',
      left:            '50%',
      transform:       'translateX(-50%)',
      background:      '#1a1a18',
      color:           '#f5f4f0',
      fontSize:        '12px',
      padding:         '8px 16px',
      borderRadius:    '20px',
      zIndex:          '9999',
      pointerEvents:   'none',
      letterSpacing:   '0.02em',
      boxShadow:       '0 2px 12px rgba(0,0,0,0.25)',
      transition:      'opacity 0.15s',
      whiteSpace:      'nowrap',
    });
    document.body.appendChild(badge);
  }

  function hideBadge() {
    if (!badge) return;
    badge.remove();
    badge = null;
  }

  /* ── Card hover highlight while Shift is held ── */
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
        box-shadow: 0 0 0 2px rgba(10,102,194,0.18);
      }
    `;
    document.head.appendChild(style);
  }

  /* ── Main event wiring ── */
  function init() {
    addShiftStyles();

    /* Show badge and highlight on Shift keydown */
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

    /* Intercept shift+click on any card */
    document.addEventListener('click', function (e) {
      if (!e.shiftKey) return;

      const card = e.target.closest('.card, .country-card');
      if (!card) return;

      e.preventDefault();
      e.stopPropagation();

      const { abbr, fullName, nativeName } = extractCardData(card);

      if (!abbr && !fullName) {
        console.warn('[search.js] Could not extract agency name from card:', card);
        return;
      }

      const url = buildQuery(abbr, fullName, nativeName);
      window.open(url, '_blank', 'noopener,noreferrer');
    }, true); /* capture phase so we intercept before the <a> fires */
  }

  /* Run after DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
