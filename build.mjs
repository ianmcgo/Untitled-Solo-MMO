import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const root = path.dirname(new URL(import.meta.url).pathname);
const phase = process.argv[2] || "2";
const src = f => fs.readFileSync(path.join(root, "src", f), "utf8");

const builds = {
  "1": { template: "template2d.html", files: ["gear.js", "data.js", "game.js", "hud.js", "view2d.js", "main.js"], three: false },
  "2": { template: "template3d.html", files: ["gear.js", "data.js", "game.js", "hud.js", "textures.js", "world3d.js", "view3d.js", "main.js"], three: true },
  "3": { template: "template3d.html", files: ["gear.js", "data.js", "game.js", "hud.js", "textures.js", "world3d.js", "rig.js", "anim.js", "effects3d.js", "models3d.js", "view3d.js", "main.js"], three: true },
  "4": { template: "template4.html", files: ["gear.js", "data.js", "game.js", "@audio", "@sql", "audio.js", "hud4.js", "icons.js", "menu4.js", "cache.js", "textures.js", "world3d.js", "rig.js", "anim.js", "effects3d.js", "models3d.js", "view3d.js", "net.js", "main4.js"], three: true, supa: true, min: true }
};

let AUDIO_JSON = null;
function audioData() {
  const dir = path.join(root, "audio", "out");
  const data = {}, loop = {};
  for (const f of fs.readdirSync(dir).sort()) {
    if (!f.endsWith(".mp3")) continue;
    const name = f.slice(0, -4);
    data[name] = fs.readFileSync(path.join(dir, f)).toString("base64");
    const wav = path.join(dir, name + ".wav");
    if ((name.startsWith("music_") || name.startsWith("amb_")) && fs.existsSync(wav)) {
      const b = fs.readFileSync(wav);
      const rate = b.readUInt32LE(24), bytesPerSec = b.readUInt32LE(28);
      let off = 12, size = 0;
      while (off < b.length - 8) { const id = b.toString("ascii", off, off + 4); const sz = b.readUInt32LE(off + 4); if (id === "data") { size = sz; break; } off += 8 + sz + (sz & 1); }
      loop[name] = Math.round(size / bytesPerSec * 10000) / 10000;
    }
  }
  AUDIO_JSON = JSON.stringify(data);
  return "const AUDIO_LOOP = " + JSON.stringify(loop) + ";";
}

const b = builds[phase];
const sqlData = () => "const SETUP_SQL = " + JSON.stringify(["setup.sql", "m5d-market.sql", "m5d-item-ref.sql", "q1-seats.sql"].map(f => fs.readFileSync(path.join(root, "sql", f), "utf8")).join("\n")) + ";";
const game = b.files.map(f => f === "@audio" ? audioData() : f === "@sql" ? sqlData() : src(f)).join("\n");
const shipped = b.min ? execFileSync(path.join(root, "node_modules", ".bin", "esbuild"), ["--minify", "--legal-comments=none", "--target=es2020"], { input: game, maxBuffer: 1 << 28 }).toString("utf8") : game;
fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(path.join(root, "dist", "game.js"), game);

let scripts = "";
if (b.three) {
  const out = path.join(root, "dist", "three.iife.js");
  execFileSync(path.join(root, "node_modules", ".bin", "esbuild"), [path.join(root, "src", "three-entry.js"), "--bundle", "--minify", "--format=iife", "--global-name=THREE", "--legal-comments=none", "--outfile=" + out], { stdio: "inherit" });
  scripts += "<script>" + fs.readFileSync(out, "utf8").replace(/<\/script/gi, "<\\/script") + "</script>\n";
}
if (b.supa) {
  const out = path.join(root, "dist", "supa.iife.js");
  execFileSync(path.join(root, "node_modules", ".bin", "esbuild"), [path.join(root, "src", "supa-entry.js"), "--bundle", "--minify", "--format=iife", "--global-name=SUPA", "--legal-comments=none", "--outfile=" + out], { stdio: "inherit" });
  scripts += '<script type="text/plain" id="supaSrc">' + fs.readFileSync(out, "utf8").replace(/<\/script/gi, "<\\/script") + "</script>\n";
}
if (AUDIO_JSON) scripts += '<script type="application/json" id="audioData">' + AUDIO_JSON + "</script>\n";
scripts += "<script>\n" + shipped.replace(/<\/script/gi, "<\\/script") + "\n</script>";
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const stamp = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "short" }).format(new Date()).replace(",", "");
const html = src(b.template).replace("<!--SCRIPTS-->", () => scripts).replaceAll("__VERSION__", "v" + pkg.version + " · built " + stamp).replaceAll("__PKGVER__", pkg.version);
fs.writeFileSync(path.join(root, "version.json"), JSON.stringify({ version: pkg.version, built: stamp, title: pkg.releaseTitle || "" }) + "\n");
fs.writeFileSync(path.join(root, "dist", "version.json"), JSON.stringify({ version: pkg.version, built: stamp, title: pkg.releaseTitle || "" }) + "\n");
const dest = path.join(root, "dist", "index.html");
fs.writeFileSync(dest, html);
if (String(phase) === "4") fs.writeFileSync(path.join(root, "index.html"), html);
console.log("phase", phase, "->", dest, (html.length / 1024).toFixed(0) + " KB");
