const ICONS = { cell: 48, cols: 24, map: {}, url: null };

function icoMetal(it, id) {
  const n = (it.name || "").toLowerCase() + " " + id;
  if (/mythril|silver/.test(n)) return ["#e8eef6", "#9aa8bc", "#5a6478"];
  if (/gold|royal|king|warlord|sovereign/.test(n)) return ["#fff0a8", "#d8a83a", "#7a5a18"];
  if (/bronze|copper/.test(n)) return ["#f0b07a", "#b8703a", "#5a3218"];
  if (/bone|crypt/.test(n)) return ["#f4eedc", "#c8bc9c", "#6a604a"];
  if (/rusty/.test(n)) return ["#c89878", "#8a5a3a", "#3a2418"];
  if (/frost|ice|rime/.test(n)) return ["#f0fbff", "#9fd8f0", "#4a7a9a"];
  if (/ember|fire|cinder|ashen/.test(n)) return ["#ffd0a0", "#e0602a", "#6a2010"];
  if (/dark|shadow|dusk|night/.test(n)) return ["#b8a8d8", "#5a4a7a", "#20182e"];
  const lv = it.lv || 1;
  if (lv < 8) return ["#f0b07a", "#b8703a", "#5a3218"];
  if (lv < 15) return ["#e0e4ea", "#9aa3ad", "#4a525c"];
  if (lv < 25) return ["#f4f8fc", "#b8c4d0", "#58646e"];
  return ["#fff4c0", "#d8b850", "#6a5218"];
}

function icoGrad(g, x0, y0, x1, y1, c) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, c[0]); gr.addColorStop(0.5, c[1]); gr.addColorStop(1, c[2]);
  return gr;
}

function icoPoly(g, pts, fill, stroke, lw) {
  g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 1; g.stroke(); }
}

function icoRot(g, ang, fn) { g.save(); g.translate(24, 24); g.rotate(ang); fn(); g.restore(); }

const ICO_WOOD = ["#c89060", "#8a5a30", "#4a2a12"], ICO_GRIP = ["#8a5a3a", "#4a2a1a", "#20100a"];

function icoGripWrap(g, x, y0, y1, w) {
  g.fillStyle = icoGrad(g, x - w, 0, x + w, 0, ICO_GRIP); g.fillRect(x - w, y0, w * 2, y1 - y0);
  g.strokeStyle = "rgba(255,220,160,.35)"; g.lineWidth = 1;
  for (let y = y0 + 2; y < y1; y += 3) { g.beginPath(); g.moveTo(x - w, y); g.lineTo(x + w, y + 2); g.stroke(); }
}

function icoBlade(g, c, len, w, curve, tipW) {
  const pts = [[-w, 6], [-w * 0.9 + curve * 0.4, -len * 0.6], [curve, -len], [w * 0.9 + curve * 0.4, -len * 0.6 + tipW], [w, 6]];
  icoPoly(g, pts, icoGrad(g, -w, 0, w, 0, c), c[2], 1);
  g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 1;
  g.beginPath(); g.moveTo(-w * 0.15, 4); g.quadraticCurveTo(curve * 0.3, -len * 0.5, curve * 0.85, -len + 3); g.stroke();
  g.strokeStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.moveTo(w * 0.35, 4); g.lineTo(w * 0.3 + curve * 0.4, -len * 0.55); g.stroke();
}

