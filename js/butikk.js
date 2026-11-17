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

/* ══ T6 (15. okt 2026) — KAMPANJEMERKE PER KILDE ═══════════════════════════════════
   Markedsplanen punkt 3: i dag vet vi ikke hvor en eneste bruker kom fra. Hver butikk-
   lenke baerer derfor et merke som sier hvilken grov kilde den sto i — seks til aatte
   kilder, ikke en per klubb (Apple viser en kampanje foerst etter fem nedlastinger, saa
   smale kilder gir aldri et tall). Merket gaar dit butikkene leser det:
     · App Store: ct=<kilde> (og pt=<leverandoernoekkel> naar den er satt), lest i App
       Store Connect → Analytics → Campaigns. TestFlight-lenka ignorerer parametrene —
       ufarlig, og den dagen LENKER.ios blir App Store-lenka, virker merket av seg selv.
     · Google Play: referrer=utm_source%3Dtidel.no%26utm_medium%3Dlenke%26utm_campaign%3D
       <kilde>, lest i Play Console → Acquisition. Opt-in-sida ignorerer det paa samme vis.
   LENKER og BUTIKKER er uroert: merket legges paa i butikkLenke() idet knappen tegnes, saa
   «en sannhet for lenkene» (versjon.json = LENKER.ios) staar. Reservesida /contact/ faar
   ingen parametre. En kilde som ikke staar i KILDER blir «nett» — aldri fri tekst inn i
   en lenke. Sida sier selv hvor den er: ?fra=<kilde> i adressen (delesiden sender folk
   til /download/?fra=runde), ellers data-kilde paa <html> (delesiden selv), ellers «nett».
   Cloudflare-tellingen logger ikke spoerrestrenger, saa ?fra= synes ikke der; det er
   butikkenes egne tall som skal vise kilden. */
var KILDER = {
  nett:    'tidel.no selv: forsida og /download/ uten merke',
  runde:   'en delt runde (tidel.no/r/)',
  venn:    'kompislenka (tidel.no/v/): QR-en og «Del som melding» paa profilarket peker hit',
  bane:    'banesidene og skilt paa banen',
  klubb:   'klubbpakka: e-post, klubbens gruppe, oppslag i klubbhuset',
  racebox: 'RaceBox- og Garmin-eierne (FAQ-en deres, Connect IQ-butikken)',
  sosialt: 'sosiale medier: Instagram, Facebook-grupper, TikTok',
  epost:   'ventelista og sesongstart-e-posten'
};
/* Apples leverandoernoekkel (pt=) staar i App Store Connect → Analytics → Campaigns →
   «Create campaign link». Tom til eieren limer den inn; ct= sendes uansett. */
var KAMPANJE = { pt: '' };

