/* ═══════════════════════════════════════════════════════════════════════════════════
   TIDEL — forsida, interaksjon.

   Denne fila lastes KUN av index.html (kontrollert: ingen annen side refererer den).
   De to modulene tilsvarer React-komponentene i designreferansen, skrevet om til
   vanlig js siden nettstedet er statisk og ikke har noe byggesteg.

   Rører ikke butikkknappene — de eies av js/butikk.js, som er eneste sted
   butikkstatus og butikk-URL-er settes.

   V4 (16. okt 2026, markedsplanen punkt 4):
     · SPRÅK. Sida er norsk når nettleseren er norsk (nb/nn/no først i lista), engelsk
       ellers — samme grep som /r/. Fila index.html er skrevet på engelsk; de norske
       tekstene i TEKST.nb legges over med textContent (aldri innerHTML), nøkkel for
       nøkkel (data-t). En nøkkel med en liste fyller tekstbitene i elementet i rekkefølge
       (tekst, <span>, tekst …), så «RIDE TODAY.<br><span>GET FASTER</span><br>ALL SEASON.»
       blir tre norske linjer uten at markupen røres. Tre ting først på norsk: rundetider
       er gratis, du trenger ingen boks, laget av en norsk fører.
     · VENTELISTA. «Si fra når Tidel åpner»: ett POST til basen (venteliste_meld_paa, se
       supabase/SKY-VENTELISTE-1-SAMTYKKE.sql) med adressen, samtykkeversjonen og språket.
       Ikke uten kryss. Serveren sender bekreftelsen; sida sier bare «sjekk innboksen».
       SAMTYKKE_VERSJON og teksten ved krysset er ORDRETT det som ligger i basen — vakta
       tests/ci/sky-venteliste-vakt.mjs måler det. Endres teksten, endres begge.
       Lenka i e-posten ender her med ?venteliste=bekreftet|avmeldt|ugyldig, og sida
       viser beskjeden ved skjemaet.
   ═══════════════════════════════════════════════════════════════════════════════════ */
'use strict';