function icoWeapon(g, it, id) {
  const c = icoMetal(it, id), k = it.wtype, gem = it.lv >= 15 || it.rare;
  const gemC = it.lv >= 25 ? "#ff4a6a" : "#5ad0ff";
  const diag = -Math.PI / 4;
  if (k === "sword" || k === "gsword" || k === "dagger") {
    const len = k === "dagger" ? 20 : k === "gsword" ? 34 : 29, w = k === "gsword" ? 5 : k === "dagger" ? 3.4 : 3.4;
    icoRot(g, Math.PI / 4, () => {
      g.translate(0, 10);
      icoBlade(g, c, len, w, 0, 0);
      const qc = it.lv >= 8 ? ["#fff0a8", "#c8982a", "#5a4010"] : c;
      g.fillStyle = icoGrad(g, 0, -2, 0, 3, qc); g.fillRect(-9, 4, 18, 3.5);
      if (it.lv >= 8) { g.beginPath(); g.arc(-9, 5.7, 2, 0, 7); g.arc(9, 5.7, 2, 0, 7); g.fill(); }
      icoGripWrap(g, 0, 7.5, 16, 2);
      g.fillStyle = icoGrad(g, -3, 15, 3, 21, qc); g.beginPath(); g.arc(0, 18, 3, 0, 7); g.fill();
      if (gem) { g.fillStyle = gemC; g.beginPath(); g.arc(0, 5.7, 1.6, 0, 7); g.fill(); }
    });
  } else if (k === "katana" || k === "gkatana") {
    const len = k === "gkatana" ? 34 : 29;
    icoRot(g, Math.PI / 4, () => {
      g.translate(0, 9);
      icoBlade(g, c, len, 2.4, 4, 2);
      g.fillStyle = "#2a2018"; g.beginPath(); g.ellipse(0, 6, 5.5, 2, 0, 0, 7); g.fill();
      g.strokeStyle = "#c8a040"; g.lineWidth = 0.8; g.stroke();
      g.fillStyle = "#1a1418"; g.fillRect(-2, 7.5, 4, 11);
      g.strokeStyle = "#e8e0d0"; g.lineWidth = 1; for (let y = 8.5; y < 18; y += 2.5) { g.beginPath(); g.moveTo(-2, y); g.lineTo(2, y + 1.6); g.moveTo(2, y); g.lineTo(-2, y + 1.6); g.stroke(); }
    });
  } else if (k === "axe" || k === "greataxe") {
    const big = k === "greataxe";
    icoRot(g, Math.PI / 4, () => {
      g.fillStyle = icoGrad(g, -2, 0, 2, 0, ICO_WOOD); g.fillRect(-1.8, -18, 3.6, 40);
      const hy = -14;
      const head = big ? [[1.5, hy - 6], [13, hy - 11], [15, hy], [13, hy + 11], [1.5, hy + 6]] : [[1.5, hy - 4], [11, hy - 8], [12, hy + 2], [9, hy + 9], [1.5, hy + 4]];
      icoPoly(g, head, icoGrad(g, 0, hy - 10, 14, hy + 10, c), c[2], 1);
      if (big) icoPoly(g, head.map(([x, y]) => [-x, y]), icoGrad(g, 0, hy - 10, -14, hy + 10, c), c[2], 1);
      g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1; g.beginPath(); g.moveTo(big ? 14.5 : 11.5, hy - (big ? 9 : 6)); g.lineTo(big ? 14.5 : 11.6, hy + (big ? 9 : 2)); g.stroke();
      g.fillStyle = c[1]; g.fillRect(-2.6, hy - 5, 5.2, 9);
      if (gem) { g.fillStyle = gemC; g.beginPath(); g.arc(0, hy, 1.7, 0, 7); g.fill(); }
    });
  } else if (k === "club") {
    icoRot(g, Math.PI / 4, () => {
      g.fillStyle = icoGrad(g, -2, 0, 2, 0, ICO_WOOD); g.fillRect(-2, -10, 4, 32);
      icoGripWrap(g, 0, 12, 21, 2.3);
      g.fillStyle = icoGrad(g, -8, -22, 8, -6, c); g.beginPath(); g.ellipse(0, -14, 7, 9, 0, 0, 7); g.fill();
      g.strokeStyle = c[2]; g.stroke();
      g.fillStyle = c[0];
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; icoPoly(g, [[Math.cos(a) * 6, -14 + Math.sin(a) * 8], [Math.cos(a) * 10.5, -14 + Math.sin(a) * 11], [Math.cos(a + 0.35) * 6, -14 + Math.sin(a + 0.35) * 8]], c[1], c[2], 0.6); }
    });
  } else if (k === "staff") {
    const orb = it.lv >= 15 ? "#b388ff" : it.lv >= 8 ? "#5ad0ff" : "#c8e870";
    icoRot(g, Math.PI / 4, () => {
      g.fillStyle = icoGrad(g, -2, 0, 2, 0, ICO_WOOD); g.fillRect(-1.6, -14, 3.2, 38);
      g.strokeStyle = "#3a2010"; g.lineWidth = 1; for (const y of [-2, 8, 18]) { g.beginPath(); g.moveTo(-1.6, y); g.lineTo(1.6, y + 1); g.stroke(); }
      g.strokeStyle = icoGrad(g, -6, -24, 6, -12, ICO_WOOD); g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, -13); g.bezierCurveTo(-8, -16, -7, -27, 0, -26); g.bezierCurveTo(7, -27, 8, -16, 0, -13); g.stroke();
      const rg = g.createRadialGradient(-1.5, -21, 0.5, 0, -20, 5); rg.addColorStop(0, "#fff"); rg.addColorStop(0.35, orb); rg.addColorStop(1, "#1a1030");
      g.fillStyle = rg; g.beginPath(); g.arc(0, -20, 4.3, 0, 7); g.fill();
    });
  } else if (k === "polearm") {
    icoRot(g, Math.PI / 4, () => {
      g.fillStyle = icoGrad(g, -2, 0, 2, 0, ICO_WOOD); g.fillRect(-1.5, -12, 3, 36);
      icoPoly(g, [[0, -27], [4.5, -16], [1.5, -11], [-1.5, -11], [-4.5, -16]], icoGrad(g, -4, 0, 4, 0, c), c[2], 1);
      g.strokeStyle = "rgba(255,255,255,.8)"; g.beginPath(); g.moveTo(0, -26); g.lineTo(0, -12); g.stroke();
      g.fillStyle = it.lv >= 8 ? "#c8382a" : c[1]; g.fillRect(-2.6, -11, 5.2, 3);
    });
  } else if (k === "scythe") {
    icoRot(g, Math.PI / 4, () => {
      g.fillStyle = icoGrad(g, -2, 0, 2, 0, ICO_WOOD); g.fillRect(-1.5, -20, 3, 44);
      icoPoly(g, [[1, -20], [-6, -24], [-15, -22], [-21, -15], [-14, -18], [-6, -18], [1, -15]], icoGrad(g, -20, -24, 0, -14, c), c[2], 1);
      g.strokeStyle = "rgba(255,255,255,.75)"; g.beginPath(); g.moveTo(-20, -15.5); g.quadraticCurveTo(-12, -19, 0, -15.5); g.stroke();
    });
  } else if (k === "archery") {
    icoRot(g, Math.PI / 4, () => {
      g.strokeStyle = icoGrad(g, -10, -20, 10, 20, ICO_WOOD); g.lineWidth = 3;
      g.beginPath(); g.moveTo(0, -20); g.quadraticCurveTo(-16, 0, 0, 20); g.stroke();
      g.strokeStyle = "#f0ece0"; g.lineWidth = 0.8; g.beginPath(); g.moveTo(0, -20); g.lineTo(0, 20); g.stroke();
      g.fillStyle = "#4a2a1a"; g.fillRect(-9.5, -3, 3.5, 6);
      g.strokeStyle = "#8a6a4a"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-14, 0); g.lineTo(10, 0); g.stroke();
      icoPoly(g, [[12, 0], [8, -2.2], [8, 2.2]], c[1], c[2], 0.6);
    });
  } else return false;
  return true;
}

