import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { createRequire } from "module";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const BUDGET = { sizeMB: 6.2, titleMs: 3500, iconsCacheMs: 2500, tabs: "see design/load-baseline.md" };
const args = process.argv.slice(2);
const noBrowser = args.includes("--no-browser");
const write = args.includes("--write");

execFileSync("node", [path.join(root, "build.mjs"), "4"], { cwd: root, stdio: "ignore" });
const file = path.join(root, "dist", "index.html");
const mb = fs.statSync(file).size / 1048576;
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const row = { version: pkg.version, mb: +mb.toFixed(2), title: null, icons: null };
const fails = [];
if (mb > BUDGET.sizeMB) fails.push("size " + mb.toFixed(2) + " MB is over " + BUDGET.sizeMB + " MB");

if (!noBrowser) {
  let chromium;
  try { chromium = createRequire(import.meta.url)("/opt/npm-tools/node_modules/playwright").chromium; } catch (e) { try { chromium = createRequire(import.meta.url)("playwright").chromium; } catch (e2) {} }
  if (!chromium) console.log("browser check skipped: playwright not found");
  else {
    const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(p => fs.existsSync(p));
    const b = await chromium.launch({ executablePath: exe, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
    const ctx = await b.newContext({ viewport: { width: 900, height: 560 } });
    await ctx.addInitScript(() => { try { localStorage.setItem("ashenreach_settings_v1", JSON.stringify({ quality: "low" })); } catch (e) {} });
    const run = async () => {
      const page = await ctx.newPage();
      await page.goto("file://" + file);
      await page.waitForFunction(() => typeof PERF !== "undefined" && PERF.boot.some(x => x[0].startsWith("icons")), null, { timeout: 90000 });
      await page.waitForTimeout(3000);
      const boot = await page.evaluate(() => PERF.boot);
      await page.close();
      return Object.fromEntries(boot.map(x => [x[0], x[1]]));
    };
    const first = await run();
    await new Promise(r => setTimeout(r, 1500));
    const second = await run();
    row.title = first.title;
    row.icons = second["icons (cache)"] != null ? second["icons (cache)"] : second.icons;
    row.cacheHit = second["icons (cache)"] != null;
    if (first.title > BUDGET.titleMs) fails.push("title screen at " + first.title + " ms is over " + BUDGET.titleMs + " ms");
    if (!row.cacheHit) fails.push("icon cache was not used on the second load");
    else if (row.icons > BUDGET.iconsCacheMs) fails.push("cached icons ready at " + row.icons + " ms is over " + BUDGET.iconsCacheMs + " ms");
    await b.close();
  }
}

console.log(JSON.stringify(row));
if (write) {
  const f = path.join(root, "design", "load-baseline.md");
  let t = fs.readFileSync(f, "utf8");
  const head = "## Release history (tools/release-check.mjs --write)\n| Version | Size MB | Title ms | Cached icons ms |\n|---|---|---|---|\n";
  if (!t.includes("## Release history")) t += "\n" + head;
  const line = "| " + row.version + " | " + row.mb + " | " + (row.title ?? "n/a") + " | " + (row.icons ?? "n/a") + " |\n";
  const lines = t.split("\n").filter(l => !l.startsWith("| " + row.version + " |"));
  t = lines.join("\n").replace(/\n*$/, "\n") + line;
  fs.writeFileSync(f, t);
}
if (fails.length) { console.log("FAIL\n" + fails.join("\n")); process.exit(1); }
console.log("OK");
