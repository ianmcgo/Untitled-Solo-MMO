import fs from "fs";
import path from "path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const src = path.join(root, "vendor/visitor-tracker/src");
const read = f => fs.readFileSync(path.join(src, f), "utf8");

const MAP = [
  ["127,249,255", "159,208,255"],
  ["185,253,255", "200,208,255"],
  ["230,250,255", "236,236,255"],
  ["220,250,255", "236,236,255"],
  ["218,112,214", "241,207,115"],
  ["181,21,181", "74,122,224"],
  ["138,43,226", "42,58,154"],
  ["210,90,255", "241,207,115"],
  ["160,60,220", "74,122,224"],
  ["176,60,240", "74,122,224"],
  ["233,166,255", "255,232,160"],
  ["93,255,143", "111,227,255"],
  ["109,255,179", "111,227,255"],
  ["4,10,20", "14,14,50"],
  ["3,3,10", "16,14,52"],
  ["5,5,15", "20,18,62"],
  ["2,2,8", "12,10,42"],
  ["6,6,26", "22,20,74"],
  ["10,6,32", "26,22,80"],
  ["10,15,42", "26,28,92"],
  ["13,18,54", "30,34,102"],
  ["7,20,51", "24,32,106"],
  ["15,47,63", "30,40,110"],
  ["218,170,255", "200,208,255"],
  ["232,182,240", "255,255,255"],
  ["255,107,157", "255,138,128"]
];
const hex = t => "#" + t.split(",").map(n => (+n).toString(16).padStart(2, "0")).join("");

function recolor(s) {
  for (const [a, b] of MAP) {
    const [r, g, bl] = a.split(",");
    s = s.replace(new RegExp("rgba?\\(\\s*" + r + "\\s*,\\s*" + g + "\\s*,\\s*" + bl + "\\s*([,)])", "g"), (m, end) => (m.startsWith("rgba") ? "rgba(" : "rgb(") + b + end);
    s = s.replace(new RegExp(hex(a), "gi"), hex(b));
  }
  return s;
}

const FONT = "var(--ffFont, Verdana, sans-serif)";
let css = recolor(read("visitor-tracker.css"))
  .replace(/'Twemoji Country Flags', 'Consolas', 'Lucida Console', 'Courier New', monospace/g, "'Twemoji Country Flags', " + FONT)
  .replace(/'Consolas', 'Lucida Console', 'Courier New', monospace/g, FONT);

css += `
#ldViews .vc-panel { position: static; min-width: 0; padding: 0; background: none; clip-path: none; filter: none; color: #fff; font-family: ${FONT}; z-index: auto; }
#ldViews .vc-panel.vc-btn:hover, #ldViews .vc-panel.vc-btn:focus-visible { filter: none; transform: none; }
#ldViews .vc-head { font: italic 800 11px ${FONT}; letter-spacing: .06em; color: #fff; text-shadow: 1px 1px 0 #000; justify-content: center; }
#ldViews .vc-label { color: #fff; }
#ldViews .vc-state { font: italic 700 9px ${FONT}; color: #c8d0ff; opacity: .85; letter-spacing: .08em; }
#ldViews .vc-num { margin-top: 2px; border-top: 1px solid rgba(236,236,255,.18); padding-top: 3px; font: italic 900 20px ${FONT}; letter-spacing: .08em; color: #fff; text-shadow: 1px 1px 0 #000, 0 0 8px rgba(120,170,255,.55); text-align: center; }
#ldViews .vc-foot { justify-content: center; font: italic 700 9px ${FONT}; color: #c8d0ff; letter-spacing: .08em; }
#ldViews .vc-open { color: #c8d0ff; }
.vg-overlay { background: linear-gradient(180deg, rgba(40,42,120,.97), rgba(18,18,62,.98)); font-style: italic; }
.vg-side { background: var(--ffStripe, rgba(34,32,96,.9)); border-left: 2px solid var(--ffEdge, rgba(236,236,255,.88)); }
.vg-title b, .vg-stat b { text-shadow: 1px 1px 0 #000, 0 0 8px rgba(120,170,255,.55); }
.vg-tab, .vg-toggles button, .vg-side button { border-radius: 4px; }
`;