function icoArmour(g, it, id) {
  const n = (it.name || "").toLowerCase(), sl = it.slot, c = icoMetal(it, id);
  const cloth = /robe|tunic|vest|shirt|coat|cloak|jerkin|garb|gi|doublet|harness|leather|hat|cap|hood|circlet|band|gloves|mitts|bracers|slops|trousers|pants|boots|shoes|sandals|cape|mantle|sash|belt|rope/.test(n) && !/mail|plate|scale|chain|helm|gauntlet|greaves|sollerets|breastplate/.test(n);
  const leather = /leather|hide|lizard|harness|jerkin|boots|bracers|belt/.test(n);
  const clothC = /white|cure|healer|priest|holy/.test(n) ? ["#ffffff", "#d8d4c8", "#7a7468"] : /black|dark|shadow|night/.test(n) ? ["#7a6a9a", "#3a2a5a", "#140c22"] : /red|ember|fire|blood|crimson/.test(n) ? ["#ff8a7a", "#b02a22", "#4a0a08"] : /green|wood|ranger|hunter|scout/.test(n) ? ["#a8d888", "#4a7a2a", "#1a3008"] : /blue|frost|sea|tide|mage|wizard/.test(n) ? ["#9ac8ff", "#2a5aa8", "#0a1a40"] : ["#e8d0a0", "#a07a48", "#4a3018"];
  const fab = leather ? ["#c8946a", "#7a4a28", "#341a0a"] : cloth ? clothC : c;
  if (sl === "head") {
    if (/hat/.test(n)) { g.fillStyle = icoGrad(g, 0, 18, 0, 34, fab); g.beginPath(); g.ellipse(24, 30, 19, 6, 0, 0, 7); g.fill(); icoPoly(g, [[13, 30], [18, 10], [30, 6], [35, 30]], icoGrad(g, 12, 0, 36, 0, fab), fab[2]); }
    else if (/hood|cowl/.test(n)) { icoPoly(g, [[10, 38], [11, 18], [24, 6], [37, 18], [38, 38], [31, 38], [30, 22], [18, 22], [17, 38]], icoGrad(g, 10, 6, 38, 38, fab), fab[2]); g.fillStyle = "#0a0810"; g.beginPath(); g.ellipse(24, 28, 6.5, 8, 0, 0, 7); g.fill(); }
    else if (/circlet|band|crown|tiara/.test(n)) { g.strokeStyle = icoGrad(g, 8, 18, 40, 30, ["#fff0a8", "#d8a83a", "#7a5a18"]); g.lineWidth = 4; g.beginPath(); g.ellipse(24, 26, 15, 7, 0, 0, 7); g.stroke(); g.fillStyle = "#5ad0ff"; g.beginPath(); g.arc(24, 33, 3, 0, 7); g.fill(); }
    else if (cloth || /cap|bandana/.test(n)) { g.fillStyle = icoGrad(g, 8, 10, 40, 34, fab); g.beginPath(); g.arc(24, 28, 15, Math.PI, 0); g.fill(); g.fillRect(9, 27, 30, 5); g.strokeStyle = fab[2]; g.lineWidth = 1; g.strokeRect(9, 27, 30, 5); }
    else { g.fillStyle = icoGrad(g, 8, 8, 40, 40, c); g.beginPath(); g.arc(24, 24, 15, Math.PI * 1.02, -0.02); g.lineTo(39, 36); g.lineTo(31, 38); g.lineTo(30, 28); g.lineTo(18, 28); g.lineTo(17, 38); g.lineTo(9, 36); g.closePath(); g.fill(); g.strokeStyle = c[2]; g.stroke(); g.fillStyle = "#0a0a10"; g.fillRect(17, 26, 14, 3); g.fillStyle = c[0]; g.fillRect(23, 9, 2, 20); if (/horn/.test(n)) { icoPoly(g, [[10, 18], [3, 6], [12, 13]], "#f0e6cc", "#6a604a"); icoPoly(g, [[38, 18], [45, 6], [36, 13]], "#f0e6cc", "#6a604a"); } }
  } else if (sl === "body") {
    const robe = /robe|gown|cloak|coat/.test(n);
    const pts = robe ? [[12, 9], [19, 7], [24, 11], [29, 7], [36, 9], [42, 22], [37, 25], [36, 42], [12, 42], [11, 25], [6, 22]] : [[12, 9], [19, 7], [24, 11], [29, 7], [36, 9], [43, 20], [37, 24], [35, 38], [13, 38], [11, 24], [5, 20]];
    icoPoly(g, pts, icoGrad(g, 8, 6, 40, 40, fab), fab[2], 1);
    if (!cloth && !leather) { g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1; g.beginPath(); g.moveTo(24, 12); g.lineTo(24, 36); g.stroke(); g.strokeStyle = fab[2]; for (const y of [26, 31]) { g.beginPath(); g.moveTo(14, y); g.lineTo(34, y); g.stroke(); } if (/mail|chain|scale/.test(n)) { g.fillStyle = "rgba(0,0,0,.25)"; for (let y = 14; y < 36; y += 3) for (let x = 14 + (y % 2) * 1.5; x < 34; x += 3) g.fillRect(x, y, 1.2, 1.2); } }
    else { g.strokeStyle = fab[2]; g.lineWidth = 1; g.beginPath(); g.moveTo(24, 11); g.lineTo(24, robe ? 42 : 38); g.stroke(); g.fillStyle = /mage|priest|holy|wizard/.test(n) ? "#e8c050" : fab[2]; g.fillRect(13, 27, 22, 2.5); }
  } else if (sl === "hands") {
    icoPoly(g, [[14, 40], [13, 24], [11, 16], [14, 14], [17, 22], [17, 10], [21, 9], [22, 20], [23, 8], [27, 8], [27, 20], [29, 10], [33, 11], [32, 24], [36, 18], [39, 20], [34, 32], [34, 40]], icoGrad(g, 10, 8, 38, 40, fab), fab[2], 1);
    g.fillStyle = cloth || leather ? fab[2] : c[0]; g.fillRect(13, 34, 22, 4);
  } else if (sl === "legs") {
    icoPoly(g, [[13, 8], [35, 8], [36, 40], [27, 40], [24, 20], [21, 40], [12, 40]], icoGrad(g, 10, 8, 38, 40, fab), fab[2], 1);
    if (!cloth && !leather) { g.fillStyle = c[0]; g.beginPath(); g.ellipse(17, 26, 3.2, 2.6, 0, 0, 7); g.ellipse(31, 26, 3.2, 2.6, 0, 0, 7); g.fill(); }
    g.fillStyle = fab[2]; g.fillRect(13, 8, 22, 3);
  } else if (sl === "feet") {
    icoPoly(g, [[10, 10], [22, 10], [22, 30], [36, 32], [40, 38], [38, 41], [10, 41]], icoGrad(g, 8, 10, 40, 41, fab), fab[2], 1);
    g.fillStyle = "#2a1a10"; g.fillRect(10, 39, 29, 2.5);
    g.fillStyle = cloth || leather ? fab[2] : c[0]; g.fillRect(10, 10, 12, 3);
  } else if (sl === "neck") {
    g.strokeStyle = "#d8b850"; g.lineWidth = 1.5; g.beginPath(); g.ellipse(24, 18, 13, 11, 0, 0.15, Math.PI - 0.15); g.stroke();
    g.beginPath(); g.ellipse(24, 18, 13, 11, 0, Math.PI + 0.3, -0.3); g.setLineDash([2, 1.5]); g.stroke(); g.setLineDash([]);
    const gc = it.lv >= 15 ? "#ff4a6a" : "#5ad0ff"; const rg = g.createRadialGradient(22, 32, 0.5, 24, 33, 6); rg.addColorStop(0, "#fff"); rg.addColorStop(0.4, gc); rg.addColorStop(1, "#102030");
    g.fillStyle = "#d8b850"; g.beginPath(); g.arc(24, 33, 6.5, 0, 7); g.fill(); g.fillStyle = rg; g.beginPath(); g.arc(24, 33, 4.8, 0, 7); g.fill();
  } else if (sl === "ring" || sl === "ear") {
    const gc = /fire|ember|ruby|blood/.test(n) ? "#ff4a3a" : /frost|ice|sapphire|sea|tide/.test(n) ? "#4ab0ff" : /wind|emerald|forest/.test(n) ? "#5ad870" : /dark|night|shadow/.test(n) ? "#a070ff" : it.lv >= 15 ? "#ff4a9a" : "#ffd84a";
    if (sl === "ring") { g.strokeStyle = icoGrad(g, 12, 18, 36, 40, ["#fff0a8", "#d8a83a", "#7a5a18"]); g.lineWidth = 4.5; g.beginPath(); g.ellipse(24, 30, 11, 8, 0, 0, 7); g.stroke(); const rg = g.createRadialGradient(22, 17, 0.5, 24, 19, 6); rg.addColorStop(0, "#fff"); rg.addColorStop(0.45, gc); rg.addColorStop(1, "#101018"); g.fillStyle = rg; icoPoly(g, [[24, 12], [30, 18], [24, 25], [18, 18]], rg, "#7a5a18"); }
    else { g.strokeStyle = "#d8b850"; g.lineWidth = 2; g.beginPath(); g.arc(24, 15, 6, Math.PI * 0.9, Math.PI * 2.1); g.stroke(); g.beginPath(); g.moveTo(24, 21); g.lineTo(24, 26); g.stroke(); const rg = g.createRadialGradient(22, 31, 0.5, 24, 32, 6); rg.addColorStop(0, "#fff"); rg.addColorStop(0.45, gc); rg.addColorStop(1, "#101018"); icoPoly(g, [[24, 26], [30, 32], [24, 41], [18, 32]], rg, "#7a5a18"); }
  } else if (sl === "back") {
    icoPoly(g, [[16, 8], [32, 8], [38, 40], [31, 37], [24, 41], [17, 37], [10, 40]], icoGrad(g, 10, 8, 38, 40, clothC), clothC[2], 1);
    g.fillStyle = "#d8b850"; g.beginPath(); g.arc(18, 10, 2.5, 0, 7); g.arc(30, 10, 2.5, 0, 7); g.fill();
  } else if (sl === "waist") {
    g.fillStyle = icoGrad(g, 0, 18, 0, 30, leather || !cloth ? ["#c8946a", "#7a4a28", "#341a0a"] : clothC); g.fillRect(4, 19, 40, 10);
    g.strokeStyle = "#1a0e06"; g.strokeRect(4, 19, 40, 10);
    g.strokeStyle = icoGrad(g, 17, 16, 31, 32, ["#fff0a8", "#d8a83a", "#7a5a18"]); g.lineWidth = 2.5; g.strokeRect(18, 16.5, 12, 15);
  } else if (sl === "sub") {
    icoPoly(g, [[10, 8], [38, 8], [38, 22], [24, 41], [10, 22]], icoGrad(g, 10, 8, 38, 41, c), c[2], 1.5);
    g.fillStyle = it.lv >= 8 ? "#a02a22" : c[2]; icoPoly(g, [[15, 12], [33, 12], [33, 21], [24, 34], [15, 21]], g.fillStyle);
    g.fillStyle = "#d8b850"; g.fillRect(22.5, 12, 3, 22); g.fillRect(15, 18, 18, 3);
  } else if (sl === "ammo") {
    for (let k = 0; k < 3; k++) icoRot(g, Math.PI / 4 + (k - 1) * 0.18, () => { g.strokeStyle = "#a07a4a"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, 18); g.lineTo(0, -16); g.stroke(); icoPoly(g, [[0, -21], [2.8, -15], [-2.8, -15]], c[1], c[2], 0.6); icoPoly(g, [[0, 12], [3.5, 19], [0, 17], [-3.5, 19]], "#e8e0d0", "#7a7468", 0.5); });
  } else if (sl === "ranged") return icoWeapon(g, Object.assign({}, it, { wtype: "archery" }), id);
  else return false;
  return true;
}