function butikkLenke(id, kilde){
  var base = LENKER[id] || LENKER.reserve;
  if (!/^https:\/\//.test(base)) return base;            // reservesida: ingen merke
  kilde = KILDER[kilde] ? kilde : 'nett';
  var skille = base.indexOf('?') < 0 ? '?' : '&';
  if (id === 'ios') {
    return base + skille + (KAMPANJE.pt ? 'pt=' + encodeURIComponent(KAMPANJE.pt) + '&' : '')
      + 'ct=' + kilde + (/^https:\/\/apps\.apple\.com\//.test(base) ? '&mt=8' : '');
  }
  if (id === 'and') {
    return base + skille + 'referrer='
      + encodeURIComponent('utm_source=tidel.no&utm_medium=lenke&utm_campaign=' + kilde);
  }
  return base;
}
function kildeFraSida(){
  var m = /[?&]fra=([a-z]+)/.exec(String(location.search || ''));
  if (m && KILDER[m[1]]) return m[1];
  var h = document.documentElement, d = h && h.getAttribute ? h.getAttribute('data-kilde') : null;
  return d && KILDER[d] ? d : 'nett';
}

/* ══ WEB-6 (5. nov 2026, bolk 25) — NORSK GREN ═════════════════════════════════════
   Forsida (js/forside.js) og /r/ blir norske for en norsk nettleser, men knappene og
   kortene herfra var bare engelske. Samme spraakvalg som der: norsk naar nettleseren er
   norsk (nb, nn eller no foerst i lista), engelsk ellers. Bare navigator leses, aldri
   adressen. De engelske feltene i BUTIKKER staar som foer (tests/web.html leser dem som
   data); hver butikk har en nb-gren med de samme fem feltene, og butikkTekst() velger.
   Kravlinja (meta) maa foelge bygget paa begge spraak (IOS-3 og WEB-12 under). */
function butikkSprak(){
  try {
    var n = typeof navigator !== 'undefined' ? navigator : null;
    var l = n ? ((n.languages && n.languages.length ? n.languages[0] : n.language) || '') : '';
    return /^(nb|nn|no)(-|$)/i.test(String(l)) ? 'nb' : 'en';
  } catch (e) { return 'en'; }
}
var BUTIKK_SPRAK = butikkSprak();
var BUTIKK_FAST = {
  en: { alle: 'Available to everyone.',
        reserve: 'Beta places are limited while we test. Write to post@tidel.no and you get a reply from a person.' },
  nb: { alle: 'Tilgjengelig for alle.',
        reserve: 'Beta-plassene er få mens vi tester. Skriv til post@tidel.no, så får du svar fra et menneske.' }
};
function butikkTekst(b, felt){
  return BUTIKK_SPRAK === 'nb' && b.nb && typeof b.nb[felt] === 'string' ? b.nb[felt] : b[felt];
}

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
    meta:'iPhone &middot; iOS 16.4 or later. Apple Watch rides import from Apple Health.',
    nb:{ pre:'Last ned fra', merke:'TestFlight-beta',
      cta:LENKER.ios ? 'Åpne i TestFlight' : 'Be om en plass i TestFlight',
      req:LENKER.ios
        ? 'Åpner TestFlight. Installer Apples TestFlight-app først &mdash; den er gratis.'
        : 'Den offentlige TestFlight-lenka er ikke åpen ennå. Skriv til <a href="mailto:post@tidel.no">post@tidel.no</a>, så får du svar fra et menneske, som regel samme dag.',
      meta:'iPhone &middot; iOS 16.4 eller nyere. Økter fra Apple Watch importeres fra Apple Helse.' } },
  { id:'and', pre:'Get it on', navn:'Google Play',
    status:'beta',
    merke:'Closed beta',
    lenke:LENKER.and || LENKER.reserve,
    cta:'Become a tester on Google Play',
    req:'Closed testing: your Google account has to be on the tester list first. Join <a href="' + GRUPPE_URL + '">the tidel-testere group</a> (or write to <a href="mailto:post@tidel.no">post@tidel.no</a>), then open the link above once &mdash; after that Play updates the app by itself.',
    /* minSdkVersion 26 i app-ios/scripts/patch-android-project.sh:71 = Android 8.0.
       Endres MIN_SDK der, endres denne linja i samme slipp. */
    meta:'Android 8.0 or later. GPX import from any watch that can export one.',
    nb:{ pre:'Tilgjengelig på', merke:'Lukket beta',
      cta:'Bli tester på Google Play',
      req:'Lukket testing: Google-kontoen din må stå på testerlista først. Bli med i <a href="' + GRUPPE_URL + '">gruppa tidel-testere</a> (eller skriv til <a href="mailto:post@tidel.no">post@tidel.no</a>), og åpne lenka over én gang &mdash; etter det oppdaterer Play appen selv.',
      meta:'Android 8.0 eller nyere. GPX-import fra alle klokker som kan eksportere en GPX-fil.' } }
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

function butikkKnapper(kilde){
  var s = '', i;
  for (i = 0; i < BUTIKKER.length; i++) {
    var b = BUTIKKER[i];
    s += '<a class="store" href="' + butikkLenke(b.id, kilde) + '">' + GLYF[b.id] +
         '<span><span class="t1">' + butikkTekst(b, 'pre') + '</span>' +
         '<span class="t2">' + b.navn + '</span></span>' +
         '<span class="st" style="' + butikkFarge(b.status) + '">' + butikkTekst(b, 'merke') + '</span></a>';
  }
  return s;
}

function butikkKort(kilde){
  var s = '', i;
  for (i = 0; i < BUTIKKER.length; i++) {
    var b = BUTIKKER[i];
    s += '<div class="dlCard">' +
           '<div style="display:flex;align-items:center;gap:12px">' +
             '<span style="width:22px;height:22px;color:var(--mut);display:block">' + GLYF[b.id] + '</span>' +
             '<span class="plat">' + b.navn + '</span>' +
             '<span style="margin-left:auto;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;' +
                    'padding:4px 9px;border:1px solid;' + butikkFarge(b.status) + '">' + butikkTekst(b, 'merke') + '</span>' +
           '</div>' +
           '<p class="meta">' + butikkTekst(b, 'meta') + '</p>' +
           '<a class="knapp' + (b.status === 'live' ? ' p' : '') + '" href="' + butikkLenke(b.id, kilde) + '">' + butikkTekst(b, 'cta') + '</a>' +
           /* WEB-1: teksten under knappen er nå kortets EGEN (b.req) — den sier hva som
              skjer når du trykker, per butikk. Den gamle felles setningen sa «write to
              post@tidel.no» også for veier som ikke går via e-post i det hele tatt. */
           '<div class="req">' + (b.status === 'live'
              ? BUTIKK_FAST[BUTIKK_SPRAK].alle
              : (butikkTekst(b, 'req') || BUTIKK_FAST[BUTIKK_SPRAK].reserve)) +
           '</div>' +
         '</div>';
  }
  return s;
}

(function(){
  function fyll(id, html){ var e = document.getElementById(id); if (e) e.innerHTML = html; }
  var kilde = kildeFraSida();
  fyll('heroStores', butikkKnapper(kilde));
  fyll('footStores', butikkKnapper(kilde));
  fyll('dlGrid',     butikkKort(kilde));
  /* Sider uten de faste id-ene (delesiden) sier selv hvor knappene skal: data-butikk="knapper" eller "kort". */
  if (document.querySelectorAll) {
    var alle = document.querySelectorAll('[data-butikk]'), i;
    for (i = 0; i < alle.length; i++) {
      alle[i].innerHTML = alle[i].getAttribute('data-butikk') === 'kort' ? butikkKort(kilde) : butikkKnapper(kilde);
    }
  }
})();
