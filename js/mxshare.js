/*!
 * mxshare.js - Delekode «MXB1:» for Tidel
 * Frittstående modul: koder/dekoder en økt, profil eller bane til en kort,
 * QR-vennlig tekststreng.
 *
 * Format:   MXB1: + base45( ramme )
 *   ramme   = [rammebyte] + komprimert(kropp + CRC32)
 *   base45  = RFC 9285 - alfabetet er identisk med QR-kodens alfanumeriske
 *             tegnsett, slik at QR-en kan bruke ALFANUMERISK modus (5,5 bit/tegn)
 *             i stedet for BYTE-modus (8 bit/tegn). Det er hele poenget.
 *
 * Ingen avhengigheter. Krever CompressionStream/DecompressionStream
 * (Chrome 80+/103+, Safari 16.4+, Firefox 113+). Uten dem faller koderen
 * automatisk tilbake til ukomprimert ramme.
 *
 * (c) Tidel. Fri bruk i prosjektet.
 */
(function (global) {
  'use strict';

  // ====================================================================
  //  Konstanter
  // ====================================================================

  var PREFIKS = 'MXB1:';
  var FORMAT_VERSJON = 1;   // versjon på kroppen (nyttelasten)
  var RAMME_VERSJON = 1;    // versjon på ytterrammen

  // Kvantisering for ghost-runden
  var HEAD_GRAD = 2;        // heading kvantiseres til 2 grader
  var HEAD_N = 180;         // 360 / 2 = 180 mulige retninger
  var TID_KVANT_MS = 100;   // tid kvantiseres til 0,1 s
  var FART_KVANT = 0.5;     // fart kvantiseres til 0,5 km/t

  var TYPE = { OKT: 1, PROFIL: 2, BANE: 3 };

  var FLAGG = {
    SPOR: 1,     // ghost-runde er med
    POSISJON: 2, // banekoordinat er med
    BESTETID: 4,
    DATO: 8,
    /* KONTO (8 tegns delekode) kom til etter at build 1-5 var ute hos testerne.
       Feltet skrives og leses ALLTID SIST, uansett bitverdi. Da leser en gammel
       klient alle felt den kjenner riktig, ser en bit den ikke kjenner, og lar de
       siste bytene ligge i meta.ubruktBytes - som allerede er dokumentert som
       «framtidige felt ignoreres bevisst». Formatversjonen bumpes derfor IKKE:
       en versjonsheving ville fått gamle klienter til å avvise koden helt. */
    KONTO: 16,
    /* VARIANT (SOSIALT-1, batch 4): tiden i koden er kjørt på en VARIANTLØYPE
       (auto-satt målstrek / kortløype), ikke på banens fullbane. Feltet bærer INGEN
       byte — bitet i flagget ER verdien — så en gammel klient leser koden nøyaktig
       som før: den ser en bit den ikke kjenner, det finnes ingen ekstra byte å
       snuble i, og formatversjonen trenger derfor ikke heves (samme resonnement som
       KONTO over). Uten dette feltet ble en kortløypetid fra en kompis lagt inn som
       fullbanerekord hos mottakeren — .mxrecord-fila og skyveien bar flagget, bare
       delekoden gjorde det ikke. */
    VARIANT: 32
  };

  // Sekunder fra unix-epoke til 2000-01-01T00:00:00Z
  var EPOKE_2000 = 946684800;

  var GRENSER = {
    maksStrengTegn: 4200,      // QR v40-L i alfanumerisk modus rommer 4296
    minStrengTegn: 8,
    maksRammeBytes: 8192,
    maksUtpakketBytes: 65536,  // vern mot «zip-bombe»
    maksTekstBytes: 128,
    maksSporPunkter: 2000,
    maksFartIdx: 800           // 400 km/t
  };

  // ====================================================================
  //  Feilhåndtering
  // ====================================================================

  function MXShareFeil(kode, melding) {
    this.name = 'MXShareFeil';
    this.kode = kode;
    this.message = melding;
    this.feil = melding;
  }
  MXShareFeil.prototype = Object.create(Error.prototype);
  MXShareFeil.prototype.constructor = MXShareFeil;

  function feil(kode, melding) {
    return new MXShareFeil(kode, melding);
  }

  // ====================================================================
  //  CRC32 (IEEE 802.3, samme som zip/png)
  // ====================================================================

  var CRC_TAB = (function () {
    var t = new Uint32Array(256), c, n, k;
    for (n = 0; n < 256; n++) {
      c = n;
      for (k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) {
      c = CRC_TAB[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  // ====================================================================
  //  Teksttransport: 2 byte -> 3 tegn over et QR-alfanumerisk alfabet
  //
  //  QR-kodens alfanumeriske tegnsett har nøyaktig 45 tegn, og RFC 9285
  //  (base45) bruker alle sammen. Problemet: ett av dem er MELLOMROM.
  //  En delekode som skal limes inn i en chat tåler ikke mellomrom -
  //  linjebryting, .trim(), autokorrektur og dobbeltklikk-merking deler
  //  koden i to. Tegnene %, + og / er dessuten vonde i en URL.
  //
  //  Vi dropper derfor de fire tegnene og bruker 41 tegn. Det koster
  //  INGENTING i lengde: 41^3 = 68921 >= 65536, så to byte blir fortsatt
  //  tre tegn, akkurat som base45. QR-en havner like fullt i ALFANUMERISK
  //  modus, som er hele poenget.
  //
  //  base45 (RFC 9285) er beholdt eksportert for interop/verifisering.
  // ====================================================================

  var TEGNSETT = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$*-.:';           // 41 tegn
  var B45 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';            // 45 tegn (RFC 9285)

  // QR-kodens alfanumeriske tegnsett (ISO/IEC 18004, tabell 5)
  var QR_ALFANUM = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

  function lagTegnKodek(alfabet) {
    var R = alfabet.length;
    var R2 = R * R;
    if (R * R2 < 65536 || R2 < 256) {
      throw new Error('Alfabetet er for lite til 2-byte-pakking.');
    }
    var rev = new Int16Array(128), i;
    for (i = 0; i < 128; i++) rev[i] = -1;
    for (i = 0; i < R; i++) rev[alfabet.charCodeAt(i)] = i;

    function kod(bytes) {
      var ut = '', j = 0, n, c, d, e;
      for (; j + 1 < bytes.length; j += 2) {
        n = bytes[j] * 256 + bytes[j + 1];
        c = n % R; n = (n - c) / R;
        d = n % R; e = (n - d) / R;
        ut += alfabet.charAt(c) + alfabet.charAt(d) + alfabet.charAt(e);
      }
      if (j < bytes.length) {
        n = bytes[j];
        c = n % R; d = (n - c) / R;
        ut += alfabet.charAt(c) + alfabet.charAt(d);
      }
      return ut;
    }

    function dekod(s) {
      var len = s.length;
      if (len % 3 === 1) {
        throw feil('kode_lengde', 'Delekoden er avkortet - det mangler tegn på slutten.');
      }
      var siffer = new Int16Array(len), k;
      for (k = 0; k < len; k++) {
        var kode = s.charCodeAt(k);
        var v = (kode < 128) ? rev[kode] : -1;
        if (v < 0) {
          throw feil('kode_tegn',
            'Delekoden inneholder et tegn som ikke hører hjemme i en MXB1-kode («' +
            s.charAt(k) + '», posisjon ' + (k + 1) + ').');
        }
        siffer[k] = v;
      }
      var antHele = Math.floor(len / 3);
      var rest = len - antHele * 3;
      var ut = new Uint8Array(antHele * 2 + (rest === 2 ? 1 : 0));
      var p = 0, q = 0, n;
      for (var g = 0; g < antHele; g++) {
        n = siffer[p] + siffer[p + 1] * R + siffer[p + 2] * R2;
        p += 3;
        if (n > 0xFFFF) {
          throw feil('kode_verdi', 'Delekoden er skadet (ugyldig tallgruppe ved tegn ' + (p - 2) + ').');
        }
        ut[q++] = (n >>> 8) & 0xFF;
        ut[q++] = n & 0xFF;
      }
      if (rest === 2) {
        n = siffer[p] + siffer[p + 1] * R;
        if (n > 0xFF) throw feil('kode_verdi', 'Delekoden er skadet (ugyldig sluttgruppe).');
        ut[q++] = n;
      }
      return ut;
    }

    return { alfabet: alfabet, R: R, rev: rev, kod: kod, dekod: dekod };
  }

  var MXKODEK = lagTegnKodek(TEGNSETT);        // brukes av MXB1
  var B45KODEK = lagTegnKodek(B45);            // RFC 9285, kun interop/test

  function base41Kod(b) { return MXKODEK.kod(b); }
  function base41Dekod(s) { return MXKODEK.dekod(s); }
  function base45Kod(b) { return B45KODEK.kod(b); }
  function base45Dekod(s) { return B45KODEK.dekod(s); }

  // ====================================================================
  //  Byte-skriver / -leser med varint
  // ====================================================================

  function Skriver() {
    this.b = [];
  }
  Skriver.prototype.u8 = function (v) {
    this.b.push(v & 0xFF);
  };
  Skriver.prototype.u32 = function (v) {
    v = v >>> 0;
    this.b.push(v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF);
  };
  Skriver.prototype.i32 = function (v) {
    this.u32(v | 0);
  };
  Skriver.prototype.uvarint = function (v) {
    v = Math.max(0, Math.round(v));
    while (v >= 0x80) {
      this.b.push((v % 128) | 0x80);
      v = Math.floor(v / 128);
    }
    this.b.push(v);
  };
  Skriver.prototype.svarint = function (v) {
    v = Math.round(v);
    this.uvarint(v >= 0 ? v * 2 : (-v) * 2 - 1);
  };
  Skriver.prototype.tekst = function (s, navn) {
    s = (s == null) ? '' : String(s);
    var bytes = TEKST_KOD.encode(s);
    if (bytes.length > GRENSER.maksTekstBytes) {
      // Kutt trygt på tegngrense, ikke midt i en UTF-8-sekvens
      bytes = kuttUtf8(s, GRENSER.maksTekstBytes);
    }
    this.uvarint(bytes.length);
    for (var i = 0; i < bytes.length; i++) this.b.push(bytes[i]);
  };
  Skriver.prototype.ferdig = function () {
    return Uint8Array.from(this.b);
  };

  var TEKST_KOD = new TextEncoder();
  var TEKST_DEK = new TextDecoder('utf-8', { fatal: false });

  function kuttUtf8(s, maksBytes) {
    var lo = 0, hi = s.length, best = new Uint8Array(0);
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      var b = TEKST_KOD.encode(s.slice(0, mid));
      if (b.length <= maksBytes) { best = b; lo = mid + 1; } else { hi = mid - 1; }
    }
    return best;
  }

  function Leser(bytes) {
    this.d = bytes;
    this.p = 0;
  }
  Leser.prototype.krev = function (n) {
    if (this.p + n > this.d.length) {
      throw feil('avkuttet', 'Delekoden er avkortet - det mangler data på slutten.');
    }
  };
  Leser.prototype.u8 = function () {
    this.krev(1);
    return this.d[this.p++];
  };
  Leser.prototype.u32 = function () {
    this.krev(4);
    var v = (this.d[this.p] | (this.d[this.p + 1] << 8) | (this.d[this.p + 2] << 16) | (this.d[this.p + 3] << 24)) >>> 0;
    this.p += 4;
    return v;
  };
  Leser.prototype.i32 = function () {
    return this.u32() | 0;
  };
  Leser.prototype.uvarint = function () {
    var v = 0, skift = 1, b, ant = 0;
    do {
      this.krev(1);
      b = this.d[this.p++];
      v += (b & 0x7F) * skift;
      skift *= 128;
      if (++ant > 8) {
        throw feil('varint', 'Delekoden inneholder et ugyldig tall.');
      }
    } while (b & 0x80);
    return v;
  };
  Leser.prototype.svarint = function () {
    var u = this.uvarint();
    return (u % 2 === 0) ? u / 2 : -((u + 1) / 2);
  };
  Leser.prototype.tekst = function () {
    var n = this.uvarint();
    if (n > GRENSER.maksTekstBytes) {
      throw feil('felt', 'Delekoden oppgir et altfor langt tekstfelt (' + n + ' byte).');
    }
    this.krev(n);
    var s = TEKST_DEK.decode(this.d.subarray(this.p, this.p + n));
    this.p += n;
    return s;
  };
  Leser.prototype.rest = function () {
    return this.d.length - this.p;
  };

  // ====================================================================
  //  Geografi
  // ====================================================================

  // Meter per grad breddegrad/lengdegrad ved gitt breddegrad (WGS84-serie).
  function meterPerGrad(latGrader) {
    var f = latGrader * Math.PI / 180;
    return {
      mLat: 111132.92 - 559.82 * Math.cos(2 * f) + 1.175 * Math.cos(4 * f) - 0.0023 * Math.cos(6 * f),
      mLon: 111412.84 * Math.cos(f) - 93.5 * Math.cos(3 * f) + 0.118 * Math.cos(5 * f)
    };
  }

  // Haversine - avstand i meter
  function avstandM(lat1, lon1, lat2, lon2) {
    var R = 6371008.8;
    var p = Math.PI / 180;
    var dLat = (lat2 - lat1) * p;
    var dLon = (lon2 - lon1) * p;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * p) * Math.cos(lat2 * p) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  // ====================================================================
  //  Ghost-runde: delta-kodet posisjon via (heading 2°, fart 0,5 km/t, tid 0,1 s)
  //
  //  Posisjonen rekonstrueres ved dødregning:
  //      steg = fartIdx * 0,5 km/t  ->  m/s  *  dtU * 0,1 s
  //      pos += (sin(h), cos(h)) * steg
  //
  //  Koderen kjører EN eksakt kopi av dekoderen internt og sikter mot det
  //  ekte neste punktet fra der dekoderen faktisk står (tilbakekoblet
  //  kvantisering). Dermed akkumuleres ikke avviket - feilen holder seg
  //  innenfor ett kvantiseringssteg uansett hvor mange punkter sporet har.
  // ====================================================================

  function lagDodregner(lat0E7, lon0E7) {
    var lat0 = lat0E7 / 1e7;
    var lon0 = lon0E7 / 1e7;
    var mg = meterPerGrad(lat0);
    return {
      lat0: lat0,
      lon0: lon0,
      mg: mg,
      posE: 0,
      posN: 0,
      tq: 0,
      // Ett steg framover med gitte kvantiserte verdier (dekodersiden)
      flytt: function (dtU, hIdx, vIdx) {
        this.tq += dtU;
        var dtS = dtU * TID_KVANT_MS / 1000;
        var l = vIdx * FART_KVANT / 3.6 * dtS;
        var hRad = hIdx * HEAD_GRAD * Math.PI / 180;
        this.posE += Math.sin(hRad) * l;
        this.posN += Math.cos(hRad) * l;
      },
      lat: function () { return this.lat0 + this.posN / this.mg.mLat; },
      lon: function () { return this.lon0 + this.posE / this.mg.mLon; }
    };
  }

  function skrivSpor(w, spor) {
    var n = spor.length;
    if (n < 2) throw feil('felt', 'En ghost-runde må ha minst 2 punkter.');
    if (n > GRENSER.maksSporPunkter) {
      throw feil('felt', 'For mange sporpunkter (' + n + '). Maks er ' + GRENSER.maksSporPunkter + '.');
    }
    for (var k = 0; k < n; k++) {
      var pk = spor[k];
      if (!pk || !erTall(pk.lat) || !erTall(pk.lon) || Math.abs(pk.lat) > 90 || Math.abs(pk.lon) > 180) {
        throw feil('felt', 'Sporpunkt ' + (k + 1) + ' mangler gyldig posisjon.');
      }
    }

    var lat0E7 = Math.round(spor[0].lat * 1e7);
    var lon0E7 = Math.round(spor[0].lon * 1e7);
    var dr = lagDodregner(lat0E7, lon0E7);
    var t0 = tidMsAv(spor[0]);

    var dtA = [], hA = [], vA = [];
    for (var i = 1; i < n; i++) {
      var tRel = tidMsAv(spor[i]) - t0;
      var tqMaal = Math.round(tRel / TID_KVANT_MS);
      var dtU = tqMaal - dr.tq;
      if (!isFinite(dtU) || dtU < 0) dtU = 0;
      if (dtU > 100000) dtU = 100000;

      var E = (spor[i].lon - dr.lon0) * dr.mg.mLon;
      var N = (spor[i].lat - dr.lat0) * dr.mg.mLat;
      var vE = E - dr.posE;
      var vN = N - dr.posN;
      var dist = Math.sqrt(vE * vE + vN * vN);

      var grad = Math.atan2(vE, vN) * 180 / Math.PI;
      if (grad < 0) grad += 360;
      var hIdx = Math.round(grad / HEAD_GRAD) % HEAD_N;

      var dtS = dtU * TID_KVANT_MS / 1000;
      var vIdx;
      if (dtS > 0) {
        vIdx = Math.round((dist / dtS * 3.6) / FART_KVANT);
        if (vIdx < 0) vIdx = 0;
        if (vIdx > GRENSER.maksFartIdx) vIdx = GRENSER.maksFartIdx;
      } else {
        // Ingen tid gikk -> ingen bevegelse er mulig. Nullstill også retningen,
        // ellers ville kod(dekod(x)) gitt en annen byte enn kod(x).
        vIdx = 0;
        hIdx = 0;
      }

      dr.flytt(dtU, hIdx, vIdx);
      dtA.push(dtU); hA.push(hIdx); vA.push(vIdx);
    }

    w.uvarint(n);
    w.i32(lat0E7);
    w.i32(lon0E7);
    w.u8(hA[0]);
    w.uvarint(vA[0]);

    // Kolonnevis (SoA) - gir deflate langt bedre grep enn punktvis fletting
    var j;
    for (j = 0; j < dtA.length; j++) w.uvarint(dtA[j]);
    for (j = 1; j < hA.length; j++) w.svarint(headingDelta(hA[j - 1], hA[j]));
    for (j = 1; j < vA.length; j++) w.svarint(vA[j] - vA[j - 1]);
  }

  // Normaliser retningsdelta til [-90, 89] indeksenheter (= [-180, 178] grader)
  function headingDelta(fra, til) {
    var d = til - fra;
    while (d < -HEAD_N / 2) d += HEAD_N;
    while (d >= HEAD_N / 2) d -= HEAD_N;
    return d;
  }

  function lesSpor(r) {
    var n = r.uvarint();
    if (n < 2 || n > GRENSER.maksSporPunkter) {
      throw feil('felt', 'Ghost-runden oppgir et ugyldig antall punkter (' + n + ').');
    }
    var lat0E7 = r.i32();
    var lon0E7 = r.i32();
    if (Math.abs(lat0E7) > 900000000 || Math.abs(lon0E7) > 1800000000) {
      throw feil('felt', 'Ghost-runden har en umulig startposisjon.');
    }
    var h = r.u8();
    var v = r.uvarint();
    if (h >= HEAD_N) throw feil('felt', 'Ghost-runden har en ugyldig startretning.');
    if (v > GRENSER.maksFartIdx) throw feil('felt', 'Ghost-runden har en umulig startfart.');

    var steg = n - 1;
    var dtA = new Array(steg), hA = new Array(steg), vA = new Array(steg);
    var i;
    for (i = 0; i < steg; i++) {
      var dtU = r.uvarint();
      if (dtU > 100000) throw feil('felt', 'Ghost-runden har et umulig tidssteg.');
      dtA[i] = dtU;
    }
    hA[0] = h; vA[0] = v;
    for (i = 1; i < steg; i++) {
      var dh = r.svarint();
      hA[i] = (((hA[i - 1] + dh) % HEAD_N) + HEAD_N) % HEAD_N;
    }
    for (i = 1; i < steg; i++) {
      var dv = vA[i - 1] + r.svarint();
      if (dv < 0) dv = 0;
      if (dv > GRENSER.maksFartIdx) {
        throw feil('felt', 'Ghost-runden har en umulig fart i punkt ' + (i + 2) + '.');
      }
      vA[i] = dv;
    }

    var dr = lagDodregner(lat0E7, lon0E7);
    var ut = new Array(n);
    ut[0] = {
      lat: dr.lat0,
      lon: dr.lon0,
      tMs: 0,
      fartKmt: vA[0] * FART_KVANT,
      retningGrader: hA[0] * HEAD_GRAD
    };
    for (i = 0; i < steg; i++) {
      dr.flytt(dtA[i], hA[i], vA[i]);
      ut[i + 1] = {
        lat: dr.lat(),
        lon: dr.lon(),
        tMs: dr.tq * TID_KVANT_MS,
        fartKmt: vA[i] * FART_KVANT,
        retningGrader: hA[i] * HEAD_GRAD
      };
    }
    return ut;
  }

  // ====================================================================
  //  forberedSpor - gjør et råspor klart for ghost-koding
  //
  //  Tiden lagres i 0,1 s-steg. Hvis råsporet har f.eks. 0,382 s mellom
  //  punktene, må hvert steg avrundes til 0,3 eller 0,4 s. Posisjon og
  //  absolutt tid blir like presise uansett, men den UTLEDEDE farten
  //  (strekning/tid) jitrer da med opptil ±13 %.
  //
  //  Løsningen er å resample sporet til et intervall som ER et multiplum
  //  av 0,1 s. Da blir hvert tidssteg eksakt, farten rolig, og dt-kolonnen
  //  blir konstant - noe deflate elsker, så koden blir kortere også.
  //
  //  Kjør denne på et råspor før kod(). Den takler ujevn logging.
  // ====================================================================

  function forberedSpor(spor, o) {
    o = o || {};
    if (!Array.isArray(spor) || spor.length < 2) {
      throw feil('felt', 'Sporet må ha minst 2 punkter for å lage en ghost-runde.');
    }
    var kilde = spor.slice().sort(function (a, b) { return tidMsAv(a) - tidMsAv(b); });
    var t0 = tidMsAv(kilde[0]);
    var varighet = tidMsAv(kilde[kilde.length - 1]) - t0;
    if (!(varighet > 0)) {
      throw feil('felt', 'Sporet har ingen varighet - alle punktene har samme tidsstempel.');
    }
    // «punkter» er et MÅL, ikke et tak: intervallet må være et helt antall
    // 0,1 s, så vi velger det multiplumet som treffer målet best. Da beholder
    // vi oppløsningen i stedet for å runde ned til neste hele halvsekund.
    var maalPunkter = Math.max(2, Math.min(GRENSER.maksSporPunkter, o.punkter || 200));
    var intervall;
    if (o.intervallMs) {
      intervall = Math.max(TID_KVANT_MS, Math.round(o.intervallMs / TID_KVANT_MS) * TID_KVANT_MS);
    } else {
      var ideal = varighet / (maalPunkter - 1);
      var lav = Math.max(TID_KVANT_MS, Math.floor(ideal / TID_KVANT_MS) * TID_KVANT_MS);
      var hoy = Math.max(TID_KVANT_MS, Math.ceil(ideal / TID_KVANT_MS) * TID_KVANT_MS);
      var nLav = Math.floor(varighet / lav) + 1;
      var nHoy = Math.floor(varighet / hoy) + 1;
      intervall = (Math.abs(nLav - maalPunkter) < Math.abs(nHoy - maalPunkter)) ? lav : hoy;
    }
    var n = Math.floor(varighet / intervall) + 1;
    // Hardt tak: enten det formatet tåler, eller det kalleren krever
    var tak = o.hardGrense ? maalPunkter : GRENSER.maksSporPunkter;
    while (n > tak) {
      intervall += TID_KVANT_MS;
      n = Math.floor(varighet / intervall) + 1;
    }
    if (n < 2) { n = 2; intervall = Math.max(TID_KVANT_MS, Math.round(varighet / TID_KVANT_MS) * TID_KVANT_MS); }

    var ut = new Array(n), j = 0;
    for (var i = 0; i < n; i++) {
      var t = i * intervall;
      while (j < kilde.length - 2 && (tidMsAv(kilde[j + 1]) - t0) < t) j++;
      var ta = tidMsAv(kilde[j]) - t0, tb = tidMsAv(kilde[j + 1]) - t0;
      var f = (tb > ta) ? (t - ta) / (tb - ta) : 0;
      if (f < 0) f = 0; if (f > 1) f = 1;
      ut[i] = {
        lat: kilde[j].lat + (kilde[j + 1].lat - kilde[j].lat) * f,
        lon: kilde[j].lon + (kilde[j + 1].lon - kilde[j].lon) * f,
        tMs: t
      };
      var fa = kilde[j].fartKmt, fb = kilde[j + 1].fartKmt;
      if (erTall(fa) && erTall(fb)) ut[i].fartKmt = fa + (fb - fa) * f;
    }
    return ut;
  }

  // ====================================================================
  //  Hjelpere
  // ====================================================================

  function erTall(v) {
    return typeof v === 'number' && isFinite(v);
  }

  function tidMsAv(p) {
    if (erTall(p.tMs)) return p.tMs;
    if (erTall(p.t)) return p.t;
    if (erTall(p.tid)) return p.tid;
    if (p.tid instanceof Date) return p.tid.getTime();
    return 0;
  }

  function datoTilSek(d) {
    var ms;
    if (d instanceof Date) ms = d.getTime();
    else if (erTall(d)) ms = d;
    else if (typeof d === 'string') ms = Date.parse(d);
    else return 0;
    if (!isFinite(ms)) return 0;
    var s = Math.round(ms / 1000) - EPOKE_2000;
    if (s < 0) s = 0;
    if (s > 4294967295) s = 4294967295;
    return s;
  }

  function sekTilDato(s) {
    return (s + EPOKE_2000) * 1000;
  }

  // ====================================================================
  //  Komprimering
  // ====================================================================

  function harStreams() {
    return (typeof CompressionStream === 'function' && typeof DecompressionStream === 'function');
  }

  function pakk(bytes, format) {
    return new Promise(function (res, rej) {
      var cs;
      try { cs = new CompressionStream(format); } catch (e) { rej(e); return; }
      var w = cs.writable.getWriter();
      w.write(bytes).catch(function () { });
      w.close().catch(function () { });
      new Response(cs.readable).arrayBuffer().then(function (ab) {
        res(new Uint8Array(ab));
      }, rej);
    });
  }

  function pakkUt(bytes, format, maksBytes) {
    return new Promise(function (res, rej) {
      var ds;
      try { ds = new DecompressionStream(format); } catch (e) { rej(e); return; }
      var w = ds.writable.getWriter();
      w.write(bytes).catch(function () { });
      w.close().catch(function () { });
      var leser = ds.readable.getReader();
      var biter = [];
      var total = 0;
      (function neste() {
        leser.read().then(function (r) {
          if (r.done) {
            var ut = new Uint8Array(total), o = 0;
            for (var i = 0; i < biter.length; i++) { ut.set(biter[i], o); o += biter[i].length; }
            res(ut);
            return;
          }
          total += r.value.length;
          if (total > maksBytes) {
            try { leser.cancel(); } catch (e) { }
            rej(feil('for_stor', 'Delekoden pakker ut til altfor mye data - den er ikke til å stole på.'));
            return;
          }
          biter.push(r.value);
          neste();
        }, rej);
      })();
    });
  }

  // ====================================================================
  //  KODING
  // ====================================================================

  function byggKropp(d) {
    if (!d || typeof d !== 'object') {
      throw feil('inndata', 'Det er ingenting å dele - datasettet mangler.');
    }
    var w = new Skriver();
    w.u8(0x4D); // 'M'
    w.u8(0x58); // 'X'
    w.u8(FORMAT_VERSJON);

    var type = erTall(d.type) ? (d.type | 0) : TYPE.OKT;
    if (type < 1 || type > 255) type = TYPE.OKT;
    w.u8(type);

    var harSpor = Array.isArray(d.spor) && d.spor.length >= 2;
    var harPos = erTall(d.lat) && erTall(d.lon) && Math.abs(d.lat) <= 90 && Math.abs(d.lon) <= 180;
    var harTid = erTall(d.bestetidMs) && d.bestetidMs > 0;
    var harDato = (d.dato != null && d.dato !== '');
    var harKonto = typeof d.konto === 'string' && d.konto.length > 0 && d.konto.length <= 32;

    var flagg = 0;
    if (harSpor) flagg |= FLAGG.SPOR;
    if (harPos) flagg |= FLAGG.POSISJON;
    if (harTid) flagg |= FLAGG.BESTETID;
    if (harDato) flagg |= FLAGG.DATO;
    if (harKonto) flagg |= FLAGG.KONTO;
    if (d.variant === true) flagg |= FLAGG.VARIANT;   // ren bit, ingen nyttelast
    w.u8(flagg);

    w.tekst(d.rytter);
    w.tekst(d.baneId);
    w.tekst(d.baneNavn);

    if (harPos) {
      w.i32(Math.round(d.lat * 1e6));
      w.i32(Math.round(d.lon * 1e6));
    }
    if (harDato) w.u32(datoTilSek(d.dato));
    if (harTid) w.uvarint(Math.round(d.bestetidMs));
    if (harSpor) skrivSpor(w, d.spor);
    if (harKonto) w.tekst(d.konto);   // ← ALLTID SIST. Se kommentaren ved FLAGG.KONTO.

    return w.ferdig();
  }

  /**
   * Koder et datasett til en «MXB1:»-streng.
   * @returns {Promise<string>}  kaster MXShareFeil ved ugyldig inndata
   */
  function kod(data, opsjoner) {
    opsjoner = opsjoner || {};
    return Promise.resolve().then(function () {
      var kropp = byggKropp(data);
      var medCrc = new Uint8Array(kropp.length + 4);
      medCrc.set(kropp, 0);
      var c = crc32(kropp);
      medCrc[kropp.length] = c & 0xFF;
      medCrc[kropp.length + 1] = (c >>> 8) & 0xFF;
      medCrc[kropp.length + 2] = (c >>> 16) & 0xFF;
      medCrc[kropp.length + 3] = (c >>> 24) & 0xFF;

      var forsok = [];
      if (harStreams() && opsjoner.komprimering !== 'ingen') {
        forsok.push(pakk(medCrc, 'deflate-raw').then(function (b) { return [1, b]; }, function () { return null; }));
        forsok.push(pakk(medCrc, 'deflate').then(function (b) { return [2, b]; }, function () { return null; }));
      }
      return Promise.all(forsok).then(function (res) {
        var beste = [0, medCrc];
        for (var i = 0; i < res.length; i++) {
          if (res[i] && res[i][1].length < beste[1].length) beste = res[i];
        }
        var nyttelast = beste[1];
        var ramme = new Uint8Array(1 + nyttelast.length);
        ramme[0] = (RAMME_VERSJON << 4) | beste[0];
        ramme.set(nyttelast, 1);
        if (ramme.length > GRENSER.maksRammeBytes) {
          throw feil('for_stor', 'Datasettet er for stort til å deles som kode (' + ramme.length + ' byte).');
        }
        var streng = PREFIKS + base41Kod(ramme);
        if (streng.length > GRENSER.maksStrengTegn) {
          throw feil('for_lang', 'Delekoden ble for lang (' + streng.length + ' tegn). Kort ned ghost-runden.');
        }
        return streng;
      });
    });
  }

  // ====================================================================
  //  DEKODING - kaster aldri, returnerer alltid et resultatobjekt
  // ====================================================================

  function nei(kode, melding, meta) {
    return { ok: false, kode: kode, feil: melding, data: null, meta: meta || {} };
  }

  /**
   * Dekoder en «MXB1:»-streng. Kaster ALDRI.
   * @returns {Promise<{ok:boolean, data:object|null, feil:string, kode:string, meta:object}>}
   */
  function dekod(streng) {
    return Promise.resolve().then(function () {
      if (typeof streng !== 'string') {
        return nei('type', 'Delekoden må være tekst.');
      }
      // Mellomrom og linjeskift finnes ikke i MX-alfabetet, så det er trygt
      // å fjerne all whitespace før tolking.
      var s = streng.replace(/\s+/g, '');
      if (!s) return nei('tom', 'Delekoden er tom.');
      s = s.toUpperCase(); // alfabetet har ingen små bokstaver

      var idx = s.indexOf(PREFIKS);
      if (idx < 0) {
        return nei('mangler_prefiks', 'Fant ingen MX-delekode i teksten. En delekode starter med «MXB1:».');
      }
      s = s.slice(idx + PREFIKS.length);

      // Klipp bort etterfølgende sludder (f.eks. tekst limt inn etter koden)
      var slutt = 0;
      while (slutt < s.length) {
        var k = s.charCodeAt(slutt);
        if (k >= 128 || MXKODEK.rev[k] < 0) break;
        slutt++;
      }
      var haleAvkuttet = s.length - slutt;
      s = s.slice(0, slutt);

      if (s.length < GRENSER.minStrengTegn) {
        return nei('for_kort', 'Delekoden er for kort til å være gyldig (' + s.length + ' tegn etter «MXB1:»).');
      }
      if (s.length > GRENSER.maksStrengTegn) {
        return nei('for_lang', 'Delekoden er for lang (' + s.length + ' tegn). Maks er ' + GRENSER.maksStrengTegn + '.');
      }

      // Tegnsettet inneholder «.», «:» og «-», som ofte henger igjen fra
      // omkringliggende tekst («… MXB1:XXXX.»). Prøv derfor å barbere av
      // inntil tre sluttegn hvis full lengde ikke går opp. CRC32 gjør at
      // en feilaktig treffer er praktisk talt umulig.
      var kandidater = [s];
      for (var kutt = 1; kutt <= 3; kutt++) {
        var k2 = s.slice(0, s.length - kutt);
        if (k2.length >= GRENSER.minStrengTegn && k2.length % 3 !== 1) kandidater.push(k2);
      }
      return forsokKandidater(kandidater, 0, null, streng, haleAvkuttet);
    }).then(null, function (e) {
      // Aller siste sikkerhetsnett - dekod() skal ALDRI kaste
      if (e instanceof MXShareFeil) return nei(e.kode, e.message);
      return nei('ukjent', 'Delekoden kunne ikke leses (uventet feil).');
    });
  }

  function forsokKandidater(liste, i, forsteFeil, original, haleAvkuttet) {
    if (i >= liste.length) {
      return forsteFeil || nei('ukjent', 'Delekoden kunne ikke leses.');
    }
    return dekodEn(liste[i], original, haleAvkuttet + (liste[0].length - liste[i].length))
      .then(function (r) {
        if (r.ok) return r;
        return forsokKandidater(liste, i + 1, forsteFeil || r, original, haleAvkuttet);
      });
  }

  function dekodEn(s, original, haleAvkuttet) {
    return Promise.resolve().then(function () {
      var ramme;
      try {
        ramme = base41Dekod(s);
      } catch (e) {
        return nei(e.kode || 'kode', e.message || 'Delekoden lot seg ikke tolke.');
      }
      var streng = original;
      if (ramme.length < 2) {
        return nei('for_kort', 'Delekoden inneholder ikke nok data.');
      }
      if (ramme.length > GRENSER.maksRammeBytes) {
        return nei('for_stor', 'Delekoden er for stor (' + ramme.length + ' byte).');
      }

      var rammeByte = ramme[0];
      var rVersjon = (rammeByte >> 4) & 0x0F;
      var komp = rammeByte & 0x0F;
      if (rVersjon !== RAMME_VERSJON) {
        return nei('ramme_versjon',
          'Denne delekoden er laget med en annen versjon av Tidel (rammeversjon ' + rVersjon + '). Oppdater appen.');
      }
      if (komp !== 0 && komp !== 1 && komp !== 2) {
        return nei('komprimering', 'Delekoden bruker en ukjent komprimering (' + komp + ').');
      }
      var nyttelast = ramme.subarray(1);

      var pakketUt;
      if (komp === 0) {
        pakketUt = Promise.resolve(nyttelast);
      } else if (!harStreams()) {
        return nei('mangler_stotte', 'Nettleseren støtter ikke utpakking av delekoder. Oppdater nettleseren.');
      } else {
        pakketUt = pakkUt(nyttelast, komp === 1 ? 'deflate-raw' : 'deflate', GRENSER.maksUtpakketBytes)
          .then(null, function (e) {
            if (e && e.kode === 'for_stor') throw e;
            throw feil('pakke_feil', 'Delekoden er skadet og lot seg ikke pakke ut.');
          });
      }

      return pakketUt.then(function (rå) {
        var meta = {
          tegn: streng.length,
          nyttedelTegn: s.length,
          rammeBytes: ramme.length,
          utpakketBytes: rå.length,
          komprimering: ['ingen', 'deflate-raw', 'deflate'][komp],
          haleAvkuttet: haleAvkuttet
        };
        if (rå.length < 9) {
          return nei('for_kort', 'Delekoden inneholder ikke nok data.', meta);
        }
        var kropp = rå.subarray(0, rå.length - 4);
        var crcFunnet = (rå[rå.length - 4] | (rå[rå.length - 3] << 8) | (rå[rå.length - 2] << 16) | (rå[rå.length - 1] << 24)) >>> 0;
        var crcVentet = crc32(kropp);
        meta.crcOk = (crcFunnet === crcVentet);
        if (!meta.crcOk) {
          return nei('crc', 'Delekoden er skadet (sjekksummen stemmer ikke). Kopier hele koden på nytt.', meta);
        }

        var r = new Leser(kropp);
        var data;
        try {
          if (r.u8() !== 0x4D || r.u8() !== 0x58) {
            return nei('magic', 'Dette er ikke en gyldig MX-delekode.', meta);
          }
          var versjon = r.u8();
          if (versjon > FORMAT_VERSJON) {
            return nei('versjon',
              'Delekoden bruker formatversjon ' + versjon + ' som denne appen ikke kjenner. Oppdater Tidel.', meta);
          }
          var type = r.u8();
          var flagg = r.u8();

          data = {
            type: type,
            rytter: r.tekst(),
            baneId: r.tekst(),
            baneNavn: r.tekst(),
            lat: null, lon: null, dato: null, bestetidMs: null, spor: null, konto: null,
            /* SOSIALT-1: variantløypa. Ren bit i flagget - eldre koder mangler bitet og
               gir false, som er riktig fallback (de var alle fullbane-koder). */
            variant: !!(flagg & FLAGG.VARIANT)
          };
          if (flagg & FLAGG.POSISJON) {
            data.lat = r.i32() / 1e6;
            data.lon = r.i32() / 1e6;
            if (Math.abs(data.lat) > 90 || Math.abs(data.lon) > 180) {
              return nei('felt', 'Delekoden har en umulig baneposisjon.', meta);
            }
          }
          if (flagg & FLAGG.DATO) data.dato = sekTilDato(r.u32());
          if (flagg & FLAGG.BESTETID) data.bestetidMs = r.uvarint();
          if (flagg & FLAGG.SPOR) data.spor = lesSpor(r);
          if (flagg & FLAGG.KONTO) data.konto = r.tekst();   // ← ALLTID SIST, samme grunn
          meta.versjon = versjon;
          meta.flagg = flagg;
          meta.ubruktBytes = r.rest(); // framtidige felt ignoreres bevisst
        } catch (e) {
          if (e instanceof MXShareFeil) return nei(e.kode, e.message, meta);
          return nei('ukjent', 'Delekoden kunne ikke leses (uventet feil).', meta);
        }
        return { ok: true, kode: null, feil: null, data: data, meta: meta };
      }, function (e) {
        var m = {
          tegn: streng.length, rammeBytes: ramme.length,
          komprimering: ['ingen', 'deflate-raw', 'deflate'][komp]
        };
        if (e instanceof MXShareFeil) return nei(e.kode, e.message, m);
        return nei('pakke_feil', 'Delekoden er skadet og lot seg ikke pakke ut.', m);
      });
    }).then(null, function (e) {
      // Aller siste sikkerhetsnett - dekod() skal ALDRI kaste
      if (e instanceof MXShareFeil) return nei(e.kode, e.message);
      return nei('ukjent', 'Delekoden kunne ikke leses (uventet feil).');
    });
  }

  // ====================================================================
  //  Diverse offentlige hjelpere
  // ====================================================================

  // Er hvert tegn i strengen med i QR-kodens alfanumeriske tegnsett?
  function erQrAlfanumerisk(s) {
    if (typeof s !== 'string') return false;
    for (var i = 0; i < s.length; i++) {
      if (QR_ALFANUM.indexOf(s.charAt(i)) < 0) return false;
    }
    return true;
  }

  // Sammenlign to datasett felt for felt. Returnerer liste med avvik.
  function avvik(a, b, tol) {
    tol = tol || {};
    var posM = tol.posM != null ? tol.posM : 0;
    var tidMs = tol.tidMs != null ? tol.tidMs : 0;
    var fartKmt = tol.fartKmt != null ? tol.fartKmt : 0;
    var ut = [];
    function sjekk(navn, x, y) {
      if (x === y) return;
      if (x == null && y == null) return;
      if (typeof x === 'number' && typeof y === 'number' && Math.abs(x - y) < 1e-12) return;
      ut.push(navn + ': ' + JSON.stringify(x) + ' != ' + JSON.stringify(y));
    }
    if (!a || !b) { ut.push('mangler datasett'); return ut; }
    sjekk('type', a.type, b.type);
    sjekk('rytter', a.rytter, b.rytter);
    sjekk('baneId', a.baneId, b.baneId);
    sjekk('baneNavn', a.baneNavn, b.baneNavn);
    sjekk('lat', a.lat, b.lat);
    sjekk('lon', a.lon, b.lon);
    sjekk('dato', a.dato, b.dato);
    sjekk('bestetidMs', a.bestetidMs, b.bestetidMs);
    var as = a.spor, bs = b.spor;
    if ((as == null) !== (bs == null)) { ut.push('spor: bare ett datasett har ghost-runde'); return ut; }
    if (as && bs) {
      if (as.length !== bs.length) { ut.push('spor.length: ' + as.length + ' != ' + bs.length); return ut; }
      for (var i = 0; i < as.length; i++) {
        var d = avstandM(as[i].lat, as[i].lon, bs[i].lat, bs[i].lon);
        if (d > posM) ut.push('spor[' + i + '] posisjon avviker ' + d.toFixed(3) + ' m');
        if (Math.abs(as[i].tMs - bs[i].tMs) > tidMs) ut.push('spor[' + i + '] tid avviker ' + (as[i].tMs - bs[i].tMs) + ' ms');
        if (Math.abs((as[i].fartKmt || 0) - (bs[i].fartKmt || 0)) > fartKmt) {
          ut.push('spor[' + i + '] fart avviker ' + ((as[i].fartKmt || 0) - (bs[i].fartKmt || 0)).toFixed(2) + ' km/t');
        }
      }
    }
    return ut;
  }

  // ====================================================================
  //  Eksport
  // ====================================================================

  var MXShare = {
    PREFIKS: PREFIKS,
    VERSJON: FORMAT_VERSJON,
    RAMME_VERSJON: RAMME_VERSJON,
    TYPE: TYPE,
    FLAGG: FLAGG,
    GRENSER: GRENSER,
    KVANT: { headingGrader: HEAD_GRAD, tidMs: TID_KVANT_MS, fartKmt: FART_KVANT },
    QR_ALFANUM: QR_ALFANUM,
    TEGNSETT: TEGNSETT,
    BASE45_ALFABET: B45,
    MXShareFeil: MXShareFeil,

    kod: kod,
    dekod: dekod,
    forberedSpor: forberedSpor,

    base41Kod: base41Kod,
    base41Dekod: base41Dekod,
    base45Kod: base45Kod,
    base45Dekod: base45Dekod,
    crc32: crc32,
    meterPerGrad: meterPerGrad,
    avstandM: avstandM,
    erQrAlfanumerisk: erQrAlfanumerisk,
    avvik: avvik,
    harStreams: harStreams
  };

  global.MXShare = MXShare;
  if (typeof module !== 'undefined' && module.exports) module.exports = MXShare;

})(typeof window !== 'undefined' ? window : globalThis);
