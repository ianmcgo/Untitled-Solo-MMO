const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const REGIONS = ["skin", "face", "cloth", "leather", "metal", "hair", "trim", "fur", "bone", "scale", "feather", "wood", "glow", "plain", "chain", "quilt", "face2", "face3", "face4", "face5", "face6", "face7", "face8", "face9", "face10", "face11", "face12", "face13", "face14", "face15", "face16", "face17", "face18", "face19", "face20", "face21", "face22", "face23", "face24", "face25", "face26", "face27", "face28", "face29", "face30", "face31", "face32"];
const ATLAS_COLS = 8, ATLAS_ROWS = 6;
const FACE_PAINTS = 8, FACE_COUNT = 8;
const FACE_NAMES = ["Bright", "Calm", "Keen", "Freckled", "Gentle", "Fierce", "Sleepy", "Proud"];
const ATLAS_SIZE = 1024;
let ATLAS_CELL = 256, ATLAS_W = 2048, ATLAS_H = 1024;
const RIG = { segK: 1, atlas: null, cache: new Map(), weaponCache: new Map(), glowMat: null, weaponMat: null, hook: null };

const SKIN_TONES = [0xf3d2b8, 0xe8b894, 0xc98d64, 0x6b4128];
const HAIR_STYLES = ["short", "spiky", "long", "ponytail", "bob", "bun", "bald", "braid", "mohawk", "twintails", "topknot", "wavy", "pixie", "sidepart", "dreads", "curly"];
const HAIR_BY_SEX = [["short", "sidepart", "spiky", "curly", "long", "ponytail", "dreads", "bald", "mohawk", "topknot", "braid", "pixie"], ["long", "wavy", "ponytail", "bob", "bun", "pixie", "curly", "short", "sidepart", "braid", "twintails", "dreads", "topknot"]];
const HAIR_STYLE_NAMES = { short: "Short", spiky: "Spiky", long: "Long", ponytail: "Ponytail", bob: "Bob", bun: "Bun", bald: "Shaved" , braid: "Braid", mohawk: "Crest", twintails: "Twin tails", topknot: "Topknot", wavy: "Wavy", pixie: "Pixie", sidepart: "Side part", dreads: "Locs", curly: "Curly" };
const HAIR_COLORS = [0x2a1d14, 0x5a3a22, 0x8a5a2c, 0xd8b070, 0xb03a2e, 0x1d1d22, 0xe0e0f0, 0x3a5a8a];


function paintFace(g, ox, oy, v, fem) {
  v = v || 0;
  g.save();
  g.translate(ox, oy);
  g.scale(ATLAS_CELL / 256, ATLAS_CELL / 256);
  const IRIS = [[70, 120, 190], [110, 80, 52], [64, 140, 96], [150, 100, 50], [120, 90, 170], [168, 60, 48], [90, 110, 130], [176, 132, 40]][v];
  const EYE = [[9.8, 11.4, 6.6, 0, 0, 1], [10, 9.2, 6, -0.5, 0.12, 0.92], [10.4, 7.8, 5.4, -2.6, 0.08, 0.86], [9.6, 11.2, 6.8, 0, 0, 1], [10, 10, 6.6, 1.9, 0.06, 0.98], [10.4, 7.2, 5, -3, 0.18, 0.8], [10.2, 8.2, 6, 0.7, 0.42, 0.9], [10.2, 9.6, 6, -1.7, 0.1, 0.92]][v];
  const BROW = [[0, 0.2], [0.3, 0], [-0.9, 0.5], [0, 0.2], [1.1, -0.3], [-2.4, 1.2], [0.6, -0.2], [-0.6, 1.4]][v];
  g.translate(64, 120); g.scale(1, 1.7);
  const ex = 0, ey = 0, sp = 15.5;
  const rgba = (c, a) => "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  const soft = (x, y, rx, ry, col, a) => { g.fillStyle = rgba(col, a * 0.55); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = rgba(col, a * 0.45); g.beginPath(); g.ellipse(x, y, rx * 0.55, ry * 0.55, 0, 0, Math.PI * 2); g.fill(); };
  g.lineCap = "round"; g.lineJoin = "round";
  {
    g.fillStyle = "rgba(150,92,84,0.13)"; g.beginPath(); g.ellipse(0, 31, 36, 13, 0, 0, Math.PI); g.fill();
    g.fillStyle = "rgba(150,92,84,0.1)"; g.beginPath(); g.moveTo(2, 4); g.lineTo(6, 12); g.lineTo(3, 15); g.lineTo(0.5, 13); g.closePath(); g.fill();
    g.fillStyle = "rgba(255,244,232,0.14)"; g.beginPath(); g.ellipse(0, -22, 16, 5, 0, 0, Math.PI * 2); g.fill();
  }
  for (const s of [-1, 1]) {
    const x = ex + s * sp, rx = EYE[0] * (fem ? 1.05 : 1), up = EYE[1] * (fem ? 1.08 : 1), dn = EYE[2], tilt = EYE[3], drop = EYE[4], isz = EYE[5];
    const inner = x - s * rx, outer = x + s * rx, oy2 = ey + tilt * 0.5, iy2 = ey + 1.2;
    const top = t => ey - up + drop * up * 1.4;
    const shape = () => {
      g.beginPath();
      g.moveTo(inner, iy2);
      g.bezierCurveTo(inner + s * rx * 0.15, top() - 1.5, outer - s * rx * 0.55, top() - 1.2 + tilt * 0.6, outer, oy2 - 1);
      g.bezierCurveTo(outer - s * rx * 0.1, ey + dn * 0.9, inner + s * rx * 0.35, ey + dn * 1.15, inner, iy2);
    };
    soft(x, ey - 1, rx + 4, up + 3, [120, 70, 70], 0.1);
    g.save();
    shape(); g.fillStyle = "rgb(250,248,246)"; g.fill(); g.clip();
    const ix = x + s * 0.4, iy = ey + 0.4 + drop * up * 0.5, irx = 6.4 * isz * (fem ? 1.04 : 1), iry = 10.2 * isz * (fem ? 1.06 : 1);
    g.save(); g.translate(ix, iy); g.scale(irx, iry);
    const ig = g.createLinearGradient(0, -1, 0, 1);
    const c1 = rgba(IRIS.map(c => c * 0.3 | 0), 1), c2 = rgba(IRIS.map(c => c * 0.7 | 0), 1), c3 = rgba(IRIS, 1), c4 = rgba(IRIS.map(c => Math.min(255, c + 70)), 1); ig.addColorStop(0, c1); ig.addColorStop(0.3, c1); ig.addColorStop(0.31, c2); ig.addColorStop(0.62, c2); ig.addColorStop(0.63, c3); ig.addColorStop(0.86, c3); ig.addColorStop(0.87, c4); ig.addColorStop(1, c4);
    g.fillStyle = ig; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill();
    g.strokeStyle = rgba(IRIS.map(c => c * 0.25 | 0), 1); g.lineWidth = 0.14; g.stroke();
    g.fillStyle = "rgb(14,10,14)"; g.beginPath(); g.ellipse(0, -0.05, 0.42, 0.5, 0, 0, Math.PI * 2); g.fill();
    g.restore();
    g.fillStyle = "rgba(60,40,60,0.28)"; g.beginPath(); g.ellipse(x, top() + 1.5, rx * 1.1, 3.6, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(255,255,255,0.97)"; g.beginPath(); g.ellipse(ix - s * 1.6, iy - iry * 0.42, 1.9, 2.5, -0.3 * s, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(255,255,255,0.8)"; g.beginPath(); g.arc(ix + s * 1.8, iy + iry * 0.38, 0.95, 0, Math.PI * 2); g.fill();
    g.restore();
    g.strokeStyle = "rgb(22,14,16)";
    g.lineWidth = fem ? 3.6 : 3;
    g.beginPath(); g.moveTo(inner + s * 0.4, iy2 - 0.4); g.bezierCurveTo(inner + s * rx * 0.15, top() - 1.5, outer - s * rx * 0.55, top() - 1.2 + tilt * 0.6, outer + s * (fem ? 1.6 : 0.8), oy2 - 1.6 - (fem ? 0.8 : 0)); g.stroke();
    if (fem) { g.lineWidth = 1.1; for (let k = 0; k < 3; k++) { const bx = outer - s * k * 2.2, by = oy2 - 1.8 - k * 1.2 + (k ? -1 : 0); g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + s * 1.8, by - 1.2, bx + s * 2.6, by - 2.6); g.stroke(); } }
    g.strokeStyle = "rgba(60,30,34,0.7)"; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(outer - s * 0.6, oy2 + 0.5); g.quadraticCurveTo(x + s * rx * 0.3, ey + dn * 1.1, x - s * rx * 0.1, ey + dn * 1.05); g.stroke();
    g.strokeStyle = "rgba(96,50,52,0.6)"; g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(inner + s * 1.2, top() - 3.2); g.quadraticCurveTo(x, top() - 4.8 + tilt * 0.3, outer - s * 1.4, top() - 3 + tilt * 0.5); g.stroke();
    const by = ey - up - 5.5 + BROW[1], bw = fem ? 1.1 : 1.7;
    g.fillStyle = "rgba(48,30,24,0.9)";
    g.beginPath();
    g.moveTo(x - s * 6.5, by + 1 - BROW[0] * 0.6);
    g.quadraticCurveTo(x, by - 2.2 - BROW[0] * 0.2, x + s * 8.5, by + 1.2 + BROW[0] * 0.4);
    g.quadraticCurveTo(x, by - 2.2 + bw - BROW[0] * 0.2, x - s * 6.5, by + 1 + bw * 0.6 - BROW[0] * 0.6);
    g.fill();
    soft(x + s * 3, ey + dn + 5, 6.5, 3, [240, 110, 120], fem ? 0.32 : 0.12);
  }
  soft(ex, ey + 11, 1.2, 3, [255, 240, 230], 0.25);
  g.fillStyle = "rgba(150,80,72,0.55)";
  g.beginPath(); g.moveTo(ex + 0.6, ey + 13); g.quadraticCurveTo(ex + 1.7, ey + 15.2, ex - 0.7, ey + 15.6); g.quadraticCurveTo(ex + 0.6, ey + 14.8, ex + 0.6, ey + 13); g.fill();
  const mw = [4.4, 3.8, 3.6, 4.6, 5, 3.6, 3.6, 4.2][v] * (fem ? 0.9 : 1), my = ey + 26, smile = [1.4, 0.4, 0.2, 1.6, 2.2, -0.6, 0.3, 1][v];
  if (fem) soft(ex, my + 0.6, mw + 1, 1.8, [230, 110, 110], 0.42);
  g.strokeStyle = "rgb(110,46,46)"; g.lineWidth = 1.05;
  g.beginPath(); g.moveTo(ex - mw, my - smile * 0.5); g.quadraticCurveTo(ex, my + smile, ex + mw, my - smile * 0.5); g.stroke();
  soft(ex, my + 4, 3, 1.4, [120, 60, 50], 0.12);
  if (v === 3) { g.fillStyle = "rgba(170,100,70,0.5)"; const rr = seeded(33); for (let k = 0; k < 18; k++) { const sx = rr() < 0.5 ? -1 : 1; g.beginPath(); g.arc(ex + sx * (8 + rr() * 14), ey + 8 + rr() * 5, 0.5 + rr() * 0.4, 0, Math.PI * 2); g.fill(); } }
  g.restore();
}

function paintFaceUrsan(g, ox, oy, v) {
  g.save();
  g.translate(ox, oy);
  g.scale(ATLAS_CELL / 256, ATLAS_CELL / 256);
  const IRIS = [[205, 160, 40], [120, 165, 60], [196, 86, 40], [214, 204, 74], [124, 84, 40], [222, 192, 104], [70, 150, 130], [224, 124, 44]][v];
  const BROWA = [2.6, 3.4, 1.8, 3, 2.2, 3.8, 2.8, 1.4][v], MW = [8, 9, 7.4, 8.6, 7.8, 9.4, 8.2, 7][v], MD = [1.6, 2.2, 1, 2, 1.4, 2.6, 1.8, 0.8][v];
  g.translate(64, 120); g.scale(1, 1.7);
  g.lineCap = "round"; g.lineJoin = "round";
  const rgba = (c, a) => "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  const soft = (x, y, rx, ry, col, a) => { g.save(); g.translate(x, y); g.scale(rx, ry); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill(); g.restore(); };
  const rr = seeded(71 + v);
  for (let k = 0; k < 90; k++) { const x = (rr() - 0.5) * 70, y = (rr() - 0.5) * 50 + 8; g.fillStyle = "rgba(40,60,36," + (0.08 + rr() * 0.1) + ")"; g.beginPath(); g.arc(x, y, 0.5 + rr() * 0.8, 0, Math.PI * 2); g.fill(); }
  soft(-24, 16, 9, 5, [60, 80, 52], 0.22); soft(24, 16, 9, 5, [60, 80, 52], 0.22);
  soft(0, 2, 12, 9, [40, 56, 36], 0.16);
  for (const s of [-1, 1]) {
    const x = s * 16, rx = 8.2, up = 4.6, dn = 3.4;
    soft(x, -3, rx + 6, up + 5, [36, 48, 32], 0.3);
    g.save();
    g.beginPath(); g.moveTo(x - s * rx, 0.8); g.bezierCurveTo(x - s * rx * 0.3, -up - 1, x + s * rx * 0.5, -up, x + s * rx, 0.6); g.bezierCurveTo(x + s * rx * 0.4, dn, x - s * rx * 0.4, dn + 0.6, x - s * rx, 0.8);
    g.fillStyle = "rgb(236,226,186)"; g.fill(); g.clip();
    g.fillStyle = rgba(IRIS, 1); g.beginPath(); g.ellipse(x + s * 0.6, 0, 4.6, 5.6, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = rgba(IRIS.map(c => c * 0.45 | 0), 1); g.beginPath(); g.ellipse(x + s * 0.6, -1.2, 4.6, 2.4, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgb(10,8,8)"; g.beginPath(); g.ellipse(x + s * 0.6, 0.2, 1.2, 3.4, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(255,255,255,0.9)"; g.beginPath(); g.arc(x - s * 0.8, -1.8, 0.9, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(30,40,28,0.55)"; g.beginPath(); g.ellipse(x, -up + 0.6, rx * 1.1, 2.6, 0, 0, Math.PI * 2); g.fill();
    g.restore();
    g.strokeStyle = "rgb(28,38,26)"; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(x - s * rx, 0.8); g.bezierCurveTo(x - s * rx * 0.3, -up - 1, x + s * rx * 0.5, -up, x + s * rx + s * 0.8, 0.4); g.stroke();
    g.strokeStyle = "rgba(30,44,28,0.7)"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x - s * rx * 0.8, 1.2); g.quadraticCurveTo(x, dn + 1, x + s * rx * 0.9, 0.9); g.stroke();
    const by = -up - 7;
    g.fillStyle = "rgba(34,46,30,0.96)";
    g.beginPath(); g.moveTo(x - s * 8.5, by + BROWA + 1.4); g.quadraticCurveTo(x, by - 1.2, x + s * 12, by - 0.6); g.lineTo(x + s * 12, by + 3); g.quadraticCurveTo(x, by + 3.2, x - s * 8.5, by + BROWA + 4.4); g.fill();
    soft(x, by + 4, rx + 3, 2.4, [30, 42, 26], 0.4);
  }
  g.fillStyle = "rgba(24,34,22,0.8)";
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 3.4, 12.4, 1.5, 1.1, s * 0.4, 0, Math.PI * 2); g.fill(); }
  soft(0, 9, 3, 6, [160, 180, 140], 0.14);
  g.strokeStyle = "rgb(26,34,24)"; g.lineWidth = 1.8;
  const my = 26;
  g.beginPath(); g.moveTo(-MW, my + MD * 0.8); g.quadraticCurveTo(-MW * 0.4, my - 0.4, 0, my - 0.2); g.quadraticCurveTo(MW * 0.4, my - 0.4, MW, my + MD * 0.8); g.stroke();
  soft(0, my + 3.4, MW * 0.8, 1.8, [34, 46, 30], 0.3);
  g.strokeStyle = "rgba(34,46,30,0.45)"; g.lineWidth = 1;
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 7, 14); g.quadraticCurveTo(s * 11, 20, s * (MW + 1), my + 1); g.stroke(); }
  if (v === 3 || v === 6) { g.strokeStyle = "rgba(190,205,170,0.7)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-26, -8); g.lineTo(-16, 10); g.stroke(); }
  g.restore();
}

function paintFacePipkin(g, ox, oy, v) {
  g.save();
  g.translate(ox, oy);
  g.scale(ATLAS_CELL / 256, ATLAS_CELL / 256);
  const IRIS = [[74, 44, 30], [38, 30, 30], [62, 102, 160], [60, 130, 90], [136, 92, 42], [112, 74, 150], [156, 104, 44], [92, 102, 112]][v];
  const SMILE = [1.8, 2.5, 1, 2.9, 1.4, 2.2, 0.6, 2][v], BLUSH = [0.34, 0.4, 0.28, 0.46, 0.32, 0.38, 0.26, 0.42][v], TILT = [0, 0.8, -0.6, 1.2, 0, 0.5, -1, 0.3][v];
  g.translate(64, 120); g.scale(1, 1.7);
  g.lineCap = "round"; g.lineJoin = "round";
  const rgba = (c, a) => "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  const soft = (x, y, rx, ry, col, a) => { g.save(); g.translate(x, y); g.scale(rx, ry); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill(); g.restore(); };
  for (const s of [-1, 1]) {
    const x = s * 19, y = 3 + s * TILT * 0.3;
    soft(x, y + 1, 12, 10, [150, 90, 70], 0.1);
    g.fillStyle = "rgb(252,248,244)"; g.beginPath(); g.ellipse(x, y, 7.2, 7, 0, 0, Math.PI * 2); g.fill();
    g.save(); g.beginPath(); g.ellipse(x, y, 7.2, 7, 0, 0, Math.PI * 2); g.clip();
    const ig = g.createLinearGradient(0, y - 9, 0, y + 9);
    ig.addColorStop(0, rgba(IRIS.map(c => c * 0.45 | 0), 1)); ig.addColorStop(0.55, rgba(IRIS, 1)); ig.addColorStop(1, rgba(IRIS.map(c => Math.min(255, c + 60)), 1));
    g.fillStyle = ig; g.beginPath(); g.ellipse(x + s * 0.3, y + 0.5, 6.9, 7.2, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgb(16,10,10)"; g.beginPath(); g.ellipse(x + s * 0.3, y + 0.5, 3.3, 3.6, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(255,255,255,0.98)"; g.beginPath(); g.ellipse(x - s * 2.1, y - 2.8, 2.3, 2.5, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(255,255,255,0.8)"; g.beginPath(); g.arc(x + s * 2.5, y + 3.3, 1.1, 0, Math.PI * 2); g.fill();
    g.restore();
    g.strokeStyle = "rgba(70,36,28,0.85)"; g.lineWidth = 1.5;
    g.beginPath(); g.ellipse(x, y, 7.2, 7, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    g.strokeStyle = "rgba(110,60,50,0.4)"; g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(x - 8, y - 12.6 - s * TILT * 0.4); g.quadraticCurveTo(x, y - 15.4, x + 8, y - 12.4 + s * TILT * 0.4); g.stroke();
    soft(x + s * 6, y + 16, 9, 5, [244, 120, 120], BLUSH);
  }
  g.save(); g.translate(0, 13.5); g.scale(1, 0.62);
  g.fillStyle = "rgb(112,66,44)"; g.beginPath(); g.arc(0, 0, 5.2, 0, Math.PI * 2); g.fill();
  const bg = g.createRadialGradient(-1.6, -1.8, 0.3, 0, 0, 5.2); bg.addColorStop(0, "rgba(176,116,80,1)"); bg.addColorStop(1, "rgba(112,66,44,0)"); g.fillStyle = bg; g.beginPath(); g.arc(0, 0, 5.2, 0, Math.PI * 2); g.fill();
  g.fillStyle = "rgba(255,230,210,0.75)"; g.beginPath(); g.ellipse(-1.8, -2, 1.4, 1, -0.4, 0, Math.PI * 2); g.fill();
  g.restore();
  g.strokeStyle = "rgb(140,64,64)"; g.lineWidth = 1.3;
  const my = 25;
  g.beginPath(); g.moveTo(-3.8, my - SMILE * 0.45); g.quadraticCurveTo(0, my + SMILE, 3.8, my - SMILE * 0.45); g.stroke();
  soft(0, my + 1.4, 3.4, 1.6, [236, 120, 120], 0.3);
  g.restore();
}

function paintFaceFor(race, g, ox, oy, v, fem) {
  if (race === "ursan") paintFaceUrsan(g, ox, oy, v % 8);
  else if (race === "pipkin") paintFacePipkin(g, ox, oy, v % 8);
  else paintFace(g, ox, oy, v, fem);
}

const PST = (x, n) => Math.floor(clamp(x, 0, 0.9999) * n) / (n - 1);
const CLASSIC_PAINT = {
  skin(u, v, o) { const n = NOISE.fbm(u * 3, v * 3, 2, 3, 11); o[0] = 0.84 + 0.05 * PST(n, 3); o[1] = 0; o[2] = 0.9; o[3] = 0; },
  face(u, v, o) { o[0] = 0.86; o[1] = 0; o[2] = 0.9; o[3] = 0; },
  cloth(u, v, o, X) {
    const ev = Math.min(v, 1 - v), w = NOISE.fbm(u * 3, v * 2, 2, 3, 23);
    const f = Math.sin((u * 5 + w * 0.35) * Math.PI * 2), crease = f < -0.93 ? 1 : 0, hi = f > 0.82 ? 1 : 0;
    let a = 0.7 + 0.2 * PST(f * 0.5 + 0.5, 3) - crease * 0.24 + hi * 0.06;
    if (ev < 0.06) a = 0.66 + 0.06 * PST(f * 0.5 + 0.5, 2);
    if (ev >= 0.06 && ev < 0.072) a = 0.42;
    if (ev > 0.085 && ev < 0.095 && (X % 8) < 4.5) a = 0.5;
    o[0] = a; o[1] = 0; o[2] = 0.95; o[3] = 0;
  },
  leather(u, v, o, X) {
    const ev = Math.min(v, 1 - v), n = NOISE.fbm(u * 4, v * 4, 2, 4, 31), sc = NOISE.value(u * 12, v * 30, 12, 37);
    let a = 0.7 + 0.1 * PST(n, 3) + (sc > 0.8 ? 0.07 : 0);
    if (ev < 0.05) a = 0.88;
    else if (ev < 0.062) a = 0.4;
    else if (ev > 0.075 && ev < 0.086 && (X % 9) < 5) a = 0.46;
    o[0] = a; o[1] = 0; o[2] = 0.7; o[3] = 0;
  },
  metal(u, v, o) {
    const ev = Math.min(v, 1 - v);
    const g = 0.5 + 0.5 * Math.cos((v * 1.6 - 0.45) * Math.PI * 2);
    let a = 0.58 + 0.34 * PST(g, 4);
    const sv = v - 0.3 - 0.02 * Math.sin(u * Math.PI * 12);
    if (Math.abs(sv) < 0.018) a = 1;
    if (Math.abs(v - 0.74) < 0.012) a = 0.46;
    if (ev < 0.045) a = 0.97;
    else if (ev < 0.056) a = 0.4;
    if (ev < 0.045) { const d = Math.hypot(((u * 16) % 1) - 0.5, (ev - 0.022) * 16); if (d < 0.26) a = d < 0.14 ? 1 : 0.42; }
    o[0] = a; o[1] = 0; o[2] = 0.3; o[3] = 0.95;
  },
  hair(u, v, o) {
    const c = u * 11 + 0.35 * NOISE.fbm(u * 4, v * 2, 2, 4, 51), fc = c - Math.floor(c);
    let a = 0.66 + 0.2 * PST(1 - fc, 3);
    if (fc < 0.07) a = 0.42;
    const sv = v - 0.3 - 0.025 * Math.sin(u * Math.PI * 22) - 0.03 * (fc - 0.5);
    if (Math.abs(sv) < 0.026 && fc > 0.1) a = 0.96;
    if (v < 0.06) a *= 0.85;
    o[0] = a; o[1] = 0; o[2] = 0.8; o[3] = 0;
  },
  trim(u, v, o) {
    const fu = (u * 6) % 1, d = Math.abs(fu - 0.5) + Math.abs(v - 0.5) * 1.2;
    const band = v < 0.11 || v > 0.89, on = d < 0.22 || band;
    let a = on ? (d < 0.12 && !band ? 1 : 0.9) : 0.6;
    if ((d >= 0.22 && d < 0.27) || (v >= 0.11 && v < 0.14) || (v > 0.86 && v <= 0.89)) a = 0.36;
    o[0] = a; o[1] = 0; o[2] = 0.5; o[3] = on ? 0.65 : 0;
  },
  fur(u, v, o) {
    const rows = 9, ry = v * rows, row = Math.floor(ry), fy = ry - row;
    const t = (u * 13 + (row % 2) * 0.5) % 1, sh = Math.abs(t - 0.5) * 2;
    const inT = fy > sh * 0.85;
    let a = inT ? 0.62 + 0.3 * PST(fy, 3) : 0.7;
    if (Math.abs(fy - sh * 0.85) < 0.06) a = 0.42;
    o[0] = a; o[1] = 0; o[2] = 0.95; o[3] = 0;
  },
  bone(u, v, o) { const n = NOISE.fbm(u * 4, v * 4, 2, 4, 71), cr = NOISE.ridge(u * 5, v * 5, 3, 5, 73); o[0] = cr > 0.94 ? 0.42 : 0.82 + 0.1 * PST(n, 3); o[1] = 0; o[2] = 0.8; o[3] = 0; },
  scale(u, v, o) {
    const rows = 12, cols = 10, ry = v * rows, row = Math.floor(ry), off = row % 2 ? 0.5 : 0;
    const cx = u * cols + off, col = Math.floor(cx), d = Math.min(1, Math.hypot(cx - col - 0.5, (ry - row - 0.15) * 1.1) * 1.6);
    o[0] = d > 0.82 ? 0.38 : d > 0.55 ? 0.72 : d > 0.25 ? 0.86 : 1; o[1] = 0; o[2] = 0.6; o[3] = 0.05;
  },
  feather(u, v, o) {
    const ax = Math.abs(u - 0.5), b = ((ax * 2.2 + v * 1.4) * 14) % 1;
    let a = 0.68 + 0.24 * PST(b, 3) - v * 0.1;
    if (b < 0.08) a = 0.42;
    if (ax < 0.018) a = 1; else if (ax < 0.03) a = 0.42;
    o[0] = a; o[1] = 0; o[2] = 0.9; o[3] = 0;
  },
  wood(u, v, o) {
    const g = Math.sin((u * 5 + 0.6 * NOISE.fbm(u * 2, v * 6, 2, 2, 81)) * Math.PI * 2);
    let a = 0.62 + 0.24 * PST(g * 0.5 + 0.5, 3);
    if (Math.abs(g) < 0.05 && NOISE.value(u * 8, v * 8, 8, 83) > 0.5) a = 0.44;
    o[0] = a; o[1] = 0; o[2] = 0.9; o[3] = 0;
  },
  glow(u, v, o) { o[0] = 1; o[1] = 0; o[2] = 1; o[3] = 0; },
  plain(u, v, o) { o[0] = 0.96; o[1] = 0; o[2] = 0.6; o[3] = 0; },
  chain(u, v, o, x, y) {
    const cs = 10, row = Math.floor(y / cs), ox = row % 2 ? cs / 2 : 0;
    const gx = ((x + ox) % cs) - cs / 2, gy = (y % cs) - cs / 2, dr = Math.abs(Math.hypot(gx, gy * 1.2) - 3.3);
    o[0] = dr < 0.7 ? (gy < 0 ? 1 : 0.86) : dr < 1.4 ? 0.62 : 0.34; o[1] = 0; o[2] = 0.4; o[3] = dr < 1.4 ? 0.9 : 0;
  },
  quilt(u, v, o) {
    const a1 = (u * 8 + v * 8) % 1, a2 = (u * 8 - v * 8 + 8) % 1, e = Math.min(a1, 1 - a1, a2, 1 - a2);
    o[0] = e < 0.05 ? 0.44 : 0.68 + 0.24 * PST(e * 2, 3); o[1] = 0; o[2] = 0.95; o[3] = 0;
  }
};

function buildAtlas() {
  const PAINT = CLASSIC_PAINT;
  RIG.segK = { high: 0.55, medium: 0.45, low: 0.38 }[typeof W3 !== "undefined" && W3.quality] || 0.45;
  ATLAS_CELL = 256;
  RIG.shellLayers = typeof W3 !== "undefined" && W3.quality === "high" ? 5 : 0; RIG.shellMat = null;
  ATLAS_W = ATLAS_CELL * ATLAS_COLS; ATLAS_H = ATLAS_CELL * ATLAS_ROWS;
  const N = ATLAS_W, NH = ATLAS_H, PK = ATLAS_CELL / 256;
  const alb = new Float32Array(N * NH), hgt = new Float32Array(N * NH), rgh = new Float32Array(N * NH), mtl = new Float32Array(N * NH);
  const o = [0, 0, 0, 0];
  const done = {};
  REGIONS.forEach((name, i) => {
    const ox = (i % ATLAS_COLS) * ATLAS_CELL, oy = Math.floor(i / ATLAS_COLS) * ATLAS_CELL;
    const base = PAINT[name] ? name : name.replace(/\d+$/, ""), fn = PAINT[base];
    if (done[base] && base !== name) {
      const [sx, sy] = done[base];
      for (let y = 0; y < ATLAS_CELL; y++) { const a = (sy + y) * N + sx, b = (oy + y) * N + ox; alb.copyWithin(b, a, a + ATLAS_CELL); hgt.copyWithin(b, a, a + ATLAS_CELL); rgh.copyWithin(b, a, a + ATLAS_CELL); mtl.copyWithin(b, a, a + ATLAS_CELL); }
      return;
    }
    done[base] = [ox, oy];
    for (let y = 0; y < ATLAS_CELL; y++) for (let x = 0; x < ATLAS_CELL; x++) {
      fn(x / ATLAS_CELL, y / ATLAS_CELL, o, name === "chain" ? (x / PK) | 0 : x / PK, name === "chain" ? (y / PK) | 0 : y / PK);
      const k = (oy + y) * N + ox + x;
      alb[k] = o[0]; hgt[k] = o[1]; rgh[k] = o[2]; mtl[k] = o[3];
    }
  });
  const ca = makeCanvas(N, NH), ga = ca.getContext("2d"), ia = ga.createImageData(N, NH);
  const cm = makeCanvas(N, NH), gm = cm.getContext("2d"), im = gm.createImageData(N, NH);
  for (let y = 0; y < NH; y++) for (let x = 0; x < N; x++) {
    const k = y * N + x, p = k * 4;
    const a = clamp(alb[k], 0, 1) * 255;
    ia.data[p] = a; ia.data[p + 1] = a; ia.data[p + 2] = a; ia.data[p + 3] = 255;
    const rn = REGIONS[Math.floor(y / ATLAS_CELL) * ATLAS_COLS + Math.floor(x / ATLAS_CELL)] || "";
    im.data[p] = rn === "skin" || rn.startsWith("face") ? 40 : 255; im.data[p + 1] = clamp(rgh[k], 0.05, 1) * 255; im.data[p + 2] = clamp(mtl[k], 0, 1) * 255; im.data[p + 3] = 255;
  }
  ga.putImageData(ia, 0, 0);
  for (let f = 0; f < FACE_PAINTS * 2; f++) { const i = REGIONS.indexOf(f ? "face" + (f + 1) : "face"); paintFace(ga, (i % ATLAS_COLS) * ATLAS_CELL, Math.floor(i / ATLAS_COLS) * ATLAS_CELL, f % FACE_PAINTS, f >= FACE_PAINTS); }
  for (let f = 0; f < 16; f++) { const i = REGIONS.indexOf("face" + (17 + f)); paintFaceFor(f < 8 ? "ursan" : "pipkin", ga, (i % ATLAS_COLS) * ATLAS_CELL, Math.floor(i / ATLAS_COLS) * ATLAS_CELL, f % 8, false); }
  gm.putImageData(im, 0, 0);
  const mk = (c, srgb) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = TEXLIB.anisotropy; t.needsUpdate = true; return t; };
  RIG.atlas = { map: mk(ca, true), mr: mk(cm, false) };
  RIG.atlas.map.magFilter = THREE.NearestFilter; RIG.atlas.map.needsUpdate = true;
  RIG.glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, side: THREE.DoubleSide });
  RIG.weaponMat = charMaterial();
}

const SHELL_REGIONS = { fur: 1, feather: 0.6, hair: 0.45 };
function shellMaterial() {
  if (RIG.shellMat) return RIG.shellMat;
  const m = new THREE.MeshLambertMaterial({ map: RIG.atlas.map, vertexColors: true, side: THREE.DoubleSide });
  m.onBeforeCompile = sh => {
    sh.vertexShader = "attribute float shell;\nvarying float vShell;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvShell = shell;");
    sh.fragmentShader = "varying float vShell;\n" + sh.fragmentShader.replace("#include <map_fragment>", "#include <map_fragment>\n{ vec2 q = floor(vMapUv * 1800.0); float h = fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453); if (h < 0.08 + vShell * 0.86) discard; diffuseColor.rgb *= 0.72 + 0.4 * vShell; }");
  };
  m.customProgramCacheKey = () => "furShellC";
  RIG.shellMat = m;
  return m;
}

const CLASSIC = { lift: { value: 0.24 }, metal: { value: 0.32 } };
function outlineOn() {
  const st = typeof VIEW !== "undefined" && VIEW.settings ? VIEW.settings.outline : null;
  if (st === true || st === false) return st;
  return !(W3 && W3.quality === "low");
}
function classicCharMaterial() {
  const m = new THREE.MeshLambertMaterial({ map: RIG.atlas.map, vertexColors: true, side: THREE.DoubleSide, envMapIntensity: 1.0 });
  m.onBeforeCompile = sh => {
    sh.uniforms.clLift = CLASSIC.lift; sh.uniforms.clMetal = CLASSIC.metal; sh.uniforms.clMR = { value: RIG.atlas.mr };
    sh.fragmentShader = "uniform float clLift;\nuniform float clMetal;\nuniform sampler2D clMR;\n" + sh.fragmentShader.replace("#include <opaque_fragment>", "{ float dl = max(dot(diffuseColor.rgb, vec3(0.3333)), 0.04); float ll = dot(outgoingLight, vec3(0.3333)); float r = ll / dl; float qn = floor(r * 3.0 + 0.5) / 3.0; vec4 mrs = texture2D(clMR, vMapUv); float rr = mix(r, qn, mrs.r > 0.5 ? 0.5 : 0.0); outgoingLight *= rr / max(r, 0.001); outgoingLight = max(outgoingLight, diffuseColor.rgb * clLift); float mt = mrs.b; vec3 nn = normalize(normal); float sp = pow(max(dot(nn, normalize(vec3(-0.35, 0.65, 0.68))), 0.0), 14.0); outgoingLight += diffuseColor.rgb * mt * sp * clMetal * 2.0; }\n#include <opaque_fragment>");
  };
  m.customProgramCacheKey = () => "classicChar";
  return m;
}
let OUTLINE_MAT = null;
function outlineMaterial() {
  if (OUTLINE_MAT) return OUTLINE_MAT;
  const m = new THREE.MeshBasicMaterial({ color: 0x140c1c, side: THREE.BackSide });
  m.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace("#include <skinning_vertex>", "#include <skinning_vertex>\n{ float od = length((modelViewMatrix * vec4(transformed, 1.0)).xyz); transformed += normalize(objectNormal) * (0.004 + od * 0.0009); }");
  };
  m.customProgramCacheKey = () => "classicOutline";
  OUTLINE_MAT = m;
  return m;
}

function charMaterial() { return classicCharMaterial(); }

function regionUV(geo, region) {
  const idx = Math.max(0, REGIONS.indexOf(region));
  const cx = idx % ATLAS_COLS, cy = Math.floor(idx / ATLAS_COLS);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    const u = 0.03 + clamp(uv.getX(i), 0, 1) * 0.94, v = 0.03 + clamp(uv.getY(i), 0, 1) * 0.94;
    uv.setXY(i, (cx + u) / ATLAS_COLS, 1 - (cy + 1 - v) / ATLAS_ROWS);
  }
}

class RigBuilder {
  constructor() { this.defs = []; this.byName = {}; this.pieces = []; this.glow = []; this.meta = {}; }
  bone(name, parent, x, y, z) {
    const pd = parent ? this.byName[parent] : null;
    const d = { name, parent: pd ? pd.index : null, world: V3(x, y, z), local: pd ? [x - pd.world.x, y - pd.world.y, z - pd.world.z] : [x, y, z], index: this.defs.length };
    this.defs.push(d);
    this.byName[name] = d;
    return d;
  }
  add(geo, bone, color, region, glow) {
    let g = geo.index ? geo.toNonIndexed() : geo;
    for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    regionUV(g, glow ? "glow" : (region || "plain"));
    const n = g.attributes.position.count;
    const c = new THREE.Color(color);
    const col = new Float32Array(n * 3), si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    const bi = this.byName[bone] ? this.byName[bone].index : 0;
    for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; si[i * 4] = bi; sw[i * 4] = 1; }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setAttribute("skinIndex", new THREE.BufferAttribute(si, 4));
    g.setAttribute("skinWeight", new THREE.BufferAttribute(sw, 4));
    g.clearGroups();
    g.userData.rig = { bone: bi, color, region: glow ? "glow" : (region || "plain"), glow: !!glow };
    (glow ? this.glow : this.pieces).push(g);
  }
  addW(geo, bone, color, region, wfn) {
    this.add(geo, bone, color, region);
    const g = this.pieces[this.pieces.length - 1], pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
    for (let i = 0; i < pos.count; i++) {
      const ws = wfn(pos.getX(i), pos.getY(i), pos.getZ(i));
      let a = ws[0], b = ws[1] || [ws[0][0], 0];
      const ia = this.byName[a[0]] ? this.byName[a[0]].index : 0, ib = this.byName[b[0]] ? this.byName[b[0]].index : ia;
      const t = a[1] + b[1] || 1;
      si.setXY(i, ia, ib); sw.setXY(i, a[1] / t, b[1] / t);
    }
    g.userData.rig.pre = true;
  }
  partPoints() {
    const by = this.defs.map(() => []);
    for (const g of this.pieces) {
      const info = g.userData.rig;
      if (!info) continue;
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) by[info.bone].push([pos.getX(i), pos.getY(i), pos.getZ(i), g]);
    }
    return by;
  }
  bridgeGaps() {
    if (this.noBridge) return;
    const by = this.partPoints();
    let lo = Infinity, hi = -Infinity;
    for (const L of by) for (const p of L) { if (p[1] < lo) lo = p[1]; if (p[1] > hi) hi = p[1]; }
    const H = Math.max(0.15, hi - lo), tol = 0.012 * H;
    const skip = new Set(["lids", "saddle", "hairTail", "hairTail2", "mouth", "jaw", "cape2", "cape3", "tabF", "tabB"].concat(this.noBridgeBones || []));
    for (const d of this.defs) {
      if (d.parent == null || skip.has(d.name)) continue;
      let pi = d.parent;
      while (pi != null && !by[pi].length) pi = this.defs[pi].parent;
      const A = by[d.index];
      if (pi == null || !A.length) continue;
      const B = by[pi];
      const cell = tol * 4, grid = new Map(), key = (x, y, z) => x + "," + y + "," + z;
      for (const q of B) { const k = key(Math.floor(q[0] / cell), Math.floor(q[1] / cell), Math.floor(q[2] / cell)); let L = grid.get(k); if (!L) grid.set(k, L = []); L.push(q); }
      let near = false;
      for (const p of A) {
        const cx = Math.floor(p[0] / cell), cy = Math.floor(p[1] / cell), cz = Math.floor(p[2] / cell);
        for (let dx = -1; dx <= 1 && !near; dx++) for (let dy = -1; dy <= 1 && !near; dy++) for (let dz = -1; dz <= 1 && !near; dz++) {
          const L = grid.get(key(cx + dx, cy + dy, cz + dz));
          if (L) for (const q of L) if ((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2 < tol * tol) { near = true; break; }
        }
        if (near) break;
      }
      if (near) continue;
      const J = d.world;
      let pa = null, pb = null, da = Infinity, db = Infinity;
      for (const p of A) { const dd = (p[0] - J.x) ** 2 + (p[1] - J.y) ** 2 + (p[2] - J.z) ** 2; if (dd < da) { da = dd; pa = p; } }
      for (const q of B) { const dd = (q[0] - J.x) ** 2 + (q[1] - J.y) ** 2 + (q[2] - J.z) ** 2; if (dd < db) { db = dd; pb = q; } }
      if (Math.sqrt(da) + Math.sqrt(db) > 0.45 * H) continue;
      const ext = new THREE.Box3();
      for (const p of A) ext.expandByPoint(new THREE.Vector3(p[0], p[1], p[2]));
      const sz = ext.getSize(new THREE.Vector3());
      const thick = Math.min(sz.x, sz.y, sz.z) || 0.02;
      const r = clamp(thick * 0.32, 0.006 * H, 0.04 * H);
      const va = V3(pa[0], pa[1], pa[2]), vb = V3(pb[0], pb[1], pb[2]);
      const ia = pa[3].userData.rig, ib = pb[3].userData.rig;
      const regA = ia.region === "glow" ? "plain" : ia.region, regB = ib.region === "glow" ? "plain" : ib.region;
      this.add(gBall(J.clone(), r * 1.25, 1, 1, 1, 10), d.name, ia.color, regA);
      if (va.distanceTo(J) > r) this.add(gTaper(J.clone(), va.clone().add(va.clone().sub(J).setLength(r)), r, r * 0.9, 8), d.name, ia.color, regA);
      if (vb.distanceTo(J) > r) this.add(gTaper(vb.clone().add(vb.clone().sub(J).setLength(r)), J.clone(), r * 0.95, r, 8), this.defs[pi].name, ib.color, regB);
      this.bridges = (this.bridges || 0) + 1;
    }
  }
  findIslands() {
    let lo = Infinity, hi = -Infinity;
    for (const g of this.pieces) { const pos = g.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y < lo) lo = y; if (y > hi) hi = y; } }
    const H = Math.max(0.15, hi - lo), tol = 0.015 * H, cell = tol * 2;
    const key = (x, y, z) => x + "," + y + "," + z;
    const grid = new Map();
    this.pieces.forEach((g, gi) => {
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) { const k = key(Math.floor(pos.getX(i) / cell), Math.floor(pos.getY(i) / cell), Math.floor(pos.getZ(i) / cell)); let L = grid.get(k); if (!L) grid.set(k, L = new Set()); L.add(gi); }
    });
    const parent = this.pieces.map((_, i) => i);
    const find = i => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    for (const [k, L] of grid) {
      const [x, y, z] = k.split(",").map(Number);
      const here = [...L];
      for (let dx = 0; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
        const M = grid.get(key(x + dx, y + dy, z + dz));
        if (M) for (const b of M) for (const a of here) { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; }
      }
    }
    const sizes = new Map();
    this.pieces.forEach((g, i) => { const r = find(i); sizes.set(r, (sizes.get(r) || 0) + g.attributes.position.count); });
    let main = -1, best = -1;
    for (const [r, n] of sizes) if (n > best) { best = n; main = r; }
    const out = [];
    this.pieces.forEach((g, i) => { if (find(i) !== main) out.push(this.defs[g.userData.rig.bone].name + "#" + i); });
    this._comp = { find, main, H, tol };
    return out;
  }
  attachIslands() {
    for (let pass = 0; pass < 4; pass++) {
      const isl = this.findIslands();
      if (!isl.length) return;
      const { find, main, H, tol } = this._comp;
      const comps = new Map();
      this.pieces.forEach((g, i) => { const r = find(i); if (r === main) return; if (!comps.has(r)) comps.set(r, []); comps.get(r).push(g); });
      const M = [];
      this.pieces.forEach((g, i) => { if (find(i) !== main) return; const pos = g.attributes.position, st = Math.max(1, Math.floor(pos.count / 1500)); for (let k = 0; k < pos.count; k += st) M.push(pos.getX(k), pos.getY(k), pos.getZ(k)); });
      let moved = 0;
      for (const gs of comps.values()) {
        let best = Infinity, bp = null, bq = null;
        for (const g of gs) {
          const pos = g.attributes.position;
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
            for (let j = 0; j < M.length; j += 3) { const d = (x - M[j]) ** 2 + (y - M[j + 1]) ** 2 + (z - M[j + 2]) ** 2; if (d < best) { best = d; bp = [x, y, z]; bq = [M[j], M[j + 1], M[j + 2]]; } }
          }
        }
        const dist = Math.sqrt(best);
        if (!bp || dist > 0.25 * H) continue;
        let gy = Infinity;
        for (const g of gs) { g.computeBoundingBox(); gy = Math.min(gy, g.boundingBox.min.y); }
        if (gy < 0.03 * H) {
          const info = gs[0].userData.rig, r = clamp(tol * 1.6, 0.004 * H, 0.03 * H);
          const a = V3(...bp), b = V3(...bq);
          this.add(gTaper(a.clone().add(a.clone().sub(b).setLength(r)), b.clone().add(b.clone().sub(a).setLength(r)), r, r, 6), this.defs[info.bone].name, info.color, info.region === "glow" ? "plain" : info.region);
          moved++;
          continue;
        }
        const k = (dist + tol * 0.6) / Math.max(dist, 1e-6);
        const dx = (bq[0] - bp[0]) * k, dy = (bq[1] - bp[1]) * k, dz = (bq[2] - bp[2]) * k;
        for (const g of gs) g.translate(dx, dy, dz);
        moved++;
      }
      if (!moved) return;
    }
  }
  smoothJoints() {
    const J = { foreArm: [0.06, 0.5, 0.1], hand: [0.04, 0.5, 0.08], shin: [0.07, 0.5, 0.12], foot: [0.04, 0.45, 0.1], upArm: [0.07, 0.4, 0.11], thigh: [0.07, 0.4, 0.16], chest: [0.08, 0.45, 0.32], spine: [0.08, 0.5, 0.32], neck: [0.04, 0.4, 0.12], head: [0.045, 0.4, 0.14], tail: [0.06, 0.5, 0.1], cape: [0.06, 0.5, 0.3] };
    const rigid = new Set(["lids", "saddle", "mouth", "jaw", "cape2", "cape3", "tabF", "tabB", "hairTail2"].concat(this.rigidBones || []));
    const kidsAll = this.defs.map(() => []);
    this.defs.forEach(d => { if (d.parent != null) kidsAll[d.parent].push(d.index); });
    const info = this.defs.map(d => {
      if (d.parent == null || rigid.has(d.name)) return null;
      const P = this.defs[d.parent].world;
      const k0 = kidsAll[d.index][0];
      const axis = (k0 != null ? this.defs[k0].world.clone().sub(d.world) : d.world.clone().sub(P));
      if (axis.lengthSq() < 1e-8) axis.set(0, 1, 0);
      axis.normalize();
      const key = d.name.replace(/[LR]$/, "");
      const j = J[key], sc = this.jointScale || 1;
      if (j) return { r: j[0] * sc, m: j[1], lat: j[2] * sc, at: d.world, axis, parent: d.parent };
      const seg = d.world.distanceTo(P);
      const r = clamp(seg * 0.35, 0.025, 0.1) * sc;
      return { r, m: 0.5, lat: r * 2.2, at: d.world, axis, parent: d.parent };
    });
    const kids = this.defs.map(() => []);
    info.forEach((j, i) => { if (j) kids[j.parent].push(i); });
    const v = new THREE.Vector3(), t = new THREE.Vector3();
    const wOf = j => {
      t.copy(v).sub(j.at);
      const ax = t.dot(j.axis);
      const lat = Math.sqrt(Math.max(0, t.lengthSq() - ax * ax));
      if (lat > j.lat || Math.abs(ax) > j.r) return 0;
      return j.m * (1 - Math.abs(ax) / j.r) * (lat > j.lat * 0.7 ? (j.lat - lat) / (j.lat * 0.3) : 1);
    };
    for (const g of this.pieces) {
      if (g.userData.rig && g.userData.rig.pre) continue;
      const pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
      for (let i = 0; i < pos.count; i++) {
        const b = si.getX(i);
        v.fromBufferAttribute(pos, i);
        let other = -1, w = 0;
        const own = info[b];
        if (own) { const wo = wOf(own); if (wo > 0) { other = own.parent; w = wo; } }
        for (const k of kids[b]) { const wk = wOf(info[k]); if (wk > w) { other = k; w = wk; } }
        if (other < 0 || w <= 0.001) continue;
        si.setXY(i, b, other);
        sw.setXY(i, 1 - w, w);
      }
    }
  }
  bakeShade() {
    if (this.noBake) return;
    let lo = Infinity, hi = -Infinity;
    for (const g of this.pieces) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < lo) lo = y; if (y > hi) hi = y; } }
    const H = Math.max(0.1, hi - lo);
    for (const g of this.pieces) {
      const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color, w = g.attributes.skinWeight;
      if (!n) continue;
      for (let i = 0; i < p.count; i++) {
        const ny = n.getY(i), h = (p.getY(i) - lo) / H;
        let k = 0.87 + 0.18 * (0.5 + 0.5 * ny);
        k *= 0.86 + 0.14 * Math.min(1, h / 0.18);
        const bw = w.getY(i);
        if (bw > 0.05) k *= 1 - 0.12 * Math.min(1, bw * 2);
        c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k);
      }
    }
  }
  buildShells(minY) {
    const layers = RIG.shellLayers || 0;
    if (!layers || this.noShell) return null;
    const src = this.pieces.filter(g => SHELL_REGIONS[g.userData.rig.region]);
    if (!src.length) return null;
    let hi = -Infinity;
    for (const g of this.pieces) { const pos = g.attributes.position; for (let i = 0; i < pos.count; i++) hi = Math.max(hi, pos.getY(i)); }
    const len = clamp((hi - minY) * 0.022, 0.006, 0.03) * (this.shellK || 1);
    const out = [];
    for (let k = 1; k <= layers; k++) for (const g of src) {
      const c = g.clone(), pos = c.attributes.position, nor = c.attributes.normal, f = k / layers, d = len * f * SHELL_REGIONS[g.userData.rig.region];
      for (let i = 0; i < pos.count; i++) pos.setXYZ(i, pos.getX(i) + nor.getX(i) * d, pos.getY(i) + nor.getY(i) * d - d * 0.35 * f, pos.getZ(i) + nor.getZ(i) * d);
      c.setAttribute("shell", new THREE.BufferAttribute(new Float32Array(pos.count).fill(f), 1));
      out.push(c);
    }
    const geo = THREE.mergeGeometries(out);
    for (const c of out) c.dispose();
    geo.computeBoundingSphere(); geo.boundingSphere.radius *= 1.6;
    return geo;
  }
  finish() {
    if (RIG.hook) { const h = RIG.hook; RIG.hook = null; h(this); }
    this.attachIslands();
    if (this.defs.length > 1) { this.bridgeGaps(); this.smoothJoints(); }
    this.bakeShade();
    if (typeof window !== "undefined" && window.RIG_CHECK) this.meta.islands = this.findIslands();
    const main = this.pieces.length ? THREE.mergeGeometries(this.pieces) : null;
    const glow = this.glow.length ? THREE.mergeGeometries(this.glow) : null;
    let geo;
    if (main && glow) geo = THREE.mergeGeometries([main, glow], true);
    else { geo = main || glow; geo.clearGroups(); geo.addGroup(0, geo.attributes.position.count, main ? 0 : 1); }
    geo.computeBoundingSphere();
    geo.boundingSphere.radius *= 1.6;
    let minY = Infinity;
    const pa = (main || geo).attributes.position;
    for (let i = 0; i < pa.count; i++) if (pa.getY(i) < minY) minY = pa.getY(i);
    this.meta.minY = minY;
    const shell = this.buildShells(minY);
    for (const g of this.pieces.concat(this.glow)) g.dispose();
    return { geo, shell, defs: this.defs.map(d => ({ name: d.name, parent: d.parent, local: d.local })), meta: this.meta };
  }
}

function sgK(n, d) { return Math.max(3, Math.round((n || d) * RIG.segK)); }
function orientBetween(g, a, b) {
  const d = new THREE.Vector3().subVectors(b, a);
  const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.clone().normalize());
  g.applyQuaternion(q);
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
}
function gTaper(a, b, ra, rb, seg, flat) {
  const g = new THREE.CylinderGeometry(rb, ra, Math.max(0.001, a.distanceTo(b)), sgK(seg, 10), 1);
  if (flat) g.scale(flat, 1, 1);
  return orientBetween(g, a, b);
}
function gBall(p, r, sx, sy, sz, seg) {
  const s = sgK(seg, 12);
  const g = new THREE.SphereGeometry(r, s, Math.max(4, Math.round(s * 0.7)));
  g.scale(sx || 1, sy || 1, sz || 1);
  g.translate(p.x, p.y, p.z);
  return g;
}
function gPartSphere(p, r, gap, thetaLen, sx, sy, sz, seg, thetaStart) {
  const g = new THREE.SphereGeometry(r, sgK(seg, 16), sgK(10, 10), Math.PI / 2 + gap / 2, Math.PI * 2 - gap, thetaStart || 0, thetaLen);
  g.scale(sx || 1, sy || 1, sz || 1);
  g.translate(p.x, p.y, p.z);
  return g;
}
function gFront(p, r, width, t0, t1, sx, sy, sz, seg) {
  const g = new THREE.SphereGeometry(r, sgK(seg, 12), sgK(8, 8), Math.PI / 2 - width / 2, width, t0, t1 - t0);
  g.scale(sx || 1, sy || 1, sz || 1);
  g.translate(p.x, p.y, p.z);
  return g;
}
function gLathe(prof, sx, sz, seg) {
  const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(Math.max(0.002, r), y)), sgK(seg, 18));
  g.scale(sx, 1, sz);
  return g;
}
function gBox(p, w, h, d, rx, ry, rz) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (rx || ry || rz) g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)));
  g.translate(p.x, p.y, p.z);
  return g;
}
function gCyl(p, rt, rb, h, seg, open, t0, tl) {
  const g = new THREE.CylinderGeometry(rt, rb, h, sgK(seg, 14), 1, !!open, t0 || 0, tl || Math.PI * 2);
  g.translate(p.x, p.y, p.z);
  return g;
}
function gRing(p, R, r, axis, seg, arc, rot) {
  const g = new THREE.TorusGeometry(R, r, sgK(6, 6), sgK(seg, 20), arc || Math.PI * 2);
  if (axis === "y") g.rotateX(Math.PI / 2);
  if (axis === "x") g.rotateY(Math.PI / 2);
  if (rot) g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2])));
  g.translate(p.x, p.y, p.z);
  return g;
}
function gMembrane(ptsXZ, y) {
  const sh = new THREE.Shape();
  ptsXZ.forEach(([x, z], i) => i ? sh.lineTo(x, -z) : sh.moveTo(x, -z));
  const g = new THREE.ShapeGeometry(sh);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  const uv = g.attributes.uv;
  const b = new THREE.Box2(); for (const [x, z] of ptsXZ) b.expandByPoint(new THREE.Vector2(x, -z));
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - b.min.x) / (b.max.x - b.min.x + 1e-6), (uv.getY(i) - b.min.y) / (b.max.y - b.min.y + 1e-6));
  return g;
}

const HEAD_PROFILES = {
  human0: { jaw: 0.34, chin: 0.1, brow: 0.05, sock: 0.05, cheek: 0.04, nose: 0.2, lips: 1, long: 0.1 },
  human1: { jaw: 0.38, chin: 0.06, brow: 0.02, sock: 0.045, cheek: 0.05, nose: 0.15, lips: 1.3, long: 0.03 },
  elari: { jaw: 0.4, chin: 0.1, brow: 0.03, sock: 0.05, cheek: 0.06, nose: 0.17, lips: 1, long: 0.15 },
  pipkin: { jaw: 0.64, chin: 0, brow: 0.01, sock: 0.03, cheek: 0.14, nose: 0.1, lips: 0.8, long: -0.11 },
  ursan: { jaw: 0.24, chin: 0.1, brow: 0.16, sock: 0.07, cheek: 0.04, nose: 0.14, noseW: 1.7, lips: 0.2, long: 0, muzzle: 0 },
  nekari: { jaw: 0.38, chin: 0.06, brow: 0.02, sock: 0.045, cheek: 0.08, nose: 0.1, lips: 0.9, long: 0.08, muzzle: 0.05 },
  goblin: { jaw: 0.16, chin: 0.09, brow: 0.13, sock: 0.1, cheek: 0.08, nose: 0, lips: 0.7, long: 0, muzzle: 0.06 },
  orc: { jaw: -0.06, chin: 0.15, brow: 0.15, sock: 0.08, cheek: 0.05, nose: 0.12, noseW: 1.9, lips: 1.6, long: 0.05, muzzle: 0.1 },
  skull: { jaw: 0.3, chin: 0.07, brow: 0.08, sock: 0.2, cheek: 0.08, nose: -0.11, lips: 0, long: 0.05 },
  ghoul: { jaw: 0.34, chin: 0.08, brow: 0.1, sock: 0.13, cheek: 0.09, nose: 0.08, lips: 0.4, long: 0.1 },
  fish: { jaw: 0.02, chin: 0.02, brow: 0.03, sock: 0.03, cheek: 0, nose: 0.03, noseW: 1.6, lips: 1.8, long: 0.12, muzzle: 0.12 },
  beast: { jaw: 0.2, chin: 0.06, brow: 0.1, sock: 0.08, cheek: 0.05, nose: 0.13, lips: 0.7, long: 0.04 },
  plain: { jaw: 0.18, chin: 0.04, brow: 0.04, sock: 0, cheek: 0.03, nose: 0, lips: 0, long: 0.02 }
};
const FACE_PX = { eyeA: 15.5 / 256 * Math.PI * 2, eyeB: 120 / 256 * Math.PI - Math.PI / 2 };

function headProfile(L) {
  let k = L.headShape;
  if (!k) {
    if (L.skull) k = "skull";
    else if (L.nose === "goblin") k = "goblin";
    else if (L.tusks) k = "orc";
    else if (L.ears === "fin") k = "fish";
    else if (L.beak || L.leafHead || L.needles) k = "plain";
    else if (L.claws && L.noFace) k = "ghoul";
    else if (L.noFace) k = "beast";
    else if (L.doll) k = "pipkin";
    else if (L.ears === "ursan") k = "ursan";
    else if (L.ears === "cat") k = "nekari";
    else if (L.ears === "elf") k = "elari";
    else k = L.build === 1 ? "human1" : "human0";
  }
  const P = Object.assign({}, HEAD_PROFILES[k] || HEAD_PROFILES.human0);
  if (L.build === 1 && !/human|skull|plain/.test(k)) { P.brow *= 0.5; P.jaw += 0.04; P.nose *= 0.85; P.lips *= 1.2; }
  if (!L.noFace && /human|elari|pipkin|nekari/.test(k)) { P.nose *= 0.3; P.sock *= 0.2; P.brow *= 0.3; P.lips *= 0.25; P.cheek *= 0.4; P.anime = true; }
  P.key = k;
  return P;
}

function smoothRange(a, b, t) { const k = clamp((t - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); }
function headRadial(P, x, y, z, feat) {
  const lower = smoothRange(0.05, -0.8, y);
  const a = Math.atan2(x, z), b = -Math.asin(clamp(y, -1, 1));
  const G = (a0, b0, sa, sb) => Math.exp(-(((a - a0) / sa) ** 2) - (((b - b0) / sb) ** 2));
  let m = 1;
  m *= 1 - P.jaw * lower * x * x * 0.9;
  m *= 1 + (0.05 + P.long) * lower * Math.max(0, -y);
  m *= 1 + P.chin * Math.exp(-(((y + 0.82) / 0.28) ** 2)) * Math.max(0, z) ** 2;
  m *= 1 - 0.18 * smoothRange(-0.3, -0.95, y) * Math.max(0, -z);
  m *= 1 + 0.035 * Math.max(0, -z) * smoothRange(-0.3, 0.3, y);
  m *= 1 - 0.05 * Math.exp(-(((y - 0.3) / 0.3) ** 2)) * x * x;
  m *= 1 - 0.05 * Math.max(0, z) ** 4 * smoothRange(-0.7, -0.2, y) * (1 - smoothRange(0.2, 0.5, y));
  if (P.muzzle) m *= 1 + P.muzzle * G(0, 0.3, 0.42, 0.26);
  const jl = -0.58 - 0.3 * Math.max(0, z) + 0.06 * Math.max(0, -z);
  const under = smoothRange(jl + 0.05, jl - 0.3 - 0.12 * Math.max(0, -z), y);
  if (under > 0) {
    const nr = P.neckR || 0.42, hz = Math.hypot(x, z) * m;
    if (hz > nr) m += (m * nr / hz - m) * under;
  }
  if (!feat || Math.abs(a) > 1.5) return m;
  const aa = Math.abs(a), ea = FACE_PX.eyeA, eb = FACE_PX.eyeB;
  let f = 0;
  f += P.brow * (Math.exp(-(((aa - ea) / 0.22) ** 2) - (((b - eb + 0.14) / 0.06) ** 2)) + 0.6 * G(0, eb - 0.12, 0.11, 0.07));
  f -= P.sock * Math.exp(-(((aa - ea) / 0.15) ** 2) - (((b - eb) / 0.1) ** 2));
  f += P.cheek * Math.exp(-(((aa - 0.52) / 0.2) ** 2) - (((b - 0.1) / 0.12) ** 2));
  if (P.nose) {
    const nw = P.noseW || 1;
    const nb = smoothRange(eb - 0.06, 0.17, b) * (1 - smoothRange(0.17, 0.25, b));
    const w = (0.05 + 0.05 * smoothRange(-0.1, 0.18, b)) * nw;
    f += P.nose * nb * Math.exp(-((a / w) ** 2));
    if (P.nose > 0) f += P.nose * 0.32 * Math.exp(-(((aa - 0.085 * nw) / 0.05) ** 2) - (((b - 0.2) / 0.045) ** 2));
  }
  if (P.lips) {
    f += 0.026 * P.lips * G(0, 0.405, 0.17 * Math.min(1.5, P.lips), 0.035);
    f += 0.032 * P.lips * G(0, 0.47, 0.14 * Math.min(1.5, P.lips), 0.04);
    f -= 0.014 * P.lips * G(0, 0.437, 0.16 * Math.min(1.5, P.lips), 0.016);
    f -= 0.015 * G(0, 0.56, 0.12, 0.04);
  }
  if (P.chin > 0) f += 0.03 * G(0, 0.7, 0.15, 0.09);
  return m * (1 + f);
}

function densityMap(n, d0, d1, dens) {
  const N = 600, cum = [0];
  for (let i = 1; i <= N; i++) { const t = d0 + (d1 - d0) * (i - 0.5) / N; cum.push(cum[i - 1] + dens(t)); }
  const out = [];
  for (let k = 0; k <= n; k++) {
    const target = cum[N] * k / n;
    let i = 1; while (i < N && cum[i] < target) i++;
    const f = (target - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]);
    out.push(d0 + (d1 - d0) * (i - 1 + f) / N);
  }
  return out;
}

const HEAD_SCALE = [0.87, 1.04, 1.0];
function headUV(phi, th) { return [(phi / (Math.PI * 2) - 0.03) / 0.94, (1 - th / Math.PI - 0.03) / 0.94]; }
function gHeadPatch(P, hc, hr, phis, ths, off, feat) {
  const nu = phis.length - 1, nv = ths.length - 1;
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const phi = phis[i], th = ths[j];
    const x = -Math.cos(phi) * Math.sin(th), y = Math.cos(th), z = Math.sin(phi) * Math.sin(th);
    const r = headRadial(P, x, y, z, feat) + (off || 0);
    pos.push(x * r * hr * HEAD_SCALE[0], hc + y * r * hr * HEAD_SCALE[1], 0.005 + z * r * hr * HEAD_SCALE[2]);
    const t = headUV(phi, th); uv.push(t[0], t[1]);
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + nu + 1;
    if (ths[j] > 1e-4) idx.push(a, b, a + 1);
    if (ths[j + 1] < Math.PI - 1e-4) idx.push(a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function gHead(P, hc, hr, seg) {
  const nu = Math.max(14, sgK(seg || 44)), nv = Math.max(10, sgK(Math.round((seg || 44) * 0.68)));
  const phis = densityMap(nu, 0, Math.PI * 2, p => { let d = p - Math.PI / 2; d = Math.atan2(Math.sin(d), Math.cos(d)); return 1 + 2.4 * Math.exp(-((d / 0.75) ** 2)); });
  const ths = densityMap(nv, 0, Math.PI, t => 1 + 2 * Math.exp(-(((t - 1.75) / 0.55) ** 2)));
  const g = gHeadPatch(P, hc, hr, phis, ths, 0, true);
  const nrm = g.attributes.normal, nu1 = nu + 1;
  for (let j = 0; j <= nv; j++) {
    const a = j * nu1, b = a + nu;
    const v = V3(nrm.getX(a) + nrm.getX(b), nrm.getY(a) + nrm.getY(b), nrm.getZ(a) + nrm.getZ(b)).normalize();
    nrm.setXYZ(a, v.x, v.y, v.z); nrm.setXYZ(b, v.x, v.y, v.z);
  }
  for (const j of [0, nv]) for (let i = 0; i <= nu; i++) nrm.setXYZ(j * nu1 + i, 0, j ? -1 : 1, 0);
  return g;
}
function gLid(P, hc, hr, s) {
  const ea = FACE_PX.eyeA, eb = FACE_PX.eyeB;
  const phis = [], ths = [];
  for (let i = 0; i <= 6; i++) phis.push(Math.PI / 2 + s * ea - 0.31 + 0.62 * i / 6);
  for (let j = 0; j <= 4; j++) ths.push(Math.PI / 2 + eb - 0.26 + 0.43 * j / 4);
  return gHeadPatch(P, hc, hr, phis, ths, 0.016, true);
}
function warpToHead(g, P, hc, hr) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const qx = p.getX(i) / (hr * HEAD_SCALE[0]), qy = (p.getY(i) - hc) / (hr * HEAD_SCALE[1]), qz = (p.getZ(i) - 0.005) / (hr * HEAD_SCALE[2]);
    const l = Math.hypot(qx, qy, qz) || 1;
    const m = headRadial(P, qx / l, qy / l, qz / l, false);
    p.setXYZ(i, qx * m * hr * HEAD_SCALE[0], hc + qy * m * hr * HEAD_SCALE[1], 0.005 + qz * m * hr * HEAD_SCALE[2]);
  }
  g.computeVertexNormals();
  return g;
}

function gLoft(rings, seg, capBot, capTop, v0, v1) {
  const n = Math.max(8, sgK(seg || 20)), m = rings.length, pos = [], uv = [], idx = [];
  for (let j = 0; j < m; j++) {
    const r = rings[j], p = r.p || 2.2;
    for (let i = 0; i <= n; i++) {
      const t = i / n * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t);
      const ex = Math.sign(c) * Math.pow(Math.abs(c), 2 / p), ez = Math.sign(sn) * Math.pow(Math.abs(sn), 2 / p);
      const zr = ez >= 0 ? (r.f || 1) : (r.b || 1);
      pos.push((r.x || 0) + ex * r.rx, r.y, (r.z || 0) + ez * r.rz * zr);
      uv.push(i / n, (v0 || 0) + ((v1 == null ? 1 : v1) - (v0 || 0)) * j / (m - 1));
    }
  }
  for (let j = 0; j < m - 1; j++) for (let i = 0; i < n; i++) {
    const a = j * (n + 1) + i, b = a + n + 1;
    if (rings[j].y > rings[j + 1].y) idx.push(a, a + 1, b, a + 1, b + 1, b); else idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const cap = (j, down) => {
    const r = rings[j], ci = pos.length / 3;
    pos.push(r.x || 0, r.y + (down ? -1 : 1) * Math.min(r.rx, r.rz) * 0.5, r.z || 0); uv.push(0.5, j ? 1 : 0);
    for (let i = 0; i < n; i++) { const a = j * (n + 1) + i; if (down) idx.push(ci, a, a + 1); else idx.push(ci, a + 1, a); }
  };
  if (capBot) cap(0, rings[0].y < rings[1].y);
  if (capTop) cap(m - 1, rings[m - 1].y < rings[m - 2].y);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const nr = g.attributes.normal;
  for (let j = 0; j < m; j++) { const a = j * (n + 1), b = a + n; const v = V3(nr.getX(a) + nr.getX(b), nr.getY(a) + nr.getY(b), nr.getZ(a) + nr.getZ(b)).normalize(); nr.setXYZ(a, v.x, v.y, v.z); nr.setXYZ(b, v.x, v.y, v.z); }
  return g;
}
function blendW(y, joints) {
  for (let k = joints.length - 1; k >= 1; k--) {
    const [jy, name, wd] = joints[k];
    if (y > jy - wd) {
      if (y >= jy + wd) return [[name, 1]];
      const t = smoothRange(jy - wd, jy + wd, y);
      return [[name, t], [joints[k - 1][1], 1 - t]];
    }
  }
  return [[joints[0][1], 1]];
}

const JOB_TINT = {
  WAR: { shirt: 0x8a3a2c, pants: 0x4a3a2c, robe: 0x7a4a30, trim: 0xd0a040 },
  WHM: { shirt: 0xe6e0d2, pants: 0xcfc6b6, robe: 0xeeeae0, trim: 0xb02a2a, deep: 0xe8dcc6 },
  BLM: { shirt: 0x2b3160, pants: 0x2a2a3a, robe: 0x262c5a, trim: 0xc8a040, deep: 0x3a2460 },
  PLD: { shirt: 0x3a4a7a, pants: 0x3a3a48, robe: 0x3a4a7a, trim: 0xd8c070 },
  RDM: { shirt: 0xa0242c, pants: 0x2a2a2a, robe: 0xa0242c, trim: 0xd8c070 },
  THF: { shirt: 0x4a3f36, pants: 0x2f2a26, robe: 0x4a3f36, trim: 0xa1887f },
  MNK: { shirt: 0xd8893a, pants: 0x5a3f28, robe: 0xd8893a, trim: 0x8a3a2a },
  RNG: { shirt: 0x4a6a34, pants: 0x3a3024, robe: 0x4a6a34, trim: 0xb08a50 },
  DRK: { shirt: 0x2a2232, pants: 0x1e1a22, robe: 0x2a2232, trim: 0x8e6bbf },
  GEO: { shirt: 0x2f5a3a, pants: 0x2a3028, robe: 0x2f5a3a, trim: 0x66bb6a, deep: 0x23452c },
  RUN: { shirt: 0x7a2a2a, pants: 0x2a2424, robe: 0x7a2a2a, trim: 0xef5350 },
  PUP: { shirt: 0x5a2a6a, pants: 0x2a2030, robe: 0x5a2a6a, trim: 0xab47bc },
  DNC: { shirt: 0x8a2a4a, pants: 0x3a2030, robe: 0x8a2a4a, trim: 0xf06292 },
  SCH: { shirt: 0x5a4a40, pants: 0x2a2420, robe: 0x4a3a34, trim: 0xbcaaa4, deep: 0x3a2e2a },
  BST: { shirt: 0x5a4a32, pants: 0x3a3024, robe: 0x5a4a32, trim: 0x8d6e63 },
  BLU: { shirt: 0x1f4a7a, pants: 0x2a2a3a, robe: 0x1f4a7a, trim: 0x42a5f5 },
  COR: { shirt: 0x7a1e1e, pants: 0x2a2020, robe: 0x7a1e1e, trim: 0xd8b040 },
  SAM: { shirt: 0x6a3a2a, pants: 0x2a2420, robe: 0x6a3a2a, trim: 0xe0a060 },
  NIN: { shirt: 0x2a3038, pants: 0x1e2228, robe: 0x2a3038, trim: 0x78909c },
  DRG: { shirt: 0x2a3a6a, pants: 0x2a2a34, robe: 0x2a3a6a, trim: 0x5c8adb },
  BRD: { shirt: 0x8a5a20, pants: 0x3a2e24, robe: 0x8a5a20, trim: 0xffd54f },
  SMN: { shirt: 0x2a6a78, pants: 0x2a2a38, robe: 0x2a6a78, trim: 0xd8c070, deep: 0x1f4f5f }
};

const ITEM_LOOK = {
  leather_vest: { top: { type: "vest", color: 0x7a5230, region: "leather" } },
  leather_belt: { belt: 0x5a3a20 }, warriors_belt: { belt: 0x7a2a1a }, bronze_bandolier: { belt: 0xc8b8e8 },
  scale_mail: { top: { type: "mail", color: 0x9aa0a8, region: "chain" }, pauldrons: 0xa8aeb6 },
  linen_robe: { top: { type: "robe" } },
  linen_robe_hq: { top: { type: "robe" } },
  bronze_cap: { head: { type: "cap", color: 0xb0804a } },
  bronze_cap_hq: { head: { type: "cap", color: 0xc8955a } },
  leather_gloves: { gloves: 0x6a4428 },
  leather_trousers: { legs: 0x5a3c24, legsRegion: "leather" },
};

const MAT_TINT = [[/mythril/, 0xb8d8e8], [/ironvale/, 0x4a5a6a], [/frost|rime|glacier|snow/, 0xbfe0ee], [/tide|coral|harbor|sea|gull/, 0x4a7a8a], [/cinder|ember|flame/, 0x8a3a20], [/shadow|dusk|night|wight/, 0x3a3442], [/bronze/, 0xb0804a], [/iron/, 0x7a8088], [/steel/, 0xa8b0b8], [/silk/, 0xd8d0e8], [/linen|cotton/, 0xd8d0b8], [/wool|fur/, 0x8a6a4a], [/leather|hide/, 0x6a4428]];
function autoLook(id) {
  const it = ITEMS[id];
  if (!it || !it.slot) return null;
  const n = id + " " + (it.name || "").toLowerCase();
  let col = 0x7a6a5a;
  for (const [re, c] of MAT_TINT) if (re.test(n)) { col = c; break; }
  const metal = /iron|steel|bronze|mail|plate|helm|greave|gauntlet/.test(n);
  const trim = (it.lv || 0) >= 14 ? 0xd8c070 : null;
  if (it.slot === "head") return { head: { type: /crown|circlet/.test(n) ? "crown" : /hood|cowl/.test(n) ? "hood" : /helm/.test(n) ? "helm" : /hat/.test(n) ? "widebrim" : "cap", color: col, color2: 0xf4f1e8 } };
  if (it.slot === "body") return { top: /robe|mantle|shroud|cloak/.test(n) ? { type: "robe", color: col, trim } : /coat/.test(n) ? { type: "coat", color: col, trim } : metal ? { type: /plate/.test(n) ? "plate" : "mail", color: col, region: "chain", plate: col, trim } : { type: "vest", color: col, region: "leather" } };
  if (it.slot === "hands") return metal ? { gloves: col, glovesRegion: "metal", gauntlets: true } : { gloves: col, glovesRegion: /silk|cloth|cotton|wool/.test(n) ? "cloth" : "leather" };
  if (it.slot === "legs") return metal ? { legs: 0x4a4a54, greaves: col } : { legs: col, legsRegion: /leather|hide/.test(n) ? "leather" : "cloth" };
  if (it.slot === "feet") return metal ? { boots: col, greaves: col } : { boots: col };
  if (it.slot === "back") return { cape: col };
  if (it.slot === "waist") return { belt: col };
  return null;
}

const MERC_BASE = {
  kael: { build: 0, skin: SKIN_TONES[1], hair: { style: "short", color: HAIR_COLORS[1] } },
  rook: { build: 0, skin: SKIN_TONES[3], hair: { style: "spiky", color: HAIR_COLORS[5] } },
  mira: { build: 1, skin: SKIN_TONES[0], hair: { style: "long", color: HAIR_COLORS[3] } },
  fen: { build: 0, skin: SKIN_TONES[2], hair: { style: "bob", color: HAIR_COLORS[2] } },
  sable: { build: 1, skin: SKIN_TONES[2], hair: { style: "ponytail", color: 0x2a2440 } },
  dorn: { build: 0, skin: SKIN_TONES[1], hair: { style: "short", color: 0x8a8a8a }, beard: 0x8a8a8a },
  lisette: { build: 1, skin: SKIN_TONES[0], hair: { style: "bun", color: HAIR_COLORS[4] } },
  vesper: { build: 1, skin: SKIN_TONES[3], hair: { style: "long", color: HAIR_COLORS[6] } },
  mordrin: { build: 0, skin: SKIN_TONES[0], hair: { style: "long", color: 0x1d1d22 }, beard: 0x1d1d22 },
  lyra: { build: 1, skin: SKIN_TONES[2], hair: { style: "ponytail", color: HAIR_COLORS[4] } },
  corin: { build: 0, skin: SKIN_TONES[1], hair: { style: "short", color: HAIR_COLORS[2] }, beard: HAIR_COLORS[2] },
  wren: { build: 1, skin: SKIN_TONES[1], hair: { style: "ponytail", color: HAIR_COLORS[4] } },
  tamsin: { build: 1, skin: SKIN_TONES[2], hair: { style: "bun", color: HAIR_COLORS[0] } }
};

const NPC_LOOK = {
  rhea: { build: 1, skin: SKIN_TONES[1], hair: { style: "ponytail", color: 0x8a3a20 }, top: { type: "tabard", color: 0x9aa0a8, region: "chain", color2: 0x2f5c9a }, pauldrons: 0xb8bec6, cape: 0x1d3f75, legs: 0x3a3a44, boots: 0x3a2618, gloves: 0x5a3a22, belt: 0x4a2e1a, weapon: "sword" },
  tobin: { build: 0, skin: SKIN_TONES[0], hair: { style: "bald", color: 0xdedede }, beard: 0xe6e6e6, longBeard: true, top: { type: "robe", color: 0x5a3a7a, trim: 0xd8b050, sleeves: "wide" }, legs: 0x3a2a4a, weapon: "staff", alwaysDrawn: true },
  ilsa: { build: 1, skin: SKIN_TONES[1], hair: { style: "ponytail", color: HAIR_COLORS[6] }, top: { type: "coat", color: 0x1f3a5a, trim: 0xd8c070 }, head: { type: "feathered", color: 0x1f2a3a, color2: 0xd8c070 }, legs: 0x2a2a30, boots: 0x1a1410, belt: 0x3a2a1a, weapon: "sword", prop: { leg: 0.9 } },
  marn: { build: 0, skin: SKIN_TONES[2], hair: { style: "short", color: HAIR_COLORS[2] }, beard: HAIR_COLORS[2], top: { type: "apron", color: 0x5a8aa8, color2: 0xd8d0c0 }, head: { type: "bandana", color: 0x1a5a8a }, legs: 0x3a4048, boots: 0x2a2a2a, belt: 0x3a2a1a, prop: { girth: 1.15 } },
  guard: { build: 0, skin: SKIN_TONES[1], hair: { style: "short", color: HAIR_COLORS[0] }, top: { type: "tabard", color: 0x2f4a7a, region: "chain", color2: 0xd8c070 }, head: { type: "helm", color: 0x8a90a0 }, pauldrons: 0x8a90a0, legs: 0x2a2a30, boots: 0x2a1a10, gloves: 0x4a3a28, belt: 0x3a2412, weapon: "sword", alwaysDrawn: false, prop: { girth: 1.08, shoulder: 0.21 } },
  guard_f: { build: 1, skin: SKIN_TONES[2], hair: { style: "ponytail", color: HAIR_COLORS[1] }, top: { type: "tabard", color: 0x2f4a7a, region: "chain", color2: 0xd8c070 }, head: { type: "cap", color: 0x8a90a0 }, pauldrons: 0x8a90a0, legs: 0x2a2a30, boots: 0x2a1a10, gloves: 0x4a3a28, belt: 0x3a2412, weapon: "sword", alwaysDrawn: false },
  maera: { build: 1, skin: SKIN_TONES[2], hair: { style: "bob", color: HAIR_COLORS[3] }, top: { type: "coat", color: 0x5a3a1e, trim: 0xc9a227 }, legs: 0x2e2a24, boots: 0x2a1a10, gloves: 0x5a3a20, belt: 0x3a2412, weapon: "sword" },
  garrick: { build: 0, skin: SKIN_TONES[1], hair: { style: "bald", color: HAIR_COLORS[0] }, beard: 0x8a5a2c, longBeard: true, top: { type: "apron", color: 0x3a2a20, color2: 0x6a4a30 }, legs: 0x3a3028, boots: 0x2a1e14, gloves: 0x4a3020, belt: 0x2a1e14, weapon: "club", alwaysDrawn: false, prop: { girth: 1.2, shoulder: 0.215 } },
  vend_armorer: { build: 0, skin: SKIN_TONES[1], hair: { style: "short", color: HAIR_COLORS[0] }, beard: HAIR_COLORS[0], top: { type: "apron", color: 0x5a5e66, color2: 0x3a3e46 }, pauldrons: 0x7a7e86, legs: 0x3a3a40, boots: 0x2a2a30, gloves: 0x4a3a2a, belt: 0x3a2a1a, prop: { girth: 1.15, shoulder: 0.22 } },
  vend_weaponsmith: { build: 0, skin: SKIN_TONES[2], hair: { style: "spiky", color: HAIR_COLORS[2] }, top: { type: "apron", color: 0x4a2a20, color2: 0x8a5a30 }, legs: 0x3a3028, boots: 0x2a1e14, gloves: 0x4a3020, belt: 0x2a1e14, weapon: "sword", prop: { girth: 1.1 } },
  vend_tradesman: { build: 0, skin: SKIN_TONES[2], hair: { style: "short", color: HAIR_COLORS[1] }, beard: HAIR_COLORS[1], top: { type: "apron", color: 0xb8a878, color2: 0x6a5a30 }, head: { type: "bandana", color: 0x3a7a3a }, legs: 0x4a4038, boots: 0x3a2a1e, belt: 0x5a3a20, prop: { girth: 1.12 } },
  vend_quartermaster: { build: 1, skin: SKIN_TONES[1], hair: { style: "bob", color: HAIR_COLORS[3] }, top: { type: "coat", color: 0x3a5a3a, trim: 0xc9a227 }, legs: 0x2e2a24, boots: 0x2a1a10, gloves: 0x5a3a20, belt: 0x3a2412 },
  vend_spellsmith: { build: 1, skin: SKIN_TONES[0], hair: { style: "long", color: HAIR_COLORS[5] }, top: { type: "robe", color: 0x4a2a6a, trim: 0xd8c070 }, head: { type: "hood", color: 0x3a1e54 }, legs: 0x2a2030, boots: 0x2a1a24 },
  vend_jeweler: { build: 1, skin: SKIN_TONES[3], hair: { style: "bob", color: HAIR_COLORS[4] }, top: { type: "coat", color: 0x2a3a5a, trim: 0xe0d090 }, legs: 0x1e2434, boots: 0x2a2030, gloves: 0xd8d0b0, belt: 0x4a3a1a },
  brann: { build: 0, skin: SKIN_TONES[2], hair: { style: "spiky", color: 0x1d1d22 }, beard: 0x1d1d22, top: { type: "fur", color: 0x6a4a2a, region: "fur", sleeves: "none" }, pauldrons: 0x55585e, legs: 0x3a3028, legsRegion: "leather", boots: 0x2a1e14, gloves: 0x3a2a1e, belt: 0x2a1e14, weapon: "greataxe", prop: { girth: 1.15, shoulder: 0.22 } },
  luna: { build: 1, skin: SKIN_TONES[0], hair: { style: "long", color: HAIR_COLORS[6] }, top: { type: "robe", color: 0x2a2a5a, trim: 0xb0c4ff, glowTrim: true }, head: { type: "hood", color: 0x1e1e44 }, legs: 0x1e1e30, boots: 0x14141e },
  tarqa: { build: 1, skin: SKIN_TONES[2], hair: { style: "braid", color: HAIR_COLORS[5] }, top: { type: "coat", color: 0x8a5a2a, trim: 0xd84a2a }, collar: 0xd8c8a8, head: { type: "furhat", color: 0x6a4a2a }, legs: 0x4a3a2a, boots: 0x3a2618, belt: 0xa03a2a },
  essa: { build: 1, skin: SKIN_TONES[1], hair: { style: "twintails", color: HAIR_COLORS[1] }, top: { type: "vest", color: 0x6a3a5a, region: "cloth", under: 0xe8d8b8 }, legs: 0x4a3a2a, boots: 0x3a2618, belt: 0xa07a2a },
  nomad: { build: 0, skin: SKIN_TONES[2], hair: { style: "ponytail", color: HAIR_COLORS[0] }, top: { type: "coat", color: 0x5a4a2a, trim: 0xa03a2a }, collar: 0xd8c8a8, legs: 0x3a3028, boots: 0x2a1a10, belt: 0x3a2412, weapon: "polearm" },
  ferryman: { build: 0, skin: SKIN_TONES[2], hair: { style: "short", color: HAIR_COLORS[0] }, beard: HAIR_COLORS[0], top: { type: "vest", color: 0x2a4a6a, region: "cloth", under: 0xe8e0d0 }, head: { type: "bandana", color: 0xa0302a }, legs: 0x3a3a44, boots: 0x2a1e14, belt: 0x3a2412 },
  wend: { build: 0, skin: SKIN_TONES[1], hair: { style: "bald", color: 0xe0e0e0 }, beard: 0xe6e6e6, longBeard: true, top: { type: "robe", color: 0x8a7a5a, trim: 0x4a6a8a }, legs: 0x4a4a40, barefoot: true },
  brisa: { build: 1, skin: SKIN_TONES[2], hair: { style: "braid", color: HAIR_COLORS[4] }, top: { type: "coat", color: 0x4a3a2a, trim: 0xb0b8c0 }, collar: 0xe8e0d0, legs: 0x3a3028, boots: 0x2a1a10, gloves: 0x5a4030, belt: 0x2a1a10 },
  haldor: { build: 0, skin: SKIN_TONES[1], hair: { style: "short", color: 0x8a8a8a }, beard: 0x9a9a9a, longBeard: true, top: { type: "apron", color: 0x3a3430, color2: 0x5a4030 }, legs: 0x2e2a26, boots: 0x1e1610, gloves: 0x3a2a1e, belt: 0x2a1a10, prop: { girth: 1.2 } },
  odette: { build: 1, skin: SKIN_TONES[1], hair: { style: "bun", color: HAIR_COLORS[6] }, top: { type: "coat", color: 0x7a3a5a, trim: 0xe8d0a0 }, collar: 0xf0e8e0, legs: 0x3a2a34, boots: 0x2a1a14, gloves: 0xe8e0d0, glovesRegion: "cloth", belt: 0x4a2a1a },
  ysolde: { build: 1, skin: SKIN_TONES[2], hair: { style: "ponytail", color: HAIR_COLORS[3] }, top: { type: "coat", color: 0x2f5a3a, trim: 0xc8a040 }, legs: 0x6a5238, legsRegion: "leather", boots: 0x3a2618, gloves: 0x6a4428, belt: 0x4a2e1a }
};


function headHorns(R, H, hc, hr, k) {
  for (const s of [-1, 1]) {
    const a = V3(s * hr * 0.9, hc + hr * 0.45, 0), b = V3(s * hr * (0.9 + 0.7 * k), hc + hr * (0.45 + 0.55 * k), -hr * 0.1), c = V3(s * hr * (0.9 + 0.8 * k), hc + hr * (0.45 + 1.3 * k), hr * 0.2);
    R.add(gTaper(a, b, hr * 0.22 * Math.sqrt(k), hr * 0.14 * Math.sqrt(k), 8), "head", H.color2 || 0xe8dcc0, "bone");
    R.add(gTaper(b, c, hr * 0.14 * Math.sqrt(k), 0.004, 8), "head", H.color2 || 0xe8dcc0, "bone");
  }
}

function headDecor(R, H, hc, hr) {
  if (H.horns && H.type !== "horned") headHorns(R, H, hc, hr, H.horns);
  if (H.crest) {
    R.add(gBox(V3(0, hc + hr * 1.12, -hr * 0.05), 0.02, hr * 0.3, hr * 1.5), "head", H.color2 || 0xd8b040, "metal");
    for (let k = 0; k < 3; k++) R.add(gTaper(V3(0, hc + hr * 1.22, hr * (0.4 - k * 0.4)), V3(0, hc + hr * (1.7 - k * 0.15), -hr * (0.5 + k * 0.55)), hr * 0.16, 0.006, 5, 0.35), "head", H.crest, "feather");
  }
  if (H.spikes) for (let k = 0; k < H.spikes; k++) { const a = (k / H.spikes - 0.5) * 2.2; R.add(gTaper(V3(Math.sin(a) * hr * 0.75, hc + hr * 0.95, Math.cos(a) * hr * 0.2 - hr * 0.1), V3(Math.sin(a) * hr * 1.15, hc + hr * 1.7, Math.cos(a) * hr * 0.3 - hr * 0.3), hr * 0.13, 0.004, 5), "head", H.color2 || H.color, "metal"); }
  if (H.wings && H.type !== "winged") for (const s of [-1, 1]) for (let k = 0; k < 2; k++) R.add(gTaper(V3(s * hr * 1.0, hc + hr * (0.4 + k * 0.1), -hr * 0.1), V3(s * hr * (1.4 + k * 0.15), hc + hr * (0.9 + k * 0.35), -hr * (0.5 + k * 0.3)), hr * 0.16, 0.005, 5, 0.3), "head", H.color2 || 0xd8c070, "metal");
  if (H.gem) R.add(gBall(V3(0, hc + hr * 0.45, hr * 1.08), 0.02, 1, 1.25, 0.6, 8), "head", H.gem, "glow", true);
  if (H.plume && !["feathered", "widebrim"].includes(H.type)) R.add(gTaper(V3(hr * 0.7, hc + hr * 0.7, -hr * 0.4), V3(hr * 1.2, hc + hr * (1.4 + 0.6 * (H.plumeK || 1)), -hr * (1.1 + 0.4 * (H.plumeK || 1))), 0.028 * (H.plumeK || 1), 0.004, 6, 0.3), "head", H.plume, "feather");
  if (H.tails) for (const s of [-1, 1]) R.add(gBox(V3(s * 0.025, hc + hr * 0.05, -hr * 1.12), 0.035, hr * 1.3, 0.008, 0.28, 0, s * 0.18), "head", H.tails, "cloth");
}

const JS_IRON = 0x8a9098, JS_STEEL = 0xa8b0b8, JS_GOLD = 0xd8b040, JS_DARK = 0x3a3442, JS_LEATHER = 0x6a4428, JS_BONE = 0xe8dcc0;
const JOB_STYLE = {
  WAR: (t, c) => [
    { top: { type: "vest", color: 0x7a5230, region: "leather" }, gloves: JS_LEATHER, boots: 0x4a2e1a, belt: 0x4a2e1a },
    { top: { type: "mail", color: JS_IRON, region: "chain", plate: JS_IRON }, pauldrons: JS_IRON, head: { type: "horned", color: JS_IRON, color2: JS_BONE }, gloves: JS_LEATHER, boots: 0x4a2e1a, belt: 0x5a2a1a },
    { top: { type: "plate", color: c.shirt, region: "chain", plate: JS_STEEL, trim: JS_GOLD }, pauldrons: JS_STEEL, padK: 1.35, gauntlets: true, gloves: JS_STEEL, greaves: JS_STEEL, head: { type: "horned", color: JS_STEEL, color2: JS_BONE, hornK: 1.3 }, cape: c.shirt, boots: 0x3a2618 },
    { top: { type: "plate", color: 0x6a1e18, region: "chain", plate: 0x9a8a78, trim: JS_GOLD }, pauldrons: 0x9a8a78, padK: 1.6, padSpikes: 2, padSpikeC: JS_BONE, gauntlets: true, gloves: 0x9a8a78, greaves: 0x9a8a78, head: { type: "horned", color: 0x9a8a78, color2: JS_BONE, hornK: 1.65 }, cape: 0x8a2018, collar: 0x8a7a6a, boots: 0x2a1a10 }
  ][t],
  WHM: (t, c) => [
    { top: { type: "robe", color: c.robe, trim: c.trim }, shoes: 0x8a7a6a },
    { top: { type: "robe", color: c.robe, trim: c.trim }, head: { type: "hood", color: c.robe, color2: c.trim }, boots: 0xb8ac98 },
    { top: { type: "robe", color: c.robe, trim: c.trim }, head: { type: "hood", color: c.robe, color2: c.trim }, cape: 0xd8d0c0, gloves: 0xe8e0d0, glovesRegion: "cloth", boots: 0xb8ac98, belt: c.trim },
    { top: { type: "robe", color: 0xf4f0e6, trim: c.trim, glowTrim: true }, head: { type: "hood", color: 0xf4f0e6, color2: c.trim, gem: 0xff8a80 }, cape: 0xe8dcc6, collar: c.trim, gloves: 0xf4f0e6, glovesRegion: "cloth", pauldrons: 0xf4f0e6, padK: 1.2, padRegion: "cloth", padTrim: c.trim, boots: 0xd8ccb8 }
  ][t],
  BLM: (t, c) => [
    { top: { type: "robe", color: c.robe, trim: c.trim }, head: { type: "pointy", color: 0x3a3060 } },
    { top: { type: "robe", color: c.deep, trim: c.trim }, head: { type: "pointy", color: 0x3a2a5a, brimK: 1.15, tallK: 1.15 }, gloves: 0x2a2440, glovesRegion: "cloth" },
    { top: { type: "robe", color: c.deep, trim: c.trim }, head: { type: "pointy", color: 0x2e2450, brimK: 1.3, tallK: 1.3, color2: c.trim }, collar: 0x2a2440, gloves: 0x2a2440, glovesRegion: "cloth", boots: 0x2a2030 },
    { top: { type: "robe", color: 0x2a1a48, trim: c.trim, glowTrim: true }, head: { type: "pointy", color: 0x24183e, brimK: 1.5, tallK: 1.45, color2: c.trim, gem: 0xffb74d }, collar: 0x1a1430, cape: 0x1a1430, gloves: 0x2a2440, glovesRegion: "cloth", boots: 0x1a1428 }
  ][t],
  PLD: (t, c) => [
    { top: { type: "tabard", color: c.shirt, region: "cloth", color2: 0x24346a }, gloves: JS_LEATHER, boots: 0x4a2e1a, belt: 0x4a2e1a },
    { top: { type: "mail", color: JS_STEEL, region: "chain", plate: JS_STEEL }, pauldrons: JS_STEEL, head: { type: "helm", color: JS_STEEL }, gloves: JS_LEATHER, boots: 0x3a2a1e, cape: c.shirt },
    { top: { type: "plate", color: c.shirt, region: "chain", plate: 0xc0c8d0, trim: JS_GOLD }, pauldrons: 0xc0c8d0, padK: 1.35, gauntlets: true, gloves: 0xc0c8d0, greaves: 0xc0c8d0, head: { type: "helm", color: 0xc0c8d0, crest: 0x3a5aa8 }, cape: c.shirt, boots: 0x3a2a1e },
    { top: { type: "plate", color: 0x2a3a6a, region: "chain", plate: 0xe0e4ea, trim: JS_GOLD }, pauldrons: 0xe0e4ea, padK: 1.6, padTrim: JS_GOLD, gauntlets: true, gloves: 0xe0e4ea, greaves: 0xe0e4ea, head: { type: "helm", color: 0xe0e4ea, color2: JS_GOLD, crest: 0x2a4aa8, wings: true }, cape: 0x1d3f75, boots: 0x2a2030 }
  ][t],
  RDM: (t, c) => [
    { top: { type: "tunic", color: c.shirt, region: "cloth" }, boots: 0x3a2a1e, belt: 0x2a1a10 },
    { top: { type: "coat", color: c.shirt, trim: c.trim }, head: { type: "feathered", color: c.shirt, color2: c.trim }, gloves: 0xe8e0d0, glovesRegion: "cloth", boots: 0x2a1a10 },
    { top: { type: "coat", color: c.shirt, trim: c.trim }, head: { type: "feathered", color: c.shirt, color2: c.trim, plumeK: 1.4 }, cape: c.shirt, gloves: 0xe8e0d0, glovesRegion: "cloth", boots: 0x2a1a10, collar: 0xe8e0d0 },
    { top: { type: "coat", color: 0xb0202a, trim: JS_GOLD }, head: { type: "feathered", color: 0xb0202a, color2: JS_GOLD, plumeK: 1.8, plume: 0xffffff }, cape: 0x7a1018, gloves: 0xf4f0e6, glovesRegion: "cloth", boots: 0x1a1010, collar: 0xf4f0e6, pauldrons: 0xb0202a, padK: 1.2, padRegion: "cloth", padTrim: JS_GOLD }
  ][t],
  THF: (t, c) => [
    { top: { type: "vest", color: c.shirt, region: "leather" }, boots: 0x3a2a1e, belt: 0x2a1a10 },
    { top: { type: "vest", color: 0x3a3028, region: "leather", under: c.shirt }, head: { type: "bandana", color: 0x6a2a2a }, gloves: 0x3a2a20, boots: 0x2a1e14, belt: 0x2a1a10 },
    { top: { type: "vest", color: 0x2a2420, region: "leather", under: 0x4a3a30 }, head: { type: "bandana", color: 0x4a1a2a }, gloves: 0x2a2018, boots: 0x1e1610, belt: 0x5a3a20, cape: 0x3a2a24 },
    { top: { type: "coat", color: 0x4a3440, trim: 0x8a6a4a }, head: { type: "hood", color: 0x3a2a34 }, gloves: 0x1e1814, boots: 0x1a1210, belt: 0x5a3a20, collar: 0x3a2a24, pauldrons: 0x3a2e28, padK: 1.15, padRegion: "leather", padTrim: 0x8a6a4a }
  ][t],
  MNK: (t, c) => [
    { top: { type: "tunic", color: 0xe8e0cc, region: "cloth" }, belt: 0x2a2a2a, barefoot: true },
    { top: { type: "tunic", color: c.shirt, region: "cloth" }, head: { type: "headband", color: 0xe8e0cc }, belt: 0x2a2a2a, gloves: 0xe8e0cc, glovesRegion: "cloth", barefoot: true },
    { top: { type: "tunic", color: c.shirt, region: "cloth", sleeves: "none" }, head: { type: "headband", color: 0x8a2a2a }, belt: 0x1a1a1a, gloves: 0xd8d0c0, glovesRegion: "cloth", boots: 0x5a3f28, collar: 0x5a3a28 },
    { top: { type: "tunic", color: 0xe07a2a, region: "cloth", sleeves: "none" }, head: { type: "headband", color: 0xa02020, gem: 0xffd54f }, belt: 0x1a1a1a, gloves: 0xd8d0c0, glovesRegion: "cloth", gauntlets: true, boots: 0x4a2e1a, collar: 0x7a4a2a, pauldrons: 0x8a3a2a, padK: 1.2, padRegion: "cloth" }
  ][t],
  RNG: (t, c) => [
    { top: { type: "vest", color: 0x5a6a3a, region: "leather", under: c.shirt }, boots: 0x4a3a24, belt: 0x4a2e1a },
    { top: { type: "coat", color: c.shirt, trim: c.trim }, head: { type: "cap", color: 0x5a4a2a, plume: 0x8a5a2a }, gloves: JS_LEATHER, boots: 0x4a3a24, belt: 0x4a2e1a },
    { top: { type: "coat", color: c.shirt, trim: c.trim }, head: { type: "widebrim", color: 0x4a5a2c, color2: 0xb08a50 }, cape: 0x3a4a2a, gloves: JS_LEATHER, boots: 0x3a2e1e, belt: 0x4a2e1a },
    { top: { type: "coat", color: 0x2e4a24, trim: JS_GOLD }, head: { type: "hood", color: 0x2e4a24, color2: 0xb08a50 }, cape: 0x24381c, gloves: 0x4a3420, boots: 0x2a2014, belt: 0x5a3a20, pauldrons: 0x5a4028, padK: 1.25, padRegion: "leather", padTrim: 0xb08a50, collar: 0x6a5a3a }
  ][t],
  SMN: (t, c) => [
    { top: { type: "robe", color: c.robe, trim: c.trim } },
    { top: { type: "robe", color: c.deep, trim: c.trim }, head: { type: "hood", color: c.deep, color2: c.trim, horns: 0.55 }, gloves: c.deep, glovesRegion: "cloth" },
    { top: { type: "robe", color: c.deep, trim: c.trim, glowTrim: true }, head: { type: "hood", color: c.deep, color2: c.trim, horns: 0.75, gem: 0x80deea }, gloves: c.deep, glovesRegion: "cloth", collar: 0x1a3a44 },
    { top: { type: "robe", color: 0x184450, trim: JS_GOLD, glowTrim: true }, head: { type: "hood", color: 0x184450, color2: JS_GOLD, horns: 1.0, gem: 0x80deea }, cape: 0x12343e, gloves: 0x184450, glovesRegion: "cloth", collar: 0x12343e, pauldrons: 0x184450, padK: 1.3, padRegion: "cloth", padTrim: JS_GOLD }
  ][t],
  DRK: (t, c) => [
    { top: { type: "mail", color: JS_DARK, region: "chain", plate: JS_DARK }, gloves: 0x2a2228, boots: 0x1e1a22 },
    { top: { type: "mail", color: JS_DARK, region: "chain", plate: JS_DARK }, pauldrons: 0x4a4258, head: { type: "helm", color: 0x4a4258, spikes: 3 }, gloves: 0x2a2228, boots: 0x1e1a22, cape: 0x1e1a22 },
    { top: { type: "plate", color: 0x2a2232, region: "chain", plate: 0x4a4258, trim: c.trim }, pauldrons: 0x4a4258, padK: 1.45, padSpikes: 2, gauntlets: true, gloves: 0x4a4258, greaves: 0x4a4258, head: { type: "horned", color: 0x4a4258, color2: 0x2a2232, hornK: 1.1 }, cape: 0x1a1420, boots: 0x14101a },
    { top: { type: "plate", color: 0x1a1422, region: "chain", plate: 0x3a3048, trim: 0xb388ff, glowTrim: true }, pauldrons: 0x3a3048, padK: 1.75, padSpikes: 3, gauntlets: true, gloves: 0x3a3048, greaves: 0x3a3048, head: { type: "horned", color: 0x3a3048, color2: 0x1a1422, hornK: 1.45, spikes: 3 }, cape: 0x120e18, collar: 0x2a2232, boots: 0x0e0a12 }
  ][t],
  BRD: (t, c) => [
    { top: { type: "tunic", color: c.shirt, region: "cloth" }, boots: 0x4a2e1a, belt: 0x4a2e1a },
    { top: { type: "coat", color: c.shirt, trim: c.trim }, head: { type: "beret", color: 0x6a2a3a, color2: c.trim, plume: 0xf4f1e8 }, boots: 0x4a2e1a, belt: 0x4a2e1a },
    { top: { type: "coat", color: 0x7a3a5a, trim: c.trim }, head: { type: "beret", color: 0x5a2040, color2: c.trim, plume: 0xffd54f, plumeK: 1.3 }, cape: 0x5a2040, collar: 0xf4f1e8, boots: 0x3a2214, belt: 0x5a3a20 },
    { top: { type: "coat", color: 0x6a1e44, trim: JS_GOLD }, head: { type: "beret", color: 0x4a1434, color2: JS_GOLD, plume: 0xffffff, plumeK: 1.7 }, cape: 0x3a0e28, collar: 0xf4f1e8, gloves: 0xf4f1e8, glovesRegion: "cloth", boots: 0x2a1610, belt: 0x5a3a20, pauldrons: 0x6a1e44, padK: 1.2, padRegion: "cloth", padTrim: JS_GOLD }
  ][t],
  SAM: (t, c) => [
    { top: { type: "tunic", color: c.shirt, region: "cloth" }, belt: 0xe0d8c0, boots: 0x2a2420 },
    { top: { type: "tunic", color: 0x3a2a4a, region: "cloth" }, head: { type: "headband", color: 0xe8e0d0 }, belt: c.trim, gloves: 0x3a2a20, boots: 0x2a2420 },
    { top: { type: "mail", color: 0x8a2a20, region: "scale", plate: 0x8a2a20 }, pauldrons: 0x8a2a20, padK: 1.35, head: { type: "kabuto", color: 0x3a2a24, color2: JS_GOLD }, gloves: 0x3a2a20, greaves: 0x8a2a20, belt: 0xe0d8c0, boots: 0x1e1a16 },
    { top: { type: "plate", color: 0x6a1a14, region: "scale", plate: 0xa02a20, trim: JS_GOLD }, pauldrons: 0xa02a20, padK: 1.6, padTrim: JS_GOLD, head: { type: "kabuto", color: 0x2a1e1a, color2: JS_GOLD }, gauntlets: true, gloves: 0xa02a20, greaves: 0xa02a20, belt: 0xe0d8c0, cape: 0x3a1a14, boots: 0x14100c }
  ][t],
  NIN: (t, c) => [
    { top: { type: "vest", color: 0x3a4658, region: "leather", under: 0x4a566a }, boots: 0x2a3242, belt: 0x5a3a2a },
    { top: { type: "tunic", color: 0x3a4658, region: "cloth" }, head: { type: "ninjahood", color: 0x3a4658, color2: JS_IRON }, gloves: 0x2a3242, glovesRegion: "cloth", boots: 0x2a3242, belt: 0x8a2a20 },
    { top: { type: "tunic", color: 0x36405a, region: "cloth" }, head: { type: "ninjahood", color: 0x323c50, color2: JS_STEEL, tails: 0x8a2a20 }, gloves: 0x2a3242, glovesRegion: "cloth", gauntlets: true, boots: 0x222836, belt: 0x8a2a20, collar: 0x3a4658 },
    { top: { type: "mail", color: 0x2e3646, region: "chain", plate: 0x2e3646 }, head: { type: "ninjahood", color: 0x283040, color2: JS_GOLD, tails: 0xb02a20 }, pauldrons: 0x3a4658, padK: 1.3, padRegion: "leather", padTrim: 0xb02a20, gloves: 0x283040, gauntlets: true, greaves: 0x3a4658, boots: 0x1e2430, belt: 0xb02a20, cape: 0x283040 }
  ][t],
  DRG: (t, c) => [
    { top: { type: "mail", color: 0x5a6a8a, region: "chain", plate: 0x5a6a8a }, gloves: JS_LEATHER, boots: 0x2a2a34 },
    { top: { type: "mail", color: 0x4a5a8a, region: "chain", plate: 0x4a5a8a }, pauldrons: 0x6a7aa0, head: { type: "winged", color: 0x6a7aa0, color2: JS_STEEL }, gloves: JS_LEATHER, boots: 0x2a2a34 },
    { top: { type: "plate", color: c.shirt, region: "chain", plate: 0x5a7ab8, trim: JS_STEEL }, pauldrons: 0x5a7ab8, padK: 1.4, gauntlets: true, gloves: 0x5a7ab8, greaves: 0x5a7ab8, head: { type: "winged", color: 0x5a7ab8, color2: JS_STEEL, wingK: 1.2 }, cape: 0x1e2a4a, boots: 0x1e1e28 },
    { top: { type: "plate", color: 0x1a2a5a, region: "scale", plate: 0x4a6ac8, trim: JS_GOLD }, pauldrons: 0x4a6ac8, padK: 1.65, padSpikes: 2, padSpikeC: JS_STEEL, gauntlets: true, gloves: 0x4a6ac8, greaves: 0x4a6ac8, head: { type: "winged", color: 0x4a6ac8, color2: JS_GOLD, wingK: 1.45 }, cape: 0x14204a, boots: 0x14141e }
  ][t],
  BST: (t, c) => [
    { top: { type: "vest", color: 0x6a4a2a, region: "leather", under: c.shirt }, boots: 0x3a2a1e, belt: 0x3a2a1a },
    { top: { type: "vest", color: 0x5a3a24, region: "leather", under: c.shirt }, head: { type: "furhat", color: 0x7a5a3a }, gloves: JS_LEATHER, boots: 0x3a2a1e, belt: 0x3a2a1a, collar: 0x8a6a4a },
    { top: { type: "coat", color: 0x5a4028, trim: 0x8a6a4a }, head: { type: "furhat", color: 0x8a6a4a }, pauldrons: 0x7a5a3a, padK: 1.3, padRegion: "fur", gloves: JS_LEATHER, boots: 0x2a1e14, collar: 0x9a7a5a },
    { top: { type: "coat", color: 0x4a3420, trim: JS_GOLD }, head: { type: "furhat", color: 0x9a7a52, horns: 0.7, color2: JS_BONE }, pauldrons: 0x8a6a4a, padK: 1.55, padRegion: "fur", padSpikes: 2, padSpikeC: JS_BONE, gloves: 0x4a3020, boots: 0x2a1e14, collar: 0xa88a62, cape: 0x3a2a1a }
  ][t],
  BLU: (t, c) => [
    { top: { type: "tunic", color: c.shirt, region: "cloth" }, boots: 0x2a2a3a, belt: 0x5a4a2a },
    { top: { type: "coat", color: c.shirt, trim: c.trim }, head: { type: "turban", color: 0x2a5a9a, color2: 0xd8c070 }, boots: 0x2a2a3a, belt: 0x5a4a2a },
    { top: { type: "coat", color: 0x1a3a6a, trim: c.trim }, head: { type: "turban", color: 0x1a4a8a, color2: JS_GOLD, gem: 0x4fc3f7 }, cape: 0x14305a, gloves: 0x1a3a6a, glovesRegion: "cloth", boots: 0x1e1e2a, belt: 0x5a4a2a },
    { top: { type: "coat", color: 0x123060, trim: JS_GOLD }, head: { type: "turban", color: 0x123a7a, color2: JS_GOLD, gem: 0x4fc3f7, plume: 0xf4f1e8 }, cape: 0x0e2448, gloves: 0x123060, glovesRegion: "cloth", boots: 0x14141e, collar: 0xd8c070, pauldrons: 0x1a4a8a, padK: 1.3, padRegion: "cloth", padTrim: JS_GOLD }
  ][t],
  COR: (t, c) => [
    { top: { type: "vest", color: 0x3a2a24, region: "leather", under: c.shirt }, boots: 0x2a1a10, belt: 0x1a1210 },
    { top: { type: "coat", color: c.shirt, trim: c.trim }, head: { type: "tricorne", color: 0x2a2020, color2: c.trim }, boots: 0x2a1a10, belt: 0x1a1210 },
    { top: { type: "coat", color: c.shirt, trim: c.trim }, head: { type: "tricorne", color: 0x2a1a1a, color2: c.trim, plume: 0xf4f1e8 }, cape: 0x4a1414, gloves: 0x2a1a10, boots: 0x1a1008, belt: 0x1a1210, collar: 0xf4f1e8 },
    { top: { type: "coat", color: 0x5a1010, trim: JS_GOLD }, head: { type: "tricorne", color: 0x1a1010, color2: JS_GOLD, plume: 0xb02a20, plumeK: 1.4 }, cape: 0x3a0a0a, gloves: 0x2a1a10, boots: 0x140c08, belt: 0x1a1210, collar: 0xf4f1e8, pauldrons: JS_GOLD, padK: 1.2, padTrim: 0x5a1010 }
  ][t],
  PUP: (t, c) => [
    { top: { type: "tunic", color: c.shirt, region: "cloth" }, boots: 0x2a2030, belt: 0x5a3a2a },
    { top: { type: "vest", color: c.shirt, region: "cloth", under: 0xe8d8a0 }, head: { type: "jester", color: c.shirt, color2: 0xe8d8a0 }, boots: 0x2a2030, belt: 0x5a3a2a },
    { top: { type: "coat", color: c.shirt, trim: c.trim }, head: { type: "jester", color: 0x6a2a7a, color2: 0xd8b040 }, gloves: 0xe8d8a0, glovesRegion: "cloth", boots: 0x2a1a24, collar: 0xe8d8a0 },
    { top: { type: "coat", color: 0x4a1a5a, trim: JS_GOLD }, head: { type: "jester", color: 0x4a1a5a, color2: 0xd8b040, gem: 0xce93d8 }, cape: 0x2a1030, gloves: 0xe8d8a0, glovesRegion: "cloth", boots: 0x1e1018, collar: 0xe8d8a0, pauldrons: 0x6a2a7a, padK: 1.3, padRegion: "cloth", padTrim: JS_GOLD }
  ][t],
  DNC: (t, c) => [
    { top: { type: "vest", color: c.shirt, region: "cloth", under: 0xe8d0c0 }, boots: 0x3a2030, belt: 0xd8b040 },
    { top: { type: "vest", color: c.shirt, region: "cloth", under: 0xf4e0d8 }, head: { type: "circlet", color: JS_GOLD, gem: 0xf06292 }, gloves: 0xf4e0d8, glovesRegion: "cloth", boots: 0x3a2030, belt: JS_GOLD },
    { top: { type: "tunic", color: 0xa02a5a, region: "cloth", sleeves: "none" }, head: { type: "circlet", color: JS_GOLD, gem: 0xf06292, tails: 0xf8bbd0 }, gloves: 0xf4e0d8, glovesRegion: "cloth", boots: 0x2a1424, belt: JS_GOLD, collar: JS_GOLD },
    { top: { type: "tunic", color: 0xb0204a, region: "cloth", sleeves: "none" }, head: { type: "circlet", color: JS_GOLD, gem: 0xff80ab, tails: 0xf8bbd0, plume: 0xf8bbd0 }, gloves: 0xf4e0d8, glovesRegion: "cloth", gauntlets: true, boots: 0x2a1020, belt: JS_GOLD, collar: JS_GOLD, cape: 0x8a1a3a }
  ][t],
  SCH: (t, c) => [
    { top: { type: "robe", color: c.robe, trim: c.trim } },
    { top: { type: "coat", color: c.shirt, trim: c.trim }, head: { type: "mortar", color: 0x2a2420, color2: JS_GOLD }, boots: 0x2a2420, belt: 0x3a2a20 },
    { top: { type: "robe", color: c.deep, trim: c.trim }, head: { type: "mortar", color: 0x2a2018, color2: JS_GOLD }, collar: 0xe8e0d0, gloves: 0xe8e0d0, glovesRegion: "cloth", boots: 0x2a2420 },
    { top: { type: "robe", color: 0x2e2420, trim: JS_GOLD, glowTrim: true }, head: { type: "mortar", color: 0x1e1814, color2: JS_GOLD, gem: 0xffe082 }, cape: 0x3a2e2a, collar: 0xe8e0d0, gloves: 0xe8e0d0, glovesRegion: "cloth", boots: 0x1e1814, pauldrons: 0x4a3a34, padK: 1.25, padRegion: "cloth", padTrim: JS_GOLD }
  ][t],
  GEO: (t, c) => [
    { top: { type: "robe", color: c.robe, trim: c.trim } },
    { top: { type: "robe", color: c.deep, trim: c.trim }, head: { type: "hood", color: c.deep, color2: c.trim }, gloves: c.deep, glovesRegion: "cloth" },
    { top: { type: "robe", color: c.deep, trim: c.trim, glowTrim: true }, head: { type: "hood", color: c.deep, color2: c.trim, gem: 0x69f0ae }, collar: 0x1a3020, gloves: c.deep, glovesRegion: "cloth", boots: 0x2a3028 },
    { top: { type: "robe", color: 0x1a3a22, trim: JS_GOLD, glowTrim: true }, head: { type: "hood", color: 0x1a3a22, color2: JS_GOLD, gem: 0x69f0ae, horns: 0.5 }, cape: 0x142c1a, collar: 0x142c1a, gloves: 0x1a3a22, glovesRegion: "cloth", boots: 0x1e241e, pauldrons: 0x2a4a30, padK: 1.3, padRegion: "cloth", padTrim: JS_GOLD }
  ][t],
  RUN: (t, c) => [
    { top: { type: "tunic", color: c.shirt, region: "leather" }, boots: 0x2a2424, belt: 0x3a2a1a, gloves: JS_LEATHER },
    { top: { type: "mail", color: 0x7a5a5a, region: "chain", plate: 0x7a5a5a }, pauldrons: JS_IRON, head: { type: "circlet", color: JS_IRON, gem: 0xef5350 }, gloves: JS_LEATHER, boots: 0x2a2424, belt: 0x3a2a1a },
    { top: { type: "plate", color: c.shirt, region: "chain", plate: 0x9a9088, trim: c.trim }, pauldrons: 0x9a9088, padK: 1.35, gauntlets: true, gloves: 0x9a9088, greaves: 0x9a9088, head: { type: "circlet", color: 0x9a9088, gem: 0xef5350, wings: true, color2: 0x9a9088 }, cape: 0x4a1a1a, boots: 0x1e1818 },
    { top: { type: "plate", color: 0x5a1a1a, region: "chain", plate: 0xb0a898, trim: 0xef5350, glowTrim: true }, pauldrons: 0xb0a898, padK: 1.6, padTrim: 0xef5350, gauntlets: true, gloves: 0xb0a898, greaves: 0xb0a898, head: { type: "circlet", color: 0xb0a898, gem: 0xff5252, wings: true, color2: JS_GOLD }, cape: 0x3a1010, collar: 0x8a7a6a, boots: 0x140e0e }
  ][t]
};
const JOB_STYLE_TIERS = [1, 5, 10, 16];
function jobStyleTier(lv) { let t = 0; for (let k = 0; k < JOB_STYLE_TIERS.length; k++) if ((lv || 1) >= JOB_STYLE_TIERS[k]) t = k; return t; }
function jobStyleOn() { return !(typeof VIEW !== "undefined" && VIEW.settings && VIEW.settings.attire === "gear"); }
const JOB_STYLE_SLOTS = ["top", "head", "gloves", "glovesRegion", "legs", "legsRegion", "boots", "pauldrons", "padK", "padSpikes", "padSpikeC", "padRegion", "padTrim", "cape", "belt", "gauntlets", "greaves", "collar", "barefoot", "hat", "shoes"];

function applyUnderwear(L, gear, on) {
  if (!on || !gear || L.skull || L.cactus) return L;
  const noTop = !gear.body, noLow = !gear.legs;
  if (!noTop && !noLow) return L;
  const fem = L.build === 1, sk = L.skin != null ? L.skin : 0xe8b894, skR = L.skinRegion || "skin";
  L.under = L.under ? Object.assign({}, L.under) : {};
  if (noTop) {
    L.top = { type: "bare", color: sk, region: skR, sleeves: "none" };
    L.under.top = fem ? "bikini" : null;
    delete L.pauldrons; delete L.collar; delete L.cape;
  }
  if (noLow) {
    L.legs = sk; L.legsRegion = skR;
    L.under.low = fem ? "thong" : "boxer";
    delete L.greaves;
  }
  if (noTop && noLow) delete L.belt;
  return L;
}

function lookFor(job, gear, base, lv, ul) {
  const L0 = lookForGear(job, gear, base);
  const fn = JOB_STYLE[job];
  if (!fn || !jobStyleOn() || base && (base.noJobStyle || base.skull || base.top)) return applyUnderwear(L0, gear, ul);
  const tint = JOB_TINT[job] || JOB_TINT.WAR, st = fn(jobStyleTier(lv), tint);
  const L = Object.assign({}, L0);
  for (const k of JOB_STYLE_SLOTS) delete L[k];
  Object.assign(L, JSON.parse(JSON.stringify(st)));
  if (!L.legs) L.legs = tint.pants;
  if (!L.boots && !L.barefoot) L.shoes = 0x3a2a1e;
  if (L0.shield) L.shield = L0.shield;
  return applyUnderwear(L, gear, ul);
}

function lookForGear(job, gear, base) {
  const tint = JOB_TINT[job] || JOB_TINT.WAR;
  const L = Object.assign({ legs: tint.pants, top: { type: "shirt", color: tint.shirt }, belt: 0x4a3020 }, base);
  for (const slot of SLOTS) {
    const id = gear[slot];
    const il = id && (ITEM_LOOK[id] || (ITEMS[id] && ITEMS[id].look) || autoLook(id));
    if (!il) continue;
    if (il.top) {
      const t = Object.assign({}, il.top);
      if (t.type === "robe" && !t.color) { t.color = t.deep && tint.deep ? tint.deep : tint.robe; t.trim = tint.trim; }
      if (t.type === "vest") t.under = tint.shirt;
      L.top = t;
    }
    if (il.head) L.head = il.head;
    if (il.gloves) { L.gloves = il.gloves; L.glovesRegion = il.glovesRegion; }
    if (il.legs) { L.legs = il.legs; L.legsRegion = il.legsRegion; }
    if (il.boots) L.boots = il.boots;
    if (il.pauldrons) L.pauldrons = il.pauldrons;
    if (il.shield) L.shield = il.shield;
    if (il.hat) L.hat = il.hat;
    if (il.cape) L.cape = il.cape;
    if (il.belt) L.belt = il.belt;
    if (il.gauntlets) L.gauntlets = true;
    if (il.greaves) L.greaves = il.greaves;
    if (il.collar) L.collar = il.collar;
  }
  if (!L.boots) L.shoes = 0x3a2a1e;
  L.weapon = gear.main ? ITEMS[gear.main].wtype : null;
  L.weaponId = gear.main || null;
  return L;
}

function stableKey(o) {
  const norm = v => v && typeof v === "object" && !Array.isArray(v) ? Object.keys(v).sort().reduce((acc, k) => { acc[k] = norm(v[k]); return acc; }, {}) : Array.isArray(v) ? v.map(norm) : v;
  return JSON.stringify(norm(o));
}

function hairEdgeFn(st) {
  const K = { short: [-0.52, -0.34, 0.0, 0.3, 0.42], spiky: [-0.44, -0.4, -0.05, 0.25, 0.36], bob: [-0.5, -0.42, 0.42, 0.52, 0.56], long: [-0.5, -0.42, 0.3, 0.42, 0.45], ponytail: [-0.56, -0.4, -0.02, 0.2, 0.3], bun: [-0.56, -0.4, -0.02, 0.2, 0.3], braid: [-0.42, -0.38, 0.0, 0.25, 0.32], twintails: [-0.5, -0.42, 0.05, 0.25, 0.32], topknot: [-0.46, -0.42, -0.02, 0.22, 0.32], wavy: [-0.5, -0.42, 0.32, 0.45, 0.5], pixie: [-0.4, -0.36, -0.06, 0.16, 0.28], sidepart: [-0.5, -0.32, 0.0, 0.28, 0.4], dreads: [-0.56, -0.42, -0.04, 0.15, 0.25], curly: [-0.46, -0.34, 0.06, 0.3, 0.4] }[st] || [-0.4, -0.36, 0.0, 0.3, 0.42];
  const angs = [0, 0.75, 1.45, 2.2, Math.PI];
  const fringe = st === "bob" || st === "long" || st === "twintails" || st === "wavy";
  const edge = a => {
    const aa = Math.abs(a);
    let k = 0; while (k < angs.length - 2 && aa > angs[k + 1]) k++;
    const t = (aa - angs[k]) / (angs[k + 1] - angs[k]), e = K[k] + (K[k + 1] - K[k]) * (t * t * (3 - 2 * t));
    const wave = aa < 1.2 ? (fringe ? 0.045 : 0.025) * Math.sin(aa * 11 + (a > 0 ? 0.6 : 0)) * (1 - aa / 1.2) : 0.02 * Math.sin(aa * 9);
    return Math.PI / 2 + e + wave;
  };
  return edge;
}
function gHairShell(P, hc, hr, st, thMin) {
  const edge = hairEdgeFn(st), t0 = thMin || 0;
  const nu = Math.max(16, sgK(40)), nv = Math.max(6, sgK(12));
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const phi = i / nu * Math.PI * 2, a = Math.atan2(Math.sin(phi - Math.PI / 2), Math.cos(phi - Math.PI / 2));
    const f = j / nv, th = t0 + (edge(a) - t0) * f;
    const x = -Math.cos(phi) * Math.sin(th), y = Math.cos(th), z = Math.sin(phi) * Math.sin(th);
    const vol = (t0 ? 0.05 : st === "spiky" ? 0.07 : st === "curly" ? 0.2 : st === "bob" || st === "wavy" ? 0.1 : 0.075) * (!t0 ? 1.35 : 1);
    const off = (vol + 0.03 * Math.cos(f * Math.PI / 2)) * (1 - 0.55 * f * f) + 0.012 * Math.sin(phi * 23) * f;
    const r = headRadial(P, x, y, z, false) * (1 + off);
    pos.push(x * r * hr * HEAD_SCALE[0], hc + y * r * hr * HEAD_SCALE[1], 0.005 + z * r * hr * HEAD_SCALE[2]);
    uv.push(i / nu, f);
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + nu + 1;
    if (j > 0 || t0) idx.push(a, b, a + 1);
    idx.push(a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function hairPoint(P, hc, hr, phi, th, off) {
  const x = -Math.cos(phi) * Math.sin(th), y = Math.cos(th), z = Math.sin(phi) * Math.sin(th);
  const r = headRadial(P, x, y, z, false) * (1 + off);
  return V3(x * r * hr * HEAD_SCALE[0], hc + y * r * hr * HEAD_SCALE[1], 0.005 + z * r * hr * HEAD_SCALE[2]);
}
function gHairLocks(P, hc, hr, st) {
  if (st === "spiky" || st === "mohawk" || st === "curly" || st === "dreads") return [];
  const edge = hairEdgeFn(st), out = [], fringe = st === "bob" || st === "long" || st === "twintails" || st === "wavy";
  const n = Math.max(10, sgK(24));
  for (let k = 0; k < n; k++) {
    const a = -Math.PI + (k + 0.5) / n * Math.PI * 2, phi0 = a + Math.PI / 2;
    const front = Math.abs(a) < 0.9;
    const e = edge(a), len = (front ? (fringe ? 0.13 : st === "sidepart" ? 0.13 : 0.09) : 0.12) * (st === "pixie" ? 0.6 : 1) * (0.75 + 0.5 * Math.abs(Math.sin(k * 2.7)));
    const sweep = st === "sidepart" && front ? 0.28 : st === "pixie" ? 0.12 * Math.sin(k * 2.3) : front && !fringe ? (a >= 0 ? 0.1 : -0.1) : 0.04 * Math.sin(k * 1.9);
    const w0 = Math.PI * 2 / n * 0.75, rows = 5;
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= rows; j++) {
      const t = j / rows, th = e - 0.34 + (0.34 + len) * t, w = w0 * (1 - t * 0.85), off = 0.09 - 0.06 * t;
      for (const sd of [-1, 0, 1]) {
        const p = hairPoint(P, hc, hr, phi0 + sweep * t * t + sd * w * 0.5, th, off + (sd ? -0.012 : 0.006));
        pos.push(p.x, p.y, p.z); uv.push(0.5 + sd * 0.25, t);
      }
    }
    for (let j = 0; j < rows; j++) for (let c = 0; c < 2; c++) { const a0 = j * 3 + c, b0 = a0 + 3; idx.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    out.push(g);
  }
  return out;
}

function gHairClumps(P, hc, hr, st) {
  if (st === "spiky" || st === "mohawk" || st === "curly" || st === "dreads") return [];
  const edge = hairEdgeFn(st), fringe = st === "bob" || st === "long" || st === "twintails" || st === "wavy";
  const n = st === "pixie" ? 14 : 12, rows = 4, pos = [], uv = [], idx = [];
  for (let k = 0; k < n; k++) {
    const a = -Math.PI + (k + 0.5) / n * Math.PI * 2, phi0 = a + Math.PI / 2, front = Math.abs(a) < 0.9;
    const e = edge(a), len = ((front ? (fringe || st === "sidepart" ? 0.15 : 0.1) : 0.14) * (st === "pixie" ? 0.65 : 1) * (0.8 + 0.4 * Math.abs(Math.sin(k * 2.7)))) * 1.3 + 0.02;
    const sweep = st === "sidepart" && front ? 0.32 : st === "pixie" ? 0.14 * Math.sin(k * 2.3) : front && !fringe ? (a >= 0 ? 0.12 : -0.12) : 0.05 * Math.sin(k * 1.9);
    const w0 = Math.PI * 2 / n * 1.12, base = pos.length / 3, u0 = k / n, du = 1 / n;
    for (let j = 0; j <= rows; j++) {
      const t = j / rows, th = e - 0.42 + (0.42 + len) * t, ph = phi0 + sweep * t * t, w = w0 * Math.pow(1 - t, 0.8) * 0.5;
      const lift = 0.13 - 0.085 * t, side = 0.075 - 0.05 * t;
      const ring = [hairPoint(P, hc, hr, ph - w, th, side), hairPoint(P, hc, hr, ph, th, lift), hairPoint(P, hc, hr, ph + w, th, side), hairPoint(P, hc, hr, ph, th, 0.015)];
      ring.forEach((q, i) => { pos.push(q.x, q.y, q.z); uv.push(u0 + du * [0.1, 0.5, 0.9, 0.5][i], t * 0.9); });
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < 4; i++) {
      const a0 = base + j * 4 + i, a1 = base + j * 4 + (i + 1) % 4, b0 = a0 + 4, b1 = a1 + 4;
      idx.push(a0, a1, b0, a1, b1, b0);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return [g];
}

function hairPieces(R, H, hc, hr, covered, tailBone, HP) {
  HP = HP || HEAD_PROFILES.human0;
  const TB = tailBone || "head";
  if (!H || H.style === "bald") return;
  const c = H.color, st = H.style;
  const top = V3(0, hc + 0.004, -0.004);
  if (st === "mohawk") {
    if (!covered) {
      R.add(gPartSphere(top, hr * 1.02, 0, Math.PI * 0.5, 1.0, 1.02, 1.02, 18), "head", c, "hair");
      for (let k = 0; k < 6; k++) { const a = -0.25 + k * 0.33, d = V3(0, Math.cos(a), -Math.sin(a)); const p0 = V3(0, hc, 0).addScaledVector(d, hr * 0.92); R.add(gTaper(p0, p0.clone().addScaledVector(d, hr * (0.5 + (k < 3 ? 0.15 * k : 0.15 * (5 - k)))), hr * 0.16, 0.01, 6, 0.35), "head", c, "hair"); }
    }
    return;
  }
  if (covered && st !== "mohawk" && st !== "spiky" && st !== "curly") {
    R.add(gHairShell(HP, hc, hr, st, Math.PI * 0.4), "head", c, "hair");
    for (const lk of gHairLocks(HP, hc, hr, st)) R.add(lk, "head", c, "hair");
  } else if (covered && (st === "spiky" || st === "curly")) R.add(gHairShell(HP, hc, hr, "short", Math.PI * 0.4), "head", c, "hair");
  if (!covered) {
    R.add(gHairShell(HP, hc, hr, st), "head", c, "hair");
    for (const lk of gHairClumps(HP, hc, hr, st)) R.add(lk, "head", c, "hair");
    if (st === "spiky") {
      const spikes = [[0, 1, 0.1], [0.5, 0.85, -0.25], [-0.5, 0.85, -0.25], [0.25, 0.6, -0.8], [-0.25, 0.6, -0.8], [0, 0.75, -0.6], [0.6, 0.5, 0.3], [-0.6, 0.5, 0.3], [0.2, 0.7, 0.55], [-0.2, 0.7, 0.55]];
      for (const [x, y, z] of spikes) {
        const d = V3(x, y, z).normalize();
        const a = V3(0, hc, 0).addScaledVector(d, hr * 0.98);
        const b = a.clone().addScaledVector(d, hr * 0.5).add(V3(0, -hr * 0.1, -hr * 0.12));
        R.add(gTaper(a, b, hr * 0.26, 0.006, 6, 0.6), "head", c, "hair");
      }
    }
    if (st === "bun") R.add(gBall(V3(0, hc + hr * 0.7, -hr * 0.75), hr * 0.42, 1, 1, 1, 10), "head", c, "hair");
    if (st === "topknot") { R.add(gBall(V3(0, hc + hr * 1.12, -hr * 0.1), hr * 0.3, 1, 1.25, 1, 10), "head", c, "hair"); R.add(gRing(V3(0, hc + hr * 0.92, -hr * 0.06), hr * 0.16, hr * 0.05, "y", 10), "head", 0x6a4a2a, "leather"); }
  }
  if (st === "braid") {
    R.add(gBall(V3(0, hc + hr * 0.05, -hr * 1.0), hr * 0.28, 1, 1, 1, 8), "head", c, "hair");
    for (let k = 0; k < 6; k++) R.add(gBall(V3((k % 2 ? 0.012 : -0.012), hc - hr * (0.25 + k * 0.32), -hr * (1.08 + k * 0.05)), hr * (0.24 - k * 0.022), 1, 1.25, 0.9, 8), TB, c, "hair");
    R.add(gRing(V3(0, hc - hr * 2.1, -hr * 1.4), hr * 0.11, hr * 0.04, "y", 8), TB, 0x8a2a2a, "cloth");
  }
  if (st === "twintails") for (const s of [-1, 1]) {
    R.add(gBall(V3(s * hr * 0.85, hc + hr * 0.25, -hr * 0.45), hr * 0.24, 1, 1, 1, 8), "head", c, "hair");
    R.add(gTaper(V3(s * hr * 0.95, hc + hr * 0.15, -hr * 0.55), V3(s * hr * 1.35, hc - hr * 1.5, -hr * 0.75), hr * 0.26, hr * 0.06, 8), TB, c, "hair");
  }
  if (st === "curly" && !covered) for (let k = 0; k < 60; k++) { const ph = k * 2.399, th = Math.acos(1 - (k + 0.5) / 60 * 1.15); if (Math.abs(Math.atan2(Math.sin(ph - Math.PI / 2), Math.cos(ph - Math.PI / 2))) < 0.7 && th > 0.9) continue; const p = hairPoint(HP, hc, hr, ph, th, 0.13); R.add(gBall(p, hr * 0.2, 1, 1, 1, 7), "head", c, "hair"); }
  if (st === "dreads") for (let k = 0; k < 16; k++) { const a = Math.PI / 2 + Math.PI * (0.35 + 1.3 * k / 15), p0 = hairPoint(HP, hc, hr, a, Math.PI / 2 + 0.1, 0.06), ln = hr * (1.4 + 0.3 * Math.sin(k * 1.7)); const out = V3(Math.sign(p0.x) * 0.15, 0, -0.3).normalize(); R.add(gTaper(p0, p0.clone().add(V3(out.x * hr * 0.3, -ln, out.z * hr * 0.4)), hr * 0.07, hr * 0.05, 6), Math.abs(a - Math.PI * 1.5) < 1.0 ? TB : "head", c, "hair"); }
  if (st === "long" || st === "wavy") {
    R.add(gBall(V3(0, hc - hr * 0.95, -hr * 0.66), hr * 0.85, 1.0, 1.75, 0.38, 12), TB, c, "hair");
    for (let k = 0; k < 7; k++) {
      const f = k / 6 - 0.5, ln = hr * (1.9 + 0.25 * Math.cos(k * 1.7));
      R.add(gTaper(V3(f * hr * 1.5, hc + hr * 0.1, -hr * 0.95), V3(f * hr * 1.9, hc + hr * 0.1 - ln, -hr * (0.95 + 0.12 * Math.abs(f))), hr * 0.26, hr * 0.05, 5, 0.3), TB, c, "hair");
    }
    if (st === "wavy") for (let k = 0; k < 8; k++) { const f = k / 7 - 0.5; let p = V3(f * hr * 1.7, hc - hr * 0.2, -hr * (0.95 + 0.1 * Math.abs(f))); for (let j = 0; j < 4; j++) { const q = p.clone().add(V3((j % 2 ? 1 : -1) * hr * 0.12, -hr * 0.45, -hr * 0.03)); R.add(gTaper(p, q, hr * (0.16 - j * 0.025), hr * (0.13 - j * 0.025), 5, 0.45), TB, c, "hair"); p = q; } }
  }
  if (st === "ponytail") {
    R.add(gBall(V3(0, hc + hr * 0.2, -hr * 0.98), hr * 0.3, 1, 1, 1, 8), "head", c, "hair");
    R.add(gTaper(V3(0, hc + hr * 0.15, -hr * 1.08), V3(0, hc - hr * 1.6, -hr * 1.35), hr * 0.3, hr * 0.08, 8), TB, c, "hair");
  }
}

function finPlane(pts, x) {
  const g = gMembrane(pts, 0);
  g.rotateZ(Math.PI / 2);
  g.translate(x || 0, 0, 0);
  return g;
}

function familyExtras(R, L, D) {
  const { hx, hipsY, chestY, spineY, shY, neckY, elY, wrY, knee, ank, sw, gi, hc, hr, skin, SKR, mid } = D;
  const F = L.family, bz = -(0.176 * 0.66 * gi * (sw / 0.195) * 1.04);
  const dark = shadeHex(skin, 0.55), sides = [[1, "L"], [-1, "R"]];
  if (F === "orc") {
    if (L.pauldrons != null) for (const [s, sd] of sides) for (let k = 0; k < 3; k++) {
      const a = V3(s * (sw + 0.03 - k * 0.025), shY + 0.05 - k * 0.012, 0.03 - k * 0.04);
      R.add(gTaper(a, a.clone().add(V3(s * 0.05, 0.09 - k * 0.015, -0.01)), 0.018 * gi, 0.002, 6), "upArm" + sd, 0xe8dcc0, "bone");
    }
    for (let k = 0; k < 9; k++) {
      const t = (k - 4) / 4, a = V3(t * 0.1 * gi, neckY - 0.045 - (1 - t * t) * 0.05, (0.1 - Math.abs(t) * 0.035) * gi + 0.035);
      R.add(gTaper(a, a.clone().add(V3(0, -0.04 - (1 - Math.abs(t)) * 0.015, 0.008)), 0.009, 0.002, 5), "chest", 0xf0e6cc, "bone");
    }
    R.add(gRing(V3(0, neckY - 0.06, 0.012), 0.11 * gi, 0.005, "y", 18, Math.PI, [0, -Math.PI / 2, 0]), "chest", 0x4a3020, "leather");
    for (const [s, sd] of sides) R.add(gBox(V3(s * (sw + 0.03), elY - 0.08, 0), 0.07 * gi, 0.12, 0.07 * gi), "foreArm" + sd, 0x4a3020, "leather");
  }
  if (F === "goblin") {
    R.add(gBox(V3(0.1 * gi, hipsY - 0.01, 0.1 * gi), 0.07, 0.08, 0.04, 0, 0.5, 0), "hips", 0x6a4a2a, "leather");
    R.add(gBox(V3(-0.11 * gi, hipsY - 0.02, 0.05 * gi), 0.05, 0.07, 0.035, 0, -0.9, 0), "hips", 0x5a3a20, "leather");
    R.add(gBall(V3(-0.11 * gi, hipsY - 0.08, 0.06 * gi), 0.022, 1, 1.2, 1, 6), "hips", 0xe8dcc0, "bone");
    for (const [s, sd] of sides) R.add(gBall(V3(s * hx, knee + 0.01, 0.05 * gi), 0.05 * gi, 1, 0.8, 0.6, 8), "shin" + sd, 0x5a3a20, "leather");
  }
  if (F === "reef") {
    const fc = L.finColor || 0x7ac0b0;
    R.add(finPlane([[neckY + 0.02, bz * 0.6], [neckY + 0.08, bz - 0.06], [chestY + 0.02, bz - 0.12], [spineY, bz - 0.08], [spineY - 0.04, bz + 0.02], [chestY, bz + 0.02], [neckY - 0.02, bz * 0.6 + 0.02]]), "chest", fc, "scale");
    for (const [s, sd] of sides) {
      R.add(finPlane([[elY - 0.01, 0], [elY + 0.04, -0.08], [mid, -0.1], [wrY + 0.03, -0.02], [wrY + 0.03, 0]], s * (sw + 0.05)), "foreArm" + sd, fc, "scale");
      for (let k = 0; k < 3; k++) R.add(gBox(V3(s * 0.052 * gi, neckY + 0.005 - k * 0.018, 0.0), 0.004, 0.006, 0.05), "neck", dark, "plain");
    }
  }
  if (F === "talon") {
    const fc = L.crest || 0x4a3a2a, lt = shadeHex(skin, 1.1);
    for (const [s, sd] of sides) for (let k = 0; k < 6; k++) {
      const y = elY + 0.02 - k * (elY - wrY + 0.03) / 6, a = V3(s * (sw + 0.03), y, -0.02);
      R.add(gTaper(a, a.clone().add(V3(s * 0.02, -0.16 - k * 0.02, -0.08 - k * 0.012)), 0.03, 0.006, 5, 0.25), "foreArm" + sd, k % 2 ? fc : lt, "feather");
    }
    for (let k = 0; k < 5; k++) {
      const t = (k - 2) / 2, a = V3(t * 0.04, hipsY - 0.02, bz * 0.9);
      R.add(gTaper(a, a.clone().add(V3(t * 0.14, -0.22 + Math.abs(t) * 0.06, -0.24)), 0.04, 0.008, 5, 0.25), "hips", k % 2 ? fc : lt, "feather");
    }
    for (const [s, sd] of sides) for (let k = 0; k < 3; k++) {
      const a = V3(s * hx + (k - 1) * 0.022, 0.02, 0.15);
      R.add(gTaper(a, a.clone().add(V3(s * (k - 1) * 0.02, -0.04, 0.07)), 0.012, 0.002, 5), "foot" + sd, 0x3a3020, "bone");
    }
  }
  if (F === "treant") {
    const bark = skin, leaf = L.leafHead || 0x6aa84a;
    for (const [s, sd] of sides) {
      const a = V3(s * sw * 0.9, shY + 0.02, -0.02), b = a.clone().add(V3(s * 0.12, 0.22, -0.05)), c = b.clone().add(V3(s * 0.08, 0.1, 0.04));
      R.add(gTaper(a, b, 0.03 * gi, 0.016, 6), "upArm" + sd, bark, "wood");
      R.add(gTaper(b, c, 0.016, 0.004, 5), "upArm" + sd, bark, "wood");
      R.add(gBall(c, 0.07, 1.2, 0.8, 1, 8), "upArm" + sd, leaf, "plain");
      const f0 = V3(s * (sw + 0.02), mid, 0), f1 = f0.clone().add(V3(s * 0.1, 0.06, 0.02));
      R.add(gTaper(f0, f1, 0.015, 0.003, 5), "foreArm" + sd, bark, "wood");
      R.add(gBall(f1, 0.04, 1, 0.8, 1, 6), "foreArm" + sd, leaf, "plain");
      for (let k = 0; k < 4; k++) {
        const ang = (k / 3 - 0.5) * 2.2 + (s > 0 ? 0.3 : -0.3), r0 = V3(s * hx, 0.04, 0.02);
        R.add(gTaper(r0, r0.clone().add(V3(Math.sin(ang) * 0.16, -0.07, Math.cos(ang) * 0.16)), 0.028, 0.004, 5), "foot" + sd, bark, "wood");
      }
      R.add(gBall(V3(s * sw * 0.6, shY + 0.01, 0.04), 0.06 * gi, 1.3, 0.35, 1, 8), "chest", 0x5a7a2a, "fur");
    }
    R.add(gBall(V3(0.04, chestY - 0.05, 0.13 * gi), 0.04, 1, 1.3, 0.4, 8), "chest", 0x1a120a, "plain");
  }
  if (F === "ghoul" || F === "undead") {
    const rag = L.top && L.top.color != null ? L.top.color : 0x3a3028;
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2, r = 0.15 * gi;
      R.add(gBox(V3(Math.sin(a) * r, hipsY - 0.1 - (k % 3) * 0.03, Math.cos(a) * r), 0.05, 0.2 + (k % 3) * 0.06, 0.008, 0, a, 0.05 * (k % 2 ? 1 : -1)), "hips", shadeHex(rag, 0.8 + (k % 3) * 0.1), "cloth");
    }
    if (F === "ghoul") for (let k = 0; k < 5; k++) R.add(gBall(V3(0, chestY + 0.06 - k * 0.07, bz - 0.005), 0.022, 1, 0.8, 0.8, 6), k < 3 ? "chest" : "spine", skin, SKR);
  }
  if (L.boss && L.banner) {
    const px = -0.06, pz = bz - 0.05, top = shY + 0.75;
    R.add(gTaper(V3(px, hipsY - 0.1, pz), V3(px, top, pz), 0.014, 0.012, 6), "chest", 0x4a3020, "wood");
    R.add(gBall(V3(px, top + 0.02, pz), 0.03, 1, 1, 1, 6), "chest", 0xd8b040, "metal");
    const fl = new THREE.PlaneGeometry(0.3, 0.42, 4, 6), fp = fl.attributes.position;
    for (let i = 0; i < fp.count; i++) { const x = fp.getX(i), y = fp.getY(i); fp.setXYZ(i, px + 0.16 + x, top - 0.25 + y, pz - 0.03 * Math.sin((x + 0.15) * 9) - (y < -0.15 ? 0.02 : 0)); }
    fl.computeVertexNormals();
    R.add(fl, "chest", L.banner, "cloth");
  }
}

function humanEntry(L) {
  const fem = L.build === 1;
  const pr = Object.assign({ leg: 0.86, torso: 0.52, headR: 0.138, shoulder: fem ? 0.165 : 0.195, hip: fem ? 0.1 : 0.095, arm: 0.6, girth: fem ? 0.9 : 1, neck: 0.02, waist: fem ? 0.8 : 0.92 }, L.prop || {});
  const R = new RigBuilder();
  const ank = 0.08, knee = ank + pr.leg * 0.5, hipJ = ank + pr.leg;
  const hipsY = hipJ + 0.03, spineY = hipsY + pr.torso * 0.28, chestY = hipsY + pr.torso * 0.62, neckY = hipsY + pr.torso, headY = neckY + pr.neck;
  const shY = neckY - 0.05, elY = shY - pr.arm * 0.47, wrY = shY - pr.arm * 0.9;
  const sw = pr.shoulder, gi = pr.girth;
  R.bone("root", null, 0, 0, 0);
  R.bone("hips", "root", 0, hipsY, 0);
  R.bone("spine", "hips", 0, spineY, 0);
  R.bone("chest", "spine", 0, chestY, 0);
  R.bone("neck", "chest", 0, neckY, 0);
  R.bone("head", "neck", 0, headY, 0);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) {
    R.bone("upArm" + sd, "chest", s * sw, shY, 0);
    R.bone("foreArm" + sd, "upArm" + sd, s * (sw + 0.01), elY, 0);
    R.bone("hand" + sd, "foreArm" + sd, s * (sw + 0.02), wrY, 0);
    if (!L.skull) { R.bone("fingers" + sd, "hand" + sd, s * (sw + 0.024), wrY - 0.078 * gi * (L.doll ? 1.25 : 1), 0); R.bone("thumb" + sd, "hand" + sd, s * (sw + 0.016), wrY - 0.022 * gi * (L.doll ? 1.25 : 1), 0.03); }
    R.bone("thigh" + sd, "hips", s * pr.hip, hipJ, 0);
    R.bone("shin" + sd, "thigh" + sd, s * pr.hip, knee, 0.01);
    R.bone("foot" + sd, "shin" + sd, s * pr.hip, ank, 0);
  }
  const skin = L.skin, SKR = L.skinRegion || "skin";
  if (L.cactus) return cactusBody(R, L, { hipsY, spineY, chestY, neckY, headY, shY, elY, wrY, sw, hipJ, knee, ank, pr });
  const top = L.top || { type: "shirt", color: 0x8a7a60 };
  const topC = top.color, topR = top.region || "cloth";
  const legC = L.legs != null ? L.legs : 0x4a3a2c, legR = L.legsRegion || "cloth";
  const sleeves = top.sleeves || (top.type === "robe" ? "wide" : top.type === "fur" ? "none" : "long");
  const sleeveC = top.type === "vest" ? (top.under || 0xd8cfb8) : top.type === "tabard" ? (top.region === "cloth" ? topC : 0x9aa0a8) : top.type === "apron" ? topC : top.type === "fur" ? skin : topC;
  const sleeveR = top.type === "vest" ? "cloth" : top.type === "tabard" ? (top.region === "cloth" ? "cloth" : "chain") : topR;
  const hr = pr.headR, hc = headY + hr * 0.82;
  if (!L.head && L.hat) L.head = { type: "feathered", color: L.hat, color2: 0xd8c070 };
  const headCovers = L.head && ["cap", "helm", "horned", "hood", "pointy", "feathered", "furhat", "widebrim", "winged", "kabuto", "tricorne", "beret", "turban", "jester", "mortar", "ninjahood"].includes(L.head.type);

  const HP = headProfile(L);
  const faceIx = ((L.face || 0) % FACE_PAINTS) + (L.build === 1 ? FACE_PAINTS : 0), faceReg = L.noFace ? (L.headRegion || SKR) : L.ears === "ursan" ? "face" + (17 + (L.face || 0) % 8) : L.doll ? "face" + (25 + (L.face || 0) % 8) : (faceIx ? "face" + (faceIx + 1) : "face");
  if (!L.noFace && !L.skull) {
    const jy = hc - hr * 0.25;
    R.bone("jaw", "head", 0, jy, -hr * 0.1);
    const mb = Math.PI / 2 + 0.437, mp = V3(0, hc + Math.cos(mb) * headRadial(HP, 0, Math.cos(mb), Math.sin(mb), true) * hr * HEAD_SCALE[1], 0.005 + Math.sin(mb) * headRadial(HP, 0, Math.cos(mb), Math.sin(mb), true) * hr * HEAD_SCALE[2]);
    R.bone("mouth", "head", mp.x, mp.y, mp.z);
    R.addW(gHead(HP, hc, hr), "head", skin, faceReg, (x, y, z) => {
      const qx = x / (hr * HEAD_SCALE[0]), qy = (y - hc) / (hr * HEAD_SCALE[1]), qz = (z - 0.005) / (hr * HEAD_SCALE[2]), l = Math.hypot(qx, qy, qz) || 1;
      const b = -Math.asin(clamp(qy / l, -1, 1)), a = Math.atan2(qx, qz);
      const w = smoothRange(0.44, 0.58, b) * smoothRange(1.3, 0.7, Math.abs(a));
      return w > 0.001 ? [["head", 1 - w], ["jaw", w]] : [["head", 1]];
    });
    const phis = [], ths = [];
    for (let i = 0; i <= 6; i++) phis.push(Math.PI / 2 - 0.14 + 0.28 * i / 6);
    for (let j = 0; j <= 3; j++) ths.push(mb - 0.05 + 0.1 * j / 3);
    R.add(gHeadPatch(HP, hc, hr, phis, ths, 0.006, true), "mouth", 0x3a1210, "plain");
  } else R.add(gHead(HP, hc, hr), "head", skin, faceReg);
  if (L.nose === "goblin") R.add(gTaper(V3(0, hc - hr * 0.05, hr * 0.8), V3(0, hc - hr * 0.42, hr * 1.75), hr * 0.2, hr * 0.05, 8), "head", skin, SKR);
  const earBone = s => { const n = "ear" + (s > 0 ? "L" : "R"); if (!R.byName[n]) R.bone(n, "head", s * hr * (L.ears === "cat" ? 0.55 : 0.88), hc + hr * (L.ears === "cat" ? 0.72 : 0.0), -hr * 0.05); return n; };
  for (const s of [-1, 1]) {
    if (L.ears === "goblin") R.add(gTaper(V3(s * hr * 0.8, hc + hr * 0.05, -0.02), V3(s * (hr + 0.24), hc + hr * 0.75, -0.1), hr * 0.32, 0.005, 6, 0.45), "head", skin, SKR);
    else if (L.ears === "elf") R.add(gTaper(V3(s * hr * 0.8, hc - hr * 0.06, -hr * 0.06), V3(s * (hr + 0.1), hc + hr * 0.45, -hr * 0.42), hr * 0.2, 0.004, 8, 0.4), earBone(s), skin, SKR);
    else if (L.ears === "ursan") R.add(gTaper(V3(s * hr * 0.9, hc - hr * 0.05, -hr * 0.12), V3(s * (hr + 0.04), hc + hr * 0.08, -hr * 0.3), hr * 0.13, 0.006, 6, 0.4), "head", skin, SKR);
    else if (L.ears === "pip") R.add(gTaper(V3(s * hr * 0.84, hc - hr * 0.08, -0.01), V3(s * (hr + 0.12), hc + hr * 0.12, -hr * 0.12), hr * 0.24, 0.006, 6, 0.42), earBone(s), skin, SKR);
    else if (L.ears === "cat") { if (!(L.head && ["helm", "hood", "horned", "winged", "kabuto", "turban", "ninjahood", "jester"].includes(L.head.type))) { const eb = earBone(s); R.add(gTaper(V3(s * hr * 0.5, hc + hr * 0.7, -hr * 0.05), V3(s * hr * 0.74, hc + hr * 1.5, -hr * 0.12), hr * 0.3, 0.006, 4, 0.5), eb, L.hair.color, "hair"); R.add(gTaper(V3(s * hr * 0.52, hc + hr * 0.78, -hr * 0.01), V3(s * hr * 0.7, hc + hr * 1.32, -hr * 0.06), hr * 0.17, 0.004, 4, 0.35), eb, 0xd89a9a, "skin"); } }
    else if (L.ears === "fin") R.add(gBall(V3(s * hr * 0.9, hc + hr * 0.05, -hr * 0.1), hr * 0.45, 0.15, 1.1, 0.8, 8), "head", L.finColor || skin, "scale");
    else if (!L.skull && L.ears !== "none") R.add(gBall(V3(s * hr * 0.88, hc - hr * 0.08, -hr * 0.08), hr * 0.2, 0.4, 1.05, 0.7, 10), "head", skin, SKR);
    if (!L.skull && !L.doll && L.ears !== "none" && L.ears !== "cat" && L.ears !== "fin" && L.ears !== "ursan") {
      const ik = shadeHex(skin, 0.74);
      if (L.ears === "elf") R.add(gTaper(V3(s * hr * 0.84, hc - hr * 0.04, -hr * 0.1), V3(s * (hr + 0.06), hc + hr * 0.3, -hr * 0.38), hr * 0.1, 0.003, 6, 0.4), earBone(s), ik, SKR);
      else if (L.ears === "pip") R.add(gTaper(V3(s * hr * 0.86, hc - hr * 0.06, -hr * 0.03), V3(s * (hr + 0.08), hc + hr * 0.1, -hr * 0.12), hr * 0.12, 0.004, 6, 0.4), earBone(s), ik, SKR);
      else if (L.ears === "goblin") R.add(gTaper(V3(s * hr * 0.82, hc + hr * 0.04, -0.03), V3(s * (hr + 0.18), hc + hr * 0.6, -0.1), hr * 0.14, 0.004, 6, 0.45), "head", ik, SKR);
      else R.add(gBall(V3(s * hr * 0.93, hc - hr * 0.08, -hr * 0.05), hr * 0.1, 0.4, 1.05, 0.7, 8), "head", ik, SKR);
    }
    if (L.tusks) R.add(gTaper(V3(s * hr * 0.35, hc - hr * 0.55, hr * 0.75), V3(s * hr * 0.45, hc - hr * 0.1, hr * 0.95), hr * 0.1, 0.004, 6), "head", 0xf0e8d0, "bone");
    if (L.needles) for (let k = 0; k < 4; k++) R.add(gTaper(V3(s * hr * (0.3 + k * 0.2), hc + hr * (0.9 - k * 0.35), hr * 0.3 - k * 0.1), V3(s * hr * (0.5 + k * 0.3), hc + hr * (1.4 - k * 0.5), hr * 0.3 - k * 0.1), 0.012, 0.002, 4), "head", 0xf0f0d8, "bone");
    if (L.eyesGlow && !L.cactus) {
      const ea = FACE_PX.eyeA * 1.15, eb = FACE_PX.eyeB + 0.02, dx = Math.sin(ea) * Math.cos(eb), dy = -Math.sin(eb), dz = Math.cos(ea) * Math.cos(eb), rr = headRadial(HP, dx, dy, dz, true) * hr;
      const ep = V3(s * Math.abs(dx) * rr * HEAD_SCALE[0], hc + dy * rr * HEAD_SCALE[1], 0.005 + dz * rr * HEAD_SCALE[2]);
      if (L.skull) {
        R.add(gBall(ep.clone().add(V3(0, 0, -hr * 0.06)), hr * 0.17, 1.1, 1, 0.6, 10), "head", 0x0c0806, "plain");
        R.add(gBall(ep.clone().add(V3(0, 0, -hr * 0.05)), hr * 0.07, 1.3, 0.75, 0.5, 8), "head", L.eyesGlow, "glow", true);
      } else if (L.claws) {
        R.add(gBall(ep.clone().add(V3(0, 0, -hr * 0.02)), hr * 0.1, 1.3, 0.75, 0.5, 8), "head", L.eyesGlow, "glow", true);
      } else {
        R.add(gBall(ep.clone(), hr * 0.17, 1.15, 0.9, 0.6, 10), "head", 0xf2ecd0, "plain");
        R.add(gBall(ep.clone().add(V3(0, 0, hr * 0.07)), hr * 0.12, 1, 1, 0.5, 8), "head", L.eyesGlow, "glow", true);
        R.add(gBall(ep.clone().add(V3(0, 0, hr * 0.1)), hr * 0.06, 0.8, 1.1, 0.5, 6), "head", 0x0a0806, "plain");
      }
    }
  }
  if (L.beak) { R.add(gTaper(V3(0, hc - hr * 0.1, hr * 0.8), V3(0, hc - hr * 0.3, hr * 1.9), hr * 0.3, 0.01, 8, 0.8), "head", L.beak, "bone"); R.add(gTaper(V3(0, hc - hr * 0.35, hr * 0.8), V3(0, hc - hr * 0.35, hr * 1.5), hr * 0.18, 0.01, 6, 0.8), "head", new THREE.Color(L.beak).multiplyScalar(0.7).getHex(), "bone"); }
  if (L.crest) for (let k = 0; k < 5; k++) R.add(gBall(V3((k - 2) * hr * 0.25, hc + hr * (0.9 + 0.15 * (2 - Math.abs(k - 2))), -hr * 0.3 - k * 0.02), hr * 0.22, 0.5, 1.6 + 0.4 * (2 - Math.abs(k - 2)), 0.5, 6), "head", L.crest, "feather");
  if (L.leafHead) { for (let k = 0; k < 7; k++) { const a = k * 0.9, rr = hr * 0.75; R.add(gBall(V3(Math.cos(a) * rr, hc + hr * 0.9 + (k % 2) * hr * 0.25, Math.sin(a) * rr), hr * 0.55, 1, 0.8, 1, 8), "head", L.leafHead, "plain"); } R.add(gBall(V3(0, hc + hr * 1.3, 0), hr * 0.6, 1, 0.8, 1, 8), "head", L.leafHead, "plain"); }
  if (L.skull) {
    const jy = hc - hr * 0.86, jz = hr * 0.12;
    R.add(gRing(V3(0, jy, jz), hr * 0.5, hr * 0.09, "y", 16, Math.PI, null), "head", skin, "bone");
    R.add(gBox(V3(0, jy - hr * 0.02, jz + hr * 0.52), hr * 0.32, hr * 0.2, hr * 0.12), "head", skin, "bone");
    for (const s of [-1, 1]) R.add(gTaper(V3(s * hr * 0.5, jy, jz), V3(s * hr * 0.6, hc - hr * 0.25, -hr * 0.08), hr * 0.1, hr * 0.07, 6, 0.55), "head", skin, "bone");
    R.add(gTaper(V3(0, hc - hr * 0.08, hr * 0.86), V3(0, hc - hr * 0.3, hr * 0.92), hr * 0.02, hr * 0.12, 3, 0.5), "head", 0x0c0806, "plain");
    for (let k = 0; k < 10; k++) { const t = (k + 0.5) / 10 * Math.PI, rr = hr * 0.47; R.add(gBox(V3(Math.cos(t) * rr * 0.95, jy + hr * 0.13, jz + Math.sin(t) * rr), hr * 0.08, hr * 0.12, hr * 0.06, 0, Math.PI / 2 - t, 0), "head", 0xf4efe0, "bone"); }
    for (let k = 0; k < 10; k++) { const t = (k + 0.5) / 10 * Math.PI, rr = hr * 0.49; R.add(gBox(V3(Math.cos(t) * rr * 0.95, hc - hr * 0.6, jz + Math.sin(t) * rr + hr * 0.02), hr * 0.08, hr * 0.12, hr * 0.06, 0, Math.PI / 2 - t, 0), "head", 0xf4efe0, "bone"); }
  }
  if (L.beard) {
    R.add(warpToHead(gFront(V3(0, hc, 0.005), hr * 1.06, 3.1, Math.PI * 0.62, Math.PI * 0.95, HEAD_SCALE[0], HEAD_SCALE[1], HEAD_SCALE[2], 16), HP, hc, hr), "head", L.beard, "hair");
    { const ml = []; for (const s of [-1, 1]) { const a = s * 0.09, b0 = 0.385; const p0 = hairPoint(HP, hc, hr, Math.PI / 2 + a * 0.4, Math.PI / 2 + b0 - 0.02, 0.05), p1 = hairPoint(HP, hc, hr, Math.PI / 2 + s * 0.24, Math.PI / 2 + b0 + 0.07, 0.04); R.add(gTaper(p0, p1, hr * 0.07, hr * 0.02, 6), "head", L.beard, "hair"); } }
    if (L.longBeard) R.add(gBall(V3(0, hc - hr * 1.2, hr * 0.6), hr * 0.5, 0.9, 1.6, 0.55, 10), "head", L.beard, "hair");
  }
  const tailed = L.hair && ["long", "ponytail", "braid", "twintails", "wavy", "dreads"].includes(L.hair.style);
  if (tailed) R.bone("hairTail", "head", 0, hc + hr * 0.15, -hr * 0.95);
  hairPieces(R, L.hair, hc, hr, headCovers, tailed ? "hairTail" : null, HP);
  if (!L.noFace) {
    R.bone("lids", "head", 0, hc, 0.005);
    for (const s of [-1, 1]) {
      R.add(gLid(HP, hc, hr, s), "lids", skin, SKR);
    }
  }

  const BODY = {};
  const shellOf = (rs, off) => rs.map(r => Object.assign({}, r, { rx: r.rx + off, rz: r.rz + off }));
  if (!L.skull) {
    R.add(gTaper(V3(0, neckY - 0.06, -0.006), V3(0, headY + 0.03, 0.008), (fem ? 0.056 : 0.064) * gi, (fem ? 0.046 : 0.054) * gi, 14), "neck", skin, SKR);
    const W = sw / 0.195;
    const robe = top.type === "robe" || top.type === "coat";
    const hipR = fem ? 0.165 : 0.152, waistR = 0.15 * pr.waist, beltY = hipsY + 0.03;
    const hx0 = gi * (fem ? 1.08 : 1.0), cx0 = Math.min(gi, 1.04) * W, cx1 = Math.min(gi, 1.1) * W * 1.04, hz = 0.7 * gi, cz = 0.67 * gi;
    const ring = (y, r, xs, zs, f, b, z, p) => ({ y, rx: r * xs, rz: r * zs, f, b, z: z || 0, p: p || 2.1 });
    const lowR = [ring(hipJ - 0.078, 0.045, hx0, hz, 1, 1), ring(hipJ - 0.06, 0.11, hx0, hz, 0.95, 1.08, -0.004), ring(hipJ - 0.02, hipR * 0.95, hx0, hz, 0.95, 1.16, -0.006), ring(hipJ + 0.015, hipR * 0.99, hx0, hz, 0.97, 1.12, -0.004), ring(beltY, hipR, hx0, hz, 1, 1.04)];
    const bust = fem ? 0.16 : 0.08;
    const upR = [ring(beltY, hipR, hx0, hz, 1, 1.04), ring(spineY, hipR * 0.95, (hx0 + cx0) / 2, (hz + cz) / 2, 1.04, 0.95), ring((spineY + chestY) / 2, waistR * 0.93, cx0 * 0.95, cz, 1.06, 0.92), ring(chestY - 0.04, 0.155, cx0, cz, 1.06 + bust * 0.4, 0.97), ring(chestY + 0.03, 0.172, cx1 * 1.03, cz, 1.06 + bust, 1.02), ring(chestY + 0.08, 0.18, cx1 * 1.06, cz, 1.0 + bust * 0.3, 1.05), ring(shY - 0.025, 0.17, cx1 * 1.04, cz * 0.95, 0.97, 1.03, 0, 2.1), ring(shY - 0.002, 0.148, cx1 * 1.0, cz * 0.9, 0.94, 1.02, -0.004, 2.0), ring(shY + 0.022, 0.112, cx1 * 0.94, cz * 0.88, 0.92, 1.0, -0.006, 2.0), ring(neckY - 0.024, 0.084, cx1 * 0.86, cz * 0.92, 0.9, 0.95, -0.006, 2.0), ring(neckY + 0.012, 0.066, gi * (fem ? 0.86 : 1), gi * 0.95, 1, 1, -0.006, 2)];
    const tw = (x, y) => blendW(y, [[0, "hips", 0], [spineY, "spine", 0.05], [chestY, "chest", 0.06], [neckY - 0.005, "neck", 0.02]]);
    R.addW(gLoft(lowR, 24, true, false, 0, 0.3), "hips", robe ? topC : legC, robe ? topR : legR, tw);
    R.addW(gLoft(upR, 24, false, false, 0.3, 1), "chest", topC, topR, tw);
    BODY.up = upR; BODY.tw = tw;
    const UW = L.under || {}, wht = 0xf4f2ec;
    if (UW.low === "boxer" || UW.low === "brief") {
      const sh = shellOf(lowR, 0.006);
      R.addW(gLoft(sh, 24, true, false, 0, 0.3), "hips", wht, "cloth", tw);
      R.add(gRing(V3(0, beltY + 0.004, 0), hipR * hx0 + 0.008, 0.008, "y", 22).scale(1, 1, hz / hx0 * 1.02), "hips", wht, "cloth");
    } else if (UW.low === "thong") {
      R.add(gRing(V3(0, beltY - 0.012, 0), hipR * hx0 + 0.004, 0.0055, "y", 22).scale(1, 1, hz / hx0 * 1.02), "hips", wht, "cloth");
      R.add(gBall(V3(0, hipJ - 0.005, hipR * hz * 0.98), 0.05, 1.1, 1.25, 0.28, 10), "hips", wht, "cloth");
      R.add(gTaper(V3(0, beltY - 0.012, -hipR * hz * 1.02), V3(0, hipJ - 0.05, -hipR * hz * 0.96), 0.007, 0.0045, 6), "hips", wht, "cloth");
    }
    if (UW.top === "bikini") {
      const cz1 = cz * 0.172 * (1.06 + bust) * 0.8;
      for (const xs of [-1, 1]) R.add(gBall(V3(xs * 0.052 * gi, chestY + 0.025, cz1), 0.05, 0.95, 0.85, 0.55, 10), "chest", wht, "cloth");
      R.add(gRing(V3(0, chestY - 0.012, 0), 0.172 * cx1 * 1.0 + 0.004, 0.0045, "y", 22).scale(1, 1, cz / cx1 * 1.08), "chest", wht, "cloth");
      for (const xs of [-1, 1]) R.add(gTaper(V3(xs * 0.05 * gi, chestY + 0.065, cz1 * 0.92), V3(xs * 0.03, neckY - 0.01, -0.02), 0.0045, 0.0045, 6), "chest", wht, "cloth");
    } else if (UW.top === "bandeau") {
      R.add(gRing(V3(0, chestY + 0.02, 0), 0.172 * cx1 + 0.006, 0.02, "y", 22).scale(1, 1, cz / cx1 * 1.08), "chest", wht, "cloth");
    }
  } else {
    R.add(gTaper(V3(0, neckY - 0.05, 0), V3(0, headY + 0.03, 0), 0.025, 0.025, 6), "neck", skin, "bone");
    for (let i = 0; i < 6; i++) R.add(gBall(V3(0, hipsY + i * (neckY - hipsY) / 6, -0.04), 0.03, 1.2, 0.7, 1, 6), i < 2 ? "spine" : "chest", skin, "bone");
    for (let i = 0; i < 4; i++) R.add(gRing(V3(0, chestY + 0.08 - i * 0.055, 0.0), 0.12 - i * 0.008, 0.012, "y", 16, Math.PI * 1.5, [0, -Math.PI * 0.25 + Math.PI, 0]), "chest", skin, "bone");
    R.add(gRing(V3(0, hipsY - 0.02, 0), 0.11, 0.025, "y", 14), "hips", skin, "bone");
  }

  for (const [s, sd] of [[1, "L"], [-1, "R"]]) {
    const ax = s * sw, ex = s * (sw + 0.01), wx = s * (sw + 0.02), mid = (elY + wrY) / 2;
    const bare = sleeves === "none" || L.skull;
    const armR = L.skull ? 0.022 : 0.05 * gi * (L.ears === "ursan" ? 1.3 : 1);
    const upC = bare ? skin : sleeveC, upR = L.skull ? "bone" : bare ? "skin" : sleeveR;
    const longS = !bare && (sleeves === "long" || sleeves === "wide");
    const fa1C = longS ? sleeveC : (L.skull ? skin : skin), fa1R = longS ? sleeveR : (L.skull ? "bone" : SKR);
    const fa2C = L.gloves != null ? L.gloves : fa1C, fa2R = L.gloves != null ? (L.glovesRegion || "leather") : fa1R;
    if (L.skull) {
      R.add(gTaper(V3(ax, shY - 0.02, 0), V3(ex, elY, 0), armR * 1.04, armR * 0.82, 10), "upArm" + sd, upC, upR);
      R.add(gBall(V3(ex, elY, 0), 0.03, 1, 1, 1, 8), "foreArm" + sd, upC, upR);
      R.add(gTaper(V3(ex, elY, 0), V3(ex, mid, 0), 0.02, 0.02, 10), "foreArm" + sd, fa1C, fa1R);
      R.add(gTaper(V3(ex, mid, 0), V3(wx, wrY + 0.01, 0), 0.02, 0.018, 10), "foreArm" + sd, fa2C, fa2R);
    } else {
      const axX = y => y >= elY ? ax + (ex - ax) * (shY - y) / (shY - elY) : ex + (wx - ex) * (elY - y) / (elY - wrY);
      const ar = (y, r, f, b, p) => ({ y, x: axX(Math.min(y, shY)), rx: r * gi, rz: r * gi, f: f || 1, b: b || 1, p: p || 2 });
      const aw = (x, y) => y > shY - 0.03 ? [["upArm" + sd, 1 - 0.3 * smoothRange(shY - 0.03, shY + 0.02, y)], ["chest", 0.3 * smoothRange(shY - 0.03, shY + 0.02, y)]] : blendW(y, [[0, "foreArm" + sd, 0], [elY, "upArm" + sd, 0.035]]).map(([n, w]) => [n, w]);
      const awFix = (x, y, z) => { const w = aw(x, y); return y < elY + 0.035 && y > elY - 0.035 ? w : w; };
      const tuck = (rg, k) => Object.assign(rg, { x: rg.x - s * k }); const upRings = [tuck(ar(shY + 0.004, 0.022), 0.024), tuck(ar(shY - 0.006, 0.044), 0.016), tuck(ar(shY - 0.024, 0.055), 0.007), ar(shY - 0.045, 0.057, 1.02, 1.0), ar(shY - 0.085, 0.052), ar((shY + elY) / 2 - 0.01, 0.05, 1.12, 0.98), ar(elY + 0.035, 0.044), ar(elY, 0.042, 1, 1.08)];
      const fa1 = [ar(elY, 0.042, 1, 1.08), ar(elY - 0.03, 0.045, 1.05, 1.0), ar(elY - 0.07, 0.043), ar(mid, 0.039)];
      const WK = 1.16, fa2 = [ar(mid, 0.039), ar((mid + wrY) / 2, 0.035 * 1.06), ar(wrY + 0.018, 0.031 * WK, 1, 1, 2.4), ar(wrY - 0.004, 0.03 * WK, 1, 1, 2.4)];
      const flip = rs => rs.slice().reverse();
      const armW = (x, y, z) => y < elY - 0.035 ? [["foreArm" + sd, 1]] : awFix(x, y, z);
      R.addW(gLoft(flip(upRings), 16, true, false, 0, 0.5), "upArm" + sd, upC, upR, armW);
      R.addW(gLoft(flip(fa1), 16, false, false, 0.5, 0.75), "foreArm" + sd, fa1C, fa1R, armW);
      R.addW(gLoft(flip(fa2), 16, false, false, 0.75, 1), "foreArm" + sd, fa2C, fa2R, (x, y, z) => y < wrY + 0.004 ? [["foreArm" + sd, 0.6], ["hand" + sd, 0.4]] : [["foreArm" + sd, 1]]);
      BODY["arm" + sd] = { up: upRings, fa1, fa2, w: armW };
    }
    if (sleeves === "wide" && !bare) {
      R.add(gCyl(V3(ex, wrY + 0.07, 0), 0.05 * gi, 0.085 * gi, 0.16, 14, true), "foreArm" + sd, sleeveC, sleeveR);
      if (top.trim) R.add(gRing(V3(ex, wrY - 0.01, 0), 0.085 * gi, 0.012, "y", 18), "foreArm" + sd, top.trim, "trim", !!top.glowTrim);
    } else if (longS) {
      R.add(gCyl(V3(wx, wrY + 0.034, 0), 0.041 * gi, 0.06 * gi, 0.075, 12, true), "foreArm" + sd, sleeveC, sleeveR);
      if (top.trim) R.add(gRing(V3(wx, wrY - 0.003, 0), 0.06 * gi, 0.01, "y", 14), "foreArm" + sd, top.trim, "trim");
    }
    if (s > 0 && !bare && !L.skull && top.type !== "robe" && top.type !== "fur") R.add(gCyl(V3(0, shY + 0.03, 0.004), 0.086 * gi, 0.072 * gi, 0.045, 14, true), "chest", sleeveC, sleeveR);
    const handC = L.gloves != null ? L.gloves : skin, handR = L.gloves != null ? (L.glovesRegion || "leather") : (L.skull ? "bone" : SKR);
    if (L.skull) {
      R.add(gBall(V3(s * (sw + 0.025), wrY - 0.055, 0.005), 0.03, 0.75, 1.15, 0.55, 10), "hand" + sd, handC, handR);
      R.add(gBall(V3(s * (sw + 0.005), wrY - 0.035, 0.035), 0.018, 1, 1.6, 1, 6), "hand" + sd, handC, handR);
    } else {
      const hk = gi * (L.doll ? 1.25 : 1) * 1.18, hx = s * (sw + 0.024), fb = "fingers" + sd, tb = "thumb" + sd;
      R.add(gBall(V3(hx, wrY - 0.012, 0.004), 0.026 * hk, 0.7, 0.75, 1.0, 10), "hand" + sd, handC, handR);
      R.add(gBox(V3(hx, wrY - 0.045 * hk, 0.004), 0.022 * hk, 0.06 * hk, 0.072 * hk), "hand" + sd, handC, handR);
      R.add(gBall(V3(hx, wrY - 0.045 * hk, 0.004), 0.038 * hk, 0.36, 0.95, 1.0, 10), "hand" + sd, handC, handR);
      const ky = wrY - 0.078 * hk;
      R.add(gBall(V3(hx - s * 0.003 * hk, ky - 0.008 * hk, 0.004), 0.03 * hk, 0.44, 0.62, 0.95, 8), fb, handC, handR);
      R.add(gBall(V3(hx - s * 0.011 * hk, ky - 0.034 * hk, 0.004), 0.028 * hk, 0.4, 0.92, 0.88, 8), fb, handC, handR);
      const u0 = V3(hx - s * 0.008 * hk, wrY - 0.024 * hk, 0.03 * hk), u1 = V3(hx - s * 0.02 * hk, wrY - 0.064 * hk, 0.054 * hk);
      R.add(gTaper(u0, u1, 0.013 * hk, 0.01 * hk, 6), tb, handC, handR);
      R.add(gBall(u1, 0.0105 * hk, 1, 1, 1, 5), tb, handC, handR);
    }
    if (L.held && !L.skull && (L.held === "ledger" || L.held === "book" || L.held === "scroll" || L.held === "basket" ? sd === "L" : sd === "R")) heldProp(R, L.held, sd, s * (sw + 0.024), wrY, gi * (L.doll ? 1.25 : 1));
    if (L.claws) for (let k = -1; k <= 1; k++) R.add(gTaper(V3(s * (sw + 0.025) + k * 0.015, wrY - 0.09, 0.01), V3(s * (sw + 0.03) + k * 0.02, wrY - 0.19, 0.05), 0.01, 0.002, 5), "hand" + sd, 0xd8d0b8, "bone");
    if (L.pauldrons) {
      const A = BODY["arm" + sd];
      if (A) {
        const cap = shellOf(A.up.slice(0, 4), 0.02 * gi).map((r, i) => Object.assign(r, { rx: r.rx * (i ? 1.12 : 1), rz: r.rz * 1.05 }));
        R.addW(gLoft(cap.slice().reverse(), 16, false, true, 0, 0.4), "upArm" + sd, L.pauldrons, "metal", A.w);
        for (let k = 0; k < 2; k++) { const rr = A.up[3 + k]; R.addW(gRing(V3(rr.x, rr.y - 0.004, 0), rr.rx + 0.022 * gi - k * 0.004, 0.009, "y", 16), "upArm" + sd, k ? L.pauldrons : 0xc8a040, "metal", A.w); }
      } else R.add(gPartSphere(V3(ax * 1.01, shY - 0.012, 0), 0.068 * gi, 0, Math.PI * 0.55, 1.12, 0.75, 1.0, 14), "upArm" + sd, L.pauldrons, "metal");
      if (L.padK > 1) {
        const pk = L.padK, pc = V3(s * (sw + 0.02 * pk), shY + 0.012 * pk, 0), pr2 = L.padRegion || "metal";
        R.add(gPartSphere(pc, 0.07 * gi * pk, 0, Math.PI * 0.5, 1.1, 0.72, 1.05, 12), "upArm" + sd, L.pauldrons, pr2);
        R.add(gRing(V3(pc.x, pc.y - 0.002, 0), 0.07 * gi * pk * 1.08, 0.008 * pk, "y", 14, 0, [0, 0, s * 0.35]).scale(1, 1, 1.02), "upArm" + sd, L.padTrim || 0xc8a040, pr2 === "metal" ? "metal" : "trim");
        if (L.padSpikes) for (let k = 0; k < L.padSpikes; k++) { const a = V3(pc.x + s * 0.01, pc.y + 0.03 * pk, (k - (L.padSpikes - 1) / 2) * 0.045); R.add(gTaper(a, a.clone().add(V3(s * 0.05 * pk, 0.08 * pk, 0)), 0.016 * pk, 0.002, 5), "upArm" + sd, L.padSpikeC || L.pauldrons, "metal"); }
      }
    }
    if (L.gauntlets && !L.skull) {
      const gc = L.gloves != null ? L.gloves : 0x8a9098, A = BODY["arm" + sd];
      if (A) { const vb = shellOf(A.fa1.slice(1).concat(A.fa2.slice(1)), 0.011 * gi); R.addW(gLoft(vb.slice().reverse(), 14, false, false, 0, 1), "foreArm" + sd, gc, "metal", A.w); R.addW(gRing(V3(vb[0].x, vb[0].y, 0), vb[0].rx + 0.004, 0.007, "y", 14), "foreArm" + sd, 0xc8a040, "metal", A.w); }
      else R.add(gCyl(V3(ex, wrY + 0.05, 0), 0.046 * gi, 0.058 * gi, 0.08, 12, true), "foreArm" + sd, gc, "metal");
      R.add(gBox(V3(s * (sw + 0.024), wrY - 0.075, 0.034), 0.05, 0.022, 0.016), "hand" + sd, gc, "metal");
    }
    if (L.shield && s < 0) {
      const sy = (elY + wrY) / 2, sx = ex - 0.075, sc = L.shield;
      {
        const kite = !!sc.kite, rr = kite ? 0.2 : 0.185, th = 0.034;
        const sh = new THREE.Shape();
        if (kite) { sh.moveTo(-0.15, 0.17); sh.lineTo(0.15, 0.17); sh.lineTo(0.16, 0.0); sh.lineTo(0.0, -0.3); sh.lineTo(-0.16, 0.0); } else { for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; if (k) sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else sh.moveTo(rr, 0); } }
        sh.closePath();
        const g = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1 });
        g.translate(0, kite ? 0.02 : 0, -th / 2);
        g.rotateY(-Math.PI / 2);
        g.translate(sx, sy, 0);
        R.add(g, "foreArm" + sd, sc.color, "metal");
        const fx = sx - th / 2 - 0.012;
        R.add(gBox(V3(fx, sy + (kite ? 0.02 : 0), 0), 0.014, kite ? 0.3 : rr * 1.3, 0.05), "foreArm" + sd, sc.emblem || 0x2f5c9a, "metal");
        R.add(gBox(V3(fx, sy + (kite ? 0.07 : 0.0), 0), 0.014, 0.05, kite ? 0.24 : rr * 1.3), "foreArm" + sd, sc.emblem || 0x2f5c9a, "metal");
        R.add(gBall(V3(fx - 0.004, sy + (kite ? 0.07 : 0), 0), 0.05, 0.45, 1, 1, 8), "foreArm" + sd, sc.trim || 0xc8a040, "metal");
        if (kite) for (const z of [-0.14, 0.14]) R.add(gBall(V3(fx, sy + 0.14, z), 0.022, 0.5, 1, 1, 6), "foreArm" + sd, sc.trim || 0xc8a040, "metal");
        else for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * Math.PI * 2; R.add(gBall(V3(fx, sy + Math.sin(a) * rr * 0.86, Math.cos(a) * rr * 0.86), 0.017, 0.5, 1, 1, 6), "foreArm" + sd, sc.trim || 0xc8a040, "metal"); }
      }
    }

    const hx = s * pr.hip;
    const legThin = L.skull ? 0.024 : 0;
    const bootTop = knee - 0.1;
    if (L.skull) {
      R.add(gTaper(V3(hx, hipJ + 0.03, 0), V3(hx, knee, 0.01), legThin, legThin, 12), "thigh" + sd, legC, "bone");
      R.add(gBall(V3(hx, knee, 0.012), 0.032, 1, 1, 1, 10), "shin" + sd, legC, "bone");
      R.add(gTaper(V3(hx, knee, 0.012), V3(hx, ank + 0.02, 0), legThin, legThin, 12), "shin" + sd, legC, "bone");
    } else {
      const fk = fem ? 1.06 : 1;
      const lz = y => y >= knee ? 0.012 * (hipJ - y) / (hipJ - knee) : 0.012 * (y - ank) / (knee - ank);
      const lx = y => y > hipJ - 0.06 ? hx * (0.72 + 0.28 * (hipJ + 0.06 - y) / 0.12) : hx;
      const lr = (y, r, f, b) => ({ y, x: lx(y), z: lz(y), rx: r * gi, rz: r * gi, f: f || 1, b: b || 1, p: 2.1 });
      const legRings = [lr(hipJ + 0.06, 0.06 * fk), lr(hipJ + 0.02, 0.08 * fk, 1, 1.05), lr(hipJ - 0.05, 0.081 * fk, 1.02, 1.04), lr((hipJ + knee) / 2, 0.071 * fk, 1.04, 1), lr(knee + 0.06, 0.06), lr(knee + 0.015, 0.055, 1.08, 0.95), lr(knee - 0.03, 0.055, 1.02, 1.12), lr(knee - 0.1, 0.055, 1, 1.22), lr(knee - 0.19, 0.047, 1, 1.12), lr(ank + 0.08, 0.038), lr(ank + 0.02, 0.037)];
      const legW = (x, y) => y > hipJ ? [["thigh" + sd, 1 - 0.35 * smoothRange(hipJ, hipJ + 0.06, y)], ["hips", 0.35 * smoothRange(hipJ, hipJ + 0.06, y)]] : y < ank + 0.03 ? [["shin" + sd, 0.7], ["foot" + sd, 0.3]] : blendW(y, [[0, "shin" + sd, 0], [knee, "thigh" + sd, 0.04]]);
      R.addW(gLoft(legRings.slice().reverse(), 18, true, false, 0, 1), "thigh" + sd, legC, legR, legW);
      BODY["leg" + sd] = { rings: legRings, w: legW };
    }
    const LG = BODY["leg" + sd];
    if (LG && L.under && (L.under.low === "boxer" || L.under.low === "brief")) {
      const ub = shellOf(LG.rings.filter(r => r.y >= hipJ - (L.under.low === "boxer" ? 0.17 : 0.06)), 0.006 * gi);
      if (ub.length > 1) R.addW(gLoft(ub.slice().reverse(), 18, false, false, 0, 1), "thigh" + sd, 0xf4f2ec, "cloth", LG.w);
    }
    if (L.boots != null) {
      if (LG) { const bs = shellOf(LG.rings.filter(r => r.y <= bootTop + 0.001), 0.008 * gi); bs.unshift(Object.assign({}, bs[0], { y: bootTop + 0.004, rx: bs[0].rx + 0.006, rz: bs[0].rz + 0.006 })); R.addW(gLoft(bs.slice().reverse(), 16, false, false, 0, 1), "shin" + sd, L.boots, "leather", LG.w); R.addW(gRing(V3(bs[0].x, bootTop + 0.004, bs[0].z), bs[0].rx, 0.011, "y", 16).scale(1, 1, bs[0].rz / bs[0].rx), "shin" + sd, L.boots, "leather", LG.w); }
      else { R.add(gTaper(V3(hx, bootTop, 0.012), V3(hx, ank + 0.01, 0.0), 0.062 * gi, 0.048 * gi, 12), "shin" + sd, L.boots, "leather"); R.add(gRing(V3(hx, bootTop, 0.012), 0.062 * gi, 0.012, "y", 14), "shin" + sd, L.boots, "leather"); }
    }
    if (L.boots != null && !L.skull) R.add(gCyl(V3(hx, bootTop + 0.012, 0.012), 0.086 * gi, 0.066 * gi, 0.06, 12, true), "shin" + sd, L.boots, "leather");
    if (L.greaves != null && !L.skull) {
      if (LG) {
        const gr = shellOf(LG.rings.filter(r => r.y <= knee + 0.065 && r.y >= ank + 0.06), 0.014 * gi);
        R.addW(gLoft(gr.slice().reverse(), 16, false, false, 0, 1), "shin" + sd, L.greaves, "metal", LG.w);
        const kr = LG.rings.find(r => Math.abs(r.y - (knee + 0.015)) < 0.03) || LG.rings[5];
        R.add(gPartSphere(V3(kr.x, knee + 0.01, (kr.z || 0) + kr.rz * 0.75), 0.045 * gi, 0, Math.PI * 0.55, 1.1, 1.0, 0.7, 12).rotateX(0), "shin" + sd, L.greaves, "metal");
        R.add(gRing(V3(kr.x, knee + 0.06, kr.z || 0), kr.rx + 0.018 * gi, 0.007, "y", 14), "thigh" + sd, 0xc8a040, "metal");
      } else {
        R.add(gPartSphere(V3(hx, knee + 0.005, 0.03), 0.06 * gi, 0, Math.PI * 0.62, 1, 1.05, 0.9, 12), "shin" + sd, L.greaves, "metal");
        R.add(gCyl(V3(hx, (knee + ank) / 2 + 0.01, 0.022), 0.05 * gi, 0.043 * gi, (knee - ank) * 0.66, 12, true, -Math.PI * 0.42, Math.PI * 0.84).scale(1, 1, 1.1), "shin" + sd, L.greaves, "metal");
      }
    }
    const footC = L.boots != null ? L.boots : L.barefoot ? skin : L.skull ? skin : (L.shoes || 0x3a2a1e);
    const footR = L.boots != null ? "leather" : L.barefoot ? SKR : L.skull ? "bone" : "leather";
    if (L.skull) {
      R.add(gBox(V3(hx, 0.042, 0.035), 0.06, 0.075, 0.2), "foot" + sd, footC, footR);
      R.add(gBall(V3(hx, 0.045, 0.13), 0.035, 1, 0.8, 1.0, 10), "foot" + sd, footC, footR);
    } else {
      const bt = L.boots != null, fk = gi * (L.doll ? 0.8 : 1) * (bt ? 1.08 : 1) * 1.12, fx = hx + s * 0.004;
      const fr = (z, w, hh, p) => ({ x: fx, z: z * fk, rx: w * fk, ry: hh / 2 * fk, y: hh / 2 * fk, top: 1, bot: 1, p: p || 2.6 });
      R.add(gSweepZ([fr(-0.075, 0.026, 0.06, 2.2), fr(-0.06, 0.038, 0.085), fr(-0.02, 0.042, 0.1), fr(0.03, 0.043, 0.075), fr(0.09, 0.048, 0.05), fr(0.13, 0.046, 0.038), fr(0.165, 0.036, 0.028, 2.4)], 16, true, true), "foot" + sd, footC, footR);
      if (bt) {
        const sole = new THREE.Color(L.boots).multiplyScalar(0.45).getHex();
        R.add(gSweepZ([fr(-0.078, 0.03, 0.012), fr(-0.06, 0.042, 0.014), fr(0.09, 0.052, 0.014), fr(0.168, 0.04, 0.012)], 14, true, true).translate(0, -0.002, 0), "foot" + sd, sole, "leather");
        R.add(gBall(V3(fx, 0.03 * fk, 0.14 * fk), 0.034 * fk, 1.25, 0.75, 0.8, 8), "foot" + sd, footC, footR);
      } else if (L.barefoot) for (let k = 0; k < 5; k++) R.add(gBall(V3(fx - s * (0.024 - k * 0.012) * fk, 0.012 * fk, (0.165 - k * 0.007) * fk), (k ? 0.0095 - k * 0.0007 : 0.013) * fk, 1, 0.8, 1.2, 5), "foot" + sd, footC, footR);
    }
  }

  const t = top.type;
  if ((t === "robe" || t === "coat") && !L.skull) {
    const bottom = t === "robe" ? 0.1 : knee - 0.08;
    const h = hipJ + 0.05 - bottom;
    for (const [s, sd] of [[1, "L"], [-1, "R"]]) {
      const skTop = 0.158 * gi * (fem ? 1.08 : 1);
      R.add(gCyl(V3(0, bottom + h / 2, 0), skTop, 0.23 * gi, h, 12, true, s > 0 ? 0 : Math.PI, Math.PI).scale(1, 1, 0.78), "thigh" + sd, topC, topR);
      if (top.trim) R.add(gCyl(V3(0, bottom + 0.035, 0), 0.228 * gi, 0.232 * gi, 0.07, 12, true, s > 0 ? 0 : Math.PI, Math.PI).scale(1, 1, 0.78), "thigh" + sd, top.trim, "trim", !!top.glowTrim);
    }
    if (top.trim) R.add(gRing(V3(0, neckY - 0.02, 0.01), 0.075 * gi, 0.016, "y", 18), "chest", top.trim, "trim", !!top.glowTrim);
    R.add(gRing(V3(0, hipsY + 0.03, 0), (fem ? 0.165 : 0.152) * gi * (fem ? 1.08 : 1) + 0.006, 0.02, "y", 18).scale(1, 1, 0.72), "hips", top.trim || 0x4a3020, "cloth");
    if (t === "robe") R.add(gBox(V3(0.05, hipsY - 0.12, 0.13), 0.05, 0.22, 0.015), "hips", top.trim || 0x4a3020, "cloth");
  }
  if (t === "tunic" || t === "mail" || t === "plate" || t === "tabard" || t === "rags") {
    const c = t === "mail" || t === "plate" ? (top.plate || 0x9aa0a8) : topC;
    R.add(gCyl(V3(0, hipsY - 0.09, 0), 0.155 * gi * (fem ? 1.08 : 1), 0.19 * gi, 0.2, 14, true).scale(1, 1, 0.76), "hips", c, t === "mail" || t === "plate" ? "metal" : topR);
  }
  if (t === "plate" && !L.skull) {
    const W2 = sw / 0.195, pc = top.plate || 0x9aa0a8;
    if (BODY.up) {
      const pl = shellOf(BODY.up.slice(1, 7), 0.016 * gi);
      R.addW(gLoft(pl, 24, false, false, 0, 1), "chest", pc, "metal", BODY.tw);
      const mid = BODY.up[4];
      R.addW(gBox(V3(0, (BODY.up[2].y + BODY.up[6].y) / 2, mid.rz * (mid.f || 1) + 0.02 * gi), 0.012, BODY.up[6].y - BODY.up[2].y, 0.01), "chest", top.trim || 0xc8a040, "metal", BODY.tw);
      for (let k = 0; k < 2; k++) { const r = BODY.up[1 + k]; R.addW(gRing(V3(0, r.y + 0.01, 0), r.rx + 0.02 * gi, 0.008, "y", 22).scale(1, 1, (r.rz * ((r.f || 1) + (r.b || 1)) / 2) / r.rx), "spine", pc, "metal", BODY.tw); }
    } else {
      R.add(gFront(V3(0, chestY + 0.02, 0.0), 0.18 * gi * W2, 1.9, Math.PI * 0.18, Math.PI * 0.62, 1.0, 1.25, 0.72 * gi, 14), "chest", pc, "metal");
      R.add(gFront(V3(0, (spineY + chestY) / 2 - 0.02, 0.0), 0.165 * gi * W2, 1.7, Math.PI * 0.32, Math.PI * 0.68, 1.0, 1.0, 0.7 * gi, 12), "spine", pc, "metal");
    }
    if (top.trim) R.add(gRing(V3(0, neckY - 0.03, 0.01), 0.08 * gi, 0.014, "y", 18), "chest", top.trim, "trim", !!top.glowTrim);
  }
  if (L.collar && !L.skull) R.add(gRing(V3(0, neckY - 0.035, 0), 0.1 * gi, 0.045, "y", 16), "chest", L.collar, "fur");
  if (t === "tabard") {
    const ty0 = chestY + 0.19, ty1 = chestY - 0.43;
    for (const [fz, bn] of [[1, "tabF"], [-1, "tabB"]]) {
      R.bone(bn, "hips", 0, hipsY - 0.02, fz * 0.13 * gi);
      const tg = new THREE.PlaneGeometry(0.2, ty0 - ty1, 2, 10);
      tg.translate(0, (ty0 + ty1) / 2, fz * (0.125 * gi + 0.006));
      if (fz < 0) tg.rotateY(Math.PI).translate(0, 0, 0);
      const tp = tg.attributes.position;
      for (let i = 0; i < tp.count; i++) { const y = tp.getY(i); if (y > hipsY) tp.setZ(i, tp.getZ(i) + fz * 0.02 * clamp((y - hipsY) / (ty0 - hipsY), 0, 1) * gi); }
      tg.computeVertexNormals();
      R.addW(tg, "chest", top.color2, "cloth", (x, y) => y > hipsY + 0.06 ? [["chest", 1]] : y > hipsY - 0.02 ? [["chest", (y - hipsY + 0.02) / 0.08], [bn, 1 - (y - hipsY + 0.02) / 0.08]] : [[bn, 1]]);
      R.add(gBox(V3(0, ty1 + 0.015, fz * (0.125 * gi + 0.01)), 0.2, 0.025, 0.006), bn, top.trim || 0xd8c070, "trim");
    }
  }
  if (t === "apron") R.add(gBox(V3(0, hipsY - 0.05, 0.13 * gi), 0.26, 0.55, 0.012), "hips", top.color2, "leather");
  if (t === "fur") R.add(gRing(V3(0, neckY - 0.04, 0), 0.12 * gi, 0.06, "y", 14), "chest", topC, "fur");
  if (t === "rags") for (let k = 0; k < 5; k++) R.add(gBox(V3(Math.cos(k * 1.3) * 0.15, hipsY - 0.3, Math.sin(k * 1.3) * 0.12), 0.06, 0.22, 0.01, 0, k * 1.3, 0), "hips", topC, "cloth");
  if (L.belt && t !== "robe" && t !== "coat" && !L.skull) {
    const bR = (fem ? 0.165 : 0.152) * gi * (fem ? 1.08 : 1) + 0.006;
    R.add(gRing(V3(0, hipsY + 0.03, 0), bR, 0.018, "y", 18).scale(1, 1, 0.72), "hips", L.belt, "leather");
    R.add(gBox(V3(0, hipsY + 0.03, bR * 0.72 + 0.006), 0.05, 0.04, 0.012), "hips", 0xc8a040, "metal");
  }
  if (L.cape) {
    const cz = -0.15 * gi, ch = shY - knee, c1 = shY - ch / 3, c2 = shY - ch * 2 / 3;
    R.bone("cape", "chest", 0, shY, cz);
    R.bone("cape2", "cape", 0, c1, cz - 0.03);
    R.bone("cape3", "cape2", 0, c2, cz - 0.06);
    const cg = new THREE.PlaneGeometry(sw * 2.0, ch, 6, 12);
    const cp = cg.attributes.position;
    for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), y = cp.getY(i), f = (ch / 2 - y) / ch; cp.setXYZ(i, x * (1 + 0.15 * f), y + (shY + knee) / 2 + 0.02, cz - 0.05 * f - (x * x) * 1.4 * (0.3 + f)); }
    cg.computeVertexNormals();
    R.addW(cg, "cape", L.cape, "cloth", (x, y) => blendW(y, [[0, "cape3", 0], [c2, "cape2", 0.06], [c1, "cape", 0.06]]));
    R.add(gRing(V3(0, neckY - 0.03, 0), 0.085 * gi, 0.025, "y", 16), "chest", L.cape, "cloth");
  }
  if (L.sack) {
    R.add(gBall(V3(0, chestY - 0.02, -0.2), 0.17, 1, 1.1, 0.9, 12), "chest", 0x8a7350, "leather");
    R.add(gRing(V3(0, chestY + 0.14, -0.2), 0.06, 0.02, "y", 10), "chest", 0x5a4630, "leather");
  }

  const H = L.head;
  if (H) {
    const hp = V3(0, hc + 0.005, 0);
    if (H.type === "cap" || H.type === "helm" || H.type === "horned" || H.type === "winged" || H.type === "kabuto") {
      R.add(warpToHead(gPartSphere(V3(0, hc, 0.005), hr * 1.12, 0, Math.PI * 0.4, HEAD_SCALE[0], HEAD_SCALE[1], HEAD_SCALE[2], 22), HP, hc, hr), "head", H.color, "metal");
      R.add(warpToHead(gRing(V3(0, hc + hr * 0.32 * HEAD_SCALE[1], 0.005), hr * 1.1, hr * 0.06, "y", 24).scale(1, 1, 1), HP, hc, hr).scale(HEAD_SCALE[0] * 1.01, 1, 1).translate(0, 0, 0), "head", H.color, "metal");
      if (H.type !== "cap" && H.type !== "kabuto") {
        R.add(gBox(V3(0, hc + hr * 0.02, hr * 1.06), 0.016, hr * 0.5, 0.014), "head", H.color, "metal");
        for (const s of [-1, 1]) { R.add(gFront(V3(0, hc, 0.005), hr * 1.09, 0.9, Math.PI * 0.42, Math.PI * 0.68, HEAD_SCALE[0], HEAD_SCALE[1], HEAD_SCALE[2], 6).rotateY(s * 1.25), "head", H.color, "metal"); }
      }
      if (H.type === "horned") headHorns(R, H, hc, hr, H.hornK || 1);
      if (H.type === "kabuto") {
        R.add(gCyl(V3(0, hc + hr * 0.02, -hr * 0.05), hr * 1.12, hr * 1.6, hr * 0.5, 16, true, Math.PI * 0.62, Math.PI * 1.76), "head", H.color, "metal");
        R.add(gCyl(V3(0, hc - hr * 0.22, -hr * 0.05), hr * 1.6, hr * 1.72, hr * 0.06, 16, true, Math.PI * 0.62, Math.PI * 1.76), "head", H.color2 || 0xd8b040, "trim");
        for (const s of [-1, 1]) R.add(gBox(V3(s * hr * 1.08, hc + hr * 0.22, hr * 0.62), hr * 0.08, hr * 0.42, hr * 0.42, 0, s * 0.5, s * 0.25), "head", H.color2 || 0xd8b040, "metal");
        for (const s of [-1, 1]) R.add(gTaper(V3(s * hr * 0.12, hc + hr * 0.62, hr * 0.98), V3(s * hr * 0.95, hc + hr * 1.75, hr * 0.85), hr * 0.12, 0.006, 6, 0.35), "head", H.color2 || 0xd8b040, "metal");
      }
      if (H.type === "winged") for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
        const a = V3(s * hr * 1.0, hc + hr * (0.32 + k * 0.08), -hr * 0.1), b = V3(s * hr * (1.55 + k * 0.12) * (H.wingK || 1), hc + hr * (0.9 + k * 0.42) * (H.wingK || 1), -hr * (0.55 + k * 0.3));
        R.add(gTaper(a, b, hr * (0.2 - k * 0.04), 0.006, 5, 0.3), "head", k === 1 ? (H.color2 || 0xd8b040) : H.color, "metal");
      }
    } else if (H.type === "hood") {
      R.add(gPartSphere(hp, hr * 1.2, 2.2, Math.PI * 0.75, 1, 1.05, 1.05, 18), "head", H.color, "cloth");
      if (H.color2) R.add(gRing(V3(0, hc + hr * 0.05, hr * 0.66), hr * 1.0, 0.018, "z", 16, Math.PI * 1.24, [0, 0, -Math.PI * 0.12]), "head", H.color2, "trim");
      R.add(gBall(V3(0, neckY + 0.02, -0.08), 0.13, 1.2, 1.0, 0.6, 12), "head", H.color, "cloth");
    } else if (H.type === "pointy") {
      const bk = H.brimK || 1, tk = H.tallK || 1;
      R.add(warpToHead(gPartSphere(V3(0, hc, 0.005), hr * 1.12, 0, Math.PI * 0.46, HEAD_SCALE[0], HEAD_SCALE[1], HEAD_SCALE[2], 22), HP, hc, hr), "head", H.color, "cloth");
      R.add(gCyl(V3(0, hc + hr * 0.34, 0), hr * 2.3 * bk, hr * 2.3 * bk, 0.02, 22), "head", H.color, "cloth");
      R.add(gCyl(V3(0, hc + hr * 0.34 + 0.17 * tk, 0), hr * 0.5, hr * 1.08, 0.34 * tk, 16), "head", H.color, "cloth");
      R.add(gTaper(V3(0, hc + hr * 0.34 + 0.33 * tk, 0), V3(0, hc + hr * 0.34 + 0.5 * tk, -0.14 * tk), hr * 0.52, 0.01, 10), "head", H.color, "cloth");
      if (H.color2) R.add(gCyl(V3(0, hc + hr * 0.34 + 0.03, 0), hr * 1.07, hr * 1.09, 0.035, 16, true), "head", H.color2, "trim");
    } else if (H.type === "bandana") {
      R.add(gPartSphere(hp, hr * 1.08, 0, Math.PI * 0.38, 1, 1.04, 1.04, 16), "head", H.color, "cloth");
      R.add(gBall(V3(0, hc + hr * 0.25, -hr * 1.05), hr * 0.22, 1.3, 1, 1, 8), "head", H.color, "cloth");
      R.add(gBox(V3(0.03, hc - hr * 0.2, -hr * 1.08), 0.04, 0.16, 0.01, 0.2, 0, 0.2), "head", H.color, "cloth");
    } else if (H.type === "feathered") {
      R.add(gCyl(V3(0, hc + hr * 0.45, 0), hr * 1.75, hr * 1.75, 0.02, 20), "head", H.color, "cloth");
      R.add(gPartSphere(V3(0, hc + hr * 0.42, 0), hr * 1.02, 0, Math.PI * 0.5, 1, 1.0, 1.0, 16), "head", H.color, "cloth");
      R.add(gRing(V3(0, hc + hr * 0.5, 0), hr * 1.02, 0.012, "y", 18), "head", H.color2 || 0xd8c070, "trim");
      { const pk = H.plumeK || 1; R.add(gTaper(V3(hr * 0.5, hc + hr * 0.75, -hr * 0.6), V3(hr * (0.5 + 0.8 * pk), hc + hr * (0.75 + 1.25 * pk), -hr * (0.6 + 0.9 * pk)), 0.028 * pk, 0.004, 6, 0.3), "head", H.plume || 0xf4f1e8, "feather"); }
    } else if (H.type === "crown") {
      const cc = H.color || 0xd8b040, cr = hr * (L.hair && L.hair.style !== "bald" ? 1.04 : 0.95);
      R.add(gRing(V3(0, hc + hr * 0.55, 0), cr, 0.02, "y", 18), "head", cc, "metal");
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; R.add(gTaper(V3(Math.sin(a) * cr, hc + hr * 0.55, Math.cos(a) * cr), V3(Math.sin(a) * cr * 1.05, hc + hr * 0.95, Math.cos(a) * cr * 1.05), 0.025, 0.003, 5), "head", cc, "metal"); }
      if (H.gem) R.add(gBall(V3(0, hc + hr * 0.6, cr + 0.012), 0.022, 1, 1.3, 0.6, 8), "head", H.gem, "glow", true);
    } else if (H.type === "furhat") {
      R.add(gPartSphere(hp, hr * 1.14, 0, Math.PI * 0.42, 1, 1.12, 1.05, 16), "head", H.color, "fur");
      R.add(gRing(V3(0, hc + hr * 0.4, 0), hr * 1.1, hr * 0.2, "y", 18), "head", new THREE.Color(H.color).multiplyScalar(1.25).getHex(), "fur");
      for (const s of [-1, 1]) R.add(gBall(V3(s * hr * 1.0, hc - hr * 0.2, -hr * 0.05), hr * 0.3, 0.5, 1.2, 0.9, 8), "head", H.color, "fur");
    } else if (H.type === "tricorne") {
      R.add(gPartSphere(V3(0, hc + hr * 0.38, 0), hr * 1.05, 0, Math.PI * 0.5, 1, 0.85, 1.0, 14), "head", H.color, "leather");
      R.add(gCyl(V3(0, hc + hr * 0.42, 0), hr * 1.7, hr * 1.75, 0.016, 18), "head", H.color, "leather");
      for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; R.add(gBox(V3(Math.sin(a) * hr * 1.42, hc + hr * 0.7, Math.cos(a) * hr * 1.42), hr * 1.9, hr * 0.62, 0.014, Math.cos(a) * -0.5, a, Math.sin(a) * 0.5), "head", H.color, "leather"); }
      R.add(gRing(V3(0, hc + hr * 0.48, 0), hr * 1.04, 0.012, "y", 18), "head", H.color2 || 0xd8b040, "trim");
    } else if (H.type === "beret") {
      R.add(gBall(V3(-hr * 0.15, hc + hr * 0.62, -hr * 0.05), hr * 1.18, 1.08, 0.42, 1.05, 14), "head", H.color, "cloth");
      R.add(gRing(V3(0, hc + hr * 0.45, 0), hr * 1.02, 0.016, "y", 18), "head", H.color2 || 0xd8b040, "trim");
    } else if (H.type === "turban") {
      R.add(gPartSphere(V3(0, hc + hr * 0.1, 0), hr * 1.18, 0, Math.PI * 0.5, 1, 1.18, 1.05, 16), "head", H.color, "cloth");
      for (let k = 0; k < 2; k++) R.add(gRing(V3(0, hc + hr * (0.25 + k * 0.32), 0), hr * (1.18 - k * 0.12), hr * 0.17, "y", 18, 0, [0.12 - k * 0.24, 0, 0]), "head", k ? H.color : (H.color2 || 0xd8c070), "cloth");
    } else if (H.type === "headband") {
      R.add(gRing(V3(0, hc + hr * 0.36, 0), hr * 1.06, hr * 0.07, "y", 18), "head", H.color, "cloth");
      H.tails = H.tails || H.color;
    } else if (H.type === "circlet") {
      R.add(gRing(V3(0, hc + hr * 0.42, 0.01), hr * 1.04, 0.009, "y", 18, 0, [-0.12, 0, 0]), "head", H.color, "metal");
    } else if (H.type === "jester") {
      R.add(gPartSphere(hp, hr * 1.1, 0, Math.PI * 0.42, 1, 1.06, 1.04, 16), "head", H.color, "cloth");
      for (const s of [-1, 1]) {
        const a = V3(s * hr * 0.5, hc + hr * 0.8, 0), b = V3(s * hr * 1.5, hc + hr * 1.5, -hr * 0.1), c = V3(s * hr * 2.0, hc + hr * 0.9, -hr * 0.15), col = s > 0 ? H.color : (H.color2 || 0xd8c070);
        R.add(gTaper(a, b, hr * 0.42, hr * 0.2, 8), "head", col, "cloth");
        R.add(gTaper(b, c, hr * 0.2, hr * 0.08, 8), "head", col, "cloth");
        R.add(gBall(c, hr * 0.16, 1, 1, 1, 8), "head", 0xd8b040, "metal");
      }
    } else if (H.type === "mortar") {
      R.add(gPartSphere(hp, hr * 1.09, 0, Math.PI * 0.4, 1, 1.04, 1.04, 16), "head", H.color, "cloth");
      R.add(gBox(V3(0, hc + hr * 0.98, 0), hr * 2.1, 0.022, hr * 2.1, 0, Math.PI / 4, 0), "head", H.color, "cloth");
      R.add(gTaper(V3(0, hc + hr * 1.0, 0), V3(hr * 1.2, hc + hr * 0.4, hr * 0.3), 0.008, 0.008, 4), "head", H.color2 || 0xd8b040, "trim");
      R.add(gBall(V3(hr * 1.2, hc + hr * 0.35, hr * 0.3), 0.02, 1, 1.6, 1, 6), "head", H.color2 || 0xd8b040, "trim");
    } else if (H.type === "ninjahood") {
      R.add(gPartSphere(hp, hr * 1.12, 2.0, Math.PI * 0.72, 1, 1.04, 1.06, 18), "head", H.color, "cloth");
      R.add(gBall(V3(0, neckY + 0.03, -0.04), 0.1, 1.2, 0.9, 0.9, 10), "head", H.color, "cloth");
      R.add(gBox(V3(0, hc + hr * 0.5, hr * 0.98), hr * 0.7, hr * 0.26, 0.014, -0.35, 0, 0), "head", H.color2 || 0x9aa0a8, "metal");
      H.tails = H.tails || H.color;
    } else if (H.type === "widebrim") {
      R.add(gCyl(V3(0, hc + hr * 0.42, 0), hr * 2.0, hr * 2.05, 0.018, 22), "head", H.color, "leather");
      R.add(gPartSphere(V3(0, hc + hr * 0.4, 0), hr * 1.04, 0, Math.PI * 0.5, 1, 0.9, 1.0, 16), "head", H.color, "leather");
      R.add(gRing(V3(0, hc + hr * 0.47, 0), hr * 1.03, 0.012, "y", 18), "head", 0x5a3a20, "leather");
      for (let k = 0; k < 2; k++) R.add(gTaper(V3(hr * (0.6 + k * 0.15), hc + hr * 0.65, -hr * 0.55), V3(hr * (1.3 + k * 0.3), hc + hr * (1.7 - k * 0.3), -hr * 1.4), 0.03, 0.004, 6, 0.3), "head", H.color2 || 0xf4f1e8, "feather");
    }
  }

  if (H) headDecor(R, H, hc, hr);

  if (L.tail) {
    const cat = L.tail === "cat", tz = -(0.12 * gi * (sw / 0.195) + 0.02), tc = cat ? L.hair.color : L.tail === "ursan" ? skin : (L.hair && L.hair.color) || skin;
    R.bone("tail", "hips", 0, hipsY - 0.04, tz);
    R.bone("tail2", "tail", 0, hipsY - (cat ? 0.32 : 0.26), tz - (cat ? 0.2 : 0.22));
    if (cat) {
      R.add(gTaper(V3(0, hipsY - 0.04, tz), V3(0, hipsY - 0.32, tz - 0.2), 0.03, 0.026, 8), "tail", tc, "hair");
      R.add(gTaper(V3(0, hipsY - 0.32, tz - 0.2), V3(0, hipsY - 0.24, tz - 0.48), 0.026, 0.012, 8), "tail2", tc, "hair");
    } else {
      const lz = L.tail === "ursan", tr = lz ? "scale" : "hair";
      R.add(gTaper(V3(0, hipsY - 0.04, tz), V3(0, hipsY - 0.22, tz - 0.14), lz ? 0.055 : 0.07, lz ? 0.045 : 0.055, 8), "tail", tc, tr);
      R.add(gTaper(V3(0, hipsY - (lz ? 0.22 : 0.26), tz - (lz ? 0.14 : 0.22)), V3(0, hipsY - (lz ? 0.36 : 0.5), tz - (lz ? 0.3 : 0.3)), lz ? 0.045 : 0.055, 0.012, 8), "tail2", tc, tr);
    }
  }
  if (L.family || L.boss) familyExtras(R, L, { hx: pr.hip, hipsY, chestY, spineY, shY, neckY, elY, wrY, knee, ank, sw, gi, hc, hr, skin, SKR, mid: (elY + wrY) / 2 });
  R.meta = { kind: "human", headC: hc, headR: hr, race: L.doll ? "pipkin" : L.ears === "ursan" ? "ursan" : L.ears === "cat" ? "nekari" : L.ears === "elf" ? "elari" : "human", hipsY, chestY, backZ: -(0.176 * 0.66 * gi * (sw / 0.195) * 1.04 + 0.03), headTop: hc + hr * (L.head && L.head.type === "pointy" ? 4.2 * (L.head.tallK || 1) : L.head && (L.head.type === "horned" || L.head.type === "winged" || L.head.type === "jester" || L.head.type === "kabuto") ? 2.1 : 1.2), hand: "handR", wrY, hunch: L.hunch || 0 };
  return R.finish();
}

function gRibbed(y0, y1, r0, r1, ribs, amp, seg, domeTop, domeBot) {
  const prof = [];
  if (domeBot) for (let k = 0; k < 4; k++) { const a = -Math.PI / 2 + k / 4 * Math.PI / 2; prof.push([r0 * Math.cos(a), y0 + r0 * 0.8 * Math.sin(a)]); }
  for (let k = 0; k <= 6; k++) { const t = k / 6; prof.push([r0 + (r1 - r0) * t, y0 + (y1 - y0) * t]); }
  if (domeTop) for (let k = 1; k <= 6; k++) { const a = k / 6 * Math.PI / 2; prof.push([r1 * Math.cos(a), y1 + r1 * 0.95 * Math.sin(a)]); }
  const g = gLathe(prof, 1, 1, seg || 28);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), k = 1 + amp * Math.cos(ribs * Math.atan2(z, x)); p.setX(i, x * k); p.setZ(i, z * k); }
  g.computeVertexNormals();
  return g;
}
function cactusSpines(R, bone, y0, y1, r0, r1, ribs, amp, step, cx, cz, off) {
  for (let y = y0 + step * 0.5; y < y1; y += step) {
    const t = (y - y0) / (y1 - y0), r = (r0 + (r1 - r0) * t) * (1 + amp);
    for (let k = 0; k < ribs; k++) {
      const a = k / ribs * Math.PI * 2 + (off || 0);
      const p = V3(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r), d = V3(Math.cos(a), 0.25, Math.sin(a)).normalize();
      R.add(gTaper(p, p.clone().addScaledVector(d, 0.028), 0.004, 0.0008, 3), bone, 0xf2eed8, "bone");
      R.add(gBall(p, 0.008, 1, 1, 1, 4), bone, 0xe8e0c8, "plain");
    }
  }
}
function cactusBody(R, L, J) {
  const g = (J.pr.girth || 1), c = L.skin, dark = new THREE.Color(c).multiplyScalar(0.55).getHex();
  const r0 = 0.13 * g, r1 = 0.15 * g, ribs = 8, amp = 0.11;
  const top = J.headY + 0.2;
  R.add(gRibbed(J.hipsY - 0.08, J.spineY, r0, r0 * 1.04, ribs, amp, 28, false, true), "hips", c, "plain");
  R.add(gRibbed(J.spineY, J.neckY, r0 * 1.04, r1, ribs, amp, 28), "chest", c, "plain");
  R.add(gRibbed(J.neckY, top, r1, r1 * 0.96, ribs, amp, 28, true), "head", c, "plain");
  cactusSpines(R, "hips", J.hipsY - 0.05, J.spineY, r0, r0 * 1.04, ribs, amp, 0.075, 0, 0);
  cactusSpines(R, "chest", J.spineY, J.neckY, r0 * 1.04, r1, ribs, amp, 0.075, 0, 0);
  cactusSpines(R, "head", J.neckY, top, r1, r1 * 0.96, ribs, amp, 0.075, 0, 0);
  const fy = J.headY + 0.04, fz = r1 * 1.02;
  for (const s of [-1, 1]) {
    R.add(gBall(V3(s * 0.05, fy, fz - 0.012), 0.026, 1.25, 0.8, 0.5, 10), "head", 0x10180a, "plain");
    R.add(gBall(V3(s * 0.05 - s * 0.006, fy + 0.006, fz + 0.002), 0.006, 1, 1, 1, 6), "head", L.eyesGlow && L.eyesGlow !== 0x111111 ? L.eyesGlow : 0xfff3c0, "glow", true);
  }
  R.add(gBall(V3(0, fy - 0.075, fz - 0.01), 0.03, 1.4, 0.45, 0.5, 10), "head", 0x10180a, "plain");
  const ftop = top + r1 * 0.95;
  const petal = L.flower || 0xf06292;
  for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; R.add(gBall(V3(Math.cos(a) * 0.035, ftop + 0.012, Math.sin(a) * 0.035 - 0.02), 0.026, 1.0, 0.35, 0.55, 8).rotateY(0), "head", petal, "plain"); }
  R.add(gBall(V3(0, ftop + 0.022, -0.02), 0.018, 1, 0.8, 1, 8), "head", 0xffd54f, "plain");
  if (L.head && L.head.type === "crown") { R.add(gRing(V3(0, top + 0.02, 0), r1 * 1.05, 0.014, "y", 18), "head", 0xd8b040, "metal"); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; R.add(gTaper(V3(Math.cos(a) * r1 * 1.05, top + 0.02, Math.sin(a) * r1 * 1.05), V3(Math.cos(a) * r1 * 1.08, top + 0.09, Math.sin(a) * r1 * 1.08), 0.018, 0.003, 4), "head", 0xd8b040, "metal"); } }
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) {
    const ar = 0.07 * g, sx = s * (J.sw * 0.55), ex = s * (J.sw + 0.13), ay = J.shY - 0.06;
    const elbow = V3(ex, ay - 0.02, 0), up = V3(ex + s * 0.01, ay + 0.24, 0);
    const a1 = gRibbed(0, Math.abs(ex - sx), ar, ar * 0.95, 6, 0.12, 18);
    a1.rotateZ(-s * Math.PI / 2); a1.translate(sx, ay, 0);
    R.add(a1, "upArm" + sd, c, "plain");
    R.add(gBall(elbow, ar * 1.02, 1, 1, 1, 12), "upArm" + sd, c, "plain");
    const a2 = gRibbed(0, up.y - elbow.y, ar * 0.95, ar * 0.85, 6, 0.12, 18, true);
    a2.translate(elbow.x, elbow.y, 0);
    R.add(a2, "foreArm" + sd, c, "plain");
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; for (let y = 0.04; y < up.y - elbow.y; y += 0.07) { const p = V3(elbow.x + Math.cos(a) * ar * 1.1, elbow.y + y, Math.sin(a) * ar * 1.1); R.add(gTaper(p, p.clone().add(V3(Math.cos(a) * 0.024, 0.006, Math.sin(a) * 0.024)), 0.0035, 0.0008, 3), "foreArm" + sd, 0xf2eed8, "bone"); } }
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; for (let t = 0.05; t < Math.abs(ex - sx); t += 0.07) { const p = V3(sx + s * t, ay + Math.cos(a) * ar * 1.1, Math.sin(a) * ar * 1.1); R.add(gTaper(p, p.clone().add(V3(0, Math.cos(a) * 0.024, Math.sin(a) * 0.024)), 0.0035, 0.0008, 3), "upArm" + sd, 0xf2eed8, "bone"); } }
    const hx = s * J.pr.hip * 0.9, lr = 0.06 * g;
    R.add(gRibbed(J.knee - 0.02, J.hipsY - 0.04, lr * 0.95, lr * 1.05, 6, 0.1, 16).translate(hx, 0, 0), "thigh" + sd, c, "plain");
    R.add(gRibbed(J.ank + 0.01, J.knee, lr * 0.85, lr * 0.95, 6, 0.1, 16).translate(hx, 0, 0), "shin" + sd, c, "plain");
    for (let k = 0; k < 4; k++) { const a = -0.9 + k * 0.6 + Math.PI / 2; R.add(gTaper(V3(hx, J.ank + 0.02, 0.01), V3(hx + Math.cos(a) * 0.1 * (k % 3 ? 0.8 : 1), 0.012, Math.sin(a) * 0.11), 0.03, 0.008, 6), "foot" + sd, dark, "wood"); }
  }
  R.meta = { kind: "human", race: "human", hipsY: J.hipsY, chestY: J.chestY, backZ: -(r1 + 0.03), headTop: top + 0.2, hand: "handR", wrY: J.wrY };
  return R.finish();
}

NPC_LOOK.tobin_b = Object.assign({}, NPC_LOOK.tobin, { skin: SKIN_TONES[3], hair: Object.assign({}, NPC_LOOK.tobin.hair, { color: HAIR_COLORS[4] }) });
NPC_LOOK.ysolde_b = Object.assign({}, NPC_LOOK.ysolde, { skin: SKIN_TONES[1], hair: Object.assign({}, NPC_LOOK.ysolde.hair, { color: HAIR_COLORS[0] }) });
const NPC_HELD = { tobin_b: "book", ysolde_b: "brush", vend_armorer: "hammer", vend_weaponsmith: "hammer", vend_tradesman: "basket", vend_quartermaster: "ledger", vend_spellsmith: "scroll", vend_jeweler: "book", garrick: "hammer", haldor: "hammer", corvin: "ledger", selene: "ledger", orla: "ledger", tobin: "book", maera: "scroll", brisa: "scroll", marn: "basket", essa: "basket", odette: "bolt", ysolde: "brush", luna: "lantern", ilsa: "spyglass", ferryman: "oar", wend: "rod", guard: "spear", guard_f: "spear", nomad: "spear", tarqa: "staffwalk" };
function heldProp(R, kind, sd, hx, wrY, gi) {
  const hb = "hand" + sd, gy = wrY - 0.07 * gi, z = 0.012, wood = 0x7a5432, dark = 0x3a2a1a, metal = 0x9aa0a8, brass = 0xc8a040;
  if (kind === "hammer") { R.add(gTaper(V3(hx, gy + 0.05, z), V3(hx, gy - 0.32, z + 0.02), 0.012, 0.014, 6), hb, wood, "wood"); R.add(gBox(V3(hx, gy - 0.33, z + 0.02), 0.04, 0.05, 0.12), hb, 0x5a5a62, "metal"); }
  else if (kind === "spear") { R.add(gTaper(V3(hx, gy + 0.95, z), V3(hx, gy - 0.75, z), 0.014, 0.016, 6), hb, wood, "wood"); R.add(gTaper(V3(hx, gy + 0.95, z), V3(hx, gy + 1.15, z), 0.03, 0.002, 4, 0.35), hb, metal, "metal"); R.add(gRing(V3(hx, gy + 0.94, z), 0.018, 0.006, "y", 8), hb, brass, "metal"); }
  else if (kind === "staffwalk") R.add(gTaper(V3(hx, gy + 0.8, z), V3(hx, gy - 0.75, z), 0.018, 0.014, 6), hb, wood, "wood");
  else if (kind === "ledger" || kind === "book") { const c = kind === "book" ? 0x5a2a6a : 0x5a3a20; R.add(gBox(V3(hx, gy - 0.07, z + 0.03), 0.04, 0.2, 0.15, 0, 0, 0), hb, c, "leather"); R.add(gBox(V3(hx, gy - 0.07, z + 0.03), 0.032, 0.19, 0.146), hb, 0xf0e8d0, "plain"); if (kind === "book") R.add(gBox(V3(hx, gy - 0.07, z + 0.03), 0.042, 0.03, 0.152), hb, brass, "metal"); }
  else if (kind === "scroll") { R.add(gCyl(V3(hx, gy - 0.04, z + 0.02), 0.022, 0.022, 0.2, 10), hb, 0xf0e2c0, "plain"); for (const k of [-1, 1]) R.add(gBall(V3(hx, gy - 0.04 + k * 0.105, z + 0.02), 0.014, 1, 0.6, 1, 6), hb, dark, "wood"); }
  else if (kind === "basket") { R.add(gPartSphere(V3(hx, gy - 0.12, z + 0.02), 0.11, 0, Math.PI * 0.5, 1, 0.8, 0.8, 12, Math.PI * 0.5), hb, 0xa07848, "wood"); R.add(gRing(V3(hx, gy - 0.05, z + 0.02), 0.09, 0.008, "x", 12, Math.PI), hb, 0x8a6038, "wood"); R.add(gBall(V3(hx, gy - 0.12, z + 0.02), 0.085, 1, 0.3, 0.8, 8), hb, 0xc84a3a, "plain"); }
  else if (kind === "bolt") R.add(gCyl(V3(hx, gy - 0.06, z + 0.03), 0.05, 0.05, 0.36, 12), hb, 0x7a5aa8, "cloth");
  else if (kind === "brush") { R.add(gTaper(V3(hx, gy + 0.02, z), V3(hx, gy - 0.12, z), 0.012, 0.012, 6), hb, wood, "wood"); R.add(gBox(V3(hx, gy - 0.15, z), 0.05, 0.04, 0.09), hb, 0x8a6a40, "fur"); }
  else if (kind === "lantern") { R.add(gRing(V3(hx, gy - 0.02, z), 0.025, 0.004, "x", 10), hb, dark, "metal"); R.add(gCyl(V3(hx, gy - 0.12, z), 0.04, 0.05, 0.12, 8), hb, dark, "metal"); R.add(gCyl(V3(hx, gy - 0.12, z), 0.034, 0.042, 0.1, 8), hb, 0xffd080, "glow", true); }
  else if (kind === "spyglass") { R.add(gTaper(V3(hx, gy + 0.02, z - 0.06), V3(hx, gy - 0.02, z + 0.24), 0.018, 0.024, 10), hb, brass, "metal"); R.add(gRing(V3(hx, gy, z + 0.08), 0.022, 0.004, "z", 10), hb, dark, "leather"); }
  else if (kind === "oar") { R.add(gTaper(V3(hx, gy + 0.6, z), V3(hx, gy - 0.9, z), 0.016, 0.016, 6), hb, wood, "wood"); R.add(gBox(V3(hx, gy - 1.0, z), 0.02, 0.28, 0.12), hb, wood, "wood"); }
  else if (kind === "rod") { R.add(gTaper(V3(hx, gy + 0.05, z), V3(hx, gy + 1.4, z + 0.5), 0.012, 0.003, 5), hb, 0x6a4a28, "wood"); }
  else if (kind === "broom") { R.add(gTaper(V3(hx, gy + 0.6, z), V3(hx, gy - 0.7, z), 0.013, 0.013, 6), hb, wood, "wood"); R.add(gTaper(V3(hx, gy - 0.66, z), V3(hx, gy - 0.95, z), 0.03, 0.08, 8, 0.6), hb, 0xc8a860, "fur"); }
  else if (kind === "tankard") { R.add(gCyl(V3(hx, gy - 0.05, z + 0.03), 0.035, 0.038, 0.1, 10), hb, 0x8a8a92, "metal"); R.add(gRing(V3(hx, gy - 0.05, z + 0.07), 0.025, 0.007, "x", 8, Math.PI), hb, 0x8a8a92, "metal"); }
}

function goblinLook(variant) {
  const base = { noFace: true, ears: "goblin", nose: "goblin", eyesGlow: 0xffd040, barefoot: true, sack: true, legs: 0x5a4632, belt: 0x3a2a1a };
  if (variant === "chieftain") return Object.assign(base, { skin: 0x6a7a34, top: { type: "mail", color: 0x55585e, region: "chain" }, head: { type: "horned", color: 0x4a4a44, color2: 0xe8dcc0 }, cape: 0x8a1f1f, pauldrons: 0x6a6a64, weapon: "greataxe", sack: false, prop: { leg: 0.62, torso: 0.56, headR: 0.18, arm: 0.62, shoulder: 0.22, hip: 0.11, neck: 0.04, girth: 1.25 } });
  const p = { leg: 0.5, torso: 0.42, headR: 0.16, arm: 0.5, shoulder: 0.165, hip: 0.09, neck: 0.04, girth: 1.05 };
  if (variant === "raider") return Object.assign(base, { skin: 0x6a7a40, top: { type: "tunic", color: 0x4a3a2a, region: "leather" }, head: { type: "cap", color: 0x55585e }, weapon: "dagger", prop: p });
  if (variant === "frost") return Object.assign(base, { skin: 0x7a8a6a, top: { type: "fur", color: 0xd8d0c0, region: "fur", sleeves: "none" }, head: { type: "hood", color: 0xc8c0b0 }, legs: 0x5a5048, boots: 0x3a3028, weapon: "dagger", prop: p });
  if (variant === "rimefang") return Object.assign(base, { skin: 0x6a7a5a, top: { type: "mail", color: 0x6a7480, region: "chain" }, cape: 0xd8d0c0, pauldrons: 0x8a94a0, head: { type: "horned", color: 0x5a6470, color2: 0xe8f4ff }, eyesGlow: 0x80d8ff, weapon: "greataxe", sack: false, prop: Object.assign({}, p, { girth: 1.2, headR: 0.17, torso: 0.47 }) });
  if (variant === "apprentice") return Object.assign(base, { skin: 0x7f9150, top: { type: "robe", color: 0x6a5a3a }, head: { type: "cap", color: 0x6a5a3a }, weapon: "staff", sack: false, prop: p });
  if (variant === "conjurer") return Object.assign(base, { skin: 0x6a7a40, top: { type: "robe", color: 0x7a2a22, trim: 0xd8a040 }, head: { type: "hood", color: 0x7a2a22 }, eyesGlow: 0xff8a40, weapon: "staff", sack: false, prop: p });
  if (variant === "hexer") return Object.assign(base, { skin: 0x5f7040, top: { type: "robe", color: 0x2f4030, trim: 0x8aa070 }, head: { type: "hood", color: 0x2f4030 }, eyesGlow: 0x9ccc65, weapon: "staff", sack: false, prop: p });
  if (variant === "shaman") return Object.assign(base, { skin: 0x7a8a6a, top: { type: "robe", color: 0x3a5a7a, trim: 0x9fe8ff, glowTrim: true }, head: { type: "hood", color: 0x2a4a6a }, eyesGlow: 0x80d8ff, weapon: "staff", sack: false, prop: p });
  if (variant === "mire") return Object.assign(base, { skin: 0x5f7040, top: { type: "tunic", color: 0x3a4a30, region: "leather" }, head: { type: "hood", color: 0x4a5a3a }, legs: 0x3a3428, weapon: "dagger", prop: p });
  if (variant === "gax") return Object.assign(base, { skin: 0x56683a, top: { type: "mail", color: 0x4a5048, region: "chain" }, head: { type: "horned", color: 0x3a3f36, color2: 0xd8cca8 }, cape: 0x2f4a2a, eyesGlow: 0xffab40, weapon: "greataxe", sack: false, prop: Object.assign({}, p, { girth: 1.2, headR: 0.17, torso: 0.47 }) });
  if (variant === "grimtooth") return Object.assign(base, { skin: 0x8a8a3a, top: { type: "vest", color: 0x5a2a20, region: "leather", under: 0x3a2a1a }, head: { type: "bandana", color: 0x2a2a2a }, eyesGlow: 0xff3a2a, weapon: "dagger", prop: p });
  return Object.assign(base, { skin: 0x7f9150, top: { type: "vest", color: 0x6a4a30, region: "leather", under: 0x8a7a5a }, head: { type: "bandana", color: 0x9a2a22 }, weapon: "dagger", prop: p });
}

function batEntry(col, eye) {
  const R = new RigBuilder();
  const Y = 1.35;
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, Y, 0);
  R.bone("head", "body", 0, Y + 0.07, 0.15);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) {
    R.bone("wing" + sd, "body", s * 0.09, Y + 0.02, 0);
    R.bone("wing2" + sd, "wing" + sd, s * 0.45, Y + 0.03, -0.02);
  }
  const fur = col, dark = new THREE.Color(col).multiplyScalar(0.55).getHex(), light = new THREE.Color(col).lerp(new THREE.Color(0xc8b8a0), 0.4).getHex();
  R.add(gBall(V3(0, Y, 0), 0.15, 1, 0.95, 1.25, 14), "body", fur, "fur");
  R.add(gBall(V3(0, Y - 0.03, 0.05), 0.12, 0.85, 0.85, 1.1, 12), "body", light, "fur");
  R.add(gBall(V3(0, Y + 0.08, 0.17), 0.1, 1, 0.95, 1.05, 12), "head", fur, "fur");
  R.add(gBall(V3(0, Y + 0.06, 0.26), 0.045, 1, 0.8, 1.2, 8), "head", dark, "skin");
  for (const s of [-1, 1]) {
    R.add(gTaper(V3(s * 0.05, Y + 0.13, 0.15), V3(s * 0.1, Y + 0.28, 0.11), 0.045, 0.004, 6, 0.45), "head", dark, "skin");
    R.add(gBall(V3(s * 0.042, Y + 0.1, 0.255), 0.02, 1, 1, 0.6, 6), "head", eye || 0xff3030, "glow", true);
    R.add(gTaper(V3(s * 0.016, Y + 0.035, 0.28), V3(s * 0.016, Y - 0.005, 0.285), 0.008, 0.001, 4), "head", 0xf0ece0, "bone");
    const mem1 = [[0.06, 0.07], [0.45, 0.09], [0.45, -0.24], [0.32, -0.16], [0.2, -0.26], [0.06, -0.15]].map(([x, z]) => [s * x, z]);
    const mem2 = [[0.45, 0.09], [0.92, 0.03], [0.8, -0.12], [0.68, -0.09], [0.58, -0.22], [0.45, -0.24]].map(([x, z]) => [s * x, z]);
    R.add(gMembrane(mem1, Y + 0.02), "wing" + (s > 0 ? "L" : "R"), dark, "skin");
    R.add(gMembrane(mem2, Y + 0.03), "wing2" + (s > 0 ? "L" : "R"), dark, "skin");
    R.add(gTaper(V3(s * 0.08, Y + 0.02, 0.07), V3(s * 0.45, Y + 0.03, 0.08), 0.014, 0.01, 6), "wing" + (s > 0 ? "L" : "R"), fur, "fur");
    R.add(gTaper(V3(s * 0.45, Y + 0.03, 0.08), V3(s * 0.92, Y + 0.035, 0.03), 0.01, 0.004, 6), "wing2" + (s > 0 ? "L" : "R"), fur, "fur");
    R.add(gTaper(V3(s * 0.05, Y - 0.1, -0.05), V3(s * 0.06, Y - 0.22, -0.08), 0.012, 0.006, 5), "body", dark, "skin");
    const wd = "wing" + (s > 0 ? "L" : "R"), wd2 = "wing2" + (s > 0 ? "L" : "R"), bc = new THREE.Color(dark).multiplyScalar(0.75).getHex();
    for (const [x, z] of [[0.32, -0.17], [0.2, -0.25]]) R.add(gTaper(V3(s * 0.42, Y + 0.035, 0.07), V3(s * x, Y + 0.025, z), 0.006, 0.003, 4), wd, bc, "skin");
    for (const [x, z] of [[0.92, 0.03], [0.8, -0.12], [0.58, -0.21]]) R.add(gTaper(V3(s * 0.46, Y + 0.035, 0.07), V3(s * x, Y + 0.035, z), 0.007, 0.003, 4), wd2, bc, "skin");
    R.add(gTaper(V3(s * 0.45, Y + 0.035, 0.09), V3(s * 0.47, Y + 0.07, 0.15), 0.01, 0.002, 4), wd, 0xe8e0d0, "bone");
    for (let k = 0; k < 3; k++) R.add(gTaper(V3(s * (0.05 + k * 0.006), Y - 0.22, -0.08), V3(s * (0.04 + k * 0.012), Y - 0.25, -0.04), 0.004, 0.001, 4), "body", 0xe8e0d0, "bone");
  }
  R.add(gBall(V3(0, Y + 0.04, 0.02), 0.13, 1.1, 0.7, 1.0, 10), "body", light, "fur");
  R.meta = { kind: "bat", headTop: Y + 0.3 };
  return R.finish();
}

function bombEntry(col, eye) {
  const R = new RigBuilder();
  const Y = 1.0;
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, Y, 0);
  R.bone("head", "body", 0, Y, 0);
  const dark = new THREE.Color(col).multiplyScalar(0.55).getHex(), light = new THREE.Color(col).lerp(new THREE.Color(0xffffff), 0.45).getHex();
  R.add(gBall(V3(0, Y, 0), 0.32, 1, 1, 1, 16), "body", col, "glow", true);
  R.add(gBall(V3(0, Y + 0.1, -0.1), 0.2, 1, 0.9, 1, 10), "body", light, "glow", true);
  for (const s of [-1, 1]) { R.add(gBall(V3(s * 0.12, Y + 0.08, 0.27), 0.07, 1, 1.3, 0.5, 8), "head", dark, "plain"); R.add(gBall(V3(s * 0.12, Y + 0.09, 0.31), 0.03, 1, 1, 0.5, 6), "head", eye, "glow", true); }
  R.add(gBall(V3(0, Y - 0.1, 0.28), 0.12, 1.6, 0.4, 0.5, 8), "head", dark, "plain");
  for (let k = 0; k < 4; k++) R.add(gBall(V3(0, Y - 0.12 - k * 0.08, 0.3 + (k % 2) * 0.02 - 0.03 * k), 0.03, 1, 1.2, 0.6, 5), "head", 0xf0f0e0, "bone");
  R.add(gTaper(V3(0, Y + 0.3, -0.05), V3(0.05, Y + 0.5, -0.12), 0.04, 0.025, 6), "body", 0x3a2a22, "wood");
  R.add(gBall(V3(0.06, Y + 0.54, -0.14), 0.07, 1, 1.3, 1, 8), "body", 0xffe082, "glow", true);
  R.meta = { kind: "bat", headTop: Y + 0.65 };
  return R.finish();
}

function birdEntry(col, comb, beak) {
  const R = new RigBuilder();
  const Y = 0.22;
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, Y, 0);
  R.bone("head", "body", 0, Y + 0.12, 0.09);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) { R.bone("leg" + sd, "body", s * 0.04, Y - 0.05, 0); R.bone("wing" + sd, "body", s * 0.08, Y + 0.03, 0); }
  const dark = new THREE.Color(col).multiplyScalar(0.75).getHex();
  R.add(gBall(V3(0, Y, 0), 0.1, 0.85, 0.85, 1.2, 10), "body", col, "feather");
  R.add(gTaper(V3(0, Y + 0.02, -0.1), V3(0, Y + 0.1, -0.18), 0.05, 0.01, 6, 0.4), "body", dark, "feather");
  R.add(gBall(V3(0, Y + 0.14, 0.1), 0.055, 1, 1, 1, 8), "head", col, "feather");
  R.add(gTaper(V3(0, Y + 0.13, 0.15), V3(0, Y + 0.12, 0.2), 0.016, 0.002, 5), "head", beak || 0xe8a030, "bone");
  if (comb) R.add(gBall(V3(0, Y + 0.2, 0.1), 0.03, 0.4, 1, 1.2, 6), "head", comb, "plain");
  for (const s of [-1, 1]) {
    const sd = s > 0 ? "L" : "R";
    R.add(gBall(V3(s * 0.035, Y + 0.155, 0.135), 0.009, 1, 1, 0.6, 5), "head", 0x111111, "plain");
    R.add(gTaper(V3(s * 0.04, Y - 0.05, 0), V3(s * 0.04, 0.01, 0.01), 0.008, 0.007, 5), "leg" + sd, 0xe8a030, "bone");
    R.add(gBall(V3(s * 0.08, Y + 0.02, -0.01), 0.07, 0.25, 0.7, 1.1, 8), "wing" + sd, dark, "feather");
  }
  R.meta = { kind: "bird", headTop: 0.45 };
  return R.finish();
}

const DISTRICT_DRESS = {
  res: { tops: ["shirt", "apron", "tunic", "vest"], pal: [0xc8b890, 0x8a9a6a, 0x9a7a5a, 0xa8b0a0, 0xb08a6a], head: [["bandana", 0.1]], held: ["basket", "broom", null, null], boots: 0x4a3a28 },
  gov: { tops: ["coat", "coat", "robe", "tabard"], pal: [0x2a3a5a, 0x3a4a7a, 0x4a3a5a, 0x2a4a4a], trim: 0xd8c070, head: [["mortar", 0.25], ["feathered", 0.15]], held: ["scroll", "book", "ledger", null], boots: 0x2a1a10 },
  market: { tops: ["apron", "vest", "coat", "apron"], pal: [0xc86a3a, 0xd8a838, 0x5a8aa8, 0x9a4a5a, 0x6a9a5a], head: [["bandana", 0.3], ["widebrim", 0.15], ["beret", 0.1]], held: ["basket", "ledger", "tankard", null], boots: 0x3a2818 },
  ind: { tops: ["apron", "vest", "tunic"], pal: [0x4a3a30, 0x5a4a3a, 0x3a3a3a, 0x6a4a2a], trim: 0x8a8f96, head: [["bandana", 0.35], ["headband", 0.15]], held: ["hammer", "hammer", null], gloves: [0x3a2a1a, 0.7], boots: 0x2a1e14, belt: 0x2a1a10 },
  gate: { tops: ["coat", "vest", "mail"], pal: [0x5a4a2a, 0x3f5a2c, 0x4a5a6a, 0x6a5a3a], trim: 0xb08a50, head: [["widebrim", 0.25], ["furhat", 0.15], ["cap", 0.15]], held: ["spear", "staffwalk", null], cape: 0.3, boots: 0x3a2a1a },
  fish: { tops: ["vest", "apron", "tunic"], pal: [0x3a6a8a, 0xd8d0c0, 0x4a8a7a, 0x7a9aa8], head: [["bandana", 0.35], ["widebrim", 0.2]], held: ["basket", "rod", null], boots: 0x3a3a3a },
  square: { tops: ["coat", "vest", "shirt"], pal: [0x2a4a6a, 0xd8d0c0, 0x8a2a2a, 0x3a5a7a], trim: 0xd8c070, head: [["tricorne", 0.25], ["widebrim", 0.2]], held: ["spyglass", "ledger", null], boots: 0x2a1a10 },
  yard: { tops: ["apron", "vest", "tunic"], pal: [0x6a5a3a, 0x4a4a52, 0x7a5a3a, 0x3a4a5a], head: [["bandana", 0.3], ["cap", 0.2]], held: ["hammer", "oar", null], gloves: [0x5a3a22, 0.6], boots: 0x2a1e14, belt: 0x3a2412 },
  docks: { tops: ["vest", "shirt", "tunic"], pal: [0x2a4a6a, 0xd8d0c0, 0x4a6a8a, 0x8a3a2a], head: [["tricorne", 0.2], ["bandana", 0.3], ["cap", 0.2]], held: ["oar", "rod", "basket", null], boots: 0x2a2a2a },
  keep: { tops: ["coat", "tabard", "robe"], pal: [0x2a3a5a, 0x3a4a6a, 0x5a2a3a], trim: 0xd8c070, head: [["mortar", 0.2], ["feathered", 0.2]], held: ["scroll", null], boots: 0x2a1a10 },
  south: { tops: ["shirt", "apron", "tunic", "vest"], pal: [0xc8b890, 0x8a9a6a, 0x9a7a5a, 0xb08a6a], head: [["bandana", 0.1]], held: ["basket", "broom", null], boots: 0x4a3a28 },
  forge: { tops: ["apron", "vest", "tunic"], pal: [0x4a3a30, 0x6a3a2a, 0x3a3a3a], trim: 0xff8a50, head: [["bandana", 0.4], ["headband", 0.15]], held: ["hammer", "hammer", null], gloves: [0x3a2a1a, 0.8], boots: 0x2a1e14, belt: 0x2a1a10 }
};
const WALKER_RACES = [["human", 0.5], ["elari", 0.15], ["pipkin", 0.1], ["ursan", 0.1], ["nekari", 0.15]];

function walkerCoded(seed, district, night) {
  const r = seeded(hashStr("walkerC" + seed + (district || "")));
  const pick = a => a[Math.floor(r() * a.length)], D = DISTRICT_DRESS[district] || DISTRICT_DRESS.res;
  let q = r(), race = "human";
  for (const [k, w] of WALKER_RACES) { if (q < w) { race = k; break; } q -= w; }
  const fem = race === "ursan" ? false : r() < 0.5;
  const base = baseFromLook({ race, build: fem ? 1 : 0, face: Math.floor(r() * FACE_COUNT), skinTone: 0 });
  const L = Object.assign(base, {
    skin: race === "human" || race === "elari" || race === "nekari" ? SKIN_TONES[Math.floor(r() * SKIN_TONES.length)] : base.skin,
    hair: { style: pick(HAIR_BY_SEX[fem ? 1 : 0]), color: pick(HAIR_COLORS) }
  });
  if (race === "ursan") L.hair = { style: "bald", color: 0x222222 };
  const ty = pick(D.tops), col = pick(D.pal), shade = shadeHex(col, 0.75);
  const topRegion = ty === "mail" ? "chain" : ty === "apron" || ty === "vest" ? "leather" : "cloth";
  L.top = { type: ty, color: ty === "mail" ? 0x8a9098 : col, region: topRegion, color2: 0xd8d0c0, under: pick([0xe8e0d0, 0xd8cfb8, 0xc8c0a8]), trim: D.trim && r() < 0.8 ? D.trim : null };
  if (ty === "mail") L.top.plate = 0x8a9098;
  L.legs = shade; L.boots = D.boots || 0x3a2a1e; L.belt = D.belt || pick([0x3a2412, 0x5a3a20, 0x2a2a2a]);
  for (const [t, p] of D.head || []) if (r() < p) { L.head = { type: t, color: pick(D.pal), color2: D.trim || 0xd8c070 }; break; }
  if (L.head && L.head.type === "tricorne") L.head.color = 0x2a2a3a;
  if (race === "nekari") delete L.head;
  if (D.gloves && r() < D.gloves[1]) L.gloves = D.gloves[0];
  if (D.cape && r() < D.cape) L.cape = shadeHex(col, 0.7);
  if (race === "pipkin") L.held = null; else L.held = pick(D.held);
  if (night) { L.cape = L.cape || 0x2a2a3a; L.held = "lantern"; if (L.head && L.head.type === "bandana") delete L.head; }
  if (race === "ursan" || race === "pipkin") { L.prop = bodyProp({ race, build: fem ? 1 : 0, height: 2, girth: 2 }) || L.prop; }
  return L;
}

function walkerLook(seed, district, night) {
  if (district) return walkerCoded(seed, district, night);
  const r = seeded(hashStr("walker" + seed));
  const fem = r() < 0.5, pick = a => a[Math.floor(r() * a.length)];
  const pal = [0x8a5a3a, 0x3a5a7a, 0x6a7a3a, 0x7a3a3a, 0xc8b890, 0x5a4a6a, 0x2f4a5a, 0x8a7a4a, 0xa05a3a, 0x4a6a5a, 0x6a4a3a, 0xb8a888, 0x5a2a3a, 0x3a3a52];
  const ty = pick(["shirt", "vest", "apron", "tunic", "tunic", "vest", "robe", "coat"]), col = pick(pal);
  const L = { face: Math.floor(r() * FACE_COUNT), build: fem ? 1 : 0, skin: SKIN_TONES[Math.floor(r() * SKIN_TONES.length)], hair: { style: pick(HAIR_BY_SEX[fem ? 1 : 0]), color: pick(HAIR_COLORS) }, top: { type: ty, color: col, color2: pick([0xd8d0c0, 0x8a6a40, 0xe8e0c8]), under: pick([0xd8cfb8, 0xc8c0a8, 0xe8e0d0]), trim: r() < 0.35 ? pick([0xd8c070, 0x8a3a2a, 0x3a5a7a]) : null }, legs: pick([0x3a3028, 0x2a2a30, 0x4a3a2c, 0x5a4a38, 0x3a3a44]), boots: pick([0x2a1a10, 0x3a2818, 0x4a3a28]), belt: pick([0x3a2412, 0x5a3a20, 0x2a2a2a]) };
  const hat = r();
  if (hat < 0.14) L.head = { type: "bandana", color: pick(pal) }; else if (hat < 0.24) L.head = { type: "widebrim", color: pick([0x8a7a4a, 0x5a4a32, 0x3a3a3a]), color2: 0xd8c070 }; else if (hat < 0.3) L.head = { type: "furhat", color: 0x6a4a2a };
  if (r() < 0.12) L.cape = pick(pal);
  if (r() < 0.1) L.collar = 0xd8c8a8;
  if (r() < 0.15) L.gloves = pick([0x5a3a22, 0x3a2a1a]);
  if (fem && r() < 0.3) L.prop = { girth: 0.9 }; else if (!fem && r() < 0.3) L.prop = { girth: 1.12 };
  L.held = pick([null, null, null, "basket", "broom", "tankard", "book", "staffwalk", "scroll"]);
  return L;
}

function wispEntry(col, eye) {
  const R = new RigBuilder();
  const Y = 1.3;
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, Y, 0);
  R.bone("head", "body", 0, Y, 0);
  const light = new THREE.Color(col).lerp(new THREE.Color(0xffffff), 0.5).getHex();
  R.add(gBall(V3(0, Y, 0), 0.17, 1, 1.1, 1, 14), "body", col, "glow", true);
  R.add(gBall(V3(0, Y + 0.02, 0.04), 0.1, 1, 1, 1, 10), "body", light, "glow", true);
  for (const s of [-1, 1]) R.add(gBall(V3(s * 0.06, Y + 0.03, 0.14), 0.025, 1, 1.3, 0.6, 6), "head", eye || 0xffffff, "glow", true);
  for (let i = 0; i < 3; i++) R.add(gTaper(V3(0, Y - 0.08 - i * 0.02, -0.1 - i * 0.1), V3((i - 1) * 0.06, Y - 0.3 - i * 0.08, -0.3 - i * 0.12), 0.05 - i * 0.012, 0.004, 6), "body", col, "glow", true);
  R.meta = { kind: "bat", headTop: Y + 0.25 };
  return R.finish();
}

function beeEntry(col, col2) {
  const R = new RigBuilder();
  const Y = 0.95;
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, Y, 0);
  R.bone("head", "body", 0, Y + 0.02, 0.2);
  R.bone("tail", "body", 0, Y - 0.02, -0.2);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) { R.bone("wing" + sd, "body", s * 0.06, Y + 0.12, 0.02); R.bone("wing2" + sd, "body", s * 0.05, Y + 0.11, -0.08); }
  const dark = 0x2a2218, light = new THREE.Color(col).lerp(new THREE.Color(0xffffff), 0.3).getHex();
  R.add(gBall(V3(0, Y, 0.02), 0.16, 1, 0.9, 1.1, 14), "body", col, "fur");
  R.add(gBall(V3(0, Y - 0.03, -0.27), 0.19, 1, 0.9, 1.7, 14), "tail", col2 || dark, "fur");
  for (let i = 0; i < 4; i++) R.add(gRing(V3(0, Y - 0.03, -0.12 - i * 0.1), 0.18 - i * 0.025, 0.022, "z", 16), "tail", i % 2 ? col : dark, "fur");
  R.add(gTaper(V3(0, Y - 0.06, -0.56), V3(0, Y - 0.1, -0.74), 0.035, 0.003, 6), "tail", dark, "bone");
  R.add(gBall(V3(0, Y + 0.02, 0.24), 0.11, 1, 0.95, 0.9, 12), "head", dark, "fur");
  for (const s of [-1, 1]) {
    const sd = s > 0 ? "L" : "R";
    R.add(gBall(V3(s * 0.056, Y + 0.05, 0.316), 0.04, 0.75, 1.1, 0.8, 12), "head", 0x8a1a1a, "glow", true);
    R.add(gBall(V3(s * 0.066, Y + 0.062, 0.34), 0.011, 1, 1, 1, 6), "head", 0xffd0c0, "glow", true);
    R.add(gTaper(V3(s * 0.03, Y + 0.11, 0.28), V3(s * 0.12, Y + 0.3, 0.34), 0.012, 0.004, 5), "head", dark, "bone");
    R.add(gMembrane([[0.04, 0.08], [0.42, 0.12], [0.48, 0.0], [0.32, -0.12], [0.06, -0.08]].map(([x, z]) => [s * x, z]), Y + 0.12), "wing" + sd, 0xe8f4ff, "glow");
    R.add(gMembrane([[0.03, 0.0], [0.4, -0.02], [0.45, -0.14], [0.25, -0.2], [0.05, -0.12]].map(([x, z]) => [s * x, z]), Y + 0.11), "wing2" + sd, 0xe8f4ff, "glow");
    for (let k = 0; k < 3; k++) R.add(gTaper(V3(s * 0.1, Y - 0.08, 0.12 - k * 0.1), V3(s * 0.2, Y - 0.24, 0.1 - k * 0.1), 0.012, 0.004, 5), "body", dark, "bone");
  }
  R.meta = { kind: "bee", headTop: Y + 0.35 };
  return R.finish();
}

function crawlerEntry(col, col2) {
  const R = new RigBuilder();
  const n = 6, Y0 = 0.27;
  const zs = []; for (let i = 0; i < n; i++) zs.push(-0.7 + i * 0.28);
  const lift = i => i >= n - 2 ? (i - (n - 3)) * 0.07 : 0;
  R.bone("root", null, 0, 0, 0);
  for (let i = 0; i < n; i++) R.bone("t" + i, i ? "t" + (i - 1) : "root", 0, Y0 + lift(i), zs[i]);
  R.bone("head", "t" + (n - 1), 0, Y0 + lift(n) + 0.02, zs[n - 1] + 0.22);
  for (let i = 0; i < n; i++) for (const s of [-1, 1]) R.bone((s > 0 ? "lL" : "lR") + i, "t" + i, s * 0.14, Y0 + lift(i) - 0.06, zs[i]);
  const c = new THREE.Color(col), dark = c.clone().multiplyScalar(0.55).getHex(), belly = col2 || c.clone().lerp(new THREE.Color(0xf0e4b0), 0.5).getHex();
  for (let i = 0; i < n; i++) {
    const Y = Y0 + lift(i);
    const r = 0.205 + 0.025 * Math.sin(i / (n - 1) * Math.PI);
    R.add(gBall(V3(0, Y + 0.02, zs[i]), r, 1.05, 0.9, 1.0, 12), "t" + i, col, "scale");
    R.add(gBall(V3(0, Y - 0.05, zs[i]), r * 0.8, 1, 0.55, 0.9, 10), "t" + i, belly, "skin");
    R.add(gRing(V3(0, Y + 0.02, zs[i] + 0.14), r * 0.95, 0.018, "z", 16), "t" + i, dark, "scale");
    for (const s of [-1, 1]) { const ln = (s > 0 ? "lL" : "lR") + i; R.add(gTaper(V3(s * 0.14, Y - 0.06, zs[i]), V3(s * 0.26, Y0 - 0.24, zs[i] + 0.02), 0.035, 0.014, 5), ln, dark, "skin"); R.add(gBall(V3(s * 0.26, Y0 - 0.25, zs[i] + 0.02), 0.032, 1, 0.6, 1, 6), ln, dark, "skin"); }
    if (i % 2) R.add(gTaper(V3(0, Y + 0.17, zs[i]), V3(0, Y + 0.3, zs[i] - 0.04), 0.03, 0.004, 5), "t" + i, dark, "bone");
  }
  const hz = zs[n - 1] + 0.22, Y = Y0 + lift(n);
  R.add(gBall(V3(0, Y + 0.02, hz), 0.2, 1.1, 0.95, 1.05, 12), "head", dark, "scale");
  for (const s of [-1, 1]) {
    R.add(gBall(V3(s * 0.09, Y + 0.08, hz + 0.12), 0.05, 1, 1.2, 0.8, 8), "head", 0xffb300, "glow", true);
    R.add(gTaper(V3(s * 0.08, Y - 0.02, hz + 0.14), V3(s * 0.04, Y - 0.06, hz + 0.3), 0.03, 0.004, 5), "head", 0xf0e8d0, "bone");
    R.add(gTaper(V3(s * 0.05, Y + 0.14, hz + 0.08), V3(s * 0.18, Y + 0.34, hz + 0.16), 0.012, 0.003, 5), "head", dark, "bone");
  }
  R.meta = { kind: "crawler", headTop: 0.72 };
  return R.finish();
}

function gSweepZ(rings, seg, capA, capB) {
  const n = Math.max(8, sgK(seg || 18)), m = rings.length, pos = [], uv = [], idx = [];
  for (let j = 0; j < m; j++) {
    const r = rings[j], p = r.p || 2.2;
    for (let i = 0; i <= n; i++) {
      const t = i / n * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t);
      const ex = Math.sign(c) * Math.pow(Math.abs(c), 2 / p), ey = Math.sign(sn) * Math.pow(Math.abs(sn), 2 / p);
      pos.push((r.x || 0) + ex * r.rx, (r.y || 0) + ey * r.ry * (ey >= 0 ? (r.top || 1) : (r.bot || 1)), r.z);
      uv.push(i / n, j / (m - 1));
    }
  }
  for (let j = 0; j < m - 1; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i, b = a + n + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const cap = (j, dir) => { const r = rings[j], ci = pos.length / 3; pos.push(r.x || 0, r.y || 0, r.z + dir * Math.min(r.rx, r.ry) * 0.45); uv.push(0.5, j ? 1 : 0); for (let i = 0; i < n; i++) { const a = j * (n + 1) + i; if (dir < 0) idx.push(ci, a, a + 1); else idx.push(ci, a + 1, a); } };
  if (capA) cap(0, -1);
  if (capB) cap(m - 1, 1);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const nr = g.attributes.normal, pa = g.attributes.position, mid = Math.floor(m / 2) * (n + 1);
  if (nr.getX(mid) * (pa.getX(mid) - (rings[Math.floor(m / 2)].x || 0)) < 0) { const ix = g.index.array; for (let k = 0; k < ix.length; k += 3) { const t = ix[k + 1]; ix[k + 1] = ix[k + 2]; ix[k + 2] = t; } g.computeVertexNormals(); }
  for (let j = 0; j < m; j++) { const a = j * (n + 1), b = a + n; const v = V3(nr.getX(a) + nr.getX(b), nr.getY(a) + nr.getY(b), nr.getZ(a) + nr.getZ(b)).normalize(); nr.setXYZ(a, v.x, v.y, v.z); nr.setXYZ(b, v.x, v.y, v.z); }
  return g;
}
function animalHead(R, bone, o) {
  const h = o.r, cx = o.x || 0, cy = o.y, cz = o.z, mz = o.snout == null ? 0.6 : o.snout, mw = o.mw || 1, fl = o.flat || 1, col = o.col, reg = o.region || "fur", light = o.light || col;
  const rg = (z, rx, ry, y, top, bot, p) => ({ x: cx, z: cz + z * h, rx: rx * h, ry: ry * h * fl, y: cy + (y || 0) * h * fl, top, bot, p });
  const nz = 0.55 + mz;
  R.add(gSweepZ([rg(-0.8, 0.42, 0.45, 0.05), rg(-0.55, 0.82, 0.8, 0.05, 1.05, 0.9), rg(-0.15, 0.9, 0.82, 0.02, 1.0, 0.95), rg(0.2, 0.78 * Math.max(0.9, mw * 0.85), 0.66, -0.04, 0.95, 0.9), rg(0.5, 0.56 * mw, 0.5, -0.14, 0.9, 0.85), rg(0.55 + mz * 0.55, 0.44 * mw, 0.4, -0.2, 0.92, 0.8, 2.4), rg(nz, 0.32 * mw, 0.3, -0.24, 0.9, 0.7, 2.6)], 20, true, true), bone, col, reg);
  R.add(gSweepZ([rg(0.05, 0.42 * mw, 0.16, -0.5), rg(0.4, 0.4 * mw, 0.15, -0.52), rg(nz - 0.08, 0.26 * mw, 0.1, -0.5, 1, 1, 2.6)], 14, true, true), bone, light, reg);
  R.add(gBall(V3(cx, cy + (-0.22 + 0.06) * h * fl, cz + (nz + 0.1) * h), 0.17 * h * mw, 1.25, 0.9, 0.6, 8), bone, o.nose || 0x2a1e1a, o.noseRegion || "skin");
  for (const s of [-1, 1]) {
    R.add(gBall(V3(cx + s * 0.11 * h * mw, cy - 0.2 * h * fl, cz + (nz + 0.2) * h), 0.05 * h, 1.2, 0.8, 0.6, 6), bone, 0x100808, "plain");
    const ex = cx + s * 0.66 * h, ey = cy + 0.2 * h * fl, ez = cz + (0.08 + (o.eyeFwd || 0)) * h;
    R.add(gBall(V3(ex, ey, ez), 0.17 * h * (o.eyeK || 1), 1, 1, 0.75, 8), bone, o.eye || 0x111111, o.eyeGlow ? "glow" : "plain", !!o.eyeGlow);
    R.add(gBall(V3(ex + s * 0.02 * h, ey + 0.05 * h, ez + 0.04 * h), 0.045 * h, 1, 1, 1, 4), bone, 0xffffff, "glow", true);
    R.add(gBall(V3(cx + s * 0.55 * h, ey + 0.2 * h * fl, ez + 0.05 * h), 0.22 * h, 1.1, 0.45, 0.9, 8), bone, col, reg);
    if (o.mouthLine) R.add(gTaper(V3(cx + s * 0.4 * h * mw, cy - 0.38 * h * fl, cz + 0.05 * h), V3(cx + s * 0.22 * h * mw, cy - 0.36 * h * fl, cz + (nz - 0.05) * h), 0.02 * h, 0.012 * h, 4), bone, 0x1a120e, "plain");
  }
}

function quadEntry(o) {
  if (!o.chunked) o = Object.assign({}, o, { chunked: true, headR: o.headR * 1.18, legR: o.legR * 1.28, neckR: o.neckR * 1.15, tailR: (o.tailR || 0) * 1.2 });
  const R = new RigBuilder();
  const L = o.leg, B = o.bodyY, bl = o.bodyLen;
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, B, 0);
  R.bone("neck", "body", 0, B + o.neckUp * 0.3, bl * 0.45);
  R.bone("head", "neck", 0, B + o.neckUp, bl * 0.45 + o.neckFwd);
  R.bone("tail", "body", 0, B, -bl * 0.5);
  R.bone("tail2", "tail", 0, B - o.tailDrop * 0.5, -bl * 0.5 - o.tailLen * 0.5);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) {
    R.bone("legF" + sd, "body", s * o.hip, B - 0.02, bl * 0.32);
    R.bone("shinF" + sd, "legF" + sd, s * o.hip, B - L * 0.5, bl * 0.32);
    R.bone("legB" + sd, "body", s * o.hip, B - 0.02, -bl * 0.32);
    R.bone("shinB" + sd, "legB" + sd, s * o.hip, B - L * 0.5, -bl * 0.32);
  }
  const col = o.col, reg = o.region || "fur", dark = new THREE.Color(col).multiplyScalar(0.6).getHex(), light = o.belly || new THREE.Color(col).lerp(new THREE.Color(0xf2ede4), 0.45).getHex();
  const SL = o.slim, bw = o.bodyW || 0.7, rr = o.bodyR;
  const TORSO = [[0, 0.42, 0.5, 0, 1, 1], [0.08, 0.7, 0.82, 0.02, 1, 0.95], [0.22, 0.9, 0.98, 0, 1, 0.9], [0.42, 0.84, 0.86, 0.04, 1, 0.72], [0.62, 0.95, 1.06, 0, 1, 0.85], [0.82, 0.9, 1.0, 0.01, 1, 0.9], [0.94, 0.66, 0.78, 0.05, 1, 1], [1, 0.42, 0.55, 0.07, 1, 1]];
  if (SL) R.add(gSweepZ(TORSO.map(t => ({ x: 0, y: B + rr * t[3], rx: rr * t[1] * bw, ry: rr * t[2], z: -bl / 2 + t[0] * bl, p: 2.4, top: t[4], bot: t[5] })), 16, true, true), "body", col, reg);
  else R.add(gBall(V3(0, B, 0), o.bodyR, 1, o.bodyH || 0.95, bl / o.bodyR * 0.5, 16), "body", col, reg);
  if (o.wool) for (let k = 0; k < 10; k++) { const a = k * 2.4; R.add(gBall(V3(Math.sin(a) * o.bodyR * 0.7, B + o.bodyR * 0.45 + (k % 2) * 0.05, Math.cos(a) * bl * 0.4), o.bodyR * 0.45, 1, 0.9, 1, 8), "body", light, "fur"); }
  if (SL) R.add(gBall(V3(0, B - rr * 0.5, 0), rr * 0.62, bw * 0.7, 0.55, bl / (rr * 0.62) * 0.4, 12), "body", light, reg); else R.add(gBall(V3(0, B - o.bodyR * 0.25, 0), o.bodyR * 0.85, 0.95, 0.7, bl / o.bodyR * 0.45, 12), "body", light, reg);
  R.add(gTaper(V3(0, B + o.neckUp * 0.2, bl * 0.42), V3(0, B + o.neckUp, bl * 0.45 + o.neckFwd), o.neckR, o.neckR * 0.8, 8), "neck", col, reg);
  const hy = B + o.neckUp, hz = bl * 0.45 + o.neckFwd;
  animalHead(R, "head", { r: o.headR, y: hy, z: hz, snout: o.snout != null ? o.snout : 0.6, mw: o.mw, flat: o.flat, col, light, region: reg, eye: o.eye, eyeGlow: o.eyeGlow, mouthLine: o.mouthLine, nose: o.nose || (reg === "scale" ? dark : 0x2a1e1a), noseRegion: reg === "scale" ? "scale" : "skin" });
  for (const s of [-1, 1]) {
    if (o.ears) { const droop = o.droop ? -1 : 1, ep = V3(s * o.headR * 0.62, hy + o.headR * 0.62 * (o.droop ? 0.6 : 1), hz - o.headR * 0.25), tip = ep.clone().add(V3(s * o.headR * (o.droop ? 0.9 : 0.35), droop * o.headR * 0.55 * o.ears, -o.headR * 0.25)); R.add(gTaper(ep, tip, o.headR * 0.3, o.headR * 0.03, 8, 0.32), "head", col, reg); R.add(gTaper(ep.clone().add(V3(0, 0, o.headR * 0.03)), ep.clone().lerp(tip, 0.85).add(V3(0, 0, o.headR * 0.03)), o.headR * 0.2, o.headR * 0.02, 6, 0.2), "head", 0xd8a8a0, "skin"); }
    if (o.horns) R.add(gTaper(V3(s * o.headR * 0.5, hy + o.headR * 0.7, hz - 0.02), V3(s * o.headR * 1.2, hy + o.headR * 0.5, hz - 0.2), o.headR * 0.18, 0.006, 6), "head", 0xd8ccb0, "bone");
    const sd = s > 0 ? "L" : "R";
    for (const [p, zz] of [["F", bl * 0.32], ["B", -bl * 0.32]]) {
      if (SL) {
        const hx = Math.min(o.hip, rr * bw * 0.78), lr = o.legR, back = p === "B";
        R.add(gTaper(V3(s * hx, B - 0.02, zz), V3(s * hx * 1.02, B - L * 0.5, zz), lr * (back ? 1.55 : 1.3), lr * 0.72, 8), "leg" + p + sd, col, reg);
        R.add(gBall(V3(s * hx, B - rr * 0.12, zz + (back ? -0.02 : 0.02)), rr * (back ? 0.52 : 0.42), 0.7, 1.05, 0.95, 10), "leg" + p + sd, col, reg);
        R.add(gTaper(V3(s * hx * 1.02, B - L * 0.5, zz), V3(s * hx * 1.02, 0.03, zz + 0.01), lr * 0.62, lr * 0.44, 7), "shin" + p + sd, col, reg);
        R.add(gBall(V3(s * hx * 1.02, B - L * 0.5, zz), lr * 0.78, 1, 1, 1, 7), "shin" + p + sd, col, reg);
        R.add(gBall(V3(s * hx * 1.02, 0.025, zz + 0.02), lr * 0.72, 1, 0.55, 1.35, 7), "shin" + p + sd, dark, o.hoof ? "bone" : reg);
      } else {
      R.add(gTaper(V3(s * o.hip, B - 0.02, zz), V3(s * o.hip * 1.05, B - L * 0.5, zz), o.legR, o.legR * 0.8, 7), "leg" + p + sd, col, reg);
      R.add(gTaper(V3(s * o.hip * 1.05, B - L * 0.5, zz), V3(s * o.hip * 1.05, 0.03, zz + 0.02), o.legR * 0.8, o.legR * 0.6, 7), "shin" + p + sd, col, reg);
      R.add(gBall(V3(s * o.hip * 1.05, 0.03, zz + 0.03), o.legR * 0.95, 1.1, 0.5, 1.3, 7), "shin" + p + sd, dark, o.hoof ? "bone" : reg);
      }
    }
  }
  if (o.tailLen > 0) {
    R.add(gTaper(V3(0, B, -bl * 0.5), V3(0, B - o.tailDrop * 0.5, -bl * 0.5 - o.tailLen * 0.5), o.tailR, o.tailR * 0.7, 7), "tail", col, reg);
    R.add(gTaper(V3(0, B - o.tailDrop * 0.5, -bl * 0.5 - o.tailLen * 0.5), V3(0, B - o.tailDrop, -bl * 0.5 - o.tailLen), o.tailR * 0.7, o.tailR * 0.2, 7), "tail2", col, reg);
  }
  if (o.spines) for (let k = 0; k < o.spines; k++) R.add(gTaper(V3(0, B + o.bodyR * 0.85, bl * 0.35 - k * (bl * 0.7 / o.spines)), V3(0, B + o.bodyR * 0.85 + 0.12, bl * 0.35 - k * (bl * 0.7 / o.spines) - 0.04), 0.03, 0.004, 5), "body", dark, "bone");
  R.meta = { kind: "quad", headTop: hy + o.headR * 1.4, quad: { stride: o.stride || 1.2, hop: !!o.hop, leg: L, bodyY: B, sprawl: o.region === "scale" } };
  return R.finish();
}

function sheepEntry(col) { return quadEntry({ col, belly: 0xf4f0e6, bodyY: 0.55, bodyR: 0.3, bodyLen: 0.74, leg: 0.47, hip: 0.14, legR: 0.045, neckUp: 0.1, neckFwd: 0.18, neckR: 0.09, headR: 0.12, ears: 0.9, droop: true, snout: 0.75, mw: 0.8, hoof: true, wool: true, tailLen: 0.1, tailDrop: 0.05, tailR: 0.05, stride: 1.1 }); }
function lizardEntry(col, belly) { return quadEntry({ col, belly, region: "scale", bodyY: 0.22, bodyR: 0.18, bodyLen: 0.7, leg: 0.2, hip: 0.22, legR: 0.045, neckUp: 0.04, neckFwd: 0.22, neckR: 0.1, headR: 0.12, snout: 0.9, mw: 1.1, flat: 0.62, mouthLine: true, eye: 0xffd54f, eyeGlow: true, tailLen: 0.7, tailDrop: 0.1, tailR: 0.1, spines: 5, stride: 0.9 }); }
function longneckEntry(col) { return quadEntry({ col, bodyY: 1.3, bodyR: 0.45, bodyLen: 1.5, leg: 1.1, hip: 0.22, legR: 0.08, neckUp: 1.0, neckFwd: 0.5, neckR: 0.13, headR: 0.15, ears: 1.0, snout: 1.0, mw: 0.75, hoof: true, tailLen: 0.5, tailDrop: 0.3, tailR: 0.08, stride: 2.4 }); }

function crabEntry(col, col2) {
  const R = new RigBuilder();
  const Y = 0.22;
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, Y, 0);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) {
    R.bone("arm" + sd, "body", s * 0.25, Y, 0.18);
    R.bone("claw" + sd, "arm" + sd, s * 0.42, Y + 0.02, 0.32);
    for (let k = 0; k < 4; k++) R.bone("leg" + sd + k, "body", s * 0.28, Y - 0.02, 0.1 - k * 0.1);
  }
  const dark = new THREE.Color(col).multiplyScalar(0.6).getHex(), under = col2 || new THREE.Color(col).lerp(new THREE.Color(0xf0dcc0), 0.5).getHex();
  R.add(gBall(V3(0, Y, 0), 0.34, 1, 0.5, 0.8, 16), "body", col, "scale");
  R.add(gBall(V3(0, Y - 0.06, 0), 0.3, 0.95, 0.4, 0.75, 12), "body", under, "skin");
  for (let k = 0; k < 5; k++) R.add(gBall(V3(-0.24 + k * 0.12, Y + 0.14, 0.16), 0.035, 1, 0.8, 1, 6), "body", dark, "scale");
  for (const s of [-1, 1]) {
    const sd = s > 0 ? "L" : "R";
    R.add(gTaper(V3(s * 0.06, Y + 0.1, 0.24), V3(s * 0.07, Y + 0.24, 0.26), 0.02, 0.03, 6), "body", dark, "bone");
    R.add(gBall(V3(s * 0.07, Y + 0.25, 0.26), 0.04, 1, 1, 1, 6), "body", 0x111111, "plain");
    R.add(gTaper(V3(s * 0.25, Y, 0.18), V3(s * 0.42, Y + 0.02, 0.32), 0.055, 0.05, 7), "arm" + sd, col, "scale");
    R.add(gBall(V3(s * 0.48, Y + 0.02, 0.38), 0.11, 1.4, 0.7, 1.1, 10), "claw" + sd, col, "scale");
    R.add(gTaper(V3(s * 0.52, Y + 0.06, 0.44), V3(s * 0.58, Y + 0.08, 0.62), 0.045, 0.006, 6), "claw" + sd, dark, "bone");
    R.add(gTaper(V3(s * 0.52, Y - 0.02, 0.44), V3(s * 0.56, Y - 0.04, 0.6), 0.04, 0.006, 6), "claw" + sd, dark, "bone");
    for (let k = 0; k < 4; k++) {
      const z = 0.1 - k * 0.1;
      R.add(gTaper(V3(s * 0.28, Y - 0.02, z), V3(s * 0.5, Y + 0.08, z - 0.03), 0.03, 0.022, 6), "leg" + sd + k, col, "scale");
      R.add(gTaper(V3(s * 0.5, Y + 0.08, z - 0.03), V3(s * 0.6, 0.02, z - 0.06), 0.022, 0.006, 6), "leg" + sd + k, dark, "scale");
    }
  }
  R.meta = { kind: "crab", headTop: 0.5 };
  return R.finish();
}

function mandrakeEntry(col, leaf) {
  const R = new RigBuilder();
  const Y = 0.32;
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, Y, 0);
  R.bone("head", "body", 0, Y + 0.3, 0);
  R.bone("leaf", "head", 0, Y + 0.5, -0.02);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) { R.bone("arm" + sd, "body", s * 0.17, Y + 0.08, 0.02); R.bone("leg" + sd, "body", s * 0.09, Y - 0.14, 0); }
  const dark = new THREE.Color(col).multiplyScalar(0.65).getHex(), lf = leaf || 0x5aa84a, lfd = new THREE.Color(lf).multiplyScalar(0.6).getHex();
  R.add(gBall(V3(0, Y, 0), 0.2, 1, 1.15, 0.95, 14), "body", col, "skin");
  R.add(gBall(V3(0, Y + 0.3, 0.02), 0.19, 1.05, 0.95, 1, 14), "head", col, "skin");
  for (const s of [-1, 1]) {
    const sd = s > 0 ? "L" : "R";
    R.add(gBall(V3(s * 0.08, Y + 0.33, 0.17), 0.04, 1, 1.1, 0.6, 8), "head", 0x111111, "plain");
    R.add(gBall(V3(s * 0.08, Y + 0.34, 0.19), 0.012, 1, 1, 0.6, 5), "head", 0xffffff, "plain");
    R.add(gTaper(V3(s * 0.17, Y + 0.08, 0.02), V3(s * 0.3, Y - 0.06, 0.08), 0.045, 0.02, 6), "arm" + sd, dark, "skin");
    R.add(gTaper(V3(s * 0.09, Y - 0.14, 0), V3(s * 0.1, 0.02, 0.03), 0.055, 0.045, 6), "leg" + sd, dark, "skin");
    R.add(gBall(V3(s * 0.1, 0.02, 0.06), 0.06, 1.1, 0.5, 1.4, 7), "leg" + sd, dark, "skin");
  }
  R.add(gBall(V3(0, Y + 0.22, 0.17), 0.05, 1.3, 0.35, 0.5, 8), "head", 0x4a2a2a, "plain");
  R.add(gTaper(V3(0, Y + 0.44, -0.02), V3(0, Y + 0.72, -0.04), 0.03, 0.02, 6), "leaf", lfd, "wood");
  for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + 0.4; R.add(gBall(V3(Math.cos(a) * 0.16, Y + 0.7, -0.04 + Math.sin(a) * 0.16), 0.14, 1.3, 0.18, 0.6, 8), "leaf", lf, "plain"); }
  R.meta = { kind: "mandrake", headTop: Y + 0.8 };
  return R.finish();
}

function bulbEntry(col, leaf) {
  const R = new RigBuilder();
  const Y = 0.36;
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, Y, 0);
  R.bone("sprout", "body", 0, Y + 0.46, 0);
  R.bone("sprout2", "sprout", 0, Y + 0.7, 0.02);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) R.bone("leg" + sd, "body", s * 0.12, Y - 0.2, 0.02);
  const dark = new THREE.Color(col).multiplyScalar(0.62).getHex(), paper = new THREE.Color(col).lerp(new THREE.Color(0xe8d4a0), 0.45).getHex(), lf = leaf || 0x5aa84a, lfd = new THREE.Color(lf).multiplyScalar(0.62).getHex();
  R.add(gBall(V3(0, Y, 0), 0.31, 1.04, 1, 1, 16), "body", col, "skin");
  R.add(gTaper(V3(0, Y + 0.2, 0), V3(0, Y + 0.5, 0), 0.2, 0.05, 12), "body", paper, "skin");
  for (let k = 0; k < 9; k++) {
    const a = k / 9 * Math.PI * 2;
    if (Math.sin(a) > 0.55) continue;
    R.add(gTaper(V3(Math.cos(a) * 0.29, Y + 0.06, Math.sin(a) * 0.29), V3(Math.cos(a) * 0.05, Y + 0.48, Math.sin(a) * 0.05), 0.014, 0.008, 5), "body", dark, "wood");
  }
  for (let k = 0; k < 5; k++) {
    const a = Math.PI * (0.9 + k * 0.3);
    R.add(gTaper(V3(Math.cos(a) * 0.1, Y - 0.26, Math.sin(a) * 0.1), V3(Math.cos(a) * 0.2, 0.06, Math.sin(a) * 0.2), 0.016, 0.004, 5), "body", dark, "wood");
  }
  for (const s of [-1, 1]) {
    const sd = s > 0 ? "L" : "R";
    R.add(gBall(V3(s * 0.1, Y + 0.09, 0.25), 0.085, 1.1, 0.5, 0.7, 10), "body", 0xf4f0e0, "plain");
    R.add(gBall(V3(s * 0.1, Y + 0.085, 0.3), 0.034, 1, 0.8, 0.6, 8), "body", 0x1a1208, "plain");
    R.add(gBall(V3(s * 0.1, Y + 0.14, 0.255), 0.095, 1.2, 0.5, 0.78, 10), "body", dark, "skin");
    R.add(gBall(V3(s * 0.1, Y + 0.04, 0.265), 0.08, 1.15, 0.12, 0.6, 8), "body", dark, "skin");
    R.add(gTaper(V3(s * 0.12, Y - 0.2, 0.02), V3(s * 0.13, 0.05, 0.02), 0.06, 0.05, 7), "leg" + sd, dark, "skin");
    R.add(gBall(V3(s * 0.13, 0.03, 0.09), 0.075, 1.1, 0.5, 1.5, 8), "leg" + sd, dark, "skin");
  }
  R.add(gBall(V3(0, Y - 0.08, 0.28), 0.05, 1.3, 0.3, 0.5, 8), "body", 0x3a2218, "plain");
  R.add(gTaper(V3(0, Y + 0.46, 0), V3(0, Y + 0.7, 0.02), 0.045, 0.034, 7), "sprout", lfd, "wood");
  R.add(gTaper(V3(0, Y + 0.7, 0.02), V3(0, Y + 0.94, 0.1), 0.034, 0.05, 7), "sprout2", lf, "wood");
  R.add(gBall(V3(0, Y + 0.98, 0.12), 0.075, 1, 1.1, 1, 9), "sprout2", lfd, "wood");
  for (const s of [-1, 1]) {
    R.add(gBall(V3(s * 0.13, Y + 0.6, 0), 0.11, 1.5, 0.16, 0.7, 8), "sprout", lf, "plain");
    R.add(gBall(V3(s * 0.1, Y + 0.84, 0.06), 0.09, 1.4, 0.16, 0.65, 8), "sprout2", lf, "plain");
  }
  R.meta = { kind: "bulb", headTop: Y + 1.1 };
  return R.finish();
}

function shroomEntry(col, cap) {
  const R = new RigBuilder();
  const Y = 0.3;
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, Y, 0);
  R.bone("head", "body", 0, Y + 0.3, 0);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) R.bone("arm" + sd, "body", s * 0.16, Y + 0.05, 0);
  const capC = cap || 0xb04a3a, spots = new THREE.Color(capC).lerp(new THREE.Color(0xffffff), 0.7).getHex(), dark = new THREE.Color(col).multiplyScalar(0.7).getHex();
  R.add(gTaper(V3(0, 0.02, 0), V3(0, Y + 0.32, 0), 0.19, 0.14, 12), "body", col, "skin");
  R.add(gBall(V3(0, 0.03, 0), 0.2, 1, 0.3, 1, 10), "body", dark, "skin");
  for (const s of [-1, 1]) { R.add(gBall(V3(s * 0.07, Y + 0.08, 0.14), 0.035, 1, 1.2, 0.6, 8), "body", 0x111111, "plain"); R.add(gTaper(V3(s * 0.16, Y + 0.05, 0), V3(s * 0.3, Y - 0.06, 0.06), 0.04, 0.02, 6), "arm" + (s > 0 ? "L" : "R"), dark, "skin"); }
  R.add(gBall(V3(0, Y - 0.02, 0.15), 0.04, 1.4, 0.3, 0.5, 8), "body", 0x3a2222, "plain");
  R.add(gPartSphere(V3(0, Y + 0.28, 0), 0.42, 0, Math.PI * 0.55, 1, 0.8, 1, 16), "head", capC, "skin");
  R.add(gBall(V3(0, Y + 0.3, 0), 0.4, 1, 0.12, 1, 14), "head", spots, "skin");
  const gill = new THREE.Color(col).lerp(new THREE.Color(0x8a6a5a), 0.35).getHex();
  for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; R.add(gBox(V3(Math.cos(a) * 0.25, Y + 0.27, Math.sin(a) * 0.25), 0.006, 0.035, 0.27, 0, Math.PI / 2 - a, 0), "head", gill, "plain"); }
  R.add(gCyl(V3(0, Y + 0.16, 0), 0.155, 0.2, 0.06, 18, true), "body", new THREE.Color(col).lerp(new THREE.Color(0xffffff), 0.3).getHex(), "skin");
  for (let k = 0; k < 6; k++) { const a = k * 1.05, r = 0.12 + (k % 3) * 0.09; R.add(gBall(V3(Math.cos(a) * r, Y + 0.3 + Math.sqrt(Math.max(0, 0.42 * 0.42 - r * r)) * 0.78, Math.sin(a) * r), 0.045, 1, 0.5, 1, 7), "head", spots, "plain"); }
  R.meta = { kind: "shroom", headTop: Y + 0.65 };
  return R.finish();
}

function fishEntry(col, belly) {
  const R = new RigBuilder();
  const Y = 0.4;
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, Y, 0);
  R.bone("tail", "body", 0, Y, -0.3);
  R.bone("tail2", "tail", 0, Y, -0.5);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) R.bone("fin" + sd, "body", s * 0.14, Y - 0.04, 0.08);
  const dark = new THREE.Color(col).multiplyScalar(0.6).getHex(), light = belly || new THREE.Color(col).lerp(new THREE.Color(0xf0f4f0), 0.55).getHex();
  R.add(gBall(V3(0, Y, 0), 0.2, 0.75, 1.15, 1.9, 14), "body", col, "scale");
  R.add(gBall(V3(0, Y - 0.06, 0.02), 0.17, 0.65, 0.7, 1.7, 10), "body", light, "scale");
  R.add(gBall(V3(0, Y + 0.18, -0.05), 0.12, 0.25, 1.4, 1.2, 8), "body", dark, "skin");
  R.add(gBall(V3(0, Y + 0.02, 0.34), 0.07, 0.9, 0.6, 1, 8), "body", light, "skin");
  for (const s of [-1, 1]) {
    R.add(gBall(V3(s * 0.11, Y + 0.05, 0.25), 0.04, 1, 1.1, 0.6, 8), "body", 0xffe082, "glow", true);
    R.add(gBall(V3(s * 0.11, Y + 0.05, 0.27), 0.02, 1, 1, 0.6, 5), "body", 0x111111, "plain");
    R.add(gBall(V3(s * 0.25, Y - 0.04, 0.04), 0.16, 0.18, 0.55, 1.15, 8), "fin" + (s > 0 ? "L" : "R"), dark, "skin");
  }
  R.add(gTaper(V3(0, Y, -0.3), V3(0, Y, -0.5), 0.1, 0.05, 8), "tail", col, "scale");
  R.add(gBall(V3(0, Y, -0.62), 0.17, 0.2, 1.3, 0.9, 8), "tail2", dark, "skin");
  R.meta = { kind: "fish", headTop: 0.7 };
  return R.finish();
}

function wormEntry(col) {
  const R = new RigBuilder();
  const Y = 0.32, n = 8;
  const zs = []; for (let i = 0; i < n; i++) zs.push(-1.5 + i * 0.29);
  R.bone("root", null, 0, 0, 0);
  for (let i = 0; i < n; i++) R.bone("t" + i, i ? "t" + (i - 1) : "root", 0, Y, zs[i]);
  const c = new THREE.Color(col), dark = c.clone().multiplyScalar(0.6).getHex(), belly = c.clone().lerp(new THREE.Color(0xf0d0b0), 0.35).getHex();
  for (let i = 0; i < n; i++) {
    const r = 0.11 + 0.17 * (i / (n - 1));
    R.add(gBall(V3(0, Y + (r - 0.28) * 0.5, zs[i]), r, 1, 0.92, 1.15, 14), "t" + i, col, "scale");
    R.add(gBall(V3(0, Y + (r - 0.28) * 0.5 - r * 0.35, zs[i]), r * 0.85, 0.95, 0.6, 1.1, 10), "t" + i, belly, "skin");
    if (i < n - 1) R.add(gRing(V3(0, Y + (r - 0.28) * 0.5, zs[i] + 0.13), r * 0.92, 0.022, "z", 18), "t" + i, dark, "scale");
    if (i < n - 1) R.add(gRing(V3(0, Y + (r - 0.28) * 0.5, zs[i] + 0.04), r * 0.99, 0.012, "z", 18), "t" + i, dark, "scale");
    for (let k = 0; k < 6; k++) { const a = Math.PI * (0.15 + k * 0.14), yc = Y + (r - 0.28) * 0.5, p0 = V3(Math.cos(a) * r * 0.95, yc - Math.sin(a) * r * 0.55, zs[i] + 0.06); R.add(gTaper(p0, p0.clone().add(V3(Math.cos(a) * 0.04, -0.03, -0.03)), 0.005, 0.001, 3), "t" + i, 0x3a2a20, "bone"); }
  }
  const hz = zs[n - 1] + 0.2;
  R.add(gRing(V3(0, Y, hz), 0.15, 0.045, "z", 18), "t" + (n - 1), 0x6a2a2a, "skin");
  R.add(gBall(V3(0, Y, hz - 0.02), 0.14, 1, 1, 0.3, 12), "t" + (n - 1), 0x1a0a0a, "plain");
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * Math.PI * 2;
    const p = V3(Math.cos(a) * 0.15, Y + Math.sin(a) * 0.15, hz + 0.02);
    R.add(gTaper(p, V3(Math.cos(a) * 0.07, Y + Math.sin(a) * 0.07, hz + 0.08), 0.022, 0.002, 5), "t" + (n - 1), 0xeae2cc, "bone");
  }
  for (const s of [-1, 1]) R.add(gTaper(V3(s * 0.18, Y - 0.05, hz - 0.05), V3(s * 0.12, Y - 0.12, hz + 0.18), 0.035, 0.004, 6), "t" + (n - 1), dark, "bone");
  R.meta = { kind: "worm", headTop: 0.75 };
  return R.finish();
}

function hareEntry(col) {
  const R = new RigBuilder();
  R.bone("root", null, 0, 0, 0);
  R.bone("hips", "root", 0, 0.2, 0);
  R.bone("body", "hips", 0, 0.24, 0);
  R.bone("head", "body", 0, 0.42, 0.02);
  R.bone("tail", "hips", 0, 0.18, -0.15);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) {
    R.bone("ear" + sd, "head", s * 0.05, 0.6, 0);
    R.bone("ear2" + sd, "ear" + sd, s * 0.055, 0.77, -0.01);
    R.bone("legB" + sd, "hips", s * 0.09, 0.2, -0.02);
    R.bone("footB" + sd, "legB" + sd, s * 0.1, 0.05, -0.04);
  }
  const light = new THREE.Color(col).lerp(new THREE.Color(0xf2ede4), 0.55).getHex(), dark = new THREE.Color(col).multiplyScalar(0.72).getHex();
  R.add(gBall(V3(0, 0.27, 0), 0.17, 1, 1.15, 0.95, 16), "body", col, "fur");
  R.add(gBall(V3(0, 0.25, 0.075), 0.13, 0.85, 1.0, 0.6, 12), "body", light, "fur");
  R.add(gBall(V3(0, 0.2, -0.01), 0.16, 1.05, 0.7, 1.0, 14), "hips", col, "fur");
  R.add(gBall(V3(0, 0.5, 0.04), 0.13, 1.05, 0.95, 1.0, 16), "head", col, "fur");
  R.add(gBall(V3(0, 0.46, 0.14), 0.055, 1.25, 0.8, 0.8, 10), "head", light, "fur");
  R.add(gBall(V3(0, 0.485, 0.188), 0.016, 1.2, 0.8, 1, 6), "head", 0xd88a90, "skin");
  for (const s of [-1, 1]) {
    const sd = s > 0 ? "L" : "R";
    R.add(gBall(V3(s * 0.066, 0.53, 0.13), 0.026, 1, 1.15, 0.7, 8), "head", 0x111111, "plain");
    R.add(gBall(V3(s * 0.072, 0.54, 0.148), 0.007, 1, 1, 1, 5), "head", 0xffffff, "plain");
    R.add(gBall(V3(s * 0.09, 0.46, 0.1), 0.03, 1, 0.6, 0.7, 8), "head", 0xe8b0b0, "skin");
    for (let k = 0; k < 3; k++) R.add(gTaper(V3(s * 0.03, 0.465 + k * 0.008, 0.18), V3(s * 0.14, 0.47 + (k - 1) * 0.025, 0.16 - k * 0.01), 0.002, 0.0008, 3), "head", 0xf0ece4, "plain");
    R.add(gBall(V3(s * 0.066, 0.69, 0), 0.042, 0.75, 2.2, 0.38, 10), "ear" + sd, col, "fur");
    R.add(gBall(V3(s * 0.066, 0.69, 0.012), 0.032, 0.6, 2.0, 0.2, 8), "ear" + sd, 0xe0a8a8, "skin");
    R.add(gBall(V3(s * 0.07, 0.865, -0.01), 0.042, 0.72, 2.4, 0.36, 10), "ear2" + sd, col, "fur");
    R.add(gBall(V3(s * 0.07, 0.865, 0.002), 0.031, 0.58, 2.2, 0.2, 8), "ear2" + sd, 0xe0a8a8, "skin");
    R.add(gBall(V3(s * 0.072, 0.96, -0.012), 0.022, 1, 1, 0.8, 6), "ear2" + sd, dark, "fur");
    R.add(gBall(V3(s * 0.1, 0.15, -0.01), 0.09, 0.75, 1.0, 1.2, 12), "legB" + sd, col, "fur");
    R.add(gTaper(V3(s * 0.1, 0.12, -0.04), V3(s * 0.1, 0.045, -0.045), 0.04, 0.03, 8), "legB" + sd, col, "fur");
    R.add(gBall(V3(s * 0.1, 0.025, 0.04), 0.06, 0.85, 0.42, 2.0, 10), "footB" + sd, light, "fur");
  }
  R.add(gBall(V3(0, 0.19, -0.19), 0.058, 1, 1, 1, 10), "tail", 0xf6f2ea, "fur");
  R.meta = { kind: "rarab", headTop: 0.98 };
  return R.finish();
}

function thornstriderEntry(coat) {
  const R = new RigBuilder();
  R.bone("root", null, 0, 0, 0);
  R.bone("pelvis", "root", 0, 1.05, -0.15);
  R.bone("chest", "pelvis", 0, 1.12, 0.35);
  R.bone("neck1", "chest", 0, 1.28, 0.62);
  R.bone("neck2", "neck1", 0, 1.55, 0.78);
  R.bone("head", "neck2", 0, 1.78, 0.88);
  R.bone("tail1", "pelvis", 0, 1.05, -0.55);
  R.bone("tail2", "tail1", 0, 1.0, -1.0);
  R.bone("tail3", "tail2", 0, 0.95, -1.45);
  R.bone("saddle", "pelvis", 0, 1.32, 0.05);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) {
    R.bone("arm" + sd, "chest", s * 0.16, 1.05, 0.5);
    R.bone("thigh" + sd, "pelvis", s * 0.2, 1.0, -0.15);
    R.bone("shin" + sd, "thigh" + sd, s * 0.22, 0.6, 0.08);
    R.bone("meta" + sd, "shin" + sd, s * 0.22, 0.32, -0.12);
    R.bone("toe" + sd, "meta" + sd, s * 0.22, 0.05, 0.0);
  }
  const C = coat || MOUNT_COATS.teal;
  const main = C.main, dark = C.dark, cream = 0xd8cba8, rust = 0xb0552a, gold = 0xd8a040, glow = C.glow, horn = 0xcfc0a0;
  R.add(gBall(V3(0, 1.08, -0.15), 0.32, 0.85, 0.85, 1.15, 16), "pelvis", main, "scale");
  R.add(gBall(V3(0, 0.98, 0.08), 0.26, 0.75, 0.6, 1.2, 14), "pelvis", cream, "plain");
  R.add(gBall(V3(0, 1.12, 0.32), 0.29, 0.8, 0.85, 1.0, 16), "chest", main, "scale");
  R.add(gBall(V3(0, 1.0, 0.36), 0.22, 0.72, 0.6, 0.9, 12), "chest", cream, "plain");
  R.add(gTaper(V3(0, 1.18, 0.5), V3(0, 1.38, 0.68), 0.19, 0.13, 12), "neck1", main, "scale");
  R.add(gTaper(V3(0, 1.36, 0.68), V3(0, 1.62, 0.82), 0.13, 0.1, 12), "neck2", main, "scale");
  R.add(gTaper(V3(0, 1.6, 0.81), V3(0, 1.8, 0.9), 0.1, 0.09, 12), "head", main, "scale");
  R.add(gBall(V3(0, 1.83, 0.96), 0.13, 0.85, 0.9, 1.25, 14), "head", main, "scale");
  R.add(gTaper(V3(0, 1.81, 1.06), V3(0, 1.77, 1.32), 0.09, 0.045, 10), "head", main, "scale");
  R.add(gTaper(V3(0, 1.74, 1.04), V3(0, 1.72, 1.26), 0.07, 0.035, 8), "head", cream, "plain");
  for (const s of [-1, 1]) {
    const sd = s > 0 ? "L" : "R";
    R.add(gBall(V3(s * 0.085, 1.86, 1.03), 0.024, 1, 0.8, 0.8, 8), "head", 0xffb030, "glow", true);
    const a0 = V3(s * 0.06, 1.92, 0.9), a1 = V3(s * 0.17, 2.14, 0.82), a2 = V3(s * 0.26, 2.32, 0.7), a3 = V3(s * 0.3, 2.45, 0.56);
    R.add(gTaper(a0, a1, 0.03, 0.022, 8), "head", horn, "bone");
    R.add(gTaper(a1, a2, 0.022, 0.016, 8), "head", horn, "bone");
    R.add(gTaper(a2, a3, 0.016, 0.004, 8), "head", horn, "bone");
    R.add(gTaper(a1, V3(s * 0.22, 2.3, 0.96), 0.015, 0.003, 6), "head", horn, "bone");
    R.add(gTaper(a2, V3(s * 0.4, 2.42, 0.78), 0.012, 0.003, 6), "head", horn, "bone");
    R.add(gBall(V3(s * 0.11, 1.42, 0.72), 0.1, 0.18, 0.22, 1.25, 8), "neck2", glow, "glow", true);
    for (let j = 0; j < 3; j++) R.add(gBall(V3(s * 0.262, 1.14 - j * 0.07, -0.12 - j * 0.1), 0.12, 0.12, 0.12, 1.3, 8), "pelvis", glow, "glow", true);
    R.add(gTaper(V3(s * 0.16, 1.05, 0.5), V3(s * 0.2, 0.86, 0.62), 0.05, 0.03, 8), "arm" + sd, main, "scale");
    for (let j = 0; j < 3; j++) R.add(gTaper(V3(s * 0.19, 0.92 + j * 0.05, 0.56 - j * 0.03), V3(s * 0.22, 0.78 + j * 0.06, 0.38 - j * 0.04), 0.045, 0.005, 6, 0.3), "arm" + sd, j % 2 ? gold : rust, "feather");
    R.add(gBall(V3(s * 0.2, 0.9, -0.08), 0.16, 0.7, 1.1, 1.0, 12), "thigh" + sd, main, "scale");
    R.add(gTaper(V3(s * 0.2, 1.0, -0.15), V3(s * 0.22, 0.6, 0.08), 0.13, 0.08, 10), "thigh" + sd, main, "scale");
    R.add(gTaper(V3(s * 0.22, 0.6, 0.08), V3(s * 0.22, 0.32, -0.12), 0.07, 0.05, 10), "shin" + sd, main, "scale");
    R.add(gTaper(V3(s * 0.22, 0.32, -0.12), V3(s * 0.22, 0.06, 0.0), 0.045, 0.035, 8), "meta" + sd, dark, "scale");
    for (const dx of [-0.05, 0, 0.05]) {
      R.add(gTaper(V3(s * 0.22 + dx * 0.3, 0.05, 0.0), V3(s * 0.22 + dx, 0.035, 0.16), 0.028, 0.012, 6), "toe" + sd, dark, "scale");
      R.add(gTaper(V3(s * 0.22 + dx, 0.035, 0.16), V3(s * 0.22 + dx * 1.1, 0.01, 0.22), 0.012, 0.002, 5), "toe" + sd, 0x1a1a1a, "bone");
    }
  }
  for (let j = 0; j < 6; j++) {
    const z = 0.66 + j * 0.06, y = 1.36 + j * 0.09;
    R.add(gTaper(V3(0, y + 0.06, z - 0.05), V3(0, y + 0.22, z - 0.2), 0.05, 0.004, 6, 0.25), j < 3 ? "neck1" : j < 5 ? "neck2" : "head", j % 2 ? gold : rust, "feather");
  }
  R.add(gTaper(V3(0, 1.05, -0.45), V3(0, 1.0, -1.0), 0.2, 0.14, 12), "tail1", main, "scale");
  R.add(gTaper(V3(0, 1.0, -1.0), V3(0, 0.95, -1.45), 0.14, 0.08, 10), "tail2", main, "scale");
  R.add(gTaper(V3(0, 0.95, -1.45), V3(0, 0.92, -1.75), 0.08, 0.03, 8), "tail3", main, "scale");
  for (let j = -2; j <= 2; j++) R.add(gTaper(V3(0, 0.94, -1.6), V3(j * 0.12, 0.98 + Math.abs(j) * 0.02, -2.05 + Math.abs(j) * 0.08), 0.06, 0.006, 6, 0.25), "tail3", j % 2 ? gold : rust, "feather");
  R.add(gBox(V3(0, 1.3, 0.02), 0.52, 0.03, 0.62), "saddle", 0x8a1f2a, "cloth");
  R.add(gBox(V3(0, 1.305, -0.29), 0.5, 0.035, 0.05), "saddle", 0xc8a040, "trim");
  R.add(gBox(V3(0, 1.35, 0.02), 0.34, 0.07, 0.42), "saddle", 0x6a4428, "leather");
  R.add(gBox(V3(0, 1.42, -0.17), 0.3, 0.12, 0.06, -0.3, 0, 0), "saddle", 0x6a4428, "leather");
  R.add(gTaper(V3(0, 1.37, 0.2), V3(0, 1.48, 0.24), 0.03, 0.02, 6), "saddle", 0x6a4428, "leather");
  for (const s of [-1, 1]) {
    R.add(gTaper(V3(s * 0.19, 1.32, 0.05), V3(s * 0.25, 0.92, 0.07), 0.008, 0.008, 4), "saddle", 0x3a2618, "leather");
    R.add(gRing(V3(s * 0.25, 0.88, 0.07), 0.045, 0.01, "x", 10), "saddle", 0xb0b4ba, "metal");
  }
  R.add(gTaper(V3(0, 1.8, 1.12), V3(0, 1.44, 0.26), 0.008, 0.008, 4), "neck2", 0x3a2618, "leather");
  R.meta = { kind: "raptor", headTop: 2.5 };
  return R.finish();
}

function weaponEntry(kind, id) {
  const key = kind + "|" + (id || "");
  if (RIG.weaponCache.has(key)) return RIG.weaponCache.get(key);
  const R = new RigBuilder();
  R.bone("w", null, 0, 0, 0);
  const gT = (a, c, ra, rb, sg, fl) => gTaper(a, c, ra * 1.4, rb > 0.006 ? rb * 1.4 : rb * 1.8, sg, fl);
  const gR = (pp, RR, rr, ax, sg, arc, rot) => gRing(pp, RR * 1.08, rr * 1.5, ax, sg, arc, rot);
  const fat = g => { g.scale(1.22, 1.22, 2.0); return g; };
  const iron = id && /iron/.test(id), bronze = id && /bronze/.test(id), wlv = (id && ITEMS[id] && ITEMS[id].lv) || 1;
  const blade = !id ? 0xb8bcc2 : /frost|rime|glacier/.test(id) ? 0xc8ecf8 : /tidesteel|coral/.test(id) ? 0x9ec8d0 : /drowned|abyssal/.test(id) ? 0x5a7a88 : /kings/.test(id) ? 0xe8e0c0 : /steel/.test(id) ? 0xdfe4ea : iron ? 0xd0d4da : bronze ? 0xc89458 : 0xb8bcc2;
  const glowC = wlv >= 14 && id ? (/frost|rime|glacier/.test(id) ? 0x9fe8ff : /tide|coral|drowned|abyssal/.test(id) ? 0x4fc3f7 : /kings/.test(id) ? 0xffe080 : /warlord|gax|cleaver/.test(id) ? 0xff7043 : null) : null;
  const wood = 0x7a5432, grip = 0x3a2618, gold = 0xc8a040;
  let tip = [0.1, 0.7];
  if (kind === "sword" || kind === "dagger" || kind === "gsword") {
    const L = kind === "gsword" ? 1.05 : kind === "sword" ? 0.72 : 0.26, W = (kind === "gsword" ? 0.1 : kind === "sword" ? 0.05 : 0.035) * 1.5;
    R.add(gT(V3(0, -0.08, 0), V3(0, 0.08, 0), 0.018, 0.016, 8), "w", grip, "leather");
    R.add(gBall(V3(0, -0.1, 0), 0.026, 1, 1, 1, 8), "w", gold, "metal");
    const tier = wlv >= 15 ? 3 : wlv >= 8 ? 2 : 1, gw = (kind === "gsword" ? 0.3 : kind === "sword" ? 0.18 : 0.09) * 1.35;
    if (tier === 1) R.add(gBox(V3(0, 0.09, 0), gw, 0.04, 0.05), "w", gold, "metal");
    else {
      R.add(gBox(V3(0, 0.09, 0), gw * 0.4, 0.03, 0.04), "w", gold, "metal");
      for (const s of [-1, 1]) R.add(gT(V3(s * gw * 0.18, 0.09, 0), V3(s * gw * 0.5, 0.09 + (tier === 3 ? 0.04 : 0.02), 0), 0.014, 0.007, 6), "w", gold, "metal");
      R.add(gT(V3(0, 0.1, 0), V3(0, 0.14, 0), 0.016, 0.004, 4, 0.5), "w", gold, "metal");
    }
    if (tier === 3) { R.add(gBall(V3(0, 0.09, 0.022), 0.012, 1, 1.3, 0.6, 8), "w", glowC || 0x7fd8ff, "glow", true); R.add(gBall(V3(0, 0.09, -0.022), 0.012, 1, 1.3, 0.6, 8), "w", glowC || 0x7fd8ff, "glow", true); R.add(gBall(V3(0, -0.12, 0), 0.013, 1, 1, 1, 8), "w", glowC || 0xff6a6a, "glow", true); }
    if (kind === "gsword") R.add(gT(V3(0, -0.3, 0), V3(0, -0.08, 0), 0.02, 0.019, 8), "w", grip, "leather");
    const sh = new THREE.Shape();
    sh.moveTo(-W / 2, 0); sh.lineTo(W / 2, 0); sh.lineTo(W / 2 * 0.9, L * 0.82); sh.lineTo(0, L); sh.lineTo(-W / 2 * 0.9, L * 0.82); sh.closePath();
    const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.016, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.003, bevelSegments: 1 });
    bg.translate(0, 0.1, -0.008);
    const uv = bg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + W) / (2 * W), uv.getY(i) / L);
    R.add(bg, "w", blade, "metal");
    R.add(gBox(V3(0, 0.1 + L * 0.4, 0), W * 0.18, L * 0.62, 0.026), "w", glowC || new THREE.Color(blade).multiplyScalar(0.6).getHex(), glowC ? "glow" : "metal", !!glowC);
    for (let k = 0; k < 3; k++) R.add(gR(V3(0, -0.06 + k * 0.05, 0), 0.019, 0.005, "y", 8), "w", 0x1e140c, "leather");
    if (kind === "sword" || kind === "gsword") for (const s of [-1, 1]) R.add(gBall(V3(s * (kind === "gsword" ? 0.155 : 0.095), 0.09, 0), 0.016, 1, 1, 1, 6), "w", gold, "metal");
    tip = [0.3, 0.1 + L];
  } else if (kind === "club") {
    const wand = id === "maple_wand";
    R.add(gT(V3(0, -0.15, 0), V3(0, 0.32, 0), 0.018, 0.026, 8), "w", wood, "wood");
    if (wand) {
      R.add(gBall(V3(0, 0.38, 0), 0.04, 1, 1.6, 1, 8), "w", 0x9fe0ff, "glow", true);
      R.add(gR(V3(0, 0.33, 0), 0.032, 0.008, "y", 10), "w", gold, "metal");
    } else {
      R.add(gBall(V3(0, 0.38, 0), 0.085, 1, 1.15, 1, 10), "w", wood, "wood");
      R.add(gR(V3(0, 0.36, 0), 0.066, 0.012, "y", 12), "w", 0x8a8f96, "metal");
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; R.add(gT(V3(Math.cos(a) * 0.055, 0.4, Math.sin(a) * 0.055), V3(Math.cos(a) * 0.1, 0.42, Math.sin(a) * 0.1), 0.014, 0.002, 4), "w", 0x8a8f96, "metal"); }
    }
    tip = [0.2, 0.45];
  } else if (kind === "archery") {
    const steel = id && /steel/.test(id);
    const limb = steel ? 0x8a9098 : id && /yew/.test(id) ? 0x9a6a3a : wood;
    const pts = [];
    for (let i = 0; i <= 8; i++) { const a = (i / 8 - 0.5) * 2.1; pts.push(V3(0, Math.sin(a) * 0.55, -Math.cos(a) * 0.16 + 0.16)); }
    for (let i = 0; i < 8; i++) R.add(gT(pts[i], pts[i + 1], i === 3 || i === 4 ? 0.022 : 0.014, i === 3 || i === 4 ? 0.022 : 0.012, 6), "w", i === 3 || i === 4 ? grip : limb, i === 3 || i === 4 ? "leather" : steel ? "metal" : "wood");
    R.add(gT(pts[0], pts[8], 0.003, 0.003, 4), "w", 0xe8e0c8, "plain");
    tip = [0.2, 0.55];
  } else if (kind === "staff") {
    const holly = id === "holly_staff";
    R.add(gT(V3(0, -0.65, 0), V3(0, 0.82, 0), 0.02, 0.016, 8), "w", holly ? 0x5a3a28 : wood, "wood");
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; R.add(gT(V3(0, 0.8, 0), V3(Math.cos(a) * 0.06, 0.98, Math.sin(a) * 0.06), 0.014, 0.008, 5), "w", holly ? 0x5a3a28 : wood, "wood"); }
    R.add(gBall(V3(0, 0.96, 0), (wlv >= 14 ? 0.065 : 0.05) * 1.3, 1, 1, 1, 10), "w", glowC || (holly ? 0xb070ff : 0x7ad7ff), "glow", true);
    if (wlv >= 11) for (let k = 0; k < 2; k++) R.add(gR(V3(0, 0.2 - k * 0.5, 0), 0.022, 0.006, "y", 10), "w", gold, "metal");
    R.add(gR(V3(0, 0.78, 0), 0.025, 0.008, "y", 10), "w", gold, "metal");
    tip = [0.6, 1.0];
  } else if (kind === "gkatana" || kind === "katana") {
    const big = kind === "gkatana", L = big ? 0.92 : 0.6, W = (big ? 0.04 : 0.032) * 1.5, curve = big ? 0.06 : 0.04;
    R.add(gT(V3(0, big ? -0.24 : -0.12, 0), V3(0, 0.08, 0), 0.017, 0.016, 8), "w", 0x1a1418, "leather");
    for (let k = 0; k < (big ? 6 : 4); k++) R.add(gR(V3(0, (big ? -0.22 : -0.1) + k * 0.05, 0), 0.0185, 0.004, "y", 8), "w", 0xd8d0c0, "cloth");
    R.add(gCyl(V3(0, 0.09, 0), 0.05, 0.05, 0.012, 12), "w", gold, "metal");
    const sh = new THREE.Shape();
    sh.moveTo(-W / 2, 0); sh.quadraticCurveTo(-W / 2 + curve * 0.4, L * 0.5, -W * 0.1 + curve, L * 0.97); sh.lineTo(W * 0.4 + curve, L); sh.quadraticCurveTo(W / 2 + curve * 0.5, L * 0.5, W / 2, 0); sh.closePath();
    const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 1 });
    bg.translate(0, 0.1, -0.006);
    const uv = bg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + W) / (2 * W + curve), uv.getY(i) / L);
    R.add(bg, "w", blade, "metal");
    R.add(gBox(V3(curve * 0.35, 0.1 + L * 0.45, 0), W * 0.12, L * 0.8, 0.02), "w", glowC || 0xf4f6f8, glowC ? "glow" : "metal", !!glowC);
    tip = [0.3, 0.1 + L];
  } else if (kind === "axe") {
    R.add(gT(V3(0, -0.2, 0), V3(0, 0.42, 0), 0.018, 0.02, 8), "w", wood, "wood");
    R.add(gT(V3(0, -0.12, 0), V3(0, 0.02, 0), 0.022, 0.022, 8), "w", grip, "leather");
    const sh = new THREE.Shape();
    sh.moveTo(0, 0.05); sh.quadraticCurveTo(0.1, 0.07, 0.17, 0.14); sh.quadraticCurveTo(0.13, 0, 0.17, -0.12); sh.quadraticCurveTo(0.1, -0.06, 0, -0.05); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 });
    fat(g); g.translate(0, 0, -0.006);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 0.18, (uv.getY(i) + 0.12) / 0.26);
    g.rotateY(Math.PI / 2); g.translate(0, 0.36, 0);
    R.add(g, "w", blade, "metal");
    R.add(gBox(V3(0, 0.36, 0), 0.035, 0.08, 0.05), "w", blade, "metal");
    if (glowC) R.add(gR(V3(0, 0.3, 0), 0.026, 0.007, "y", 10), "w", glowC, "glow", true);
    tip = [0.3, 0.5];
  } else if (kind === "polearm") {
    R.add(gT(V3(0, -0.7, 0), V3(0, 1.0, 0), 0.02, 0.018, 8), "w", wood, "wood");
    for (let k = 0; k < 2; k++) R.add(gT(V3(0, 0.1 - k * 0.55, 0), V3(0, 0.25 - k * 0.55, 0), 0.024, 0.024, 8), "w", grip, "leather");
    R.add(gR(V3(0, 1.0, 0), 0.026, 0.008, "y", 10), "w", gold, "metal");
    const sh = new THREE.Shape();
    sh.moveTo(0, 0); sh.lineTo(0.05, 0.08); sh.lineTo(0.02, 0.32); sh.lineTo(0, 0.36); sh.lineTo(-0.02, 0.32); sh.lineTo(-0.05, 0.08); sh.closePath();
    const hg = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 });
    hg.scale(1.4, 1.15, 2.2); hg.translate(0, 1.0, -0.006);
    const uv = hg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + 0.05) / 0.1, uv.getY(i) / 0.36);
    R.add(hg, "w", blade, "metal");
    for (const s of [-1, 1]) R.add(gT(V3(0, 1.02, 0), V3(s * 0.09, 1.1, 0), 0.012, 0.003, 5), "w", blade, "metal");
    if (glowC) R.add(gBall(V3(0, 1.0, 0), 0.03, 1, 1, 1, 8), "w", glowC, "glow", true);
    tip = [0.9, 1.36];
  } else if (kind === "scythe") {
    R.add(gT(V3(0, -0.5, 0), V3(0, 1.0, 0), 0.022, 0.02, 8), "w", 0x3a2a22, "wood");
    R.add(gT(V3(0, 0.1, 0), V3(0, 0.22, 0), 0.026, 0.026, 8), "w", grip, "leather");
    const sh = new THREE.Shape();
    sh.moveTo(0, 0.03); sh.quadraticCurveTo(0.3, 0.12, 0.62, -0.12); sh.quadraticCurveTo(0.3, 0.0, 0, -0.04); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.01, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 });
    fat(g); g.translate(0, 0, -0.005);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 0.62, (uv.getY(i) + 0.12) / 0.24);
    g.rotateY(Math.PI / 2);
    g.translate(0, 0.96, 0);
    R.add(g, "w", id && /rime/.test(id) ? 0xbfe6f5 : blade, "metal");
    R.add(gBall(V3(0, 1.0, 0), 0.03, 1, 1, 1, 8), "w", glowC || gold, glowC ? "glow" : "metal", !!glowC);
    tip = [0.7, 0.95];
  } else if (kind === "greataxe") {
    R.add(gT(V3(0, -0.4, 0), V3(0, 0.95, 0), 0.024, 0.022, 8), "w", wood, "wood");
    for (const s of [-1, 1]) {
      const sh = new THREE.Shape();
      sh.moveTo(0, 0.1); sh.quadraticCurveTo(0.12, 0.12, 0.24, 0.24); sh.quadraticCurveTo(0.17, 0, 0.24, -0.24); sh.quadraticCurveTo(0.12, -0.12, 0, -0.1); sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.004, bevelSegments: 1 });
      fat(g); g.translate(0, 0, -0.006);
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 0.25, (uv.getY(i) + 0.25) / 0.5);
      g.rotateY(s > 0 ? Math.PI / 2 : -Math.PI / 2);
      g.translate(0, 0.78, 0);
      R.add(g, "w", blade, "metal");
    }
    R.add(gT(V3(0, 0.92, 0), V3(0, 1.08, 0), 0.025, 0.002, 6), "w", blade, "metal");
    R.add(gT(V3(0, -0.2, 0), V3(0, 0.1, 0), 0.027, 0.027, 8), "w", grip, "leather");
    if (glowC) R.add(gR(V3(0, 0.78, 0), 0.03, 0.008, "y", 10), "w", glowC, "glow", true);
    tip = [0.62, 1.02];
  }
  if (wlv >= 15 && kind !== "staff" && kind !== "sword" && kind !== "dagger" && kind !== "gsword" && kind !== "archery") { R.add(gBall(V3(0, 0.1, 0.02), 0.012, 1, 1.3, 0.6, 8), "w", glowC || 0x7fd8ff, "glow", true); R.add(gR(V3(0, 0.06, 0), 0.024, 0.006, "y", 10), "w", gold, "metal"); }
  else if (wlv >= 8 && kind !== "staff" && kind !== "sword" && kind !== "dagger" && kind !== "gsword" && kind !== "archery") R.add(gR(V3(0, 0.06, 0), 0.023, 0.005, "y", 10), "w", 0x8a8a92, "metal");
  const e = R.finish();
  const k = { sword: 0.86, staff: 0.84, greataxe: 0.86, scythe: 0.9, club: 0.9, gkatana: 0.86, katana: 0.9, polearm: 0.84, gsword: 0.86 }[kind] || 1;
  if (k !== 1) { e.geo.scale(k, k, k); e.geo.computeBoundingSphere(); e.geo.boundingSphere.radius *= 1.6; tip = tip.map(x => x * k); }
  e.tip = tip;
  RIG.weaponCache.set(key, e);
  return e;
}

function makeWeapon(kind, id) {
  if (!kind || kind === "h2h") return null;
  const e = weaponEntry(kind, id);
  const m = new THREE.Mesh(e.geo, [RIG.weaponMat, RIG.glowMat]);
  m.castShadow = true;
  m.userData.kind = kind;
  m.userData.tip = e.tip;
  if (outlineOn()) { const om = new THREE.Mesh(e.geo, [outlineMaterial(), outlineMaterial()]); om.castShadow = false; om.receiveShadow = false; om.frustumCulled = false; m.add(om); }
  return m;
}

function entryFor(sig, make) {
  let e = RIG.cache.get(sig);
  if (!e) { e = make(); RIG.cache.set(sig, e); }
  return e;
}

function instantiate(entry) {
  const bones = [], byName = {};
  for (const d of entry.defs) {
    const b = new THREE.Bone();
    b.name = d.name;
    b.position.set(d.local[0], d.local[1], d.local[2]);
    b.userData.rest = b.position.clone();
    if (d.parent != null) bones[d.parent].add(b);
    bones.push(b);
    byName[d.name] = b;
  }
  const mat = charMaterial();
  const mesh = new THREE.SkinnedMesh(entry.geo, [mat, RIG.glowMat]);
  mesh.add(bones[0]);
  mesh.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(bones));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (entry.shell) {
    const sm = new THREE.SkinnedMesh(entry.shell, shellMaterial());
    sm.bind(mesh.skeleton, mesh.bindMatrix);
    sm.frustumCulled = false;
    mesh.add(sm);
  }
  if (outlineOn() && !(entry.meta && entry.meta.noOutline)) {
    const om = new THREE.SkinnedMesh(entry.geo, [outlineMaterial(), outlineMaterial()]);
    om.bind(mesh.skeleton, mesh.bindMatrix);
    om.frustumCulled = false;
    om.castShadow = false;
    om.receiveShadow = false;
    mesh.add(om);
  }
  return { mesh, bones: byName, list: bones, mat, meta: entry.meta };
}

function toadEntry(col) {
  const R = new RigBuilder();
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, 0.26, 0);
  R.bone("head", "body", 0, 0.34, 0.2);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) {
    R.bone("ear" + sd, "head", s * 0.09, 0.44, 0.2);
    R.bone("legF" + sd, "body", s * 0.13, 0.2, 0.16);
    R.bone("legB" + sd, "body", s * 0.17, 0.2, -0.12);
  }
  const belly = new THREE.Color(col).lerp(new THREE.Color(0xe8dcb0), 0.55).getHex();
  const dark = new THREE.Color(col).multiplyScalar(0.6).getHex();
  R.add(gBall(V3(0, 0.26, -0.02), 0.27, 1.05, 0.72, 1.15, 16), "body", col, "skin");
  R.add(gBall(V3(0, 0.2, 0.06), 0.22, 0.95, 0.55, 1.0, 14), "body", belly, "skin");
  R.add(gBall(V3(0, 0.33, 0.22), 0.17, 1.25, 0.65, 1.0, 14), "head", col, "skin");
  R.add(gBall(V3(0, 0.29, 0.32), 0.12, 1.4, 0.32, 0.6, 10), "head", belly, "skin");
  for (let k = 0; k < 7; k++) { const a = k * 1.7; R.add(gBall(V3(Math.sin(a) * 0.16, 0.36 + (k % 3) * 0.03, -0.05 + Math.cos(a) * 0.15), 0.03, 1, 0.7, 1, 6), "body", dark, "skin"); }
  for (const s of [-1, 1]) {
    const sd = s > 0 ? "L" : "R";
    R.add(gBall(V3(s * 0.09, 0.44, 0.22), 0.06, 1, 1, 1, 10), "ear" + sd, col, "skin");
    R.add(gBall(V3(s * 0.1, 0.46, 0.26), 0.038, 1, 1, 0.8, 8), "ear" + sd, 0xe8c040, "plain");
    R.add(gBall(V3(s * 0.105, 0.462, 0.29), 0.018, 1, 1.4, 0.6, 6), "ear" + sd, 0x111111, "plain");
    R.add(gTaper(V3(s * 0.13, 0.2, 0.16), V3(s * 0.15, 0.03, 0.24), 0.04, 0.03, 8), "legF" + sd, col, "skin");
    R.add(gBall(V3(s * 0.16, 0.02, 0.27), 0.05, 1.2, 0.35, 1.2, 8), "legF" + sd, dark, "skin");
    for (let k = 0; k < 4; k++) { const a = (k - 1.5) * 0.45; R.add(gTaper(V3(s * 0.16, 0.02, 0.27), V3(s * 0.16 + Math.sin(a) * 0.07, 0.012, 0.27 + Math.cos(a) * 0.07), 0.012, 0.007, 4), "legF" + sd, col, "skin"); R.add(gBall(V3(s * 0.16 + Math.sin(a) * 0.072, 0.012, 0.27 + Math.cos(a) * 0.072), 0.011, 1, 0.7, 1, 5), "legF" + sd, belly, "skin"); }
    R.add(gBall(V3(s * 0.2, 0.18, -0.1), 0.12, 0.75, 0.9, 1.25, 10), "legB" + sd, col, "skin");
    R.add(gTaper(V3(s * 0.2, 0.14, -0.08), V3(s * 0.22, 0.04, -0.06), 0.05, 0.035, 8), "legB" + sd, col, "skin");
    R.add(gBox(V3(s * 0.22, 0.025, 0.0), 0.09, 0.04, 0.24), "legB" + sd, dark, "skin");
  }
  R.meta = { kind: "hare", headTop: 0.6 };
  return R.finish();
}

const FAMILY_SHAPE = {
  goblin: { family: "goblin", hunch: 0.2 },
  chieftain: { family: "goblin", hunch: 0.14 },
  orc: { family: "orc", hunch: 0.1 },
  fishfolk: { family: "reef", hunch: 0.24, prop: { arm: 0.7, neck: 0.035 } },
  birdfolk: { family: "talon", hunch: 0.12 },
  treant: { family: "treant", hunch: 0.07, prop: { girth: 1.4, waist: 1.3, shoulder: 0.24, arm: 0.72, leg: 0.78, hip: 0.13, neck: 0.03, torso: 0.6 } },
  ghoul: { family: "ghoul", hunch: 0.32 },
  skeleton: { family: "undead", hunch: 0.04 }
};
const BOSS_BANNER = { chieftain: 0x8a1f1f, orc_warlord: 0x6a1a1a, mirelord_gax: 0x2f4a2a, rimefang: 0x3a5a7a };

function familyLook(L, m) {
  const f = m.fam || {}, sh = FAMILY_SHAPE[f.model];
  if (!sh) return L;
  const out = Object.assign({}, L, { family: sh.family, hunch: sh.hunch });
  if (sh.prop) out.prop = Object.assign({}, L.prop || {}, sh.prop);
  const key = f.key || m.famKey;
  if (f.boss || f.nm || (f.scale || 1) >= 1.3) { out.boss = true; if (BOSS_BANNER[key]) out.banner = BOSS_BANNER[key]; }
  if (key === "tide_priest" || key === "drowned") out.family = "ghoul";
  return out;
}

function mobLook(m) {
  const f = m.fam, key = f.key || m.famKey;
  const model = f.model;
  if (key === "grimtooth") return { kind: "human", look: goblinLook("grimtooth") };
  if (model === "chieftain") return { kind: "human", look: goblinLook("chieftain") };
  if (key === "mirelord_gax") return { kind: "human", look: goblinLook("gax") };
  if (key === "rimefang") return { kind: "human", look: goblinLook("rimefang") };
  if (model === "goblin") return { kind: "human", look: goblinLook({ den_goblin: "raider", mire_goblin: "mire", frost_goblin: "frost", goblin_apprentice: "apprentice", den_conjurer: "conjurer", mire_hexer: "hexer", frost_shaman: "shaman" }[m.famKey] || "goblin") };
  if (model === "toad") return { kind: "toad", col: key === "old_croaker" ? 0x6a8a30 : 0x5f7a3a };
  if (model === "skeleton") {
    if (key === "spire_warden") return { kind: "human", look: { skull: true, skin: 0x8a5a48, noFace: true, headRegion: "bone", eyesGlow: 0xff5722, top: { type: "plate", color: 0x5a2a20, region: "chain", plate: 0x8a3a24, trim: 0xffb74d, glowTrim: true }, pauldrons: 0x8a3a24, gauntlets: true, gloves: 0x5a2a20, greaves: 0x8a3a24, head: { type: "horned", color: 0x5a2a20, color2: 0xe8d8c0 }, cape: 0x3a1410, legs: 0x8a5a48, barefoot: true, weapon: "gsword", weaponId: "lucent_sword", prop: { girth: 0.9 } } };
    if (key === "hollow_king") return { kind: "human", look: { skull: true, skin: 0xd8d0b8, noFace: true, headRegion: "bone", eyesGlow: 0xffd54f, top: { type: "tabard", color: 0x2a1a3a, region: "cloth", color2: 0xd8b040 }, cape: 0x3a1030, legs: 0xd8d0b8, barefoot: true, head: { type: "crown" }, weapon: "sword", weaponId: "iron_sword", prop: { girth: 0.85 } } };
    if (key === "crypt_sentinel") return { kind: "human", look: { skull: true, skin: 0xc8d0c8, noFace: true, headRegion: "bone", eyesGlow: 0x80cbc4, top: { type: "mail", color: 0x4a5a5a, region: "chain" }, pauldrons: 0x5a6a6a, legs: 0xc8d0c8, barefoot: true, head: { type: "helm", color: 0x4a5a5a }, weapon: "greataxe", weaponId: "butterfly_axe", prop: { girth: 0.85 } } };
    if (key === "royal_guard") return { kind: "human", look: { skull: true, skin: 0xe0dccc, noFace: true, headRegion: "bone", eyesGlow: 0xffd54f, top: { type: "tabard", color: 0x2a1a3a, region: "chain", color2: 0xd8b040 }, legs: 0xe0dccc, barefoot: true, head: { type: "cap", color: 0x5a5a62 }, weapon: "sword", weaponId: "bronze_sword", prop: { girth: 0.75 } } };
    if (key === "ice_wight" || key === "frost_wight") return { kind: "human", look: { skull: true, skin: 0xd4eef8, noFace: true, headRegion: "bone", eyesGlow: 0x40c4ff, top: { type: key === "frost_wight" ? "robe" : "rags", color: 0x6a8aa0, trim: 0xb3e5fc, glowTrim: key === "frost_wight" }, legs: 0xd4eef8, barefoot: true, head: key === "frost_wight" ? { type: "hood", color: 0x4a6a80 } : null, weapon: "sword", weaponId: "iron_sword", prop: { girth: key === "frost_wight" ? 0.95 : 0.75 } } };
    return { kind: "human", look: { skull: true, skin: 0xe8e2cf, noFace: true, headRegion: "bone", eyesGlow: 0x66e0ff, top: { type: "rags", color: 0x3a3028 }, legs: 0xe8e2cf, barefoot: true, weapon: "sword", weaponId: "rusty", prop: { girth: 0.7 } } };
  }
  if (key === "tide_priest") return { kind: "human", look: { skull: true, skin: 0x7aa6a6, noFace: true, headRegion: "bone", eyesGlow: 0x4dd0e1, top: { type: "robe", color: 0x14303a, trim: 0x4dd0e1, glowTrim: true }, head: { type: "hood", color: 0x0f2530 }, legs: 0x14303a, barefoot: true, weapon: "staff", weaponId: "holly_staff" } };
  if (model === "orc") {
    const archer = key === "orc_stonechucker" || key === "frost_stonechucker", lord = key === "orc_warlord", frost = key.startsWith("frost_");
    const skin = lord ? 0x5a6a4a : frost ? 0x7a8a8a : 0x6f7f4f;
    return { kind: "human", look: { skin, noFace: true, eyesGlow: lord ? 0xff5030 : 0xffb040, tusks: true, barefoot: false, boots: 0x2a1e14, top: archer ? { type: "vest", color: 0x4a3a2a, region: "leather", under: skin } : { type: "mail", color: lord ? 0x3a3038 : 0x5a5048, region: "chain" }, pauldrons: lord ? 0x6a4a3a : archer ? null : 0x4a4038, head: lord ? { type: "horned", color: 0x3a3030, color2: 0xe8dcc0 } : archer ? { type: "bandana", color: 0x6a2a2a } : { type: "cap", color: 0x4a4038 }, cape: lord ? 0x6a1a1a : null, legs: 0x3a3028, belt: 0x2a1e14, hair: { style: "bald", color: 0x222 }, weapon: archer ? "archery" : lord ? "greataxe" : "club", weaponId: archer ? "shortbow" : lord ? "great_axe" : null, prop: { leg: 0.86, torso: 0.6, headR: 0.15, arm: 0.66, shoulder: lord ? 0.26 : 0.23, hip: 0.12, neck: 0.04, girth: lord ? 1.4 : 1.25, waist: 1.2 } } };
  }
  if (model === "fishfolk") {
    const chief = key === "fishfolk_chief";
    return { kind: "human", look: { skin: chief ? 0x3a7a8a : 0x4a8a7a, skinRegion: "scale", noFace: true, eyesGlow: 0xffe082, ears: "fin", finColor: chief ? 0x8ad0e0 : 0x7ac0b0, barefoot: true, top: { type: "vest", color: 0x2a4a5a, region: "leather", under: 0x4a8a7a }, legs: 0x2a4a4a, belt: 0x6a5a3a, hair: { style: "bald", color: 0x222 }, head: chief ? { type: "horned", color: 0x2a5a6a, color2: 0xd8e8f0 } : null, cape: chief ? 0x1a4a5a : null, weapon: chief ? "staff" : "dagger", weaponId: chief ? "flexible_pole" : "bronze_dagger", prop: { leg: 0.8, torso: 0.5, headR: 0.15, arm: 0.6, shoulder: 0.19, hip: 0.1, neck: 0.06, girth: 1.0 } } };
  }
  if (model === "birdfolk") {
    const priest = key === "birdfolk_priest" || key === "crag_oracle", oracle = key === "crag_oracle";
    const plum = oracle ? 0xd8d0e8 : priest ? 0xf0e4c8 : 0xc8a870;
    return { kind: "human", look: { skin: plum, skinRegion: "feather", noFace: true, eyesGlow: oracle ? 0xb388ff : 0xffd54f, ears: "none", beak: 0xe8c060, crest: oracle ? 0x7e57c2 : priest ? 0xd84a4a : 0x4a3a2a, barefoot: true, top: priest ? { type: "robe", color: oracle ? 0x3a2a5a : 0x8a2a2a, trim: 0xd8c070, glowTrim: oracle } : { type: "vest", color: 0x5a4a3a, region: "leather", under: plum }, legs: plum, legsRegion: "feather", belt: 0x6a4a2a, hair: { style: "bald", color: 0x222 }, weapon: priest ? "staff" : "sword", weaponId: priest ? "holly_staff" : "bronze_sword", prop: { leg: 0.9, torso: 0.5, headR: 0.14, arm: 0.62, shoulder: 0.18, hip: 0.09, neck: 0.09, girth: 0.92 } } };
  }
  if (model === "treant") {
    const elder = key === "treant_elder" || key === "old_rootfather", frost = key === "rime_treant";
    const bark = frost ? 0x6a7a80 : elder ? 0x4a3a28 : 0x6a4a30, leaf = frost ? 0xcfe8f0 : elder ? 0x3a6a2a : 0x6aa84a;
    return { kind: "human", look: { skin: bark, skinRegion: "wood", noFace: true, eyesGlow: elder ? 0xffb300 : 0x9ccc65, ears: "none", leafHead: leaf, barefoot: true, top: { type: "rags", color: bark, sleeves: "none" }, legs: bark, legsRegion: "wood", hair: { style: "bald", color: 0x222 }, claws: true, prop: elder ? { leg: 1.0, torso: 0.72, headR: 0.17, arm: 0.86, shoulder: 0.26, hip: 0.13, neck: 0.03, girth: 1.35 } : { leg: 0.6, torso: 0.4, headR: 0.14, arm: 0.5, shoulder: 0.16, hip: 0.08, neck: 0.03, girth: 0.9 } } };
  }
  if (model === "cactus") {
    const king = key === "cactus_king";
    return { kind: "human", look: { cactus: true, flower: king ? 0xffd54f : 0xf06292, skin: king ? 0x3f7a34 : 0x4f9a42, noFace: true, eyesGlow: 0x111111, ears: "none", needles: true, barefoot: true, top: { type: "rags", color: king ? 0x4a8a3a : 0x5aa04a, sleeves: "none" }, legs: king ? 0x4a8a3a : 0x5aa04a, hair: { style: "bald", color: 0x222 }, head: king ? { type: "crown" } : null, prop: { leg: 0.7, torso: 0.5, headR: 0.13, arm: 0.45, shoulder: 0.15, hip: 0.07, neck: 0.02, girth: 0.95 } } };
  }
  if (model === "wisp") return { kind: "wisp", col: f.tint || 0xffffff, col2: f.tint2 || 0xffffff };
  if (model === "bomb") return { kind: "bomb", col: key === "frost_bomb" ? 0x81d4fa : key === "ashen_bomb" ? 0x9e9e9e : 0xff7043, eye: key === "frost_bomb" ? 0xffffff : 0xfff3c0 };
  if (model === "ghoul") {
    const warden = key === "ossuary_warden";
    return { kind: "human", look: { skin: warden ? 0x6a8a74 : 0x8fa890, noFace: true, eyesGlow: warden ? 0x69f0ae : 0xff3030, claws: true, barefoot: true, top: { type: "rags", color: warden ? 0x1c2621 : 0x3a3a30, sleeves: "none" }, legs: 0x4a4a3e, hair: { style: "long", color: 0x6a6a60 }, head: warden ? { type: "hood", color: 0x1c2621 } : null, prop: { arm: 0.72, leg: 0.82, headR: 0.118, girth: 0.82 } } };
  }
  if (model === "bat") return { kind: "bat", col: key === "duskwing" ? 0x3a2a5a : f.tint || 0x5a4a6a, eye: key === "duskwing" ? 0xd080ff : f.tint ? 0x80d8ff : 0xff3030 };
  if (model === "worm") return { kind: "worm", col: key === "king_wiggles" ? 0xc8a050 : f.tint || 0xb8866a };
  if (model === "hare") return { kind: "hare", col: f.tint || 0xc8a27a };
  if (["bee", "crawler", "sheep", "lizard", "longneck", "crab", "mandrake", "shroom", "fish", "bulb"].includes(model)) return { kind: model, col: f.tint || 0x888888, col2: f.tint2 };
  return { kind: "human", look: goblinLook("goblin") };
}

function mobBand(lv) { return (lv || 1) >= 16 ? 3 : (lv || 1) >= 11 ? 2 : (lv || 1) >= 6 ? 1 : 0; }
function boldTint(c, band) {
  const q = new THREE.Color(c), h = {};
  q.getHSL(h);
  const dh = [0, 0.045, 0.09, -0.09][band], dl = [1, 0.88, 0.76, 0.64][band];
  q.setHSL((h.h + dh + 1) % 1, Math.min(1, h.s * 1.25 + band * 0.08), Math.max(0.06, h.l * dl));
  return q.getHex();
}

const NM_DECOR = {
  king_wiggles: { style: "crown", col: 0xd8b040, gem: 0xff5252 },
  old_croaker: { style: "crown", col: 0xd8b040, gem: 0x69f0ae },
  lumicap_matron: { style: "crown", col: 0xe8d8ff, gem: 0xb388ff },
  sandglass_wisp: { style: "crown", col: 0xd8b040, gem: 0xffe082 },
  silkmother: { style: "spikes", col: 0x6a3a8a, aura: 0xce93d8 },
  duskwing: { style: "horns", col: 0x2a1a3a, aura: 0xd080ff },
  pyreclaw: { style: "horns", col: 0x3a1a10, aura: 0xff7043, spikes: 0xff7043 },
  old_saltjaw: { style: "spikes", col: 0xe8dcc0, aura: 0x4fc3f7 },
  thunderhoof: { style: "horns", col: 0xd8b040, aura: 0xffe082 },
  gloamhorn: { style: "horns", col: 0x2a2a3a, aura: 0xb388ff, spikes: 0x4a3a6a },
  sandmaw: { style: "spikes", col: 0xd8c8a0, aura: 0xffb74d }
};

function nmDecor(R, key) {
  const D = NM_DECOR[key] || { style: "horns", col: 0xe8dcc0, aura: 0xff5252 };
  const bbOf = name => {
    const d = R.byName[name];
    if (!d) return null;
    const bb = new THREE.Box3(), v = new THREE.Vector3();
    let n = 0;
    for (const g of R.pieces) if (g.userData.rig && g.userData.rig.bone === d.index) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { bb.expandByPoint(v.fromBufferAttribute(p, i)); n++; } }
    return n ? bb : null;
  };
  const all = new THREE.Box3(), v = new THREE.Vector3();
  for (const g of R.pieces) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) all.expandByPoint(v.fromBufferAttribute(p, i)); }
  const hb = R.byName.head ? "head" : R.byName.body ? "body" : R.defs[0].name;
  const hbb = bbOf(hb) || all;
  const hc = hbb.getCenter(new THREE.Vector3()), hs = hbb.getSize(new THREE.Vector3()), hr = Math.max(0.04, Math.min(hs.x, hs.y, hs.z) * 0.5), top = hbb.max.y;
  const fz = hc.z;
  if (D.style === "crown") {
    const cr = Math.min(Math.max(hs.x, hs.z) * 0.32, hr * 0.9), cy = top - hr * 0.05;
    R.add(gRing(V3(hc.x, cy, fz), cr, Math.max(0.01, cr * 0.12), "y", 14), hb, D.col, "metal");
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; R.add(gTaper(V3(hc.x + Math.sin(a) * cr, cy, fz + Math.cos(a) * cr), V3(hc.x + Math.sin(a) * cr * 1.1, cy + cr * 0.9, fz + Math.cos(a) * cr * 1.1), cr * 0.22, 0.004, 5), hb, D.col, "metal"); }
    if (D.gem) R.add(gBall(V3(hc.x, cy + cr * 0.2, fz + cr * 1.02), cr * 0.18, 1, 1.2, 0.7, 8), hb, D.gem, "glow", true);
  } else if (D.style === "horns") {
    for (const s of [-1, 1]) {
      const a = V3(hc.x + s * hs.x * 0.3, top - hr * 0.15, fz - hs.z * 0.1), b = a.clone().add(V3(s * hr * 0.9, hr * 0.8, -hr * 0.4)), c = b.clone().add(V3(s * hr * 0.1, hr * 0.9, hr * 0.5));
      R.add(gTaper(a, b, hr * 0.28, hr * 0.17, 6), hb, D.col, "bone");
      R.add(gTaper(b, c, hr * 0.17, 0.004, 6), hb, D.col, "bone");
    }
  } else {
    for (let k = 0; k < 3; k++) { const a = V3(hc.x + (k - 1) * hs.x * 0.22, top - hr * 0.1, fz - hs.z * 0.1); R.add(gTaper(a, a.clone().add(V3((k - 1) * hr * 0.3, hr * (1.1 - Math.abs(k - 1) * 0.3), -hr * 0.4)), hr * 0.2, 0.004, 5), hb, D.col, "bone"); }
  }
  const body = R.byName.body ? "body" : hb, bbb = bbOf(body);
  if (bbb && body !== hb) {
    const bs = bbb.getSize(new THREE.Vector3()), bc = bbb.getCenter(new THREE.Vector3()), n = 4, sr = Math.max(0.025, Math.min(bs.x, bs.y) * 0.12);
    for (let k = 0; k < n; k++) { const z = bc.z + bs.z * (0.3 - k * 0.6 / (n - 1)), a = V3(bc.x, bbb.max.y - sr * 0.4, z); R.add(gTaper(a, a.clone().add(V3(0, sr * 2.6, -sr * 0.8)), sr, 0.004, 5), body, D.spikes || D.col, D.spikes ? "glow" : "bone", !!D.spikes); }
  }
  const root = R.defs[0].name, ar = Math.max(all.max.x - all.min.x, all.max.z - all.min.z) * 0.6 + 0.1;
  R.add(gRing(V3((all.min.x + all.max.x) / 2, 0.02, (all.min.z + all.max.z) / 2), ar, 0.012, "y", 24), root, D.aura || D.gem || 0xff5252, "glow", true);
}

function mobVariant(m) { return m.fam && m.fam.nm ? 0 : hashStr((m.famKey || "") + ":" + m.id) % 3; }
function shadeHex(c, k) { const q = new THREE.Color(c); q.multiplyScalar(k); return q.getHex(); }
function varyMobLook(ml, vr) {
  if (!vr) return ml;
  if (ml.kind !== "human") {
    const out = Object.assign({}, ml);
    if (out.col != null) out.col = vr === 1 ? shadeHex(out.col, 0.84) : new THREE.Color(out.col).lerp(new THREE.Color(0xd8b080), 0.14).getHex();
    return out;
  }
  const L = Object.assign({}, ml.look);
  if (L.top) L.top = Object.assign({}, L.top, { color: shadeHex(L.top.color || 0x6a5a4a, vr === 1 ? 0.8 : 1.15) });
  if (vr === 1 && !L.head && !L.leafHead && !L.crest) L.head = { type: L.skull ? "helm" : "cap", color: L.skull ? 0x6a6a64 : 0x5a4a3a };
  if (vr === 2 && !L.pauldrons && L.top && L.top.sleeves !== "none") L.pauldrons = L.skull ? 0x6a6a64 : 0x5a5048;
  if (vr === 2 && L.belt == null) L.belt = 0x3a2a1a;
  return { kind: "human", look: L };
}
const MOB_GEAR_CACHE = new Map();
function mobGearFor(job, lv) {
  const key = job + "|" + lv;
  if (MOB_GEAR_CACHE.has(key)) return MOB_GEAR_CACHE.get(key);
  const wt = MOB_JOB_WEAPON[job];
  const best = test => Object.keys(ITEMS).filter(id => { const it = ITEMS[id]; return it && !it.hq && test(it) && (it.lv || 1) <= lv; }).sort((a, b) => (ITEMS[b].lv || 1) - (ITEMS[a].lv || 1) || (ITEMS[a].price || 0) - (ITEMS[b].price || 0))[0] || null;
  const gear = {};
  if (wt && wt !== "h2h") gear.main = best(it => it.slot === "main" && it.wtype === wt);
  if (job === "PLD") gear.sub = best(it => it.slot === "sub" && /shield/i.test(it.name || ""));
  const g = lookForGear(job, gear, {});
  const out = { weapon: gear.main ? g.weapon : null, weaponId: gear.main || null, shield: g.shield || null };
  MOB_GEAR_CACHE.set(key, out);
  return out;
}
function mobPalette(e) {
  const k = e.famKey || "", m = e.fam && e.fam.model;
  if (/^(frost_|ice_|rime_|glacier)/.test(k)) return 0xd8eaf4;
  if (/^mire_|^bog_/.test(k)) return 0x4a5a30;
  if (k === "drowned") return 0x2e5656;
  if (m === "fishfolk") return 0x2a5a5a;
  if (m === "birdfolk") return 0xc8a870;
  if (m === "skeleton") return 0x5a5a52;
  if (m === "ghoul") return 0x4a4a40;
  return null;
}
function tintHex(c, to, k) { return typeof c === "number" ? new THREE.Color(c).lerp(new THREE.Color(to), k).getHex() : c; }
function jobMobLook(L, e) {
  const fn = JOB_STYLE[e.job];
  if (!fn) return L;
  const tint = JOB_TINT[e.job] || JOB_TINT.WAR, st = JSON.parse(JSON.stringify(fn(jobStyleTier(e.lv), tint)));
  const out = Object.assign({}, L);
  for (const k of JOB_STYLE_SLOTS) delete out[k];
  Object.assign(out, st);
  if (!out.legs) out.legs = L.skull ? L.legs : tint.pants;
  const m = e.fam && e.fam.model;
  if (m === "birdfolk" || m === "fishfolk" || L.skull) { delete out.boots; delete out.shoes; delete out.greaves; out.barefoot = true; if (L.skull && !st.legs) out.legs = L.legs; }
  else if (!out.boots) out.shoes = 0x3a2a1e;
  if (L.crest && out.head && ["helm", "kabuto", "winged"].includes(out.head.type)) out.head = Object.assign({}, out.head, { type: "cap" });
  const pal = mobPalette(e);
  if (pal != null) {
    const k = 0.32;
    if (out.top) { out.top = Object.assign({}, out.top); for (const f of ["color", "color2", "plate", "under"]) if (out.top[f] != null) out.top[f] = tintHex(out.top[f], pal, k); }
    if (out.head) { out.head = Object.assign({}, out.head); if (out.head.color != null) out.head.color = tintHex(out.head.color, pal, k); }
    for (const f of ["cape", "boots", "pauldrons", "belt", "gloves", "greaves"]) if (out[f] != null) out[f] = tintHex(out[f], pal, k);
    if (!L.skull && out.legs != null) out.legs = tintHex(out.legs, pal, k);
  }
  const vr = mobVariant(e);
  if (vr && out.top && out.top.color != null) out.top = Object.assign({}, out.top, { color: shadeHex(out.top.color, vr === 1 ? 0.85 : 1.12) });
  if (!(e.fam && e.fam.range)) {
    const g = mobGearFor(e.job, e.lv || 1);
    out.weapon = g.weapon; out.weaponId = g.weaponId;
    if (g.shield) out.shield = g.shield; else delete out.shield;
  }
  out.jobLook = e.job;
  return out;
}
function buildEntityRig(e) {
  let sig, make, weaponKind = null, weaponId = null, alwaysDrawn = false;
  if (isMob(e)) {
    const ml = varyMobLook(mobLook(e), mobVariant(e));
    if (ml.kind === "human") ml.look = familyLook(ml.look, e);
    if (ml.kind === "human" && e.job && !(e.fam && (e.fam.nm || e.fam.boss))) ml.look = jobMobLook(ml.look, e);
    else { const band = mobBand(e.lv); if (ml.col != null) ml.col = boldTint(ml.col, band); if (ml.col2 != null) ml.col2 = boldTint(ml.col2, band); }
    if (ml.kind === "human") {
      sig = "m|" + stableKey(ml.look);
      make = () => humanEntry(ml.look);
      weaponKind = ml.look.weapon; weaponId = ml.look.weaponId;
      alwaysDrawn = true;
    } else if (ml.kind === "bat") { sig = "bat|" + ml.col; make = () => batEntry(ml.col, ml.eye); }
    else if (ml.kind === "worm") { sig = "worm|" + ml.col; make = () => wormEntry(ml.col); }
    else if (ml.kind === "toad") { sig = "toad|" + ml.col; make = () => toadEntry(ml.col); }
    else if (ml.kind === "bomb") { sig = "bomb|" + ml.col; make = () => bombEntry(ml.col, ml.eye); }
    else if (ml.kind === "bee") { sig = "bee|" + ml.col + ml.col2; make = () => beeEntry(ml.col, ml.col2); }
    else if (ml.kind === "crawler") { sig = "crawler|" + ml.col + ml.col2; make = () => crawlerEntry(ml.col, ml.col2); }
    else if (ml.kind === "sheep") { sig = "sheep|" + ml.col; make = () => sheepEntry(ml.col); }
    else if (ml.kind === "lizard") { sig = "lizard|" + ml.col + ml.col2; make = () => lizardEntry(ml.col, ml.col2); }
    else if (ml.kind === "longneck") { sig = "longneck|" + ml.col; make = () => longneckEntry(ml.col); }
    else if (ml.kind === "crab") { sig = "crab|" + ml.col + ml.col2; make = () => crabEntry(ml.col, ml.col2); }
    else if (ml.kind === "mandrake") { sig = "mandrake|" + ml.col + ml.col2; make = () => mandrakeEntry(ml.col, ml.col2); }
    else if (ml.kind === "wisp") { sig = "wisp|" + ml.col + ml.col2; make = () => wispEntry(ml.col, ml.col2); }
    else if (ml.kind === "bulb") { sig = "bulb|" + ml.col + ml.col2; make = () => bulbEntry(ml.col, ml.col2); }
    else if (ml.kind === "shroom") { sig = "shroom|" + ml.col + ml.col2; make = () => shroomEntry(ml.col, ml.col2); }
    else if (ml.kind === "fish") { sig = "fish|" + ml.col + ml.col2; make = () => fishEntry(ml.col, ml.col2); }
    else { sig = "hare|" + ml.col; make = () => hareEntry(ml.col); }
    const nk = e.fam && e.fam.nm && ml.kind !== "human" ? (e.fam.key || e.famKey) : null;
    if (nk) { const mk = make; sig += "|nm:" + nk; make = () => { RIG.hook = R => nmDecor(R, nk); try { return mk(); } finally { RIG.hook = null; } }; }
  } else if (e.kind === "npc") {
    const nd = typeof NPCS !== "undefined" ? NPCS[e.id] : null;
    if (nd && (nd.prop || nd.crystal || nd.hidden)) return null;
    const L = NPC_LOOK[e.id] || (nd && NPC_LOOK[nd.model]) || (nd ? walkerLook(hashStr(e.id) % 997) : null);
    if (!L) return null;
    sig = "n|" + e.id;
    const held = L.held !== undefined ? L.held : NPC_HELD[e.id] || (nd && NPC_HELD[nd.model]) || null;
    const LF = Object.assign(L.face == null && !L.noFace ? { face: hashStr(e.id) % FACE_COUNT } : {}, L, { held });
    make = () => humanEntry(LF);
    weaponKind = L.weapon; alwaysDrawn = !!L.alwaysDrawn;
  } else if (e.ambient) {
    sig = "amb|" + e.type + "|" + (e.seed || 0) + "|" + (e.look || "") + (e.district ? "|" + e.district + (e.time === "night" ? "n" : "") : "");
    if (e.type === "walker") { const L = e.look && NPC_LOOK[e.look] ? NPC_LOOK[e.look] : walkerLook(e.seed || 0, e.district, e.time === "night"); make = () => humanEntry(L); }
    else if (e.type === "chicken") make = () => birdEntry(e.col || 0xf2ece0, 0xd03020);
    else if (e.type === "gull") make = () => birdEntry(0xf0f2f4, null, 0xe8c040);
    else if (e.type === "bird") make = () => birdEntry(e.col || 0x6a5a4a, null, 0xd8a040);
    else if (e.type === "deer") make = () => quadEntry({ col: e.col || 0x8a6a48, belly: 0xe8dcc8, slim: true, bodyW: 0.62, bodyY: 0.78, bodyR: 0.2, bodyLen: 0.86, leg: 0.72, hip: 0.1, legR: 0.03, neckUp: 0.34, neckFwd: 0.22, neckR: 0.052, headR: 0.09, ears: 1.3, snout: 0.85, mw: 0.72, hoof: true, tailLen: 0.12, tailDrop: 0.04, tailR: 0.04, stride: 1.6 });
    else if (e.type === "dog") make = () => quadEntry({ col: e.col || 0x8a6a4a, slim: true, bodyW: 0.68, bodyY: 0.36, bodyR: 0.125, bodyLen: 0.6, leg: 0.33, hip: 0.07, legR: 0.03, neckUp: 0.14, neckFwd: 0.13, neckR: 0.048, headR: 0.08, ears: 1.3, snout: 0.75, mw: 0.78, tailLen: 0.22, tailDrop: -0.1, tailR: 0.025, stride: 0.9 });
    else make = () => quadEntry({ col: e.col || 0x5a5a5a, slim: true, bodyW: 0.66, bodyY: 0.22, bodyR: 0.082, bodyLen: 0.4, leg: 0.19, hip: 0.04, legR: 0.018, neckUp: 0.08, neckFwd: 0.08, neckR: 0.036, headR: 0.062, ears: 1.1, snout: 0.22, mw: 0.95, eye: 0x9ccc65, eyeK: 1.25, tailLen: 0.3, tailDrop: -0.2, tailR: 0.018, stride: 0.6 });
  } else if (e.buddy) {
    const B = BUDDIES[e.petId];
    sig = "buddy|" + e.petId;
    if (B.model === "hare") make = () => hareEntry(B.col);
    else if (B.model === "bat") make = () => batEntry(B.col, B.eye || 0xff3030);
    else if (B.model === "wisp") make = () => wispEntry(B.col, B.eye);
    else if (B.model === "worm") make = () => wormEntry(B.col);
    else { const L = goblinLook("goblin"); L.weapon = null; L.sack = false; make = () => humanEntry(L); }
  } else if (e.pet && e.automaton) {
    sig = "automaton";
    make = () => humanEntry(Object.assign({ build: 0, hair: { style: "bald", color: 0 } }, AUTOMATON_LOOK));
  } else if (e.pet && e.beast) {
    const fk = e.beast, ml = mobLook({ fam: FAMILIES[fk], famKey: fk, id: 0 });
    sig = "beast|" + fk;
    if (ml.kind === "lizard") make = () => lizardEntry(ml.col, ml.col2);
    else if (ml.kind === "crab") make = () => crabEntry(ml.col, ml.col2);
    else if (ml.kind === "sheep") make = () => sheepEntry(ml.col);
    else make = () => hareEntry(ml.col);
  } else if (e.pet) {
    const P = PETS[e.petKey];
    sig = "pet|" + e.petKey;
    make = () => batEntry(P.col, P.eye);
  } else {
    const base = e === player ? playerBase() : e.remote ? baseFromLook(e.look || {}) : (MERC_BASE[e.mercId] || (MERCS[e.mercId] && MERCS[e.mercId].look ? baseFromLook(MERCS[e.mercId].look) : MERC_BASE.kael));
    const L = lookFor(e.job, e.gear, base, e.lv, e === player || !!e.remote);
    sig = "h|" + stableKey(L);
    make = () => humanEntry(L);
    weaponKind = L.weapon; weaponId = L.weaponId;
  }
  const entry = entryFor(sig, make);
  const inst = instantiate(entry);
  inst.sig = sig;
  inst.lodEntry = () => entryFor("lo|" + sig, () => { const k = RIG.segK, sl = RIG.shellLayers; RIG.segK = Math.min(0.5, k * 0.65); RIG.shellLayers = 0; try { return make(); } finally { RIG.segK = k; RIG.shellLayers = sl; } });
  inst.weaponKind = weaponKind;
  inst.weapon = makeWeapon(weaponKind, weaponId);
  inst.alwaysDrawn = alwaysDrawn;
  return inst;
}

const BODY_HEIGHTS = [0.9, 0.95, 1, 1.05, 1.1], BODY_GIRTHS = [0.86, 0.93, 1, 1.1, 1.22];
const BODY_HEIGHT_NAMES = ["Short", "Below average", "Average", "Tall", "Very tall"], BODY_GIRTH_NAMES = ["Slim", "Lean", "Average", "Sturdy", "Heavy"];

const RACE_BODY = {
  human: [{ leg: 0.86, torso: 0.52, arm: 0.6, girth: 1, waist: 0.92, shoulder: 0.195, hip: 0.095, headR: 0.138, neck: 0.02 }, { leg: 0.86, torso: 0.52, arm: 0.6, girth: 0.9, waist: 0.8, shoulder: 0.165, hip: 0.1, headR: 0.138, neck: 0.02 }],
  elari: [{ leg: 0.99, torso: 0.57, arm: 0.67, girth: 0.88, waist: 0.84, shoulder: 0.19, hip: 0.09, headR: 0.13, neck: 0.088 }, { leg: 0.97, torso: 0.55, arm: 0.65, girth: 0.82, waist: 0.74, shoulder: 0.158, hip: 0.098, headR: 0.128, neck: 0.088 }],
  pipkin: [{ leg: 0.34, torso: 0.3, arm: 0.3, girth: 1.0, waist: 1.0, shoulder: 0.125, hip: 0.072, headR: 0.2, neck: -0.05 }, { leg: 0.34, torso: 0.3, arm: 0.3, girth: 0.96, waist: 0.94, shoulder: 0.118, hip: 0.074, headR: 0.2, neck: -0.05 }],
  ursan: [{ leg: 0.94, torso: 0.8, arm: 0.88, girth: 1.5, waist: 1.3, shoulder: 0.32, hip: 0.14, headR: 0.19, neck: -0.04 }, { leg: 0.94, torso: 0.8, arm: 0.88, girth: 1.5, waist: 1.3, shoulder: 0.32, hip: 0.14, headR: 0.19, neck: -0.04 }],
  nekari: [{ leg: 0.88, torso: 0.5, arm: 0.58, girth: 0.86, waist: 0.76, shoulder: 0.16, hip: 0.098, headR: 0.134, neck: 0.02 }, { leg: 0.88, torso: 0.5, arm: 0.58, girth: 0.84, waist: 0.74, shoulder: 0.155, hip: 0.1, headR: 0.134, neck: 0.02 }]
};

function raceOfLook(l) { return l && RACE_BODY[l.race] ? l.race : "human"; }

function bodyProp(l) {
  const hi = l.height == null ? 2 : l.height, gi = l.girth == null ? 2 : l.girth, race = raceOfLook(l);
  if (race === "human" && hi === 2 && gi === 2) return null;
  const H = BODY_HEIGHTS[hi] || 1, G = BODY_GIRTHS[gi] || 1, B = RACE_BODY[race][l.build === 1 ? 1 : 0];
  return { leg: B.leg * H, torso: B.torso * H, arm: B.arm * H, girth: B.girth * G, waist: B.waist * Math.pow(G, 1.4), shoulder: B.shoulder * (1 + (G - 1) * 0.6) * (0.5 + H * 0.5), hip: B.hip * (1 + (G - 1) * 0.7), headR: B.headR, neck: B.neck };
}

const RACE_SKIN = { human: 1, elari: 0, pipkin: 0, ursan: 2, nekari: 1 };
const RACE_SKINCOL = { ursan: 0x8e9688, pipkin: 0xf2c9aa };
function raceSkinColor(race) { return RACE_SKINCOL[race] != null ? RACE_SKINCOL[race] : SKIN_TONES[RACE_SKIN[race] || 0]; }
function baseFromLook(look) {
  const l = look || {};
  const b = { build: l.build || 0, skin: raceSkinColor(raceOfLook(l)), hair: { style: HAIR_STYLES[l.hairStyle || 0] || "short", color: HAIR_COLORS[l.hairColor || 0] }, face: l.face || 0 };
  const p = bodyProp(l);
  if (p) b.prop = p;
  const race = raceOfLook(l);
  if (race === "elari") b.ears = "elf";
  if (race === "pipkin") { b.ears = "pip"; b.doll = true; }
  if (race === "nekari") { b.ears = "cat"; b.tail = "cat"; }
  if (race === "ursan") { b.tail = "ursan"; b.ears = "ursan"; }
  return b;
}

function playerBase() { return baseFromLook(save.look); }

function rigSigFor(e) {
  if (e.pet) return "pet|" + e.petKey;
  if (e.buddy) return "buddy|" + e.petId;
  if (e.ambient) return "amb|" + e.type + "|" + (e.seed || 0) + (e.district ? "|" + e.district + (e.time === "night" ? "n" : "") : "");
  const jt = jobStyleOn() ? "|t" + jobStyleTier(e.lv) : "";
  if (e.remote) return "r|" + e.job + jt + "|" + SLOTS.map(s => (e.gear || {})[s] || "").join(",") + "|" + JSON.stringify(e.look || {});
  if (isMob(e)) return "m|" + (e.fam.key || e.famKey);
  if (e.kind === "npc") return "n|" + e.id;
  return "p|" + e.job + jt + "|" + SLOTS.map(s => e.gear[s] || "").join(",") + "|" + (e === player ? JSON.stringify(save.look || {}) : e.mercId);
}

function buildMount(coatId) {
  const id = MOUNT_COATS[coatId] ? coatId : "teal";
  const entry = entryFor("thornstrider|" + id, () => thornstriderEntry(MOUNT_COATS[id]));
  return instantiate(entry);
}
