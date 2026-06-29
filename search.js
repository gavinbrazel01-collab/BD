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

  /* ── Procurement boolean terms ── */
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
    if (abbr)     parts.push(`"${abbr}"`);
    if (fullName) parts.push(`"${fullName}"`);
    if (nativeName && nativeName !== fullName) parts.push(`"${nativeName}"`);
    return parts.length > 1
      ? '(' + parts.join(' OR ') + ')'
      : parts[0] || '""';
  }

  /* ── Extract agency name data from a card element ── */
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

    // "Name — Native Name" pattern
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

  /* ── Indicator badge ── */
  let badge = null;

  function showBadge() {
    if (badge) return;
    badge = document.createElement('div');
    badge.id = 'shift-search-badge';
    badge.textContent = '⇧ Shift + click any card to search Bing for procurement contacts';
    Object.assign(badge.style, {
      position:      'fixed',
      bottom:        '20px',
      left:          '50%',
      transform:     'translateX(-50%)',
      background:    '#1a1a18',
      color:         '#f5f4f0',
      fontSize:      '12px',
      padding:       '8px 16px',
      borderRadius:  '20px',
      zIndex:        '9999',
      pointerEvents: 'none',
      letterSpacing: '0.02em',
      boxShadow:     '0 2px 12px rgba(0,0,0,0.25)',
      whiteSpace:    'nowrap',
    });
    document.body.appendChild(badge);
  }

  function hideBadge() {
    if (!badge) return;
    badge.remove();
    badge = null;
  }

  /* ── Card highlight styles while Shift held ── */
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

  /* ── Shift state tracking ── */
  let shiftHeld = false;

  /* ── Init ── */
  function init() {
    addShiftStyles();

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Shift' && !shiftHeld) {
        shiftHeld = true;
        document.body.classList.add('shift-held');
        showBadge();
      }
    });

    document.addEventListener('keyup', function (e) {
      if (e.key === 'Shift') {
        shiftHeld = false;
        document.body.classList.remove('shift-held');
        hideBadge();
      }
    });

    // Use mousedown in capture phase — fires before the browser
    // follows the <a href>, giving us a chance to intercept cleanly.
    document.addEventListener('mousedown', function (e) {
      if (!e.shiftKey) return;
      if (e.button !== 0) return; // left click only

      const card = e.target.closest('.card, .country-card');
      if (!card) return;

      // Prevent the mousedown from starting any link navigation
      e.preventDefault();
      e.stopImmediatePropagation();

      const { abbr, fullName, nativeName } = extractCardData(card);

      if (!abbr && !fullName) {
        console.warn('[search.js] Could not extract agency name from card:', card);
        return;
      }

      const url = buildQuery(abbr, fullName, nativeName);
      window.open(url, '_blank', 'noopener,noreferrer');

    }, true); // capture: true — runs before any element's own handlers

    // Also block the click event that follows mousedown, just in case
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