function icoConsumable(g, it, id) {
  const n = (it.name || "").toLowerCase();
  if (it.spell) {
    const sp = typeof SPELLS !== "undefined" ? SPELLS[it.spell] : null, ec = sp && ELEMENT_COLORS[sp.element] || (sp && sp.kind === "heal" ? "#fff59d" : "#9fe8ff");
    g.fillStyle = icoGrad(g, 8, 10, 40, 38, ["#fff6dc", "#e8d4a0", "#8a7448"]); g.fillRect(11, 12, 26, 24);
    for (const x of [11, 37]) { g.fillStyle = icoGrad(g, x - 4, 0, x + 4, 0, ["#e8d4a0", "#c8b078", "#6a5430"]); g.beginPath(); g.ellipse(x, 24, 4, 13, 0, 0, 7); g.fill(); g.strokeStyle = "#5a4428"; g.stroke(); }
    g.strokeStyle = "rgba(90,60,30,.6)"; g.lineWidth = 1; for (const y of [18, 22, 26, 30]) { g.beginPath(); g.moveTo(16, y); g.lineTo(32, y); g.stroke(); }
    g.fillStyle = ec; g.fillRect(21, 10, 6, 28); g.strokeStyle = "rgba(0,0,0,.4)"; g.strokeRect(21, 10, 6, 28);
    return true;
  }
  if (it.kind === "crystal" || /essence|crystal/.test(n)) {
    const ec = ELEMENT_COLORS[it.element] || "#d0f0ff";
    const pts = [[24, 4], [34, 16], [31, 40], [17, 40], [14, 16]];
    const gr = g.createLinearGradient(14, 4, 34, 40); gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.35, ec); gr.addColorStop(1, "#101828");
    icoPoly(g, pts, gr, "rgba(255,255,255,.7)", 1);
    g.strokeStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.moveTo(24, 4); g.lineTo(22, 40); g.moveTo(14, 16); g.lineTo(26, 20); g.lineTo(34, 16); g.stroke();
    return true;
  }
  if (/potion|ether|tonic|elixir|oil|draught/.test(n)) {
    const lc = /ether/.test(n) ? "#3a8aff" : /tonic|moon/.test(n) ? "#b388ff" : /oil/.test(n) ? "#a8c040" : "#ff4a6a";
    const big = /hi-|\+1|elixir/.test(n);
    g.fillStyle = "rgba(220,240,255,.35)"; g.beginPath(); g.arc(24, 29, big ? 12 : 10.5, 0, 7); g.fill();
    g.fillRect(20, 8, 8, 12);
    const rg = g.createRadialGradient(20, 26, 1, 24, 30, 11); rg.addColorStop(0, "#fff"); rg.addColorStop(0.3, lc); rg.addColorStop(1, "#200818");
    g.fillStyle = rg; g.beginPath(); g.arc(24, 30, big ? 10.5 : 9, 0.2 * Math.PI, 0.8 * Math.PI + Math.PI * 2 * 0.6); g.fill();
    g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1.2; g.beginPath(); g.arc(24, 29, big ? 12 : 10.5, 0, 7); g.stroke(); g.strokeRect(20, 8, 8, 11);
    g.fillStyle = "#8a5a30"; g.fillRect(19.5, 5, 9, 5);
    if (big) { g.fillStyle = "#d8b850"; g.fillRect(19, 18, 10, 2); }
    return true;
  }
  if (it.kind === "key" || /key/.test(n)) {
    g.strokeStyle = icoGrad(g, 8, 8, 40, 40, ["#fff0a8", "#c8982a", "#5a4010"]); g.lineWidth = 3.5;
    g.beginPath(); g.arc(15, 15, 7, 0, 7); g.moveTo(20, 20); g.lineTo(38, 38); g.moveTo(33, 33); g.lineTo(29, 37); g.moveTo(37, 37); g.lineTo(33, 41); g.stroke();
    return true;
  }
  return false;
}

