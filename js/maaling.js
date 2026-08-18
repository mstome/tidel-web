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

   Målingen ligger BARE på forsiden. De juridiske sidene er urørt med vilje.
   ═══════════════════════════════════════════════════════════════════════════════════ */
'use strict';

(function () {

  var TOKEN = '';          // <-- lim inn nøkkelen fra Cloudflare her

  if (!TOKEN) return;      // ikke satt opp ennå: gjør ingenting

  /* Respekter brukerens eget valg. Sender nettleseren «ikke spor meg», laster vi
     ikke skriptet i det hele tatt — det er billigere enn å be om unnskyldning. */
  var neiTakk =
    navigator.doNotTrack === '1' ||
    window.doNotTrack === '1' ||
    navigator.msDoNotTrack === '1' ||
    navigator.globalPrivacyControl === true;

  if (neiTakk) return;

  var s = document.createElement('script');
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', JSON.stringify({ token: TOKEN }));
  document.head.appendChild(s);

})();
