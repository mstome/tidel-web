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

/* ══ WEB-1/WEB-2 (batch 5, 4. sep 2026) — EN LENKE SOM FAKTISK INSTALLERER APPEN ═══════
   HER STO to `mailto:`-adresser. Det var den eneste veien fra nettsida til appen, og paa
   en iPhone uten Mail-kontoen satt opp gjoer en mailto-lenke INGENTING i det hele tatt:
   ingen feilmelding, ingen ny side, ingenting. Prosjektets egne maalinger (PLAN-TILGANG-
   OG-KLOKKER.md §0) peker paa nettopp dette som hovedflaskehalsen.

   Naa staar de ekte adressene i EN liste, LENKER, og resten av fila leser bare den:
     · ANDROID-lenka finnes allerede (lukket testing, opt-in-URL) og er satt inn her.
     · iOS: den offentlige TestFlight-lenka finnes IKKE enda — den lages i App Store
       Connect (TestFlight → Ekstern gruppe → Offentlig lenke), og det kan bare eieren
       gjoere. Til den er der, peker knappen paa /contact/ (en ekte side, virker i enhver
       nettleser) i stedet for en mailto som kan vaere doed. Lim inn URL-en i LENKER.ios,
       saa bytter bade forsiden og /download til «Open in TestFlight» av seg selv.
   R3 (ingen loefter vi ikke kan innfri): teksten under knappen sier hva som SKJER naar du
   trykker — ogsaa naar svaret er «du maa legges inn foerst». */
var LENKER = {
  /* Den offentlige TestFlight-lenka (ekstern gruppe, slått på 11. aug 2026). Tom = ingen lenke. */
  ios: 'https://testflight.apple.com/join/p5ptPBY7',
  /* Lukket testing i Play. Krever at kontoen er lagt inn som tester (Google-gruppa
     tidel-testere) — ellers svarer Play «appen er ikke tilgjengelig». */
  and: 'https://play.google.com/apps/testing/no.tidel',
  /* Faller lenka bort, skal knappen fortsatt gaa et sted som virker uten e-postkonto. */
  reserve: '/contact/'
};
var GRUPPE_URL = 'https://groups.google.com/g/tidel-testere';

var BUTIKKER = [
  { id:'ios', pre:'Download on the', navn:'App Store',
    status:'beta',                       // 'beta' | 'snart' | 'live'
    merke:'TestFlight beta',
    lenke:LENKER.ios || LENKER.reserve,
    cta:LENKER.ios ? 'Open in TestFlight' : 'Ask for a TestFlight place',
    req:LENKER.ios
      ? 'Opens TestFlight. Install Apple&rsquo;s TestFlight app first &mdash; it is free.'
      : 'The public TestFlight link is not open yet. Write to <a href="mailto:post@tidel.no">post@tidel.no</a> and you get a reply from a person, usually the same day.',
    /* IOS-3 (4. sep 2026): 15 -> 16.4. IOS_DEPLOYMENT_TARGET i codemagic.yaml er hevet
       fordi appen BRUKER navigator.wakeLock og Compression/DecompressionStream, som ikke
       finnes foer 16.4 — paa iOS 15 var bade skjermlaasen under opptak og hele zip-/gz-
       importveien doed. Tallet her maa foelge byggets verdi, ellers lover sida en
       installasjon App Store vil nekte. */
    meta:'iPhone &middot; iOS 16.4 or later. Apple Watch rides import from Apple Health.' },
  { id:'and', pre:'Get it on', navn:'Google Play',
    status:'beta',
    merke:'Closed beta',
    lenke:LENKER.and || LENKER.reserve,
    cta:'Become a tester on Google Play',
    req:'Closed testing: your Google account has to be on the tester list first. Join <a href="' + GRUPPE_URL + '">the tidel-testere group</a> (or write to <a href="mailto:post@tidel.no">post@tidel.no</a>), then open the link above once &mdash; after that Play updates the app by itself.',
    /* minSdkVersion 26 i app-ios/scripts/patch-android-project.sh:71 = Android 8.0.
       Endres MIN_SDK der, endres denne linja i samme slipp. */
    meta:'Android 8.0 or later. GPX import from any watch that can export one.' }
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
           /* WEB-1: teksten under knappen er nå kortets EGEN (b.req) — den sier hva som
              skjer når du trykker, per butikk. Den gamle felles setningen sa «write to
              post@tidel.no» også for veier som ikke går via e-post i det hele tatt. */
           '<div class="req">' + (b.status === 'live'
              ? 'Available to everyone.'
              : (b.req || 'Beta places are limited while we test. Write to post@tidel.no and you get a reply from a person.')) +
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