const flag = read("flag-font.css");
const html = read("visitor-tracker.html");
const panel = html.slice(html.indexOf('<div id="vc-panel"'), html.indexOf('<div id="vg-overlay"')).trim()
  .replace("VISITOR LOG", "VISITORS").replace("▸ OPEN ORIGIN MAP", "▸ WHERE ARE THEY FROM?")
  .replace(/title="[^"]*"/, 'title="Visitors: how many times the game has been opened. Click to see where they come from on a globe."');
const overlay = recolor(html.slice(html.indexOf('<div id="vg-overlay"')).trim())
  .replace("TERRA · LONG-RANGE TRAFFIC SCAN", "WHERE ADVENTURERS COME FROM");
const js = recolor(read("visitor-tracker.js")).replace("count: vcTick,", "count: vcTick,\n        start: () => { if (!VT.started) { VT.started = true; vcStart(); } },");
if (!js.includes("start: () =>")) throw new Error("start hook not applied");

const boot = `(function () {
  const st = document.createElement("style");
  st.textContent = ${JSON.stringify(flag + "\n" + css)};
  document.head.appendChild(st);
  const box = document.getElementById("ldViews");
  if (box) box.innerHTML = ${JSON.stringify(panel)};
  document.body.insertAdjacentHTML("beforeend", ${JSON.stringify(overlay)});
  const MAPN = { bump_site_views: "leidanav_bump_views", get_site_views: "leidanav_get_views", get_country_views: "ln_country_views", get_country_firsts: "ln_country_firsts", my_country: "ln_my_country", get_daily_views: "ln_daily_views", get_country_daily: "ln_country_daily", get_hour_views: "ln_hour_views", bump_site_view_device: "ln_bump_device", get_device_views: "ln_device_views" };
  const day = d => d.toISOString().slice(0, 10);
  const dense = (name, args, rows) => {
    if (!Array.isArray(rows)) return rows;
    if (name === "get_daily_views") {
      const n = Math.max(1, Math.min(365, (args && args.n) || 30)), by = new Map(rows.map(r => [String(r.day).slice(0, 10), +r.views || 0])), out = [], now = new Date();
      for (let k = n - 1; k >= 0; k--) { const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - k)), key = day(d); out.push({ day: key, views: by.get(key) || 0 }); }
      return out;
    }
    if (name === "get_hour_views") { const by = new Map(rows.map(r => [+r.hour, +r.views || 0])), out = []; for (let h = 0; h < 24; h++) out.push({ hour: h, views: by.get(h) || 0 }); return out; }
    return rows;
  };
  const adapter = { rpc(name, args) { const sb = typeof viewsClient === "function" ? viewsClient() : null; if (!sb) return Promise.resolve({ data: null, error: new Error("offline") }); return Promise.resolve(sb.rpc(MAPN[name] || name, args)).then(r => r && !r.error ? Object.assign({}, r, { data: dense(name, args, r.data) }) : r); } };
  const SND = { vgopen: "open", vgnew: "select", vgmile: "coin" };
  window.VisitorTrackerConfig = {
    getClient: () => (navigator.onLine === false || typeof viewsClient !== "function" || !viewsClient()) ? null : adapter,
    storagePrefix: "leidanav",
    autoStart: false,
    onSound: k => { if (typeof sfx === "function" && SND[k]) sfx(SND[k]); },
    isActive: () => { const L = document.getElementById("loading"); return !!L && L.classList.contains("ready") && !L.classList.contains("zone") && !L.classList.contains("roster"); },
    brand: { line1: "LEID'ANAV", line2: "REBORN", tagline: "A FRONTIER TALE", url: "ianmcgo.github.io/Untitled-Solo-MMO", note: "Created by Ian McGonigal", file: "leidanav" }
  };
})();
`;

fs.writeFileSync(path.join(root, "src/vtrack.js"), boot + js);
console.log("vtrack.js", Math.round(fs.statSync(path.join(root, "src/vtrack.js")).size / 1024) + " KB");