function icoMaterial(g, it, id) {
  const n = (it.name || "").toLowerCase();
  if (/ore\b|ore$|stone|salt/.test(n)) {
    const c = /copper/.test(n) ? ["#f0a070", "#9a5a30"] : /iron/.test(n) ? ["#a0a8b0", "#3a3e44"] : /salt/.test(n) ? ["#ffffff", "#c8c8d0"] : ["#c8b8a0", "#5a5048"];
    icoPoly(g, [[10, 30], [14, 16], [24, 10], [35, 14], [39, 28], [31, 38], [16, 38]], icoGrad(g, 10, 10, 38, 38, [c[0], c[1], "#1a1410"]), "#1a1410", 1);
    g.fillStyle = c[0]; for (const [x, y] of [[18, 20], [27, 17], [30, 28], [20, 30], [24, 24]]) g.fillRect(x, y, 2.5, 2.5);
    return true;
  }
  if (/ingot|bar\b/.test(n)) {
    const c = icoMetal(it, id);
    icoPoly(g, [[8, 30], [14, 20], [40, 20], [40, 30], [34, 38], [8, 38]], icoGrad(g, 8, 20, 40, 38, c), c[2], 1);
    icoPoly(g, [[8, 30], [14, 20], [40, 20], [34, 30]], c[0], c[2], 0.8);
    return true;
  }
  if (/log|lumber|heartwood|wood|sapling/.test(n)) {
    g.fillStyle = icoGrad(g, 0, 14, 0, 34, ICO_WOOD); g.fillRect(8, 15, 28, 18);
    g.fillStyle = "#e8c890"; g.beginPath(); g.ellipse(36, 24, 5, 9, 0, 0, 7); g.fill();
    g.strokeStyle = "#8a5a30"; g.lineWidth = 1; g.beginPath(); g.ellipse(36, 24, 2.5, 5, 0, 0, 7); g.stroke();
    if (/lumber/.test(n)) { g.fillStyle = "#c8a070"; g.fillRect(8, 15, 28, 3); }
    return true;
  }
  if (/herb|leaf|reed|grass|flour/.test(n)) {
    const c = /flour/.test(n) ? ["#fffaf0", "#e8dcc0", "#8a7a5a"] : /reed/.test(n) ? ["#d8d070", "#8a8a30", "#3a3a10"] : ["#a8e870", "#3a8a2a", "#0a300a"];
    for (const [a, l] of [[-0.5, 18], [0, 22], [0.5, 18]]) icoRot(g, a, () => { g.fillStyle = icoGrad(g, -6, 0, 6, 0, c); g.beginPath(); g.ellipse(0, -l * 0.45 + 8, 5.5, l * 0.6, 0, 0, 7); g.fill(); g.strokeStyle = c[2]; g.lineWidth = 0.8; g.beginPath(); g.moveTo(0, 18); g.lineTo(0, -l + 10); g.stroke(); });
    return true;
  }
  if (/cloth|silk|cocoon|wool/.test(n)) {
    const c = /silk|cocoon/.test(n) ? ["#ffffff", "#e0d8f0", "#7a7090"] : /wool/.test(n) ? ["#fffaf0", "#e0d4c0", "#8a7a6a"] : ["#c8d8f0", "#6a7aa8", "#2a3050"];
    icoPoly(g, [[8, 16], [36, 12], [40, 30], [12, 36]], icoGrad(g, 8, 12, 40, 36, c), c[2], 1);
    icoPoly(g, [[8, 16], [36, 12], [34, 18], [10, 22]], c[0], c[2], 0.6);
    return true;
  }
  if (/fish|minnow|carp|shad|pike|eel|perch|bream|bass|tuna|koi|glowfin/.test(n)) {
    const c = /eel/.test(n) ? ["#8a8a5a", "#4a4a2a", "#1a1a0a"] : /koi|glow/.test(n) ? ["#ffffff", "#ffb070", "#8a3a10"] : /tuna|bass|bream/.test(n) ? ["#d8e8f8", "#5a7a9a", "#1a2a3a"] : ["#d8e0d0", "#7a8a7a", "#2a3a2a"];
    if (/eel/.test(n)) { g.strokeStyle = icoGrad(g, 6, 20, 42, 30, c); g.lineWidth = 6; g.lineCap = "round"; g.beginPath(); g.moveTo(8, 30); g.bezierCurveTo(16, 14, 26, 38, 40, 20); g.stroke(); g.lineCap = "butt"; g.fillStyle = "#111"; g.fillRect(37, 19, 1.8, 1.8); return true; }
    g.fillStyle = icoGrad(g, 0, 16, 0, 34, c); g.beginPath(); g.ellipse(22, 24, 14, 8, 0, 0, 7); g.fill();
    icoPoly(g, [[34, 24], [43, 16], [41, 24], [43, 32]], c[1], c[2], 0.8);
    g.strokeStyle = c[2]; g.lineWidth = 0.8; g.beginPath(); g.ellipse(22, 24, 14, 8, 0, 0, 7); g.stroke();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(13, 22, 2.3, 0, 7); g.fill(); g.fillStyle = "#111"; g.beginPath(); g.arc(13, 22, 1.2, 0, 7); g.fill();
    return true;
  }
  if (/bone|tooth|fang|needle|dust/.test(n)) {
    if (/tooth|fang|needle/.test(n)) { icoPoly(g, [[18, 10], [30, 10], [27, 26], [24, 40], [21, 26]], icoGrad(g, 16, 10, 32, 40, ["#ffffff", "#e8dcc0", "#7a6a4a"]), "#5a4a30"); return true; }
    if (/dust/.test(n)) { g.fillStyle = "#8a7a6a"; g.beginPath(); g.ellipse(24, 34, 15, 6, 0, 0, 7); g.fill(); g.fillStyle = "#c8b8a0"; for (let k = 0; k < 18; k++) g.fillRect(12 + (k * 7) % 24, 30 + (k * 3) % 6, 1.5, 1.5); return true; }
    icoRot(g, Math.PI / 4, () => { g.fillStyle = icoGrad(g, -4, 0, 4, 0, ["#ffffff", "#e8dcc0", "#8a7a5a"]); g.fillRect(-3, -14, 6, 28); for (const y of [-15, 15]) { g.beginPath(); g.arc(-3.5, y, 4, 0, 7); g.arc(3.5, y, 4, 0, 7); g.fill(); } });
    return true;
  }
  if (/feather|plume|wing/.test(n)) {
    const c = /ember/.test(n) ? ["#fff0a0", "#ff7030", "#7a1a08"] : /bat|wing/.test(n) ? ["#8a7a9a", "#3a2a4a", "#100818"] : ["#ffffff", "#c8b090", "#5a4028"];
    icoRot(g, Math.PI / 5, () => { g.fillStyle = icoGrad(g, -8, 0, 8, 0, c); g.beginPath(); g.moveTo(0, -20); g.bezierCurveTo(10, -10, 8, 10, 0, 16); g.bezierCurveTo(-8, 10, -10, -10, 0, -20); g.fill(); g.strokeStyle = c[2]; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -18); g.lineTo(0, 21); g.stroke(); });
    return true;
  }
  if (/shell|scale/.test(n)) {
    const c = /crab/.test(n) ? ["#ffb080", "#d0502a", "#5a1a08"] : ["#c8f0e8", "#3a9a8a", "#0a3a34"];
    g.fillStyle = icoGrad(g, 10, 10, 38, 38, c); g.beginPath(); g.moveTo(24, 38); g.arc(24, 24, 15, Math.PI * 0.85, Math.PI * 2.15); g.closePath(); g.fill();
    g.strokeStyle = c[2]; g.lineWidth = 1; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(24, 38); g.lineTo(24 + k * 6, 11 + Math.abs(k) * 2); g.stroke(); }
    return true;
  }
  if (/hide|skin|pouch|leather/.test(n)) {
    const c = /lizard/.test(n) ? ["#a8c870", "#5a7a2a", "#1a2a08"] : ["#d8a470", "#8a5a30", "#3a2010"];
    icoPoly(g, [[10, 12], [20, 8], [30, 11], [40, 9], [38, 22], [42, 34], [30, 38], [20, 40], [8, 36], [12, 24]], icoGrad(g, 8, 8, 40, 40, c), c[2], 1);
    if (/lizard/.test(n)) { g.fillStyle = "rgba(0,0,0,.25)"; for (let y = 14; y < 36; y += 4) for (let x = 14 + (y % 8) / 2; x < 36; x += 4) g.fillRect(x, y, 2, 2); }
    return true;
  }
  return false;
}