(function () {

  /* ── språk ─────────────────────────────────────────────────────────────────────── */
  function sprak() {
    var l = (navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language) || '';
    return /^(nb|nn|no)(-|$)/i.test(String(l)) ? 'nb' : 'en';
  }
  var SPRAK = sprak();

  /* Samme versjon og samme tekst som raden i public.venteliste_samtykke. */
  var SAMTYKKE_VERSJON = 'v1-2026-10-16';
  /* Basen appen alt bruker (anon-nøkkelen er den offentlige, samme som i appen). */
  var SKY = {
    url: 'https://ouodkduowjbkawayounh.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91b2RrZHVvd2pia2F3YXlvdW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNjIxMjcsImV4cCI6MjEwMTczODEyN30.c5I4TKyI1_DJA7R-0HVx4xVKITfKOA3qiEEq-hjZW7U'
  };

  /* Overskriftene har line-height .83 (laget for engelske versaler uten ring og aksent): en É eller Å paa
     linje to eller tre staar da inne i linja over (sett paa skjermbildene 16. okt: «IKKE ÉN RASK» og
     «ÉN HISTORIKK.»). Derfor ingen aksent paa de linjene; ventelistas h2 har egen linjehoeyde (1.06). */
  var TEKST = {
    nb: {
      tittel: 'Tidel — rundetider for motocross | Gratis, uten boks',
      beskrivelse: 'Rundetider for motocross med telefonen i lomma. Tidel finner banen, målstreken og hver runde selv — og viser om du faktisk blir raskere. Rundetider er gratis. Laget av en norsk fører.',
      navProgress: 'Fremgang', navAnalysis: 'Analyse', navDevices: 'Enheter', navGet: ['HENT TIDEL'],
      heroEyebrow: 'Laget av en norsk fører',
      heroH1: ['RUNDETIDER', 'ER GRATIS.', 'UTEN BOKS.'],
      heroCopy: 'Telefonen i lomma er nok. Tidel finner banen, målstreken og hver runde selv — og viser om du faktisk blir raskere.',
      heroStart: ['HENT TIDEL'], heroSee: ['SE EN SESONG'],
      proofTrack: 'Bane', proofD1: '2. mai', proofD2: '8. aug', proofSeason: 'Sesongen', proofDelta: '−44.58 S',
      manIndex: '01 / Forskjellen',
      manH2: ['EN RUNDE ER ET RESULTAT.', 'EN SESONG ER FREMGANG.'],
      manP: 'De fleste tidtakerapper sier hva som skjedde én gang. Tidel knytter sammen hver økt på samme bane, så du ser om treningen faktisk virker.',
      stampSpan: 'Produktet er', stampStrong: 'FREMGANG',
      pgIndex: '02 / Sesongen din',
      pgH2: ['HELE HISTORIEN,', 'IKKE EN RASK RUNDE.'],
      pgP: 'Dårlige dager blir i dataene. Gjennombruddene også. Slik blir fire økter en retning — ikke en høydepunktsrull.',
      pgTop: 'FROLAND MX / SESONGEN 2026', pgLive: ['', '4 ØKTER KOBLET'],
      pgL1: 'Valgt økt', pgL2: 'Beste runde', pgL3: 'Mot første økt', pgAxis: 'RUNDETID ↓',
      tab0: '2. MAI', tab1: '8. JUN', tab2: '22. JUL', tab3: '8. AUG',
      pgCap: 'FIRE ØKTER / ÉN BANE / EN KLAR RETNING',
      anIndex: '03 / Finn hvorfor',
      anH2: ['IKKE BARE SE', 'AT DU ER RASKERE.'],
      anP: 'Sammenlign tempo, kjørelinje og jevnhet på samme bane. Finn svingen som endret seg — og den som fortsatt koster deg.',
      anSel: 'VALGT RUNDE', anRef: 'REFERANSERUNDE', anTurn: 'SVING 07 / FROLAND MX', anLine: ['LINJA', 'SKILLER HER.'],
      secTop: 'FROLAND MX / RUNDE 06 MOT RUNDE 11', secLower: 'LAVERE ER RASKERE', secLabel: 'Rundedifferanse',
      secP: 'Tre gevinster. To tap. Ett klart sted å jobbe videre.',
      legGain: ['', 'TID VUNNET'], legLoss: ['', 'TID TAPT'],
      tabDelta: 'TIDSDIFFERANSE', tabLine: 'KJØRELINJE', tabPace: 'TEMPO',
      statBest: ['BESTE RUNDE '], statSect: ['BESTE SEKSJONER '],
      prIndex: '04 / Null friksjon',
      pr1h: 'KJØR', pr1p: 'Begynn å kjøre. Tidel kjenner igjen banen og finner hver runde selv.',
      pr2h: 'KOBLE', pr2p: 'Hver økt føyes til historikken din for den banen — uten å blande baner som ikke kan sammenliknes.',
      pr3h: 'FREMGANG', pr3p: 'Kom tilbake med ett klart mål, og se trenden endre seg gjennom sesongen.',
      devIndex: '05 / Ta med det du har',
      devH2: ['DIN TUR.', 'DIN ENHET.', 'SAMME HISTORIKK.'],
      devP: 'Ta tiden live fra telefonen, importer en klokkefil, eller koble til GPS med høy frekvens. Tidel holder sesongen på ett sted.',
      devNote: 'Produktnavnene sier bare hva som virker sammen med Tidel. Tidel er ikke tilknyttet, godkjent av eller i samarbeid med noen av disse selskapene.',
      noteTopS: 'LIVE ELLER IMPORTERT', noteTopB: 'HVER TUR TELLER', noteBotS: 'INGEN DEKNING?', noteBotB: 'KJØR VIDERE',
      offIndex: '06 / Laget for banen',
      offH2: ['INGEN DEKNING.', 'IKKE NOE PROBLEM.'],
      offP: 'Tidel tar opp mens du kjører og synker når nettet er tilbake. For de beste banene har sjelden perfekt dekning.',
      offStat: 'Krever nett', offVal: '0 %',
      wIndex: '07 / Si fra når Tidel åpner',
      wH2: ['SI FRA', 'NÅR TIDEL ÅPNER.'],
      wCopy: 'Tidel er i beta. Legg igjen e-posten din, så får du én beskjed når appen åpner for alle. Rundetider forblir gratis.',
      wLabel: 'E-posten din', wPh: 'navn@eksempel.no',
      wSamtykke: 'Ja, Tidel kan sende meg e-post: én når appen åpner for alle, og høyst én i måneden fram til da. Jeg er voksen, og jeg kan melde meg av i hver e-post.',
      wKnapp: ['SI FRA NÅR TIDEL ÅPNER'],
      wNote: ['Adressen brukes bare til dette, slettes 90 døgn etter at du melder deg av, og deles ikke. Du får først en e-post der du bekrefter. Skjemaet er for voksne. Mer i ', 'nettstedets personvern', '.'],
      finEyebrow: 'Neste tur starter trenden',
      finH2: ['SLUTT Å GJETTE.', 'BEGYNN Å BLI RASKERE.'],
      finGet: ['HENT TIDEL'],
      fDownload: 'Last ned', fSupport: 'Hjelp', fTerms: 'Vilkår', fLicenses: 'Lisenser', fDelete: 'Slett konto', fContact: 'Kontakt', fSitePrivacy: 'Nettstedets personvern',
      status: {
        kryss: 'Sett kryss i boksen først.',
        adresse: 'Sjekk e-postadressen.',
        sender: 'Sender …',
        sendt: 'Sjekk innboksen: du får en e-post der du bekrefter. Står du på lista fra før, trenger du ikke gjøre noe.',
        feil: 'Fikk ikke sendt. Prøv igjen om litt, eller skriv til post@tidel.no.',
        versjon: 'Sida er utdatert. Last den på nytt, og prøv igjen.',
        bekreftet: 'Takk, adressen er bekreftet. Du hører fra Tidel når appen åpner.',
        avmeldt: 'Du er meldt av. Tidel sender ikke mer e-post til deg.',
        ugyldig: 'Lenka er brukt eller utløpt. Skriv adressen på nytt, så kommer en ny e-post.'
      },
      okter: [
        { dato: '2. MAI', tid: '2:59.29', notat: '–',         foerste: true },
        { dato: '8. JUN', tid: '2:36.84', notat: '−22.45 S' },
        { dato: '22. JUL', tid: '2:41.22', notat: '−18.07 S' },
        { dato: '8. AUG', tid: '2:14.71', notat: '−44.58 S' }
      ],
      modus: [
        { merke: 'Tidsdifferanse', verdi: '4.85 S',   tittel: 'Tid som fortsatt ligger i banen',
          tekst: 'Tidel setter sammen de beste seksjonene dine og viser hva neste rene runde kan bli.' },
        { merke: 'Kjørelinje',     verdi: 'SVING 07', tittel: 'Finn linja som holder',
          tekst: 'Sammenlign sporet ditt gjennom samme sving og se nøyaktig hvor den raskere runden skiller lag.' },
        { merke: 'Tempo',          verdi: '−3.2 S',   tittel: 'Se hvor farten overlever',
          tekst: 'Finn strekkene der du holder på farten — og der runden begynner å rakne.' }
      ]
    },
    en: {
      status: {
        kryss: 'Tick the box first.',
        adresse: 'Check the email address.',
        sender: 'Sending …',
        sendt: 'Check your inbox: you get an email to confirm. If you are already on the list, nothing more is needed.',
        feil: 'Could not send. Try again in a moment, or write to post@tidel.no.',
        versjon: 'This page is out of date. Reload it, and try again.',
        bekreftet: 'Thanks, the address is confirmed. You hear from Tidel when the app opens.',
        avmeldt: 'You are unsubscribed. Tidel sends you no more email.',
        ugyldig: 'That link was used or has expired. Enter the address again and a new email comes.'
      },
      okter: [
        { dato: '02 MAY', tid: '2:59.29', notat: '–',          foerste: true },
        { dato: '08 JUN', tid: '2:36.84', notat: '−22.45 S' },
        { dato: '22 JUL', tid: '2:41.22', notat: '−18.07 S' },
        { dato: '08 AUG', tid: '2:14.71', notat: '−44.58 S' }
      ],
      modus: [
        { merke: 'Time delta',  verdi: '4.85 S',   tittel: 'Time still on the track',
          tekst: 'Tidel combines your best sectors to show what your next clean lap could be.' },
        { merke: 'Racing line', verdi: 'TURN 07',  tittel: 'Find the line that holds',
          tekst: 'Compare your path through the same corner and see exactly where the faster lap separates.' },
        { merke: 'Pace',        verdi: '−3.2 S', tittel: 'See where speed survives',
          tekst: 'Spot the sections where you carry momentum—and where the lap starts to unravel.' }
      ]
    }
  };
  var T = TEKST[SPRAK];

  /* Tekstbitene i et element, i rekkefølge: tekstnoder med innhold og barneelementer
     (ikke <br>). En nøkkel med en liste fyller dem én og én; en streng fyller den første.
     Alltid textContent/nodeValue — aldri innerHTML. */
  function biter(el) {
    var ut = [], n;
    for (n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) { if (n.nodeValue.replace(/\s+/g, '')) ut.push(n); }
      else if (n.nodeType === 1 && n.tagName !== 'BR') ut.push(n);
    }
    return ut;
  }
  function settTekst(el, v) {
    if (typeof v === 'string') v = [v];
    var s = biter(el), i;
    if (!s.length) { el.textContent = v[0]; return; }
    for (i = 0; i < v.length && i < s.length; i++) {
      if (s[i].nodeType === 3) s[i].nodeValue = v[i]; else s[i].textContent = v[i];
    }
  }
  function oversett() {
    if (SPRAK !== 'nb') return;
    document.documentElement.lang = 'nb';
    document.title = T.tittel;
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', T.beskrivelse);
    var alle = document.querySelectorAll('[data-t]'), i;
    for (i = 0; i < alle.length; i++) {
      var k = alle[i].getAttribute('data-t');
      if (typeof T[k] === 'string' || Object.prototype.toString.call(T[k]) === '[object Array]') settTekst(alle[i], T[k]);
      var h = alle[i].getAttribute('data-href-nb');
      if (h) alle[i].setAttribute('href', h);
    }
    var ph = document.querySelectorAll('[data-ph]');
    for (i = 0; i < ph.length; i++) {
      var pk = ph[i].getAttribute('data-ph');
      if (typeof T[pk] === 'string') ph[i].setAttribute('placeholder', T[pk]);
    }
  }

  /* ── Sesongvelgeren ────────────────────────────────────────────────────────────── */
  var ØKTER = T.okter;

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
  var MODUS = T.modus;

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

  /* ── Ventelista ────────────────────────────────────────────────────────────────── */
  /* Lenka i e-posten ender på https://tidel.no/?venteliste=bekreftet|avmeldt|ugyldig#venteliste.
     Bare de tre ordene slipper gjennom — aldri fri tekst fra adressen inn på sida. */
  function statusFraAdressen(sok) {
    var m = /[?&]venteliste=(bekreftet|avmeldt|ugyldig)(&|$)/.exec(String(sok || ''));
    return m ? m[1] : null;
  }
  var visStatus = function () {};
  function venteliste() {
    var f = document.getElementById('waitForm');
    if (!f) return;
    var ep = document.getElementById('wEpost'), kryss = document.getElementById('wKryss'),
        st = document.getElementById('wStatus'), knapp = document.getElementById('wKnapp'),
        honning = f.querySelector('[name="nettside"]');
    var S = T.status;
    function si(k, feil) {
      if (!st) return;
      st.textContent = S[k] || '';
      st.className = 'waitStatus' + (feil ? ' feil' : '');
    }
    visStatus = function (k) { si(k, k === 'ugyldig' || k === 'feil' || k === 'kryss' || k === 'adresse' || k === 'versjon'); };
    /* Beskjeden fra lenka i e-posten (Edge sender hit): ?venteliste=bekreftet|avmeldt|ugyldig */
    var fraAdressen = statusFraAdressen(location.search);
    if (fraAdressen) visStatus(fraAdressen);

    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var e = String(ep && ep.value || '').trim();
      if (!kryss || !kryss.checked) { si('kryss', true); if (kryss) kryss.focus(); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) || e.length > 254) { si('adresse', true); if (ep) ep.focus(); return; }
      /* En robot fylte det usynlige feltet: lat som ingenting, send ingenting. */
      if (honning && honning.value) { si('sendt'); return; }
      if (knapp) knapp.disabled = true;
      si('sender');
      fetch(SKY.url + '/rest/v1/rpc/venteliste_meld_paa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SKY.key, 'Authorization': 'Bearer ' + SKY.key },
        body: JSON.stringify({ p_epost: e, p_samtykke_versjon: SAMTYKKE_VERSJON, p_sprak: SPRAK })
      }).then(function (r) {
        if (r.ok) return { ok: true };
        return r.json().then(function (j) { return { ok: false, melding: String(j && (j.message || j.feil) || '') }; },
                             function () { return { ok: false, melding: '' }; });
      }).then(function (r) {
        if (knapp) knapp.disabled = false;
        if (r.ok) { si('sendt'); if (ep) ep.value = ''; if (kryss) kryss.checked = false; }
        else if (/adresse/i.test(r.melding)) si('adresse', true);
        /* Basen avviser samtykkeversjonen (22023 «Samtykketeksten er utdatert»): teksten ved krysset er
           byttet mens sida sto åpen. Sida må lastes på nytt — «prøv igjen om litt» ville aldri hjelpe. */
        else if (/utdatert/i.test(r.melding)) si('versjon', true);
        else si('feil', true);
      }).catch(function () {
        if (knapp) knapp.disabled = false;
        si('feil', true);
      });
    });
  }

  /* ── Kobling ───────────────────────────────────────────────────────────────────── */
  function start() {
    oversett();
    /* Tallene i lesefeltet står på engelsk i fila (08 AUG): tegn den valgte økta på nytt
       på sidas språk, og la analysefeltet si det samme som fanene. */
    settØkt(3);
    settModus(0);
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
    venteliste();
  }

  /* Lesbart for testene (tests/web.html): språket, ordboka og samtykkeversjonen. */
  window.TIDEL_FORSIDE = { sprak: SPRAK, TEKST: TEKST, samtykkeVersjon: SAMTYKKE_VERSJON,
    statusFraAdressen: statusFraAdressen, visStatus: function (k) { visStatus(k); } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

})();
