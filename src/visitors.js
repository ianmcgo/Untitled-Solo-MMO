const VG_PLACES = "AD,42.5,1.6,Andorra;AE,24.2,54.5,UAE;AF,35.0,67.5,Afghanistan;AG,17.1,-61.8,Antigua and Barbuda;AI,18.2,-63.1,Anguilla;AL,41.1,20.1,Albania;AM,40.1,45.2,Armenia;AO,-11.7,18.1,Angola;AQ,-79.3,-47.9,Antarctica;AR,-36.4,-65.0,Argentina;AS,-14.3,-170.7,American Samoa;AT,47.6,13.4,Austria;AU,-23.6,134.0,Australia;AW,12.5,-70.0,Aruba;AX,60.3,20.0,Aland Islands;AZ,40.3,47.3,Azerbaijan;BA,44.1,18.1,Bosnia and Herzegovina;BB,13.2,-59.5,Barbados;BD,23.7,90.4,Bangladesh;BE,50.6,4.7,Belgium;BF,12.0,-1.6,Burkina Faso;BG,42.6,25.0,Bulgaria;BH,26.1,50.5,Bahrain;BI,-3.1,30.0,Burundi;BJ,9.7,2.3,Benin;BL,17.9,-62.8,Saint Barthélemy;BM,32.3,-64.8,Bermuda;BN,4.5,114.6,Brunei;BO,-16.6,-65.1,Bolivia;BQ,12.2,-68.3,Bonaire Sint Eustatius and Saba;BR,-10.5,-56.4,Brazil;BS,24.7,-78.1,Bahamas;BT,27.4,90.6,Bhutan;BV,-54.4,3.4,Bouvet Island;BW,-22.5,24.6,Botswana;BY,53.6,28.1,Belarus;BZ,17.4,-88.7,Belize;CA,56.5,-100.0,Canada;CC,-12.2,96.8,Cocos (Keeling) Islands;CD,-4.6,23.7,DR Congo;CF,6.4,20.1,Central African Republic;CG,-1.1,14.4,Congo;CH,46.7,8.3,Switzerland;CI,8.0,-5.8,Côte d'Ivoire;CK,-21.2,-159.8,Cook Islands;CL,-33.0,-71.0,Chile;CM,6.3,13.0,Cameroon;CN,37.5,105.8,China;CO,3.5,-72.7,Colombia;CR,9.7,-84.0,Costa Rica;CU,21.6,-79.2,Cuba;CV,15.1,-23.6,Cape Verde;CW,12.2,-69.0,Curaçao;CX,-10.5,105.7,Christmas Island;CY,35.2,33.5,Cyprus;CZ,49.9,15.4,Czechia;DE,50.7,10.3,Germany;DJ,11.8,42.6,Djibouti;DK,56.2,9.5,Denmark;DM,15.4,-61.4,Dominica;DO,18.8,-70.5,Dominican Republic;DZ,29.4,1.8,Algeria;EC,-2.0,-78.6,Ecuador;EE,58.5,25.9,Estonia;EG,27.7,30.8,Egypt;EH,24.5,-12.4,Western Sahara;ER,15.1,39.2,Eritrea;ES,41.0,-4.0,Spain;ET,9.2,38.9,Ethiopia;FI,64.9,25.3,Finland;FJ,-16.5,-180.0,Fiji;FK,-51.7,-58.7,Falkland Islands (Malvinas);FM,6.9,158.2,Micronesia;FO,62.1,-6.8,Faroe Islands;FR,46.6,2.4,France;GA,-0.9,11.6,Gabon;GB,53.5,-1.8,United Kingdom;GD,12.1,-61.7,Grenada;GE,42.1,43.9,Georgia;GF,4.0,-53.0,French Guiana;GG,49.5,-2.6,Guernsey;GH,8.3,-1.1,Ghana;GI,36.1,-5.3,Gibraltar;GL,73.0,-42.4,Greenland;GM,13.4,-15.5,The Gambia;GN,10.1,-10.7,Guinea;GP,16.3,-61.5,Guadeloupe;GQ,1.5,10.2,Equatorial Guinea;GR,39.4,23.0,Greece;GS,-54.3,-36.7,South Georgia and the South Sandwich Islands;GT,15.6,-90.2,Guatemala;GU,13.4,144.8,Guam;GW,11.9,-15.1,Guinea-Bissau;GY,4.4,-58.8,Guyana;HK,22.5,114.1,Hong Kong;HM,-53.1,73.5,Heard Island and McDonald Islands;HN,14.6,-86.3,Honduras;HR,45.1,16.6,Croatia;HT,18.8,-72.7,Haiti;HU,47.3,19.4,Hungary;ID,-2.5,118.0,Indonesia;IE,53.5,-8.4,Ireland;IL,31.9,35.2,Israel;IM,54.2,-4.5,Isle of Man;IN,25.2,82.7,India;IO,-7.3,72.4,British Indian Ocean Territory;IQ,33.8,44.6,Iraq;IR,33.7,53.2,Iran;IS,65.3,-19.9,Iceland;IT,43.9,12.0,Italy;JE,49.2,-2.1,Jersey;JM,18.1,-77.3,Jamaica;JO,31.3,36.7,Jordan;JP,36.5,138.5,Japan;KE,0.7,37.5,Kenya;KG,41.1,73.3,Kyrgyzstan;KH,12.7,105.3,Cambodia;KI,1.9,-157.4,Kiribati;KM,-11.7,43.4,Comoros;KN,17.3,-62.7,Saint Kitts and Nevis;KP,40.4,127.4,North Korea;KR,36.1,127.4,South Korea;KW,29.3,47.7,Kuwait;KY,19.3,-81.3,Cayman Islands;KZ,48.6,66.1,Kazakhstan;LA,18.5,103.8,Laos;LB,33.9,36.0,Lebanon;LC,13.9,-61.0,Saint Lucia;LI,47.1,9.5,Liechtenstein;LK,8.3,80.6,Sri Lanka;LR,7.0,-9.1,Liberia;LS,-29.7,28.2,Lesotho;LT,55.1,24.3,Lithuania;LU,49.8,6.1,Luxembourg;LV,56.9,25.4,Latvia;LY,28.3,17.7,Libya;MA,28.6,-9.2,Morocco;MC,43.8,7.4,Monaco;MD,47.1,28.5,Moldova;ME,42.8,19.3,Montenegro;MF,18.1,-63.1,Saint Martin (French part);MG,-17.9,46.9,Madagascar;MH,7.1,171.2,Marshall Islands;MK,41.6,21.6,North Macedonia;ML,14.9,-5.5,Mali;MM,20.0,96.9,Myanmar;MN,48.2,103.0,Mongolia;MO,22.2,113.5,Macao;MP,15.2,145.8,Northern Mariana Islands;MQ,14.7,-61.0,Martinique;MR,19.8,-11.5,Mauritania;MS,16.7,-62.2,Montserrat;MT,35.9,14.5,Malta;MU,-20.3,57.5,Mauritius;MV,4.2,73.5,Maldives;MW,-12.8,34.0,Malawi;MX,24.3,-102.6,Mexico;MY,3.7,114.8,Malaysia;MZ,-17.3,35.4,Mozambique;NA,-21.9,18.2,Namibia;NC,-21.3,165.5,New Caledonia;NE,15.4,6.3,Niger;NF,-29.1,167.9,Norfolk Island;NG,8.7,7.8,Nigeria;NI,13.1,-84.8,Nicaragua;NL,51.8,5.6,The Netherlands;NO,61.5,9.5,Norway;NP,28.1,84.3,Nepal;NR,-0.5,166.9,Nauru;NU,-19.0,-169.9,Niue;NZ,-41.5,173.0,New Zealand;OM,21.1,55.8,Oman;PA,8.5,-80.2,Panama;PE,-7.4,-74.0,Peru;PF,-17.7,-149.4,French Polynesia;PG,-7.6,145.3,Papua New Guinea;PH,15.1,121.9,Philippines;PK,30.3,69.7,Pakistan;PL,51.4,19.1,Poland;PM,46.9,-56.3,Saint Pierre and Miquelon;PN,-24.4,-128.3,Pitcairn Islands;PR,18.2,-66.5,Puerto Rico;PS,31.9,35.2,Palestine;PT,40.0,-7.9,Portugal;PW,7.5,134.6,Palau;PY,-23.8,-57.6,Paraguay;QA,25.2,51.2,Qatar;RE,-21.1,55.5,Reunion;RO,45.9,24.5,Romania;RS,44.3,20.8,Serbia;RU,61.5,96.0,Russia;RW,-2.0,29.9,Rwanda;SA,23.6,45.6,Saudi Arabia;SB,-9.6,160.2,Solomon Islands;SC,-4.7,55.5,Seychelles;SD,14.0,30.1,Sudan;SE,62.6,17.1,Sweden;SG,1.4,103.9,Singapore;SH,-16.0,-5.7,Saint Helena;SI,46.1,14.8,Slovenia;SJ,78.0,16.0,Svalbard and Jan Mayen;SK,48.9,19.6,Slovakia;SL,8.6,-11.9,Sierra Leone;SM,43.9,12.5,San Marino;SN,14.0,-14.4,Senegal;SO,6.0,46.5,Somalia;SR,3.7,-56.1,Suriname;SS,7.9,30.3,South Sudan;ST,0.2,6.6,Sao Tome and Principe;SV,13.9,-88.8,El Salvador;SX,18.1,-63.1,Sint Maarten (Dutch part);SY,35.1,38.0,Syria;SZ,-26.5,31.6,Eswatini;TC,21.8,-71.7,Turks and Caicos Islands;TD,12.8,19.0,Chad;TF,-49.3,69.6,French Southern Territories;TG,8.7,0.7,Togo;TH,13.8,100.8,Thailand;TJ,38.9,70.8,Tajikistan;TK,-9.2,-171.8,Tokelau;TL,-8.9,125.8,Timor-Leste;TM,39.6,58.5,Turkmenistan;TN,34.2,9.8,Tunisia;TO,-21.1,-175.2,Tonga;TR,38.8,35.8,Turkey;TT,10.5,-61.3,Trinidad and Tobago;TV,-8.5,179.2,Tuvalu;TW,23.6,121.0,Taiwan;TZ,-6.6,34.4,Tanzania;UA,48.9,31.0,Ukraine;UG,1.4,32.1,Uganda;UM,19.3,166.6,United States Minor Outlying Islands;US,39.5,-98.5,United States;UY,-32.3,-56.0,Uruguay;UZ,41.4,65.8,Uzbekistan;VA,41.9,12.4,Vatican City;VC,13.2,-61.2,Saint Vincent and the Grenadines;VE,7.1,-66.1,Venezuela;VG,18.4,-64.6,Virgin Islands British;VI,17.8,-64.8,Virgin Islands U.S.;VN,16.6,106.1,Vietnam;VU,-15.1,166.9,Vanuatu;WF,-14.3,-178.1,Wallis and Futuna;WS,-13.6,-172.5,Samoa;XK,42.6,20.9,Kosovo;YE,16.1,47.1,Yemen;YT,-12.8,45.1,Mayotte;ZA,-28.3,24.4,South Africa;ZM,-12.5,28.8,Zambia;ZW,-19.2,29.6,Zimbabwe";
const VG = { open: false, data: null, at: 0, busy: false, err: "", places: null };
function vgPlaces() {
  if (VG.places) return VG.places;
  VG.places = {};
  for (const r of VG_PLACES.split(";")) { const p = r.split(","); VG.places[p[0]] = { lat: +p[1], lon: +p[2], name: p.slice(3).join(",") }; }
  return VG.places;
}
function vgName(c) { return c === "ZZ" ? "Unknown" : (vgPlaces()[c] || {}).name || c; }
function vgFlag(c) { return /^[A-Z]{2}$/.test(c) && c !== "ZZ" ? String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65, 0x1F1E6 + c.charCodeAt(1) - 65) : "🌐"; }
async function vgFetch(force) {
  if (VG.busy || (!force && VG.data && Date.now() - VG.at < 60000)) return;
  const sb = navigator.onLine === false ? null : viewsClient();
  if (!sb) { VG.err = "Can't reach the visitor server right now."; vgRender(); return; }
  VG.busy = true; VG.err = ""; vgRender();
  try {
    const rs = await Promise.all([sb.rpc("ln_country_views"), sb.rpc("ln_daily_views", { n: 30 }), sb.rpc("ln_hour_views"), sb.rpc("ln_device_views", { n: 30 }), sb.rpc("ln_my_country"), sb.rpc("ln_country_firsts")]);
    const bad = rs.find(r => r.error);
    if (bad) throw bad.error;
    const [cv, dv, hv, dev, me, fi] = rs.map(r => r.data);
    VG.data = { countries: (cv || []).map(r => ({ c: r.country, n: +r.views, last: r.last_seen })).sort((a, b) => b.n - a.n), daily: (dv || []).map(r => ({ d: r.day, n: +r.views })), hours: hv || [], devices: dev || [], me: me || "ZZ", firsts: fi || [] };
    VG.at = Date.now();
  } catch (e) { VG.err = "Couldn't load visitor origins: " + ((e && e.message) || e); }
  VG.busy = false;
  vgRender();
}
function vgOpen() {
  let w = $("vgWin");
  if (!w) {
    w = document.createElement("div");
    w.id = "vgWin";
    document.body.appendChild(w);
    w.addEventListener("click", e => { if (e.target === w || e.target.closest("[data-vgclose]")) vgClose(); else if (e.target.closest("[data-vgre]")) vgFetch(true); });
  }
  VG.open = true;
  w.classList.add("on");
  if (typeof sfx === "function") sfx("open");
  vgRender();
  vgFetch(false);
}
function vgClose() {
  VG.open = false;
  const w = $("vgWin");
  if (w) w.classList.remove("on");
  if (typeof sfx === "function") sfx("close");
}
function vgAgo(t) {
  const s = Math.max(0, (Date.now() - Date.parse(t)) / 1000);
  return s < 90 ? "just now" : s < 5400 ? Math.round(s / 60) + " min ago" : s < 129600 ? Math.round(s / 3600) + " h ago" : Math.round(s / 86400) + " days ago";
}
function vgRender() {
  const w = $("vgWin");
  if (!w || !VG.open) return;
  const D = VG.data, esc2 = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let h = '<div class="vgP" role="dialog" aria-label="Visitor origins"><div class="vgH"><span>Visitor Origins</span><button data-vgre title="Refresh">⟳</button><button data-vgclose title="Close">✕</button></div>';
  if (VG.err) h += '<div class="vgMsg">' + esc2(VG.err) + "</div>";
  if (!D) h += '<div class="vgMsg">' + (VG.busy ? "Scanning the realm…" : "No data yet.") + "</div>";
  else {
    const total = D.countries.reduce((a, r) => a + r.n, 0), known = D.countries.filter(r => r.c !== "ZZ"), max = Math.max(1, ...D.countries.map(r => r.n));
    const today = new Date().toISOString().slice(0, 10), td = (D.daily.find(r => r.d === today) || { n: 0 }).n;
    const devT = { mobile: 0, desktop: 0 }; for (const r of D.devices) devT[r.device] = (devT[r.device] || 0) + +r.views;
    const devAll = devT.mobile + devT.desktop;
    const tile = (k, v) => '<div class="vgT"><b>' + esc2(v) + "</b><span>" + k + "</span></div>";
    h += '<div class="vgTiles">' + tile("Visits", total.toLocaleString("en-US")) + tile("Countries", known.length) + tile("Today (UTC)", td) + tile("You", vgFlag(D.me) + " " + (D.me === "ZZ" ? "?" : D.me)) + "</div>";
    const days = [];
    for (let i = 13; i >= 0; i--) { const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10); days.push({ d, n: (D.daily.find(r => r.d === d) || { n: 0 }).n }); }
    const dm = Math.max(1, ...days.map(x => x.n));
    h += '<div class="vgSec">Last 14 days</div><div class="vgChart">' + days.map(x => '<i title="' + x.d + ": " + x.n + '" style="height:' + Math.max(3, Math.round(x.n / dm * 100)) + '%"></i>').join("") + "</div>";
    if (devAll) h += '<div class="vgSec">Devices, last 30 days</div><div class="vgDev"><i style="width:' + Math.round(devT.desktop / devAll * 100) + '%"></i></div><div class="vgDevL"><span>🖥 Desktop ' + Math.round(devT.desktop / devAll * 100) + '%</span><span>📱 Mobile ' + Math.round(devT.mobile / devAll * 100) + "%</span></div>";
    h += '<div class="vgSec">Countries</div><div class="vgList">' + (D.countries.length ? D.countries.map((r, i) => '<div class="vgRow' + (r.c === D.me ? " me" : "") + '"><em>' + (i + 1) + '</em><span class="f">' + vgFlag(r.c) + '</span><span class="n">' + esc2(vgName(r.c)) + '<small>' + vgAgo(r.last) + '</small></span><span class="b"><i style="width:' + Math.round(r.n / max * 100) + '%"></i></span><b>' + r.n.toLocaleString("en-US") + "</b></div>").join("") : '<div class="vgMsg">No visits recorded yet.</div>') + "</div>";
    h += '<div class="vgFoot">Country comes from the visitor’s network; "Unknown" means it couldn’t be told. Each player counts once per day.</div>';
  }
  w.innerHTML = h + "</div>";
}
window.addEventListener("keydown", e => { if (VG.open) { e.stopImmediatePropagation(); if (e.key === "Escape") vgClose(); } }, true);