function icoEmoji(g, it) {
  g.font = "28px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(it.emoji || it.icon || "📦", 24, 26);
}

function icoFrame(g, id) {
  const r = typeof itemRarity === "function" ? itemRarity(id) : "common";
  const col = { uncommon: "rgba(90,220,120,.9)", rare: "rgba(90,170,255,.95)", epic: "rgba(200,110,255,.95)" }[r];
  if (!col) return;
  g.strokeStyle = col; g.lineWidth = 2; g.strokeRect(2, 2, 44, 44);
  g.fillStyle = col; for (const [x, y] of [[2, 2], [42, 2], [2, 42], [42, 42]]) g.fillRect(x, y, 4, 4);
}

function* itemIconSteps() {
  if (ICONS.url || typeof ITEMS === "undefined") return;
  const ids = Object.keys(ITEMS), C = ICONS.cell, cols = ICONS.cols, rows = Math.ceil(ids.length / cols);
  const cv = document.createElement("canvas"); cv.width = cols * C; cv.height = rows * C;
  const g0 = cv.getContext("2d");
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i], it = ITEMS[id];
    if (it.emoji == null) it.emoji = it.icon || "📦";
    const x = (i % cols) * C, y = Math.floor(i / cols) * C;
    g0.save(); g0.translate(x, y); g0.beginPath(); g0.rect(0, 0, C, C); g0.clip();
    g0.shadowColor = "rgba(0,0,0,.6)"; g0.shadowBlur = 2; g0.shadowOffsetX = 1; g0.shadowOffsetY = 1;
    let ok = false;
    try { ok = it.kind === "equip" ? (it.slot === "main" ? icoWeapon(g0, it, id) : icoArmour(g0, it, id)) : icoConsumable(g0, it, id) || (it.kind === "mat" && icoMaterial(g0, it, id)); } catch (e) { ok = false; }
    g0.shadowColor = "transparent";
    if (!ok) { g0.restore(); g0.save(); g0.translate(x, y); g0.beginPath(); g0.rect(0, 0, C, C); g0.clip(); icoEmoji(g0, it); }
    icoFrame(g0, id);
    g0.restore();
    ICONS.map[id] = [i % cols, Math.floor(i / cols), ok];
    if (i % 12 === 11) yield;
  }
  cacheStoreCanvas(iconKey(ids), cv, "image/png", 1, { cols, rows, map: ICONS.map });
  applyIconAtlas(cv.toDataURL("image/png"), cols, rows, ids);
}

