/* ═══════════════════════════════════════════════════════════════════════════════════
   TIDEL — besøkstelling.

   DETTE ER DET ENESTE STEDET målingen slås på. Sett TOKEN til nøkkelen fra
   Cloudflare Web Analytics, så begynner tellingen. Står den tom, lastes ingenting
   i det hele tatt — ingen forespørsel, ingen feil i konsollen.

   Slik får du nøkkelen (tar to minutter, koster ingenting):
     1. dash.cloudflare.com  ->  Analytics & Logs  ->  Web Analytics
     2. «Add a site», skriv tidel.no
     3. Velg JS-snippet-varianten (ikke proxy — DNS-en vår ligger hos Domeneshop)
     4. Kopier verdien i data-cf-beacon, det ser ut som {"token":"abc123..."}
     5. Lim TOKEN-en inn under

   Hvorfor Cloudflare og ikke Google Analytics: ingen informasjonskapsler, ingen
   fingeravtrykk, ingen samtykkebanner — og dermed heller ingenting som motsier
   personvernlinja i resten av produktet. Se /site-privacy/.

   HVOR DEN LIGGER (T6, 15. okt 2026): forsida, /download/, delesiden /r/ og kompislenka
   /v/ (V2: samme merke, samme ramme — navnet og venne-koden etter # forlater aldri
   nettleseren) (markedsplanen punkt 3: telling på sidene folk lander på, ikke bare forsida). De
   juridiske sidene er urørt med vilje. Og BARE på tidel.no: på 127.0.0.1, localhost og
   en forhåndsvisning på egen maskin lastes ingenting. Tallene skal vise fremmede, ikke
   utvikleren, og testriggen skal aldri kalle ut av maskinen.

   DELESIDEN OG «#»: på tidel.no/r/ ligger hele runden etter # i adressen (og etter ?k=
   når lenka har vært gjennom en tjeneste som spiser #). Den skal aldri forlate
   nettleseren. Cloudflare-skriptet lest 15. okt 2026 stripper både # og ? før det
   sender (ot(): e.hash="", e.search=""), men det er tredjepartskode som lastes live, og
   det vi ikke eier, bygger vi ikke et løfte på. Derfor ligger garantien her: en side som
   sier at adressen bærer noe privat (<script src="/js/maaling.js" data-tell-i-ramme>)
   laster ALDRI skriptet i sitt eget vindu når adressen har # eller ?. Den åpner i stedet
   samme sti — uten # og ? — i en usynlig ramme, og tellingen bor der. Ramma vet bare
   stien sin (/r/), og med referrerpolicy no-referrer får den ikke engang sidas adresse
   som referrer (nettleseren stripper # fra referrer uansett, etter standarden). Inne i
   ramma er adressen ren, og skriptet lastes direkte: tallet i Cloudflare står på stien
   /r/, som før. Forsida med #analysis har ikke merket — et anker er ikke privat, og den
   telles som før. Cloudflare logger ikke spørrestrenger, så ?fra=runde på /download/
   synes ikke der; kilden bæres videre i butikklenkene (butikk.js) i stedet.
   ═══════════════════════════════════════════════════════════════════════════════════ */
'use strict';

(function () {

  var TOKEN = '75c4185e77ed48f491fa32a14671dce9';   // Cloudflare Web Analytics, tidel.no

  if (!TOKEN) return;      // ikke satt opp ennå: gjør ingenting

  /* Bare det ekte nettstedet telles (tidel.no og www.tidel.no). */
  if (!/(^|\.)tidel\.no$/i.test(String(location.hostname || ''))) return;

  /* Respekter brukerens eget valg. Sender nettleseren «ikke spor meg», laster vi
     ikke skriptet i det hele tatt — det er billigere enn å be om unnskyldning. */
  var neiTakk =
    navigator.doNotTrack === '1' ||
    window.doNotTrack === '1' ||
    navigator.msDoNotTrack === '1' ||
    navigator.globalPrivacyControl === true;

  if (neiTakk) return;

  /* Adressen bærer noe privat, og den er ikke ren: tell gjennom en ramme på samme sti. */
  var meg = document.currentScript;
  var privat = !!(meg && meg.hasAttribute && meg.hasAttribute('data-tell-i-ramme'));
  if (privat && (location.hash || location.search)) {
    var f = document.createElement('iframe');
    f.src = location.pathname;                    // samme sti, uten # og uten ?
    f.setAttribute('referrerpolicy', 'no-referrer');
    f.setAttribute('aria-hidden', 'true');
    f.setAttribute('title', 'Tidel');
    f.tabIndex = -1;
    /* visibility, ikke display:none: en ramme som ikke tegnes får ingen tegne-
       anledninger, og et skript som venter på en slik ville aldri sendt noe. */
    f.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;border:0;visibility:hidden';
    (document.body || document.documentElement).appendChild(f);
    return;
  }

  var s = document.createElement('script');
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', JSON.stringify({ token: TOKEN }));
  document.head.appendChild(s);

})();
