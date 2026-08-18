/* ═══════════════════════════════════════════════════════════════════════════════════
   TIDEL — forsida, interaksjon.

   Denne fila lastes KUN av index.html (kontrollert: ingen annen side refererer den).
   De to modulene tilsvarer React-komponentene i designreferansen, skrevet om til
   vanlig js siden nettstedet er statisk og ikke har noe byggesteg.

   Rører ikke butikkknappene — de eies av js/butikk.js, som er eneste sted
   butikkstatus og butikk-URL-er settes.
   ═══════════════════════════════════════════════════════════════════════════════════ */
'use strict';

(function () {

  /* ── Sesongvelgeren ────────────────────────────────────────────────────────────── */
  var ØKTER = [
    { dato: '02 MAY', tid: '2:59.29', notat: '–',          foerste: true },
    { dato: '08 JUN', tid: '2:36.84', notat: '−22.45 S' },
    { dato: '22 JUL', tid: '2:41.22', notat: '−18.07 S' },
    { dato: '08 AUG', tid: '2:14.71', notat: '−44.58 S' }
  ];

  function settØkt(i) {
    var ø = ØKTER[i];
    if (!ø) return;
    var d = document.getElementById('pgDato'),
        t = document.getElementById('pgTid'),
        v = document.getElementById('pgDelta');
    if (d) d.textContent = ø.dato;
    if (t) t.textContent = ø.tid;
    if (v) {
      v.textContent = ø.notat;
      /* Foerste oekt har ingen forbedring aa vise. Da skal tallet heller ikke
         staa i roedt, for roedt betyr «dette er gevinsten» her. */
      v.className = ø.foerste ? '' : 'redText';
    }
    var faner = document.querySelectorAll('.sessionTab');
    for (var k = 0; k < faner.length; k++) {
      var paa = +faner[k].getAttribute('data-i') === i;
      faner[k].className = paa ? 'sessionTab active' : 'sessionTab';
      faner[k].setAttribute('aria-pressed', paa ? 'true' : 'false');
    }
    var prikker = document.querySelectorAll('.graphDot');
    for (var j = 0; j < prikker.length; j++) {
      var pa = +prikker[j].getAttribute('data-i') === i;
      prikker[j].setAttribute('class', pa ? 'graphDot active' : 'graphDot');
      prikker[j].setAttribute('r', pa ? '10' : '6');
    }
  }

  /* ── Analysevelgeren ───────────────────────────────────────────────────────────── */
  var MODUS = [
    { merke: 'Time delta',  verdi: '4.85 S',   tittel: 'Time still on the track',
      tekst: 'Tidel combines your best sectors to show what your next clean lap could be.' },
    { merke: 'Racing line', verdi: 'TURN 07',  tittel: 'Find the line that holds',
      tekst: 'Compare your path through the same corner and see exactly where the faster lap separates.' },
    { merke: 'Pace',        verdi: '−3.2 S', tittel: 'See where speed survives',
      tekst: 'Spot the sections where you carry momentum—and where the lap starts to unravel.' }
  ];

  function settModus(i) {
    var m = MODUS[i];
    if (!m) return;
    var el = {
      merke:  document.getElementById('anLabel'),
      verdi:  document.getElementById('anValue'),
      tittel: document.getElementById('anTitle'),
      tekst:  document.getElementById('anCopy')
    };
    if (el.merke)  el.merke.textContent  = m.merke;
    if (el.verdi)  el.verdi.textContent  = m.verdi;
    if (el.tittel) el.tittel.textContent = m.tittel;
    if (el.tekst)  el.tekst.textContent  = m.tekst;
    var faner = document.querySelectorAll('.analysisTab');
    for (var k = 0; k < faner.length; k++) {
      var paa = +faner[k].getAttribute('data-a') === i;
      faner[k].className = paa ? 'analysisTab active' : 'analysisTab';
      faner[k].setAttribute('aria-pressed', paa ? 'true' : 'false');
    }
  }

  /* ── Kobling ───────────────────────────────────────────────────────────────────── */
  function start() {
    var s = document.querySelectorAll('.sessionTab');
    for (var i = 0; i < s.length; i++) {
      (function (el) {
        el.addEventListener('click', function () { settØkt(+el.getAttribute('data-i')); });
      })(s[i]);
    }
    var a = document.querySelectorAll('.analysisTab');
    for (var j = 0; j < a.length; j++) {
      (function (el) {
        el.addEventListener('click', function () { settModus(+el.getAttribute('data-a')); });
      })(a[j]);
    }
    /* Prikkene i grafen er ogsaa klikkbare — de peker paa samme oekt som fanene. */
    var p = document.querySelectorAll('.graphDot');
    for (var q = 0; q < p.length; q++) {
      (function (el) {
        el.style.cursor = 'pointer';
        el.addEventListener('click', function () { settØkt(+el.getAttribute('data-i')); });
      })(p[q]);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

})();