function iconKey(ids) { return "i|" + ids.length + "|" + ids[0] + "|" + ids[ids.length - 1]; }

function applyIconAtlas(url, cols, rows, ids) {
  ICONS.cols = cols; ICONS.rows = rows;
  ICONS.url = url;
  const st = document.createElement("style");
  st.textContent = ".iico{display:inline-block;width:1.45em;height:1.45em;vertical-align:-.36em;background-image:url(" + ICONS.url + ");background-size:" + (cols * 1.45) + "em " + (rows * 1.45) + "em;background-repeat:no-repeat;image-rendering:auto}";
  document.head.appendChild(st);
  for (const id of ids) { const [cx, cy] = ICONS.map[id]; ITEMS[id].icon = '<i class="iico" style="background-position:-' + (cx * 1.45).toFixed(2) + "em -" + (cy * 1.45).toFixed(2) + 'em"></i>'; }
}

async function iconsFromCache() {
  if (ICONS.url || typeof ITEMS === "undefined") return false;
  const ids = Object.keys(ITEMS), rec = await cacheGet(iconKey(ids));
  const m = rec && rec.meta;
  if (!m || !m.map || ids.some(id => !m.map[id])) return false;
  for (const id of ids) { const it = ITEMS[id]; if (it.emoji == null) it.emoji = it.icon || "📦"; }
  ICONS.map = m.map;
  applyIconAtlas(URL.createObjectURL(rec.blob), m.cols, m.rows, ids);
  return true;
}

function buildItemIcons() {
  for (const _ of itemIconSteps()) {}
}

function buildItemIconsAsync() {
  if (ICONS.job) return ICONS.job;
  ICONS.job = new Promise(async res => {
    let hit = false;
    try { hit = await iconsFromCache(); } catch (e) {}
    if (hit) { PERF.mark("icons (cache)"); res(); return; }
    const gen = itemIconSteps();
    const tick = () => {
      const t = performance.now();
      let r;
      try { while (!(r = gen.next()).done) { if (performance.now() - t > 10) break; } } catch (e) { reportError(e, "icons"); res(); return; }
      if (r.done) { PERF.mark("icons"); res(); } else setTimeout(tick, 3);
    };
    setTimeout(tick, 0);
  });
  return ICONS.job;
}
function iconsReady() { return ICONS.job || Promise.resolve(); }
