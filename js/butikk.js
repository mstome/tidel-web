/* ═══════════════════════════════════════════════════════════════════════════════════
   TIDEL — butikkstatus.

   DETTE ER DET ENESTE STEDET status skal endres. Naar appen blir offentlig:
     lenke:  sett inn den ekte butikk-URL-en
     status: 'live'
   Da oppdateres bade forsiden og /download automatisk.

   Merk: knappene er bevisst IKKE Apples eller Googles offisielle merkeknapper. De har
   egne retningslinjer og egne bildefiler som maa lastes ned fra dem. Byttes de inn,
   bytt bare ut innmaten i lagKnapp().
   ═══════════════════════════════════════════════════════════════════════════════════ */
'use strict';

var BUTIKKER = [
  { id:'ios', pre:'Download on the', navn:'App Store',
    status:'beta',                       // 'beta' | 'snart' | 'live'
    merke:'TestFlight beta',
    lenke:'mailto:post@tidel.no?subject=Tidel%20TestFlight',
    cta:'Request a TestFlight invite',
    meta:'iPhone &middot; iOS 15 or later. Apple Watch rides import from Apple Health.' },
  { id:'and', pre:'Get it on', navn:'Google Play',
    status:'beta',
    merke:'Closed beta',
    lenke:'mailto:post@tidel.no?subject=Tidel%20Android%20beta',
    cta:'Request beta access',
    meta:'Android 7.0 or later. GPX import from any watch that can export one.' }
];

var GLYF = {
  ios:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2.6"/><path d="M11 18.6h2"/></svg>',
  and:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4.5 19 12 5 19.5z"/></svg>'
};

function butikkFarge(status){
  return status === 'live'
    ? 'border-color:rgba(61,204,126,.5);color:#3DCC7E'
    : 'border-color:rgba(227,6,19,.6);color:#FF2438';
}

function butikkKnapper(){
  var s = '', i;
  for (i = 0; i < BUTIKKER.length; i++) {
    var b = BUTIKKER[i];
    s += '<a class="store" href="' + b.lenke + '">' + GLYF[b.id] +
         '<span><span class="t1">' + b.pre + '</span>' +
         '<span class="t2">' + b.navn + '</span></span>' +
         '<span class="st" style="' + butikkFarge(b.status) + '">' + b.merke + '</span></a>';
  }
  return s;
}

function butikkKort(){
  var s = '', i;
  for (i = 0; i < BUTIKKER.length; i++) {
    var b = BUTIKKER[i];
    s += '<div class="dlCard">' +
           '<div style="display:flex;align-items:center;gap:12px">' +
             '<span style="width:22px;height:22px;color:var(--mut);display:block">' + GLYF[b.id] + '</span>' +
             '<span class="plat">' + b.navn + '</span>' +
             '<span style="margin-left:auto;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;' +
                    'padding:4px 9px;border:1px solid;' + butikkFarge(b.status) + '">' + b.merke + '</span>' +
           '</div>' +
           '<p class="meta">' + b.meta + '</p>' +
           '<a class="knapp' + (b.status === 'live' ? ' p' : '') + '" href="' + b.lenke + '">' + b.cta + '</a>' +
           '<div class="req">' + (b.status === 'live'
              ? 'Available to everyone.'
              : 'Beta places are limited while we test. Write to post@tidel.no and you get a reply from a person.') +
           '</div>' +
         '</div>';
  }
  return s;
}

(function(){
  function fyll(id, html){ var e = document.getElementById(id); if (e) e.innerHTML = html; }
  fyll('heroStores', butikkKnapper());
  fyll('footStores', butikkKnapper());
  fyll('dlGrid',     butikkKort());
})();
